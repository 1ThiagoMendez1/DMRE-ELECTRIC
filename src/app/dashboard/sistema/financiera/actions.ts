"use server";

import { createClient } from "@/utils/supabase/server";
import { Factura, Cotizacion, Cliente } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any, cotizacionRaw?: any): Factura {
    let cotizacion: Cotizacion;

    if (cotizacionRaw) {
        // Supabase returns nested relation as 'clientes' property
        const clienteRaw = cotizacionRaw.clientes;
        const cliente = clienteRaw ? {
            id: clienteRaw.id,
            nombre: clienteRaw.nombre || "Cliente Sin Nombre",
            documento: clienteRaw.documento || "",
            telefono: clienteRaw.telefono || "",
            // Add other fields as defaults if needed to satisfy types
        } as Cliente : { nombre: "Cliente Desconocido" } as unknown as Cliente;

        cotizacion = {
            ...cotizacionRaw,
            fecha: new Date(cotizacionRaw.created_at || new Date()),
            cliente: cliente,
            items: [], // Default
        } as unknown as Cotizacion;
    } else {
        cotizacion = {
            numero: "SIN-REF",
            cliente: { nombre: "Sin Cotización Vinculada" } as any,
            items: [],
        } as unknown as Cotizacion;
    }

    return {
        id: db.id,
        cotizacionId: db.cotizacion_id,
        cotizacion: cotizacion,
        fechaEmision: new Date(db.fecha_emision),
        fechaVencimiento: new Date(db.fecha_vencimiento || db.fecha_emision),
        valorFacturado: Number(db.valor_total) || 0,
        anticipoRecibido: Number(db.anticipo_recibido) || 0,
        retencionRenta: Number(db.retencion_fuente) || 0,
        retencionIca: Number(db.retencion_ica) || 0,
        retencionIva: Number(db.retencion_iva) || 0,
        saldoPendiente: Number(db.saldo_pendiente) || 0,
        estado: db.estado || "PENDIENTE",
        // Extended
        numero: db.numero,
        trabajoId: db.trabajo_id,
        clienteId: db.cliente_id,
        subtotal: Number(db.subtotal) || 0,
        iva: Number(db.iva) || 0,
        valorPagado: Number(db.valor_pagado) || 0,
        observaciones: db.observaciones,
    };
}

function mapToDB(ui: Partial<Factura>) {
    return {
        numero: ui.numero,
        cotizacion_id: ui.cotizacionId,
        trabajo_id: ui.trabajoId,
        cliente_id: ui.clienteId,
        fecha_emision: ui.fechaEmision,
        fecha_vencimiento: ui.fechaVencimiento,
        subtotal: ui.subtotal,
        iva: ui.iva,
        valor_total: ui.valorFacturado,
        anticipo_recibido: ui.anticipoRecibido,
        retencion_fuente: ui.retencionRenta,
        retencion_ica: ui.retencionIca,
        retencion_iva: ui.retencionIva,
        valor_pagado: ui.valorPagado,
        saldo_pendiente: ui.saldoPendiente,
        estado: ui.estado,
        observaciones: ui.observaciones,
    };
}

async function getNextNumero(supabase: any) {
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;

    const { data } = await supabase
        .from("facturas")
        .select("numero")
        .ilike("numero", `${prefix}%`)
        .order("numero", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].numero) {
        const parts = data[0].numero.split("-");
        if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
    }
    return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

export async function getFacturasAction(): Promise<Factura[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("facturas")
        .select(`
            *,
            cotizaciones (
                id, numero, total, estado, created_at,
                clientes (id, nombre, documento, telefono, direccion)
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching facturas:", error);
        throw new Error("Failed to fetch facturas");
    }

    return data.map((f: any) => mapToUI(f, f.cotizaciones));
}

export async function createFacturaAction(factura: Omit<Factura, "id">): Promise<Factura> {
    const supabase = await createClient();

    if (!factura.numero) {
        factura.numero = await getNextNumero(supabase);
    }

    const dbData = mapToDB(factura);
    const { data, error } = await supabase
        .from("facturas")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating factura:", error);
        throw new Error("Failed to create factura");
    }

    // Update Cotizacion Status
    if (factura.cotizacionId) {
        await supabase
            .from("cotizaciones")
            .update({ estado: "FINALIZADA" })
            .eq("id", factura.cotizacionId);
    }

    revalidatePath("/dashboard/sistema/financiera");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data);
}

export async function updateFacturaAction(id: string, factura: Partial<Factura>): Promise<Factura> {
    const supabase = await createClient();
    const dbData = mapToDB(factura);

    const { data, error } = await supabase
        .from("facturas")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating factura:", error);
        throw new Error("Failed to update factura");
    }

    revalidatePath("/dashboard/sistema/financiera");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data);
}

export async function deleteFacturaAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("facturas")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting factura:", error);
        throw new Error("Failed to delete factura");
    }

    revalidatePath("/dashboard/sistema/financiera");
    revalidatePath("/dashboard/sistema/comercial");
    return true;
}

// === NEW PAYMENT ACTION ===
export async function registrarPagoFacturaAction(
    facturaId: string,
    monto: number,
    fecha: Date,
    cuentaId: string,
    concepto: string
): Promise<Factura> {
    const supabase = await createClient();

    // 1. Get current Invoice
    const { data: facturaRef, error: fError } = await supabase
        .from("facturas")
        .select("valor_total, valor_pagado, saldo_pendiente, numero")
        .eq("id", facturaId)
        .single();

    if (fError || !facturaRef) throw new Error("Factura no encontrada");

    // 2. Calculate new values
    const nuevoPago = (Number(facturaRef.valor_pagado) || 0) + monto;
    const nuevoSaldo = (Number(facturaRef.valor_total) || 0) - nuevoPago;
    const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADA' : 'PARCIAL';

    // 3. Create Financial Movement (INGRESO)
    const { error: movError } = await supabase
        .from("movimientos_financieros")
        .insert({
            tipo: 'INGRESO',
            categoria: 'VENTAS',
            concepto: `Pago Factura ${facturaRef.numero}`,
            descripcion: concepto || `Abono a factura ${facturaRef.numero}`,
            valor: monto,
            fecha: fecha,
            cuenta_id: cuentaId,
            factura_id: facturaId
        });

    if (movError) throw new Error("Error creando movimiento financiero: " + movError.message);

    // 4. Update Bank Account Balance (Trigger on movimientos handles this usually, but let's be safe via RPC or Trigger)
    // Assuming 'update_cuenta_saldo' RPC exists from previous migrations or triggers are set.
    await supabase.rpc("update_cuenta_saldo", {
        cuenta_uuid: cuentaId,
        delta_valor: monto
    });

    // 5. Update Invoice
    const { data: updatedFactura, error: upError } = await supabase
        .from("facturas")
        .update({
            valor_pagado: nuevoPago,
            saldo_pendiente: nuevoSaldo > 0 ? nuevoSaldo : 0,
            estado: nuevoEstado
        })
        .eq("id", facturaId)
        .select(`
            *,
            cotizaciones (
                id, numero, total, estado, created_at,
                clientes (id, nombre, documento, telefono, direccion)
            )
        `)
        .single();

    if (upError) {
        console.error("Error updating factura:", upError);
        throw new Error(`Error actualizando factura: ${upError.message}`);
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapToUI(updatedFactura, updatedFactura.cotizaciones);
}

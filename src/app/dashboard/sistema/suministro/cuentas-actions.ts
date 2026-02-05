"use server";

import { createClient } from "@/utils/supabase/server";
import { CuentaPorPagar, Proveedor } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any, proveedor?: any, pagos: any[] = []): CuentaPorPagar {
    return {
        id: db.id,
        proveedorId: db.proveedor_id,
        proveedor: proveedor ? {
            id: proveedor.id,
            nombre: proveedor.nombre,
            nit: proveedor.nit || "",
            categoria: proveedor.categoria || "MIXTO",
            datosBancarios: "",
            correo: proveedor.correo || "",
        } : {
            id: db.proveedor_id || "unknown",
            nombre: "Proveedor Desconocido",
            nit: "N/A",
            categoria: "MIXTO",
            datosBancarios: "",
            correo: ""
        } as Proveedor,
        numeroFacturaProveedor: db.numero_factura || "",
        fecha: new Date(db.fecha_factura || db.created_at),
        concepto: db.concepto || "",
        valorTotal: Number(db.valor_total) || 0,
        valorPagado: Number(db.valor_pagado) || 0,
        saldoPendiente: Number(db.saldo_pendiente) || 0,
        pagos: pagos.map(p => ({
            id: p.id,
            cuentaPorPagarId: p.cuenta_por_pagar_id,
            fecha: new Date(p.fecha),
            valor: Number(p.valor),
            metodoPago: p.metodo_pago,
            cuentaBancariaId: p.cuenta_bancaria_id,
            nota: p.nota,
            referenciaBancaria: p.referencia_bancaria
        })),
        ofertaId: db.trabajo_id,
        // Extended
        fechaVencimiento: db.fecha_vencimiento ? new Date(db.fecha_vencimiento) : undefined,
        estado: db.estado,
        observaciones: db.observaciones,
    };
}

function mapToDB(ui: Partial<CuentaPorPagar>) {
    return {
        proveedor_id: ui.proveedorId,
        numero_factura: ui.numeroFacturaProveedor,
        fecha_factura: ui.fecha,
        fecha_vencimiento: ui.fechaVencimiento,
        concepto: ui.concepto,
        trabajo_id: ui.ofertaId,
        valor_total: ui.valorTotal,
        valor_pagado: ui.valorPagado,
        estado: ui.estado || "PENDIENTE",
        observaciones: ui.observaciones,
    };
}

export async function getCuentasPorPagarAction(limit: number = 100): Promise<CuentaPorPagar[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .select(`
            *,
            proveedores (id, nombre, nit, categoria, correo),
            pagos_cxp (*)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching cuentas_por_pagar:", error);
        throw new Error("Failed to fetch cuentas_por_pagar");
    }

    return data.map((c: any) => mapToUI(c, c.proveedores, c.pagos_cxp));
}

export async function createCuentaPorPagarAction(cuenta: Omit<CuentaPorPagar, "id">): Promise<CuentaPorPagar> {
    const supabase = await createClient();
    const dbData = mapToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating cuenta_por_pagar:", error);
        throw new Error("Failed to create cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function updateCuentaPorPagarAction(id: string, cuenta: Partial<CuentaPorPagar>): Promise<CuentaPorPagar> {
    const supabase = await createClient();
    const dbData = mapToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating cuenta_por_pagar:", error);
        throw new Error("Failed to update cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function deleteCuentaPorPagarAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("cuentas_por_pagar")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting cuenta_por_pagar:", error);
        throw new Error("Failed to delete cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return true;
}

export async function payCuentaPorPagarAction(id: string, cuentaBancariaId: string, valor: number, fecha: Date, nota?: string): Promise<void> {
    const supabase = await createClient();

    // 1. Get current CXP
    const { data: cxp, error: fetchError } = await supabase.from('cuentas_por_pagar').select('*').eq('id', id).single();
    if (fetchError || !cxp) throw new Error("CXP not found");

    // 2. Update CXP
    const nuevoPago = (Number(cxp.valor_pagado) || 0) + valor;
    const nuevoSaldo = Math.max(0, (Number(cxp.valor_total) || 0) - nuevoPago);

    const { error: cxpError } = await supabase
        .from('cuentas_por_pagar')
        .update({
            valor_pagado: nuevoPago,
            estado: nuevoSaldo <= 0 ? 'PAGADA' : (nuevoPago > 0 ? 'PARCIAL' : 'PENDIENTE')
        })
        .eq('id', id);

    if (cxpError) throw new Error("Failed to update CXP");

    // 3. Register Payment Historial
    const { error: pagoError } = await supabase
        .from('pagos_cxp')
        .insert({
            cuenta_por_pagar_id: id,
            fecha: fecha,
            valor: valor,
            metodo_pago: 'TRANSFERENCIA',
            cuenta_bancaria_id: cuentaBancariaId,
            nota: nota || `Abono a factura ${cxp.numero_factura || ''}`
        });

    if (pagoError) throw new Error("Failed to register payment history: " + pagoError.message);

    // 4. Register Movement
    const { error: movError } = await supabase
        .from('movimientos_financieros')
        .insert({
            fecha: fecha,
            tipo: 'EGRESO',
            categoria: 'PROVEEDORES',
            concepto: 'Pago Proveedor',
            descripcion: `Pago Factura Proveedor ${cxp.numero_factura || ''}`,
            valor: valor,
            cuenta_id: cuentaBancariaId,
            numero_documento: cxp.numero_factura,
            cuenta_por_pagar_id: id
        });

    if (movError) throw new Error("Failed to create financial movement: " + movError.message);

    // 5. Update Bank Balance
    await supabase.rpc("update_cuenta_saldo", {
        cuenta_uuid: cuentaBancariaId,
        delta_valor: -valor
    });

    revalidatePath("/dashboard/sistema/suministro");
    revalidatePath("/dashboard/sistema/financiera");
}

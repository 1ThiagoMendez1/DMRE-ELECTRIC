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

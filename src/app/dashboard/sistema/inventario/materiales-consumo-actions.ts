"use server";

import { createClient } from "@/utils/supabase/server";
import { ConsumoMaterial } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping
function mapToUI(db: any): ConsumoMaterial {
    return {
        id: db.id,
        inventarioId: db.inventario_id || undefined,
        descripcionMaterial: db.descripcion_material || undefined,
        cotizacionId: db.cotizacion_id || undefined,
        cotizacionNumero: db.cotizaciones?.numero || undefined,
        cotizacionDescripcion: db.cotizaciones?.descripcion_trabajo || undefined,
        cantidad: Number(db.cantidad) || 0,
        unidad: db.unidad || "UND",
        descripcion: db.descripcion,
        registradoPor: db.registrado_por,
        fecha: new Date(db.fecha || db.created_at),
    };
}

/**
 * Get all consumos for a specific material (with joined cotizacion info)
 */
export async function getConsumosByMaterialAction(inventarioId: string): Promise<ConsumoMaterial[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("consumo_material")
        .select("*, cotizaciones(numero, descripcion_trabajo)")
        .eq("inventario_id", inventarioId)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching consumos:", error);
        return [];
    }

    return (data || []).map(mapToUI);
}

/**
 * Get all consumos linked to a specific cotizacion.
 * Used to restore checkbox state on dialog reopen.
 */
export async function getConsumosByCotizacionAction(cotizacionId: string): Promise<ConsumoMaterial[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("consumo_material")
        .select("*, cotizaciones(numero, descripcion_trabajo)")
        .eq("cotizacion_id", cotizacionId)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching consumos by cotizacion:", error);
        return [];
    }

    return (data || []).map(mapToUI);
}

/**
 * Get aggregated consumption totals per material.
 * Returns a map of inventarioId -> totalConsumed
 */
export async function getConsumosResumenAction(): Promise<Record<string, number>> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("consumo_material")
        .select("inventario_id, cantidad");

    if (error) {
        console.error("Error fetching consumo resumen:", error);
        return {};
    }

    const resumen: Record<string, number> = {};
    for (const row of data || []) {
        if (!row.inventario_id) continue; // Skip items without inventory link
        const key = row.inventario_id;
        resumen[key] = (resumen[key] || 0) + Number(row.cantidad);
    }
    return resumen;
}

/**
 * Register a new material consumption
 */
export async function createConsumoAction(input: {
    inventarioId?: string;
    descripcionMaterial?: string;
    cotizacionId?: string;
    cantidad: number;
    unidad: string;
    descripcion?: string;
}): Promise<ConsumoMaterial> {
    const supabase = await createClient();

    const dbData: Record<string, any> = {
        inventario_id: input.inventarioId || null,
        descripcion_material: input.descripcionMaterial || null,
        cotizacion_id: input.cotizacionId || null,
        cantidad: input.cantidad,
        unidad: input.unidad,
        descripcion: input.descripcion || null,
    };

    const { data, error } = await supabase
        .from("consumo_material")
        .insert(dbData)
        .select("*, cotizaciones(numero, descripcion_trabajo)")
        .single();

    if (error) {
        console.error("Error creating consumo:", error);
        throw new Error("Error al registrar consumo: " + error.message);
    }

    revalidatePath("/dashboard/sistema/logistica");
    return mapToUI(data);
}

/**
 * Delete a consumption record
 */
export async function deleteConsumoAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("consumo_material")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting consumo:", error);
        throw new Error("Error al eliminar consumo");
    }

    revalidatePath("/dashboard/sistema/logistica");
    return true;
}

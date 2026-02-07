"use server";

import { createClient } from "@/utils/supabase/server";
import { DotacionItem, EntregaDotacion, DotacionVariant, Empleado } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// =============================================
// DOTACION ITEMS
// =============================================

function mapDotacionItemToUI(db: any, variantes: any[] = []): DotacionItem {
    return {
        id: db.id,
        descripcion: db.descripcion,
        categoria: db.categoria || "UNIFORME",
        genero: db.genero || "UNISEX",
        variantes: variantes.map(v => ({
            id: v.id,
            talla: v.talla || "",
            color: v.color || "",
            cantidadDisponible: Number(v.cantidad_disponible) || 0,
        })),
        stockMinimo: Number(db.stock_minimo) || 0,
        fechaVencimiento: db.fecha_vencimiento ? new Date(db.fecha_vencimiento) : undefined,
        codigo: db.codigo,
        activo: db.activo,
    };
}

function mapDotacionItemToDB(ui: Partial<DotacionItem>) {
    return {
        codigo: ui.codigo,
        descripcion: ui.descripcion,
        categoria: ui.categoria,
        genero: ui.genero,
        activo: ui.activo ?? true,
    };
}

export async function getDotacionItemsAction(): Promise<DotacionItem[]> {
    const supabase = await createClient();

    const { data: items, error } = await supabase
        .from("dotacion_items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching dotacion_items:", error);
        throw new Error("Failed to fetch dotacion_items");
    }

    // Get variantes
    const itemIds = items.map((i: any) => i.id);
    const { data: variantes } = await supabase
        .from("dotacion_variantes")
        .select("*")
        .in("dotacion_id", itemIds);

    const variantesPorItem: Record<string, any[]> = {};
    (variantes || []).forEach((v: any) => {
        if (!variantesPorItem[v.dotacion_id]) {
            variantesPorItem[v.dotacion_id] = [];
        }
        variantesPorItem[v.dotacion_id].push(v);
    });

    return items.map((i: any) => mapDotacionItemToUI(i, variantesPorItem[i.id] || []));
}

export async function createDotacionItemAction(item: Omit<DotacionItem, "id">): Promise<DotacionItem> {
    const supabase = await createClient();
    const dbData = mapDotacionItemToDB(item);

    const { data, error } = await supabase
        .from("dotacion_items")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating dotacion_item:", error);
        throw new Error("Failed to create dotacion_item");
    }

    // Insert variantes if any
    if (item.variantes && item.variantes.length > 0) {
        const variantesData = item.variantes.map(v => ({
            dotacion_id: data.id,
            talla: v.talla,
            color: v.color,
            cantidad_disponible: v.cantidadDisponible,
        }));
        await supabase.from("dotacion_variantes").insert(variantesData);
    }

    revalidatePath("/dashboard/sistema/dotacion");
    return mapDotacionItemToUI(data, item.variantes || []);
}

export async function updateDotacionItemAction(id: string, item: Partial<DotacionItem>): Promise<DotacionItem> {
    const supabase = await createClient();
    const dbData = mapDotacionItemToDB(item);

    const { data, error } = await supabase
        .from("dotacion_items")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating dotacion_item:", error);
        throw new Error("Failed to update dotacion_item");
    }

    revalidatePath("/dashboard/sistema/dotacion");
    return mapDotacionItemToUI(data, item.variantes || []);
}

// =============================================
// ENTREGAS DOTACION
// =============================================

function mapEntregaToUI(db: any, empleado?: any, items?: any[]): EntregaDotacion {
    return {
        id: db.id,
        fecha: new Date(db.fecha),
        empleadoId: db.empleado_id,
        empleado: empleado ? {
            id: empleado.id,
            nombreCompleto: empleado.nombre_completo,
            cedula: empleado.cedula || "",
            cargo: empleado.cargo || "",
            salarioBase: 0,
            fechaIngreso: new Date(),
            estado: "ACTIVO"
        } : {} as Empleado,
        items: (items || []).map(i => ({
            dotacionId: i.dotacion_id,
            varianteId: i.variante_id,
            descripcion: i.descripcion || "",
            detalle: `${i.talla || ""} - ${i.color || ""}`,
            cantidad: Number(i.cantidad) || 1,
        })),
        estado: db.estado || "PENDIENTE",
        usuarioAsigna: db.entregado_por,
        fechaAceptacion: db.fecha_aceptacion ? new Date(db.fecha_aceptacion) : undefined,
        fechaEntrega: db.fecha_entrega ? new Date(db.fecha_entrega) : undefined,
        observacion: db.observaciones || "",
    };
}

export async function getEntregasDotacionAction(): Promise<EntregaDotacion[]> {
    const supabase = await createClient();

    const { data: entregas, error } = await supabase
        .from("entregas_dotacion")
        .select(`
            *,
            empleados (id, nombre_completo, cedula, cargo)
        `)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching entregas_dotacion:", error);
        throw new Error("Failed to fetch entregas_dotacion");
    }

    // Get items
    const entregaIds = entregas.map((e: any) => e.id);
    const { data: allItems } = await supabase
        .from("entrega_dotacion_items")
        .select("*")
        .in("entrega_id", entregaIds);

    const itemsPorEntrega: Record<string, any[]> = {};
    (allItems || []).forEach((item: any) => {
        if (!itemsPorEntrega[item.entrega_id]) {
            itemsPorEntrega[item.entrega_id] = [];
        }
        itemsPorEntrega[item.entrega_id].push(item);
    });

    return entregas.map((e: any) =>
        mapEntregaToUI(e, e.empleados, itemsPorEntrega[e.id] || [])
    );
}

export async function createEntregaDotacionAction(entrega: Omit<EntregaDotacion, "id">): Promise<EntregaDotacion> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("entregas_dotacion")
        .insert({
            empleado_id: entrega.empleadoId,
            fecha: entrega.fecha,
            estado: entrega.estado || "PENDIENTE",
            observaciones: entrega.observacion,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating entrega_dotacion:", error);
        throw new Error("Failed to create entrega_dotacion");
    }

    // Insert items
    // Insert items and update stock
    if (entrega.items && entrega.items.length > 0) {
        const itemsData = entrega.items.map(i => ({
            entrega_id: data.id,
            dotacion_id: i.dotacionId,
            variante_id: i.varianteId,
            cantidad: i.cantidad,
            talla: i.detalle?.split(" - ")[0],
            color: i.detalle?.split(" - ")[1],
        }));

        await supabase.from("entrega_dotacion_items").insert(itemsData);

        // Deduct Stock
        for (const item of entrega.items) {
            if (item.varianteId) {
                // Get current stock
                const { data: variantData } = await supabase
                    .from("dotacion_variantes")
                    .select("cantidad_disponible")
                    .eq("id", item.varianteId)
                    .single();

                if (variantData) {
                    const newStock = Math.max(0, Number(variantData.cantidad_disponible) - Number(item.cantidad));
                    await supabase
                        .from("dotacion_variantes")
                        .update({ cantidad_disponible: newStock })
                        .eq("id", item.varianteId);
                }
            }
        }
    }

    revalidatePath("/dashboard/sistema/dotacion");
    return mapEntregaToUI(data, undefined, entrega.items || []);
}
export async function updateEntregaDotacionAction(id: string, updates: Partial<EntregaDotacion>): Promise<EntregaDotacion> {
    const supabase = await createClient();

    const dbUpdates: any = {
        estado: updates.estado,
        observaciones: updates.observacion,
    };

    if (updates.estado === 'ACEPTADO') {
        dbUpdates.fecha_aceptacion = new Date().toISOString();
    } else if (updates.estado === 'ENTREGADO') {
        dbUpdates.fecha_entrega = new Date().toISOString();
    }

    const { data, error } = await supabase
        .from("entregas_dotacion")
        .update(dbUpdates)
        .eq("id", id)
        .select(`
            *,
            empleados (id, nombre_completo, cedula, cargo)
        `)
        .single();

    if (error) {
        console.error("Error updating entrega_dotacion:", error);
        throw new Error("Failed to update entrega_dotacion");
    }

    // Get items for the UI mapping
    const { data: items } = await supabase
        .from("entrega_dotacion_items")
        .select("*")
        .eq("entrega_id", id);

    revalidatePath("/dashboard/sistema/dotacion");
    revalidatePath("/dashboard/sistema/logistica");

    return mapEntregaToUI(data, data.empleados, items || []);
}

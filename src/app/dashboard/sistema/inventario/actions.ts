"use server";

import { createClient } from "@/utils/supabase/server";
import { InventarioItem as InventarioUI } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping
function mapToUI(db: any): InventarioUI {
    return {
        id: db.id,
        item: db.codigo || db.sku || "",
        sku: db.sku || "",
        descripcion: db.nombre || db.descripcion || "",
        categoria: db.categoria || "MATERIAL",
        ubicacion: db.ubicacion || "BODEGA",
        unidad: db.unidad || "UND",
        cantidad: Number(db.cantidad) || 0,
        stockMinimo: Number(db.stock_minimo) || 0,
        valorUnitario: Number(db.valor_unitario) || 0,
        fechaCreacion: new Date(db.created_at),
        tipo: "SIMPLE",
        costoMateriales: 0,
        margenUtilidad: 0,
        valorTotal: Number(db.valor_total) || 0,
        proveedorId: db.proveedor_id,
        t1: Number(db.valor_unitario) || 0,
        t2: Number(db.valor_unitario) || 0,
        t3: Number(db.valor_unitario) || 0,
        // Extended fields
        nombre: db.nombre,
        marca: db.marca,
        modelo: db.modelo,
        imagenUrl: db.imagen_url,
        activo: db.activo,
    };
}

// UI -> DB mapping
function mapToDB(ui: Partial<InventarioUI>) {
    return {
        sku: ui.sku,
        codigo: ui.item,
        nombre: ui.descripcion || ui.nombre,
        descripcion: ui.descripcion,
        categoria: ui.categoria,
        ubicacion: ui.ubicacion,
        unidad: ui.unidad,
        cantidad: ui.cantidad,
        stock_minimo: ui.stockMinimo,
        valor_unitario: ui.valorUnitario,
        proveedor_id: ui.proveedorId,
        marca: ui.marca,
        modelo: ui.modelo,
        imagen_url: ui.imagenUrl,
        activo: ui.activo ?? true,
    };
}

async function getNextCode(supabase: any) {
    const { data } = await supabase
        .from("inventario")
        .select("sku")
        .ilike("sku", "INV-%")
        .order("sku", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].sku) {
        const parts = data[0].sku.split("-");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
    }
    return `INV-${nextNum.toString().padStart(4, "0")}`;
}

export async function getInventarioAction(): Promise<InventarioUI[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("inventario")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching inventario:", error);
        throw new Error("Failed to fetch inventario");
    }

    return data.map(mapToUI);
}

export async function createInventarioAction(itemInput: Omit<InventarioUI, "id" | "fechaCreacion">): Promise<InventarioUI> {
    const supabase = await createClient();
    const item = { ...itemInput } as Partial<InventarioUI>;

    if (!item.sku || item.sku.trim() === "") {
        item.sku = await getNextCode(supabase);
    }

    const dbData = mapToDB(item);
    const { data, error } = await supabase
        .from("inventario")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating inventario item:", error);
        throw new Error("Failed to create inventario item");
    }

    revalidatePath("/dashboard/sistema/inventario");
    revalidatePath("/dashboard/sistema/logistica");
    return mapToUI(data);
}

export async function updateInventarioAction(id: string, item: Partial<InventarioUI>): Promise<InventarioUI> {
    const supabase = await createClient();
    const dbData = mapToDB(item);

    const { data, error } = await supabase
        .from("inventario")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating inventario item:", error);
        throw new Error("Failed to update inventario item");
    }

    revalidatePath("/dashboard/sistema/inventario");
    revalidatePath("/dashboard/sistema/logistica");
    return mapToUI(data);
}

export async function deleteInventarioAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("inventario")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting inventario item:", error);
        throw new Error("Failed to delete inventario item");
    }

    revalidatePath("/dashboard/sistema/inventario");
    revalidatePath("/dashboard/sistema/logistica");
    return true;
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { Proveedor } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping
function mapToUI(db: any): Proveedor {
    return {
        id: db.id,
        nombre: db.nombre,
        nit: db.nit || "",
        categoria: db.categoria || "MIXTO",
        datosBancarios: typeof db.datos_bancarios === 'object'
            ? JSON.stringify(db.datos_bancarios)
            : db.datos_bancarios || "",
        correo: db.correo || "",
        // Extended fields from DB
        codigo: db.codigo,
        direccion: db.direccion,
        ciudad: db.ciudad,
        telefono: db.telefono,
        contacto: db.contacto,
        calificacion: db.calificacion,
        activo: db.activo,
        notas: db.notas,
    };
}

// UI -> DB mapping
function mapToDB(ui: Partial<Proveedor>) {
    return {
        codigo: ui.codigo,
        nombre: ui.nombre,
        nit: ui.nit,
        categoria: ui.categoria,
        direccion: ui.direccion,
        ciudad: ui.ciudad,
        correo: ui.correo,
        telefono: ui.telefono,
        contacto: ui.contacto,
        datos_bancarios: ui.datosBancarios ? JSON.parse(ui.datosBancarios) : {},
        calificacion: ui.calificacion,
        activo: ui.activo ?? true,
        notas: ui.notas,
    };
}

async function getNextCode(supabase: any) {
    const { data } = await supabase
        .from("proveedores")
        .select("codigo")
        .ilike("codigo", "PROV-%")
        .order("codigo", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].codigo) {
        const parts = data[0].codigo.split("-");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
    }
    return `PROV-${nextNum.toString().padStart(3, "0")}`;
}

export async function getProveedoresAction(): Promise<Proveedor[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("proveedores")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching proveedores:", error);
        throw new Error("Failed to fetch proveedores");
    }

    return data.map(mapToUI);
}

export async function createProveedorAction(proveedorInput: Omit<Proveedor, "id">): Promise<Proveedor> {
    const supabase = await createClient();
    const proveedor = { ...proveedorInput } as Partial<Proveedor>;

    if (!proveedor.codigo || proveedor.codigo.trim() === "") {
        proveedor.codigo = await getNextCode(supabase);
    }

    const dbData = mapToDB(proveedor);
    const { data, error } = await supabase
        .from("proveedores")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating proveedor:", error);
        throw new Error("Failed to create proveedor");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function updateProveedorAction(id: string, proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const supabase = await createClient();
    const dbData = mapToDB(proveedor);

    const { data, error } = await supabase
        .from("proveedores")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating proveedor:", error);
        throw new Error("Failed to update proveedor");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function deleteProveedorAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("proveedores")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting proveedor:", error);
        throw new Error("Failed to delete proveedor");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return true;
}

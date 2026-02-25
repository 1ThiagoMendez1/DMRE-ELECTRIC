"use server";

import { createClient } from "@/utils/supabase/server";
import { Instalacion } from "@/types/sistema";
import { revalidatePath, unstable_noStore } from "next/cache";

// DB -> UI mapping for Instalacion
function mapInstalacionToUI(db: any): Instalacion {
    return {
        id: db.id,
        codigo: db.codigo,
        descripcion: db.descripcion || "",
        valorCalculado: Number(db.valor_calculado) || 0,
        activo: db.activo,
        creadoPor: db.creado_por,
        fechaCreacion: new Date(db.created_at || db.fecha_creacion || new Date()),
    };
}

// UI -> DB mapping
function mapInstalacionToDB(ui: Partial<Instalacion>) {
    return {
        codigo: ui.codigo,
        descripcion: ui.descripcion,
        valor_calculado: ui.valorCalculado ?? 0,
        activo: ui.activo ?? true,
        // creado_por is handled separately if needed
    };
}

async function getNextInstalacionCode(supabase: any) {
    const { data } = await supabase
        .from("instalaciones")
        .select("codigo")
        .ilike("codigo", "IN-%")
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
    return `IN-${nextNum.toString().padStart(3, "0")}`;
}

export async function getInstalacionesAction(): Promise<Instalacion[]> {
    unstable_noStore();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("instalaciones")
        .select("*");

    if (error) {
        console.error("Error fetching instalaciones:", error);
        return []; // Fallback to empty instead of throwing to prevent crashing the whole ERP
    }

    const mapped = (data || []).map((c: any) => mapInstalacionToUI(c));
    // Sort en Javascript para evitar fallos si la columna de fecha difiere
    return mapped.sort((a, b) => {
        const dateA = a.fechaCreacion ? a.fechaCreacion.getTime() : 0;
        const dateB = b.fechaCreacion ? b.fechaCreacion.getTime() : 0;
        return dateB - dateA;
    });
}

export async function createInstalacionAction(instalacionInput: Omit<Instalacion, "id" | "fechaCreacion">): Promise<Instalacion> {
    const supabase = await createClient();
    const inst = { ...instalacionInput } as Partial<Instalacion>;

    if (!inst.codigo || inst.codigo.trim() === "") {
        inst.codigo = await getNextInstalacionCode(supabase);
    }

    const { data: userData } = await supabase.auth.getUser();

    const dbData = {
        ...mapInstalacionToDB(inst),
        creado_por: userData?.user?.id || null
    };

    const { data, error } = await supabase
        .from("instalaciones")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating instalacion:", error);
        throw new Error("Failed to create instalacion");
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    revalidatePath("/dashboard/sistema/operaciones/cotizaciones/nueva");
    return mapInstalacionToUI(data);
}

export async function updateInstalacionAction(id: string, instalacion: Partial<Instalacion>): Promise<Instalacion> {
    const supabase = await createClient();
    const dbData = mapInstalacionToDB(instalacion);

    const { data, error } = await supabase
        .from("instalaciones")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating instalacion:", error);
        throw new Error("Failed to update instalacion");
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    return mapInstalacionToUI(data);
}

export async function deleteInstalacionAction(id: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("instalaciones")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting instalacion:", error);
        throw new Error("Failed to delete instalacion");
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    return true;
}

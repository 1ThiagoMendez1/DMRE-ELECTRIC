"use server";

import { createClient } from "@/utils/supabase/server";
import { TareaAgenda } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any): TareaAgenda {
    return {
        id: db.id,
        titulo: db.titulo,
        descripcion: db.descripcion || "",
        fechaVencimiento: new Date(db.fecha_vencimiento || db.created_at),
        asignadoA: db.asignado_a,
        prioridad: db.prioridad || "MEDIA",
        estado: db.estado || "PENDIENTE",
        // Extended
        hora: db.hora,
        creadoPor: db.creado_por,
        etiquetas: db.etiquetas,
        recordatorio: db.recordatorio,
    };
}

function mapToDB(ui: Partial<TareaAgenda>) {
    return {
        titulo: ui.titulo,
        descripcion: ui.descripcion,
        fecha_vencimiento: ui.fechaVencimiento,
        hora: ui.hora,
        asignado_a: ui.asignadoA,
        creado_por: ui.creadoPor,
        prioridad: ui.prioridad,
        estado: ui.estado,
        etiquetas: ui.etiquetas,
        recordatorio: ui.recordatorio,
    };
}

export async function getTareasAction(): Promise<TareaAgenda[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .order("fecha_vencimiento", { ascending: true });

    if (error) {
        console.error("Error fetching tareas:", error);
        throw new Error("Failed to fetch tareas");
    }

    return data.map(mapToUI);
}

export async function createTareaAction(tarea: Omit<TareaAgenda, "id">): Promise<TareaAgenda> {
    const supabase = await createClient();
    const dbData = mapToDB(tarea);

    const { data, error } = await supabase
        .from("agenda")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating tarea:", error);
        throw new Error("Failed to create tarea");
    }

    revalidatePath("/dashboard/sistema/agenda");
    return mapToUI(data);
}

export async function updateTareaAction(id: string, tarea: Partial<TareaAgenda>): Promise<TareaAgenda> {
    const supabase = await createClient();
    const dbData = mapToDB(tarea);

    const { data, error } = await supabase
        .from("agenda")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating tarea:", error);
        throw new Error("Failed to update tarea");
    }

    revalidatePath("/dashboard/sistema/agenda");
    return mapToUI(data);
}

export async function deleteTareaAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("agenda")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting tarea:", error);
        throw new Error("Failed to delete tarea");
    }

    revalidatePath("/dashboard/sistema/agenda");
    return true;
}

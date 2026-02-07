"use server";

import { createClient } from "@/utils/supabase/server";
import { TareaAgenda, PrioridadTarea, EstadoTarea } from "@/types/sistema";
import { revalidatePath } from "next/cache";

export async function getTareasAction(limit: number = 100): Promise<TareaAgenda[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("agenda")
        .select(`
            *,
            asignado:profiles!asignado_a (full_name)
        `)
        .order("fecha_vencimiento", { ascending: true })
        .limit(limit);

    if (error) {
        console.error("Error fetching agenda:", error);
        return [];
    }

    return data.map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion || "",
        fechaVencimiento: new Date(t.fecha_vencimiento),
        asignadoA: t.asignado_a,
        asignadoNombre: t.asignado?.full_name || "Sin Asignar",
        prioridad: (t.prioridad as PrioridadTarea) || "MEDIA",
        estado: (t.estado as EstadoTarea) || "PENDIENTE",
        hora: t.hora,
        creadoPor: t.creado_por,
        etiquetas: t.etiquetas,
        recordatorio: t.recordatorio
    }));
}

export async function createTareaAction(tarea: Omit<TareaAgenda, "id" | "asignadoNombre">): Promise<TareaAgenda> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("agenda")
        .insert({
            titulo: tarea.titulo,
            descripcion: tarea.descripcion,
            fecha_vencimiento: tarea.fechaVencimiento,
            asignado_a: tarea.asignadoA,
            prioridad: tarea.prioridad,
            estado: tarea.estado || "PENDIENTE",
            hora: tarea.hora,
            etiquetas: tarea.etiquetas,
            recordatorio: tarea.recordatorio
        })
        .select(`
            *,
            asignado:profiles!asignado_a (full_name)
        `)
        .single();

    if (error) {
        console.error("Error creating tarea:", error);
        throw new Error("Failed to create tarea");
    }

    revalidatePath("/dashboard/sistema/agenda");
    return {
        id: data.id,
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        fechaVencimiento: new Date(data.fecha_vencimiento),
        asignadoA: data.asignado_a,
        asignadoNombre: data.asignado?.full_name,
        prioridad: data.prioridad,
        estado: data.estado,
        hora: data.hora,
        etiquetas: data.etiquetas,
        recordatorio: data.recordatorio
    };
}

export async function updateTareaAction(id: string, updates: Partial<TareaAgenda>): Promise<TareaAgenda> {
    const supabase = await createClient();

    const dbUpdates: any = {};
    if (updates.titulo) dbUpdates.titulo = updates.titulo;
    if (updates.descripcion !== undefined) dbUpdates.descripcion = updates.descripcion;
    if (updates.fechaVencimiento) dbUpdates.fecha_vencimiento = updates.fechaVencimiento;
    if (updates.asignadoA) dbUpdates.asignado_a = updates.asignadoA;
    if (updates.prioridad) dbUpdates.prioridad = updates.prioridad;
    if (updates.estado) dbUpdates.estado = updates.estado;
    if (updates.hora) dbUpdates.hora = updates.hora;
    if (updates.etiquetas) dbUpdates.etiquetas = updates.etiquetas;
    if (updates.recordatorio !== undefined) dbUpdates.recordatorio = updates.recordatorio;

    dbUpdates.updated_at = new Date();

    const { data, error } = await supabase
        .from("agenda")
        .update(dbUpdates)
        .eq("id", id)
        .select(`
             *,
            asignado:profiles!asignado_a (full_name)
        `)
        .single();

    if (error) {
        console.error("Error updating tarea:", error);
        throw new Error("Failed to update tarea");
    }

    revalidatePath("/dashboard/sistema/agenda");
    return {
        id: data.id,
        titulo: data.titulo,
        descripcion: data.descripcion || "",
        fechaVencimiento: new Date(data.fecha_vencimiento),
        asignadoA: data.asignado_a,
        asignadoNombre: data.asignado?.full_name,
        prioridad: data.prioridad,
        estado: data.estado,
        hora: data.hora,
        etiquetas: data.etiquetas,
        recordatorio: data.recordatorio
    };
}

export async function deleteTareaAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase.from("agenda").delete().eq("id", id);
    if (error) {
        console.error("Error deleting tarea:", error);
        return false;
    }
    revalidatePath("/dashboard/sistema/agenda");
    return true;
}

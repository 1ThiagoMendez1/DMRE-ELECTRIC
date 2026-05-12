"use server";

/**
 * PROGRAMADOR — Server Actions
 *
 * Tabla Supabase requerida (ejecutar en SQL Editor de Supabase):
 * ---------------------------------------------------------------
 * CREATE TABLE IF NOT EXISTS asignaciones_programador (
 *     id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     empleado_id     uuid NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
 *     cotizacion_id   uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
 *     direccion_obra  text,
 *     nombre_proyecto text,
 *     cliente_nombre  text,
 *     fecha           date NOT NULL,
 *     hora_inicio     text NOT NULL,
 *     hora_fin        text,
 *     rol             text,
 *     estado          text NOT NULL DEFAULT 'PROGRAMADO',
 *     notas_internas  text,
 *     notificado_whatsapp boolean DEFAULT false,
 *     created_at      timestamptz DEFAULT now()
 * );
 * ---------------------------------------------------------------
 */

import { createClient } from "@/utils/supabase/server";
import { AsignacionProgramador } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping
function mapToUI(db: any): AsignacionProgramador {
    return {
        id: db.id,
        empleadoId: db.empleado_id,
        cotizacionId: db.cotizacion_id,
        direccionObra: db.direccion_obra ?? undefined,
        nombreProyecto: db.nombre_proyecto ?? undefined,
        clienteNombre: db.cliente_nombre ?? undefined,
        fecha: new Date(db.fecha),
        horaInicio: db.hora_inicio,
        horaFin: db.hora_fin ?? undefined,
        rol: db.rol ?? undefined,
        estado: db.estado,
        notasInternas: db.notas_internas ?? undefined,
        notificadoWhatsapp: db.notificado_whatsapp ?? false,
        createdAt: db.created_at ? new Date(db.created_at) : undefined,
        // Joined relations
        empleado: db.empleado ? {
            id: db.empleado.id,
            nombreCompleto: db.empleado.nombre_completo,
            cedula: db.empleado.cedula || "",
            cargo: db.empleado.cargo || "",
            salarioBase: Number(db.empleado.salario_base) || 0,
            fechaIngreso: new Date(db.empleado.fecha_ingreso || db.empleado.created_at),
            estado: db.empleado.estado || "ACTIVO",
            telefono: db.empleado.telefono,
            correo: db.empleado.correo,
            fotoUrl: db.empleado.foto_url,
        } : undefined,
    };
}

// UI -> DB mapping
function mapToDB(ui: Partial<AsignacionProgramador>) {
    return {
        empleado_id: ui.empleadoId,
        cotizacion_id: ui.cotizacionId,
        direccion_obra: ui.direccionObra ?? null,
        nombre_proyecto: ui.nombreProyecto ?? null,
        cliente_nombre: ui.clienteNombre ?? null,
        fecha: ui.fecha instanceof Date
            ? ui.fecha.toISOString().split("T")[0]
            : ui.fecha,
        hora_inicio: ui.horaInicio,
        hora_fin: ui.horaFin ?? null,
        rol: ui.rol ?? null,
        estado: ui.estado ?? "PROGRAMADO",
        notas_internas: ui.notasInternas ?? null,
        notificado_whatsapp: ui.notificadoWhatsapp ?? false,
    };
}

const REVALIDATE_PATH = "/dashboard/sistema/talento-humano";

// ---- READ ----
export async function getAsignacionesAction(): Promise<AsignacionProgramador[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("asignaciones_programador")
        .select(`
            *,
            empleado:empleados(id, nombre_completo, cedula, cargo, salario_base, fecha_ingreso, estado, telefono, correo, foto_url, created_at)
        `)
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true });

    if (error) {
        // Table might not exist yet — return empty array gracefully
        console.warn("asignaciones_programador fetch warning:", error.message);
        return [];
    }

    return data.map(mapToUI);
}

// ---- CREATE ----
export async function createAsignacionAction(
    input: Omit<AsignacionProgramador, "id" | "empleado" | "cotizacion" | "createdAt">
): Promise<AsignacionProgramador> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("asignaciones_programador")
        .insert(mapToDB(input))
        .select(`
            *,
            empleado:empleados(id, nombre_completo, cedula, cargo, salario_base, fecha_ingreso, estado, telefono, correo, foto_url, created_at)
        `)
        .single();

    if (error) {
        console.error("Error creating asignacion:", error);
        throw new Error("No se pudo crear la asignación: " + error.message);
    }

    revalidatePath(REVALIDATE_PATH);
    return mapToUI(data);
}

// ---- UPDATE ----
export async function updateAsignacionAction(
    id: string,
    updates: Partial<AsignacionProgramador>
): Promise<AsignacionProgramador> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("asignaciones_programador")
        .update(mapToDB(updates))
        .eq("id", id)
        .select(`
            *,
            empleado:empleados(id, nombre_completo, cedula, cargo, salario_base, fecha_ingreso, estado, telefono, correo, foto_url, created_at)
        `)
        .single();

    if (error) {
        console.error("Error updating asignacion:", error);
        throw new Error("No se pudo actualizar la asignación: " + error.message);
    }

    revalidatePath(REVALIDATE_PATH);
    return mapToUI(data);
}

// ---- DELETE ----
export async function deleteAsignacionAction(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("asignaciones_programador")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting asignacion:", error);
        throw new Error("No se pudo eliminar la asignación.");
    }

    revalidatePath(REVALIDATE_PATH);
}

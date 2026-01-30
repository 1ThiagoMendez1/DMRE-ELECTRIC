"use server";

import { createClient } from "@/utils/supabase/server";
import { NovedadNomina } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any, empleado?: any): NovedadNomina {
    return {
        id: db.id,
        empleadoId: db.empleado_id,
        empleado: empleado ? {
            id: empleado.id,
            nombreCompleto: empleado.nombre_completo,
            cedula: empleado.cedula,
            cargo: empleado.cargo
        } as any : undefined,
        fecha: new Date(db.fecha),
        tipo: db.tipo,
        cantidad: Number(db.cantidad) || 0,
        valorUnitario: Number(db.valor_unitario) || 0,
        valorTotal: Number(db.valor_total) || 0,
        estado: db.estado || "PENDIENTE",
        observacion: db.observacion || "",
    };
}

function mapToDB(ui: Partial<NovedadNomina>) {
    return {
        empleado_id: ui.empleadoId,
        fecha: ui.fecha,
        tipo: ui.tipo,
        cantidad: ui.cantidad,
        valor_unitario: ui.valorUnitario,
        valor_total: ui.valorTotal,
        estado: ui.estado,
        observacion: ui.observacion,
    };
}

export async function getNovedadesNominaAction(): Promise<NovedadNomina[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("novedades_nomina")
        .select(`
            *,
            empleados (id, nombre_completo, cedula, cargo)
        `)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching novedades_nomina:", error);
        throw new Error("Failed to fetch novedades_nomina");
    }

    return data.map((n: any) => mapToUI(n, n.empleados));
}

export async function createNovedadNominaAction(novedad: Omit<NovedadNomina, "id">): Promise<NovedadNomina> {
    const supabase = await createClient();
    const dbData = mapToDB(novedad);

    const { data, error } = await supabase
        .from("novedades_nomina")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating novedad_nomina:", error);
        throw new Error("Failed to create novedad_nomina");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return mapToUI(data);
}

export async function updateNovedadNominaAction(id: string, novedad: Partial<NovedadNomina>): Promise<NovedadNomina> {
    const supabase = await createClient();
    const dbData = mapToDB(novedad);

    const { data, error } = await supabase
        .from("novedades_nomina")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating novedad_nomina:", error);
        throw new Error("Failed to update novedad_nomina");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return mapToUI(data);
}

export async function deleteNovedadNominaAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("novedades_nomina")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting novedad_nomina:", error);
        throw new Error("Failed to delete novedad_nomina");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return true;
}

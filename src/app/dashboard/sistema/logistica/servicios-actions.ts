"use server";

import { createClient } from "@/utils/supabase/server";
import { ServicioLogistica } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(dbData: any): ServicioLogistica {
    return {
        id: dbData.id,
        codigo: dbData.codigo,
        nombre: dbData.nombre,
        costo: Number(dbData.costo || 0),
        createdAt: dbData.created_at ? new Date(dbData.created_at) : undefined,
    };
}

export async function getServiciosAction(): Promise<ServicioLogistica[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("servicios_logistica")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching servicios:", error);
        throw new Error("Failed to fetch servicios");
    }

    return (data || []).map(mapToUI);
}

export async function createServicioAction(servicio: Omit<ServicioLogistica, "id" | "codigo" | "createdAt">): Promise<ServicioLogistica> {
    const supabase = await createClient();

    // Generate unique code SE1, SE2...
    // We order by length of codigo descending, then by codigo descending to handle SE10 vs SE2 properly
    // Actually, querying all and finding the max is safer for string-based numeric IDs
    const { data: existingCodes, error: fetchError } = await supabase
        .from("servicios_logistica")
        .select("codigo");

    if (fetchError) {
        throw new Error("Failed to generate code");
    }

    let nextNum = 1;
    if (existingCodes && existingCodes.length > 0) {
        const numbers = existingCodes
            .map(c => parseInt(c.codigo.replace("SE", ""), 10))
            .filter(n => !isNaN(n));

        if (numbers.length > 0) {
            nextNum = Math.max(...numbers) + 1;
        }
    }

    const nextCode = `SE${nextNum}`;

    const { data, error } = await supabase
        .from("servicios_logistica")
        .insert({
            codigo: nextCode,
            nombre: servicio.nombre,
            costo: servicio.costo,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating servicio:", error);
        throw new Error(error.message || "Failed to create servicio");
    }

    revalidatePath("/dashboard/sistema/logistica");
    return mapToUI(data);
}

export async function updateServicioAction(id: string, updates: Partial<ServicioLogistica>): Promise<ServicioLogistica> {
    const supabase = await createClient();

    const dbData: any = {};
    if (updates.nombre !== undefined) dbData.nombre = updates.nombre;
    if (updates.costo !== undefined) dbData.costo = updates.costo;

    const { data, error } = await supabase
        .from("servicios_logistica")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating servicio:", error);
        throw new Error("Failed to update servicio");
    }

    revalidatePath("/dashboard/sistema/logistica");
    return mapToUI(data);
}

export async function deleteServicioAction(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("servicios_logistica")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting servicio:", error);
        throw new Error("Failed to delete servicio");
    }

    revalidatePath("/dashboard/sistema/logistica");
}

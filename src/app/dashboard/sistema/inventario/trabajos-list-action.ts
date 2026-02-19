"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Get a lightweight list of cotizaciones (projects) for use in select dropdowns.
 * These are the REAL projects the user works with.
 */
export async function getTrabajosListAction(): Promise<{ id: string; nombre: string; codigo: string }[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("cotizaciones")
        .select("id, numero, descripcion_trabajo")
        .order("numero", { ascending: false });

    if (error) {
        console.error("Error fetching cotizaciones list:", error);
        return [];
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        nombre: t.descripcion_trabajo || "",
        codigo: t.numero || "",
    }));
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { Cliente as ClienteUI } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// Mapping helper: DB -> UI
function mapToUI(dbCliente: any): ClienteUI {
    return {
        id: dbCliente.id,
        codigo: dbCliente.codigo,
        nombre: dbCliente.nombre,
        documento: dbCliente.documento || "",
        direccion: dbCliente.direccion || "",
        ciudad: dbCliente.ciudad || "",
        correo: dbCliente.correo || "",
        telefono: dbCliente.telefono || "",
        contactoPrincipal: dbCliente.contacto_principal || "",
        notas: dbCliente.notas || "",
        fechaCreacion: new Date(dbCliente.created_at),
    };
}

async function getNextCode(currentSupabaseClient: any) {
    // Find max code starting with CLI-
    const { data } = await currentSupabaseClient
        .from("clientes")
        .select("codigo")
        .ilike("codigo", "CLI-%")
        .order("codigo", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].codigo) {
        const parts = data[0].codigo.split("-");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) {
                nextNum = num + 1;
            }
        }
    }
    return `CLI-${nextNum.toString().padStart(3, "0")}`;
}

// Mapping helper: UI -> DB (for insert/update)
function mapToDB(uiCliente: Partial<ClienteUI>) {
    return {
        nombre: uiCliente.nombre,
        codigo: uiCliente.codigo,
        documento: uiCliente.documento,
        direccion: uiCliente.direccion,
        ciudad: uiCliente.ciudad,
        correo: uiCliente.correo,
        telefono: uiCliente.telefono,
        contacto_principal: uiCliente.contactoPrincipal,
        notas: uiCliente.notas,
        // created_at is handled by DB default or preserved
    };
}

export async function getClientsAction(): Promise<ClienteUI[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching clients:", error);
        throw new Error("Failed to fetch clients");
    }

    return data.map(mapToUI);
}

export async function createClientAction(client: Omit<ClienteUI, "id" | "fechaCreacion">): Promise<ClienteUI> {
    const supabase = await createClient();

    // Auto-generate code if not provided
    if (!client.codigo || client.codigo.trim() === "") {
        client.codigo = await getNextCode(supabase);
    }

    const dbData = mapToDB(client);

    const { data, error } = await supabase
        .from("clientes")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating client:", error);
        throw new Error("Failed to create client");
    }

    revalidatePath("/dashboard/sistema/clientes");
    return mapToUI(data);
}

export async function updateClientAction(id: string, client: Partial<ClienteUI>): Promise<ClienteUI> {
    const supabase = await createClient();
    const dbData = mapToDB(client);

    const { data, error } = await supabase
        .from("clientes")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating client:", error);
        throw new Error("Failed to update client");
    }

    revalidatePath("/dashboard/sistema/clientes");
    return mapToUI(data);
}

export async function deleteClientAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting client:", error);
        throw new Error("Failed to delete client");
    }

    revalidatePath("/dashboard/sistema/clientes");
    return true;
}

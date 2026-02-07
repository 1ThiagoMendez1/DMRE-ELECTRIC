"use server";

import { createClient } from "@/utils/supabase/server";
import { CodigoTrabajo, MaterialAsociado } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping for CodigoTrabajo
function mapToUI(db: any, materiales: any[] = []): CodigoTrabajo {
    return {
        id: db.id,
        codigo: db.codigo,
        nombre: db.nombre,
        descripcion: db.descripcion || "",
        manoDeObra: Number(db.mano_de_obra) || 0,
        valorManoObra: Number(db.mano_de_obra) || 0,
        materiales: materiales.map(m => ({
            id: m.id,
            inventarioId: m.inventario_id || m.inventarioId,
            subCodigoId: m.sub_codigo_id,
            nombre: m.nombre || "",
            cantidad: Number(m.cantidad) || 0,
            valorUnitario: Number(m.valor_unitario || m.valorUnitario) || 0,
        })),
        costoTotalMateriales: Number(db.costo_materiales) || 0,
        costoTotal: Number(db.costo_total) || 0,
        fechaCreacion: new Date(db.created_at),
    };
}

// UI -> DB mapping
function mapToDB(ui: Partial<CodigoTrabajo>) {
    const manoDeObraValue = ui.manoDeObra ?? ui.valorManoObra ?? 0;
    const materialesValue = ui.costoTotalMateriales ?? 0;
    const totalValue = ui.costoTotal ?? (Number(manoDeObraValue) + Number(materialesValue));

    return {
        codigo: ui.codigo,
        nombre: ui.nombre,
        descripcion: ui.descripcion,
        unidad: "UND",
        mano_de_obra: manoDeObraValue,
        costo_materiales: materialesValue,
        costo_total: totalValue,
        precio_venta: totalValue,
        activo: true,
    };
}

async function getNextCode(supabase: any) {
    const { data } = await supabase
        .from("codigos_trabajo")
        .select("codigo")
        .ilike("codigo", "COD-%")
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
    return `COD-${nextNum.toString().padStart(3, "0")}`;
}

export async function getCodigosTrabajoAction(): Promise<CodigoTrabajo[]> {
    const supabase = await createClient();

    // Get codigos with their materials
    const { data: codigos, error } = await supabase
        .from("codigos_trabajo")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching codigos_trabajo:", error);
        throw new Error("Failed to fetch codigos_trabajo");
    }

    // Get all materials for these codes
    const codigoIds = codigos.map((c: any) => c.id);
    const { data: materiales } = await supabase
        .from("materiales_asociados")
        .select("*")
        .in("codigo_trabajo_id", codigoIds);

    // Group materials by codigo_trabajo_id
    const materialesPorCodigo: Record<string, any[]> = {};
    (materiales || []).forEach((m: any) => {
        if (!materialesPorCodigo[m.codigo_trabajo_id]) {
            materialesPorCodigo[m.codigo_trabajo_id] = [];
        }
        materialesPorCodigo[m.codigo_trabajo_id].push(m);
    });

    return codigos.map((c: any) => mapToUI(c, materialesPorCodigo[c.id] || []));
}

export async function createCodigoTrabajoAction(codigoInput: Omit<CodigoTrabajo, "id" | "fechaCreacion">): Promise<CodigoTrabajo> {
    const supabase = await createClient();
    const codigo = { ...codigoInput } as Partial<CodigoTrabajo>;

    if (!codigo.codigo || codigo.codigo.trim() === "") {
        codigo.codigo = await getNextCode(supabase);
    }

    const dbData = mapToDB(codigo);
    const { data, error } = await supabase
        .from("codigos_trabajo")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating codigo_trabajo:", error);
        throw new Error("Failed to create codigo_trabajo");
    }

    // Insert associated materials if any
    let savedMaterials: any[] = [];
    if (codigo.materiales && codigo.materiales.length > 0) {
        const materialesData = codigo.materiales.map(m => ({
            codigo_trabajo_id: data.id,
            inventario_id: m.inventarioId,
            sub_codigo_id: m.subCodigoId,
            nombre: m.nombre,
            cantidad: m.cantidad,
            valor_unitario: m.valorUnitario,
        }));

        const { data: inserted } = await supabase.from("materiales_asociados").insert(materialesData).select();
        savedMaterials = inserted || [];
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    return mapToUI(data, savedMaterials);
}

export async function updateCodigoTrabajoAction(id: string, codigo: Partial<CodigoTrabajo>): Promise<CodigoTrabajo> {
    const supabase = await createClient();
    const dbData = mapToDB(codigo);

    const { data, error } = await supabase
        .from("codigos_trabajo")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating codigo_trabajo:", error);
        throw new Error("Failed to update codigo_trabajo");
    }

    // Update materials: delete old and insert new
    let savedMaterials: any[] = [];
    if (codigo.materiales !== undefined) {
        await supabase.from("materiales_asociados").delete().eq("codigo_trabajo_id", id);

        if (codigo.materiales.length > 0) {
            const materialesData = codigo.materiales.map(m => ({
                codigo_trabajo_id: id,
                inventario_id: m.inventarioId,
                sub_codigo_id: m.subCodigoId,
                nombre: m.nombre,
                cantidad: m.cantidad,
                valor_unitario: m.valorUnitario,
            }));
            const { data: inserted } = await supabase.from("materiales_asociados").insert(materialesData).select();
            savedMaterials = inserted || [];
        }
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    return mapToUI(data, savedMaterials);
}

export async function deleteCodigoTrabajoAction(id: string): Promise<boolean> {
    const supabase = await createClient();

    // Materials are deleted automatically via CASCADE
    const { error } = await supabase
        .from("codigos_trabajo")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting codigo_trabajo:", error);
        throw new Error("Failed to delete codigo_trabajo");
    }

    revalidatePath("/dashboard/sistema/codigos-trabajo");
    return true;
}

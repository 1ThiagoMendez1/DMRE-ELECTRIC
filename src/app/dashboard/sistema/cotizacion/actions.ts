"use server";

import { createClient } from "@/utils/supabase/server";
import { Cotizacion, CotizacionItem, Cliente, HistorialCotizacion } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// ... (previous helper functions remain effectively the same, just not repeated here for brevity if replace_file_content handles partials well, but I will provide full file content or targeted replacement to be safe. Since I'm using replace_file_content with range, I'll target the end of file for new functions and the top for imports)

// Actually, I need to add the functions at the end and update imports at the top.
// I will do this in two steps or use multi_replace if provided? 
// The tool is replace_file_content (single block) or multi_replace.
// I'll use multi_replace to do both at once.


function mapItemToUI(db: any): CotizacionItem {
    return {
        id: db.id,
        inventarioId: db.inventario_id || undefined,
        codigoTrabajoId: db.codigo_trabajo_id || undefined,
        tipo: db.codigo_trabajo_id ? "SERVICIO" : "PRODUCTO",
        descripcion: db.descripcion,
        cantidad: Number(db.cantidad) || 0,
        valorUnitario: Number(db.valor_unitario) || 0,
        valorTotal: Number(db.valor_total) || (Number(db.cantidad) * Number(db.valor_unitario)),
        descuentoValor: Number(db.descuento_valor) || 0,
        descuentoPorcentaje: Number(db.descuento_porcentaje) || 0,
        impuesto: Number(db.impuesto) || 0,
        ocultarDetalles: !!db.ocultar_detalles,
        subItems: db.sub_items || [],
        costoUnitario: Number(db.costo_unitario) || 0,
        aiuAdminPorcentaje: Number(db.aiu_admin_porcentaje) || 0,
        aiuImprevistoPorcentaje: Number(db.aiu_imprevisto_porcentaje) || 0,
        aiuUtilidadPorcentaje: Number(db.aiu_utilidad_porcentaje) || 0,
        ivaUtilidadPorcentaje: Number(db.iva_utilidad_porcentaje) || 0,
        notas: db.notas,
    };
}

function mapToUI(db: any, items: any[] = [], cliente?: any): Cotizacion {
    return {
        id: db.id,
        numero: db.numero,
        tipo: db.tipo || "NORMAL",
        fecha: new Date(db.fecha),
        clienteId: db.cliente_id,
        cliente: cliente ? {
            id: cliente.id,
            nombre: cliente.nombre,
            documento: cliente.documento || "",
            direccion: cliente.direccion || "",
            correo: cliente.correo || "",
            telefono: cliente.telefono || "",
            contactoPrincipal: cliente.contacto_principal || "",
            fechaCreacion: new Date(cliente.created_at),
        } : {} as Cliente,
        descripcionTrabajo: db.descripcion_trabajo || "",
        items: items.map(mapItemToUI),
        subtotal: Number(db.subtotal) || 0,
        descuentoGlobal: Number(db.descuento_global) || 0,
        descuentoGlobalPorcentaje: Number(db.descuento_global_porcentaje) || 0,
        impuestoGlobalPorcentaje: Number(db.impuesto_global_porcentaje) || 0,
        aiuAdminGlobalPorcentaje: Number(db.aiu_admin_global_porcentaje) || 0,
        aiuImprevistoGlobalPorcentaje: Number(db.aiu_imprevisto_global_porcentaje) || 0,
        aiuUtilidadGlobalPorcentaje: Number(db.aiu_utilidad_global_porcentaje) || 0,
        ivaUtilidadGlobalPorcentaje: Number(db.iva_utilidad_global_porcentaje) || 0,
        aiuAdmin: Number(db.aiu_admin) || 0,
        aiuImprevistos: Number(db.aiu_imprevistos) || 0,
        aiuUtilidad: Number(db.aiu_utilidad) || 0,
        iva: Number(db.iva) || 0,
        total: Number(db.total) || 0,
        estado: db.cotizacion_estado || db.estado || "BORRADOR",
        fechaActualizacion: db.updated_at ? new Date(db.updated_at) : undefined,
        // Job execution fields
        direccionProyecto: db.direccion_proyecto,
        ubicacion: db.ubicacion,
        fechaInicio: db.fecha_inicio ? new Date(db.fecha_inicio) : undefined,
        fechaFinEstimada: db.fecha_fin_estimada ? new Date(db.fecha_fin_estimada) : undefined,
        fechaFinReal: db.fecha_fin_real ? new Date(db.fecha_fin_real) : undefined,
        costoReal: Number(db.costo_real) || 0,
        responsableId: db.responsable_id,
        progreso: Number(db.progreso) || 0,
        notas: db.notas || "",
        evidencia: db.evidencia || [],
        comentarios: db.comentarios || [],
    };
}

// Helper to prevent numeric overflow
function round2(num: number | undefined | null): number {
    if (num === undefined || num === null) return 0;
    return Math.round(num * 100) / 100;
}

function mapToDB(ui: any): any {
    // Helper to convert Date to ISO string or return undefined
    const formatDate = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date;
        return null;
    };

    return {
        numero: ui.numero,
        tipo: ui.tipo,
        fecha: formatDate(ui.fecha),
        cliente_id: ui.clienteId,
        descripcion_trabajo: ui.descripcionTrabajo,
        subtotal: round2(ui.subtotal),
        descuento_global: round2(ui.descuentoGlobal),
        descuento_global_porcentaje: round2(ui.descuentoGlobalPorcentaje),
        impuesto_global_porcentaje: round2(ui.impuestoGlobalPorcentaje),
        aiu_admin_global_porcentaje: round2(ui.aiuAdminGlobalPorcentaje),
        aiu_imprevisto_global_porcentaje: round2(ui.aiuImprevistoGlobalPorcentaje),
        aiu_utilidad_global_porcentaje: round2(ui.aiuUtilidadGlobalPorcentaje),
        iva_utilidad_global_porcentaje: round2(ui.ivaUtilidadGlobalPorcentaje),
        aiu_admin: round2(ui.aiuAdmin),
        aiu_imprevistos: round2(ui.aiuImprevistos),
        aiu_utilidad: round2(ui.aiuUtilidad),
        iva: round2(ui.iva),
        total: round2(ui.total),
        cotizacion_estado: ui.estado,
        estado: ui.estado, // Keep both for safety during migration
        // Job execution fields
        direccion_proyecto: ui.direccionProyecto,
        ubicacion: ui.ubicacion,
        fecha_inicio: formatDate(ui.fechaInicio),
        fecha_fin_estimada: formatDate(ui.fechaFinEstimada),
        fecha_fin_real: formatDate(ui.fechaFinReal),
        costo_real: round2(ui.costoReal),
        responsable_id: ui.responsableId,
        progreso: round2(ui.progreso),
        notas: ui.notas,
        evidencia: ui.evidencia || [],
        comentarios: ui.comentarios || [],
    };
}

async function getNextNumero(supabase: any) {
    const year = new Date().getFullYear();
    const prefix = `COT-${year}-`;

    const { data } = await supabase
        .from("cotizaciones")
        .select("numero")
        .ilike("numero", `${prefix}%`)
        .order("numero", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].numero) {
        const parts = data[0].numero.split("-");
        if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
    }
    return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}

export async function getCotizacionesAction(limit: number = 100): Promise<Cotizacion[]> {
    const supabase = await createClient();

    const { data: cotizaciones, error } = await supabase
        .from("cotizaciones")
        .select(`
            *,
            clientes (id, nombre, documento, direccion, correo, telefono, contacto_principal, created_at)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching cotizaciones:", error);
        throw new Error("Failed to fetch cotizaciones");
    }

    if (cotizaciones.length === 0) return [];

    // Get items ONLY for these cotizaciones
    const cotIds = cotizaciones.map((c: any) => c.id);
    const { data: allItems } = await supabase
        .from("cotizacion_items")
        .select("*")
        .in("cotizacion_id", cotIds);

    const itemsPorCotizacion: Record<string, any[]> = {};
    (allItems || []).forEach((item: any) => {
        if (!itemsPorCotizacion[item.cotizacion_id]) {
            itemsPorCotizacion[item.cotizacion_id] = [];
        }
        itemsPorCotizacion[item.cotizacion_id].push(item);
    });

    return cotizaciones.map((c: any) =>
        mapToUI(c, itemsPorCotizacion[c.id] || [], c.clientes)
    );
}

export async function createCotizacionAction(cotizacion: Omit<Cotizacion, "id">): Promise<Cotizacion> {
    const supabase = await createClient();

    if (!cotizacion.numero || cotizacion.numero.trim() === "") {
        cotizacion.numero = await getNextNumero(supabase);
    }

    const dbData = mapToDB(cotizacion);
    const { data, error } = await supabase
        .from("cotizaciones")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating cotizacion:", error);
        throw new Error(error.message || "Failed to create cotizacion");
    }

    // Insert items
    if (cotizacion.items && cotizacion.items.length > 0) {
        const itemsData = cotizacion.items.map((item, idx) => ({
            cotizacion_id: data.id,
            inventario_id: item.inventarioId || null,
            codigo_trabajo_id: item.codigoTrabajoId || null,
            item_numero: idx + 1,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            valor_unitario: round2(item.valorUnitario),
            // valor_total is generated in DB
            descuento_valor: round2(item.descuentoValor),
            descuento_porcentaje: round2(item.descuentoPorcentaje),
            impuesto: round2(item.impuesto),
            ocultar_detalles: item.ocultarDetalles,
            sub_items: item.subItems,
            costo_unitario: round2(item.costoUnitario),
            aiu_admin_porcentaje: round2(item.aiuAdminPorcentaje),
            aiu_imprevisto_porcentaje: round2(item.aiuImprevistoPorcentaje),
            aiu_utilidad_porcentaje: round2(item.aiuUtilidadPorcentaje),
            iva_utilidad_porcentaje: round2(item.ivaUtilidadPorcentaje),
            notas: item.notas,
        }));

        const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsData);
        if (itemsError) {
            console.error("Error inserting items:", itemsError);
            // We might want to delete the header if items fail? Or just alert?
        }
    }

    revalidatePath("/dashboard/sistema/cotizacion");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data, cotizacion.items || []);
}

export async function updateCotizacionAction(id: string, cotizacion: Partial<Cotizacion>): Promise<Cotizacion> {
    const supabase = await createClient();

    // Fetch current state for history comparison
    const { data: currentDb } = await supabase.from("cotizaciones").select("estado, progreso").eq("id", id).single();

    const dbData = mapToDB(cotizacion);

    const { data, error } = await supabase
        .from("cotizaciones")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.dir(error, { depth: null }); // Deep debug as planned
        console.error("Error updating cotizacion:", error);
        throw new Error(error.message || "Failed to update cotizacion");
    }

    // Auto-log state changes
    if (currentDb && cotizacion.estado && currentDb.estado !== cotizacion.estado) {
        await addHistorialEntryAction({
            cotizacionId: id,
            fecha: new Date(),
            usuarioId: "system", // Or fetch user if possible
            usuarioNombre: "Sistema",
            tipo: "ESTADO",
            descripcion: `Estado actualizado automáticamente`,
            valorAnterior: currentDb.estado,
            valorNuevo: cotizacion.estado
        });
    }

    // Auto-log progress changes
    if (currentDb && cotizacion.progreso !== undefined && currentDb.progreso !== cotizacion.progreso) {
        await addHistorialEntryAction({
            cotizacionId: id,
            fecha: new Date(),
            usuarioId: "system",
            usuarioNombre: "Sistema",
            tipo: "PROGRESO",
            descripcion: `Progreso actualizado`,
            valorAnterior: `${currentDb.progreso || 0}%`,
            valorNuevo: `${cotizacion.progreso}%`
        });
    }

    // Update items if provided
    if (cotizacion.items !== undefined) {
        // Log item update
        await addHistorialEntryAction({
            cotizacionId: id,
            fecha: new Date(),
            usuarioId: "system",
            usuarioNombre: "Sistema",
            tipo: "EDICION",
            descripcion: `Items de la cotización actualizados`
        });

        await supabase.from("cotizacion_items").delete().eq("cotizacion_id", id);

        if (cotizacion.items.length > 0) {
            const itemsData = cotizacion.items.map((item, idx) => ({
                cotizacion_id: id,
                inventario_id: item.inventarioId || null,
                codigo_trabajo_id: item.codigoTrabajoId || null,
                item_numero: idx + 1,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                valor_unitario: round2(item.valorUnitario),
                // valor_total is generated in DB
                descuento_valor: round2(item.descuentoValor),
                descuento_porcentaje: round2(item.descuentoPorcentaje),
                impuesto: round2(item.impuesto),
                ocultar_detalles: item.ocultarDetalles || false,
                sub_items: item.subItems || [],
                costo_unitario: round2(item.costoUnitario),
                aiu_admin_porcentaje: round2(item.aiuAdminPorcentaje),
                aiu_imprevisto_porcentaje: round2(item.aiuImprevistoPorcentaje),
                aiu_utilidad_porcentaje: round2(item.aiuUtilidadPorcentaje),
                iva_utilidad_porcentaje: round2(item.ivaUtilidadPorcentaje),
                notas: item.notas,
            }));

            const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsData);
            if (itemsError) console.error("Error updating items:", itemsError);
        }
    }

    revalidatePath("/dashboard/sistema/cotizacion");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data, cotizacion.items || []);
}

export async function deleteCotizacionAction(id: string): Promise<boolean> {
    const supabase = await createClient();

    // Items are deleted via CASCADE
    const { error } = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting cotizacion:", error);
        throw new Error("Failed to delete cotizacion");
    }

    revalidatePath("/dashboard/sistema/cotizacion");
    revalidatePath("/dashboard/sistema/comercial");
    return true;
}

export async function getHistorialAction(cotizacionId: string): Promise<HistorialCotizacion[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("cotizacion_historial")
        .select("*")
        .eq("cotizacion_id", cotizacionId)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching historial:", error);
        return [];
    }

    return data.map((d: any) => ({
        id: d.id,
        cotizacionId: d.cotizacion_id,
        fecha: new Date(d.fecha),
        usuarioId: d.usuario_id,
        usuarioNombre: d.usuario_nombre,
        tipo: d.tipo,
        descripcion: d.descripcion,
        valorAnterior: d.valor_anterior,
        valorNuevo: d.valor_nuevo,
        metadata: d.metadata
    }));
}

export async function addHistorialEntryAction(entry: Omit<HistorialCotizacion, "id">): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("cotizacion_historial").insert({
        cotizacion_id: entry.cotizacionId,
        fecha: entry.fecha.toISOString(),
        usuario_id: entry.usuarioId,
        usuario_nombre: entry.usuarioNombre,
        tipo: entry.tipo,
        descripcion: entry.descripcion,
        valor_anterior: entry.valorAnterior,
        valor_nuevo: entry.valorNuevo,
        metadata: entry.metadata || {}
    });

    if (error) {
        console.error("Error adding historial entry:", error);
    }
}

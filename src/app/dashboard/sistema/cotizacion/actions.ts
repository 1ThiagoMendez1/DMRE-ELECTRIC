"use server";

import { createClient } from "@/utils/supabase/server";
import { Cotizacion, CotizacionItem, Cliente, HistorialCotizacion, ComentarioCotizacion } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// ... (previous helper functions remain effectively the same, just not repeated here for brevity if replace_file_content handles partials well, but I will provide full file content or targeted replacement to be safe. Since I'm using replace_file_content with range, I'll target the end of file for new functions and the top for imports)

// Actually, I need to add the functions at the end and update imports at the top.
// I will do this in two steps or use multi_replace if provided? 
// The tool is replace_file_content (single block) or multi_replace.
// I'll use multi_replace to do both at once.


function parseLocalDate(dateStr: any): Date {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    const str = dateStr.toString();
    if (str.includes('T')) return new Date(str);
    return new Date(`${str}T12:00:00`);
}

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
        subItems: (db.sub_items || []).filter((s: any) => !s || s._esExtra !== true),
        costoUnitario: Number(db.costo_unitario) || 0,
        aiuAdminPorcentaje: Number(db.aiu_admin_porcentaje) || 0,
        aiuImprevistoPorcentaje: Number(db.aiu_imprevisto_porcentaje) || 0,
        aiuUtilidadPorcentaje: Number(db.aiu_utilidad_porcentaje) || 0,
        ivaUtilidadPorcentaje: Number(db.iva_utilidad_porcentaje) || 0,
        notas: db.notas,
        codigoItem: db.notas,
        porcentaje: Number(db.porcentaje) || 0,
        esExtra: (db.sub_items || []).some((s: any) => s && s._esExtra === true),
    };
}

function mapToUI(db: any, items: any[] = [], cliente?: any): Cotizacion {
    return {
        id: db.id,
        numero: db.numero,
        tipo: db.tipo || "NORMAL",
        fecha: parseLocalDate(db.fecha),
        fechaValidez: db.fecha_validez ? parseLocalDate(db.fecha_validez) : undefined,
        clienteId: db.cliente_id,
        trabajoId: db.trabajo_id, // Map from DB
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
        fechaInicio: db.fecha_inicio ? parseLocalDate(db.fecha_inicio) : undefined,
        fechaFinEstimada: db.fecha_fin_estimada ? parseLocalDate(db.fecha_fin_estimada) : undefined,
        fechaFinReal: db.fecha_fin_real ? parseLocalDate(db.fecha_fin_real) : undefined,
        costoReal: Number(db.costo_real) || 0,
        responsableId: db.responsable_id,
        progreso: Number(db.progreso) || 0,
        comentarios: db.comentarios || [],
        opcionesPdf: db.opciones_pdf || {},
        alcance: db.alcance || "",
        formaPago: db.forma_pago || "",
        notaFinal: db.nota_final || "",
        elaboradoPor: db.elaborado_por
    };
}

// Helper to prevent numeric overflow
function round2(num: number | undefined | null): number {
    if (num === undefined || num === null) return 0;
    return Math.round(num * 100) / 100;
}

function mapToDB(ui: any): any {
    const formatDate = (date: any) => {
        if (!date) return null;
        if (date instanceof Date) return date.toISOString();
        if (typeof date === 'string') return date;
        return null;
    };

    const db: any = {};
    const mapping: Record<string, any> = {
        numero: ui.numero,
        tipo: ui.tipo,
        fecha: ui.fecha ? formatDate(ui.fecha) : undefined,
        fecha_validez: ui.fechaValidez ? formatDate(ui.fechaValidez) : undefined,
        cliente_id: ui.clienteId,
        descripcion_trabajo: ui.descripcionTrabajo,
        subtotal: ui.subtotal !== undefined ? round2(ui.subtotal) : undefined,
        descuento_global: ui.descuentoGlobal !== undefined ? round2(ui.descuentoGlobal) : undefined,
        descuento_global_porcentaje: ui.descuentoGlobalPorcentaje !== undefined ? round2(ui.descuentoGlobalPorcentaje) : undefined,
        impuesto_global_porcentaje: ui.impuestoGlobalPorcentaje !== undefined ? round2(ui.impuestoGlobalPorcentaje) : undefined,
        aiu_admin_global_porcentaje: ui.aiuAdminGlobalPorcentaje !== undefined ? round2(ui.aiuAdminGlobalPorcentaje) : undefined,
        aiu_imprevisto_global_porcentaje: ui.aiuImprevistoGlobalPorcentaje !== undefined ? round2(ui.aiuImprevistoGlobalPorcentaje) : undefined,
        aiu_utilidad_global_porcentaje: ui.aiuUtilidadGlobalPorcentaje !== undefined ? round2(ui.aiuUtilidadGlobalPorcentaje) : undefined,
        iva_utilidad_global_porcentaje: ui.ivaUtilidadGlobalPorcentaje !== undefined ? round2(ui.ivaUtilidadGlobalPorcentaje) : undefined,
        aiu_admin: ui.aiuAdmin !== undefined ? round2(ui.aiuAdmin) : undefined,
        aiu_imprevistos: ui.aiuImprevistos !== undefined ? round2(ui.aiuImprevistos) : undefined,
        aiu_utilidad: ui.aiuUtilidad !== undefined ? round2(ui.aiuUtilidad) : undefined,
        iva: ui.iva !== undefined ? round2(ui.iva) : undefined,
        total: ui.total !== undefined ? round2(ui.total) : undefined,
        cotizacion_estado: ui.estado,
        estado: ui.estado,
        direccion_proyecto: ui.direccionProyecto,
        ubicacion: ui.ubicacion,
        fecha_inicio: ui.fechaInicio ? formatDate(ui.fechaInicio) : undefined,
        fecha_fin_estimada: ui.fechaFinEstimada ? formatDate(ui.fechaFinEstimada) : undefined,
        fecha_fin_real: ui.fechaFinReal ? formatDate(ui.fechaFinReal) : undefined,
        costo_real: ui.costoReal !== undefined ? round2(ui.costoReal) : undefined,
        responsable_id: ui.responsableId,
        progreso: ui.progreso !== undefined ? round2(ui.progreso) : undefined,
        comentarios: ui.comentarios,
        opciones_pdf: ui.opcionesPdf,
        alcance: ui.alcance,
        forma_pago: ui.formaPago,
        nota_final: ui.notaFinal,
        elaborado_por: ui.elaboradoPor
    };

    // Only include fields that are not undefined
    Object.keys(mapping).forEach(key => {
        if (mapping[key] !== undefined) {
            db[key] = mapping[key];
        }
    });

    return db;
}

async function getNextNumero(supabase: any, tipo: "NORMAL" | "SIMPLIFICADA" = "NORMAL") {
    const isSimplified = tipo === "SIMPLIFICADA";
    const prefix = isSimplified ? "S-" : "";

    const { data } = await supabase
        .from("cotizaciones")
        .select("numero")
        .order("created_at", { ascending: false })
        .limit(500);

    let nextNum = 1;
    if (data && data.length > 0) {
        let maxNum = 0;
        for (const row of data) {
            if (!row.numero) continue;
            
            let numStr = "";
            let num = NaN;

            if (isSimplified) {
                if (row.numero.startsWith("S-")) numStr = row.numero.substring(2);
                else if (row.numero.startsWith("COTS-")) numStr = row.numero.substring(5);
            } else {
                if (row.numero.startsWith("COT-")) {
                    numStr = row.numero.substring(4);
                } else if (/^\d+$/.test(row.numero)) {
                    numStr = row.numero;
                }
            }

            if (numStr) {
                if (numStr.includes("-")) {
                     const parts = numStr.split("-");
                     numStr = parts[parts.length - 1];
                }
                num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        }
        if (maxNum > 0) {
            nextNum = maxNum + 1;
        }
    }
    return `${prefix}${nextNum.toString().padStart(3, "0")}`;
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
        cotizacion.numero = await getNextNumero(supabase, cotizacion.tipo);
    }

    const dbData = mapToDB(cotizacion);
    const { data, error } = await supabase
        .from("cotizaciones")
        .insert(dbData)
        .select(`
            *,
            clientes (id, nombre, documento, direccion, correo, telefono, contacto_principal, created_at)
        `)
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
            sub_items: item.esExtra ? [{ _esExtra: true }, ...(item.subItems || [])] : (item.subItems || []),
            costo_unitario: round2(item.costoUnitario),
            aiu_admin_porcentaje: round2(item.aiuAdminPorcentaje),
            aiu_imprevisto_porcentaje: round2(item.aiuImprevistoPorcentaje),
            aiu_utilidad_porcentaje: round2(item.aiuUtilidadPorcentaje),
            iva_utilidad_porcentaje: round2(item.ivaUtilidadPorcentaje),
            notas: item.codigoItem || item.notas,
            porcentaje: round2(item.porcentaje),
        }));

        const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsData);
        if (itemsError) {
            console.error("Error inserting items:", itemsError);
            // Delete the header to maintain atomicity (optional but safer)
            await supabase.from("cotizaciones").delete().eq("id", data.id);
            throw new Error(`Error al guardar los items: ${itemsError.message}`);
        }
    }

    const { data: dbItems } = await supabase
        .from("cotizacion_items")
        .select("*")
        .eq("cotizacion_id", data.id);

    revalidatePath("/dashboard/sistema/cotizacion");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data, dbItems || [], data.clientes);
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
        .select(`
            *,
            clientes (id, nombre, documento, direccion, correo, telefono, contacto_principal, created_at)
        `)
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
                sub_items: item.esExtra ? [{ _esExtra: true }, ...(item.subItems || [])] : (item.subItems || []),
                costo_unitario: round2(item.costoUnitario),
                aiu_admin_porcentaje: round2(item.aiuAdminPorcentaje),
                aiu_imprevisto_porcentaje: round2(item.aiuImprevistoPorcentaje),
                aiu_utilidad_porcentaje: round2(item.aiuUtilidadPorcentaje),
                iva_utilidad_porcentaje: round2(item.ivaUtilidadPorcentaje),
                notas: item.codigoItem || item.notas,
                porcentaje: round2(item.porcentaje),
            }));

            const { error: itemsError } = await supabase.from("cotizacion_items").insert(itemsData);
            if (itemsError) {
                console.error("Error updating items:", itemsError);
                throw new Error(`Error al actualizar los items: ${itemsError.message}`);
            }
        }
    }

    const { data: dbItems } = await supabase
        .from("cotizacion_items")
        .select("*")
        .eq("cotizacion_id", id);

    revalidatePath("/dashboard/sistema/cotizacion");
    revalidatePath("/dashboard/sistema/comercial");
    return mapToUI(data, dbItems || [], data.clientes);
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

export async function getPublicCotizacionAction(trackingCode: string): Promise<Cotizacion | null> {
    const supabase = await createClient(); // Uses Service Role usually in this project

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingCode);
    const identifierFilter = isUUID ? `numero.eq.${trackingCode},id.eq.${trackingCode}` : `numero.eq.${trackingCode}`;

    const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .select(`
            *,
            clientes (id, nombre, documento, direccion, correo, telefono, contacto_principal, created_at)
        `)
        .or(identifierFilter)
        .in('estado', ['ENVIADA', 'APROBADA', 'EN_REVISION', 'PENDIENTE'])
        .single();

    if (error) {
        console.error("DEBUG Portal Fetch Error:", error.message, error.details, error.hint);
    }

    if (error || !cotizacion) {
        return null;
    }

    const { data: allItems } = await supabase
        .from("cotizacion_items")
        .select("*")
        .eq("cotizacion_id", cotizacion.id);

    return mapToUI(cotizacion, allItems || [], cotizacion.clientes);
}

// Securely fetches documents only if the quotation has reached an approved or execution state.
// This enforces RLS equivalent logic on the server side since the portal user is unauthenticated.
export async function getSecureCotizacionDocumentsAction(trackingCode: string) {
    const supabase = await createClient(); // Service role

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingCode);
    const identifierFilter = isUUID ? `numero.eq.${trackingCode},id.eq.${trackingCode}` : `numero.eq.${trackingCode}`;

    // First, verify the quotation exists AND is strictly in an allowed state
    const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .select("id, estado")
        .or(identifierFilter)
        .in('estado', ['APROBADA'])
        .single();

    if (error || !cotizacion) {
        return null;
    }

    const formatFile = (f: any, categoryPath: string) => {
        const { data: { publicUrl } } = supabase.storage
            .from('Documentost_rabajos')
            .getPublicUrl(`${categoryPath}/${f.name}`);

        return {
            id: f.id || `${Date.now()}-${f.name}`,
            name: f.name.replace(/^\d+_/, ''), // Remove timestamp prefix
            size: f.metadata?.size ? `${(f.metadata.size / 1024 / 1024).toFixed(2)} MB` : 'Desconocido',
            secureUrl: publicUrl
        };
    };

    const fetchFolder = async (folderPath: string) => {
        const { data } = await supabase.storage.from('Documentost_rabajos').list(folderPath, { limit: 100 });
        return (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => formatFile(f, folderPath));
    };

    const legalDocs = await fetchFolder(`Documentacion/${cotizacion.id}`);
    const polizas = await fetchFolder(`Polizasyseguros/${cotizacion.id}`);
    const ordenesCompra = await fetchFolder(`OrdenesDeCompra/${cotizacion.id}`);

    return {
        cotizacionId: cotizacion.id,
        legalDocs,
        polizas,
        ordenesCompra
    };
}

// Securely allows a client to upload a document to their specific quotation folder via the Portal
export async function uploadPublicCotizacionDocumentAction(trackingCode: string, category: 'Documentacion' | 'Polizasyseguros' | 'OrdenesDeCompra', formData: FormData) {
    const supabase = await createClient(); // Service role bypasses RLS

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingCode);
    const identifierFilter = isUUID ? `numero.eq.${trackingCode},id.eq.${trackingCode}` : `numero.eq.${trackingCode}`;

    // Verify the quotation exists AND is in an allowed state BEFORE permitting upload
    const { data: cotizacion, error: quoteError } = await supabase
        .from("cotizaciones")
        .select("id, estado")
        .or(identifierFilter)
        .in('estado', ['APROBADA'])
        .single();

    if (quoteError || !cotizacion) {
        throw new Error("Su cotización no autoriza la carga de documentos en este estado.");
    }

    const file = formData.get('file') as File;
    if (!file) {
        throw new Error("No se proporcionó ningún archivo válido.");
    }

    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `${category}/${cotizacion.id}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
        .from('Documentost_rabajos')
        .upload(filePath, file);

    if (uploadError) {
        console.error("Portal Upload Error:", uploadError);
        throw new Error("Ocurrió un error al subir el archivo.");
    }

    return true;
}

// Allows an unauthenticated client to add a comment to their quotation
export async function addPublicCotizacionCommentAction(trackingCode: string, comment: ComentarioCotizacion): Promise<boolean> {
    const supabase = await createClient(); // Service role

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingCode);
    const identifierFilter = isUUID ? `numero.eq.${trackingCode},id.eq.${trackingCode}` : `numero.eq.${trackingCode}`;

    const { data: cotizacion, error } = await supabase
        .from("cotizaciones")
        .select("id, comentarios")
        .or(identifierFilter)
        .single();

    if (error || !cotizacion) {
        console.error("Error finding quote for comment:", error);
        return false;
    }

    const currentComments = cotizacion.comentarios || [];
    const updatedComments = [...currentComments, comment];

    const { error: updateError } = await supabase
        .from("cotizaciones")
        .update({ comentarios: updatedComments })
        .eq("id", cotizacion.id);

    if (updateError) {
        console.error("Error saving public comment:", updateError);
        return false;
    }

    revalidatePath("/portal/view");
    revalidatePath("/dashboard/sistema/comercial");

    return true;
}

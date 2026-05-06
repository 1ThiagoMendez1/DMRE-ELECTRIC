"use server";

import { createClient } from "@/utils/supabase/server";
import { CotizacionProveedor } from "@/types/sistema";

export async function getCotizacionesProveedorAction(): Promise<CotizacionProveedor[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('cotizaciones_proveedor')
        .select(`
            *,
            proveedor:proveedores(*),
            items:cotizaciones_proveedor_items(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        // Fallback to empty array if table doesn't exist yet
        if (error.code === '42P01') return [];
        console.error('Error fetching cotizaciones proveedor:', error);
        return [];
    }
    
    // Transform to match the interface if needed
    return data.map((item: any) => ({
        id: item.id,
        numero: item.numero,
        cotizacionId: item.cotizacion_id,
        proveedorId: item.proveedor_id,
        proveedor: item.proveedor,
        estado: item.estado,
        fecha: new Date(item.fecha),
        fechaAprobacion: item.fecha_aprobacion ? new Date(item.fecha_aprobacion) : undefined,
        items: item.items.map((i: any) => ({
            id: i.id,
            cotizacionProveedorId: i.cotizacion_proveedor_id,
            inventarioId: i.inventario_id,
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            unidad: i.unidad,
            valorUnitarioOfrecido: i.valor_unitario_ofrecido,
            valorTotalOfrecido: i.valor_total_ofrecido
        })),
        observaciones: item.observaciones
    })) as CotizacionProveedor[];
}

export async function createCotizacionProveedorAction(cotizacion: Omit<CotizacionProveedor, "id" | "fechaAprobacion" | "items">, items: any[]): Promise<CotizacionProveedor> {
    const supabase = await createClient();
    
    // 1. Insert header
    const { data: headerData, error: headerError } = await supabase
        .from('cotizaciones_proveedor')
        .insert({
            numero: cotizacion.numero,
            cotizacion_id: cotizacion.cotizacionId,
            proveedor_id: cotizacion.proveedorId,
            estado: cotizacion.estado,
            fecha: cotizacion.fecha.toISOString(),
            observaciones: cotizacion.observaciones
        })
        .select()
        .single();
        
    if (headerError) {
        console.error("Error creating cotizacion proveedor header:", headerError);
        throw headerError;
    }
    
    // 2. Insert items
    if (items && items.length > 0) {
        const itemsToInsert = items.map(item => ({
            cotizacion_proveedor_id: headerData.id,
            inventario_id: item.inventarioId,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            unidad: item.unidad || 'UND'
        }));
        
        const { error: itemsError } = await supabase
            .from('cotizaciones_proveedor_items')
            .insert(itemsToInsert);
            
        if (itemsError) {
            console.error("Error creating cotizacion proveedor items:", itemsError);
            // Optionally delete header here if atomic transaction is needed and we are not using rpc
        }
    }
    
    // Return combined object (simulated since we don't refetch)
    return {
        ...cotizacion,
        id: headerData.id,
        items: items as any[]
    } as CotizacionProveedor;
}

export async function updateCotizacionProveedorEstadoAction(id: string, estado: string, proveedorId?: string): Promise<void> {
    const supabase = await createClient();
    const updateData: any = { estado };
    if (estado === 'APROBADA') {
        updateData.fecha_aprobacion = new Date().toISOString();
    }
    if (proveedorId) {
        updateData.proveedor_id = proveedorId;
    }
    
    const { error } = await supabase
        .from('cotizaciones_proveedor')
        .update(updateData)
        .eq('id', id);
        
    if (error) throw error;
}

// Actualiza los precios unitarios de los items de una solicitud de cotización
export async function updateCotizacionProveedorItemPricesAction(
    itemPrices: Array<{ id: string; valorUnitario: number; valorTotal: number }>
): Promise<void> {
    const supabase = await createClient();
    
    // Actualizar cada item con su precio
    const updates = itemPrices.map(item =>
        supabase
            .from('cotizaciones_proveedor_items')
            .update({
                valor_unitario_ofrecido: item.valorUnitario,
                valor_total_ofrecido: item.valorTotal
            })
            .eq('id', item.id)
    );
    
    await Promise.all(updates);
}

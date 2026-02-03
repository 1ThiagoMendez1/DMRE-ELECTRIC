"use server";

import { createClient } from "@/utils/supabase/server";
import { OrdenCompra, DetalleCompra } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping for OrdenCompra
function mapToUI(db: any, items: any[] = []): OrdenCompra {
    return {
        id: db.id,
        numero: db.numero,
        proveedorId: db.proveedor_id,
        proveedor: db.proveedores ? {
            id: db.proveedores.id,
            nombre: db.proveedores.nombre,
            nit: db.proveedores.nit || "",
            categoria: db.proveedores.categoria || "MIXTO",
            correo: db.proveedores.correo || "",
            datosBancarios: db.proveedores.datos_bancarios || ""
        } : {} as any,
        fechaEmision: new Date(db.fecha_emision),
        fechaEntregaEstimada: db.fecha_entrega_estimada ? new Date(db.fecha_entrega_estimada) : undefined,
        items: items.map(mapItemToUI),
        subtotal: Number(db.subtotal) || 0,
        impuestos: Number(db.impuestos) || 0,
        total: Number(db.total) || 0,
        estado: db.estado || "PENDIENTE",
        observaciones: db.observaciones || ""
    };
}

function mapItemToUI(db: any): DetalleCompra {
    return {
        id: db.id,
        ordenCompraId: db.orden_compra_id,
        inventarioId: db.inventario_id,
        descripcion: db.descripcion,
        cantidad: Number(db.cantidad) || 0,
        valorUnitario: Number(db.valor_unitario) || 0,
        subtotal: Number(db.subtotal) || 0,
        recibido: Number(db.recibido) || 0
    };
}

export async function getOrdenesCompraAction(): Promise<OrdenCompra[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("ordenes_compra")
        .select(`
            *,
            proveedores (id, nombre, nit, categoria, correo, datos_bancarios),
            detalle_compra (*)
        `)
        .order("fecha_emision", { ascending: false });

    if (error) {
        console.error("Error fetching ordenes_compra:", error);
        throw new Error("Failed to fetch ordenes_compra");
    }

    return data.map((oc: any) => mapToUI(oc, oc.detalle_compra));
}

export async function createOrdenCompraAction(ocInput: any): Promise<OrdenCompra> {
    const supabase = await createClient();
    const { items, ...rest } = ocInput;

    // 1. Insert Order
    const dbOrder = {
        proveedor_id: rest.proveedorId,
        numero: rest.numero,
        fecha_emision: rest.fechaEmision,
        fecha_entrega_estimada: rest.fechaEntregaEstimada,
        subtotal: rest.subtotal,
        impuestos: rest.impuestos,
        total: rest.total,
        estado: rest.estado,
        observaciones: rest.observaciones
    };

    const { data: order, error: orderError } = await supabase
        .from("ordenes_compra")
        .insert(dbOrder)
        .select()
        .single();

    if (orderError) {
        console.error("Error creating order:", orderError);
        throw new Error("Failed to create order");
    }

    // 2. Insert Items
    if (items && items.length > 0) {
        const dbItems = items.map((i: any) => ({
            orden_compra_id: order.id,
            inventario_id: i.inventarioId,
            descripcion: i.descripcion,
            cantidad: i.cantidad,
            valor_unitario: i.valorUnitario,
            subtotal: i.subtotal,
            recibido: 0
        }));

        const { error: itemsError } = await supabase
            .from("detalle_compra")
            .insert(dbItems);

        if (itemsError) {
            console.error("Error creating order items:", itemsError);
            // We should ideally rollback or handle this, but for now log it
        }
    }

    revalidatePath("/dashboard/sistema/suministro");
    revalidatePath("/dashboard/sistema/logistica");

    // Fetch again with items to return complete object
    return (await getOrdenesCompraAction()).find(o => o.id === order.id)!;
}

export async function updateOrdenCompraAction(id: string, oc: Partial<OrdenCompra>): Promise<OrdenCompra> {
    const supabase = await createClient();

    const dbData: any = {};
    if (oc.estado) dbData.estado = oc.estado;
    if (oc.observaciones !== undefined) dbData.observaciones = oc.observaciones;
    if (oc.fechaEntregaEstimada) dbData.fecha_entrega_estimada = oc.fechaEntregaEstimada;

    const { error } = await supabase
        .from("ordenes_compra")
        .update(dbData)
        .eq("id", id);

    if (error) {
        console.error("Error updating order:", error);
        throw new Error("Failed to update order");
    }

    revalidatePath("/dashboard/sistema/suministro");
    revalidatePath("/dashboard/sistema/logistica");

    return (await getOrdenesCompraAction()).find(o => o.id === id)!;
}

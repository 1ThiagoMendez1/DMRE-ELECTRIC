"use server";

import { createClient } from "@/utils/supabase/server";
import { CompraFinanciera, Cotizacion, Cliente } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any): CompraFinanciera {
    let cotizacion: Cotizacion | undefined = undefined;
    let cotizacionProveedor: CotizacionProveedor | undefined = undefined;

    if (db.cotizaciones) {
        const cotRaw = db.cotizaciones;
        const clienteRaw = cotRaw.clientes;
        const cliente = clienteRaw ? {
            id: clienteRaw.id,
            nombre: clienteRaw.nombre || "Cliente Sin Nombre",
            documento: clienteRaw.documento || "",
            telefono: clienteRaw.telefono || "",
        } as Cliente : { nombre: "Cliente Desconocido" } as unknown as Cliente;

        cotizacion = {
            ...cotRaw,
            fecha: new Date(cotRaw.created_at || new Date()),
            cliente: cliente,
            items: [],
        } as unknown as Cotizacion;
    }

    if (db.cotizaciones_proveedor) {
        const cpRaw = db.cotizaciones_proveedor;
        cotizacionProveedor = {
            ...cpRaw,
            fecha: new Date(cpRaw.fecha),
            items: [], // Map if needed
        } as unknown as CotizacionProveedor;
    }

    return {
        id: db.id,
        cotizacionId: db.cotizacion_id,
        cotizacion: cotizacion,
        cotizacionProveedorId: db.cotizacion_proveedor_id,
        cotizacionProveedor: cotizacionProveedor,
        numeroFactura: db.numero_factura,
        iva: Number(db.iva) || 0,
        valorFactura: Number(db.valor_factura) || 0,
        fecha: new Date(db.fecha),
        valorPago: Number(db.valor_pago) || 0,
        fechaPago: db.fecha_pago ? new Date(db.fecha_pago) : undefined,
        saldo: Number(db.saldo) || 0,
        diasCredito: db.dias_credito || 0,
        metodoPago: db.metodo_pago,
        soporteUrl: db.soporte_url,
        cuotas: db.cuotas || 1,
        createdAt: new Date(db.created_at),
        updatedAt: new Date(db.updated_at),
    };
}

function mapToDB(ui: Partial<CompraFinanciera>) {
    const raw: Record<string, any> = {
        cotizacion_id: ui.cotizacionId,
        cotizacion_proveedor_id: ui.cotizacionProveedorId,
        numero_factura: ui.numeroFactura,
        iva: ui.iva,
        valor_factura: ui.valorFactura,
        fecha: ui.fecha,
        valor_pago: ui.valorPago,
        fecha_pago: ui.fechaPago,
        dias_credito: ui.diasCredito,
        metodo_pago: ui.metodoPago,
        soporte_url: ui.soporteUrl,
        cuotas: ui.cuotas,
    };
    return Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined));
}

const COMPRA_SELECT = `
    *,
    cotizaciones (
        id, numero, total, estado, created_at,
        clientes (id, nombre, documento, telefono, direccion)
    ),
    cotizaciones_proveedor (
        id, numero, estado, fecha, observaciones
    )
`;

export async function getComprasAction(): Promise<CompraFinanciera[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("compras_financiera")
        .select(COMPRA_SELECT)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching compras:", error);
        throw new Error("Failed to fetch compras");
    }

    return data.map(mapToUI);
}

export async function createCompraAction(compra: Omit<CompraFinanciera, "id" | "saldo">): Promise<CompraFinanciera> {
    const supabase = await createClient();
    const dbData = mapToDB(compra);

    const { data, error } = await supabase
        .from("compras_financiera")
        .insert(dbData)
        .select(COMPRA_SELECT)
        .single();

    if (error) {
        console.error("Error creating compra:", error);
        throw new Error(`Failed to create compra: ${error.message}`);
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapToUI(data);
}

export async function updateCompraAction(id: string, compra: Partial<CompraFinanciera>): Promise<CompraFinanciera> {
    const supabase = await createClient();
    const dbData = mapToDB(compra);

    const { data, error } = await supabase
        .from("compras_financiera")
        .update(dbData)
        .eq("id", id)
        .select(COMPRA_SELECT)
        .single();

    if (error) {
        console.error("Error updating compra:", error);
        throw new Error("Failed to update compra");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapToUI(data);
}

export async function deleteCompraAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("compras_financiera")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting compra:", error);
        throw new Error("Failed to delete compra");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return true;
}

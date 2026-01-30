"use server";

import { createClient } from "@/utils/supabase/server";
import { CuentaPorPagar, Proveedor } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any, proveedor?: any): CuentaPorPagar {
    return {
        id: db.id,
        proveedorId: db.proveedor_id,
        proveedor: proveedor ? {
            id: proveedor.id,
            nombre: proveedor.nombre,
            nit: proveedor.nit || "",
            categoria: proveedor.categoria || "MIXTO",
            datosBancarios: "",
            correo: proveedor.correo || "",
        } : {} as Proveedor,
        numeroFacturaProveedor: db.numero_factura || "",
        fecha: new Date(db.fecha_factura || db.created_at),
        concepto: db.concepto || "",
        valorTotal: Number(db.valor_total) || 0,
        valorPagado: Number(db.valor_pagado) || 0,
        saldoPendiente: Number(db.saldo_pendiente) || 0,
        pagos: [], // Would load from separate table if needed
        ofertaId: db.trabajo_id,
        // Extended
        fechaVencimiento: db.fecha_vencimiento ? new Date(db.fecha_vencimiento) : undefined,
        estado: db.estado,
        observaciones: db.observaciones,
    };
}

function mapToDB(ui: Partial<CuentaPorPagar>) {
    return {
        proveedor_id: ui.proveedorId,
        numero_factura: ui.numeroFacturaProveedor,
        fecha_factura: ui.fecha,
        fecha_vencimiento: ui.fechaVencimiento,
        concepto: ui.concepto,
        trabajo_id: ui.ofertaId,
        valor_total: ui.valorTotal,
        valor_pagado: ui.valorPagado,
        estado: ui.estado || "PENDIENTE",
        observaciones: ui.observaciones,
    };
}

export async function getCuentasPorPagarAction(): Promise<CuentaPorPagar[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .select(`
            *,
            proveedores (id, nombre, nit, categoria, correo)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching cuentas_por_pagar:", error);
        throw new Error("Failed to fetch cuentas_por_pagar");
    }

    return data.map((c: any) => mapToUI(c, c.proveedores));
}

export async function createCuentaPorPagarAction(cuenta: Omit<CuentaPorPagar, "id">): Promise<CuentaPorPagar> {
    const supabase = await createClient();
    const dbData = mapToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating cuenta_por_pagar:", error);
        throw new Error("Failed to create cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function updateCuentaPorPagarAction(id: string, cuenta: Partial<CuentaPorPagar>): Promise<CuentaPorPagar> {
    const supabase = await createClient();
    const dbData = mapToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_por_pagar")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating cuenta_por_pagar:", error);
        throw new Error("Failed to update cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return mapToUI(data);
}

export async function deleteCuentaPorPagarAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("cuentas_por_pagar")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting cuenta_por_pagar:", error);
        throw new Error("Failed to delete cuenta_por_pagar");
    }

    revalidatePath("/dashboard/sistema/suministro");
    return true;
}

export async function payCuentaPorPagarAction(id: string, cuentaBancariaId: string, valor: number, fecha: Date): Promise<void> {
    const supabase = await createClient();

    // 1. Get current CXP
    const { data: cxp, error: fetchError } = await supabase.from('cuentas_por_pagar').select('*').eq('id', id).single();
    if (fetchError || !cxp) throw new Error("CXP not found");

    // 2. Update CXP
    const nuevoSaldo = Math.max(0, (Number(cxp.saldo_pendiente) || 0) - valor);
    const nuevoPago = (Number(cxp.valor_pagado) || 0) + valor;

    const { error: cxpError } = await supabase
        .from('cuentas_por_pagar')
        .update({
            valor_pagado: nuevoPago,
            saldo_pendiente: nuevoSaldo,
            estado: nuevoSaldo <= 0 ? 'PAGADO' : 'PENDIENTE'
        })
        .eq('id', id);

    if (cxpError) throw new Error("Failed to update CXP");

    // 3. Register Movement
    const { error: movError } = await supabase
        .from('movimientos_financieros')
        .insert({
            fecha: fecha,
            tipo: 'EGRESO',
            categoria: 'PROVEEDORES',
            descripcion: `Pago Factura Proveedor ${cxp.numero_factura || ''}`,
            monto: valor,
            cuenta_id: cuentaBancariaId,
            referencia: cxp.numero_factura
        });

    if (movError) throw new Error("Failed to create financial movement");

    // 4. Update Bank Balance
    const { data: bank } = await supabase.from('cuentas_bancarias').select('saldo').eq('id', cuentaBancariaId).single();
    if (bank) {
        await supabase
            .from('cuentas_bancarias')
            .update({ saldo: (Number(bank.saldo) || 0) - valor })
            .eq('id', cuentaBancariaId);
    }

    revalidatePath("/dashboard/sistema/suministro");
    revalidatePath("/dashboard/sistema/financiera");
}

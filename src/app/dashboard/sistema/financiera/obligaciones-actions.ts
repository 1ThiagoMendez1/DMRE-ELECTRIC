"use server";

import { createClient } from "@/utils/supabase/server";
import { ObligacionFinanciera } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// =============================================
// OBLIGACIONES FINANCIERAS
// =============================================


function mapObligacionToUI(db: any): ObligacionFinanciera {
    return {
        id: db.id,
        tipo: db.tipo || "PRESTAMO",
        entidad: db.entidad,
        descripcion: db.descripcion,
        montoPrestado: Number(db.monto_original) || 0,
        tasaInteres: Number(db.tasa_interes) || 0,
        plazoMeses: db.plazo_meses || 0,
        fechaInicio: db.fecha_inicio ? new Date(db.fecha_inicio) : new Date(),
        fechaFin: db.fecha_fin ? new Date(db.fecha_fin) : undefined,
        valorCuota: Number(db.valor_cuota) || 0,
        cuotasPagadas: db.cuotas_pagadas || 0,
        saldoCapital: Number(db.saldo_capital) || Number(db.monto_original) || 0,
        estado: db.estado || "ACTIVO",
        cuentaId: db.cuenta_id,
        observaciones: db.observaciones,
        pagos: db.obligaciones_pagos ? db.obligaciones_pagos.map((p: any) => ({
            id: p.id,
            fecha: new Date(p.fecha),
            valor: Number(p.valor),
            interes: Number(p.interes),
            capital: Number(p.capital),
            saldoRestante: Number(p.saldo_restante)
        })) : []
    };
}

function mapObligacionToDB(ui: Partial<ObligacionFinanciera>) {
    return {
        tipo: ui.tipo,
        entidad: ui.entidad,
        descripcion: ui.descripcion,
        monto_original: ui.montoPrestado,
        tasa_interes: ui.tasaInteres,
        plazo_meses: ui.plazoMeses,
        fecha_inicio: ui.fechaInicio,
        fecha_fin: ui.fechaFin,
        valor_cuota: ui.valorCuota,
        cuotas_pagadas: ui.cuotasPagadas,
        saldo_capital: ui.saldoCapital,
        estado: ui.estado,
        cuenta_id: ui.cuentaId,
        observaciones: ui.observaciones,
    };
}

export async function getObligacionesFinancierasAction(): Promise<ObligacionFinanciera[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("obligaciones_financieras")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching obligaciones_financieras:", error);
        throw new Error("Failed to fetch obligaciones_financieras");
    }

    return data.map(mapObligacionToUI);
}

export async function getObligacionFinancieraByIdAction(id: string): Promise<ObligacionFinanciera | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("obligaciones_financieras")
        .select("*, obligaciones_pagos(*)")
        .eq("id", id)
        .single();

    if (error) {
        // If not found, return null
        if (error.code === 'PGRST116') return null;
        console.error("Error fetching obligacion:", error);
        throw new Error("Failed to fetch obligacion");
    }

    return mapObligacionToUI(data);
}

export async function registrarPagoObligacionAction(pago: {
    obligacionId: string;
    fecha: Date;
    valor: number;
    interes: number;
    capital: number;
    saldoRestante: number;
    cuentaBancariaId?: string; // Optional: to record transaction
}): Promise<ObligacionFinanciera> {
    const supabase = await createClient();

    // 1. Insert Payment
    const { error: payError } = await supabase
        .from("obligaciones_pagos")
        .insert({
            obligacion_id: pago.obligacionId,
            fecha: pago.fecha,
            valor: pago.valor,
            interes: pago.interes,
            capital: pago.capital,
            saldo_restante: pago.saldoRestante
        });

    if (payError) throw new Error("Error registrando pago: " + payError.message);

    // 2. If Bank Account involved, create financial movement (Egreso)
    if (pago.cuentaBancariaId) {
        await supabase.from("movimientos_financieros").insert({
            tipo: "EGRESO",
            categoria: "PRESTAMOS",
            concepto: "Pago Cuota Obligación",
            descripcion: `Abono a obligación ${pago.obligacionId}`,
            valor: pago.valor,
            fecha: pago.fecha,
            cuenta_id: pago.cuentaBancariaId
        });

        // Update bank balance trigger handles the rest or we do RPC
        await supabase.rpc("update_cuenta_saldo", {
            cuenta_uuid: pago.cuentaBancariaId,
            delta_valor: -pago.valor
        });
    }

    // 3. Trigger in SQL updates the parent 'saldo_capital'

    revalidatePath("/dashboard/sistema/financiera");

    // Return updated obligation
    const { data: updatedObligacion } = await supabase
        .from("obligaciones_financieras")
        .select("*, obligaciones_pagos(*)")
        .eq("id", pago.obligacionId)
        .single();

    return {
        ...mapObligacionToUI(updatedObligacion),
        pagos: updatedObligacion.obligaciones_pagos ? updatedObligacion.obligaciones_pagos.map((p: any) => ({
            id: p.id,
            fecha: new Date(p.fecha),
            valor: Number(p.valor),
            interes: Number(p.interes),
            capital: Number(p.capital),
            saldoRestante: Number(p.saldo_restante)
        })) : []
    };
}

export async function createObligacionFinancieraAction(obligacion: Omit<ObligacionFinanciera, "id">): Promise<ObligacionFinanciera> {
    const supabase = await createClient();
    const dbData = mapObligacionToDB(obligacion);

    const { data, error } = await supabase
        .from("obligaciones_financieras")
        .insert(dbData)
        .select("*, obligaciones_pagos(*)")
        .single();

    if (error) {
        console.error("Error creating obligacion_financiera:", error);
        throw new Error("Failed to create obligacion_financiera");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapObligacionToUI(data);
}

export async function updateObligacionFinancieraAction(id: string, obligacion: Partial<ObligacionFinanciera>): Promise<ObligacionFinanciera> {
    const supabase = await createClient();
    const dbData = mapObligacionToDB(obligacion);

    const { data, error } = await supabase
        .from("obligaciones_financieras")
        .update(dbData)
        .eq("id", id)
        .select("*, obligaciones_pagos(*)")
        .single();

    if (error) {
        console.error("Error updating obligacion_financiera:", error);
        throw new Error("Failed to update obligacion_financiera");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapObligacionToUI(data);
}

export async function deleteObligacionFinancieraAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("obligaciones_financieras")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting obligacion_financiera:", error);
        throw new Error("Failed to delete obligacion_financiera");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return true;
}

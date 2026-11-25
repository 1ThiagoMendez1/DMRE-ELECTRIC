"use server";

import { createClient } from "@/utils/supabase/server";
import { ObligacionFinanciera } from "@/types/sistema";
import { revalidatePath } from "next/cache";
import { calculatePaymentBreakdown } from "@/lib/financial-math";

// =============================================
// OBLIGACIONES FINANCIERAS
// =============================================


function parseObligationDetails(raw: string | null | undefined) {
    try {
        const value = JSON.parse(raw || "");
        if (value && value._dmreObligacionV1 === true) {
            return {
                notes: String(value.notes || ""),
                tipoCuota: value.tipoCuota === "VARIABLE" ? "VARIABLE" as const : "FIJA" as const,
                soporteUrl: typeof value.soporteUrl === "string" ? value.soporteUrl : undefined
            };
        }
    } catch { /* Previous notes can be normal text. */ }
    return { notes: raw || "", tipoCuota: "FIJA" as const, soporteUrl: undefined };
}

function encodeObligationDetails(ui: Partial<ObligacionFinanciera>) {
    if (ui.observaciones === undefined && ui.tipoCuota === undefined && ui.soporteUrl === undefined) return undefined;
    return JSON.stringify({
        _dmreObligacionV1: true,
        notes: ui.observaciones || "",
        tipoCuota: ui.tipoCuota === "VARIABLE" ? "VARIABLE" : "FIJA",
        soporteUrl: ui.soporteUrl || ""
    });
}

function mapObligacionToUI(db: any): ObligacionFinanciera {
    const details = parseObligationDetails(db.observaciones);
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
        saldoCapital: db.saldo_capital === null || db.saldo_capital === undefined ? Number(db.monto_original || 0) : Number(db.saldo_capital),
        estado: db.estado || "ACTIVO",
        cuentaId: db.cuenta_id,
        observaciones: details.notes,
        tipoCuota: details.tipoCuota,
        soporteUrl: details.soporteUrl,
        pagos: db.obligaciones_pagos ? db.obligaciones_pagos.map((p: any) => ({
            id: p.id,
            fecha: new Date(p.fecha),
            valor: Number(p.valor),
            interes: Number(p.interes),
            capital: Number(p.capital),
            saldoRestante: Number(p.saldo_restante),
            comprobanteUrl: p.comprobante_url || (typeof p.nota === "string" && p.nota.startsWith("DMRE_SOPORTE:") ? p.nota.slice("DMRE_SOPORTE:".length) : undefined)
        })) : []
    };
}

function getSafeMiddayUTC(dateStrOrObj: Date | string | undefined | null): string | undefined {
    if (!dateStrOrObj) return undefined;
    const d = new Date(dateStrOrObj);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
}

function mapObligacionToDB(ui: Partial<ObligacionFinanciera>) {
    const raw = {
        tipo: ui.tipo,
        entidad: ui.entidad,
        descripcion: ui.descripcion,
        monto_original: ui.montoPrestado,
        tasa_interes: ui.tasaInteres,
        plazo_meses: ui.plazoMeses,
        fecha_inicio: getSafeMiddayUTC(ui.fechaInicio),
        fecha_fin: getSafeMiddayUTC(ui.fechaFin),
        valor_cuota: ui.valorCuota,
        cuotas_pagadas: ui.cuotasPagadas,
        saldo_capital: ui.saldoCapital,
        estado: ui.estado,
        cuenta_id: ui.cuentaId,
        observaciones: encodeObligationDetails(ui),
    };
    return Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined));
}

export async function getObligacionesFinancierasAction(): Promise<ObligacionFinanciera[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("obligaciones_financieras")
        .select("*, obligaciones_pagos(*)")
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
    tipoPago?: "CUOTA" | "ABONO_CAPITAL";
    comprobanteUrl?: string;
}): Promise<ObligacionFinanciera> {
    const supabase = await createClient();

    if (!Number.isFinite(pago.valor) || pago.valor <= 0 || pago.capital < 0 || pago.interes < 0 ||
        Math.abs(pago.valor - pago.capital - pago.interes) > 0.05) {
        throw new Error("El desglose del pago no coincide con su valor total.");
    }
    const { data: vigente, error: lecturaError } = await supabase
        .from("obligaciones_financieras")
        .select("saldo_capital,monto_original,tasa_interes,estado")
        .eq("id", pago.obligacionId).single();
    if (lecturaError || !vigente || vigente.estado === "CANCELADO" || vigente.estado === "PAGADO")
        throw new Error("La obligación no se encuentra activa.");
    const saldo = vigente.saldo_capital == null ? Number(vigente.monto_original) : Number(vigente.saldo_capital);
    const calculado = calculatePaymentBreakdown(saldo, Number(vigente.tasa_interes || 0), pago.valor, pago.tipoPago === "ABONO_CAPITAL");
    if (Math.abs(calculado.interes - pago.interes) > 0.05 || Math.abs(calculado.capital - pago.capital) > 0.05)
        throw new Error("El desglose del pago ya no coincide con el saldo actual. Actualice el detalle antes de confirmar.");
    if (Math.abs(calculado.saldoRestante - pago.saldoRestante) > 0.05)
        throw new Error("El saldo proyectado no coincide con el crédito.");

    // 1. Insert Payment
    const { error: payError } = await supabase
        .from("obligaciones_pagos")
        .insert({
            obligacion_id: pago.obligacionId,
            fecha: getSafeMiddayUTC(pago.fecha),
            valor: pago.valor,
            interes: pago.interes,
            capital: pago.capital,
            saldo_restante: pago.saldoRestante,
            nota: pago.comprobanteUrl ? `DMRE_SOPORTE:${pago.comprobanteUrl}` : null
        });

    if (payError) throw new Error("Error registrando pago: " + payError.message);

    // 2. If Bank Account involved, create financial movement (Egreso)
    if (pago.cuentaBancariaId) {
        const { error: movError } = await supabase.from("movimientos_financieros").insert({
            tipo: "EGRESO",
            categoria: "PRESTAMOS",
            concepto: "Pago Cuota Obligación",
            descripcion: `Abono a obligación ${pago.obligacionId}`,
            valor: pago.valor,
            fecha: getSafeMiddayUTC(pago.fecha),
            cuenta_id: pago.cuentaBancariaId,
            comprobante_url: pago.comprobanteUrl
        });
        if (movError) throw new Error("Pago registrado en obligaciones, pero falló el movimiento bancario. Requiere conciliación: " + movError.message);

        // Actualizar saldo únicamente si el movimiento ya fue registrado.
        const { error: saldoError } = await supabase.rpc("update_cuenta_saldo", {
            cuenta_uuid: pago.cuentaBancariaId,
            delta_valor: -pago.valor
        });
        if (saldoError) throw new Error("Pago y movimiento registrados, pero falló la actualización del saldo bancario. Requiere conciliación.");
    }

    // 3. Trigger in SQL updates the parent 'saldo_capital'

    revalidatePath("/dashboard/sistema/financiera");

    // Return updated obligation
    const { data: updatedObligacion, error: updatedError } = await supabase
        .from("obligaciones_financieras")
        .select("*, obligaciones_pagos(*)")
        .eq("id", pago.obligacionId)
        .single();

    if (updatedError || !updatedObligacion) throw new Error("Pago registrado, pero no pudo actualizarse la vista. Consulte el historial antes de repetirlo.");
    return {
        ...mapObligacionToUI(updatedObligacion),
        pagos: updatedObligacion.obligaciones_pagos ? updatedObligacion.obligaciones_pagos.map((p: any) => ({
            id: p.id,
            fecha: new Date(p.fecha),
            valor: Number(p.valor),
            interes: Number(p.interes),
            capital: Number(p.capital),
            saldoRestante: Number(p.saldo_restante),
            comprobanteUrl: p.comprobante_url || (typeof p.nota === "string" && p.nota.startsWith("DMRE_SOPORTE:") ? p.nota.slice("DMRE_SOPORTE:".length) : undefined)
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

    if (obligacion.cuentaId && obligacion.montoPrestado > 0) {
        const { error: movError } = await supabase.from("movimientos_financieros").insert({
            tipo: "INGRESO",
            categoria: "PRESTAMOS",
            concepto: "Desembolso de Obligación",
            descripcion: `Préstamo de ${obligacion.entidad}`,
            valor: obligacion.montoPrestado,
            fecha: obligacion.fechaInicio,
            cuenta_id: obligacion.cuentaId
        });

        if (movError) throw new Error("Obligación creada, pero falló el movimiento del desembolso; concilie antes de repetir.");
        const { error: balanceError } = await supabase.rpc("update_cuenta_saldo", {
            cuenta_uuid: obligacion.cuentaId,
            delta_valor: obligacion.montoPrestado
        });
        if (balanceError) throw new Error("Obligación creada, pero no se actualizó la cuenta bancaria; requiere conciliación.");
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

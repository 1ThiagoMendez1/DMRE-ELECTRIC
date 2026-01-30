"use server";

import { createClient } from "@/utils/supabase/server";
import { CuentaBancaria, MovimientoFinanciero } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// =============================================
// CUENTAS BANCARIAS
// =============================================

function mapCuentaToUI(db: any): CuentaBancaria {
    return {
        id: db.id,
        nombre: db.nombre,
        banco: db.banco,
        numeroCuenta: db.numero_cuenta,
        tipo: db.tipo || "BANCO",
        saldoActual: Number(db.saldo) || 0,
        moneda: db.moneda || "COP",
        estado: db.estado || "ACTIVA",
        // Extended
        titular: db.titular,
    };
}

function mapCuentaToDB(ui: Partial<CuentaBancaria>) {
    return {
        nombre: ui.nombre,
        banco: ui.banco,
        numero_cuenta: ui.numeroCuenta,
        tipo: ui.tipo,
        saldo: ui.saldoActual,
        moneda: ui.moneda || "COP",
        estado: ui.estado || "ACTIVA",
        titular: ui.titular,
    };
}

export async function getCuentasBancariasAction(): Promise<CuentaBancaria[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("cuentas_bancarias")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching cuentas_bancarias:", error);
        throw new Error("Failed to fetch cuentas_bancarias");
    }

    return data.map(mapCuentaToUI);
}

export async function createCuentaBancariaAction(cuenta: Omit<CuentaBancaria, "id">): Promise<CuentaBancaria> {
    const supabase = await createClient();
    const dbData = mapCuentaToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_bancarias")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating cuenta_bancaria:", error);
        throw new Error("Failed to create cuenta_bancaria");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapCuentaToUI(data);
}

export async function updateCuentaBancariaAction(id: string, cuenta: Partial<CuentaBancaria>): Promise<CuentaBancaria> {
    const supabase = await createClient();
    const dbData = mapCuentaToDB(cuenta);

    const { data, error } = await supabase
        .from("cuentas_bancarias")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating cuenta_bancaria:", error);
        throw new Error("Failed to update cuenta_bancaria");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapCuentaToUI(data);
}

// =============================================
// MOVIMIENTOS FINANCIEROS
// =============================================

function mapMovimientoToUI(db: any): MovimientoFinanciero {
    return {
        id: db.id,
        fecha: new Date(db.fecha),
        tipo: db.tipo,
        categoria: db.categoria,
        descripcion: db.descripcion,
        monto: Number(db.monto) || 0,
        cuentaId: db.cuenta_id,
        // Extended
        referencia: db.referencia,
        comprobanteUrl: db.comprobante_url,
        usuarioId: db.usuario_id,
        conciliado: db.conciliado,
    };
}

function mapMovimientoToDB(ui: Partial<MovimientoFinanciero>) {
    return {
        fecha: ui.fecha,
        tipo: ui.tipo,
        categoria: ui.categoria,
        descripcion: ui.descripcion,
        monto: ui.monto,
        cuenta_id: ui.cuentaId,
        referencia: ui.referencia,
        comprobante_url: ui.comprobanteUrl,
        usuario_id: ui.usuarioId,
        conciliado: ui.conciliado ?? false,
    };
}

export async function getMovimientosFinancierosAction(): Promise<MovimientoFinanciero[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("movimientos_financieros")
        .select("*")
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching movimientos_financieros:", error);
        throw new Error("Failed to fetch movimientos_financieros");
    }

    return data.map(mapMovimientoToUI);
}

export async function createMovimientoFinancieroAction(movimiento: Omit<MovimientoFinanciero, "id">): Promise<MovimientoFinanciero> {
    const supabase = await createClient();
    const dbData = mapMovimientoToDB(movimiento);

    const { data, error } = await supabase
        .from("movimientos_financieros")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating movimiento_financiero:", error);
        throw new Error("Failed to create movimiento_financiero");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapMovimientoToUI(data);
}

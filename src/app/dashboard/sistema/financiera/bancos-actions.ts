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
        tipoCuenta: db.tipo_cuenta, // AHORROS, CORRIENTE
        tipo: db.tipo || "BANCO",
        saldoActual: Number(db.saldo_actual) || 0,
        saldoInicial: Number(db.saldo_inicial) || 0,
        activa: db.activa ?? true,
        principal: db.principal ?? false,
        notas: db.notas,
        titular: db.titular,
    };
}

function mapCuentaToDB(ui: Partial<CuentaBancaria>) {
    return {
        nombre: ui.nombre,
        banco: ui.banco,
        numero_cuenta: ui.numeroCuenta,
        tipo_cuenta: ui.tipoCuenta,
        tipo: ui.tipo,
        saldo_actual: ui.saldoActual,
        saldo_inicial: ui.saldoInicial,
        activa: ui.activa,
        principal: ui.principal,
        notas: ui.notas,
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
        categoria: db.categoria || "OTROS",
        concepto: db.concepto,
        descripcion: db.descripcion,
        valor: Number(db.valor) || 0,
        tercero: db.tercero,
        cuentaId: db.cuenta_id,
        // Extended fields
        facturaId: db.factura_id,
        trabajoId: db.trabajo_id,
        cuentaPorPagarId: db.cuenta_por_pagar_id,
        numeroDocumento: db.numero_documento,
        comprobanteUrl: db.comprobante_url,
        registradoPor: db.registrado_por,
        aprobado: db.aprobado ?? false,
        aprobadoPor: db.aprobado_por,
    };
}

function mapMovimientoToDB(ui: Partial<MovimientoFinanciero>) {
    return {
        fecha: ui.fecha,
        tipo: ui.tipo,
        categoria: ui.categoria,
        concepto: ui.concepto,
        descripcion: ui.descripcion,
        valor: ui.valor,
        tercero: ui.tercero,
        cuenta_id: ui.cuentaId,
        factura_id: ui.facturaId,
        trabajo_id: ui.trabajoId,
        cuenta_por_pagar_id: ui.cuentaPorPagarId,
        numero_documento: ui.numeroDocumento,
        comprobante_url: ui.comprobanteUrl,
        registrado_por: ui.registradoPor,
        aprobado: ui.aprobado,
        aprobado_por: ui.aprobadoPor,
    };
}

export async function getMovimientosFinancierosAction(): Promise<MovimientoFinanciero[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("movimientos_financieros")
        .select("*, cuentas_bancarias(id, nombre)")
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching movimientos_financieros:", error);
        throw new Error("Failed to fetch movimientos_financieros");
    }

    return data.map((row: any) => ({
        ...mapMovimientoToUI(row),
        cuenta: row.cuentas_bancarias ? { id: row.cuentas_bancarias.id, nombre: row.cuentas_bancarias.nombre } : undefined,
    }));
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

    // Update account balance
    if (movimiento.cuentaId && movimiento.valor) {
        const delta = movimiento.tipo === "INGRESO" ? movimiento.valor : -movimiento.valor;
        await supabase.rpc("update_cuenta_saldo", { cuenta_uuid: movimiento.cuentaId, delta_valor: delta });
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapMovimientoToUI(data);
}

export async function updateMovimientoFinancieroAction(id: string, movimiento: Partial<MovimientoFinanciero>): Promise<MovimientoFinanciero> {
    const supabase = await createClient();
    const dbData = mapMovimientoToDB(movimiento);

    const { data, error } = await supabase
        .from("movimientos_financieros")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating movimiento_financiero:", error);
        throw new Error("Failed to update movimiento_financiero");
    }

    revalidatePath("/dashboard/sistema/financiera");
    return mapMovimientoToUI(data);
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { CreditoEmpleado, Empleado } from "@/types/sistema";
import { revalidatePath } from "next/cache";

function mapToUI(db: any, empleado?: any): CreditoEmpleado {
    return {
        id: db.id,
        empleadoId: db.empleado_id,
        empleado: empleado ? {
            id: empleado.id,
            nombreCompleto: empleado.nombre_completo,
            cedula: empleado.cedula || "",
            cargo: empleado.cargo || "",
            salarioBase: Number(empleado.salario_base) || 0,
            fechaIngreso: new Date(empleado.fecha_ingreso || empleado.created_at),
            estado: empleado.estado || "ACTIVO",
        } : {} as Empleado,
        montoPrestado: Number(db.monto_aprobado || db.monto_solicitado) || 0,
        plazoMeses: db.plazo_meses || 0,
        cuotaMensual: Number(db.cuota_mensual) || 0,
        saldoPendiente: Number(db.saldo_pendiente) || 0,
        fechaOtorgado: new Date(db.fecha_aprobacion || db.fecha_solicitud || db.created_at),
        estado: db.estado || "PENDIENTE",
        // Extended
        tipo: db.tipo,
        concepto: db.concepto,
        montoSolicitado: Number(db.monto_solicitado) || 0,
        cuotasPagadas: db.cuotas_pagadas || 0,
        fechaSolicitud: db.fecha_solicitud ? new Date(db.fecha_solicitud) : undefined,
        fechaInicioDescuento: db.fecha_inicio_descuento ? new Date(db.fecha_inicio_descuento) : undefined,
        observaciones: db.observaciones,
    };
}

function mapToDB(ui: Partial<CreditoEmpleado>) {
    return {
        empleado_id: ui.empleadoId,
        tipo: ui.tipo || "PRESTAMO",
        concepto: ui.concepto,
        monto_solicitado: ui.montoSolicitado || ui.montoPrestado,
        monto_aprobado: ui.montoPrestado,
        plazo_meses: ui.plazoMeses,
        cuota_mensual: ui.cuotaMensual,
        cuotas_pagadas: ui.cuotasPagadas || 0,
        saldo_pendiente: ui.saldoPendiente,
        fecha_solicitud: ui.fechaSolicitud,
        fecha_aprobacion: ui.fechaOtorgado,
        fecha_inicio_descuento: ui.fechaInicioDescuento,
        estado: ui.estado,
        observaciones: ui.observaciones,
    };
}

export async function getCreditosEmpleadosAction(): Promise<CreditoEmpleado[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("creditos_empleados")
        .select(`
            *,
            empleados (id, nombre_completo, cedula, cargo, salario_base, fecha_ingreso, estado)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching creditos_empleados:", error);
        throw new Error("Failed to fetch creditos_empleados");
    }

    return data.map((c: any) => mapToUI(c, c.empleados));
}

export async function createCreditoEmpleadoAction(credito: Omit<CreditoEmpleado, "id">): Promise<CreditoEmpleado> {
    const supabase = await createClient();
    const dbData = mapToDB(credito);

    const { data, error } = await supabase
        .from("creditos_empleados")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating credito_empleado:", error);
        throw new Error("Failed to create credito_empleado");
    }

    revalidatePath("/dashboard/sistema/creditos");
    return mapToUI(data);
}

export async function updateCreditoEmpleadoAction(id: string, credito: Partial<CreditoEmpleado>): Promise<CreditoEmpleado> {
    const supabase = await createClient();
    const dbData = mapToDB(credito);

    const { data, error } = await supabase
        .from("creditos_empleados")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating credito_empleado:", error);
        throw new Error("Failed to update credito_empleado");
    }

    revalidatePath("/dashboard/sistema/creditos");
    return mapToUI(data);
}

export async function deleteCreditoEmpleadoAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("creditos_empleados")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting credito_empleado:", error);
        throw new Error("Failed to delete credito_empleado");
    }

    revalidatePath("/dashboard/sistema/creditos");
    return true;
}

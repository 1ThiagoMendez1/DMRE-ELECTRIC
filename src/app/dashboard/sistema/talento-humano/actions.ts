"use server";

import { createClient } from "@/utils/supabase/server";
import { Empleado, LiquidacionNomina } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// DB -> UI mapping
function mapToUI(db: any): Empleado {
    return {
        id: db.id,
        nombreCompleto: db.nombre_completo,
        cedula: db.cedula || "",
        cargo: db.cargo || "",
        salarioBase: Number(db.salario_base) || 0,
        fechaIngreso: new Date(db.fecha_ingreso || db.created_at),
        estado: db.estado || "ACTIVO",
        // Extended fields from DB
        codigo: db.codigo,
        tipoDocumento: db.tipo_documento,
        fechaNacimiento: db.fecha_nacimiento ? new Date(db.fecha_nacimiento) : undefined,
        genero: db.genero,
        direccion: db.direccion,
        ciudad: db.ciudad,
        telefono: db.telefono,
        correo: db.correo,
        contactoEmergencia: db.contacto_emergencia,
        telefonoEmergencia: db.telefono_emergencia,
        area: db.area,
        tipoContrato: db.tipo_contrato,
        fechaRetiro: db.fecha_retiro ? new Date(db.fecha_retiro) : undefined,
        auxilioTransporte: db.auxilio_transporte,
        eps: db.eps,
        arl: db.arl,
        fondoPensiones: db.fondo_pensiones,
        cajaCompensacion: db.caja_compensacion,
        banco: db.banco,
        tipoCuentaBanco: db.tipo_cuenta_banco,
        numeroCuentaBanco: db.numero_cuenta_banco,
        fotoUrl: db.foto_url,
        observaciones: db.observaciones,
        archivos: db.archivos ? (typeof db.archivos === 'string' ? JSON.parse(db.archivos) : db.archivos) : [],
    };
}

// UI -> DB mapping
function mapToDB(ui: Partial<Empleado>) {
    return {
        codigo: ui.codigo,
        nombre_completo: ui.nombreCompleto,
        cedula: ui.cedula,
        tipo_documento: ui.tipoDocumento || "CC",
        fecha_nacimiento: ui.fechaNacimiento,
        genero: ui.genero,
        direccion: ui.direccion,
        ciudad: ui.ciudad,
        telefono: ui.telefono,
        correo: ui.correo,
        contacto_emergencia: ui.contactoEmergencia,
        telefono_emergencia: ui.telefonoEmergencia,
        cargo: ui.cargo,
        area: ui.area,
        tipo_contrato: ui.tipoContrato || "INDEFINIDO",
        fecha_ingreso: ui.fechaIngreso,
        fecha_retiro: ui.fechaRetiro,
        salario_base: ui.salarioBase,
        auxilio_transporte: ui.auxilioTransporte ?? true,
        eps: ui.eps,
        arl: ui.arl,
        fondo_pensiones: ui.fondoPensiones,
        caja_compensacion: ui.cajaCompensacion,
        banco: ui.banco,
        tipo_cuenta_banco: ui.tipoCuentaBanco,
        numero_cuenta_banco: ui.numeroCuentaBanco,
        estado: ui.estado || "ACTIVO",
        foto_url: ui.fotoUrl,
        observaciones: ui.observaciones,
        archivos: ui.archivos ? JSON.stringify(ui.archivos) : '[]',
    };
}

async function getNextCode(supabase: any) {
    const { data } = await supabase
        .from("empleados")
        .select("codigo")
        .ilike("codigo", "EMP-%")
        .order("codigo", { ascending: false })
        .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0].codigo) {
        const parts = data[0].codigo.split("-");
        if (parts.length === 2) {
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextNum = num + 1;
        }
    }
    return `EMP-${nextNum.toString().padStart(3, "0")}`;
}

export async function getEmpleadosAction(): Promise<Empleado[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("empleados")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching empleados:", error);
        throw new Error("Failed to fetch empleados");
    }

    return data.map(mapToUI);
}

export async function createEmpleadoAction(empleadoInput: Omit<Empleado, "id">): Promise<Empleado> {
    const supabase = await createClient();

    // Create mutable copy for code generation
    const empleado = { ...empleadoInput } as Partial<Empleado>;

    if (!empleado.codigo || empleado.codigo.trim() === "") {
        empleado.codigo = await getNextCode(supabase);
    }

    const dbData = mapToDB(empleado);
    const { data, error } = await supabase
        .from("empleados")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating empleado:", error);
        throw new Error("Failed to create empleado");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return mapToUI(data);
}

export async function updateEmpleadoAction(id: string, empleado: Partial<Empleado>): Promise<Empleado> {
    const supabase = await createClient();
    const dbData = mapToDB(empleado);

    const { data, error } = await supabase
        .from("empleados")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating empleado:", error);
        throw new Error("Failed to update empleado");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return mapToUI(data);
}

export async function deleteEmpleadoAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("empleados")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting empleado:", error);
        throw new Error("Failed to delete empleado");
    }

    revalidatePath("/dashboard/sistema/talento-humano");
    return true;
}

export async function payNominaAction(empleadoId: string, periodo: string, valor: number, cuentaBancariaId: string, fecha: Date): Promise<void> {
    const supabase = await createClient();

    // 1. Register Movement
    const { error: movError } = await supabase
        .from('movimientos_financieros')
        .insert({
            fecha: fecha,
            tipo: 'EGRESO',
            categoria: 'NOMINA',
            descripcion: `Pago Nómina ${periodo}`,
            valor: valor,
            cuenta_id: cuentaBancariaId,
            referencia: `EMP-${empleadoId}`
        });

    if (movError) {
        console.error("Error creating nomina movement:", movError);
        throw new Error("Failed to create financial movement: " + movError.message);
    }

    // 2. Update Bank Balance
    await supabase.rpc("update_cuenta_saldo", {
        cuenta_uuid: cuentaBancariaId,
        delta_valor: -valor
    });

    revalidatePath("/dashboard/sistema/talento-humano");
    revalidatePath("/dashboard/sistema/financiera");
}

export async function getLiquidacionesAction(): Promise<LiquidacionNomina[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pagos_nomina')
        .select(`
            *,
            empleado:empleados(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching liquidaciones (pagos_nomina):", error);
        return [];
    }

    return data.map((d: any) => ({
        id: d.id,
        periodo: d.periodo,
        empleadoId: d.empleado_id,
        empleado: mapToUI(d.empleado),
        totalDevengado: Number(d.total_devengado),
        totalDeducido: Number(d.total_deducido),
        netoPagar: Number(d.neto_pagar),
        estado: d.estado,
        detalle: typeof d.detalles === 'string' ? d.detalles : JSON.stringify(d.detalles)
    }));
}

export async function createLiquidacionAction(liquidacion: Omit<LiquidacionNomina, "id" | "empleado">): Promise<LiquidacionNomina> {
    const supabase = await createClient();

    const dbData = {
        periodo: liquidacion.periodo,
        empleado_id: liquidacion.empleadoId,
        total_devengado: liquidacion.totalDevengado,
        total_deducido: liquidacion.totalDeducido,
        neto_pagar: liquidacion.netoPagar,
        estado: liquidacion.estado,
        detalles: JSON.parse(liquidacion.detalle) // DB expects JSONB
    };

    const { data, error } = await supabase
        .from('pagos_nomina')
        .insert(dbData)
        .select(`
            *,
            empleado:empleados(*)
        `)
        .single();

    if (error) {
        console.error("Error creating liquidacion (pago_nomina):", error);
        throw new Error("Failed to create liquidacion");
    }

    revalidatePath("/dashboard/sistema/talento-humano");

    return {
        id: data.id,
        periodo: data.periodo,
        empleadoId: data.empleado_id,
        empleado: mapToUI(data.empleado),
        totalDevengado: Number(data.total_devengado),
        totalDeducido: Number(data.total_deducido),
        netoPagar: Number(data.neto_pagar),
        estado: data.estado,
        detalle: JSON.stringify(data.detalles)
    };
}

export async function updateLiquidacionEstadoAction(id: string, estado: 'PENDIENTE' | 'PAGADO'): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('pagos_nomina')
        .update({ estado })
        .eq('id', id);

    if (error) {
        console.error("Error updating liquidacion status:", error);
        throw new Error("Failed to update status");
    }
    revalidatePath("/dashboard/sistema/talento-humano");
}

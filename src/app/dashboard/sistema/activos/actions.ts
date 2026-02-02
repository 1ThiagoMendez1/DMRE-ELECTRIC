"use server";

import { createClient } from "@/utils/supabase/server";
import { Vehiculo, GastoVehiculo } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// =============================================
// VEHICULOS
// =============================================

function mapVehiculoToUI(db: any): Vehiculo {
    return {
        id: db.id,
        placa: db.placa,
        marcaModelo: `${db.marca || ""} ${db.modelo || ""}`.trim(),
        conductorAsignado: db.conductor_asignado || "",
        vencimientoSoat: new Date(db.vencimiento_soat || Date.now()),
        vencimientoTecnomecanica: new Date(db.vencimiento_tecnomecanica || Date.now()),
        vencimientoSeguro: new Date(db.vencimiento_seguro || Date.now()),
        estado: db.estado || "OPERATIVO",
        kilometrajeActual: Number(db.kilometraje_actual) || 0,
        ano: db.anno || new Date().getFullYear(),
        color: db.color || "",
        fechaRegistro: db.created_at ? new Date(db.created_at) : undefined,
        // Extended
        tipo: db.tipo,
        marca: db.marca,
        modelo: db.modelo,
        conductorId: db.conductor_id,
        vencimientoLicenciaTransito: db.vencimiento_licencia_transito ? new Date(db.vencimiento_licencia_transito) : undefined,
        observaciones: db.observaciones,
    };
}

function mapVehiculoToDB(ui: Partial<Vehiculo>) {
    // Split marcaModelo into marca and modelo if provided combined
    let marca = ui.marca;
    let modelo = ui.modelo;
    if (ui.marcaModelo && (!marca || !modelo)) {
        const parts = ui.marcaModelo.split(" ");
        marca = parts[0] || "";
        modelo = parts.slice(1).join(" ") || "";
    }

    return {
        placa: ui.placa,
        tipo: ui.tipo,
        marca,
        modelo,
        anno: ui.ano,
        color: ui.color,
        conductor_asignado: ui.conductorAsignado,
        conductor_id: ui.conductorId,
        vencimiento_soat: ui.vencimientoSoat,
        vencimiento_tecnomecanica: ui.vencimientoTecnomecanica,
        vencimiento_seguro: ui.vencimientoSeguro,
        vencimiento_licencia_transito: ui.vencimientoLicenciaTransito,
        kilometraje_actual: ui.kilometrajeActual,
        estado: ui.estado || "ACTIVO",
        observaciones: ui.observaciones,
    };
}

export async function getVehiculosAction(): Promise<Vehiculo[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("vehiculos")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching vehiculos:", error);
        throw new Error("Failed to fetch vehiculos");
    }

    return data.map(mapVehiculoToUI);
}

export async function createVehiculoAction(vehiculo: Omit<Vehiculo, "id">): Promise<Vehiculo> {
    const supabase = await createClient();
    const dbData = mapVehiculoToDB(vehiculo);

    const { data, error } = await supabase
        .from("vehiculos")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating vehiculo:", error);
        throw new Error("Failed to create vehiculo");
    }

    revalidatePath("/dashboard/sistema/activos");
    return mapVehiculoToUI(data);
}

export async function updateVehiculoAction(id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> {
    const supabase = await createClient();
    const dbData = mapVehiculoToDB(vehiculo);

    const { data, error } = await supabase
        .from("vehiculos")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating vehiculo:", error);
        throw new Error("Failed to update vehiculo");
    }

    revalidatePath("/dashboard/sistema/activos");
    return mapVehiculoToUI(data);
}

export async function deleteVehiculoAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("vehiculos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting vehiculo:", error);
        throw new Error("Failed to delete vehiculo");
    }

    revalidatePath("/dashboard/sistema/activos");
    return true;
}

// =============================================
// GASTOS VEHICULOS
// =============================================

function mapGastoToUI(db: any): GastoVehiculo {
    return {
        id: db.id,
        fecha: new Date(db.fecha),
        vehiculoId: db.vehiculo_id,
        vehiculo: db.vehiculos ? {
            id: db.vehiculos.id,
            placa: db.vehiculos.placa,
            marcaModelo: `${db.vehiculos.marca || ""} ${db.vehiculos.modelo || ""}`.trim(),
            // Map minimal required fields or full object if possible
            ...db.vehiculos
        } : { placa: "N/A" } as any,
        tipo: db.tipo || "COMBUSTIBLE",
        kilometraje: Number(db.kilometraje) || 0,
        valor: Number(db.valor) || 0,
        proveedor: db.proveedor || "",
        // Extended
        descripcion: db.descripcion,
        numeroFactura: db.numero_factura,
        responsableId: db.responsable_id,
        observaciones: db.observaciones,
    };
}

// ... unchanged parts ...

function mapGastoToDB(ui: Partial<GastoVehiculo>) {
    return {
        vehiculo_id: ui.vehiculoId,
        fecha: ui.fecha,
        tipo: ui.tipo,
        descripcion: ui.descripcion,
        kilometraje: ui.kilometraje,
        valor: ui.valor,
        proveedor: ui.proveedor,
        numero_factura: ui.numeroFactura,
        responsable_id: ui.responsableId,
        observaciones: ui.observaciones,
    };
}

export async function getGastosVehiculosAction(): Promise<GastoVehiculo[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("gastos_vehiculos")
        .select(`
            *,
            vehiculos (id, placa, marca, modelo)
        `)
        .order("fecha", { ascending: false });

    if (error) {
        console.error("Error fetching gastos_vehiculos:", error);
        throw new Error("Failed to fetch gastos_vehiculos");
    }

    return data.map(mapGastoToUI);
}

export async function createGastoVehiculoAction(gasto: Omit<GastoVehiculo, "id">, cuentaId?: string): Promise<GastoVehiculo> {
    const supabase = await createClient();
    const dbData = mapGastoToDB(gasto);

    const { data: vehiculo } = await supabase.from('vehiculos').select('placa').eq('id', gasto.vehiculoId).single();

    const { data, error } = await supabase
        .from("gastos_vehiculos")
        .insert(dbData)
        .select()
        .single();

    if (error) {
        console.error("Error creating gasto_vehiculo:", error);
        throw new Error("Failed to create gasto_vehiculo: " + error.message);
    }

    // If a bank account is provided, create a financial movement
    if (cuentaId) {
        const { error: movError } = await supabase
            .from("movimientos_financieros")
            .insert({
                tipo: 'EGRESO',
                categoria: 'OTROS', // Or add a VEHICULO category
                concepto: `Gasto Vehículo ${vehiculo?.placa || ''}`,
                descripcion: `${gasto.tipo}: ${gasto.descripcion || ''} - ${gasto.proveedor}`,
                valor: gasto.valor,
                fecha: gasto.fecha,
                cuenta_id: cuentaId
            });

        if (movError) {
            console.error("Error creating financial movement for vehicle expense:", movError);
        } else {
            // Update bank balance
            await supabase.rpc("update_cuenta_saldo", {
                cuenta_uuid: cuentaId,
                delta_valor: -gasto.valor
            });
        }
    }

    revalidatePath("/dashboard/sistema/activos");
    revalidatePath("/dashboard/sistema/financiera");
    return mapGastoToUI(data);
}

export async function deleteGastoVehiculoAction(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from("gastos_vehiculos")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting gasto_vehiculo:", error);
        throw new Error("Failed to delete gasto_vehiculo");
    }

    revalidatePath("/dashboard/sistema/activos");
    return true;
}

"use server";

import { getClientsAction } from "@/app/dashboard/sistema/clientes/actions";
import { getProveedoresAction } from "@/app/dashboard/sistema/suministro/actions";
import { getInventarioAction } from "@/app/dashboard/sistema/inventario/actions";
import { getCodigosTrabajoAction } from "@/app/dashboard/sistema/codigos-trabajo/actions";
import { getVehiculosAction, getGastosVehiculosAction } from "@/app/dashboard/sistema/activos/actions";
import { getCotizacionesAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { getFacturasAction } from "@/app/dashboard/sistema/financiera/actions";
import { getDotacionItemsAction, getEntregasDotacionAction } from "@/app/dashboard/sistema/dotacion/actions";
import { getCuentasPorPagarAction } from "@/app/dashboard/sistema/suministro/cuentas-actions";
import { getCuentasBancariasAction, getMovimientosFinancierosAction } from "@/app/dashboard/sistema/financiera/bancos-actions";
import { getObligacionesFinancierasAction } from "@/app/dashboard/sistema/financiera/obligaciones-actions";
import { getNovedadesNominaAction } from "@/app/dashboard/sistema/talento-humano/novedades-actions";
import { getEmpleadosAction } from "@/app/dashboard/sistema/talento-humano/actions";
import { getUsers } from "@/actions/auth-actions";
import { getOrdenesCompraAction } from "@/app/dashboard/sistema/suministro/ordenes-actions";

export async function getInitialErpDataAction() {
    try {
        const [
            users,
            cotizaciones,
            inventario,
            clientes,
            proveedores,
            codigosTrabajo,
            vehiculos,
            gastosVehiculos,
            facturas,
            dotacionItems,
            entregasDotacion,
            cuentasPorPagar,
            cuentasBancarias,
            movimientosFinancieros,
            obligacionesFinancieras,
            novedadesNomina,
            empleados,
            ordenesCompra,
        ] = await Promise.all([
            getUsers().catch(() => []),
            getCotizacionesAction().catch(() => []),
            getInventarioAction().catch(() => []),
            getClientsAction().catch(() => []),
            getProveedoresAction().catch(() => []),
            getCodigosTrabajoAction().catch(() => []),
            getVehiculosAction().catch(() => []),
            getGastosVehiculosAction().catch(() => []),
            getFacturasAction().catch(() => []),
            getDotacionItemsAction().catch(() => []),
            getEntregasDotacionAction().catch(() => []),
            getCuentasPorPagarAction().catch(() => []),
            getCuentasBancariasAction().catch(() => []),
            getMovimientosFinancierosAction().catch(() => []),
            getObligacionesFinancierasAction().catch(() => []),
            getNovedadesNominaAction().catch(() => []),
            getEmpleadosAction().catch(() => []),
            getOrdenesCompraAction().catch(() => []),
        ]);

        return {
            users,
            cotizaciones,
            inventario,
            clientes,
            proveedores,
            codigosTrabajo,
            vehiculos,
            gastosVehiculos,
            facturas,
            dotacionItems,
            entregasDotacion,
            cuentasPorPagar,
            cuentasBancarias,
            movimientosFinancieros,
            obligacionesFinancieras,
            novedadesNomina,
            empleados,
            ordenesCompra,
        };
    } catch (error) {
        console.error("Error in getInitialErpDataAction:", error);
        throw new Error("Failed to fetch initial ERP data");
    }
}

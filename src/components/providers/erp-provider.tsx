"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
    Factura, Cotizacion, Cliente, User, InventarioItem, Proveedor,
    Vehiculo, DotacionItem, EntregaDotacion, CuentaPorPagar,
    GastoVehiculo, CodigoTrabajo, OrdenCompra,
    CuentaBancaria, MovimientoFinanciero, NovedadNomina, Empleado
} from "@/types/sistema";

// Import Server Actions
import { getClientsAction, createClientAction, updateClientAction, deleteClientAction } from "@/app/dashboard/sistema/clientes/actions";
import { getProveedoresAction, createProveedorAction, updateProveedorAction, deleteProveedorAction } from "@/app/dashboard/sistema/suministro/actions";
import { getInventarioAction, createInventarioAction, updateInventarioAction, deleteInventarioAction, deductInventoryAction } from "@/app/dashboard/sistema/inventario/actions";
import { getCodigosTrabajoAction, createCodigoTrabajoAction, updateCodigoTrabajoAction, deleteCodigoTrabajoAction } from "@/app/dashboard/sistema/codigos-trabajo/actions";
import { getVehiculosAction, createVehiculoAction, updateVehiculoAction, getGastosVehiculosAction, createGastoVehiculoAction } from "@/app/dashboard/sistema/activos/actions";
import { getCotizacionesAction, createCotizacionAction, updateCotizacionAction, deleteCotizacionAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { getFacturasAction, createFacturaAction, updateFacturaAction } from "@/app/dashboard/sistema/financiera/actions";
import { getDotacionItemsAction, getEntregasDotacionAction, createEntregaDotacionAction, updateDotacionItemAction } from "@/app/dashboard/sistema/dotacion/actions";
import { getCuentasPorPagarAction, updateCuentaPorPagarAction, payCuentaPorPagarAction } from "@/app/dashboard/sistema/suministro/cuentas-actions";
import { getCuentasBancariasAction, createCuentaBancariaAction, updateCuentaBancariaAction, getMovimientosFinancierosAction, createMovimientoFinancieroAction } from "@/app/dashboard/sistema/financiera/bancos-actions";
import { getNovedadesNominaAction, createNovedadNominaAction, updateNovedadNominaAction, deleteNovedadNominaAction } from "@/app/dashboard/sistema/talento-humano/novedades-actions";
import { getEmpleadosAction, createEmpleadoAction, updateEmpleadoAction, deleteEmpleadoAction, payNominaAction } from "@/app/dashboard/sistema/talento-humano/actions";

// Fallback mock data for users (until profiles table is connected)
const initialUsers: User[] = [
    { id: "1", name: "Admin", email: "admin@dmre.com", role: "ADMIN", sidebarAccess: ["*"] },
];

interface ErpContextType {
    // Data
    facturas: Factura[];
    cotizaciones: Cotizacion[];
    clientes: Cliente[];
    users: User[];
    currentUser: User | undefined;
    inventario: InventarioItem[];
    proveedores: Proveedor[];
    vehiculos: Vehiculo[];
    dotacionItems: DotacionItem[];
    entregasDotacion: EntregaDotacion[];
    cuentasPorPagar: CuentaPorPagar[];
    gastosVehiculos: GastoVehiculo[];
    codigosTrabajo: CodigoTrabajo[];
    ordenesCompra: OrdenCompra[];
    cuentasBancarias: CuentaBancaria[];
    movimientosFinancieros: MovimientoFinanciero[];
    novedadesNomina: NovedadNomina[];
    empleados: Empleado[];

    // Loading states
    isLoading: boolean;

    // Factura Actions
    addFactura: (factura: Factura) => void;
    updateFactura: (updated: Factura) => void;

    // Cotizacion Actions
    addCotizacion: (cotizacion: Cotizacion) => void;
    updateCotizacion: (updated: Cotizacion) => void;
    deleteCotizacion: (id: string) => void;

    // Cliente Actions
    addCliente: (cliente: Cliente) => void;
    updateCliente: (updated: Cliente) => void;
    deleteCliente: (id: string) => void;

    // User Actions
    updateUserPermissions: (userId: string, access: string[]) => void;
    setCurrentUser: (user: User) => void;

    // Inventario Actions
    updateInventarioItem: (updated: InventarioItem) => void;
    addInventarioItem: (item: InventarioItem) => void;
    deleteInventarioItem: (id: string) => void;
    deductInventoryItem: (id: string, cantidad: number) => Promise<boolean>;

    // Proveedor Actions
    updateProveedor: (updated: Proveedor) => void;
    addProveedor: (prov: Proveedor) => void;
    deleteProveedor: (id: string) => void;

    // Vehiculo Actions
    updateVehiculo: (veh: Vehiculo) => void;
    addVehiculo: (veh: Vehiculo) => void;

    // Dotacion Actions
    updateDotacionItem: (item: DotacionItem) => void;
    addEntregaDotacion: (entrega: EntregaDotacion) => void;

    // Gastos Vehiculo Actions
    addGastoVehiculo: (gasto: GastoVehiculo) => void;

    // Cuentas por Pagar Actions
    updateCuentaPorPagar: (updated: CuentaPorPagar) => void;

    // Codigos Trabajo Actions
    addCodigoTrabajo: (codigo: CodigoTrabajo) => void;
    updateCodigoTrabajo: (updated: CodigoTrabajo) => void;
    deleteCodigoTrabajo: (id: string) => void;

    // New Actions
    addCuentaBancaria: (cta: CuentaBancaria) => void;
    updateCuentaBancaria: (updated: CuentaBancaria) => void;
    addMovimientoFinanciero: (mov: MovimientoFinanciero) => void;
    addNovedadNomina: (nov: NovedadNomina) => void;
    updateNovedadNomina: (updated: NovedadNomina) => void;
    deleteNovedadNomina: (id: string) => void;

    // Empleado Actions
    addEmpleado: (emp: Empleado) => void;
    updateEmpleado: (updated: Empleado) => void;
    deleteEmpleado: (id: string) => void;

    // Payment Actions
    payCuentaPorPagar: (id: string, cuentaBancariaId: string, valor: number, fecha: Date) => Promise<void>;
    payNomina: (empleadoId: string, periodo: string, valor: number, cuentaBancariaId: string, fecha: Date) => Promise<void>;

    // Refresh function
    refreshData: () => Promise<void>;


}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function ErpProvider({ children }: { children: ReactNode }) {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Data states - initialized empty, will be loaded from DB
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<User | undefined>(initialUsers[0]);
    const [inventario, setInventario] = useState<InventarioItem[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [dotacionItems, setDotacionItems] = useState<DotacionItem[]>([]);
    const [entregasDotacion, setEntregasDotacion] = useState<EntregaDotacion[]>([]);
    const [cuentasPorPagar, setCuentasPorPagar] = useState<CuentaPorPagar[]>([]);
    const [gastosVehiculos, setGastosVehiculos] = useState<GastoVehiculo[]>([]);
    const [codigosTrabajo, setCodigosTrabajo] = useState<CodigoTrabajo[]>([]);
    const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
    const [cuentasBancarias, setCuentasBancarias] = useState<CuentaBancaria[]>([]);
    const [movimientosFinancieros, setMovimientosFinancieros] = useState<MovimientoFinanciero[]>([]);
    const [novedadesNomina, setNovedadesNomina] = useState<NovedadNomina[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);

    // Load all data from Supabase
    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const [
                clientesData,
                proveedoresData,
                inventarioData,
                codigosData,
                vehiculosData,
                gastosData,
                cotizacionesData,
                facturasData,
                dotacionData,
                entregasData,
                cuentasData,
                bancosData,
                movimientosData,
                novedadesData,
                empleadosData,
            ] = await Promise.all([
                getClientsAction().catch(() => []),
                getProveedoresAction().catch(() => []),
                getInventarioAction().catch(() => []),
                getCodigosTrabajoAction().catch(() => []),
                getVehiculosAction().catch(() => []),
                getGastosVehiculosAction().catch(() => []),
                getCotizacionesAction().catch(() => []),
                getFacturasAction().catch(() => []),
                getDotacionItemsAction().catch(() => []),
                getEntregasDotacionAction().catch(() => []),
                getCuentasPorPagarAction().catch(() => []),
                getCuentasBancariasAction().catch(() => []),
                getMovimientosFinancierosAction().catch(() => []),
                getNovedadesNominaAction().catch(() => []),
                getEmpleadosAction().catch(() => []),
            ]);

            setClientes(clientesData);
            setProveedores(proveedoresData);
            setInventario(inventarioData);
            setCodigosTrabajo(codigosData);
            setVehiculos(vehiculosData);
            setGastosVehiculos(gastosData);
            setCotizaciones(cotizacionesData);
            setFacturas(facturasData);
            setDotacionItems(dotacionData);
            setEntregasDotacion(entregasData);
            setCuentasPorPagar(cuentasData);
            setCuentasBancarias(bancosData || []);
            setMovimientosFinancieros(movimientosData || []);
            setNovedadesNomina(novedadesData || []);
            setEmpleados(empleadosData || []);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    // =============================================
    // FACTURA ACTIONS
    // =============================================
    const addFactura = async (factura: Factura) => {
        try {
            const { id, ...rest } = factura;
            const saved = await createFacturaAction(rest as any);
            setFacturas(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add factura:", error);
        }
    };

    const updateFactura = async (updated: Factura) => {
        try {
            const saved = await updateFacturaAction(updated.id, updated);
            setFacturas(prev => prev.map(f => f.id === saved.id ? saved : f));
        } catch (error) {
            console.error("Failed to update factura:", error);
        }
    };

    // =============================================
    // COTIZACION ACTIONS
    // =============================================
    const addCotizacion = async (cotizacion: Cotizacion) => {
        try {
            const { id, ...rest } = cotizacion;
            const saved = await createCotizacionAction(rest as any);
            setCotizaciones(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add cotizacion:", error);
        }
    };

    const updateCotizacion = async (updated: Cotizacion) => {
        try {
            const saved = await updateCotizacionAction(updated.id, updated);
            setCotizaciones(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) {
            console.error("Failed to update cotizacion:", error);
        }
    };

    const deleteCotizacion = async (id: string) => {
        try {
            await deleteCotizacionAction(id);
            setCotizaciones(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete cotizacion:", error);
        }
    };

    // =============================================
    // CLIENTE ACTIONS
    // =============================================
    const addCliente = async (cliente: Cliente) => {
        try {
            const { id, fechaCreacion, ...rest } = cliente;
            const saved = await createClientAction(rest);
            setClientes(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add client:", error);
        }
    };

    const updateCliente = async (updated: Cliente) => {
        try {
            const saved = await updateClientAction(updated.id, updated);
            setClientes(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) {
            console.error("Failed to update client:", error);
        }
    };

    const deleteCliente = async (id: string) => {
        try {
            await deleteClientAction(id);
            setClientes(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete client:", error);
        }
    };

    // =============================================
    // INVENTARIO ACTIONS
    // =============================================
    const addInventarioItem = async (item: InventarioItem) => {
        try {
            const { id, fechaCreacion, ...rest } = item;
            const saved = await createInventarioAction(rest);
            setInventario(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add inventario item:", error);
        }
    };

    const updateInventarioItem = async (updated: InventarioItem) => {
        try {
            const saved = await updateInventarioAction(updated.id, updated);
            setInventario(prev => prev.map(i => i.id === saved.id ? saved : i));
        } catch (error) {
            console.error("Failed to update inventario item:", error);
        }
    };

    const deleteInventarioItem = async (id: string) => {
        try {
            await deleteInventarioAction(id);
            setInventario(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error("Failed to delete inventario item:", error);
        }
    };

    const deductInventoryItem = async (id: string, cantidad: number): Promise<boolean> => {
        try {
            await deductInventoryAction(id, cantidad);
            setInventario(prev => prev.map(i =>
                i.id === id ? { ...i, cantidad: Math.max(0, i.cantidad - cantidad) } : i
            ));
            return true;
        } catch (error) {
            console.error("Failed to deduct inventory:", error);
            return false;
        }
    };

    // =============================================
    // PROVEEDOR ACTIONS
    // =============================================
    const addProveedor = async (prov: Proveedor) => {
        try {
            const { id, ...rest } = prov;
            const saved = await createProveedorAction(rest);
            setProveedores(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add proveedor:", error);
        }
    };

    const updateProveedor = async (updated: Proveedor) => {
        try {
            const saved = await updateProveedorAction(updated.id, updated);
            setProveedores(prev => prev.map(p => p.id === saved.id ? saved : p));
        } catch (error) {
            console.error("Failed to update proveedor:", error);
        }
    };

    const deleteProveedor = async (id: string) => {
        try {
            await deleteProveedorAction(id);
            setProveedores(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error("Failed to delete proveedor:", error);
        }
    };

    // =============================================
    // VEHICULO ACTIONS
    // =============================================
    const addVehiculo = async (veh: Vehiculo) => {
        try {
            const { id, ...rest } = veh;
            const saved = await createVehiculoAction(rest);
            setVehiculos(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add vehiculo:", error);
        }
    };

    const updateVehiculo = async (updated: Vehiculo) => {
        try {
            const saved = await updateVehiculoAction(updated.id, updated);
            setVehiculos(prev => prev.map(v => v.id === saved.id ? saved : v));
        } catch (error) {
            console.error("Failed to update vehiculo:", error);
        }
    };

    // =============================================
    // DOTACION ACTIONS
    // =============================================
    const updateDotacionItem = async (updated: DotacionItem) => {
        try {
            const saved = await updateDotacionItemAction(updated.id, updated);
            setDotacionItems(prev => prev.map(d => d.id === saved.id ? saved : d));
        } catch (error) {
            console.error("Failed to update dotacion item:", error);
        }
    };

    const addEntregaDotacion = async (entrega: EntregaDotacion) => {
        try {
            const { id, ...rest } = entrega;
            const saved = await createEntregaDotacionAction(rest);
            setEntregasDotacion(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add entrega dotacion:", error);
        }
    };

    // =============================================
    // GASTOS VEHICULO ACTIONS
    // =============================================
    const addGastoVehiculo = async (gasto: GastoVehiculo) => {
        try {
            const { id, ...rest } = gasto;
            const saved = await createGastoVehiculoAction(rest);
            setGastosVehiculos(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add gasto vehiculo:", error);
        }
    };

    // =============================================
    // CUENTAS POR PAGAR ACTIONS
    // =============================================
    const updateCuentaPorPagarHandler = async (updated: CuentaPorPagar) => {
        try {
            const saved = await updateCuentaPorPagarAction(updated.id, updated);
            setCuentasPorPagar(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) {
            console.error("Failed to update cuenta por pagar:", error);
        }
    };

    // =============================================
    // CODIGOS TRABAJO ACTIONS
    // =============================================
    const addCodigoTrabajo = async (codigo: CodigoTrabajo) => {
        try {
            const { id, fechaCreacion, ...rest } = codigo;
            const saved = await createCodigoTrabajoAction(rest);
            setCodigosTrabajo(prev => [saved, ...prev]);
        } catch (error) {
            console.error("Failed to add codigo trabajo:", error);
        }
    };

    const updateCodigoTrabajo = async (updated: CodigoTrabajo) => {
        try {
            const saved = await updateCodigoTrabajoAction(updated.id, updated);
            setCodigosTrabajo(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) {
            console.error("Failed to update codigo trabajo:", error);
        }
    };

    const deleteCodigoTrabajo = async (id: string) => {
        try {
            await deleteCodigoTrabajoAction(id);
            setCodigosTrabajo(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error("Failed to delete codigo trabajo:", error);
        }
    };

    // =============================================
    // BANCOS & NOVEDADES ACTIONS
    // =============================================
    const addCuentaBancaria = async (cuenta: CuentaBancaria) => {
        try {
            const { id, ...rest } = cuenta;
            const saved = await createCuentaBancariaAction(rest as any);
            setCuentasBancarias(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding cuenta bancaria:", error); }
    };
    const updateCuentaBancaria = async (updated: CuentaBancaria) => {
        try {
            const saved = await updateCuentaBancariaAction(updated.id, updated);
            setCuentasBancarias(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) { console.error("Error updating cuenta bancaria:", error); }
    };
    const addMovimientoFinanciero = async (mov: MovimientoFinanciero) => {
        try {
            const { id, ...rest } = mov;
            const saved = await createMovimientoFinancieroAction(rest as any);
            setMovimientosFinancieros(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding movimiento:", error); }
    };

    const addNovedadNomina = async (nov: NovedadNomina) => {
        try {
            const { id, ...rest } = nov;
            const saved = await createNovedadNominaAction(rest as any);
            setNovedadesNomina(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding novedad:", error); }
    };
    const updateNovedadNomina = async (updated: NovedadNomina) => {
        try {
            const saved = await updateNovedadNominaAction(updated.id, updated);
            setNovedadesNomina(prev => prev.map(n => n.id === saved.id ? saved : n));
        } catch (error) { console.error("Error updating novedad:", error); }
    };
    const deleteNovedadNomina = async (id: string) => {
        try {
            await deleteNovedadNominaAction(id);
            setNovedadesNomina(prev => prev.filter(n => n.id !== id));
        } catch (error) { console.error("Error deleting novedad:", error); }
    };

    const addEmpleado = async (emp: Empleado) => {
        try {
            const { id, ...rest } = emp;
            const saved = await createEmpleadoAction(rest as any);
            setEmpleados(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding empleado:", error); }
    };

    const updateEmpleado = async (updated: Empleado) => {
        try {
            const saved = await updateEmpleadoAction(updated.id, updated);
            setEmpleados(prev => prev.map(e => e.id === saved.id ? saved : e));
        } catch (error) { console.error("Error updating empleado:", error); }
    };

    const deleteEmpleado = async (id: string) => {
        try {
            await deleteEmpleadoAction(id);
            setEmpleados(prev => prev.filter(e => e.id !== id));
        } catch (error) { console.error("Error deleting empleado:", error); }
    };

    const payCuentaPorPagar = async (id: string, cuentaBancariaId: string, valor: number, fecha: Date) => {
        try {
            await payCuentaPorPagarAction(id, cuentaBancariaId, valor, fecha);
            await loadAllData(); // Refresh to sync everything (bank balance, movements, cxp status)
        } catch (error) { console.error("Error paying CXP:", error); }
    };

    const payNomina = async (empleadoId: string, periodo: string, valor: number, cuentaBancariaId: string, fecha: Date) => {
        try {
            await payNominaAction(empleadoId, periodo, valor, cuentaBancariaId, fecha);
            await loadAllData(); // Refresh bank balance and movements
        } catch (error) { console.error("Error paying Nomina:", error); }
    };


    // =============================================
    // USER ACTIONS (Local only for now)
    // =============================================
    const updateUserPermissions = (userId: string, access: string[]) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, sidebarAccess: access } : u
        ));
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, sidebarAccess: access } : undefined);
        }
    };

    return (
        <ErpContext.Provider value={{
            // Data
            facturas, cotizaciones, clientes, users, currentUser,
            inventario, proveedores, vehiculos, dotacionItems,
            entregasDotacion, cuentasPorPagar, gastosVehiculos,
            codigosTrabajo, ordenesCompra,
            cuentasBancarias, movimientosFinancieros, novedadesNomina, empleados,

            // Loading
            isLoading,

            // Actions
            addFactura, updateFactura,
            addCotizacion, updateCotizacion, deleteCotizacion,
            addCliente, updateCliente, deleteCliente,
            updateUserPermissions, setCurrentUser,
            updateInventarioItem, addInventarioItem, deleteInventarioItem, deductInventoryItem,
            updateProveedor, addProveedor, deleteProveedor,
            updateVehiculo, addVehiculo,
            updateDotacionItem, addEntregaDotacion,
            addGastoVehiculo,
            updateCuentaPorPagar: updateCuentaPorPagarHandler,
            addCodigoTrabajo, updateCodigoTrabajo, deleteCodigoTrabajo,

            // New Actions
            addCuentaBancaria, updateCuentaBancaria, addMovimientoFinanciero,
            addNovedadNomina, updateNovedadNomina, deleteNovedadNomina,
            addEmpleado, updateEmpleado, deleteEmpleado,
            payCuentaPorPagar, payNomina,

            // Refresh
            refreshData: loadAllData,
        }}>
            {children}
        </ErpContext.Provider>
    );
}

export function useErp() {
    const context = useContext(ErpContext);
    if (context === undefined) {
        throw new Error("useErp must be used within an ErpProvider");
    }
    return context;
}

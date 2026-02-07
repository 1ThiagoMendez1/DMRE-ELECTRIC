"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import {
    Factura, Cotizacion, Cliente, User, InventarioItem, Proveedor,
    Vehiculo, DotacionItem, EntregaDotacion, CuentaPorPagar,
    GastoVehiculo, CodigoTrabajo, OrdenCompra,
    CuentaBancaria, MovimientoFinanciero, NovedadNomina, Empleado,
    ObligacionFinanciera, LiquidacionNomina,
    TareaAgenda, Role, Permission
} from "@/types/sistema";

// Import Server Actions
import { getClientsAction, createClientAction, updateClientAction, deleteClientAction } from "@/app/dashboard/sistema/clientes/actions";
import { getProveedoresAction, createProveedorAction, updateProveedorAction, deleteProveedorAction } from "@/app/dashboard/sistema/suministro/actions";
import { getInventarioAction, createInventarioAction, updateInventarioAction, deleteInventarioAction, deductInventoryAction } from "@/app/dashboard/sistema/inventario/actions";
import { getCodigosTrabajoAction, createCodigoTrabajoAction, updateCodigoTrabajoAction, deleteCodigoTrabajoAction } from "@/app/dashboard/sistema/codigos-trabajo/actions";
import { getVehiculosAction, createVehiculoAction, updateVehiculoAction, deleteVehiculoAction, getGastosVehiculosAction, createGastoVehiculoAction, updateGastoVehiculoAction, deleteGastoVehiculoAction } from "@/app/dashboard/sistema/activos/actions";
import { getCotizacionesAction, createCotizacionAction, updateCotizacionAction, deleteCotizacionAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { getFacturasAction, createFacturaAction, updateFacturaAction } from "@/app/dashboard/sistema/financiera/actions";
import { getDotacionItemsAction, getEntregasDotacionAction, createEntregaDotacionAction, updateDotacionItemAction, updateEntregaDotacionAction } from "@/app/dashboard/sistema/dotacion/actions";
import { getCuentasPorPagarAction, updateCuentaPorPagarAction, payCuentaPorPagarAction, createCuentaPorPagarAction, deleteCuentaPorPagarAction } from "@/app/dashboard/sistema/suministro/cuentas-actions";
import { getCuentasBancariasAction, createCuentaBancariaAction, updateCuentaBancariaAction, getMovimientosFinancierosAction, createMovimientoFinancieroAction, updateMovimientoFinancieroAction } from "@/app/dashboard/sistema/financiera/bancos-actions";
import { getObligacionesFinancierasAction, createObligacionFinancieraAction, updateObligacionFinancieraAction, deleteObligacionFinancieraAction } from "@/app/dashboard/sistema/financiera/obligaciones-actions";
import { getNovedadesNominaAction, createNovedadNominaAction, updateNovedadNominaAction, deleteNovedadNominaAction } from "@/app/dashboard/sistema/talento-humano/novedades-actions";
<<<<<<< HEAD
import { getEmpleadosAction, createEmpleadoAction, updateEmpleadoAction, deleteEmpleadoAction, payNominaAction } from "@/app/dashboard/sistema/talento-humano/actions";
import { getUsers, updateUserPermissionsAction, deleteUserAction, getUserProfile } from "@/actions/auth-actions";
=======
import { getEmpleadosAction, createEmpleadoAction, updateEmpleadoAction, deleteEmpleadoAction, payNominaAction, getLiquidacionesAction, createLiquidacionAction, updateLiquidacionEstadoAction } from "@/app/dashboard/sistema/talento-humano/actions";
import { getUsers, updateUserPermissionsAction, deleteUserAction, toggleUserStatusAction } from "@/actions/auth-actions";
import { getTareasAction, createTareaAction, updateTareaAction, deleteTareaAction } from "@/app/dashboard/sistema/agenda/actions";
import { getRolesWithPermissionsAction, getPermissionsAction, createRoleAction, updateRolePermissionsAction } from "@/app/dashboard/sistema/roles/actions";
import { getOrdenesCompraAction, createOrdenCompraAction, updateOrdenCompraAction } from "@/app/dashboard/sistema/suministro/ordenes-actions";
>>>>>>> 58f85acb5f4d5d9e776bacbfedc1dae905f83598
import { createClient } from "@/utils/supabase/client";
import { getInitialErpDataAction } from "@/actions/erp-actions";

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
    obligacionesFinancieras: ObligacionFinanciera[];
    novedadesNomina: NovedadNomina[];
    empleados: Empleado[];
    liquidacionesNomina: LiquidacionNomina[];
    agenda: TareaAgenda[];
    roles: Role[];
    permissions: Permission[];

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
    refreshUsers: () => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

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
    deleteVehiculo: (id: string) => void;

    // Dotacion Actions
    updateDotacionItem: (item: DotacionItem) => void;
    updateEntregaDotacion: (id: string, updates: Partial<EntregaDotacion>) => void;
    addEntregaDotacion: (entrega: EntregaDotacion) => void;

    // Gastos Vehiculo Actions
    addGastoVehiculo: (gasto: GastoVehiculo, cuentaId?: string) => void;
    updateGastoVehiculo: (gasto: GastoVehiculo) => void;
    deleteGastoVehiculo: (id: string) => void;

    // Cuentas por Pagar Actions
    updateCuentaPorPagar: (updated: CuentaPorPagar) => void;
    addCuentaPorPagar: (cuenta: Omit<CuentaPorPagar, "id">) => void;
    deleteCuentaPorPagar: (id: string) => void;

    // Codigos Trabajo Actions
    addCodigoTrabajo: (codigo: CodigoTrabajo) => void;
    updateCodigoTrabajo: (updated: CodigoTrabajo) => void;
    deleteCodigoTrabajo: (id: string) => void;

    // New Actions (Financiera, TH, etc.)
    addCuentaBancaria: (cta: CuentaBancaria) => void;
    updateCuentaBancaria: (updated: CuentaBancaria) => void;
    addMovimientoFinanciero: (mov: MovimientoFinanciero) => void;
    updateMovimientoFinanciero: (updated: MovimientoFinanciero) => void;
    addObligacionFinanciera: (obl: ObligacionFinanciera) => void;
    updateObligacionFinanciera: (updated: ObligacionFinanciera) => void;
    deleteObligacionFinanciera: (id: string) => void;
    addNovedadNomina: (nov: NovedadNomina) => void;
    updateNovedadNomina: (updated: NovedadNomina) => void;
    deleteNovedadNomina: (id: string) => void;

    // Empleado Actions
    addEmpleado: (emp: Empleado) => void;
    updateEmpleado: (updated: Empleado) => void;
    deleteEmpleado: (id: string) => void;

    // Payment Actions
    payCuentaPorPagar: (id: string, cuentaBancariaId: string, valor: number, fecha: Date, nota?: string) => Promise<void>;
    payNomina: (liquidacionId: string, empleadoId: string, periodo: string, valor: number, cuentaBancariaId: string, fecha: Date) => Promise<void>;

    // Liquidacion Actions
    addLiquidacion: (liq: Omit<LiquidacionNomina, "id" | "empleado">) => Promise<void>;
    updateLiquidacionEstado: (id: string, estado: 'PENDIENTE' | 'PAGADO') => Promise<void>;

    // Orden Compra Actions
    addOrdenCompra: (oc: any) => Promise<void>;
    updateOrdenCompra: (id: string, oc: any) => Promise<void>;

    // Refresh function
    refreshData: () => Promise<void>;

    // Agenda Actions
    addTarea: (tarea: Omit<TareaAgenda, "id" | "asignadoNombre">) => Promise<void>;
    updateTarea: (id: string, updates: Partial<TareaAgenda>) => Promise<void>;
    deleteTarea: (id: string) => Promise<void>;

    // Roles Actions
    addRole: (role: Omit<Role, "id" | "permissions">) => Promise<void>;
    updateRolePermission: (roleId: string, permissionId: string, actions: any) => Promise<void>;
    toggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function ErpProvider({ children, initialUser }: { children: ReactNode, initialUser?: User }) {
    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Data states - initialized empty, will be loaded from DB
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | undefined>(initialUser);
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
    const [obligacionesFinancieras, setObligacionesFinancieras] = useState<ObligacionFinanciera[]>([]);
    const [novedadesNomina, setNovedadesNomina] = useState<NovedadNomina[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [liquidacionesNomina, setLiquidacionesNomina] = useState<LiquidacionNomina[]>([]);

    // Control System States
    const [agenda, setAgenda] = useState<TareaAgenda[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);

    // Load all data from Supabase
    const loadAllData = async () => {
        setIsLoading(true);
        try {
<<<<<<< HEAD
            // 1. Load User Session Parallelly (Fast Path for Sidebar)
            const userPromise = (async () => {
                if (!initialUser) {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const profile = await getUserProfile(user.id);
                        if (profile) setCurrentUser(profile as User);
                    }
                }
            })();

            // 2. Load Business Data (Heavy Path)
            const businessPromise = (async () => {
                const [
                    clientesData,
                    proveedoresData,
                    // inventarioData,
                    codigosData,
                    vehiculosData,
                    gastosData,
                    // cotizacionesData,
                    // facturasData,
                    dotacionData,
                    entregasData,
                    cuentasData,
                    // bancosData,
                    // movimientosData,
                    novedadesData,
                    empleadosData,
                    usersData,
                ] = await Promise.all([
                    getClientsAction().catch(() => []),
                    getProveedoresAction().catch(() => []),
                    // getInventarioAction().catch(() => []),
                    getCodigosTrabajoAction().catch(() => []),
                    getVehiculosAction().catch(() => []),
                    getGastosVehiculosAction().catch(() => []),
                    // getCotizacionesAction().catch(() => []),
                    // getFacturasAction().catch(() => []),
                    getDotacionItemsAction().catch(() => []),
                    getEntregasDotacionAction().catch(() => []),
                    getCuentasPorPagarAction().catch(() => []),
                    // getCuentasBancariasAction().catch(() => []),
                    // getMovimientosFinancierosAction().catch(() => []),
                    getNovedadesNominaAction().catch(() => []),
                    getEmpleadosAction().catch(() => []),
                    getUsers().catch(() => []),
                ]);

                setClientes(clientesData);
                setProveedores(proveedoresData);
                // setInventario(inventarioData);
                setCodigosTrabajo(codigosData);
                setVehiculos(vehiculosData);
                setGastosVehiculos(gastosData);
                // setCotizaciones(cotizacionesData);
                // setFacturas(facturasData);
                setDotacionItems(dotacionData);
                setEntregasDotacion(entregasData);
                setCuentasPorPagar(cuentasData);
                // setCuentasBancarias(bancosData || []);
                // setMovimientosFinancieros(movimientosData || []);
                setNovedadesNomina(novedadesData || []);
                setEmpleados(empleadosData || []);
                setUsers(usersData || []);
            })();

            // Wait for both, but state updates inside userPromise will trigger early re-renders
            await Promise.all([userPromise, businessPromise]);
=======
            const data = await getInitialErpDataAction();

            // Set all states at once
            setUsers(data.users);
            setCotizaciones(data.cotizaciones);
            setInventario(data.inventario);
            setClientes(data.clientes);
            setProveedores(data.proveedores);
            setCodigosTrabajo(data.codigosTrabajo);
            setVehiculos(data.vehiculos);
            setGastosVehiculos(data.gastosVehiculos);
            setFacturas(data.facturas);
            setDotacionItems(data.dotacionItems);
            setEntregasDotacion(data.entregasDotacion);
            setCuentasPorPagar(data.cuentasPorPagar);
            setCuentasBancarias(data.cuentasBancarias);
            setMovimientosFinancieros(data.movimientosFinancieros);
            setObligacionesFinancieras(data.obligacionesFinancieras);
            setNovedadesNomina(data.novedadesNomina);
            setEmpleados(data.empleados);
            setOrdenesCompra(data.ordenesCompra);

            // Fetch Control System Data
            const [agendaData, rolesData, permsData] = await Promise.all([
                getTareasAction(),
                getRolesWithPermissionsAction(),
                getPermissionsAction()
            ]);
            setAgenda(agendaData);
            setRoles(rolesData);
            setPermissions(permsData);

            // Load liquidations separately for now to avoid breaking existing initial load structure if not updated there
            const liqs = await getLiquidacionesAction();
            setLiquidacionesNomina(liqs);

            // Set current user if logged in
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user && data.users) {
                const found = data.users.find((u: any) => u.id === user.id);
                if (found) setCurrentUser(found);
            }
>>>>>>> 58f85acb5f4d5d9e776bacbfedc1dae905f83598

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };


    // Hydration from LocalStorage for instant UI
    useEffect(() => {
        const keys = [
            'clientes', 'proveedores', 'inventario', 'codigosTrabajo',
            'vehiculos', 'cotizaciones', 'facturas', 'empleados'
        ];

        try {
            const cachedCotizaciones = localStorage.getItem('erp_cache_cotizaciones');
            if (cachedCotizaciones) {
                const parsed = JSON.parse(cachedCotizaciones);
                // Convert string dates back to Date objects
                setCotizaciones(parsed.map((c: any) => ({ ...c, fecha: new Date(c.fecha) })));
            }

            const cachedInventario = localStorage.getItem('erp_cache_inventario');
            if (cachedInventario) setInventario(JSON.parse(cachedInventario));

            const cachedClientes = localStorage.getItem('erp_cache_clientes');
            if (cachedClientes) setClientes(JSON.parse(cachedClientes));

            // ... add others as needed for critical modules
        } catch (e) {
            console.warn("Hydration failed:", e);
        }

        loadAllData();
    }, []);

    // Persistence Effect
    useEffect(() => {
        const cacheData = {
            cotizaciones,
            inventario,
            clientes,
            proveedores,
            vehiculos,
            facturas,
            empleados,
            cuentasBancarias
        };

        Object.entries(cacheData).forEach(([key, value]) => {
            if (value && value.length > 0) {
                localStorage.setItem(`erp_cache_${key}`, JSON.stringify(value));
            }
        });
    }, [cotizaciones, inventario, clientes, proveedores, vehiculos, facturas, empleados, cuentasBancarias]);

    // Realtime Subscriptions
    useEffect(() => {
        const supabase = createClient();

        // Subscription for Cotizaciones
        const cotizacionesSub = supabase
            .channel('erp_cotizaciones_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cotizaciones' }, async (payload) => {
                console.log('Realtime update: cotizaciones', payload);
                // Refresh full list to get relations and mapped data
                // In a more optimized version we would only fetch the updated record
                const updated = await getCotizacionesAction();
                setCotizaciones(updated);
            })
            .subscribe();

        // Subscription for Inventario
        const inventarioSub = supabase
            .channel('erp_inventario_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, async (payload) => {
                console.log('Realtime update: inventario', payload);
                const updated = await getInventarioAction();
                setInventario(updated);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(cotizacionesSub);
            supabase.removeChannel(inventarioSub);
        }
    }, []);

    // ... Actions ...

    // FACTURA ACTIONS
    const addFactura = async (factura: Factura) => {
        try {
            const { id, ...rest } = factura;
            const saved = await createFacturaAction(rest as any);
            setFacturas(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add factura:", error); }
    };
    const updateFactura = async (updated: Factura) => {
        try {
            const saved = await updateFacturaAction(updated.id, updated);
            setFacturas(prev => prev.map(f => f.id === saved.id ? saved : f));
        } catch (error) { console.error("Failed to update factura:", error); }
    };

    // COTIZACION ACTIONS
    const addCotizacion = async (cotizacion: Cotizacion) => {
        try {
            const { id, ...rest } = cotizacion;
            const saved = await createCotizacionAction(rest as any);
            setCotizaciones(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add cotizacion:", error); }
    };
    const updateCotizacion = async (updated: Cotizacion) => {
        try {
            const saved = await updateCotizacionAction(updated.id, updated);
            setCotizaciones(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) { console.error("Failed to update cotizacion:", error); }
    };
    const deleteCotizacion = async (id: string) => {
        try {
            await deleteCotizacionAction(id);
            setCotizaciones(prev => prev.filter(c => c.id !== id));
        } catch (error) { console.error("Failed to delete cotizacion:", error); }
    };

    // CLIENTE ACTIONS
    const addCliente = async (cliente: Cliente) => {
        try {
            const { id, fechaCreacion, ...rest } = cliente;
            const saved = await createClientAction(rest);
            setClientes(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add client:", error); }
    };
    const updateCliente = async (updated: Cliente) => {
        try {
            const saved = await updateClientAction(updated.id, updated);
            setClientes(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) { console.error("Failed to update client:", error); }
    };
    const deleteCliente = async (id: string) => {
        try {
            await deleteClientAction(id);
            setClientes(prev => prev.filter(c => c.id !== id));
        } catch (error) { console.error("Failed to delete client:", error); }
    };

    // INVENTARIO ACTIONS
    const addInventarioItem = async (item: InventarioItem) => {
        try {
            const { id, fechaCreacion, ...rest } = item;
            const saved = await createInventarioAction(rest);
            setInventario(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add inventario item:", error); }
    };
    const updateInventarioItem = async (updated: InventarioItem) => {
        try {
            const saved = await updateInventarioAction(updated.id, updated);
            setInventario(prev => prev.map(i => i.id === saved.id ? saved : i));
        } catch (error) { console.error("Failed to update inventario item:", error); }
    };
    const deleteInventarioItem = async (id: string) => {
        try {
            await deleteInventarioAction(id);
            setInventario(prev => prev.filter(i => i.id !== id));
        } catch (error) { console.error("Failed to delete inventario item:", error); }
    };
    const deductInventoryItem = async (id: string, cantidad: number): Promise<boolean> => {
        try {
            await deductInventoryAction(id, cantidad);
            setInventario(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(0, i.cantidad - cantidad) } : i));
            return true;
        } catch (error) { console.error("Failed to deduct inventory:", error); return false; }
    };

    // PROVEEDOR ACTIONS
    const addProveedor = async (prov: Proveedor) => {
        try {
            const { id, ...rest } = prov;
            const saved = await createProveedorAction(rest);
            setProveedores(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add proveedor:", error); }
    };
    const updateProveedor = async (updated: Proveedor) => {
        try {
            const saved = await updateProveedorAction(updated.id, updated);
            setProveedores(prev => prev.map(p => p.id === saved.id ? saved : p));
        } catch (error) { console.error("Failed to update proveedor:", error); }
    };
    const deleteProveedor = async (id: string) => {
        try {
            await deleteProveedorAction(id);
            setProveedores(prev => prev.filter(p => p.id !== id));
        } catch (error) { console.error("Failed to delete proveedor:", error); }
    };

    // VEHICULO ACTIONS
    const addVehiculo = async (veh: Vehiculo) => {
        try {
            const { id, ...rest } = veh;
            const saved = await createVehiculoAction(rest);
            setVehiculos(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add vehiculo:", error); }
    };
    const updateVehiculo = async (updated: Vehiculo) => {
        try {
            const saved = await updateVehiculoAction(updated.id, updated);
            setVehiculos(prev => prev.map(v => v.id === saved.id ? saved : v));
        } catch (error) { console.error("Failed to update vehiculo:", error); }
    };
    const deleteVehiculo = async (id: string) => {
        try {
            await deleteVehiculoAction(id);
            setVehiculos(prev => prev.filter(v => v.id !== id));
        } catch (error) { console.error("Failed to delete vehiculo:", error); }
    };

    // DOTACION ACTIONS
    const updateDotacionItem = async (updated: DotacionItem) => {
        try {
            const saved = await updateDotacionItemAction(updated.id, updated);
            setDotacionItems(prev => prev.map(d => d.id === saved.id ? saved : d));
        } catch (error) { console.error("Failed to update dotacion item:", error); }
    };
    const addEntregaDotacion = async (entrega: EntregaDotacion) => {
        try {
            const { id, ...rest } = entrega;
            const saved = await createEntregaDotacionAction(rest);
            setEntregasDotacion(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add entrega dotacion:", error); }
    };

    const updateEntregaDotacion = async (id: string, updates: Partial<EntregaDotacion>) => {
        try {
            const saved = await updateEntregaDotacionAction(id, updates);
            setEntregasDotacion(prev => prev.map(e => e.id === saved.id ? saved : e));
        } catch (error) {
            console.error("Failed to update entrega dotacion:", error);
        }
    };

    // GASTOS VEHICULO ACTIONS
    // =============================================
    const addGastoVehiculo = async (gasto: GastoVehiculo, cuentaId?: string) => {
        try {
            const { id, vehiculo, ...rest } = gasto;
            const saved = await createGastoVehiculoAction(rest as any, cuentaId);
            setGastosVehiculos(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add gasto vehiculo:", error); }
    };
    const updateGastoVehiculo = async (gasto: GastoVehiculo) => {
        try {
            const saved = await updateGastoVehiculoAction(gasto.id, gasto as any);
            setGastosVehiculos(prev => prev.map(g => g.id === saved.id ? saved : g));
        } catch (error) { console.error("Failed to update gasto vehiculo:", error); }
    };
    const deleteGastoVehiculo = async (id: string) => {
        try {
            await deleteGastoVehiculoAction(id);
            setGastosVehiculos(prev => prev.filter(g => g.id !== id));
        } catch (error) { console.error("Failed to delete gasto vehiculo:", error); }
    };

    // CUENTAS POR PAGAR ACTIONS
    const updateCuentaPorPagarHandler = async (updated: CuentaPorPagar) => {
        try {
            const saved = await updateCuentaPorPagarAction(updated.id, updated);
            setCuentasPorPagar(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) { console.error("Failed to update cuenta por pagar:", error); }
    };

    // CODIGOS TRABAJO ACTIONS
    const addCodigoTrabajo = async (codigo: CodigoTrabajo) => {
        try {
            const { id, fechaCreacion, ...rest } = codigo;
            const saved = await createCodigoTrabajoAction(rest);
            setCodigosTrabajo(prev => [saved, ...prev]);
        } catch (error) { console.error("Failed to add codigo trabajo:", error); }
    };
    const updateCodigoTrabajo = async (updated: CodigoTrabajo) => {
        try {
            const saved = await updateCodigoTrabajoAction(updated.id, updated);
            setCodigosTrabajo(prev => prev.map(c => c.id === saved.id ? saved : c));
        } catch (error) { console.error("Failed to update codigo trabajo:", error); }
    };
    const deleteCodigoTrabajo = async (id: string) => {
        try {
            await deleteCodigoTrabajoAction(id);
            setCodigosTrabajo(prev => prev.filter(c => c.id !== id));
        } catch (error) { console.error("Failed to delete codigo trabajo:", error); }
    };

    // BANCOS & NOVEDADES ACTIONS
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

    const updateMovimientoFinanciero = async (updated: MovimientoFinanciero) => {
        try {
            const saved = await updateMovimientoFinancieroAction(updated.id, updated);
            setMovimientosFinancieros(prev => prev.map(m => m.id === saved.id ? saved : m));
        } catch (error) { console.error("Error updating movimiento:", error); }
    };

    // =============================================
    // OBLIGACIONES FINANCIERAS ACTIONS
    // =============================================
    const addObligacionFinanciera = async (obl: ObligacionFinanciera) => {
        try {
            const { id, ...rest } = obl;
            const saved = await createObligacionFinancieraAction(rest as any);
            setObligacionesFinancieras(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding obligacion:", error); }
    };

    const updateObligacionFinanciera = async (updated: ObligacionFinanciera) => {
        try {
            const saved = await updateObligacionFinancieraAction(updated.id, updated);
            setObligacionesFinancieras(prev => prev.map(o => o.id === saved.id ? saved : o));
        } catch (error) { console.error("Error updating obligacion:", error); }
    };

    const deleteObligacionFinanciera = async (id: string) => {
        try {
            await deleteObligacionFinancieraAction(id);
            setObligacionesFinancieras(prev => prev.filter(o => o.id !== id));
        } catch (error) { console.error("Error deleting obligacion:", error); }
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
    const addCuentaPorPagar = async (cuenta: Omit<CuentaPorPagar, "id">) => {
        try {
            const saved = await createCuentaPorPagarAction(cuenta);
            setCuentasPorPagar(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding CXP:", error); }
    };
    const deleteCuentaPorPagar = async (id: string) => {
        try {
            await deleteCuentaPorPagarAction(id);
            setCuentasPorPagar(prev => prev.filter(c => c.id !== id));
        } catch (error) { console.error("Error deleting CXP:", error); }
    };
    const payCuentaPorPagar = async (id: string, cuentaBancariaId: string, valor: number, fecha: Date, nota?: string) => {
        try {
            await payCuentaPorPagarAction(id, cuentaBancariaId, valor, fecha, nota);
            await loadAllData();
        } catch (error) { console.error("Error paying CXP:", error); }
    };
    const payNomina = async (liquidacionId: string, empleadoId: string, periodo: string, valor: number, cuentaBancariaId: string, fecha: Date) => {
        try {
            await payNominaAction(empleadoId, periodo, valor, cuentaBancariaId, fecha);
            await updateLiquidacionEstadoAction(liquidacionId, 'PAGADO');
            // Optimistic update
            setLiquidacionesNomina(prev => prev.map(l => l.id === liquidacionId ? { ...l, estado: 'PAGADO' } : l));
            await loadAllData();
        } catch (error) { console.error("Error paying Nomina:", error); }
    };

    const addLiquidacion = async (liq: Omit<LiquidacionNomina, "id" | "empleado">) => {
        try {
            const saved = await createLiquidacionAction(liq);
            setLiquidacionesNomina(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding liquidacion:", error); }
    };

    const updateLiquidacionEstado = async (id: string, estado: 'PENDIENTE' | 'PAGADO') => {
        try {
            await updateLiquidacionEstadoAction(id, estado);
            setLiquidacionesNomina(prev => prev.map(l => l.id === id ? { ...l, estado } : l));
        } catch (error) { console.error("Error updating liquidacion status:", error); }
    };

    // CONTROL SYSTEM ACTIONS
    const addTarea = async (tarea: Omit<TareaAgenda, "id" | "asignadoNombre">) => {
        try {
            const newTarea = await createTareaAction(tarea);
            setAgenda(prev => [...prev, newTarea]);
        } catch (error) { console.error("Error creating tarea:", error); }
    };

    const updateTarea = async (id: string, updates: Partial<TareaAgenda>) => {
        try {
            const updated = await updateTareaAction(id, updates);
            setAgenda(prev => prev.map(t => t.id === id ? updated : t));
        } catch (error) { console.error("Error updating tarea:", error); }
    };

    const deleteTarea = async (id: string) => {
        try {
            await deleteTareaAction(id);
            setAgenda(prev => prev.filter(t => t.id !== id));
        } catch (error) { console.error("Error deleting tarea:", error); }
    };

    const addRole = async (role: Omit<Role, "id" | "permissions">) => {
        try {
            const newRole = await createRoleAction(role);
            setRoles(prev => [...prev, newRole]);
        } catch (error) { console.error("Error creating role:", error); }
    };

    const updateRolePermission = async (roleId: string, permissionId: string, actions: any) => {
        try {
            await updateRolePermissionsAction(roleId, permissionId, actions);
            // Refresh roles to get updated permissions structure
            const updatedRoles = await getRolesWithPermissionsAction();
            setRoles(updatedRoles);
        } catch (error) { console.error("Error updating role permission:", error); }
    };

    const toggleUserStatus = async (userId: string, isActive: boolean) => {
        try {
            await toggleUserStatusAction(userId, isActive);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
        } catch (error) { console.error("Error toggling user status:", error); }
    };

    // USER ACTIONS
    const deleteUser = async (id: string) => {
        try {
            const res = await deleteUserAction(id);
            if (res.success) {
                setUsers(prev => prev.filter(u => u.id !== id));
                if (currentUser?.id === id) setCurrentUser(undefined);
            }
        } catch (error) { console.error("Error deleting user:", error); }
    };

    const updateUserPermissions = async (userId: string, access: string[]) => {
        try {
            await updateUserPermissionsAction(userId, access);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, sidebarAccess: access } : u));
            if (currentUser?.id === userId) {
                setCurrentUser(prev => prev ? { ...prev, sidebarAccess: access } : undefined);
            }
        } catch (error) { console.error("Error updating permissions:", error); }
    };
    const refreshUsers = async () => {
        const u = await getUsers();
        setUsers(u);
    };

    const addOrdenCompra = async (oc: any) => {
        try {
            const saved = await createOrdenCompraAction(oc);
            setOrdenesCompra(prev => [saved, ...prev]);
        } catch (error) { console.error("Error adding OC:", error); }
    };

    const updateOrdenCompra = async (id: string, oc: any) => {
        try {
            const saved = await updateOrdenCompraAction(id, oc);
            setOrdenesCompra(prev => prev.map(o => o.id === saved.id ? saved : o));
        } catch (error) { console.error("Error updating OC:", error); }
    };

    return (
        <ErpContext.Provider value={{
            facturas, cotizaciones, clientes, users, currentUser,
            inventario, proveedores, vehiculos, dotacionItems,
            entregasDotacion, cuentasPorPagar, gastosVehiculos,
            codigosTrabajo, ordenesCompra,
            cuentasBancarias, movimientosFinancieros, obligacionesFinancieras, novedadesNomina, empleados,

            // Loading
            isLoading,
            addFactura, updateFactura,
            addCotizacion, updateCotizacion, deleteCotizacion,
            addCliente, updateCliente, deleteCliente,
            updateUserPermissions, setCurrentUser, refreshUsers, deleteUser,
            updateInventarioItem, addInventarioItem, deleteInventarioItem, deductInventoryItem,
            updateProveedor, addProveedor, deleteProveedor,
            addVehiculo,
            updateVehiculo,
            deleteVehiculo,
            addGastoVehiculo,
            updateGastoVehiculo,
            deleteGastoVehiculo,
            updateDotacionItem, addEntregaDotacion,
            updateEntregaDotacion,
            updateCuentaPorPagar: updateCuentaPorPagarHandler,
            addCuentaPorPagar,
            deleteCuentaPorPagar,
            addCodigoTrabajo, updateCodigoTrabajo, deleteCodigoTrabajo,

            // New Actions
            addCuentaBancaria, updateCuentaBancaria, addMovimientoFinanciero, updateMovimientoFinanciero,
            addObligacionFinanciera, updateObligacionFinanciera, deleteObligacionFinanciera,
            addNovedadNomina, updateNovedadNomina, deleteNovedadNomina,
            addEmpleado, updateEmpleado, deleteEmpleado,
            payCuentaPorPagar, payNomina,
            liquidacionesNomina, addLiquidacion, updateLiquidacionEstado,
            agenda, roles, permissions,
            addTarea, updateTarea, deleteTarea,
            addRole, updateRolePermission, toggleUserStatus,

            addOrdenCompra, updateOrdenCompra,

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

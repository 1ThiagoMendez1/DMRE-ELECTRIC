"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Factura, Cotizacion, Cliente, User, InventarioItem, Proveedor, Vehiculo, DotacionItem, EntregaDotacion, CuentaPorPagar, GastoVehiculo, CodigoTrabajo, OrdenCompra } from "@/types/sistema";
import {
    initialFacturas, initialQuotes, initialClients, initialUsers,
    initialInventory, initialProveedores, initialVehiculos, initialDotacionItems, initialEntregasDotacion, initialCuentasPorPagar, initialGastosVehiculos, initialCodigosTrabajo, initialOrdenesCompra
} from "@/lib/mock-data";

interface ErpContextType {
    facturas: Factura[];
    cotizaciones: Cotizacion[];
    clientes: Cliente[];
    users: User[];
    currentUser: User | undefined;
    addFactura: (factura: Factura) => void;
    updateFactura: (updated: Factura) => void;
    addCotizacion: (cotizacion: Cotizacion) => void;
    updateCotizacion: (updated: Cotizacion) => void;
    addCliente: (cliente: Cliente) => void;
    updateCliente: (updated: Cliente) => void;
    deleteCotizacion: (id: string) => void;
    updateUserPermissions: (userId: string, access: string[]) => void;
    setCurrentUser: (user: User) => void;
    // Logistics State
    inventario: InventarioItem[];
    proveedores: Proveedor[];
    vehiculos: Vehiculo[];
    dotacionItems: DotacionItem[];
    entregasDotacion: EntregaDotacion[];
    cuentasPorPagar: CuentaPorPagar[];
    gastosVehiculos: GastoVehiculo[];
    codigosTrabajo: CodigoTrabajo[];

    // Logistics Actions
    updateInventarioItem: (updated: InventarioItem) => void;
    addInventarioItem: (item: InventarioItem) => void;
    updateProveedor: (updated: Proveedor) => void;
    addProveedor: (prov: Proveedor) => void;
    updateVehiculo: (veh: Vehiculo) => void;
    addVehiculo: (veh: Vehiculo) => void;
    updateDotacionItem: (item: DotacionItem) => void;
    addEntregaDotacion: (entrega: EntregaDotacion) => void;
    addGastoVehiculo: (gasto: GastoVehiculo) => void;
    updateCuentaPorPagar: (updated: CuentaPorPagar) => void;
    addCodigoTrabajo: (codigo: CodigoTrabajo) => void;
    updateCodigoTrabajo: (updated: CodigoTrabajo) => void;
    deleteCodigoTrabajo: (id: string) => void;
    ordenesCompra: OrdenCompra[];
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function ErpProvider({ children }: { children: ReactNode }) {
    const [facturas, setFacturas] = useState<Factura[]>(initialFacturas);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialQuotes);
    const [clientes, setClientes] = useState<Cliente[]>(initialClients);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<User | undefined>(initialUsers[0]); // Default to Admin

    // Logistics State
    const [inventario, setInventario] = useState<InventarioItem[]>(initialInventory);
    const [proveedores, setProveedores] = useState<Proveedor[]>(initialProveedores);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>(initialVehiculos);
    const [dotacionItems, setDotacionItems] = useState<DotacionItem[]>(initialDotacionItems);
    const [entregasDotacion, setEntregasDotacion] = useState<EntregaDotacion[]>(initialEntregasDotacion);
    const [cuentasPorPagar, setCuentasPorPagar] = useState<CuentaPorPagar[]>(initialCuentasPorPagar);
    const [gastosVehiculos, setGastosVehiculos] = useState<GastoVehiculo[]>(initialGastosVehiculos);
    const [codigosTrabajo, setCodigosTrabajo] = useState<CodigoTrabajo[]>(initialCodigosTrabajo);
    const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>(initialOrdenesCompra);

    const addFactura = (factura: Factura) => {
        setFacturas(prev => [factura, ...prev]);
    };

    const updateFactura = (updated: Factura) => {
        setFacturas(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    const addCotizacion = (cotizacion: Cotizacion) => {
        setCotizaciones(prev => [cotizacion, ...prev]);
    };

    const updateCotizacion = (updated: Cotizacion) => {
        setCotizaciones(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const addCliente = (cliente: Cliente) => {
        setClientes(prev => [cliente, ...prev]);
    };

    const updateCliente = (updated: Cliente) => {
        setClientes(prev => prev.map(c => c.id === updated.id ? updated : c));
    };

    const deleteCotizacion = (id: string) => {
        setCotizaciones(prev => prev.filter(c => c.id !== id));
    };

    const updateUserPermissions = (userId: string, access: string[]) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, sidebarAccess: access } : u
        ));

        // Update current user if it's the same
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, sidebarAccess: access } : undefined);
        }
    };

    return (
        <ErpContext.Provider value={{
            facturas, cotizaciones, clientes, users, currentUser,
            addFactura, updateFactura,
            addCotizacion, updateCotizacion, deleteCotizacion,
            addCliente, updateCliente,
            updateUserPermissions, setCurrentUser,

            // Logistics Exports
            inventario, proveedores, vehiculos, dotacionItems, entregasDotacion, cuentasPorPagar, gastosVehiculos,

            updateInventarioItem: (updated) => setInventario(prev => prev.map(i => i.id === updated.id ? updated : i)),
            addInventarioItem: (item) => setInventario(prev => [item, ...prev]),

            updateProveedor: (updated) => setProveedores(prev => prev.map(p => p.id === updated.id ? updated : p)),
            addProveedor: (prov) => setProveedores(prev => [prov, ...prev]),

            updateVehiculo: (updated) => setVehiculos(prev => prev.map(v => v.id === updated.id ? updated : v)),
            addVehiculo: (veh) => setVehiculos(prev => [veh, ...prev]),

            updateDotacionItem: (updated) => setDotacionItems(prev => prev.map(d => d.id === updated.id ? updated : d)),
            addEntregaDotacion: (entrega) => setEntregasDotacion(prev => [entrega, ...prev]),

            addGastoVehiculo: (gasto) => setGastosVehiculos(prev => [gasto, ...prev]),
            updateCuentaPorPagar: (updated) => setCuentasPorPagar(prev => prev.map(c => c.id === updated.id ? updated : c)),

            codigosTrabajo,
            addCodigoTrabajo: (codigo) => setCodigosTrabajo(prev => [codigo, ...prev]),
            updateCodigoTrabajo: (updated) => setCodigosTrabajo(prev => prev.map(c => c.id === updated.id ? updated : c)),
            deleteCodigoTrabajo: (id) => setCodigosTrabajo(prev => prev.filter(c => c.id !== id)),
            ordenesCompra
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

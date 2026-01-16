"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Factura, Cotizacion, Cliente, User } from "@/types/sistema";
import { initialFacturas, initialQuotes, initialClients, initialUsers } from "@/lib/mock-data";

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
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function ErpProvider({ children }: { children: ReactNode }) {
    const [facturas, setFacturas] = useState<Factura[]>(initialFacturas);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialQuotes);
    const [clientes, setClientes] = useState<Cliente[]>(initialClients);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [currentUser, setCurrentUser] = useState<User | undefined>(initialUsers[0]); // Default to Admin

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
            updateUserPermissions, setCurrentUser
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

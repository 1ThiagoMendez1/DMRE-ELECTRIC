"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Factura, Cotizacion, Cliente } from "@/types/sistema";
import { initialFacturas, initialQuotes, initialClients } from "@/lib/mock-data";

interface ErpContextType {
    facturas: Factura[];
    cotizaciones: Cotizacion[];
    clientes: Cliente[];
    addFactura: (factura: Factura) => void;
    updateFactura: (updated: Factura) => void;
    addCotizacion: (cotizacion: Cotizacion) => void;
    updateCotizacion: (updated: Cotizacion) => void;
    addCliente: (cliente: Cliente) => void;
    updateCliente: (updated: Cliente) => void;
    deleteCotizacion: (id: string) => void;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export function ErpProvider({ children }: { children: ReactNode }) {
    const [facturas, setFacturas] = useState<Factura[]>(initialFacturas);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialQuotes);
    const [clientes, setClientes] = useState<Cliente[]>(initialClients);

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

    return (
        <ErpContext.Provider value={{
            facturas, cotizaciones, clientes,
            addFactura, updateFactura,
            addCotizacion, updateCotizacion, deleteCotizacion,
            addCliente, updateCliente
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

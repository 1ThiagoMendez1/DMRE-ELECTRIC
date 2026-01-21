"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AlertRule, AlertNotification, AlertsState } from "@/types/alerts";
import { useErp } from "./erp-provider";
import { addDays, differenceInDays, isBefore } from "date-fns";

interface AlertsContextType extends AlertsState {
    addRule: (rule: AlertRule) => void;
    updateRule: (id: string, updates: Partial<AlertRule>) => void;
    toggleRule: (id: string) => void;
    deleteRule: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

// Default Rules
const DEFAULT_RULES: AlertRule[] = [
    {
        id: "RULE-STOCK-LOW",
        type: "INVENTORY_STOCK",
        name: "Stock Mínimo Bajo",
        enabled: true,
        thresholdValue: 0, // Logic compares quantity <= stockMinimo
        severity: "HIGH",
        messageTemplate: "El ítem {item} tiene stock bajo ({qty} / {min})",
    },
    {
        id: "RULE-SOAT",
        type: "DOCUMENT_EXPIRY",
        name: "Vencimiento SOAT",
        enabled: true,
        thresholdDays: 30,
        categoryFilter: ["SOAT"],
        severity: "CRITICAL",
        messageTemplate: "El SOAT del vehículo {item} vence en {days} días",
    },
    {
        id: "RULE-TECNO",
        type: "DOCUMENT_EXPIRY",
        name: "Vencimiento Tecnomecánica",
        enabled: true,
        thresholdDays: 30,
        categoryFilter: ["TECNO"],
        severity: "HIGH",
        messageTemplate: "La Tecnomecánica del vehículo {item} vence en {days} días",
    },
    {
        id: "RULE-CXP",
        type: "DOCUMENT_EXPIRY",
        name: "Facturas Proveedor por Vencer",
        enabled: true,
        thresholdDays: 5,
        categoryFilter: ["CXP"],
        severity: "MEDIUM",
        messageTemplate: "Factura {item} de {vendor} vence en {days} días",
    }
];

export function AlertsProvider({ children }: { children: ReactNode }) {
    const { inventario, vehiculos, cuentasPorPagar } = useErp();
    const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
    const [notifications, setNotifications] = useState<AlertNotification[]>([]);

    // Check Rules Effect
    useEffect(() => {
        const newNotifications: AlertNotification[] = [];
        const today = new Date();

        rules.filter(r => r.enabled).forEach(rule => {
            // 1. INVENTORY STOCK
            if (rule.type === 'INVENTORY_STOCK') {
                inventario.forEach(item => {
                    if (item.cantidad <= item.stockMinimo) {
                        newNotifications.push({
                            id: `NOTIF-STOCK-${item.id}-${today.getDate()}`,
                            ruleId: rule.id,
                            itemId: item.id,
                            itemType: 'INVENTARIO',
                            message: rule.messageTemplate
                                .replace("{item}", item.descripcion)
                                .replace("{qty}", item.cantidad.toString())
                                .replace("{min}", item.stockMinimo.toString()),
                            dateGenerated: today,
                            severity: rule.severity,
                            isRead: false
                        });
                    }
                });
            }

            // 2. DOCUMENT EXPIRY (Vehicles)
            if (rule.type === 'DOCUMENT_EXPIRY') {
                // SOAT
                if (rule.categoryFilter?.includes("SOAT")) {
                    vehiculos.forEach(veh => {
                        const daysLeft = differenceInDays(new Date(veh.vencimientoSoat), today);
                        if (daysLeft <= (rule.thresholdDays || 30)) {
                            newNotifications.push({
                                id: `NOTIF-SOAT-${veh.id}-${today.getDate()}`,
                                ruleId: rule.id,
                                itemId: veh.id,
                                itemType: 'VEHICULO',
                                message: rule.messageTemplate
                                    .replace("{item}", veh.placa)
                                    .replace("{days}", daysLeft.toString()),
                                dateGenerated: today,
                                severity: daysLeft < 0 ? 'CRITICAL' : rule.severity,
                                isRead: false
                            });
                        }
                    });
                }
                // TECNO
                if (rule.categoryFilter?.includes("TECNO")) {
                    vehiculos.forEach(veh => {
                        const daysLeft = differenceInDays(new Date(veh.vencimientoTecnomecanica), today);
                        if (daysLeft <= (rule.thresholdDays || 30)) {
                            newNotifications.push({
                                id: `NOTIF-TECNO-${veh.id}-${today.getDate()}`,
                                ruleId: rule.id,
                                itemId: veh.id,
                                itemType: 'VEHICULO',
                                message: rule.messageTemplate
                                    .replace("{item}", veh.placa)
                                    .replace("{days}", daysLeft.toString()),
                                dateGenerated: today,
                                severity: daysLeft < 0 ? 'CRITICAL' : rule.severity,
                                isRead: false
                            });
                        }
                    });
                }
                // CXP (Cuentas Por Pagar)
                if (rule.categoryFilter?.includes("CXP")) {
                    cuentasPorPagar.forEach(cxp => {
                        if (cxp.saldoPendiente <= 0) return; // Ignore paid
                        const daysLeft = differenceInDays(new Date(cxp.fecha), today) + 30; // Assuming 30 days credit for now if not set
                        // Or calculate from Due Date if available. Mock data doesn't have Due Date on CXP explicitly?
                        // Let's assume fecha + 30 days is due date
                        const dueDate = addDays(new Date(cxp.fecha), 30);
                        const daysToDue = differenceInDays(dueDate, today);

                        if (daysToDue <= (rule.thresholdDays || 5)) {
                            newNotifications.push({
                                id: `NOTIF-CXP-${cxp.id}-${today.getDate()}`,
                                ruleId: rule.id,
                                itemId: cxp.id,
                                itemType: 'FACTURA',
                                message: rule.messageTemplate
                                    .replace("{item}", cxp.numeroFacturaProveedor)
                                    .replace("{vendor}", cxp.proveedor.nombre)
                                    .replace("{days}", daysToDue.toString()),
                                dateGenerated: today,
                                severity: daysToDue < 0 ? 'HIGH' : rule.severity,
                                isRead: false
                            });
                        }
                    });
                }
            }
        });

        // Deduplicate logic? 
        // For now, simpler: Just replace state. In real app, merge with existing reads.
        // We'll simplistic merge: keep status of existing if ID matches.
        setNotifications(prev => {
            const existingMap = new Map(prev.map(n => [n.id, n]));
            return newNotifications.map(n => {
                const existing = existingMap.get(n.id);
                return existing ? { ...n, isRead: existing.isRead } : n;
            });
        });

    }, [inventario, vehiculos, cuentasPorPagar, rules]);

    const addRule = (rule: AlertRule) => setRules(prev => [...prev, rule]);
    const updateRule = (id: string, updates: Partial<AlertRule>) => setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    const toggleRule = (id: string) => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const deleteRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id));
    const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const clearNotifications = () => setNotifications([]);

    return (
        <AlertsContext.Provider value={{
            rules,
            notifications,
            unreadCount: notifications.filter(n => !n.isRead).length,
            addRule,
            updateRule,
            toggleRule,
            deleteRule,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </AlertsContext.Provider>
    );
}

export function useAlerts() {
    const context = useContext(AlertsContext);
    if (!context) throw new Error("useAlerts must be used within AlertsProvider");
    return context;
}

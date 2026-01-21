"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Package, TrendingUp, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { DotacionItem, EntregaDotacion } from "@/types/sistema";
import { differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface DotacionMetricsDashboardProps {
    dotacionItems: DotacionItem[];
    entregas: EntregaDotacion[];
}

export function DotacionMetricsDashboard({ dotacionItems, entregas }: DotacionMetricsDashboardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const metrics = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Total Inventory
        const totalStock = dotacionItems.reduce((acc, item) =>
            acc + item.variantes.reduce((vAcc, v) => vAcc + v.cantidadDisponible, 0), 0
        );

        // Assigned (not delivered yet)
        const assignedTotal = entregas
            .filter(e => e.estado === 'ASIGNADO' || e.estado === 'ACEPTADO')
            .reduce((acc, e) => acc + e.items.reduce((iAcc, i) => iAcc + i.cantidad, 0), 0);

        // Deliveries this month
        const deliveriesThisMonth = entregas.filter(e =>
            e.estado === 'ENTREGADO' &&
            e.fechaEntrega &&
            isWithinInterval(new Date(e.fechaEntrega), { start: monthStart, end: monthEnd })
        ).length;

        // Pending confirmation (ASIGNADO only)
        const pendingConfirmation = entregas.filter(e => e.estado === 'ASIGNADO').length;

        // Pending delivery (ACEPTADO only)
        const pendingDelivery = entregas.filter(e => e.estado === 'ACEPTADO').length;

        // Upcoming expirations (EPP items within 30 days)
        const upcomingExpirations = dotacionItems.filter(item =>
            item.categoria === 'EPP' &&
            item.fechaVencimiento &&
            differenceInDays(new Date(item.fechaVencimiento), now) <= 30 &&
            differenceInDays(new Date(item.fechaVencimiento), now) >= 0
        ).length;

        // Low stock items
        const lowStockItems = dotacionItems.filter(item => {
            const total = item.variantes.reduce((acc, v) => acc + v.cantidadDisponible, 0);
            return item.stockMinimo && total <= item.stockMinimo;
        }).length;

        return {
            totalStock,
            assignedTotal,
            availablePercentage: totalStock > 0 ? Math.round(((totalStock - assignedTotal) / totalStock) * 100) : 100,
            deliveriesThisMonth,
            pendingConfirmation,
            pendingDelivery,
            upcomingExpirations,
            lowStockItems
        };
    }, [dotacionItems, entregas]);

    return (
        <div className="mb-6">
            <Button
                variant="ghost"
                className="w-full flex justify-between items-center py-2 px-4 hover:bg-muted/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="font-semibold text-sm">Resumen de Gestión y Métricas</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {isExpanded && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {/* Inventario Total */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Inventario Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalStock}</div>
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Disponible</span>
                                    <span>{metrics.availablePercentage}%</span>
                                </div>
                                <Progress value={metrics.availablePercentage} className="h-2" />
                            </div>
                            {metrics.lowStockItems > 0 && (
                                <div className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {metrics.lowStockItems} con stock bajo
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Entregas del Mes */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Entregas del Mes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">{metrics.deliveriesThisMonth}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                entregas confirmadas
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pendientes */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs">Por aceptar:</span>
                                    <Badge variant={metrics.pendingConfirmation > 0 ? "secondary" : "outline"} className="text-xs">
                                        {metrics.pendingConfirmation}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs">Por entregar:</span>
                                    <Badge variant={metrics.pendingDelivery > 0 ? "default" : "outline"} className="text-xs">
                                        {metrics.pendingDelivery}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vencimientos EPP */}
                    <Card className={cn("shadow-sm", metrics.upcomingExpirations > 0 && "border-amber-500/50")}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4" />
                                Vencimientos EPP
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", metrics.upcomingExpirations > 0 ? "text-amber-500" : "text-muted-foreground")}>
                                {metrics.upcomingExpirations}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {metrics.upcomingExpirations > 0 ? "vencen en 30 días" : "sin vencimientos próximos"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

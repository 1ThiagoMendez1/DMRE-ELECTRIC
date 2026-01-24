"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Car, Fuel, Wrench, Settings, AlertTriangle, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Vehiculo, GastoVehiculo } from "@/types/sistema";
import { differenceInDays, startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

interface ActivosDashboardProps {
    vehiculos: Vehiculo[];
    gastos: GastoVehiculo[];
}

const COLORS_STATUS = ['#22c55e', '#eab308', '#ef4444'];

export function ActivosDashboard({ vehiculos, gastos }: ActivosDashboardProps) {
    const [periodoFiltro, setPeriodoFiltro] = useState<'30d' | '3m' | '1y'>('30d');

    const metrics = useMemo(() => {
        const now = new Date();
        const totalVehiculos = vehiculos.length;
        const operativos = vehiculos.filter(v => v.estado === 'OPERATIVO').length;
        const mantenimiento = vehiculos.filter(v => v.estado === 'MANTENIMIENTO').length;
        const inactivos = vehiculos.filter(v => v.estado === 'INACTIVO').length;
        const disponibilidad = totalVehiculos > 0 ? (operativos / totalVehiculos) * 100 : 0;

        // Documentos por vencer (< 30 días)
        const vencimientosProximos = vehiculos.filter(v => {
            const soatDays = differenceInDays(new Date(v.vencimientoSoat), now);
            const tecnoDays = differenceInDays(new Date(v.vencimientoTecnomecanica), now);
            const seguroDays = differenceInDays(new Date(v.vencimientoSeguro), now);
            return (soatDays >= 0 && soatDays <= 30) ||
                (tecnoDays >= 0 && tecnoDays <= 30) ||
                (seguroDays >= 0 && seguroDays <= 30);
        }).length;

        // Documentos vencidos
        const vencidos = vehiculos.filter(v => {
            const soatDays = differenceInDays(new Date(v.vencimientoSoat), now);
            const tecnoDays = differenceInDays(new Date(v.vencimientoTecnomecanica), now);
            const seguroDays = differenceInDays(new Date(v.vencimientoSeguro), now);
            return soatDays < 0 || tecnoDays < 0 || seguroDays < 0;
        }).length;

        // Filtrar gastos por período
        let fechaInicio: Date;
        switch (periodoFiltro) {
            case '3m': fechaInicio = subMonths(now, 3); break;
            case '1y': fechaInicio = subMonths(now, 12); break;
            default: fechaInicio = subMonths(now, 1);
        }

        const gastosFiltrados = gastos.filter(g => new Date(g.fecha) >= fechaInicio);
        const gastoTotal = gastosFiltrados.reduce((acc, g) => acc + g.valor, 0);
        const gastoCombustible = gastosFiltrados.filter(g => g.tipo === 'COMBUSTIBLE').reduce((acc, g) => acc + g.valor, 0);
        const gastoMantenimiento = gastosFiltrados.filter(g => g.tipo === 'MANTENIMIENTO').reduce((acc, g) => acc + g.valor, 0);

        // Kilometraje total
        const kmTotal = vehiculos.reduce((acc, v) => acc + (v.kilometrajeActual || 0), 0);
        const costoPorKm = kmTotal > 0 ? gastoTotal / kmTotal : 0;

        // Vehículo con mayor gasto
        const gastosPorVehiculo = new Map<string, { placa: string; total: number }>();
        gastosFiltrados.forEach(g => {
            const current = gastosPorVehiculo.get(g.vehiculo.placa) || { placa: g.vehiculo.placa, total: 0 };
            current.total += g.valor;
            gastosPorVehiculo.set(g.vehiculo.placa, current);
        });
        const mayorGaston = Array.from(gastosPorVehiculo.values()).sort((a, b) => b.total - a.total)[0];

        return {
            totalVehiculos,
            operativos,
            mantenimiento,
            inactivos,
            disponibilidad,
            vencimientosProximos,
            vencidos,
            gastoTotal,
            gastoCombustible,
            gastoMantenimiento,
            costoPorKm,
            mayorGaston
        };
    }, [vehiculos, gastos, periodoFiltro]);

    // Datos para gráfico de tendencia
    const trendData = useMemo(() => {
        const now = new Date();
        const months: { month: string; combustible: number; mantenimiento: number; otros: number }[] = [];

        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(now, i);
            const start = startOfMonth(monthDate);
            const end = endOfMonth(monthDate);

            const monthGastos = gastos.filter(g =>
                isWithinInterval(new Date(g.fecha), { start, end })
            );

            months.push({
                month: format(monthDate, 'MMM', { locale: es }),
                combustible: monthGastos.filter(g => g.tipo === 'COMBUSTIBLE').reduce((acc, g) => acc + g.valor, 0),
                mantenimiento: monthGastos.filter(g => g.tipo === 'MANTENIMIENTO').reduce((acc, g) => acc + g.valor, 0),
                otros: monthGastos.filter(g => !['COMBUSTIBLE', 'MANTENIMIENTO'].includes(g.tipo)).reduce((acc, g) => acc + g.valor, 0)
            });
        }
        return months;
    }, [gastos]);

    const statusData = [
        { name: 'Operativo', value: metrics.operativos },
        { name: 'Mantenimiento', value: metrics.mantenimiento },
        { name: 'Inactivo', value: metrics.inactivos },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filtro Temporal */}
            <div className="flex justify-end gap-2">
                {[
                    { value: '30d', label: 'Últimos 30 días' },
                    { value: '3m', label: '3 Meses' },
                    { value: '1y', label: 'Año' }
                ].map((opt) => (
                    <Badge
                        key={opt.value}
                        variant={periodoFiltro === opt.value ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setPeriodoFiltro(opt.value as any)}
                    >
                        {opt.label}
                    </Badge>
                ))}
            </div>

            {/* KPI Cards - Row 1 */}
            <div className="grid gap-4 md:grid-cols-6">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Flota Total</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalVehiculos}</div>
                        <p className="text-xs text-muted-foreground">{metrics.operativos} operativos</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
                        <Settings className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(metrics.disponibilidad)}%</div>
                        <Progress value={metrics.disponibilidad} className="h-2 mt-2" />
                    </CardContent>
                </Card>

                <Card className={`shadow-sm ${(metrics.vencimientosProximos + metrics.vencidos) > 0 ? 'border-amber-500/50' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Vencimientos</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${(metrics.vencimientosProximos + metrics.vencidos) > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            {metrics.vencidos > 0 && (
                                <span className="text-xl font-bold text-red-500">{metrics.vencidos}</span>
                            )}
                            <span className="text-xl font-bold text-amber-500">{metrics.vencimientosProximos}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.vencidos > 0 ? `${metrics.vencidos} vencidos, ` : ''}
                            {metrics.vencimientosProximos} próx. 30 días
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{formatCurrency(metrics.gastoTotal)}</div>
                        <p className="text-xs text-muted-foreground">Período seleccionado</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Costo/KM</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${Math.round(metrics.costoPorKm)}</div>
                        <p className="text-xs text-muted-foreground">por kilómetro</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Mayor Gasto</CardTitle>
                        <Car className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{metrics.mayorGaston?.placa || '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.mayorGaston ? formatCurrency(metrics.mayorGaston.total) : 'Sin datos'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Tendencia de Costos Operativos</CardTitle>
                        <CardDescription>Últimos 6 meses por categoría</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(val) => `$${val / 1000000}M`} />
                                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                <Legend />
                                <Bar dataKey="combustible" name="Combustible" fill="#f97316" stackId="a" />
                                <Bar dataKey="mantenimiento" name="Mantenimiento" fill="#3b82f6" stackId="a" />
                                <Bar dataKey="otros" name="Otros" fill="#8b5cf6" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Estado de la Flota</CardTitle>
                        <CardDescription>Distribución actual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

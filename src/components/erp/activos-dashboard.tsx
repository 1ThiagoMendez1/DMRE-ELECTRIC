"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Car, Fuel, Wrench, Settings } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ActivosDashboardProps {
    vehiculos: any[];
    gastos: any[];
}

const COLORS_STATUS = ['#22c55e', '#ef4444', '#eab308'];

const mockExpenseTrend = [
    { month: 'Ene', combustible: 1200000, mantenimiento: 500000 },
    { month: 'Feb', combustible: 1300000, mantenimiento: 200000 },
    { month: 'Mar', combustible: 1100000, mantenimiento: 1500000 },
    { month: 'Abr', combustible: 1400000, mantenimiento: 300000 },
    { month: 'May', combustible: 1250000, mantenimiento: 800000 },
    { month: 'Jun', combustible: 1350000, mantenimiento: 400000 },
];

export function ActivosDashboard({ vehiculos, gastos }: ActivosDashboardProps) {
    const totalVehiculos = vehiculos.length;
    const operativos = vehiculos.filter(v => v.estado === 'OPERATIVO').length;
    const mantenimiento = vehiculos.filter(v => v.estado === 'MANTENIMIENTO').length;

    // Simplistic calculation for total monthly expense (using mock or summing passed gastos)
    const totalGastoMes = gastos.reduce((acc, g) => acc + g.valor, 0);

    const statusData = [
        { name: 'Operativo', value: operativos },
        { name: 'Mantenimiento', value: mantenimiento },
        { name: 'Inactivo', value: totalVehiculos - operativos - mantenimiento },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Flota Total</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVehiculos}</div>
                        <p className="text-xs text-muted-foreground">Unidades registradas</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
                        <Settings className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{((operativos / totalVehiculos) * 100).toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">{operativos} Operativos</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Combustible</CardTitle>
                        <Fuel className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalGastoMes * 0.6)}</div>
                        <p className="text-xs text-muted-foreground">Est. mes actual</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Mantenimiento</CardTitle>
                        <Wrench className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalGastoMes * 0.4)}</div>
                        <p className="text-xs text-muted-foreground">Est. mes actual</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Tendencia de Costos Operativos</CardTitle>
                        <CardDescription>Combustible vs Mantenimiento (6 Meses)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockExpenseTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                <Legend />
                                <Line type="monotone" dataKey="combustible" stroke="#f97316" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="mantenimiento" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
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

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Proveedor, CuentaPorPagar } from "@/types/sistema"; // Assuming types exist or compatible
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SuministroDashboardProps {
    proveedores: any[];
    cuentasPorPagar: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const mockMonthlyData = [
    { name: 'Ene', compras: 4000000, pagos: 3500000 },
    { name: 'Feb', compras: 3000000, pagos: 2800000 },
    { name: 'Mar', compras: 5000000, pagos: 4500000 },
    { name: 'Abr', compras: 4500000, pagos: 4000000 },
    { name: 'May', compras: 6000000, pagos: 5500000 },
    { name: 'Jun', compras: 5500000, pagos: 5000000 },
];

const mockCategoryData = [
    { name: 'Material Eléctrico', value: 45 },
    { name: 'Herramientas', value: 25 },
    { name: 'Consumibles', value: 20 },
    { name: 'Servicios', value: 10 },
];

export function SuministroDashboard({ proveedores, cuentasPorPagar }: SuministroDashboardProps) {
    const totalDeuda = cuentasPorPagar.reduce((sum, c) => sum + c.saldoPendiente, 0);
    const totalProveedores = proveedores.length;
    const facturasPendientes = cuentasPorPagar.filter(c => c.saldoPendiente > 0).length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Deuda Total Proveedores</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeuda)}</div>
                        <p className="text-xs text-muted-foreground">+5% vs mes anterior</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProveedores}</div>
                        <p className="text-xs text-muted-foreground">2 Nuevos este mes</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Facturas por Vencer</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{facturasPendientes}</div>
                        <p className="text-xs text-muted-foreground">3 Vencen esta semana</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Flujo de Compras vs Pagos</CardTitle>
                        <CardDescription>Comparativo semestral de egresos</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockMonthlyData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(value) => `$${value / 1000000}M`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="compras" name="Compras" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pagos" name="Pagos Realizados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Gasto por Categoría</CardTitle>
                        <CardDescription>Distribución porcentual</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mockCategoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

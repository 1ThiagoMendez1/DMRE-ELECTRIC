"use client";

import { useState, useMemo } from "react";
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription 
} from "@/components/ui/card";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    PieChart, 
    BarChart3, 
    History,
    ArrowUpRight,
    ArrowDownRight,
    Info
} from "lucide-react";
import { 
    ResponsiveContainer, 
    PieChart as RePieChart, 
    Pie, 
    Cell, 
    Tooltip, 
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export function ProjectProfitabilityModule() {
    const { cotizaciones, movimientosFinancieros, comprasFinanciera } = useErp();
    const [selectedCotizacionId, setSelectedCotizacionId] = useState<string>("");

    // Get only approved or in-progress quotes
    const activeQuotes = useMemo(() => 
        cotizaciones.filter(q => ['APROBADA', 'EN_EJECUCION', 'FINALIZADA'].includes(q.estado)),
    [cotizaciones]);

    const selectedQuote = useMemo(() => 
        activeQuotes.find(q => q.id === selectedCotizacionId),
    [activeQuotes, selectedCotizacionId]);

    const analytics = useMemo(() => {
        if (!selectedQuote) return null;

        // 1. Filter movements for this quote
        const linkedMovimientos = movimientosFinancieros.filter(m => m.cotizacionId === selectedQuote.id);
        
        // 2. Filter purchases for this quote
        const linkedCompras = comprasFinanciera.filter(c => c.cotizacionId === selectedQuote.id);

        // 3. Totals
        const totalIngresos = linkedMovimientos
            .filter(m => m.tipo === 'INGRESO')
            .reduce((sum, m) => sum + m.valor, 0);

        const totalEgresosMov = linkedMovimientos
            .filter(m => m.tipo === 'EGRESO')
            .reduce((sum, m) => sum + m.valor, 0);

        const totalCompras = linkedCompras
            .reduce((sum, c) => sum + c.valorFactura, 0);

        const totalGastos = totalEgresosMov + totalCompras;
        const budget = selectedQuote.total;
        const margin = budget - totalGastos;
        const profitability = budget > 0 ? (margin / budget) * 100 : 0;
        const consumptionPercent = budget > 0 ? (totalGastos / budget) * 100 : 0;

        // 4. Category breakdown
        const categories: Record<string, number> = {};
        
        linkedMovimientos.filter(m => m.tipo === 'EGRESO').forEach(m => {
            categories[m.categoria] = (categories[m.categoria] || 0) + m.valor;
        });
        
        if (totalCompras > 0) {
            categories['COMPRAS_PROVEEDOR'] = (categories['COMPRAS_PROVEEDOR'] || 0) + totalCompras;
        }

        const pieData = Object.entries(categories).map(([name, value]) => ({ name, value }));

        // 5. Unified History (Movimientos + Compras)
        const history = [
            ...linkedMovimientos.map(m => ({
                fecha: m.fecha,
                concepto: m.concepto,
                tipo: m.tipo,
                categoria: m.categoria,
                valor: m.valor,
                tercero: m.tercero,
                isCompra: false
            })),
            ...linkedCompras.map(c => ({
                fecha: c.fecha,
                concepto: `Compra Factura ${c.numeroFactura}`,
                tipo: 'EGRESO' as const,
                categoria: 'PROVEEDORES',
                valor: c.valorFactura,
                tercero: c.cotizacionProveedor?.proveedor?.nombre || 'Proveedor',
                isCompra: true
            }))
        ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return {
            totalIngresos,
            totalGastos,
            budget,
            margin,
            profitability,
            consumptionPercent,
            pieData,
            history,
            linkedMovimientos,
            linkedCompras
        };
    }, [selectedQuote, movimientosFinancieros, comprasFinanciera]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Rentabilidad y Análisis de Proyectos</CardTitle>
                            <CardDescription>Seguimiento de costos vs presupuesto de la oferta en tiempo real.</CardDescription>
                        </div>
                        <div className="w-full md:w-[400px]">
                            <Select value={selectedCotizacionId} onValueChange={setSelectedCotizacionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una oferta para analizar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeQuotes.map(q => (
                                        <SelectItem key={q.id} value={q.id}>
                                            {q.numero} - {q.cliente?.nombre} ({q.descripcionTrabajo})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {!selectedQuote ? (
                <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-muted/20">
                    <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Seleccione una oferta para ver el análisis de rentabilidad.</p>
                </div>
            ) : (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Presupuesto Inicial</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(analytics?.budget || 0)}</div>
                                <p className="text-xs text-muted-foreground mt-1">Valor total de la oferta aprobada</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Gastos Ejecutados</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(analytics?.totalGastos || 0)}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <Progress value={analytics?.consumptionPercent} className="h-1 flex-1" />
                                    <span className="text-[10px] font-medium">{analytics?.consumptionPercent.toFixed(1)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Utilidad Actual</CardTitle>
                                {analytics && analytics.margin >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                            </CardHeader>
                            <CardContent>
                                <div className={cn(
                                    "text-2xl font-bold",
                                    analytics && analytics.margin >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {formatCurrency(analytics?.margin || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Margen real acumulado</p>
                            </CardContent>
                        </Card>

                        <Card className={cn(
                            "bg-primary/5 border-primary/20",
                            analytics && analytics.profitability < 15 && "bg-amber-50 border-amber-200"
                        )}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase">% Rentabilidad</CardTitle>
                                <BarChart3 className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics?.profitability.toFixed(1)}%</div>
                                {analytics && analytics.profitability < 15 && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-1">
                                        <Info className="h-3 w-3" /> Margen bajo
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Breakdown Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Distribución por Categoría</CardTitle>
                                <CardDescription>Reparto del gasto real ejecutado.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={analytics?.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analytics?.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3">
                                    {analytics?.pieData.map((cat, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{cat.name}</span>
                                                <span>{formatCurrency(cat.value)} ({((cat.value / (analytics.totalGastos || 1)) * 100).toFixed(1)}%)</span>
                                            </div>
                                            <Progress 
                                                value={(cat.value / (analytics.totalGastos || 1)) * 100} 
                                                className="h-1" 
                                                style={{ backgroundColor: `${COLORS[i % COLORS.length]}20` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Historial de Costos Vinculados</CardTitle>
                                <CardDescription>Todos los movimientos y facturas cargados a esta oferta.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[300px] overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background">
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Concepto</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics?.history.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                        No hay gastos registrados para esta oferta.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                analytics?.history.map((h, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="text-xs whitespace-nowrap">
                                                            {new Date(h.fecha).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-medium">{h.concepto}</span>
                                                                <span className="text-[10px] text-muted-foreground">{h.tercero}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className={cn(
                                                            "text-right text-xs font-mono",
                                                            h.tipo === 'INGRESO' ? "text-green-600" : "text-red-600"
                                                        )}>
                                                            {h.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(h.valor)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Comparative View */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Análisis Comparativo</CardTitle>
                            <CardDescription>Presupuesto vs Real por categoría.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics?.pieData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={10} />
                                        <YAxis fontSize={10} tickFormatter={(val) => `$${val/1000000}M`} />
                                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                        <Bar dataKey="value" name="Gasto Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

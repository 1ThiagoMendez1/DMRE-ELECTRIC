"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { Landmark, Wallet, History, Search, X } from "lucide-react";
import { CuentaBancaria, MovimientoFinanciero } from "@/types/sistema";
import { cn, formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

interface CuentaHistoryDialogProps {
    cuenta: CuentaBancaria;
    movimientos: MovimientoFinanciero[];
    trigger?: React.ReactNode;
}

export function CuentaHistoryDialog({ cuenta, movimientos, trigger }: CuentaHistoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });
    const [categoryFilter, setCategoryFilter] = useState("TODAS");
    const [typeFilter, setTypeFilter] = useState("TODOS");


    // Base movements for this account (filter by cuentaId or cuenta.id)
    const accountMovimientos = movimientos.filter(m => m.cuentaId === cuenta.id || (m.cuenta && m.cuenta.id === cuenta.id));

    // Get unique categories for filter
    const categories = Array.from(new Set(accountMovimientos.map(m => m.categoria))).sort();

    // Apply filters
    const filteredMovimientos = accountMovimientos.filter(m => {
        // Search filter
        const concepto = m.concepto || m.descripcion || "";
        const tercero = m.tercero || "";
        const matchesSearch =
            concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tercero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.valor.toString().includes(searchTerm);

        // Date filter
        let matchesDate = true;
        if (dateRange?.from) {
            const mDate = new Date(m.fecha);
            if (dateRange.to) {
                matchesDate = isWithinInterval(mDate, { start: dateRange.from, end: dateRange.to });
            } else {
                matchesDate = mDate >= dateRange.from;
            }
        }

        // Category filter
        const matchesCategory = categoryFilter === "TODAS" || m.categoria === categoryFilter;

        // Type filter
        const matchesType = typeFilter === "TODOS" || m.tipo === typeFilter;

        return matchesSearch && matchesDate && matchesCategory && matchesType;
    });

    const totalIngresos = filteredMovimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.valor, 0);
    const totalEgresos = filteredMovimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.valor, 0);

    // Analytics Data (derived from filtered movements)
    const analyticsData = useMemo(() => {
        // 1. Income vs Expense over time
        const trendMap: Record<string, { name: string, ingresos: number, egresos: number }> = {};

        filteredMovimientos.forEach(m => {
            const dateStr = format(new Date(m.fecha), "dd MMM", { locale: es });
            if (!trendMap[dateStr]) trendMap[dateStr] = { name: dateStr, ingresos: 0, egresos: 0 };

            if (m.tipo === 'INGRESO') trendMap[dateStr].ingresos += m.valor;
            else trendMap[dateStr].egresos += m.valor;
        });

        const trendData = Object.values(trendMap).sort((a, b) => {
            // Basic sort attempting to keep dates in order if possible (string sort is poor but better than random)
            return a.name.localeCompare(b.name);
        });

        // 2. Full Category Statistics (In/Out/Net)
        const fullCatMap: Record<string, { in: number, out: number }> = {};
        filteredMovimientos.forEach(m => {
            if (!fullCatMap[m.categoria]) fullCatMap[m.categoria] = { in: 0, out: 0 };
            if (m.tipo === 'INGRESO') fullCatMap[m.categoria].in += m.valor;
            else fullCatMap[m.categoria].out += m.valor;
        });

        // Chart Data (Expenses only for the Pie Chart view)
        const categoryData = Object.keys(fullCatMap)
            .filter(k => fullCatMap[k].out > 0)
            .map(k => ({ name: k, value: fullCatMap[k].out }))
            .sort((a, b) => b.value - a.value);

        // Comparative Category Table (Formatted Strings)
        const categoryTable = Object.keys(fullCatMap).map(k => ({
            categoria: k,
            ingresos: formatCurrency(fullCatMap[k].in),
            egresos: formatCurrency(fullCatMap[k].out),
            neto: formatCurrency(fullCatMap[k].in - fullCatMap[k].out)
        })).sort((a, b) => {
            // Sort by highest activity (total flow) or expense?
            // User asked "comparativa", usually expense is interest. Return by Egresos Desc.
            // Accessing raw numbers needs keeping them or re-parsing. 
            // To sort correctly, I should do sort BEFORE format.
            return fullCatMap[b.categoria].out - fullCatMap[a.categoria].out;
        });

        // 3. Top Expenses Table (Formatted Strings)
        const expensesTable = filteredMovimientos
            .filter(m => m.tipo === 'EGRESO')
            .sort((a, b) => b.valor - a.valor) // Highest to lowest
            .map(m => ({
                fecha: format(new Date(m.fecha), "dd MMM yyyy", { locale: es }),
                concepto: m.concepto || m.descripcion || "Sin concepto",
                categoria: m.categoria,
                valor: formatCurrency(m.valor)
            }));

        // 4. Credit Specific Metrics
        const isCredit = cuenta.tipo === 'CREDITO';
        const creditMetrics = isCredit ? {
            utilization: cuenta.cupoTotal ? (cuenta.saldoActual / cuenta.cupoTotal) * 100 : 0,
            available: cuenta.cupoTotal ? cuenta.cupoTotal - cuenta.saldoActual : 0,
            monthlyInterest: cuenta.saldoActual * ((cuenta.tasaInteres || 0) / 100),
            projectedDebt: cuenta.saldoActual * (1 + (cuenta.tasaInteres || 0) / 100),
            debtChangePercent: trendData.length >= 2 
                ? ((trendData[trendData.length-1].egresos - trendData[0].egresos) / (trendData[0].egresos || 1)) * 100 
                : 0
        } : null;

        return { trendData, categoryData, expensesTable, categoryTable, creditMetrics };
    }, [filteredMovimientos, cuenta]);

    const clearFilters = () => {
        setSearchTerm("");
        setDateRange(undefined);
        setCategoryFilter("TODAS");
        setTypeFilter("TODOS");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <span className="cursor-pointer hover:underline text-primary font-medium flex items-center gap-2">
                        {cuenta.tipo === 'BANCO' ? <Landmark className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                        {cuenta.nombre}
                    </span>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Historial de Cuenta: {cuenta.nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Detalle de movimientos, fechas y análisis.
                    </DialogDescription>
                    {cuenta.saldoActual !== undefined && (
                        <div className="flex gap-4 pt-2">
                            <Badge variant="outline" className="text-base px-3 py-1 bg-background/50">
                                Saldo Actual: <span className="font-bold ml-2">{formatCurrency(cuenta.saldoActual)}</span>
                            </Badge>
                            <Badge variant="outline" className="text-base px-3 py-1 bg-green-500/10 text-green-700 border-green-200">
                                Ingresos (Vista): <span className="font-bold ml-2">{formatCurrency(totalIngresos)}</span>
                            </Badge>
                            <Badge variant="outline" className="text-base px-3 py-1 bg-red-500/10 text-red-700 border-red-200">
                                Egresos (Vista): <span className="font-bold ml-2">{formatCurrency(totalEgresos)}</span>
                            </Badge>
                        </div>
                    )}
                </DialogHeader>

                <Tabs defaultValue="movimientos" className="flex-1 flex flex-col overflow-hidden mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="movimientos">Movimientos Detallados</TabsTrigger>
                        <TabsTrigger value="analisis">Análisis y Gráficos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="movimientos" className="flex-1 flex flex-col overflow-hidden data-[state=inactive]:hidden">
                        {/* Filters Section */}
                        <div className="flex flex-col gap-4 mb-4 p-4 border rounded-lg bg-muted/20">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                    <Search className="h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar concepto, tercero..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-background"
                                    />
                                </div>
                                <DatePickerWithRange value={dateRange} onChange={setDateRange} className="w-[260px]" />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-[180px] bg-background">
                                        <SelectValue placeholder="Categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODAS">Todas las Categorías</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px] bg-background">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TODOS">Todos los Tipos</SelectItem>
                                        <SelectItem value="INGRESO">Ingresos</SelectItem>
                                        <SelectItem value="EGRESO">Egresos</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-muted-foreground hover:text-foreground">
                                    <X className="mr-2 h-3 w-3" />
                                    Limpiar Filtros
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">Fecha y Hora</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Cuota</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovimientos.length > 0 ? (
                                        filteredMovimientos.map((mov) => (
                                            <TableRow key={mov.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {format(new Date(mov.fecha), "dd MMM yyyy", { locale: es })}
                                                    <br />
                                                    <span className="text-muted-foreground">{format(new Date(mov.fecha), "HH:mm:ss")}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{mov.concepto || mov.descripcion || "Sin concepto"}</div>
                                                    <div className="text-xs text-muted-foreground">{mov.tercero || "—"}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">{mov.categoria}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {mov.cuotas ? (
                                                        <span className="text-xs font-mono">
                                                            {mov.cuotaActual || 1}/{mov.cuotas}
                                                        </span>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={mov.tipo === 'INGRESO' ? 'default' : 'secondary'} className={mov.tipo === 'EGRESO' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}>
                                                        {mov.tipo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.valor)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No se encontraron movimientos con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="analisis" className="flex-1 overflow-auto space-y-6 data-[state=inactive]:hidden pb-4">
                        {filteredMovimientos.length === 0 ? (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                No hay movimientos para generar análisis con los filtros seleccionados.
                            </div>
                        ) : (
                            <>
                                {cuenta.tipo === 'CREDITO' && analyticsData.creditMetrics && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <Card className="bg-primary/5 border-primary/20">
                                            <CardHeader className="py-2">
                                                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Utilización de Cupo</CardTitle>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <div className="text-2xl font-bold">{analyticsData.creditMetrics.utilization.toFixed(1)}%</div>
                                                <div className="w-full bg-muted h-1.5 mt-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all",
                                                            analyticsData.creditMetrics.utilization > 80 ? "bg-red-500" : 
                                                            analyticsData.creditMetrics.utilization > 50 ? "bg-amber-500" : "bg-green-500"
                                                        )}
                                                        style={{ width: `${Math.min(analyticsData.creditMetrics.utilization, 100)}%` }}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="py-2">
                                                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Interés Mensual Est.</CardTitle>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <div className="text-2xl font-bold text-red-600">{formatCurrency(analyticsData.creditMetrics.monthlyInterest)}</div>
                                                <p className="text-[10px] text-muted-foreground">Basado en tasa del {cuenta.tasaInteres}%</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="py-2">
                                                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Proyección Próximo Mes</CardTitle>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <div className="text-2xl font-bold">{formatCurrency(analyticsData.creditMetrics.projectedDebt)}</div>
                                                <p className="text-[10px] text-muted-foreground">Saldo + Interés esperado</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="py-2">
                                                <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Días para Corte/Pago</CardTitle>
                                            </CardHeader>
                                            <CardContent className="py-2">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-lg font-bold">Día {cuenta.fechaCorte}</div>
                                                        <div className="text-[10px] text-muted-foreground">Corte</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold">Día {cuenta.fechaPago}</div>
                                                        <div className="text-[10px] text-muted-foreground">Pago</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                                {/* Row 1: Pie Chart + Category Table */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Pie Chart - Gastos por Categoría */}
                                    <Card>
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-base">Gastos por Categoría</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {analyticsData.categoryData.length > 0 ? (
                                                <div style={{ width: '100%', height: 280 }}>
                                                    <ResponsiveContainer width="100%" height={280}>
                                                        <PieChart>
                                                            <Pie
                                                                data={analyticsData.categoryData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={50}
                                                                outerRadius={90}
                                                                paddingAngle={3}
                                                                dataKey="value"
                                                                nameKey="name"
                                                            >
                                                                {analyticsData.categoryData.map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value: number) => formatCurrency(value)}
                                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                                            />
                                                            <Legend verticalAlign="bottom" height={36} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                                                    No hay egresos para mostrar
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Category Comparison Table */}
                                    <Card>
                                        <CardHeader className="py-3">
                                            <CardTitle className="text-base">Comparativa por Categoría</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-auto max-h-[300px]">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Categoría</TableHead>
                                                            <TableHead className="text-right text-green-600">Ingresos</TableHead>
                                                            <TableHead className="text-right text-red-600">Egresos</TableHead>
                                                            <TableHead className="text-right">Neto</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {analyticsData.categoryTable.map((row, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                        <span className="capitalize text-sm">{row.categoria.toLowerCase()}</span>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right text-green-600 font-medium">{row.ingresos}</TableCell>
                                                                <TableCell className="text-right text-red-600 font-medium">{row.egresos}</TableCell>
                                                                <TableCell className="text-right font-bold">{row.neto}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Row 2: Trend Bar Chart - Ingresos vs Egresos */}
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base">Evolución de Ingresos vs Egresos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div style={{ width: '100%', height: 280 }}>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={analyticsData.trendData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                                                    <Tooltip
                                                        formatter={(value: number) => formatCurrency(value)}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="ingresos" name={cuenta.tipo === 'CREDITO' ? "Pagos / Abonos" : "Ingresos"} fill="#10b981" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="egresos" name={cuenta.tipo === 'CREDITO' ? "Compras / Cargos" : "Egresos"} fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Row 3: Top Expenses Table */}
                                <Card>
                                    <CardHeader className="py-3">
                                        <CardTitle className="text-base">Top Gastos Individuales (Mayor a Menor)</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-auto max-h-[300px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Fecha</TableHead>
                                                        <TableHead>Concepto</TableHead>
                                                        <TableHead>Categoría</TableHead>
                                                        <TableHead className="text-right">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {analyticsData.expensesTable.length > 0 ? (
                                                        analyticsData.expensesTable.map((row, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="text-sm">{row.fecha}</TableCell>
                                                                <TableCell className="text-sm font-medium">{row.concepto}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="text-xs">{row.categoria}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right text-red-600 font-medium">{row.valor}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    ) : (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                                                No hay egresos registrados
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

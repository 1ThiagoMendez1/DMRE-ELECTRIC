"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { CuentaBancaria } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import { initialMovimientos } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicChart, DashboardPanel } from "@/components/erp/charts";

interface CuentaHistoryDialogProps {
    cuenta: CuentaBancaria;
    trigger?: React.ReactNode;
}

export function CuentaHistoryDialog({ cuenta, trigger }: CuentaHistoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });
    const [categoryFilter, setCategoryFilter] = useState("TODAS");
    const [typeFilter, setTypeFilter] = useState("TODOS");

    // Chart state types
    const [catType, setCatType] = useState("pie");

    // Base movements for this account
    const accountMovimientos = initialMovimientos.filter(m => m.cuenta.id === cuenta.id);

    // Get unique categories for filter
    const categories = Array.from(new Set(accountMovimientos.map(m => m.categoria))).sort();

    // Apply filters
    const filteredMovimientos = accountMovimientos.filter(m => {
        // Search filter
        const matchesSearch =
            m.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.tercero.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            const dateStr = format(m.fecha, "dd MMM", { locale: es });
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
                fecha: format(m.fecha, "dd MMM yyyy", { locale: es }),
                concepto: m.concepto,
                categoria: m.categoria,
                valor: formatCurrency(m.valor)
            }));

        return { trendData, categoryData, expensesTable, categoryTable };
    }, [filteredMovimientos]);

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
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovimientos.length > 0 ? (
                                        filteredMovimientos.map((mov) => (
                                            <TableRow key={mov.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {format(mov.fecha, "dd MMM yyyy", { locale: es })}
                                                    <br />
                                                    <span className="text-muted-foreground">{format(mov.fecha, "HH:mm:ss")}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{mov.concepto}</div>
                                                    <div className="text-xs text-muted-foreground">{mov.tercero}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">{mov.categoria}</Badge>
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

                    <TabsContent value="analisis" className="flex-1 overflow-auto space-y-4 data-[state=inactive]:hidden pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[350px]">
                            <DashboardPanel title="Gastos por Categoría" sub="Distribución Visual" typeState={[catType, setCatType]}>
                                <DynamicChart type={catType} data={analyticsData.categoryData} dataKey="value" xAxisKey="name" color="#EF4444" height={270} />
                            </DashboardPanel>
                            <Card className="flex flex-col">
                                <CardHeader className="py-4">
                                    <CardTitle className="text-base">Comparativa por Categoría (Ingresos vs Egresos)</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-0">
                                    <div className="h-[270px]">
                                        <DynamicChart type="table" data={analyticsData.categoryTable} dataKey="total" height={270} />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="flex flex-col h-[350px]">
                            <CardHeader className="py-4">
                                <CardTitle className="text-base">Top Gastos Individuales (Mayor a Menor)</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-0">
                                <div className="h-[270px] w-full">
                                    <DynamicChart type="table" data={analyticsData.expensesTable} dataKey="valor" height={270} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-base">Evolución de Ingresos vs Egresos</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <DynamicChart type="bar" data={analyticsData.trendData} dataKey="egresos" xAxisKey="name" color="#EF4444" height={250} />
                                <p className="text-xs text-center text-muted-foreground mt-2">Tendencia de gastos en el tiempo</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

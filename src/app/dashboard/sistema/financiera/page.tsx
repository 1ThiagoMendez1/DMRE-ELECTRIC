"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    DollarSign,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    TrendingUp,
    CreditCard,
    MoreHorizontal,
    Landmark,
    LayoutDashboard as LayoutDashboardIcon,
    PieChart as PieChartIcon,
    BarChart3,
    LineChart as LineChartIcon,
    Table as TableIcon,
    FileText
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { cn } from "@/lib/utils";
import { CreateTransactionDialog } from "@/components/erp/create-transaction-dialog";
import { EditInvoiceDialog } from "@/components/erp/edit-invoice-dialog";
import { initialCuentas, initialMovimientos, initialObligaciones, initialFacturas } from "@/lib/mock-data";

export default function FinancieraPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("resumen");
    const [movimientos, setMovimientos] = useState(initialMovimientos);
    const [facturas, setFacturas] = useState(initialFacturas);

    const handleCreateTransaction = (newTx: any) => {
        setMovimientos([newTx, ...movimientos]);
    };

    const handleInvoiceUpdate = (updatedInvoice: any) => {
        setFacturas(prev => prev.map(f => f.id === updatedInvoice.id ? updatedInvoice : f));
    };

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    const [incomeType, setIncomeType] = useState("area");
    const [expenseType, setExpenseType] = useState("area");
    const [categoryType, setCategoryType] = useState("pie");
    const [accountType, setAccountType] = useState("bar");

    const filterData = (date: Date | string) => {
        const d = new Date(date);
        if (dateRange?.from) {
            if (dateRange.to) return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            return d >= dateRange.from;
        }
        return true;
    };

    const dashboardFilteredMovements = useMemo(() => {
        return initialMovimientos.filter(m => filterData(m.fecha));
    }, [dateRange]);

    // Derived Data
    const incomeTrendData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredMovements.filter(m => m.tipo === 'INGRESO').forEach(m => {
            const dateStr = new Date(m.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + m.valor;
        });
        return Object.keys(agg).map(key => ({ name: key, valor: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredMovements]);

    const expenseTrendData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredMovements.filter(m => m.tipo === 'EGRESO').forEach(m => {
            const dateStr = new Date(m.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + m.valor;
        });
        return Object.keys(agg).map(key => ({ name: key, valor: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredMovements]);

    const expenseCategoryData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredMovements.filter(m => m.tipo === 'EGRESO').forEach(m => {
            agg[m.categoria] = (agg[m.categoria] || 0) + m.valor;
        });
        return Object.keys(agg).map(key => ({ name: key, valor: agg[key] })).sort((a, b) => b.valor - a.valor);
    }, [dashboardFilteredMovements]);

    const accountBalanceData = useMemo(() => {
        return initialCuentas.map(c => ({ name: c.nombre, saldo: c.saldoActual }));
    }, []);

    const kpiTotalIngresos = dashboardFilteredMovements.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.valor, 0);
    const kpiTotalEgresos = dashboardFilteredMovements.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.valor, 0);


    // --- KPIs ---
    const totalSaldo = useMemo(() => initialCuentas.reduce((acc, c) => acc + c.saldoActual, 0), []);
    const totalIngresosMes = useMemo(() => initialMovimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.valor, 0), []); // Mock: all time for now
    const totalEgresosMes = useMemo(() => initialMovimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.valor, 0), []);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión Financiera</h1>
                <p className="text-muted-foreground">Tesorería, flujo de caja y obligaciones bancarias.</p>
            </div>

            {/* KPIs - Moved to Resumen Tab */}

            <Tabs defaultValue="resumen" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="cuentas" className="gap-2"><Landmark className="h-4 w-4" /> Cuentas</TabsTrigger>
                    <TabsTrigger value="movimientos" className="gap-2"><TrendingUp className="h-4 w-4" /> Movimientos</TabsTrigger>
                    <TabsTrigger value="facturacion" className="gap-2"><FileText className="h-4 w-4" /> Facturación y Cartera</TabsTrigger>
                    <TabsTrigger value="obligaciones" className="gap-2"><CreditCard className="h-4 w-4" /> Obligaciones</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas</span>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                        <div className="flex-1 text-right pt-4">
                            <Button variant="outline" onClick={() => setDateRange(undefined)}>Limpiar Filtros</Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Disponible Total</CardTitle>
                                <Wallet className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalSaldo)}</div>
                                <p className="text-xs text-muted-foreground">En {initialCuentas.length} cuentas registradas</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos (Periodo)</CardTitle>
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(kpiTotalIngresos)}</div>
                                <p className="text-xs text-muted-foreground">Registrados en rango</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-red-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Gastos (Periodo)</CardTitle>
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(kpiTotalEgresos)}</div>
                                <p className="text-xs text-muted-foreground">Registrados en rango</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Evolución de Ingresos" sub="Tendencia de recaudo" typeState={[incomeType, setIncomeType]}>
                            <DynamicChart type={incomeType} data={incomeTrendData} dataKey="valor" xAxisKey="name" color="#10B981" />
                        </DashboardPanel>
                        <DashboardPanel title="Evolución de Gastos" sub="Tendencia de egresos" typeState={[expenseType, setExpenseType]}>
                            <DynamicChart type={expenseType} data={expenseTrendData} dataKey="valor" xAxisKey="name" color="#EF4444" />
                        </DashboardPanel>
                        <DashboardPanel title="Gastos por Categoría" sub="Distribución de egresos" typeState={[categoryType, setCategoryType]}>
                            <DynamicChart type={categoryType} data={expenseCategoryData} dataKey="valor" xAxisKey="name" color="#F59E0B" />
                        </DashboardPanel>
                        <DashboardPanel title="Balance por Cuenta" sub="Estado actual de tesorería" typeState={[accountType, setAccountType]}>
                            <DynamicChart type={accountType} data={accountBalanceData} dataKey="saldo" xAxisKey="name" color="#3B82F6" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- CUENTAS TAB --- */}
                <TabsContent value="cuentas" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialCuentas.map((cuenta) => (
                            <Card key={cuenta.id} className="border-l-4 border-l-primary">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{cuenta.nombre}</CardTitle>
                                        <p className="text-xs text-muted-foreground">{cuenta.numeroCuenta || 'Efectivo'}</p>
                                    </div>
                                    {cuenta.tipo === 'BANCO' ? <Landmark className="h-5 w-5 text-muted-foreground" /> : <Wallet className="h-5 w-5 text-muted-foreground" />}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold pt-2">{formatCurrency(cuenta.saldoActual)}</div>
                                    <Badge variant="secondary" className="mt-2">{cuenta.tipo}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* --- MOVIMIENTOS TAB --- */}
                <TabsContent value="movimientos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Historial de Transacciones</CardTitle>
                                <CreateTransactionDialog cuentas={initialCuentas} onTransactionCreated={handleCreateTransaction} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Concepto / Tercero</TableHead>
                                        <TableHead>Cuenta</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movimientos.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell>{format(mov.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>
                                                <Badge variant={mov.tipo === 'INGRESO' ? 'default' : 'secondary'} className={mov.tipo === 'EGRESO' ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'}>
                                                    {mov.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{mov.categoria.toLowerCase()}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{mov.concepto}</span>
                                                    <span className="text-xs text-muted-foreground">{mov.tercero}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{mov.cuenta.nombre}</TableCell>
                                            <TableCell className={cn("text-right font-medium", mov.tipo === 'INGRESO' ? "text-green-600" : "text-red-600")}>
                                                {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.valor)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- OBLIGACIONES TAB --- */}
                <TabsContent value="obligaciones" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {initialObligaciones.map((obl) => {
                            const progress = ((obl.montoPrestado - obl.saldoCapital) / obl.montoPrestado) * 100;
                            return (
                                <Card key={obl.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between">
                                            <CardTitle className="text-lg">{obl.entidad}</CardTitle>
                                            <Badge variant="outline">{(obl.tasaInteres * 100).toFixed(1)}% E.A.</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Monto Original</p>
                                                <p className="font-medium">{formatCurrency(obl.montoPrestado)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">Cuota Mensual</p>
                                                <p className="font-medium">{formatCurrency(obl.valorCuota)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>Progreso Pago</span>
                                                <span>{formatCurrency(obl.saldoCapital)} pendientes</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <Button variant="secondary" size="sm" onClick={() => toast({ title: "En desarrollo", description: "Tabla de amortización detallada pronto." })}>
                                                Ver Tabla Amortización
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* --- FACTURACION TAB --- */}
                <TabsContent value="facturacion" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Facturación y Cartera</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>N° Factura</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead>Valor Total</TableHead>
                                        <TableHead>Saldo Pendiente</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {facturas.map((fac) => (
                                        <TableRow key={fac.id}>
                                            <TableCell className="font-mono font-bold">{fac.id}</TableCell>
                                            <TableCell>{fac.cotizacion?.cliente?.nombre || "Cliente General"}</TableCell>
                                            <TableCell>{format(new Date(fac.fechaEmision), "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>{format(new Date(fac.fechaVencimiento), "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>{formatCurrency(fac.valorFacturado)}</TableCell>
                                            <TableCell className="font-bold text-red-500">{formatCurrency(fac.saldoPendiente)}</TableCell>
                                            <TableCell>
                                                <Badge variant={fac.estado === 'CANCELADA' ? 'default' : fac.estado === 'PARCIAL' ? 'secondary' : 'destructive'}>
                                                    {fac.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <EditInvoiceDialog factura={fac} onInvoiceUpdated={handleInvoiceUpdate} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

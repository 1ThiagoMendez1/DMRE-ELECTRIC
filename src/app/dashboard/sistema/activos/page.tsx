"use client";

import { useState, useMemo } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import {
    Car,
    Fuel,
    Wrench,
    AlertTriangle,
    CheckCircle2,
    CalendarClock,
    LayoutDashboard as LayoutDashboardIcon,
    PieChart as PieChartIcon,
    BarChart3,
    LineChart as LineChartIcon,
    Activity
} from "lucide-react";

import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { initialVehiculos, initialGastosVehiculos } from "@/lib/mock-data";
import { CreateVehicleDialog } from "@/components/erp/create-vehicle-dialog";
import { RegisterExpenseDialog } from "@/components/erp/register-expense-dialog";

export default function ActivosPage() {
    const [vehiculos, setVehiculos] = useState(initialVehiculos);
    const [gastos, setGastos] = useState(initialGastosVehiculos);

    const handleCreateVehicle = (newVeh: any) => {
        setVehiculos([newVeh, ...vehiculos]);
    };

    const handleCreateExpense = (newExpense: any) => {
        setGastos([newExpense, ...gastos]);
    };

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    const [expenseType, setExpenseType] = useState("area");
    const [vehicleExpenseType, setVehicleExpenseType] = useState("bar");
    const [maintenanceType, setMaintenanceType] = useState("pie");

    const filterData = (date: Date | string) => {
        const d = new Date(date);
        if (dateRange?.from) {
            if (dateRange.to) return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            return d >= dateRange.from;
        }
        return true;
    };

    const dashboardFilteredExpenses = gastos.filter(g => filterData(g.fecha));

    // Derived Data
    // 1. Expenses Trend
    const expenseTrendData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach(g => {
            const dateStr = new Date(g.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + g.valor;
        });
        return Object.keys(agg).map(key => ({ name: key, value: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredExpenses]);

    // 2. Expenses by Vehicle
    const expensesByVehicleData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach(g => {
            agg[g.vehiculo.placa] = (agg[g.vehiculo.placa] || 0) + g.valor;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, [dashboardFilteredExpenses]);

    // 3. Maintenance Type Distribution
    const maintenanceDistData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach(g => {
            agg[g.tipo] = (agg[g.tipo] || 0) + g.valor;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, [dashboardFilteredExpenses]);

    const kpiTotalExpenses = dashboardFilteredExpenses.reduce((acc, g) => acc + g.valor, 0);
    const kpiTotalFuel = dashboardFilteredExpenses.filter(g => g.tipo === 'COMBUSTIBLE').reduce((acc, g) => acc + g.valor, 0);
    const kpiTotalMaintenace = dashboardFilteredExpenses.filter(g => g.tipo !== 'COMBUSTIBLE').reduce((acc, g) => acc + g.valor, 0);


    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const checkExpiration = (date: Date) => {
        const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { status: 'VENCIDO', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
        if (daysLeft < 30) return { status: 'POR_VENCER', color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
        return { status: 'OK', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Activos y Flota</h1>
                <p className="text-muted-foreground">Gestión de vehículos, documentos y gastos operativos.</p>
            </div>

            {/* KPIs Moved to Resumen Tab */}

            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="vehiculos" className="gap-2"><Car className="h-4 w-4" /> Flota y Documentación</TabsTrigger>
                    <TabsTrigger value="gastos" className="gap-2"><Wrench className="h-4 w-4" /> Bitácora de Gastos</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas (Gastos)</span>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                        <div className="flex-1 text-right pt-4">
                            <Button variant="outline" onClick={() => setDateRange(undefined)}>Limpiar Filtros</Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Flota Activa</CardTitle>
                                <Car className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{initialVehiculos.length}</div>
                                <p className="text-xs text-muted-foreground">Vehículos registrados</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Gasto Total Flota</CardTitle>
                                <Wrench className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kpiTotalExpenses)}</div>
                                <p className="text-xs text-muted-foreground">En periodo seleccionado</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-yellow-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Combustible</CardTitle>
                                <Fuel className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(kpiTotalFuel)}
                                </div>
                                <p className="text-xs text-muted-foreground">Consumo estimado</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Estado General</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">OK</div>
                                <p className="text-xs text-muted-foreground">Operatividad normal</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Evolución de Gastos" sub="Tendencia de costos operativos" typeState={[expenseType, setExpenseType]}>
                            <DynamicChart type={expenseType} data={expenseTrendData} dataKey="value" xAxisKey="name" color="#F97316" />
                        </DashboardPanel>
                        <DashboardPanel title="Gastos por Vehículo" sub="Top vehículos más costosos" typeState={[vehicleExpenseType, setVehicleExpenseType]}>
                            <DynamicChart type={vehicleExpenseType} data={expensesByVehicleData} dataKey="value" xAxisKey="name" color="#EAB308" />
                        </DashboardPanel>
                        <DashboardPanel title="Distribución de Costos" sub="Combustible vs Mantenimientos" typeState={[maintenanceType, setMaintenanceType]}>
                            <DynamicChart type={maintenanceType} data={maintenanceDistData} dataKey="value" xAxisKey="name" color="#3B82F6" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- VEHICULOS TAB --- */}
                <TabsContent value="vehiculos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Estado de la Flota</CardTitle>
                                <CreateVehicleDialog onVehicleCreated={handleCreateVehicle} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Placa</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Conductor</TableHead>
                                        <TableHead>SOAT</TableHead>
                                        <TableHead>Tecnomecánica</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehiculos.map((veh) => {
                                        const soatStatus = checkExpiration(veh.vencimientoSoat);
                                        const tecnoStatus = checkExpiration(veh.vencimientoTecnomecanica);
                                        return (
                                            <TableRow key={veh.id}>
                                                <TableCell className="font-bold font-mono bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded w-fit">{veh.placa}</TableCell>
                                                <TableCell>{veh.marcaModelo}</TableCell>
                                                <TableCell>{veh.conductorAsignado}</TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit ${soatStatus.bg} ${soatStatus.color}`}>
                                                        <CalendarClock className="h-3 w-3" />
                                                        {format(veh.vencimientoSoat, "dd MMM yyyy")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className={`flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit ${tecnoStatus.bg} ${tecnoStatus.color}`}>
                                                        <CalendarClock className="h-3 w-3" />
                                                        {format(veh.vencimientoTecnomecanica, "dd MMM yyyy")}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">Historial</Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- GASTOS TAB --- */}
                <TabsContent value="gastos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Historial de Gastos Operativos</CardTitle>
                                <RegisterExpenseDialog vehiculos={vehiculos} onExpenseCreated={handleCreateExpense} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Kilometraje</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gastos.map((gasto) => (
                                        <TableRow key={gasto.id}>
                                            <TableCell>{format(gasto.fecha, "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="font-mono text-xs">{gasto.vehiculo.placa}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{gasto.tipo}</Badge>
                                            </TableCell>
                                            <TableCell>{gasto.kilometraje?.toLocaleString()} km</TableCell>
                                            <TableCell>{gasto.proveedor}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(gasto.valor)}</TableCell>
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

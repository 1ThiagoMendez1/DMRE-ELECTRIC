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
    ExternalLink,
    Activity,
    Trash2
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { useErp } from "@/components/providers/erp-provider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

import { formatCurrency } from "@/lib/utils";
import { CreateVehicleDialog } from "@/components/erp/create-vehicle-dialog";
import { RegisterExpenseDialog } from "@/components/erp/register-expense-dialog";
import { VehicleDetailDialog } from "@/components/erp/vehicle-detail-dialog";
import { GastoVehiculo, Vehiculo } from "@/types/sistema";

export default function ActivosPage() {
    const {
        vehiculos,
        gastosVehiculos: gastos,
        cuentasBancarias: cuentas,
        addVehiculo,
        addGastoVehiculo,
        deleteVehiculo,
        deleteGastoVehiculo,
        currentUser
    } = useErp();

    const { toast } = useToast();

    const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleOpenDetail = (veh: Vehiculo) => {
        setSelectedVehiculo(veh);
        setIsDetailOpen(true);
    };

    const handleCreateVehicle = (newVeh: any) => {
        addVehiculo(newVeh);
        toast({ title: "Vehículo registrado", description: "El vehículo ha sido añadido a la flota." });
    };

    const handleCreateExpense = (newExpense: any, cuentaId?: string) => {
        addGastoVehiculo(newExpense, cuentaId);
    };

    const isAdmin = currentUser?.role === 'ADMIN';

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

    const dashboardFilteredExpenses = gastos.filter((g: GastoVehiculo) => filterData(g.fecha));

    // Derived Data
    // 1. Expenses Trend
    const expenseTrendData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach((g: GastoVehiculo) => {
            const dateStr = new Date(g.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + g.valor;
        });
        return Object.keys(agg).map(key => ({ name: key, value: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredExpenses]);

    // 2. Expenses by Vehicle
    const expensesByVehicleData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach((g: GastoVehiculo) => {
            agg[g.vehiculo.placa] = (agg[g.vehiculo.placa] || 0) + g.valor;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, [dashboardFilteredExpenses]);

    // 3. Maintenance Type Distribution
    const maintenanceDistData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredExpenses.forEach((g: GastoVehiculo) => {
            agg[g.tipo] = (agg[g.tipo] || 0) + g.valor;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, [dashboardFilteredExpenses]);

    const kpiTotalExpenses = dashboardFilteredExpenses.reduce((acc: number, g: GastoVehiculo) => acc + g.valor, 0);
    const kpiTotalFuel = dashboardFilteredExpenses.filter((g: GastoVehiculo) => g.tipo === 'COMBUSTIBLE').reduce((acc: number, g: GastoVehiculo) => acc + g.valor, 0);
    const kpiTotalMaintenance = dashboardFilteredExpenses.filter((g: GastoVehiculo) => g.tipo.includes('MANTENIMIENTO')).reduce((acc: number, g: GastoVehiculo) => acc + g.valor, 0);

    const vehicleStatusCounts = useMemo(() => {
        return {
            operativo: vehiculos.filter(v => v.estado === 'OPERATIVO').length,
            mantenimiento: vehiculos.filter(v => v.estado === 'MANTENIMIENTO').length,
            fuera: vehiculos.filter(v => v.estado === 'INACTIVO').length,
        };
    }, [vehiculos]);

    const upcomingExpirations = useMemo(() => {
        return vehiculos
            .map(v => {
                const soat = checkExpiration(v.vencimientoSoat);
                const tecno = checkExpiration(v.vencimientoTecnomecanica);
                const seguro = checkExpiration(v.vencimientoSeguro);
                return {
                    vehiculo: v,
                    soat,
                    tecno,
                    seguro,
                    maxPriority: Math.min(
                        soat.status === 'VENCIDO' ? 0 : soat.status === 'POR_VENCER' ? 1 : 2,
                        tecno.status === 'VENCIDO' ? 0 : tecno.status === 'POR_VENCER' ? 1 : 2,
                        seguro.status === 'VENCIDO' ? 0 : seguro.status === 'POR_VENCER' ? 1 : 2
                    )
                };
            })
            .filter(e => e.maxPriority < 2)
            .sort((a, b) => a.maxPriority - b.maxPriority)
            .slice(0, 5);
    }, [vehiculos]);




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
                                <div className="text-2xl font-bold">{vehiculos.length}</div>
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
                                <div className="text-2xl font-bold">{vehicleStatusCounts.operativo} / {vehiculos.length}</div>
                                <p className="text-xs text-muted-foreground">Vehículos operativos</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Upcoming Expirations */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500" /> Vencimientos Próximos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableBody>
                                        {upcomingExpirations.length === 0 ? (
                                            <TableRow>
                                                <TableCell className="text-center py-10 text-muted-foreground">Todo al día</TableCell>
                                            </TableRow>
                                        ) : (
                                            upcomingExpirations.map(exp => (
                                                <TableRow key={exp.vehiculo.id}>
                                                    <TableCell className="py-2">
                                                        <p className="font-bold text-xs">{exp.vehiculo.placa}</p>
                                                        <div className="flex gap-1 mt-1">
                                                            {exp.soat.status !== 'OK' && <Badge variant="outline" className={`text-[9px] ${exp.soat.color}`}>SOAT</Badge>}
                                                            {exp.tecno.status !== 'OK' && <Badge variant="outline" className={`text-[9px] ${exp.tecno.color}`}>TEC</Badge>}
                                                            {exp.seguro.status !== 'OK' && <Badge variant="outline" className={`text-[9px] ${exp.seguro.color}`}>SEG</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right py-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(exp.vehiculo)}>Ver</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Status Distribution */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Distribución de Flota</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Operativo</span>
                                    <Badge>{vehicleStatusCounts.operativo}</Badge>
                                </div>
                                <Progress value={(vehicleStatusCounts.operativo / (vehiculos.length || 1)) * 100} className="h-2" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Mantenimiento</span>
                                    <Badge variant="secondary">{vehicleStatusCounts.mantenimiento}</Badge>
                                </div>
                                <Progress value={(vehicleStatusCounts.mantenimiento / (vehiculos.length || 1)) * 100} className="h-2 bg-muted flex [&>div]:bg-orange-500" />

                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Fuera de Servicio</span>
                                    <Badge variant="outline">{vehicleStatusCounts.fuera}</Badge>
                                </div>
                                <Progress value={(vehicleStatusCounts.fuera / (vehiculos.length || 1)) * 100} className="h-2 bg-muted flex [&>div]:bg-red-500" />
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Distribución de Costos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DynamicChart type="pie" data={maintenanceDistData} dataKey="value" xAxisKey="name" color="#3B82F6" />
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
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDetail(veh)}>Ver Detalle</Button>
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive"
                                                                onClick={() => { if (confirm('¿Eliminar vehículo y sus gastos asociados?')) { deleteVehiculo(veh.id) } }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
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
                                <RegisterExpenseDialog
                                    vehiculos={vehiculos}
                                    cuentas={cuentas}
                                    onExpenseCreated={handleCreateExpense}
                                />
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
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gastos.map((gasto: GastoVehiculo) => (
                                        <TableRow key={gasto.id}>
                                            <TableCell>{format(gasto.fecha, "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    {gasto.vehiculo.placa}
                                                    {gasto.soporteUrl && (
                                                        <a href={gasto.soporteUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-3 w-3 text-blue-500 hover:scale-110 transition-transform" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{gasto.tipo}</Badge>
                                            </TableCell>
                                            <TableCell>{gasto.kilometraje?.toLocaleString()} km</TableCell>
                                            <TableCell>{gasto.proveedor}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrency(gasto.valor)}</TableCell>
                                            <TableCell className="text-right">
                                                {isAdmin && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive"
                                                        onClick={() => { if (confirm('¿Eliminar registro de gasto?')) { deleteGastoVehiculo(gasto.id) } }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <VehicleDetailDialog
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                vehiculo={selectedVehiculo}
                gastos={gastos}
            />
        </div>
    );
}

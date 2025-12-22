"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users,
    Briefcase,
    CalendarDays,
    Banknote,
    UserPlus,
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

import { initialEmpleados, initialNovedades, initialLiquidaciones } from "@/lib/mock-data";
import { CreateEmployeeDialog } from "@/components/erp/create-employee-dialog";
import { RegisterNovedadDialog } from "@/components/erp/register-novedad-dialog";

export default function TalentoHumanoPage() {
    const [empleados, setEmpleados] = useState(initialEmpleados);
    const [novedades, setNovedades] = useState(initialNovedades);

    const handleCreateEmployee = (newEmp: any) => {
        setEmpleados([newEmp, ...empleados]);
    };

    const handleCreateNovedad = (newNov: any) => {
        setNovedades([newNov, ...novedades]);
    };

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    const [payrollType, setPayrollType] = useState("area");
    const [departmentType, setDepartmentType] = useState("pie");
    const [absenteeismType, setAbsenteeismType] = useState("bar");

    const filterData = (date: Date | string) => {
        const d = new Date(date);
        if (dateRange?.from) {
            if (dateRange.to) return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            return d >= dateRange.from;
        }
        return true;
    };

    const dashboardFilteredLiquidations = initialLiquidaciones.filter(l => true); // Mock data has period string, difficult to filter by date exactly without parsing. Logic simplified for demo.

    // Derived Data
    // 1. Payroll Trend
    const payrollTrendData = useMemo(() => {
        // Mocking trend based on liquidations
        const agg: Record<string, number> = {};
        initialLiquidaciones.forEach(l => {
            agg[l.periodo] = (agg[l.periodo] || 0) + l.netoPagar;
        });
        return Object.keys(agg).map(key => ({ name: key, value: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    // 2. Department Distribution
    const departmentDistData = useMemo(() => {
        const agg: Record<string, number> = {};
        initialEmpleados.forEach(e => {
            agg[e.cargo] = (agg[e.cargo] || 0) + 1;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, []);


    // 3. Absenteeism (Novedades)
    const absenteeismData = useMemo(() => {
        const agg: Record<string, number> = {};
        novedades.forEach(n => {
            const typeName = n.tipo.replace(/_/g, " ");
            agg[typeName] = (agg[typeName] || 0) + 1;
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, [novedades]);

    const kpiTotalEmployees = initialEmpleados.length;
    const kpiTotalPayroll = initialLiquidaciones.reduce((acc, l) => acc + l.netoPagar, 0); // Total historical for demo
    const kpiAvgSalary = kpiTotalPayroll / (initialLiquidaciones.length || 1);


    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const totalNominaEstimada = initialEmpleados.reduce((acc, e) => acc + e.salarioBase, 0);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Talento Humano</h1>
                <p className="text-muted-foreground">Gestión de personal, novedades y nómina.</p>
            </div>

            {/* KPIs Moved to Resumen Tab */}


            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="empleados" className="gap-2"><Users className="h-4 w-4" /> Empleados</TabsTrigger>
                    <TabsTrigger value="novedades" className="gap-2"><CalendarDays className="h-4 w-4" /> Novedades</TabsTrigger>
                    <TabsTrigger value="nomina" className="gap-2"><Banknote className="h-4 w-4" /> Pagos de Nómina</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters NOT APPLIED for this mock demo as dates are strings/non-standard */}

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Personal Activo</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiTotalEmployees}</div>
                                <p className="text-xs text-muted-foreground">Colaboradores registrados</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-600 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Nómina (Histórico)</CardTitle>
                                <Banknote className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kpiTotalPayroll)}</div>
                                <p className="text-xs text-muted-foreground">Valor neto desembolsado</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-purple-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Promedio Pago</CardTitle>
                                <Briefcase className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kpiAvgSalary)}</div>
                                <p className="text-xs text-muted-foreground">Por liquidación</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Evolución de Pago de Nómina" sub="Histórico por periodo" typeState={[payrollType, setPayrollType]}>
                            <DynamicChart type={payrollType} data={payrollTrendData} dataKey="value" xAxisKey="name" color="#16A34A" />
                        </DashboardPanel>
                        <DashboardPanel title="Distribución por Cargo" sub="Personal según rol" typeState={[departmentType, setDepartmentType]}>
                            <DynamicChart type={departmentType} data={departmentDistData} dataKey="value" xAxisKey="name" color="#8B5CF6" />
                        </DashboardPanel>
                        <DashboardPanel title="Tipos de Novedades" sub="Frecuencia de incidencias" typeState={[absenteeismType, setAbsenteeismType]}>
                            <DynamicChart type={absenteeismType} data={absenteeismData} dataKey="value" xAxisKey="name" color="#F43F5E" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- EMPLEADOS TAB --- */}
                <TabsContent value="empleados" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Directorio de Personal</CardTitle>
                                <CreateEmployeeDialog onEmployeeCreated={handleCreateEmployee} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre Completo</TableHead>
                                        <TableHead>Cédula</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead>Fecha Ingreso</TableHead>
                                        <TableHead>Salario Base</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {empleados.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.nombreCompleto}</TableCell>
                                            <TableCell>{emp.cedula}</TableCell>
                                            <TableCell><Badge variant="outline">{emp.cargo}</Badge></TableCell>
                                            <TableCell>{format(emp.fechaIngreso, "dd/MM/yyyy")}</TableCell>
                                            <TableCell>{formatCurrency(emp.salarioBase)}</TableCell>
                                            <TableCell><Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">ACTIVO</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Perfil</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NOVEDADES TAB --- */}
                <TabsContent value="novedades" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Registro de Novedades (Extras, Recargos, Ausencias)</CardTitle>
                                <RegisterNovedadDialog empleados={empleados} onNovedadCreated={handleCreateNovedad} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Tipo Novedad</TableHead>
                                        <TableHead>Cantidad (Horas/Días)</TableHead>
                                        <TableHead>Valor Calculado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {novedades.map((nov) => (
                                        <TableRow key={nov.id}>
                                            <TableCell>{format(nov.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell className="font-medium">{initialEmpleados.find(e => e.id === nov.empleadoId)?.nombreCompleto || nov.empleadoId}</TableCell>
                                            <TableCell><Badge variant="secondary">{nov.tipo.replace(/_/g, " ")}</Badge></TableCell>
                                            <TableCell>{nov.cantidad}</TableCell>
                                            <TableCell>{formatCurrency(nov.valorCalculado)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- NOMINA TAB --- */}
                <TabsContent value="nomina" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Pagos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Total Devengado</TableHead>
                                        <TableHead>Total Deducido</TableHead>
                                        <TableHead>Neto a Pagar</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialLiquidaciones.map((liq) => (
                                        <TableRow key={liq.id}>
                                            <TableCell className="font-mono">{liq.periodo}</TableCell>
                                            <TableCell>{liq.empleado.nombreCompleto}</TableCell>
                                            <TableCell>{formatCurrency(liq.totalDevengado)}</TableCell>
                                            <TableCell className="text-red-500">{formatCurrency(liq.totalDeducido)}</TableCell>
                                            <TableCell className="font-bold text-green-600">{formatCurrency(liq.netoPagar)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost"><Banknote className="h-4 w-4" /></Button>
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

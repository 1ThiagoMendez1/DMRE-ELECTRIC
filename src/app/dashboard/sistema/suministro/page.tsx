"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Truck,
    Receipt,
    Phone,
    Mail,
    AlertCircle,
    LayoutDashboard as LayoutDashboardIcon,
    PieChart as PieChartIcon,
    BarChart3,
    LineChart as LineChartIcon
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

import { initialProveedores, initialCuentasPorPagar } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { CreateSupplierDialog } from "@/components/erp/create-supplier-dialog";
import { SupplierProfileDialog } from "@/components/erp/supplier-profile-dialog";

export default function SuministroPage() {
    const [proveedores, setProveedores] = useState(initialProveedores);
    const [cuentasPorPagar, setCuentasPorPagar] = useState(initialCuentasPorPagar);

    const handleCreateSupplier = (newProv: any) => {
        setProveedores([newProv, ...proveedores]);
    };

    const handleRegisterPayment = (id: string) => {
        setCuentasPorPagar(prev => prev.map(cxp => {
            if (cxp.id === id) {
                return {
                    ...cxp,
                    valorPagado: cxp.valorTotal,
                    saldoPendiente: 0
                };
            }
            return cxp;
        }));
    };

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    const [debtType, setDebtType] = useState("bar");
    const [supplierType, setSupplierType] = useState("pie");

    const filterData = (date: Date | string) => {
        const d = new Date(date);
        if (dateRange?.from) {
            if (dateRange.to) return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            return d >= dateRange.from;
        }
        return true;
    };

    const dashboardFilteredPayables = cuentasPorPagar.filter(cxp => filterData(cxp.fecha));

    // Derived Data
    const debtBySupplierData = cuentasPorPagar.reduce((acc: any[], curr) => {
        const existing = acc.find(i => i.name === curr.proveedor.nombre);
        if (existing) {
            existing.value += curr.saldoPendiente;
        } else {
            acc.push({ name: curr.proveedor.nombre, value: curr.saldoPendiente });
        }
        return acc;
    }, []).sort((a, b) => b.value - a.value).slice(0, 10);

    const payableStatusData = [
        { name: 'Pagado', value: dashboardFilteredPayables.reduce((acc, curr) => acc + curr.valorPagado, 0) },
        { name: 'Pendiente', value: dashboardFilteredPayables.reduce((acc, curr) => acc + curr.saldoPendiente, 0) }
    ];

    const kpiTotalPaid = dashboardFilteredPayables.reduce((acc, cxp) => acc + cxp.valorPagado, 0);




    const totalDeuda = cuentasPorPagar.reduce((acc, cxp) => acc + cxp.saldoPendiente, 0);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Cadena de Suministro</h1>
                <p className="text-muted-foreground">Gestión de proveedores y cuentas por pagar.</p>
            </div>

            {/* KPIs Moved to Resumen Tab */}


            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="proveedores" className="gap-2"><Truck className="h-4 w-4" /> Directorio Proveedores</TabsTrigger>
                    <TabsTrigger value="cxp" className="gap-2"><Receipt className="h-4 w-4" /> Cuentas por Pagar</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas (Fx)</span>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                        <div className="flex-1 text-right pt-4">
                            <Button variant="outline" onClick={() => setDateRange(undefined)}>Limpiar Filtros</Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="shadow-sm border-l-4 border-l-red-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Deuda Total Pendiente</CardTitle>
                                <Receipt className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDeuda)}</div>
                                <p className="text-xs text-muted-foreground">Global (No filtra por fecha)</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Pagos Realizados (Periodo)</CardTitle>
                                <Receipt className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(kpiTotalPaid)}</div>
                                <p className="text-xs text-muted-foreground">En facturas del periodo</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
                                <Truck className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{initialProveedores.length}</div>
                                <p className="text-xs text-muted-foreground">Directorio registrado</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Deuda por Proveedor" sub="Top proveedores con saldo pendiente" typeState={[debtType, setDebtType]}>
                            <DynamicChart type={debtType} data={debtBySupplierData} dataKey="value" xAxisKey="name" color="#EF4444" />
                        </DashboardPanel>
                        <DashboardPanel title="Estado de Pagos" sub="Proporción Pagado vs Pendiente" typeState={[supplierType, setSupplierType]}>
                            <DynamicChart type={supplierType} data={payableStatusData} dataKey="value" xAxisKey="name" color="#10B981" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- PROVEEDORES TAB --- */}
                <TabsContent value="proveedores" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Listado de Proveedores</CardTitle>
                                <CreateSupplierDialog onSupplierCreated={handleCreateSupplier} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>NIT</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Datos Bancarios</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {proveedores.map((prov) => (
                                        <TableRow key={prov.id}>
                                            <TableCell className="font-medium">{prov.nombre}</TableCell>
                                            <TableCell><Badge variant="secondary">{prov.categoria}</Badge></TableCell>
                                            <TableCell>{prov.nit}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {prov.correo}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{prov.datosBancarios}</TableCell>
                                            <TableCell className="text-right">
                                                <SupplierProfileDialog proveedor={prov} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CXP TAB --- */}
                <TabsContent value="cxp" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Facturas de Proveedores Pendientes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Ref / Factura</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Valor Total</TableHead>
                                        <TableHead>Pagado</TableHead>
                                        <TableHead>Saldo</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cuentasPorPagar.map((cxp) => (
                                        <TableRow key={cxp.id}>
                                            <TableCell className="font-medium">{cxp.proveedor.nombre}</TableCell>
                                            <TableCell>{cxp.numeroFacturaProveedor}</TableCell>
                                            <TableCell>{cxp.concepto}</TableCell>
                                            <TableCell>{format(cxp.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>{formatCurrency(cxp.valorTotal)}</TableCell>
                                            <TableCell>{formatCurrency(cxp.valorPagado)}</TableCell>
                                            <TableCell className="font-bold text-red-600">{formatCurrency(cxp.saldoPendiente)}</TableCell>
                                            <TableCell>
                                                {cxp.saldoPendiente > 0 && (
                                                    <Button size="sm" variant="outline" onClick={() => handleRegisterPayment(cxp.id)}>Registrar Pago</Button>
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
        </div>
    );
}

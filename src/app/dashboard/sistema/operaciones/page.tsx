"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Package,
    ArrowUpFromLine,
    ArrowDownToLine,
    Search,
    AlertTriangle,
    Boxes,
    LayoutDashboard as LayoutDashboardIcon,
    PieChart as PieChartIcon,
    BarChart3,
    LineChart as LineChartIcon,
    Activity,
    MoreHorizontal
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";

import { initialInventory, initialMovimientosInventario } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { RegisterInventoryMovementDialog } from "@/components/erp/register-inventory-movement-dialog";

import { EditInventoryDialog } from "@/components/erp/edit-inventory-dialog";

export default function OperacionesPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [movements, setMovements] = useState(initialMovimientosInventario);
    const [inventory, setInventory] = useState(initialInventory);

    const handleCreateMovement = (newMov: any) => {
        setMovements([newMov, ...movements]);
    };

    const handleItemUpdate = (updatedItem: any) => {
        setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });

    const [inventoryType, setInventoryType] = useState("pie");
    const [movementType, setMovementType] = useState("bar");
    const [categoryType, setCategoryType] = useState("bar");

    const filterData = (date: Date | string) => {
        const d = new Date(date);
        if (dateRange?.from) {
            if (dateRange.to) return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            return d >= dateRange.from;
        }
        return true;
    };

    const dashboardFilteredMovements = useMemo(() => {
        return initialMovimientosInventario.filter(m => filterData(m.fecha));
    }, [dateRange]);

    // Derived Data
    // 1. Value by Category
    const valueByCategory = useMemo(() => {
        const agg: Record<string, number> = {};
        initialInventory.forEach(i => {
            agg[i.categoria] = (agg[i.categoria] || 0) + (i.cantidad * i.valorUnitario);
        });
        return Object.keys(agg).map(k => ({ name: k, value: agg[k] })).sort((a, b) => b.value - a.value);
    }, []);

    // 2. Movements Trend
    const movementTrend = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredMovements.forEach(m => {
            const dateStr = new Date(m.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + 1;
        });
        return Object.keys(agg).map(k => ({ name: k, count: agg[k] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredMovements]);

    // 3. Low Stock Distribution
    const lowStockDist = useMemo(() => {
        const agg: Record<string, number> = {};
        initialInventory.filter(i => i.cantidad <= i.stockMinimo).forEach(i => {
            agg[i.categoria] = (agg[i.categoria] || 0) + 1;
        });
        return Object.keys(agg).map(k => ({ name: k, count: agg[k] })).sort((a, b) => b.count - a.count);
    }, []);

    const kpiTotalMovements = dashboardFilteredMovements.length;
    const kpiMovementsIn = dashboardFilteredMovements.filter(m => m.tipo === 'ENTRADA').length;
    const kpiMovementsOut = dashboardFilteredMovements.filter(m => m.tipo === 'SALIDA').length;


    // --- KPIs ---
    const totalItems = initialInventory.length;
    const lowStockItems = initialInventory.filter(i => i.cantidad <= i.stockMinimo).length;
    const totalValue = initialInventory.reduce((acc, i) => acc + (i.cantidad * i.valorUnitario), 0);

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    // Filtered Data
    const filteredInventory = useMemo(() => {
        return initialInventory.filter(i =>
            i.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Operaciones e Inventario</h1>
                <p className="text-muted-foreground">Gestión de catálogo, stock y movimientos de almacén.</p>
            </div>

            {/* KPIs Moved to Resumen Tab */}

            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="catalogo" className="gap-2"><Package className="h-4 w-4" /> Catálogo de Artículos</TabsTrigger>
                    <TabsTrigger value="movimientos" className="gap-2"><ArrowUpFromLine className="h-4 w-4" /> Movimientos</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas (Movimientos)</span>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                        <div className="flex-1 text-right pt-4">
                            <Button variant="outline" onClick={() => setDateRange(undefined)}>Limpiar Filtros</Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Valor del Inventario</CardTitle>
                                <Package className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                                <p className="text-xs text-muted-foreground">{totalItems} ref. total</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-orange-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems}</div>
                                <p className="text-xs text-muted-foreground">Requieren atención</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-blue-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Entradas (Periodo)</CardTitle>
                                <ArrowDownToLine className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiMovementsIn}</div>
                                <p className="text-xs text-muted-foreground">Movimientos entrada</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-purple-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Salidas (Periodo)</CardTitle>
                                <ArrowUpFromLine className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpiMovementsOut}</div>
                                <p className="text-xs text-muted-foreground">Movimientos salida</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Valor por Categoría" sub="Distribución monetaria del stock" typeState={[inventoryType, setInventoryType]}>
                            <DynamicChart type={inventoryType} data={valueByCategory} dataKey="value" xAxisKey="name" color="#8884d8" />
                        </DashboardPanel>
                        <DashboardPanel title="Actividad de Movimientos" sub="Frecuencia de operaciones diarias" typeState={[movementType, setMovementType]}>
                            <DynamicChart type={movementType} data={movementTrend} dataKey="count" xAxisKey="name" color="#0EA5E9" />
                        </DashboardPanel>
                        <DashboardPanel title="Alertas de Stock por Categoría" sub="Donde se concentra el stock bajo" typeState={[categoryType, setCategoryType]}>
                            <DynamicChart type={categoryType} data={lowStockDist} dataKey="count" xAxisKey="name" color="#F97316" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- CATALOGO TAB --- */}
                <TabsContent value="catalogo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Inventario Actual</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre o SKU..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Valor Unit.</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inventory.map((item) => {
                                        const stockStatus = item.cantidad <= item.stockMinimo ? 'BAJO' : 'OK';
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                                                <TableCell>{item.ubicacion}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>{item.cantidad} {item.unidad}</span>
                                                        {stockStatus === 'BAJO' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="w-[100px]">
                                                        <Progress value={(item.cantidad / (item.stockMinimo * 3)) * 100} className={cn("h-2", stockStatus === 'BAJO' ? "bg-orange-200" : "")} />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.valorUnitario)}</TableCell>
                                                <TableCell className="text-right">
                                                    <EditInventoryDialog articulo={item} onItemUpdated={handleItemUpdate} />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- MOVIMIENTOS TAB --- */}
                <TabsContent value="movimientos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Bitácora de Movimientos</CardTitle>
                                <RegisterInventoryMovementDialog articulos={initialInventory} onMovementCreated={handleCreateMovement} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead>Responsable</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialMovimientosInventario.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell>{format(mov.fecha, "dd/MM/yyyy HH:mm")}</TableCell>
                                            <TableCell>
                                                <Badge variant={mov.tipo === 'ENTRADA' ? 'default' : 'secondary'} className={mov.tipo === 'SALIDA' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}>
                                                    {mov.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{mov.articulo.descripcion}</span>
                                                    <span className="text-xs text-muted-foreground">{mov.articulo.sku}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">
                                                {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.cantidad}
                                            </TableCell>
                                            <TableCell>{mov.responsableId}</TableCell>
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

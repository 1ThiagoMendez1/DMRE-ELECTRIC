"use client";

import { useState, useMemo, useEffect } from "react";
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
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

import { initialInventory, initialMovimientosInventario, initialRegistros, initialCodigosTrabajo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { RegisterInventoryMovementDialog } from "@/components/erp/register-inventory-movement-dialog";
import { RegistroTable } from "../registro/registro-table";

import { EditInventoryDialog } from "@/components/erp/edit-inventory-dialog";
import { CreateInventoryItemDialog } from "@/components/erp/create-inventory-item-dialog";
import { CreateCodigoTrabajoDialog } from "@/components/erp/create-codigo-trabajo-dialog";
import { MovementDetailDialog } from "@/components/erp/movement-detail-dialog";
import { CodigoDetailDialog } from "@/components/erp/codigo-detail-dialog";

export default function OperacionesPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");

    // Core Data State
    const [movements, setMovements] = useState(initialMovimientosInventario);
    const [inventory, setInventory] = useState(initialInventory);
    const [codigos, setCodigos] = useState(initialCodigosTrabajo);

    // Filter/Chart State
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date())
    });
    const [inventoryType, setInventoryType] = useState('pie');
    const [movementType, setMovementType] = useState('bar');
    const [categoryType, setCategoryType] = useState('bar');

    // Detail Dialog States
    const [selectedMovement, setSelectedMovement] = useState<any>(null);
    const [movementDetailOpen, setMovementDetailOpen] = useState(false);
    const [selectedCodigo, setSelectedCodigo] = useState<any>(null);
    const [codigoDetailOpen, setCodigoDetailOpen] = useState(false);

    // Alerts Effect
    useEffect(() => {
        const lowStockCount = inventory.filter(i => i.cantidad <= i.stockMinimo).length;
        if (lowStockCount > 0) {
            // Use a small timeout to avoid initial render clashes or double toasts
            const timer = setTimeout(() => {
                toast({
                    title: "⚠️ Alerta de Stock",
                    description: `Tienes ${lowStockCount} items con stock bajo. Revisa el resumen.`,
                    variant: "destructive",
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [inventory, toast]);

    const handleCreateMovement = (newMov: any) => {
        setMovements([newMov, ...movements]);
    };

    const handleItemUpdate = (updatedItem: any) => {
        setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    // Calculations
    const filteredMovements = useMemo(() => {
        if (!dateRange?.from) return movements;
        return movements.filter(m => isWithinInterval(m.fecha, { start: dateRange.from!, end: dateRange.to || dateRange.from! }));
    }, [movements, dateRange]);

    const totalValue = inventory.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0);
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(i => i.cantidad <= i.stockMinimo).length;
    const kpiMovementsIn = filteredMovements.filter(m => m.tipo === 'ENTRADA').length;
    const kpiMovementsOut = filteredMovements.filter(m => m.tipo === 'SALIDA').length;

    // Chart Data Preparation
    const valueByCategory = useMemo(() => {
        const ag = inventory.reduce((acc, item) => {
            acc[item.categoria] = (acc[item.categoria] || 0) + (item.cantidad * item.valorUnitario);
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(ag).map(([name, value]) => ({ name, value }));
    }, [inventory]);

    const movementTrend = useMemo(() => {
        // Group by day for the last 30 days or range
        const ag = filteredMovements.reduce((acc, m) => {
            const day = format(m.fecha, "dd MMM", { locale: es });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        // Sort by date would require clearer objects, here we rely on mock order or randomness
        // Ideally fill blanks.
        return Object.entries(ag).map(([name, count]) => ({ name, count })).slice(0, 7); // Show last 7 active days for demo
    }, [filteredMovements]);

    const lowStockDist = useMemo(() => {
        const ag = inventory.filter(i => i.cantidad <= i.stockMinimo).reduce((acc, item) => {
            acc[item.categoria] = (acc[item.categoria] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(ag).map(([name, count]) => ({ name, count }));
    }, [inventory]);


    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Operaciones y Logística</h2>
            </div>
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen">Resumen General</TabsTrigger>
                    <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                    <TabsTrigger value="registro">Registro Obras</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium">Filtro de Análisis</h3>
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

                    {/* Quick Filters - Low Stock Alert Box */}
                    {inventory.some(i => i.cantidad <= i.stockMinimo) && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                <div>
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-300">Items con Stock Bajo Detectados</h4>
                                    <p className="text-sm text-orange-700 dark:text-orange-400">Hay items que requieren reabastecimiento urgente.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="border-orange-200 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-800 dark:hover:bg-orange-900" onClick={() => document.getElementById("tab-catalogo")?.click()}>
                                Ver Inventario
                            </Button>
                        </div>
                    )}

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
                                    {movements.map((mov) => (
                                        <TableRow
                                            key={mov.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                setSelectedMovement(mov);
                                                setMovementDetailOpen(true);
                                            }}
                                        >
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

                {/* --- REGISTRO OBRAS TAB --- */}
                <TabsContent value="registro" className="space-y-4">
                    <RegistroTable data={initialRegistros} />
                </TabsContent>


            </Tabs>

            {/* Dialogs outside Tabs to prevent nesting issues */}
            <MovementDetailDialog
                open={movementDetailOpen}
                onOpenChange={setMovementDetailOpen}
                movement={selectedMovement}
            />

            <CodigoDetailDialog
                open={codigoDetailOpen}
                onOpenChange={setCodigoDetailOpen}
                codigo={selectedCodigo}
                onUpdate={(updated) => setCodigos(codigos.map(c => c.id === updated.id ? updated : c))}
            />
        </div>
    );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Package,
    ArrowUpFromLine,
    ArrowDownToLine,
    AlertTriangle,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";

import { Button } from "@/components/ui/button";
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

import { initialMovimientosInventario } from "@/lib/mock-data";
import { RegisterInventoryMovementDialog } from "@/components/erp/register-inventory-movement-dialog";
import { RegistroTable } from "../registro/registro-table";

import { useErp } from "@/components/providers/erp-provider";
import { RegistroObra } from "@/types/sistema";
import { MovementDetailDialog } from "@/components/erp/movement-detail-dialog";
import { CodigoDetailDialog } from "@/components/erp/codigo-detail-dialog";

export default function OperacionesPage() {
    const { toast } = useToast();
    const {
        inventario,
        cotizaciones,
        codigosTrabajo,
        isLoading,
        updateCodigoTrabajo
    } = useErp();

    // Movements are still local state for now as they are not in ErpProvider primary state
    const [movements, setMovements] = useState(initialMovimientosInventario);

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

    // Derive Registers from Quotes
    const registros = useMemo(() => {
        return cotizaciones
            .filter(q => q.estado === 'EN_EJECUCION' || q.estado === 'FINALIZADA')
            .map(q => ({
                id: `REG-${q.id}`,
                cotizacionId: q.id,
                cotizacion: q,
                fechaInicio: q.fecha,
                estado: q.estado === 'FINALIZADA' ? 'FINALIZADO' : 'EN_PROCESO',
                anticipos: [],
                saldoPendiente: q.total,
                nombreObra: q.descripcionTrabajo?.substring(0, 30) + "..." || "Obra sin nombre",
                cliente: q.cliente?.nombre || "Cliente desconocido",
                valorTotal: q.total
            } as RegistroObra));
    }, [cotizaciones]);

    // Alerts Effect
    useEffect(() => {
        const lowStockCount = inventario.filter(i => i.cantidad <= i.stockMinimo).length;
        if (lowStockCount > 0 && !isLoading) {
            const timer = setTimeout(() => {
                toast({
                    title: "⚠️ Alerta de Stock",
                    description: `Tienes ${lowStockCount} items con stock bajo. Revisa el resumen.`,
                    variant: "destructive",
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [inventario, toast, isLoading]);

    const handleCreateMovement = (newMov: any) => {
        setMovements([newMov, ...movements]);
        toast({ title: "Movimiento registrado", description: "Se ha actualizado la bitácora local." });
    };

    // Calculations
    const filteredMovements = useMemo(() => {
        if (!dateRange?.from) return movements;
        return movements.filter(m => isWithinInterval(m.fecha, { start: dateRange.from!, end: dateRange.to || dateRange.from! }));
    }, [movements, dateRange]);

    const totalValue = inventario.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0);
    const totalItems = inventario.length;
    const lowStockItems = inventario.filter(i => i.cantidad <= i.stockMinimo).length;
    const kpiMovementsIn = filteredMovements.filter(m => m.tipo === 'ENTRADA').length;
    const kpiMovementsOut = filteredMovements.filter(m => m.tipo === 'SALIDA').length;

    // Chart Data Preparation
    const valueByCategory = useMemo(() => {
        const ag = inventario.reduce((acc, item) => {
            acc[item.categoria] = (acc[item.categoria] || 0) + (item.cantidad * item.valorUnitario);
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(ag).map(([name, value]) => ({ name, value }));
    }, [inventario]);

    const movementTrend = useMemo(() => {
        const ag = filteredMovements.reduce((acc, m) => {
            const day = format(m.fecha, "dd MMM", { locale: es });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(ag).map(([name, count]) => ({ name, count })).slice(0, 7);
    }, [filteredMovements]);

    const lowStockDist = useMemo(() => {
        const ag = inventario.filter(i => i.cantidad <= i.stockMinimo).reduce((acc, item) => {
            acc[item.categoria] = (acc[item.categoria] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(ag).map(([name, count]) => ({ name, count }));
    }, [inventario]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando Operaciones...</div>;
    }

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
                    {lowStockItems > 0 && (
                        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                <div>
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-300">Items con Stock Bajo Detectados</h4>
                                    <p className="text-sm text-orange-700 dark:text-orange-400">Hay items que requieren reabastecimiento urgente.</p>
                                </div>
                            </div>
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
                                <RegisterInventoryMovementDialog articulos={inventario} onMovementCreated={handleCreateMovement} />
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
                    <RegistroTable data={registros} />
                </TabsContent>
            </Tabs>

            <MovementDetailDialog
                open={movementDetailOpen}
                onOpenChange={setMovementDetailOpen}
                movement={selectedMovement}
            />

            <CodigoDetailDialog
                open={codigoDetailOpen}
                onOpenChange={setCodigoDetailOpen}
                codigo={selectedCodigo}
                onUpdate={(updated) => updateCodigoTrabajo(updated)}
            />
        </div>
    );
}

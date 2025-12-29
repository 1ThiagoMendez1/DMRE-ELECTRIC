"use client";

import { useMemo, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Package,
    FileText,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    BarChart3,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    Table as TableIcon
} from "lucide-react";
import {
    initialClients,
    initialInventory,
    initialQuotes,
    initialRegistros
} from "@/lib/mock-data";
import {
    DynamicChart,
    DashboardPanel
} from "@/components/erp/charts";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, startOfYear, endOfYear } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// --- Components ---




export default function SistemaPage() {
    // --- State ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });
    const [selectedClient, setSelectedClient] = useState("all");
    const [selectedProduct, setSelectedProduct] = useState("all");

    // Chart Types States
    const [revenueType, setRevenueType] = useState("area");
    const [statusType, setStatusType] = useState("pie");
    const [productType, setProductType] = useState("bar");
    const [clientVolumeType, setClientVolumeType] = useState("bar");
    const [inventoryType, setInventoryType] = useState("table");

    // --- Filtering ---
    const filterData = (date: Date | string, clientId?: string, productDesc?: string) => {
        const d = new Date(date);

        // Date Logic
        let dateMatch = true;
        if (dateRange?.from) {
            if (dateRange.to) {
                dateMatch = isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            } else {
                dateMatch = d >= dateRange.from;
            }
        }

        // Client Logic
        let clientMatch = true;
        if (clientId && selectedClient !== 'all') {
            clientMatch = clientId === selectedClient;
        }

        // Product Logic (Indirect)
        // This is tricky as Quotes/Registros have multiple items.
        // We will filter if ANY item matches the product.

        return dateMatch && clientMatch;
    };

    // Memos
    const filteredQuotes = useMemo(() => {
        return initialQuotes.filter(q => {
            const matchesFilter = filterData(q.fecha, q.cliente.id);
            if (!matchesFilter) return false;

            // Product Filter
            if (selectedProduct !== 'all') {
                return q.items.some(i => i.descripcion.toLowerCase().includes(selectedProduct.toLowerCase()));
            }
            return true;
        });
    }, [dateRange, selectedClient, selectedProduct]);

    const filteredRegistros = useMemo(() => {
        return initialRegistros.filter(r => {
            // Registros are linked to Quotes, so same logic
            const q = r.cotizacion;
            const matchesFilter = filterData(q.fecha, q.cliente.id);
            if (!matchesFilter) return false;

            if (selectedProduct !== 'all') {
                return q.items.some(i => i.descripcion.includes(selectedProduct));
            }
            return true;
        });
    }, [dateRange, selectedClient, selectedProduct, filteredQuotes]);

    // --- Derived Data for Charts ---

    // 1. Ingresos
    const revenueData = useMemo(() => {
        const agg: Record<string, number> = {};
        filteredRegistros.forEach(r => {
            if (r.estado !== 'FINALIZADO') return;
            const dateStr = new Date(r.cotizacion.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + r.cotizacion.total;
        });
        return Object.keys(agg).map(key => ({ name: key, total: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredRegistros]);

    // 2. Status
    const quoteStatusData = useMemo(() => {
        const statusCount: Record<string, number> = {};
        filteredQuotes.forEach(q => {
            statusCount[q.estado] = (statusCount[q.estado] || 0) + 1;
        });
        return Object.keys(statusCount).map(key => ({ name: key, value: statusCount[key] }));
    }, [filteredQuotes]);

    // 3. Top Products (from filtered quotes)
    const topProducts = useMemo(() => {
        const productCount: Record<string, number> = {};
        filteredQuotes.forEach(q => {
            q.items.forEach(item => {
                productCount[item.descripcion.substring(0, 15)] = (productCount[item.descripcion.substring(0, 15)] || 0) + item.cantidad;
            });
        });
        return Object.entries(productCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [filteredQuotes]);

    // 4. Client Volume (Top Clients by Quote Value)
    const clientVolumeData = useMemo(() => {
        const clientAgg: Record<string, number> = {};
        filteredQuotes.forEach(q => {
            clientAgg[q.cliente.nombre] = (clientAgg[q.cliente.nombre] || 0) + q.total;
        });
        return Object.entries(clientAgg)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    }, [filteredQuotes]);

    // 5. Inventory Overview (Filtered by product search mainly)
    const inventoryData = useMemo(() => {
        let items = initialInventory;
        if (selectedProduct !== 'all') {
            items = items.filter(i => i.descripcion.toLowerCase().includes(selectedProduct.toLowerCase()));
        }
        return items.map(i => ({
            name: i.descripcion.substring(0, 20),
            stock: i.cantidad,
            value: i.valorUnitario * i.cantidad,
            status: i.cantidad < 10 ? 'Bajo' : 'OK'
        })).sort((a, b) => b.value - a.value).slice(0, 50); // Limit for table
    }, [selectedProduct]);


    // KPI Values
    const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.total, 0);
    const totalQuotesValue = filteredQuotes.reduce((acc, q) => acc + q.total, 0);



    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard Avanzado</h2>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas</span>
                        <DatePickerWithRange value={dateRange} onChange={(d) => setDateRange(d)} />
                    </div>

                    <div className="flex flex-col gap-1 w-[200px]">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Cliente</span>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Clientes</SelectItem>
                                {initialClients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-1 w-[200px]">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Producto (Filtro Mock)</span>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Productos</SelectItem>
                                <SelectItem value="Cable">Cables</SelectItem>
                                <SelectItem value="Tornillo">Tornillería</SelectItem>
                                <SelectItem value="Caja">Cajas Eléctricas</SelectItem>
                                <SelectItem value="Breaker">Breakers</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1 text-right pt-4">
                        <Button variant="outline" onClick={() => { setDateRange(undefined); setSelectedClient('all'); setSelectedProduct('all'); }}>Limpiar Filtros</Button>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Filtrados</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-l-4 border-l-green-500 bg-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Cotizaciones ({filteredQuotes.length})</CardTitle>
                        <FileText className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalQuotesValue)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Dynamic Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Ingresos */}
                <DashboardPanel title="Tendencia de Ingresos" sub="Evolución financiera en el tiempo" typeState={[revenueType, setRevenueType]}>
                    <DynamicChart type={revenueType} data={revenueData} dataKey="total" xAxisKey="name" color="#0088FE" />
                </DashboardPanel>

                {/* 2. Top Products */}
                <DashboardPanel title="Productos Demandados" sub="Top items por cantidad cotizada" typeState={[productType, setProductType]}>
                    <DynamicChart type={productType} data={topProducts} dataKey="count" xAxisKey="name" color="#82ca9d" />
                </DashboardPanel>

                {/* 3. Quote Status */}
                <DashboardPanel title="Estado de Cotizaciones" sub="Distribución por estado actual" typeState={[statusType, setStatusType]}>
                    <DynamicChart type={statusType} data={quoteStatusData} dataKey="value" xAxisKey="name" color="#ffc658" />
                </DashboardPanel>

                {/* 4. Client Volume */}
                <DashboardPanel title="Volumen por Cliente" sub="Clientes con mayor valor cotizado" typeState={[clientVolumeType, setClientVolumeType]}>
                    <DynamicChart type={clientVolumeType} data={clientVolumeData} dataKey="total" xAxisKey="name" color="#FF8042" />
                </DashboardPanel>

            </div>

            {/* Full Width Table Panel */}
            <DashboardPanel title="Detalle de Inventario (Filtrado)" sub="Vista detallada de stock y valorización" typeState={[inventoryType, setInventoryType]}>
                <DynamicChart type={inventoryType} data={inventoryData} dataKey="value" xAxisKey="name" color="#8884d8" height={400} />
            </DashboardPanel>

        </div>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Proveedor, CuentaPorPagar } from "@/types/sistema"; // Assuming types exist or compatible
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

import { useMemo, useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, subMonths, isWithinInterval, differenceInDays, format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuministroDashboardProps {
    proveedores: any[];
    cuentasPorPagar: any[];
    ordenesCompra?: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function SuministroDashboard({ proveedores, cuentasPorPagar, ordenesCompra = [] }: SuministroDashboardProps) {
    // --- GLOBAL FILTERS ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subMonths(new Date(), 6),
        to: new Date(),
    });
    const [supplierFilter, setSupplierFilter] = useState<string>("all");
    const [productFilter, setProductFilter] = useState<string>("all");
    const [prodOpen, setProdOpen] = useState(false);

    // --- FILTERED DATA ---
    const filteredOrdenes = useMemo(() => {
        return ordenesCompra.filter(oc => {
            const dateMatch = dateRange?.from && dateRange?.to ? isWithinInterval(new Date(oc.fechaEmision), { start: dateRange.from, end: dateRange.to }) : true;
            const suppMatch = supplierFilter === "all" || oc.proveedorId === supplierFilter;
            const prodMatch = productFilter === "all" || oc.items.some((i: any) => i.descripcion === productFilter);
            return dateMatch && suppMatch && prodMatch;
        });
    }, [ordenesCompra, dateRange, supplierFilter, productFilter]);

    const filteredCuentas = useMemo(() => {
        return cuentasPorPagar.filter(cxp => {
            const dateMatch = dateRange?.from && dateRange?.to ? isWithinInterval(new Date(cxp.fecha), { start: dateRange.from, end: dateRange.to }) : true;
            // CxP usually doesn't have Items info directly accessible without join, so Product Filter might not apply well to CxP unless we link it.
            // For now, Product Filter will mainly affect Orders logic. 
            // Supplier Filter affects CxP.
            const suppMatch = supplierFilter === "all" || cxp.proveedorId === supplierFilter;
            return dateMatch && suppMatch;
        });
    }, [cuentasPorPagar, dateRange, supplierFilter]);

    // Derived from FILTERED data
    const totalDeuda = filteredCuentas.reduce((sum, c) => sum + c.saldoPendiente, 0);
    const totalProveedores = proveedores.length; // Keep total available
    const facturasPendientes = filteredCuentas.filter(c => c.saldoPendiente > 0).length;

    // Unique Products for Filter
    const uniqueProducts = useMemo(() => {
        const products = new Set<string>();
        ordenesCompra.forEach(oc => oc.items.forEach((i: any) => products.add(i.descripcion)));
        return Array.from(products).sort();
    }, [ordenesCompra]);

    // --- STRATEGIC LOGIC (Updated to use filteredOrdenes where appropriate) ---

    // 1. Debt Aging Summary (Pie Chart Data) - Uses filteredCuentas
    const debtAgingData = useMemo(() => {
        let current = 0;
        let d30 = 0;
        let d60plus = 0;

        filteredCuentas.forEach(cxp => {
            if (cxp.saldoPendiente > 0) {
                const days = differenceInDays(new Date(), new Date(cxp.fecha));
                if (days <= 30) current += cxp.saldoPendiente;
                else if (days <= 60) d30 += cxp.saldoPendiente;
                else d60plus += cxp.saldoPendiente;
            }
        });

        return [
            { name: 'Corriente (<30d)', value: current, color: '#10b981' },
            { name: '30-60 Días', value: d30, color: '#f59e0b' },
            { name: '+60 Días', value: d60plus, color: '#ef4444' }
        ].filter(d => d.value > 0);
    }, [filteredCuentas]);

    // 2. Product Price Comparison Logic - Uses filteredOrdenes? 
    // Actually, comparison often needs wider context, but if user filters by date, we should show prices in that range.
    const [selectedCompareItem, setSelectedCompareItem] = useState<string>("");

    const comparisonData = useMemo(() => {
        // Find items purchased from multiple suppliers WITHIN filter context (or globally if we want to compare regardless of drilldown?)
        // Let's use filteredOrdenes to respect date range.
        const sourceData = filteredOrdenes;

        const itemMap = new Map<string, Set<string>>();
        const itemPrices: Record<string, { provider: string, price: number, date: Date }[]> = {};

        sourceData.forEach(oc => {
            oc.items.forEach((item: any) => {
                const name = item.descripcion;
                if (!itemMap.has(name)) itemMap.set(name, new Set());
                itemMap.get(name)?.add(oc.proveedorId);

                if (!itemPrices[name]) itemPrices[name] = [];
                itemPrices[name].push({
                    provider: oc.proveedor.nombre,
                    price: item.valorUnitario,
                    date: new Date(oc.fechaEmision)
                });
            });
        });

        const multiSupplierItems = Array.from(itemMap.entries())
            .filter(([_, providers]) => providers.size > 1)
            .map(([name]) => name);

        if (!selectedCompareItem && multiSupplierItems.length > 0) {
            setSelectedCompareItem(multiSupplierItems[0]);
        }

        if (!selectedCompareItem) return { items: multiSupplierItems, chartData: [] };

        const rawData = itemPrices[selectedCompareItem] || [];
        const latestInfo: Record<string, { price: number, date: Date }> = {};
        rawData.forEach(d => {
            if (!latestInfo[d.provider] || d.date > latestInfo[d.provider].date) {
                latestInfo[d.provider] = { price: d.price, date: d.date };
            }
        });

        const chartData = Object.entries(latestInfo).map(([provider, info]) => ({
            name: provider,
            price: info.price
        }));

        return { items: multiSupplierItems, chartData };

    }, [filteredOrdenes, selectedCompareItem]);


    // Calculate Monthly Data (Last 6 Months or Range?)
    // If range is selected, we should probably stick to that range or show the monthly breakdown WITHIN that range.
    // For now, let's stick to the filtered data's timeline.
    // Calculate Monthly Data (Last 6 Months based on FILTERED data)
    const monthlyData = useMemo(() => {
        // Create an array for the last 6 months
        // If we really want to respect the date range, we could generate months dynamically.
        // For simplicity/visual stability, let's show the last 6 months BUT filtered by the interactions that happened.
        // Actually, if a filter is active, we should probably stick to the timeline of the filter or just show the filtered data aggregated by month.

        // Let's generate a Map of Month -> Value from filteredOrdenes
        const monthsMap = new Map<string, number>();
        filteredOrdenes.forEach(oc => {
            // Use a sortable key format like YYYY-MM
            const key = format(new Date(oc.fechaEmision), 'yyyy-MM');
            const current = monthsMap.get(key) || 0;
            monthsMap.set(key, current + oc.total);
        });

        // Generate the last 6 months for the chart x-axis
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = subMonths(new Date(), 5 - i);
            const key = format(d, 'yyyy-MM');
            return {
                name: format(d, 'MMM', { locale: es }),
                compras: monthsMap.get(key) || 0,
            };
        });

        return months;
    }, [filteredOrdenes]);

    // Top Suppliers by Spend (Filtered)
    const topSuppliers = useMemo(() => {
        const spend: Record<string, number> = {};
        filteredOrdenes.forEach(oc => {
            const name = oc.proveedor.nombre;
            if (!spend[name]) spend[name] = 0;
            spend[name] += oc.total;
        });
        return Object.entries(spend)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredOrdenes]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/40 p-4 rounded-lg border">
                <div className="flex flex-wrap items-center gap-4 w-full">
                    <DatePickerWithRange value={dateRange} onChange={setDateRange} className="w-[260px]" />

                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Todos los Proveedores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Proveedores</SelectItem>
                            {proveedores.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover open={prodOpen} onOpenChange={setProdOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={prodOpen}
                                className="w-[250px] justify-between bg-background"
                            >
                                {productFilter === "all" ? "Todos los Productos" : productFilter}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar producto..." />
                                <CommandList>
                                    <CommandEmpty>No encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => {
                                                setProductFilter("all");
                                                setProdOpen(false);
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", productFilter === "all" ? "opacity-100" : "opacity-0")} />
                                            Todos los Productos
                                        </CommandItem>
                                        {uniqueProducts.map((product) => (
                                            <CommandItem
                                                key={product}
                                                value={product}
                                                onSelect={(currentValue) => {
                                                    setProductFilter(currentValue === productFilter ? "all" : currentValue);
                                                    setProdOpen(false);
                                                }}
                                            >
                                                <Check className={cn("mr-2 h-4 w-4", productFilter === product ? "opacity-100" : "opacity-0")} />
                                                {product}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    {(supplierFilter !== "all" || productFilter !== "all" || (dateRange && differenceInDays(dateRange.to!, dateRange.from!) !== 180)) && (
                        <Button variant="ghost" size="icon" onClick={() => {
                            setSupplierFilter("all");
                            setProductFilter("all");
                            setDateRange({ from: subMonths(new Date(), 6), to: new Date() });
                        }}>
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDeuda)}</div>
                        <p className="text-xs text-muted-foreground">En facturas pendientes (Filtrado)</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProveedores}</div>
                        <p className="text-xs text-muted-foreground">Activos en el sistema</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{facturasPendientes}</div>
                        <p className="text-xs text-muted-foreground">Facturas pendientes</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Órdenes (Periodo)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(filteredOrdenes.reduce((acc, curr) => acc + curr.total, 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">{filteredOrdenes.length} órdenes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Analysis Section */}
            <div className="grid gap-6 md:grid-cols-7">
                {/* Product Price Comparison */}
                <Card className="col-span-5 shadow-sm border-0">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Comparativa de Precios</CardTitle>
                            <CardDescription>Análisis de costo unitario por proveedor</CardDescription>
                        </div>
                        <div className="w-[250px]">
                            <Select value={selectedCompareItem} onValueChange={setSelectedCompareItem}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {comparisonData.items.map(item => (
                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {comparisonData.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonData.chartData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={true} />
                                    <XAxis type="number" fontSize={12} tickFormatter={(val) => `$${val}`} />
                                    <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatCurrency(value), 'Costo Unitario']}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="price" name="Costo Unitario" fill="#8884d8" barSize={30} radius={[0, 4, 4, 0]}>
                                        {comparisonData.chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                <p>Seleccione un producto con múltiples proveedores para comparar.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Debt Composition */}
                <Card className="col-span-2 shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Composición Deuda</CardTitle>
                        <CardDescription>Por antigüedad</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={debtAgingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {debtAgingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section Lower */}
            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Tendencia de Compras</CardTitle>
                        <CardDescription>Evolución mensual del gasto</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} barSize={30}>
                                <defs>
                                    <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickFormatter={(value) => `$${value / 1000000}M`} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [formatCurrency(value), 'Compras']}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend iconType="circle" />
                                <Bar dataKey="compras" name="Compras" fill="url(#colorCompras)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm border-0">
                    <CardHeader>
                        <CardTitle>Top Proveedores</CardTitle>
                        <CardDescription>Mayores compras históricas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topSuppliers.map((supplier, i) => (
                                <div key={supplier.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{supplier.name}</p>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(supplier.value / topSuppliers[0].value) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground">{formatCurrency(supplier.value)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

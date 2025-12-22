"use client";

import { useState, useMemo } from "react";
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users,
    FileText,
    Receipt,
    Plus,
    Search,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreHorizontal,
    ArrowUpRight,
    LayoutDashboard as LayoutDashboardIcon,
    DollarSign,
    PieChart as PieChartIcon,
    BarChart3,
    LineChart as LineChartIcon,
    Table as TableIcon
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { initialClients, initialQuotes, initialFacturas } from "@/lib/mock-data";
import { EstadoCotizacion } from "@/types/sistema";
import { CreateClientDialog } from "@/components/erp/create-client-dialog";
import { CreateProjectDialog } from "@/components/erp/create-project-dialog";
import { EditClientDialog } from "@/components/erp/edit-client-dialog";
import { ClientProfileDialog } from "@/components/erp/client-profile-dialog";
import { EditQuoteDialog } from "@/components/erp/edit-quote-dialog";

export default function CommercialPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [clientes, setClientes] = useState(initialClients);
    const [cotizaciones, setCotizaciones] = useState(initialQuotes);

    // --- DASHBOARD STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
    });
    const [selectedClientFilter, setSelectedClientFilter] = useState("all");

    // Chart Types
    const [revenueType, setRevenueType] = useState("area");
    const [statusType, setStatusType] = useState("pie");
    const [productType, setProductType] = useState("bar");
    const [clientVolumeType, setClientVolumeType] = useState("bar");

    const filterData = (date: Date | string, clientId?: string) => {
        const d = new Date(date);
        let dateMatch = true;
        if (dateRange?.from) {
            if (dateRange.to) dateMatch = isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
            else dateMatch = d >= dateRange.from;
        }
        let clientMatch = true;
        if (clientId && selectedClientFilter !== 'all') clientMatch = clientId === selectedClientFilter;
        return dateMatch && clientMatch;
    };

    const dashboardFilteredQuotes = useMemo(() => {
        return initialQuotes.filter(q => filterData(q.fecha, q.cliente.id));
    }, [dateRange, selectedClientFilter]);

    // 1. Revenue Over Time (Approved Quotes)
    const revenueData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredQuotes.forEach(q => {
            if (q.estado !== 'APROBADA' && q.estado !== 'FINALIZADA') return;
            const dateStr = new Date(q.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
            agg[dateStr] = (agg[dateStr] || 0) + q.total;
        });
        return Object.keys(agg).map(key => ({ name: key, total: agg[key] })).sort((a, b) => a.name.localeCompare(b.name));
    }, [dashboardFilteredQuotes]);

    // 2. Quote Status
    const quoteStatusData = useMemo(() => {
        const counts: Record<string, number> = {};
        dashboardFilteredQuotes.forEach(q => counts[q.estado] = (counts[q.estado] || 0) + 1);
        return Object.keys(counts).map(k => ({ name: k.replace('_', ' '), value: counts[k] }));
    }, [dashboardFilteredQuotes]);

    // 3. Top Products
    const topProductsData = useMemo(() => {
        const counts: Record<string, number> = {};
        dashboardFilteredQuotes.forEach(q => {
            q.items.forEach(i => counts[i.descripcion.substring(0, 15)] = (counts[i.descripcion.substring(0, 15)] || 0) + i.cantidad);
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
    }, [dashboardFilteredQuotes]);

    // 4. Client Volume
    const clientVolumeData = useMemo(() => {
        const agg: Record<string, number> = {};
        dashboardFilteredQuotes.forEach(q => agg[q.cliente.nombre] = (agg[q.cliente.nombre] || 0) + q.total);
        return Object.entries(agg).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8);
    }, [dashboardFilteredQuotes]);

    const kpiTotalRevenue = revenueData.reduce((acc, curr) => acc + curr.total, 0);
    const kpiTotalQuotes = dashboardFilteredQuotes.reduce((acc, q) => acc + q.total, 0);



    // --- HELPER FUNCTIONS ---
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (date: Date) => {
        return format(new Date(date), "dd MMM yyyy", { locale: es });
    };

    const getStatusColor = (status: EstadoCotizacion) => {
        switch (status) {
            case 'APROBADA':
            case 'FINALIZADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'RECHAZADA':
            case 'NO_APROBADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'EN_EJECUCION': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    const getProgressValue = (status: EstadoCotizacion) => {
        switch (status) {
            case 'BORRADOR': return 10;
            case 'ENVIADA': return 30;
            case 'PENDIENTE': return 30;
            case 'APROBADA': return 50;
            case 'EN_EJECUCION': return 75;
            case 'FINALIZADA': return 100;
            case 'RECHAZADA': return 100; // Finished but failed
            case 'NO_APROBADA': return 100;
            default: return 0;
        }
    };

    // --- STATE MANAGEMENT ---
    // In a real app, this would be global state (Redux/Zustand) or Server State (React Query)
    const [clients, setClients] = useState(initialClients);

    const handleCreateClient = (newClient: any) => {
        setClients([newClient, ...clients]);
    };

    // --- MEMOIZED DATA ---
    const filteredClients = useMemo(() => {
        return clients.filter(c =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.documento.includes(searchTerm)
        );
    }, [searchTerm, clients]);

    const [projects, setProjects] = useState(initialQuotes);

    const handleCreateProject = (newProject: any) => {
        setProjects([newProject, ...projects]);
    };

    const filteredQuotes = useMemo(() => {
        return projects.filter(q =>
            q.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, projects]);

    const filteredInvoices = useMemo(() => {
        return initialFacturas.filter(f =>
            f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.cotizacion.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión Comercial</h1>
                    <p className="text-muted-foreground">Administración de clientes, proyectos y facturación.</p>
                </div>
                <div className="flex items-center gap-2">

                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="clientes" className="gap-2"><Users className="h-4 w-4" /> Clientes</TabsTrigger>
                    <TabsTrigger value="ofertas" className="gap-2"><FileText className="h-4 w-4" /> Ofertas y Proyectos</TabsTrigger>
                    <TabsTrigger value="facturacion" className="gap-2"><Receipt className="h-4 w-4" /> Facturación y Cartera</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Rango de Fechas</span>
                            <DatePickerWithRange value={dateRange} onChange={setDateRange} />
                        </div>
                        <div className="flex flex-col gap-1 w-[200px]">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Cliente</span>
                            <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
                                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Clientes</SelectItem>
                                    {initialClients.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 text-right pt-4">
                            <Button variant="outline" onClick={() => { setDateRange(undefined); setSelectedClientFilter('all'); }}>Limpiar Filtros</Button>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="shadow-sm border-l-4 border-l-primary bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Ventas Aprobadas</CardTitle>
                                <DollarSign className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kpiTotalRevenue)}</div>
                                <p className="text-xs text-muted-foreground">En periodo seleccionado</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-blue-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Cotizado</CardTitle>
                                <FileText className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(kpiTotalQuotes)}</div>
                                <p className="text-xs text-muted-foreground">{dashboardFilteredQuotes.length} cotizaciones</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-green-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardFilteredQuotes.length > 0
                                        ? Math.round((dashboardFilteredQuotes.filter(q => q.estado === 'APROBADA' || q.estado === 'FINALIZADA').length / dashboardFilteredQuotes.length) * 100)
                                        : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Cotizaciones aprobadas</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-l-4 border-l-red-500 bg-card">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Cartera Vencida</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(initialFacturas.filter(f => isBefore(f.fechaVencimiento, new Date()) && f.saldoPendiente > 0).reduce((acc, curr) => acc + curr.saldoPendiente, 0))}
                                </div>
                                <p className="text-xs text-muted-foreground">Global (No filtra por fecha dashboard)</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DashboardPanel title="Tendencia de Ventas" sub="Ingresos por cotizaciones aprobadas" typeState={[revenueType, setRevenueType]}>
                            <DynamicChart type={revenueType} data={revenueData} dataKey="total" xAxisKey="name" color="#0088FE" />
                        </DashboardPanel>
                        <DashboardPanel title="Estado de Cotizaciones" sub="Distribución del pipeline comercial" typeState={[statusType, setStatusType]}>
                            <DynamicChart type={statusType} data={quoteStatusData} dataKey="value" xAxisKey="name" color="#00C49F" />
                        </DashboardPanel>
                        <DashboardPanel title="Productos Más Cotizados" sub="Top items en ofertas" typeState={[productType, setProductType]}>
                            <DynamicChart type={productType} data={topProductsData} dataKey="count" xAxisKey="name" color="#FFBB28" />
                        </DashboardPanel>
                        <DashboardPanel title="Volumen por Cliente" sub="Clientes clave por valor ofertado" typeState={[clientVolumeType, setClientVolumeType]}>
                            <DynamicChart type={clientVolumeType} data={clientVolumeData} dataKey="total" xAxisKey="name" color="#FF8042" />
                        </DashboardPanel>
                    </div>
                </TabsContent>

                {/* --- CLIENTES TAB --- */}
                <TabsContent value="clientes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Directorio de Clientes</CardTitle>
                                <div className="flex items-center gap-2">
                                    <CreateClientDialog onClientCreated={handleCreateClient} />
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar cliente..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Razón Social</TableHead>
                                        <TableHead>NIT / Documento</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredClients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.nombre}</TableCell>
                                            <TableCell>{client.documento}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span>{client.contactoPrincipal}</span>
                                                    <span className="text-xs text-muted-foreground">{client.correo}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{client.telefono}</TableCell>
                                            <TableCell>{client.direccion}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <ClientProfileDialog cliente={client} />
                                                    <EditClientDialog
                                                        cliente={client}
                                                        onClientUpdated={(updated) => setClientes(prev => prev.map(c => c.id === updated.id ? updated : c))}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- OFERTAS TAB --- */}
                <TabsContent value="ofertas" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Control de Ofertas y Proyectos</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar oferta o cliente..."
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
                                        <TableHead>ID Oferta</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Descripción / Tipo</TableHead>
                                        <TableHead>Progreso</TableHead>
                                        <TableHead>Valor Total</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredQuotes.map((quote) => (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-mono">{quote.numero}</TableCell>
                                            <TableCell className="font-medium">{quote.cliente.nombre}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col max-w-[200px]">
                                                    <span className="truncate" title={quote.descripcionTrabajo}>{quote.descripcionTrabajo}</span>
                                                    <Badge variant="outline" className="w-fit text-[10px] mt-1">{quote.tipo}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <div className="flex flex-col gap-1">
                                                    <Progress value={getProgressValue(quote.estado)} className="h-2" />
                                                    <span className="text-[10px] text-muted-foreground text-right">{getProgressValue(quote.estado)}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(quote.total)}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(quote.estado)} variant="secondary">
                                                    {quote.estado.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => toast({ title: "Detalles", description: `Viendo detalles de oferta ${quote.numero}` })}>Ver Detalles</DropdownMenuItem>
                                                        <EditQuoteDialog
                                                            cotizacion={quote}
                                                            onQuoteUpdated={(updated) => setCotizaciones(prev => prev.map(q => q.id === updated.id ? updated : q))}
                                                        />
                                                        <DropdownMenuItem onClick={() => toast({ title: "PDF", description: "Generación de PDF en desarrollo" })}>Generar PDF</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- FACTURACION TAB --- */}
                <TabsContent value="facturacion" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Facturación y Gestión de Cobro</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar factura..."
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
                                        <TableHead>N° Factura</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead>Cliente / Proyecto</TableHead>
                                        <TableHead>Valor Facturado</TableHead>
                                        <TableHead>Saldo Pendiente</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvoices.map((inv) => {
                                        const isOverdue = isBefore(inv.fechaVencimiento, new Date()) && inv.saldoPendiente > 0;
                                        return (
                                            <TableRow key={inv.id}>
                                                <TableCell className="font-mono">{inv.id}</TableCell>
                                                <TableCell>{formatDate(inv.fechaEmision)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {formatDate(inv.fechaVencimiento)}
                                                        {isOverdue && <div title="Vencida"><AlertCircle className="h-3 w-3 text-red-500" /></div>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{inv.cotizacion.cliente.nombre}</span>
                                                        <span className="text-xs text-muted-foreground">REF: {inv.cotizacion.numero}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(inv.valorFacturado)}</TableCell>
                                                <TableCell className={inv.saldoPendiente > 0 ? "font-bold text-orange-600 dark:text-orange-400" : "text-muted-foreground"}>
                                                    {formatCurrency(inv.saldoPendiente)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={inv.estado === 'CANCELADA' ? 'default' : 'outline'} className={inv.estado === 'PENDIENTE' && isOverdue ? 'border-red-500 text-red-500' : ''}>
                                                        {inv.estado}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

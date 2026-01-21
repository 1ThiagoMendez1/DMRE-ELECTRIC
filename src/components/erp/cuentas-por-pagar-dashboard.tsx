import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { format, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Search, AlertCircle, Clock, DollarSign } from "lucide-react";
import { CuentaPorPagar, Proveedor } from "@/types/sistema";

interface CuentasPorPagarDashboardProps {
    cuentas: CuentaPorPagar[];
    proveedores: Proveedor[];
    onRegisterPayment: (id: string, amount: number) => void;
}

export function CuentasPorPagarDashboard({ cuentas, proveedores, onRegisterPayment }: CuentasPorPagarDashboardProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierFilter, setSupplierFilter] = useState("all");
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null); // For Detail Dialog

    // Process data and calculate derived fields
    const processedCuentas = useMemo(() => {
        return cuentas.map(cxp => {
            const fechaVencimiento = addDays(new Date(cxp.fecha), 30);
            const daysOverdue = differenceInDays(new Date(), fechaVencimiento);
            const daysToDue = differenceInDays(fechaVencimiento, new Date());

            const isOverdue = daysOverdue > 0 && cxp.saldoPendiente > 0;
            const isUpcoming = daysToDue <= 5 && daysToDue >= 0 && cxp.saldoPendiente > 0;

            let status = 'PENDING';
            if (cxp.saldoPendiente === 0) status = 'PAID';
            else if (isOverdue) status = 'OVERDUE';
            else if (isUpcoming) status = 'UPCOMING';

            return {
                ...cxp,
                fechaVencimiento,
                daysOverdue,
                daysToDue,
                statusLabel: status
            };
        });
    }, [cuentas]);

    // Apply filters
    const filteredCuentas = useMemo(() => {
        return processedCuentas.filter(cxp => {
            const matchesSearch =
                cxp.proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cxp.numeroFacturaProveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cxp.concepto.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSupplier = supplierFilter === "all" || cxp.proveedorId === supplierFilter;

            let matchesStatus = true;
            if (statusFilter === 'pending') matchesStatus = cxp.statusLabel === 'PENDING' || cxp.statusLabel === 'UPCOMING';
            if (statusFilter === 'overdue') matchesStatus = cxp.statusLabel === 'OVERDUE';
            if (statusFilter === 'paid') matchesStatus = cxp.statusLabel === 'PAID';
            if (statusFilter === 'upcoming') matchesStatus = cxp.statusLabel === 'UPCOMING';

            return matchesSearch && matchesSupplier && matchesStatus;
        });
    }, [processedCuentas, searchTerm, statusFilter, supplierFilter]);

    // Aging Analysis
    const agingStats = useMemo(() => {
        let totalPending = 0;
        let pending0to30 = 0;
        let pending31to60 = 0;
        let pending60plus = 0;
        let totalOverdue = 0;

        processedCuentas.forEach(cxp => {
            if (cxp.saldoPendiente > 0) {
                totalPending += cxp.saldoPendiente;
                const age = differenceInDays(new Date(), new Date(cxp.fecha));

                if (cxp.statusLabel === 'OVERDUE') totalOverdue += cxp.saldoPendiente;

                if (age <= 30) pending0to30 += cxp.saldoPendiente;
                else if (age <= 60) pending31to60 += cxp.saldoPendiente;
                else pending60plus += cxp.saldoPendiente;
            }
        });

        return { totalPending, pending0to30, pending31to60, pending60plus, totalOverdue };
    }, [processedCuentas]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Aging Dashboard */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* ... (Existing Cards logic remains, simplified for brevity in this replacement block, but need to maintain it) */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Por Pagar Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(agingStats.totalPending)}</div>
                        <p className="text-xs text-muted-foreground">{filteredCuentas.filter(c => c.saldoPendiente > 0).length} facturas abiertas</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Corriente (0-30 d)</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(agingStats.pending0to30)}</div>
                        <p className="text-xs text-muted-foreground">Al día</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">30-60 Días</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(agingStats.pending31to60)}</div>
                        <p className="text-xs text-muted-foreground">Atención requerida</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Vencido / +60d</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(agingStats.totalOverdue + agingStats.pending60plus)}</div>
                        <p className="text-xs text-muted-foreground">Acción inmediata</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar proveedor, factura..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-white dark:bg-slate-950"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Estados</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                            <SelectItem value="upcoming">Próximo a Vencer</SelectItem>
                            <SelectItem value="overdue">Vencidos</SelectItem>
                            <SelectItem value="paid">Pagados</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                        <SelectTrigger className="w-full md:w-[200px] bg-white dark:bg-slate-950">
                            <SelectValue placeholder="Filtrar por Proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Proveedores</SelectItem>
                            {proveedores.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Table */}
            <Card className="border-none shadow-md">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[200px]">Proveedor</TableHead>
                                <TableHead>Factura / Ref</TableHead>
                                <TableHead>Vencimiento</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCuentas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No se encontraron facturas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCuentas.map((cxp) => (
                                    <TableRow
                                        key={cxp.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                                        onClick={() => setSelectedInvoice(cxp)}
                                    >
                                        <TableCell className="font-medium">
                                            <div>{cxp.proveedor.nombre}</div>
                                            <div className="text-xs text-muted-foreground">{cxp.proveedor.nit}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{cxp.numeroFacturaProveedor}</div>
                                            <div className="text-xs text-muted-foreground">{cxp.concepto}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={cxp.statusLabel === 'OVERDUE' ? "text-red-500 font-medium" : cxp.statusLabel === 'UPCOMING' ? "text-amber-600 font-medium" : ""}>
                                                    {format(cxp.fechaVencimiento, "dd MMM yyyy", { locale: es })}
                                                </span>
                                                {cxp.statusLabel === 'OVERDUE' && <span className="text-[10px] text-red-500 font-bold">+{cxp.daysOverdue} días</span>}
                                                {cxp.statusLabel === 'UPCOMING' && <span className="text-[10px] text-amber-600 font-bold">En {cxp.daysToDue} días</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {cxp.statusLabel === 'PAID' && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Pagado</Badge>}
                                                {cxp.statusLabel === 'PENDING' && <Badge variant="secondary" className="bg-slate-100 text-slate-700">Pendiente</Badge>}
                                                {cxp.statusLabel === 'UPCOMING' && <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Próximo</Badge>}
                                                {cxp.statusLabel === 'OVERDUE' && <Badge variant="destructive">Vencido</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(cxp.valorTotal)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            <span className={cxp.saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"}>
                                                {formatCurrency(cxp.saldoPendiente)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            {cxp.saldoPendiente > 0 && (
                                                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs shadow-sm"
                                                    onClick={() => onRegisterPayment(cxp.id, cxp.saldoPendiente)}
                                                >
                                                    Pagar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Factura: {selectedInvoice?.numeroFacturaProveedor}</DialogTitle>
                        <DialogDescription>Proveedor: {selectedInvoice?.proveedor.nombre}</DialogDescription>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Total Facturado</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0 text-xl font-bold">{formatCurrency(selectedInvoice.valorTotal)}</CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Pagado</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0 text-xl font-bold text-emerald-600">{formatCurrency(selectedInvoice.valorPagado)}</CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Pendiente</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0 text-xl font-bold text-red-600">{formatCurrency(selectedInvoice.saldoPendiente)}</CardContent>
                                </Card>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-2">Historial de Pagos / Abonos</h3>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Referencia</TableHead>
                                                <TableHead>Nota</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedInvoice.pagos && selectedInvoice.pagos.length > 0 ? (
                                                selectedInvoice.pagos.map((p: any) => (
                                                    <TableRow key={p.id}>
                                                        <TableCell>{format(new Date(p.fecha), 'dd/MM/yyyy')}</TableCell>
                                                        <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                                        <TableCell>{p.nota || '-'}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatCurrency(p.valor)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No hay pagos registrados</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Cerrar</Button>
                                {selectedInvoice.saldoPendiente > 0 && (
                                    <Button onClick={() => {
                                        onRegisterPayment(selectedInvoice.id, selectedInvoice.saldoPendiente);
                                        setSelectedInvoice(null);
                                    }}>Registrar Nuevo Pago</Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

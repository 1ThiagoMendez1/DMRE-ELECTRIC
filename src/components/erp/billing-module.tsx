"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, AlertTriangle, ChevronDown, ChevronRight, CheckCircle2, Clock, Calendar } from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { CreateFacturaDialog } from "@/components/erp/create-factura-dialog";
import { FacturaHistoryDialog } from "@/components/erp/factura-history-dialog";
import { useErp } from "@/components/providers/erp-provider";
import { useToast } from "@/hooks/use-toast";
import { Factura, CuentaBancaria } from "@/types/sistema";
import { formatCurrency, cn } from "@/lib/utils";

export function BillingModule() {
    const { facturas, addFactura, updateFactura, cotizaciones, cuentasBancarias } = useErp();
    const { toast } = useToast();
    const [invoiceSearch, setInvoiceSearch] = useState("");
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
        vencidas: false,
        pendientes: false,
        pagadas: true // Group paid by default
    });

    const toggleGroup = (group: string) => {
        setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    // --- LOGIC ---

    // Calculate Next ID
    const nextInvoiceId = useMemo(() => {
        if (facturas.length === 0) return "Fac-0001";
        const ids = facturas.map(f => {
            const num = parseInt(f.id.replace(/[^0-9]/g, ''));
            return isNaN(num) ? 0 : num;
        });
        const maxId = Math.max(0, ...ids);
        return `Fac-${String(maxId + 1).padStart(4, '0')}`;
    }, [facturas]);

    // Filter Logic
    const filteredFacturas = useMemo(() => {
        return facturas.filter(f =>
            f.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
            f.cotizacion?.cliente?.nombre.toLowerCase().includes(invoiceSearch.toLowerCase())
        );
    }, [facturas, invoiceSearch]);

    // Grouping Logic
    const groups = useMemo(() => {
        const now = new Date();
        const vencidas: Factura[] = [];
        const pendientes: Factura[] = [];
        const pagadas: Factura[] = [];

        filteredFacturas.forEach(f => {
            if (f.estado === 'PAGADA') {
                pagadas.push(f);
            } else if (new Date(f.fechaVencimiento) < now) {
                vencidas.push(f);
            } else {
                pendientes.push(f);
            }
        });

        return { vencidas, pendientes, pagadas };
    }, [filteredFacturas]);

    // Handlers
    const handleCreateInvoice = (newInvoice: Factura) => {
        addFactura(newInvoice);
        toast({ title: "Factura Creada", description: `Factura ${newInvoice.id} creada correctamente.` });
    };

    const handleInvoiceUpdate = (updated: Factura) => {
        updateFactura(updated);
        toast({ title: "Factura Actualizada", description: `Factura ${updated.id} actualizada correctamente.` });
    };

    // Overdue Check (Run once or when facturas change)
    useEffect(() => {
        const overdueCount = facturas.filter(f => new Date() > new Date(f.fechaVencimiento) && f.estado !== 'PAGADA').length;
        if (overdueCount > 0) {
            toast({
                variant: "destructive",
                title: "Atención: Facturas Vencidas",
                description: `Existen ${overdueCount} facturas vencidas en cartera. Revise la lista.`,
                duration: 5000
            });
        }
    }, [facturas, toast]); // Only check when invoicing data changes

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <CardTitle>Gestión de Facturación y Cartera</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar factura o cliente..."
                                className="pl-8"
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                            />
                        </div>
                        <CreateFacturaDialog
                            onFacturaCreated={handleCreateInvoice}
                            nextId={nextInvoiceId}
                            cotizaciones={cotizaciones}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* GROUP: VENCIDAS */}
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleGroup('vencidas')}
                            className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
                                {collapsedGroups.vencidas ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <Clock className="h-4 w-4" />
                                VENCIDAS ({groups.vencidas.length})
                            </div>
                        </button>
                        {!collapsedGroups.vencidas && (
                            <InvoiceTable
                                items={groups.vencidas}
                                onUpdate={handleInvoiceUpdate}
                                cuentas={cuentasBancarias}
                                rowClassName="bg-red-50/30 dark:bg-red-900/5"
                            />
                        )}
                    </div>

                    {/* GROUP: PENDIENTES AL DIA */}
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleGroup('pendientes')}
                            className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold">
                                {collapsedGroups.pendientes ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <Calendar className="h-4 w-4" />
                                PENDIENTES AL DÍA ({groups.pendientes.length})
                            </div>
                        </button>
                        {!collapsedGroups.pendientes && (
                            <InvoiceTable
                                items={groups.pendientes}
                                onUpdate={handleInvoiceUpdate}
                                cuentas={cuentasBancarias}
                            />
                        )}
                    </div>

                    {/* GROUP: PAGADAS */}
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleGroup('pagadas')}
                            className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30 transition-colors"
                        >
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold">
                                {collapsedGroups.pagadas ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <CheckCircle2 className="h-4 w-4" />
                                PAGADAS ({groups.pagadas.length})
                            </div>
                        </button>
                        {!collapsedGroups.pagadas && (
                            <InvoiceTable
                                items={groups.pagadas}
                                onUpdate={handleInvoiceUpdate}
                                cuentas={cuentasBancarias}
                                rowClassName="opacity-80"
                            />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Sub-component for clean rendering
function InvoiceTable({ items, onUpdate, cuentas, rowClassName }: {
    items: Factura[],
    onUpdate: (f: Factura) => void,
    cuentas: CuentaBancaria[],
    rowClassName?: string
}) {
    if (items.length === 0) {
        return <div className="p-8 text-center text-muted-foreground text-sm">No hay facturas en esta categoría.</div>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Saldo Pendiente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((fac) => {
                    const isOverdue = new Date() > new Date(fac.fechaVencimiento) && fac.estado !== 'PAGADA';
                    return (
                        <TableRow key={fac.id} className={cn(rowClassName, isOverdue && "bg-red-50/50 dark:bg-red-950/10")}>
                            <TableCell className="font-mono font-bold">{fac.id}</TableCell>
                            <TableCell>{fac.cotizacion?.cliente?.nombre || "Cliente General"}</TableCell>
                            <TableCell>{format(new Date(fac.fechaEmision), "dd MMM yyyy", { locale: es })}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {format(new Date(fac.fechaVencimiento), "dd MMM yyyy", { locale: es })}
                                    {isOverdue && <div title="Vencida"><AlertTriangle className="h-3 w-3 text-red-500" /></div>}
                                </div>
                            </TableCell>
                            <TableCell>{formatCurrency(fac.valorFacturado)}</TableCell>
                            <TableCell className={cn("font-bold", fac.saldoPendiente > 0 ? "text-red-500" : "text-green-600")}>
                                {formatCurrency(fac.saldoPendiente)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={fac.estado === 'PAGADA' ? 'default' : fac.estado === 'PARCIAL' ? 'secondary' : 'destructive'}
                                    className={cn(fac.estado === 'PAGADA' && "bg-green-600 hover:bg-green-700 text-white")}>
                                    {fac.estado}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <FacturaHistoryDialog
                                    factura={fac}
                                    onFacturaUpdated={onUpdate}
                                    cuentas={cuentas}
                                    trigger={
                                        <Button variant="outline" size="sm" className="text-xs">
                                            Gestionar
                                        </Button>
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}


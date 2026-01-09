"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, AlertTriangle } from "lucide-react";

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
import { Factura } from "@/types/sistema";
import { formatCurrency, cn } from "@/lib/utils";

export function BillingModule() {
    const { facturas, addFactura, updateFactura, cotizaciones } = useErp();
    const { toast } = useToast();
    const [invoiceSearch, setInvoiceSearch] = useState("");

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
        const overdueCount = facturas.filter(f => new Date() > new Date(f.fechaVencimiento) && f.estado !== 'CANCELADA').length;
        if (overdueCount > 0) {
            // Debounce or just show? To avoid spamming on every keypress, we rely on useEffect deps.
            // But if I type in search, this doesn't trigger. triggers on `facturas` change.
            // Good.
            toast({
                variant: "destructive",
                title: "Atención: Facturas Vencidas",
                description: `Existen ${overdueCount} facturas vencidas en cartera. Revise la lista.`,
                duration: 5000
            });
        }
    }, [facturas]); // Only check when invoicing data changes

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
                        {filteredFacturas.map((fac) => {
                            const isOverdue = new Date() > new Date(fac.fechaVencimiento) && fac.estado !== 'CANCELADA';
                            return (
                                <TableRow key={fac.id} className={cn(isOverdue && "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40")}>
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
                                        <Badge variant={fac.estado === 'CANCELADA' ? 'default' : fac.estado === 'PARCIAL' ? 'secondary' : 'destructive'}>
                                            {fac.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <FacturaHistoryDialog
                                            factura={fac}
                                            onFacturaUpdated={handleInvoiceUpdate}
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
            </CardContent>
        </Card>
    );
}

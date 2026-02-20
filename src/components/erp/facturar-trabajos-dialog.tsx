"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Search, CheckCircle2, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Factura, Cotizacion, EstadoCotizacion } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency, cn } from "@/lib/utils";

interface FacturarTrabajosDialogProps {
    onFacturaCreated: (factura: Factura) => void;
    nextId?: string;
}

function getEstadoBadge(estado: EstadoCotizacion) {
    switch (estado) {
        case 'APROBADA':
            return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">Aprobada</Badge>;
        case 'EN_REVISION':
            return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-[10px]">En Revisión</Badge>;
        case 'MODIFICACION':
            return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">Modificación</Badge>;
        default:
            return <Badge variant="outline" className="text-[10px]">{estado}</Badge>;
    }
}

export function FacturarTrabajosDialog({ onFacturaCreated, nextId }: FacturarTrabajosDialogProps) {
    const [open, setOpen] = useState(false);
    const { cotizaciones, facturas, clientes } = useErp();
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");

    // Filter only approved/in-execution/finalized cotizaciones
    const trabajosAprobados = useMemo(() => {
        const estadosValidos: EstadoCotizacion[] = ['APROBADA'];
        return cotizaciones
            .filter(c => estadosValidos.includes(c.estado))
            .map(c => {
                const yaFacturado = facturas
                    .filter(f => f.cotizacionId === c.id)
                    .reduce((sum, f) => sum + f.valorFacturado, 0);
                const pendiente = Math.max(0, c.total - yaFacturado);
                return { ...c, yaFacturado, pendiente };
            });
    }, [cotizaciones, facturas]);

    // Filter by search term
    const filtered = useMemo(() => {
        if (!search.trim()) return trabajosAprobados;
        const q = search.toLowerCase();
        return trabajosAprobados.filter(t =>
            t.numero.toLowerCase().includes(q) ||
            t.cliente?.nombre?.toLowerCase().includes(q) ||
            t.descripcionTrabajo?.toLowerCase().includes(q)
        );
    }, [trabajosAprobados, search]);

    // Selected project details
    const selected = useMemo(() => {
        if (!selectedId) return null;
        return trabajosAprobados.find(t => t.id === selectedId) || null;
    }, [selectedId, trabajosAprobados]);

    const canCreate = selected && selected.pendiente > 0 && fechaEmision;

    const handleCreate = () => {
        if (!selected || !fechaEmision) return;

        const newFactura: any = {
            id: "", // Server ignores this or assigns randomly, but we leave it empty to avoid clashes if DB expects uuid
            numero: undefined,
            cotizacionId: selected.id,
            cotizacion: selected as Cotizacion,
            clienteId: selected.clienteId,
            trabajoId: selected.trabajoId || undefined,
            fechaEmision: new Date(fechaEmision),
            fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : new Date(fechaEmision),
            subtotal: selected.pendiente,
            iva: 0,
            valorFacturado: selected.pendiente,
            valorPagado: 0,
            saldoPendiente: selected.pendiente,
            estado: "PENDIENTE",
            anticipoRecibido: 0,
            retencionRenta: 0,
            retencionIca: 0,
            retencionIva: 0,
        };

        onFacturaCreated(newFactura);
        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedId(null);
        setFechaEmision("");
        setFechaVencimiento("");
        setSearch("");
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Facturar Trabajo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Facturar Trabajos Aprobados
                    </DialogTitle>
                    <DialogDescription>
                        Seleccione un trabajo aprobado para generar su factura. Solo necesita ingresar las fechas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número, cliente o descripción..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Project List */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <ScrollArea className="h-[280px]">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
                                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-50 mx-auto" />
                                    <p className="text-sm">No hay proyectos aprobados pendientes de facturar</p>
                                </div>
                            ) : (
                                <div className="w-full relative overflow-auto">
                                    <Table className="min-w-[600px] w-full">
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[80px] sm:w-[100px] font-semibold text-xs sm:text-sm">Proyecto</TableHead>
                                                <TableHead className="font-semibold text-xs sm:text-sm">Cliente</TableHead>
                                                <TableHead className="hidden md:table-cell font-semibold text-xs sm:text-sm">Descripción</TableHead>
                                                <TableHead className="font-semibold text-xs sm:text-sm text-right">Total</TableHead>
                                                <TableHead className="font-semibold text-xs sm:text-sm text-right">Facturado</TableHead>
                                                <TableHead className="font-semibold text-xs sm:text-sm text-right">Pendiente</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filtered.map(t => (
                                                <TableRow
                                                    key={t.id}
                                                    className={cn(
                                                        "cursor-pointer transition-colors hover:bg-muted/50",
                                                        selectedId === t.id && "bg-blue-50/80 dark:bg-blue-900/20 border-l-4 border-l-blue-600",
                                                        t.pendiente <= 0 && "opacity-60 grayscale-[0.5]"
                                                    )}
                                                    onClick={() => t.pendiente > 0 && setSelectedId(t.id)}
                                                >
                                                    <TableCell className="font-mono font-bold text-xs">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span>{t.numero}</span>
                                                            <span className="md:hidden scale-75 origin-left">{getEstadoBadge(t.estado)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        <span className="line-clamp-2 md:line-clamp-1">{t.cliente?.nombre || "Sin cliente"}</span>
                                                        {/* Description inline on very small screens */}
                                                        <span className="block md:hidden text-xs text-muted-foreground font-normal line-clamp-1 mt-0.5" title={t.descripcionTrabajo}>
                                                            {t.descripcionTrabajo || "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate" title={t.descripcionTrabajo}>
                                                        {t.descripcionTrabajo || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs sm:text-sm font-medium">{formatCurrency(t.total)}</TableCell>
                                                    <TableCell className="text-right text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(t.yaFacturado)}</TableCell>
                                                    <TableCell className={cn(
                                                        "text-right text-xs sm:text-sm font-bold",
                                                        t.pendiente > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
                                                    )}>
                                                        {t.pendiente > 0 ? formatCurrency(t.pendiente) : (
                                                            <span className="inline-flex items-center gap-1 justify-end">
                                                                <CheckCircle2 className="w-3 h-3 md:hidden" />
                                                                <span className="hidden md:inline">✓ Facturado</span>
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Selected Project Summary + Date Inputs */}
                    {selected && (
                        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
                            <CardContent className="pt-4 space-y-4">
                                {/* Summary Row */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">Trabajo Seleccionado</p>
                                        <p className="font-bold text-sm truncate">{selected.numero} — {selected.descripcionTrabajo}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Cliente: <span className="font-medium text-foreground">{selected.cliente?.nombre}</span>
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-muted-foreground">Valor a Facturar</p>
                                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                            {formatCurrency(selected.pendiente)}
                                        </p>
                                    </div>
                                </div>

                                {/* Auto-generated Number */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ArrowRight className="h-3 w-3" />
                                    <span>N° Factura: <span className="font-mono font-bold text-foreground">{nextId}</span> (automático)</span>
                                </div>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ft-emision" className="text-xs flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Fecha de Emisión *
                                        </Label>
                                        <Input
                                            id="ft-emision"
                                            type="date"
                                            value={fechaEmision}
                                            onChange={(e) => setFechaEmision(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ft-vencimiento" className="text-xs flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Fecha de Vencimiento
                                        </Label>
                                        <Input
                                            id="ft-vencimiento"
                                            type="date"
                                            value={fechaVencimiento}
                                            onChange={(e) => setFechaVencimiento(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!canCreate}
                        className="gap-2"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Crear Factura
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

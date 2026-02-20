"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Factura, Cliente, Cotizacion } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency } from "@/lib/utils";

interface CreateFacturaDialogProps {
    onFacturaCreated: (factura: Factura) => void;
    nextId?: string;
    cotizaciones?: Cotizacion[];
}

export function CreateFacturaDialog({ onFacturaCreated, nextId, cotizaciones = [] }: CreateFacturaDialogProps) {
    const [open, setOpen] = useState(false);
    const { facturas, clientes } = useErp();
    const [clienteId, setClienteId] = useState("");
    const [selectedCotizacionId, setSelectedCotizacionId] = useState("MANUAL");
    const [numero, setNumero] = useState(nextId || "");
    const [fechaEmision, setFechaEmision] = useState("");
    const [fechaVencimiento, setFechaVencimiento] = useState("");
    const [valor, setValor] = useState("");
    const [estado, setEstado] = useState<"PENDIENTE" | "PARCIAL" | "PAGADA">("PENDIENTE");

    useEffect(() => {
        if (open) {
            setNumero("");
        }
    }, [open]);

    const handleSave = () => {
        if (!clienteId || !fechaEmision || !valor) return;

        // Validation: Check if value exceeds Cotizacion total
        if (selectedCotizacionId !== "MANUAL" && cotizaciones) {
            const quote = cotizaciones.find(c => c.id === selectedCotizacionId);
            if (quote && parseFloat(valor) > quote.total) {
                // Alarma: Si pagan más (Si se pasa el valor de la oferta)
                alert(`ALERTA DE SOBRECOSTO:\n\nEl valor ingresado ($${parseFloat(valor).toLocaleString()}) excede el total de la cotización seleccionada ($${quote.total.toLocaleString()}).\n\nPor favor verifique el valor.`);
                return;
            }
        }

        const cliente = clientes.find(c => c.id === clienteId);
        const cotizacion = cotizaciones?.find(c => c.id === selectedCotizacionId);

        const newFactura: Factura = {
            id: numero || "",
            numero: numero || undefined,
            fechaEmision: new Date(fechaEmision),
            fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : new Date(fechaEmision),
            subtotal: parseFloat(valor),
            iva: 0,
            valorFacturado: parseFloat(valor),
            valorPagado: estado === "PAGADA" ? parseFloat(valor) : 0,
            saldoPendiente: estado === "PAGADA" ? 0 : parseFloat(valor),
            estado: estado,
            cotizacionId: selectedCotizacionId !== "MANUAL" ? selectedCotizacionId : undefined,
            clienteId: clienteId,
            trabajoId: (selectedCotizacionId !== "MANUAL" && cotizacion?.trabajoId) ? cotizacion.trabajoId : undefined,
            cotizacion: cotizacion ? cotizacion : {
                id: "MANUAL",
                numero: "N/A",
                clienteId: clienteId,
                cliente: cliente as Cliente,
            } as any,
            anticipoRecibido: 0,
            retencionRenta: 0,
            retencionIca: 0,
            retencionIva: 0
        };

        onFacturaCreated(newFactura);
        setOpen(false);
        setClienteId("");
        setSelectedCotizacionId("MANUAL");
        // numero is reset by useEffect on next open
        setFechaEmision("");
        setFechaVencimiento("");
        setValor("");
        setEstado("PENDIENTE");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Factura Libre
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] mx-auto p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Crear Factura Libre</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 sm:gap-6 py-4 px-1">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="numero" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">No. Factura</Label>
                        <Input
                            id="numero"
                            value={numero}
                            readOnly
                            placeholder="Automático (Servidor)"
                            className="col-span-3 bg-muted font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="cliente" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Cliente</Label>
                        <Select value={clienteId} onValueChange={setClienteId}>
                            <SelectTrigger className="sm:col-span-3 w-full">
                                <SelectValue placeholder="Seleccione un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {clientes.length > 0 ? clientes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <span className="truncate max-w-[200px] sm:max-w-xs">{c.nombre}</span>
                                    </SelectItem>
                                )) : <SelectItem value="dev" disabled>No hay clientes registrados</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    {clienteId && cotizaciones && cotizaciones.filter(c => c.clienteId === clienteId && c.estado === 'APROBADA').length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                            <Label htmlFor="cotizacion" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Cotiz. Aprobada</Label>
                            <Select value={selectedCotizacionId} onValueChange={setSelectedCotizacionId}>
                                <SelectTrigger className="sm:col-span-3 w-full">
                                    <SelectValue placeholder="Vincular a Oferta..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANUAL">-- Sin Oferta Vinculada --</SelectItem>
                                    {cotizaciones.filter(c => c.clienteId === clienteId && c.estado === 'APROBADA').map(c => {
                                        const yaFacturado = facturas
                                            .filter(f => f.cotizacionId === c.id)
                                            .reduce((sum, f) => sum + f.valorFacturado, 0);
                                        const pendiente = Math.max(0, c.total - yaFacturado);

                                        return (
                                            <SelectItem key={c.id} value={c.id}>
                                                <div className="flex flex-col gap-0.5 max-w-[200px] sm:max-w-[400px]">
                                                    <span className="font-bold truncate" title={`${c.numero} - ${c.descripcionTrabajo}`}>{c.numero} - {c.descripcionTrabajo}</span>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                                                        Pendiente: <span className="text-orange-600 dark:text-orange-400 font-bold">{formatCurrency(pendiente)}</span>
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="emision" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Emisión</Label>
                        <Input
                            id="emision"
                            type="date"
                            value={fechaEmision}
                            onChange={(e) => setFechaEmision(e.target.value)}
                            className="sm:col-span-3 w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="vencimiento" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Vencimiento</Label>
                        <Input
                            id="vencimiento"
                            type="date"
                            value={fechaVencimiento}
                            onChange={(e) => setFechaVencimiento(e.target.value)}
                            className="sm:col-span-3 w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="valor" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Valor Total</Label>
                        <Input
                            id="valor"
                            type="number"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0"
                            className="sm:col-span-3 w-full"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                        <Label htmlFor="estado" className="text-left sm:text-right text-xs sm:text-sm text-muted-foreground">Estado</Label>
                        <Select value={estado} onValueChange={(v) => setEstado(v as any)}>
                            <SelectTrigger className="sm:col-span-3 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                <SelectItem value="PARCIAL">Parcial</SelectItem>
                                <SelectItem value="PAGADA">Pagada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Crear Factura</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

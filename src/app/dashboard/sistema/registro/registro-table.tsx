"use client";

import { useState } from "react";
import { RegistroObra, RegistroAnticipo, Cliente } from "@/types/sistema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RegistroTableProps {
    data: RegistroObra[];
}

export function RegistroTable({ data: initialData }: RegistroTableProps) {
    const [data, setData] = useState<RegistroObra[]>(initialData);
    const [selectedRegistro, setSelectedRegistro] = useState<RegistroObra | null>(null);
    const [isAnticipoModalOpen, setIsAnticipoModalOpen] = useState(false);
    const [nuevoAnticipo, setNuevoAnticipo] = useState({ monto: 0, observacion: "" });

    // Client Modal State
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientHistory, setClientHistory] = useState<RegistroObra[]>([]);

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE': return <Badge variant="secondary">Pendiente</Badge>;
            case 'EN_PROCESO': return <Badge variant="default" className="bg-blue-600">En Proceso</Badge>;
            case 'FINALIZADO': return <Badge variant="default" className="bg-green-600">Finalizado</Badge>;
            default: return <Badge variant="outline">{estado}</Badge>;
        }
    };

    const handleAddAnticipoClick = (registro: RegistroObra) => {
        setSelectedRegistro(registro);
        setNuevoAnticipo({ monto: 0, observacion: "" });
        setIsAnticipoModalOpen(true);
    };

    const handleClientClick = (cliente: Cliente) => {
        setSelectedClient(cliente);
        // Filter history for this client
        const history = data.filter(r => r.cotizacion.cliente.id === cliente.id);
        setClientHistory(history);
        setIsClientModalOpen(true);
    };

    const handleSaveAnticipo = () => {
        if (!selectedRegistro || nuevoAnticipo.monto <= 0) return;

        const newAnticipoData: RegistroAnticipo = {
            id: Math.random().toString(36).substr(2, 9),
            fecha: new Date(),
            monto: nuevoAnticipo.monto,
            observacion: nuevoAnticipo.observacion
        };

        const updatedData = data.map(reg => {
            if (reg.id === selectedRegistro.id) {
                return {
                    ...reg,
                    anticipos: [...reg.anticipos, newAnticipoData],
                    saldoPendiente: reg.saldoPendiente - newAnticipoData.monto
                };
            }
            return reg;
        });

        setData(updatedData);
        setIsAnticipoModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Trabajo / Info</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right">Anticipos</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right pr-6">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((registro) => (
                            <TableRow key={registro.id}>
                                <TableCell className="font-medium pl-6">
                                    {format(new Date(registro.cotizacion.fecha), "dd MMM yyyy", { locale: es })}
                                </TableCell>
                                <TableCell>
                                    <div
                                        className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group"
                                        onClick={() => handleClientClick(registro.cotizacion.cliente)}
                                    >
                                        <p className="font-medium text-base group-hover:text-primary transition-colors flex items-center gap-1">
                                            {registro.cotizacion.cliente.nombre}
                                            <span className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground ml-1">(Ver)</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{registro.cotizacion.cliente.telefono}</p>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="mb-1">{registro.cotizacion.numero}</Badge>
                                    <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={registro.nombreObra}>
                                        {registro.nombreObra}
                                    </p>
                                </TableCell>
                                <TableCell className="text-right font-bold font-mono">
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(registro.cotizacion.total)}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    <div className="flex flex-col items-end gap-1">
                                        {registro.anticipos.length > 0 ? (
                                            registro.anticipos.map(ant => (
                                                <Badge key={ant.id} variant="secondary" className="text-xs text-green-600 bg-green-500/10 border-green-200 hover:bg-green-100">
                                                    + {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(ant.monto)}
                                                </Badge>
                                            ))
                                        ) : <span className="text-xs text-muted-foreground">-</span>}
                                    </div>
                                </TableCell>
                                <TableCell className={cn("text-right font-medium font-mono", {
                                    "text-red-500": registro.saldoPendiente > 0,
                                    "text-green-500": registro.saldoPendiente <= 0
                                })}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(registro.saldoPendiente)}
                                </TableCell>
                                <TableCell className="text-center">
                                    {getStatusBadge(registro.estado)}
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button variant="outline" size="sm" onClick={() => handleAddAnticipoClick(registro)} className="hover:border-primary/50">
                                        <DollarSign className="mr-2 h-4 w-4 text-green-600" /> Nuevo Anticipo
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Anticipo Modal */}
            <Dialog open={isAnticipoModalOpen} onOpenChange={setIsAnticipoModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Anticipo</DialogTitle>
                        <DialogDescription>
                            Ingresa el monto recibido para la cotización {selectedRegistro?.cotizacion.numero}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="monto" className="text-right text-sm font-medium">
                                Monto
                            </label>
                            <Input
                                id="monto"
                                type="number"
                                value={nuevoAnticipo.monto}
                                onChange={(e) => setNuevoAnticipo({ ...nuevoAnticipo, monto: parseFloat(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="obs" className="text-right text-sm font-medium">
                                Detalle
                            </label>
                            <Input
                                id="obs"
                                placeholder="Ej. Transferencia Bancolombia"
                                value={nuevoAnticipo.observacion}
                                onChange={(e) => setNuevoAnticipo({ ...nuevoAnticipo, observacion: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveAnticipo}>Guardar Anticipo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Client Interaction Modal */}
            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Información del Cliente</DialogTitle>
                        <DialogDescription>
                            Detalles y historial de obras de {selectedClient?.nombre}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden mt-2">
                        <Tabs defaultValue="info" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="info">Información Personal</TabsTrigger>
                                <TabsTrigger value="history">Historial de Obras ({clientHistory.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="flex-1 overflow-auto py-4">
                                {selectedClient && (
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Nombre Completo</label>
                                                <Input defaultValue={selectedClient.nombre} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Documento</label>
                                                <Input defaultValue={selectedClient.documento} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Teléfono</label>
                                                <Input defaultValue={selectedClient.telefono} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Correo</label>
                                                <Input defaultValue={selectedClient.correo} />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <label className="text-sm font-medium">Dirección</label>
                                                <Input defaultValue={selectedClient.direccion} />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button>Guardar Cambios</Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 overflow-auto py-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Obra</TableHead>
                                            <TableHead>Cotización</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clientHistory.map((hist) => (
                                            <TableRow key={hist.id}>
                                                <TableCell>{format(new Date(hist.cotizacion.fecha), "dd/MM/yyyy")}</TableCell>
                                                <TableCell>{hist.nombreObra}</TableCell>
                                                <TableCell>{hist.cotizacion.numero}</TableCell>
                                                <TableCell className="text-right">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(hist.cotizacion.total)}
                                                </TableCell>
                                                <TableCell className="text-center">{getStatusBadge(hist.estado)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

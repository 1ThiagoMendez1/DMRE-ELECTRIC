"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateES } from "@/lib/utils";
import { RegistroObra, Anticipo } from "@/types/sistema";
import { Save, Clock, DollarSign, FileText, User, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObraDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    registro: RegistroObra | null; // Using generic type or specific if available
    onUpdate: (updatedRegistro: RegistroObra) => void;
}

export function ObraDetailDialog({ open, onOpenChange, registro, onUpdate }: ObraDetailDialogProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("info");

    // Local state for editing
    const [status, setStatus] = useState<string>(registro?.estado || 'PENDIENTE');
    const [nombreObra, setNombreObra] = useState(registro?.nombreObra || '');

    useEffect(() => {
        if (registro) {
            setNombreObra(registro.nombreObra || '');
            setStatus(registro.estado);
        }
    }, [registro]);

    // Payment Form State
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [newPaymentObs, setNewPaymentObs] = useState("");

    if (!registro) return null;

    const handleSave = () => {
        const updated = { ...registro, estado: status as any, nombreObra: nombreObra };
        onUpdate(updated);
        toast({ title: "Obra actualizada", description: "Los cambios se han guardado correctamente." });
        onOpenChange(false);
    };

    const handleAddPayment = () => {
        const amount = parseFloat(newPaymentAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Error", description: "Monto inválido", variant: "destructive" });
            return;
        }

        const newAnticipo: Anticipo = {
            id: `PAY-${Date.now()}`,
            fecha: new Date(),
            monto: amount,
            observacion: newPaymentObs || "Anticipo registrado via Detalle"
        };

        const updatedAnticipos = [newAnticipo, ...registro.anticipos];
        const newSaldo = registro.valorTotal - updatedAnticipos.reduce((sum, a) => sum + a.monto, 0);

        const updatedRegistro = {
            ...registro,
            anticipos: updatedAnticipos,
            saldoPendiente: newSaldo
        };

        onUpdate(updatedRegistro);
        toast({ title: "Pago Registrado", description: `Se ha registrado el pago de ${formatCurrency(amount)}` });

        // Reset form
        setShowPaymentForm(false);
        setNewPaymentAmount("");
        setNewPaymentObs("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Detalle de Obra: {registro.cotizacion.numero}
                    </DialogTitle>
                    <DialogDescription>
                        Gestión completa del proyecto y su estado.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="info">Información General</TabsTrigger>
                        <TabsTrigger value="historial">Historial de Cambios</TabsTrigger>
                        <TabsTrigger value="pagos">Pagos y Anticipos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="flex-1 overflow-auto py-4 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nombre de la Obra</Label>
                                    <Input value={nombreObra} onChange={(e) => setNombreObra(e.target.value)} />
                                </div>

                                {/* Client Card - Unified View */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <User className="h-4 w-4" /> Información del Cliente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <p className="font-bold">{registro.cotizacion.cliente.nombre}</p>
                                        <p className="text-muted-foreground">{registro.cotizacion.cliente.documento}</p>
                                        <p>{registro.cotizacion.cliente.correo}</p>
                                        <p>{registro.cotizacion.cliente.telefono}</p>
                                    </CardContent>
                                </Card>

                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <Input value={formatDateES(registro.fechaInicio)} disabled className="bg-muted" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Estado Actual</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                            <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                                            <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor Total Contrato</Label>
                                    <div className="text-2xl font-bold font-mono text-primary">
                                        {formatCurrency(registro.valorTotal)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción del Trabajo (Cotización)</Label>
                            <div className="p-3 bg-muted rounded-md text-sm">
                                {registro.cotizacion.descripcionTrabajo}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="historial" className="flex-1 overflow-auto py-4">
                        <div className="flex flex-col gap-4">
                            {/* Mock History - In real app, fetch from backend */}
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-card text-sm">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Obra Iniciada</p>
                                    <p className="text-muted-foreground">El proyecto cambió a estado EN_PROCESO</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDateES(registro.fechaInicio)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-card text-sm opacity-60">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Creación de Registro</p>
                                    <p className="text-muted-foreground">Generado automáticamente desde Cotización {registro.cotizacion.numero}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatDateES(registro.cotizacion.fecha)}</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="pagos" className="flex-1 overflow-auto py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Total Recibido</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(registro.valorTotal - registro.saldoPendiente)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        {formatCurrency(registro.saldoPendiente)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Historial de Pagos</h3>
                            {!showPaymentForm && (
                                <Button size="sm" onClick={() => setShowPaymentForm(true)} disabled={registro.saldoPendiente <= 0}>
                                    <Plus className="mr-2 h-4 w-4" /> Registrar Pago
                                </Button>
                            )}
                        </div>

                        {showPaymentForm && (
                            <Card className="border-primary bg-primary/5">
                                <CardContent className="p-4 space-y-4">
                                    <h4 className="font-medium text-sm">Nuevo Abono</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Monto a Abonar</Label>
                                            <Input
                                                type="number"
                                                value={newPaymentAmount}
                                                onChange={(e) => setNewPaymentAmount(e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Observación</Label>
                                            <Input
                                                value={newPaymentObs}
                                                onChange={(e) => setNewPaymentObs(e.target.value)}
                                                placeholder="Ej. Transferencia..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleAddPayment}>Guardar Abono</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {registro.anticipos && registro.anticipos.length > 0 ? (
                                        registro.anticipos.map((ant: any) => (
                                            <TableRow key={ant.id}>
                                                <TableCell>{formatDateES(ant.fecha)}</TableCell>
                                                <TableCell>{ant.observacion || 'Anticipo / Abono'}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(ant.monto)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No hay pagos registrados</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    FileText,
    DollarSign,
    Plus,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    TrendingDown,
    CreditCard,
    Receipt,
    History,
    Banknote,
    Calendar,
    Wallet
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { registrarPagoFacturaAction } from "@/app/dashboard/sistema/financiera/actions";
import { useErp } from "@/components/providers/erp-provider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Factura, EstadoFactura, CuentaBancaria } from "@/types/sistema";

interface MovimientoFactura {
    id: string;
    fecha: Date;
    tipo: 'ABONO' | 'ADELANTO' | 'DESCUENTO' | 'RETENCION' | 'ESTADO_CAMBIO' | 'NOTA' | 'FECHA_CAMBIO';
    descripcion: string;
    valor?: number;
    usuario: string;
    estadoAnterior?: EstadoFactura;
    estadoNuevo?: EstadoFactura;
}

interface FacturaHistoryDialogProps {
    factura: Factura;
    onFacturaUpdated: (updated: Factura) => void;
    cuentas: CuentaBancaria[];
    trigger?: React.ReactNode;
}

const getEstadoBadge = (estado: EstadoFactura) => {
    switch (estado) {
        case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'PARCIAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'PAGADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        default: return '';
    }
};

export function FacturaHistoryDialog({ factura, onFacturaUpdated, cuentas, trigger }: FacturaHistoryDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("acciones");
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [abonoMonto, setAbonoMonto] = useState<string>("");
    const [abonoConcepto, setAbonoConcepto] = useState("");
    const [selectedCuenta, setSelectedCuenta] = useState<string>("");

    const [adelantoMonto, setAdelantoMonto] = useState<string>("");
    const [nuevoEstado, setNuevoEstado] = useState<EstadoFactura>(factura.estado);
    const [fechaVencimiento, setFechaVencimiento] = useState<string>(
        format(new Date(factura.fechaVencimiento), "yyyy-MM-dd")
    );
    const [nota, setNota] = useState("");

    // Track local saldo
    const [saldoPendiente, setSaldoPendiente] = useState(factura.saldoPendiente);
    const [anticipoTotal, setAnticipoTotal] = useState(factura.anticipoRecibido);

    useEffect(() => {
        setSaldoPendiente(factura.saldoPendiente);
        setAnticipoTotal(factura.anticipoRecibido);
        setNuevoEstado(factura.estado);
        setFechaVencimiento(format(new Date(factura.fechaVencimiento), "yyyy-MM-dd"));
        setAbonoMonto("");
        setAdelantoMonto("");
    }, [factura]);

    // Movimientos history (Mock for now, would replace with real fetch if implementing full audit log)
    const { movimientosFinancieros, refreshData } = useErp();

    const movimientos = useMemo(() => {
        const creationEvent: MovimientoFactura = {
            id: 'creation',
            fecha: new Date(factura.fechaEmision),
            tipo: 'NOTA',
            descripcion: 'Factura emitida',
            usuario: 'Sistema',
        };

        const filtered = movimientosFinancieros
            .filter(m => m.facturaId === factura.id)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .map(m => ({
                id: m.id,
                fecha: new Date(m.fecha),
                tipo: m.tipo === 'INGRESO' ? 'ABONO' : 'NOTA',
                descripcion: m.descripcion || m.concepto || 'Abono Recibido',
                valor: m.valor,
                usuario: m.registradoPor || 'Tercero',
            } as MovimientoFactura));

        return [creationEvent, ...filtered];
    }, [movimientosFinancieros, factura.id, factura.fechaEmision]);

    // Progress calculation
    const porcentajePagado = useMemo(() => {
        const pagado = factura.valorFacturado - saldoPendiente;
        return Math.round((pagado / factura.valorFacturado) * 100);
    }, [factura.valorFacturado, saldoPendiente]);

    const handleRegistrarAbono = async () => {
        const monto = parseFloat(abonoMonto);
        if (isNaN(monto) || monto <= 0) return;
        if (!selectedCuenta) {
            toast({ variant: "destructive", title: "Cuenta requerida", description: "Seleccione una cuenta bancaria o caja para recibir el dinero." });
            return;
        }

        if (monto > saldoPendiente) {
            toast({
                variant: "destructive",
                title: "Error en Abono",
                description: `El monto ingresado ($${formatCurrency(monto)}) supera el saldo pendiente ($${formatCurrency(saldoPendiente)}).`
            });
            return;
        }

        setIsLoading(true);
        try {
            // CALL SERVER ACTION
            const updatedFactura = await registrarPagoFacturaAction(
                factura.id,
                monto,
                new Date(),
                selectedCuenta,
                abonoConcepto || `Abono a factura ${factura.numero || factura.id}`
            );

            onFacturaUpdated(updatedFactura);
            setAbonoMonto("");
            setAbonoConcepto("");

            // Importante: Refrescar los datos globales para que aparezca en el historial
            await refreshData();

            toast({ title: "Pago Registrado", description: "El dinero ha ingresado a la cuenta seleccionada." });

        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error.message || "No se pudo registrar el pago." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistrarAdelanto = () => {
        const monto = parseFloat(adelantoMonto);
        if (isNaN(monto) || monto <= 0) return;

        if (monto > saldoPendiente) {
            toast({ variant: "destructive", title: "Error", description: "El monto supera el saldo." });
            return;
        }

        const nuevoAnticipo = anticipoTotal + monto;
        const nuevoSaldo = Math.max(0, saldoPendiente - monto);
        setAnticipoTotal(nuevoAnticipo);
        setSaldoPendiente(nuevoSaldo);

        const entry: MovimientoFactura = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'ADELANTO',
            descripcion: 'Adelanto registrado',
            valor: monto,
            usuario: 'Usuario Actual',
        };

        // setMovimientos([entry, ...movimientos]); // Removed mock update
        setAdelantoMonto("");

        onFacturaUpdated({
            ...factura,
            anticipoRecibido: nuevoAnticipo,
            saldoPendiente: nuevoSaldo,
            estado: nuevoSaldo === 0 ? 'PAGADA' : 'PARCIAL'
        });
    };

    const handleCambiarEstado = () => {
        if (nuevoEstado === factura.estado) return;

        const entry: MovimientoFactura = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'ESTADO_CAMBIO',
            descripcion: `Estado cambiado de ${factura.estado} a ${nuevoEstado}`,
            usuario: 'Usuario Actual',
            estadoAnterior: factura.estado,
            estadoNuevo: nuevoEstado,
        };

        // setMovimientos([entry, ...movimientos]); // Removed after switching to ERP context derivation

        onFacturaUpdated({
            ...factura,
            estado: nuevoEstado
        });
    };

    const handleActualizarFecha = () => {
        const currentDateStr = format(new Date(factura.fechaVencimiento), "yyyy-MM-dd");
        if (fechaVencimiento === currentDateStr) return;

        const nuevaFecha = new Date(fechaVencimiento + 'T12:00:00');
        const entry: MovimientoFactura = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'FECHA_CAMBIO',
            descripcion: `Fecha vencimiento cambiada a ${format(nuevaFecha, "dd/MM/yyyy")}`,
            usuario: 'Usuario Actual',
        };

        // setMovimientos([entry, ...movimientos]); // Removed mock update
        toast({ title: "Fecha Actualizada", description: "La fecha de vencimiento ha sido modificada." });

        onFacturaUpdated({
            ...factura,
            fechaVencimiento: nuevaFecha
        });
    };

    const handleAgregarNota = () => {
        if (!nota.trim()) return;
        const entry: MovimientoFactura = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'NOTA',
            descripcion: nota,
            usuario: 'Usuario Actual',
        };
        // setMovimientos([entry, ...movimientos]); // Removed mock update
        setNota("");
    };

    const getMovimientoIcon = (tipo: MovimientoFactura['tipo']) => {
        switch (tipo) {
            case 'ABONO': return <DollarSign className="h-4 w-4 text-green-500" />;
            case 'ADELANTO': return <Banknote className="h-4 w-4 text-blue-500" />;
            case 'DESCUENTO': return <TrendingDown className="h-4 w-4 text-orange-500" />;
            case 'RETENCION': return <CreditCard className="h-4 w-4 text-red-500" />;
            case 'ESTADO_CAMBIO': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
            case 'FECHA_CAMBIO': return <Calendar className="h-4 w-4 text-blue-600" />;
            case 'NOTA': return <FileText className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <span className="cursor-pointer hover:underline text-primary font-medium">
                        {factura.cotizacion.cliente.nombre}
                    </span>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Factura {factura.numero || factura.id}
                    </DialogTitle>
                    <DialogDescription>
                        {factura.cotizacion.cliente.nombre} - {formatCurrency(factura.valorFacturado)}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="acciones">Acciones</TabsTrigger>
                        <TabsTrigger value="detalles">Detalles Completos</TabsTrigger>
                        <TabsTrigger value="historial">Historial</TabsTrigger>
                    </TabsList>

                    {/* DETALLES TAB */}
                    <TabsContent value="detalles" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Client Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <User className="h-4 w-4" /> Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-semibold">{factura.cotizacion.cliente.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{factura.cotizacion.cliente.documento}</p>
                                    <p className="text-xs text-muted-foreground">{factura.cotizacion.cliente.telefono}</p>
                                </CardContent>
                            </Card>

                            {/* Values */}
                            <Card className="col-span-2">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Desglose de Valores</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-mono">{formatCurrency(factura.subtotal || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IVA:</span>
                                            <span className="font-mono">{formatCurrency(factura.iva || 0)}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                                            <span>Total Facturado:</span>
                                            <span>{formatCurrency(factura.valorFacturado)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pagado:</span>
                                            <span className="font-mono text-green-600">{formatCurrency(factura.valorPagado || (factura.valorFacturado - factura.saldoPendiente))}</span>
                                        </div>
                                        <div className="flex justify-between mt-2 pt-2 border-t font-bold text-lg">
                                            <span className="text-red-500">Pendiente:</span>
                                            <span className="text-red-500">{formatCurrency(saldoPendiente)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ACCIONES TAB */}
                    <TabsContent value="acciones" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Registrar Abono */}
                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-600" /> Registrar Pago / Abono
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold block mb-1">Cuenta Destino</label>
                                        <Select value={selectedCuenta} onValueChange={setSelectedCuenta}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Caja o Banco" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cuentas.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nombre} - {formatCurrency(c.saldoActual)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground mt-1">El dinero ingresará a esta cuenta.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Monto</label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={abonoMonto}
                                                onChange={(e) => setAbonoMonto(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Concepto</label>
                                            <Input
                                                placeholder="Transferencia..."
                                                value={abonoConcepto}
                                                onChange={(e) => setAbonoConcepto(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleRegistrarAbono}
                                        disabled={!abonoMonto || parseFloat(abonoMonto) <= 0 || !selectedCuenta || isLoading}
                                    >
                                        {isLoading ? "Procesando Ingreso..." : "Confirmar Ingreso de Dinero"}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Actions Right Column */}
                            <div className="space-y-4">
                                {/* Cambiar Estado */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" /> Estado Manual
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoFactura)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                                        <SelectItem value="PARCIAL">Parcial</SelectItem>
                                                        <SelectItem value="PAGADA">Pagada</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button variant="secondary" onClick={handleCambiarEstado} disabled={nuevoEstado === factura.estado}>
                                                Actualizar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Agregar Nota */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Nota Interna</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Nota rápida..."
                                                value={nota}
                                                onChange={(e) => setNota(e.target.value)}
                                            />
                                            <Button size="icon" variant="ghost" onClick={handleAgregarNota} disabled={!nota.trim()}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* HISTORIAL TAB */}
                    <TabsContent value="historial" className="flex-1 overflow-auto mt-4">
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {movimientos.map((mov) => (
                                    <div key={mov.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                                        <div className="mt-0.5">
                                            {getMovimientoIcon(mov.tipo)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-sm">{mov.descripcion}</span>
                                                {mov.valor && (
                                                    <span className={`font-mono font-bold ${mov.tipo === 'ABONO' || mov.tipo === 'ADELANTO' ? 'text-green-600' : 'text-orange-600'}`}>
                                                        +{formatCurrency(mov.valor)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {format(mov.fecha, "dd MMM yyyy HH:mm", { locale: es })}
                                                <span>•</span>
                                                <User className="h-3 w-3" />
                                                {mov.usuario}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

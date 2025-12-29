"use client";

import { useState, useMemo } from "react";
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
    Banknote
} from "lucide-react";

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
import { Factura, EstadoFactura } from "@/types/sistema";

interface MovimientoFactura {
    id: string;
    fecha: Date;
    tipo: 'ABONO' | 'ADELANTO' | 'DESCUENTO' | 'RETENCION' | 'ESTADO_CAMBIO' | 'NOTA';
    descripcion: string;
    valor?: number;
    usuario: string;
    estadoAnterior?: EstadoFactura;
    estadoNuevo?: EstadoFactura;
}

interface FacturaHistoryDialogProps {
    factura: Factura;
    onFacturaUpdated: (updated: Factura) => void;
    trigger?: React.ReactNode;
}

const getEstadoBadge = (estado: EstadoFactura) => {
    switch (estado) {
        case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'PARCIAL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'CANCELADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        default: return '';
    }
};

export function FacturaHistoryDialog({ factura, onFacturaUpdated, trigger }: FacturaHistoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("detalles");

    // Form states
    const [abonoMonto, setAbonoMonto] = useState<string>("");
    const [abonoConcepto, setAbonoConcepto] = useState("");
    const [adelantoMonto, setAdelantoMonto] = useState<string>("");
    const [nuevoEstado, setNuevoEstado] = useState<EstadoFactura>(factura.estado);
    const [nota, setNota] = useState("");

    // Track local saldo
    const [saldoPendiente, setSaldoPendiente] = useState(factura.saldoPendiente);
    const [anticipoTotal, setAnticipoTotal] = useState(factura.anticipoRecibido);

    // Movimientos history
    const [movimientos, setMovimientos] = useState<MovimientoFactura[]>([
        {
            id: '1',
            fecha: factura.fechaEmision,
            tipo: 'NOTA',
            descripcion: 'Factura emitida',
            usuario: 'Sistema',
        },
        ...(factura.anticipoRecibido > 0 ? [{
            id: '2',
            fecha: new Date(new Date(factura.fechaEmision).getTime() + 86400000),
            tipo: 'ADELANTO' as const,
            descripcion: 'Anticipo recibido',
            valor: factura.anticipoRecibido,
            usuario: 'Admin',
        }] : []),
    ]);

    // Progress calculation
    const porcentajePagado = useMemo(() => {
        const pagado = factura.valorFacturado - saldoPendiente;
        return Math.round((pagado / factura.valorFacturado) * 100);
    }, [factura.valorFacturado, saldoPendiente]);

    const handleRegistrarAbono = () => {
        const monto = parseFloat(abonoMonto);
        if (isNaN(monto) || monto <= 0) return;

        const nuevoSaldo = Math.max(0, saldoPendiente - monto);
        setSaldoPendiente(nuevoSaldo);

        const entry: MovimientoFactura = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'ABONO',
            descripcion: abonoConcepto || 'Abono recibido',
            valor: monto,
            usuario: 'Usuario Actual',
        };

        setMovimientos([entry, ...movimientos]);
        setAbonoMonto("");
        setAbonoConcepto("");

        // Update estado if fully paid
        if (nuevoSaldo === 0) {
            setNuevoEstado('CANCELADA');
            const estadoEntry: MovimientoFactura = {
                id: Date.now().toString() + '-estado',
                fecha: new Date(),
                tipo: 'ESTADO_CAMBIO',
                descripcion: 'Estado actualizado automáticamente por pago completo',
                usuario: 'Sistema',
                estadoAnterior: factura.estado,
                estadoNuevo: 'CANCELADA',
            };
            setMovimientos(m => [estadoEntry, ...m]);
        } else if (nuevoSaldo < factura.valorFacturado && factura.estado === 'PENDIENTE') {
            setNuevoEstado('PARCIAL');
        }

        // Update factura
        onFacturaUpdated({
            ...factura,
            saldoPendiente: nuevoSaldo,
            estado: nuevoSaldo === 0 ? 'CANCELADA' : (nuevoSaldo < factura.valorFacturado ? 'PARCIAL' : factura.estado)
        });
    };

    const handleRegistrarAdelanto = () => {
        const monto = parseFloat(adelantoMonto);
        if (isNaN(monto) || monto <= 0) return;

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

        setMovimientos([entry, ...movimientos]);
        setAdelantoMonto("");

        onFacturaUpdated({
            ...factura,
            anticipoRecibido: nuevoAnticipo,
            saldoPendiente: nuevoSaldo,
            estado: nuevoSaldo === 0 ? 'CANCELADA' : 'PARCIAL'
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

        setMovimientos([entry, ...movimientos]);

        onFacturaUpdated({
            ...factura,
            estado: nuevoEstado
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

        setMovimientos([entry, ...movimientos]);
        setNota("");
    };

    const getMovimientoIcon = (tipo: MovimientoFactura['tipo']) => {
        switch (tipo) {
            case 'ABONO': return <DollarSign className="h-4 w-4 text-green-500" />;
            case 'ADELANTO': return <Banknote className="h-4 w-4 text-blue-500" />;
            case 'DESCUENTO': return <TrendingDown className="h-4 w-4 text-orange-500" />;
            case 'RETENCION': return <CreditCard className="h-4 w-4 text-red-500" />;
            case 'ESTADO_CAMBIO': return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
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
                        Factura {factura.id} - {factura.cotizacion.cliente.nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Gestión de cobro, abonos, adelantos y seguimiento de pagos
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="detalles">Detalles</TabsTrigger>
                        <TabsTrigger value="acciones">Acciones</TabsTrigger>
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
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Ref: {factura.cotizacion.numero}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Invoice Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Receipt className="h-4 w-4" /> Factura
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Emisión:</span>
                                        <span>{format(factura.fechaEmision, "dd/MM/yyyy", { locale: es })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Vencimiento:</span>
                                        <span>{format(factura.fechaVencimiento, "dd/MM/yyyy", { locale: es })}</span>
                                    </div>
                                    <Badge className={getEstadoBadge(nuevoEstado)}>{nuevoEstado}</Badge>
                                </CardContent>
                            </Card>

                            {/* Values */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Valores</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Facturado:</span>
                                        <span className="font-mono">{formatCurrency(factura.valorFacturado)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Anticipos:</span>
                                        <span className="font-mono text-blue-600">{formatCurrency(anticipoTotal)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold">
                                        <span>Saldo:</span>
                                        <span className={`font-mono ${saldoPendiente > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            {formatCurrency(saldoPendiente)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Progreso de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Progress value={porcentajePagado} className="flex-1 h-4" />
                                    <span className="text-xl font-bold text-primary w-16 text-right">{porcentajePagado}%</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>Pagado: {formatCurrency(factura.valorFacturado - saldoPendiente)}</span>
                                    <span>Pendiente: {formatCurrency(saldoPendiente)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Retenciones */}
                        {(factura.retencionRenta > 0 || factura.retencionIca > 0 || factura.retencionIva > 0) && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Retenciones Aplicadas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Renta:</span>
                                            <span className="font-mono">{formatCurrency(factura.retencionRenta)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">ICA:</span>
                                            <span className="font-mono">{formatCurrency(factura.retencionIca)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IVA:</span>
                                            <span className="font-mono">{formatCurrency(factura.retencionIva)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ACCIONES TAB */}
                    <TabsContent value="acciones" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Registrar Abono */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-600" /> Registrar Abono
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
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
                                        <label className="text-xs text-muted-foreground">Concepto (opcional)</label>
                                        <Input
                                            placeholder="Transferencia, Cheque, etc."
                                            value={abonoConcepto}
                                            onChange={(e) => setAbonoConcepto(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleRegistrarAbono}
                                        disabled={!abonoMonto || parseFloat(abonoMonto) <= 0}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Registrar Abono
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Registrar Adelanto */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Banknote className="h-4 w-4 text-blue-600" /> Registrar Adelanto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Monto del Adelanto</label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={adelantoMonto}
                                            onChange={(e) => setAdelantoMonto(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Anticipo actual: {formatCurrency(anticipoTotal)}
                                    </p>
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={handleRegistrarAdelanto}
                                        disabled={!adelantoMonto || parseFloat(adelantoMonto) <= 0}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Registrar Adelanto
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cambiar Estado */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Cambiar Estado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs text-muted-foreground">Nuevo Estado</label>
                                        <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoFactura)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                                <SelectItem value="PARCIAL">Parcial</SelectItem>
                                                <SelectItem value="CANCELADA">Cancelada (Pagada)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleCambiarEstado} disabled={nuevoEstado === factura.estado}>
                                        Actualizar Estado
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Agregar Nota */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Agregar Nota</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Escribe una nota sobre esta factura..."
                                        value={nota}
                                        onChange={(e) => setNota(e.target.value)}
                                        className="min-h-[60px]"
                                    />
                                    <Button onClick={handleAgregarNota} disabled={!nota.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
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
                                            {mov.estadoAnterior && mov.estadoNuevo && (
                                                <div className="flex gap-2 mb-1">
                                                    <Badge variant="outline" className="text-xs">{mov.estadoAnterior}</Badge>
                                                    <span className="text-xs text-muted-foreground">→</span>
                                                    <Badge className={getEstadoBadge(mov.estadoNuevo)} >{mov.estadoNuevo}</Badge>
                                                </div>
                                            )}
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

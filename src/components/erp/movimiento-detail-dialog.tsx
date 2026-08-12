"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Eye, FileText, ExternalLink, Download } from "lucide-react";
import { generateReceipt } from "@/lib/pdf-generator";

interface MovimientoDetailDialogProps {
    movimiento: MovimientoFinanciero;
    movimientos?: MovimientoFinanciero[];
    onMovimientoUpdated: (mov: MovimientoFinanciero) => void;
    trigger?: React.ReactNode;
}

export function MovimientoDetailDialog({ movimiento, movimientos = [], onMovimientoUpdated, trigger }: MovimientoDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [concepto, setConcepto] = useState(movimiento.concepto);
    const [tercero, setTercero] = useState(movimiento.tercero);
    const [valor, setValor] = useState(movimiento.valor.toString());
    const [fecha, setFecha] = useState(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : ""); // YYYY-MM-DD
    const [categoria, setCategoria] = useState<CategoriaMovimiento>(movimiento.categoria);
    const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo);

    useEffect(() => {
        if (open) {
            setConcepto(movimiento.concepto);
            setTercero(movimiento.tercero);
            setValor(movimiento.valor.toString());
            setFecha(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : "");
            setCategoria(movimiento.categoria);
            setTipo(movimiento.tipo);
            setIsEditing(false);
        }
    }, [open, movimiento]);

    const handleSave = () => {
        const updatedMovimiento: MovimientoFinanciero = {
            ...movimiento,
            concepto,
            tercero,
            valor: parseFloat(valor) || 0,
            fecha: new Date(fecha),
            categoria,
            tipo,
            // Account info remains same for now unless we add account selector
        };

        onMovimientoUpdated(updatedMovimiento);
        setIsEditing(false);
        // Don't close, just exit edit mode
    };

    const generateConsecutive = (tipo: string, fechaVal?: string | Date) => {
        const dateObj = typeof fechaVal === 'string' ? new Date(fechaVal + "T12:00:00") : fechaVal ? new Date(fechaVal) : new Date();
        const year = dateObj.getFullYear();
        const yearSuffix = year.toString().slice(-2);
        
        const sorted = [...movimientos].filter(m => m.tipo === tipo && new Date(m.fecha).getFullYear() === year).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const index = sorted.findIndex(m => m.id === movimiento.id);
        const count = index !== -1 ? index + 1 : sorted.length + 1;
        
        const prefix = tipo === "INGRESO" ? "ING" : tipo === "EGRESO" ? "EGR" : "TRF";
        return `${prefix}${yearSuffix}-${count.toString().padStart(3, '0')}`;
    };

    const handlePreviewReceipt = async () => {
        const receiptData = {
            id: generateConsecutive(movimiento.tipo, movimiento.fecha),
            tipo: movimiento.tipo,
            fecha: new Date(movimiento.fecha).toLocaleDateString(),
            tercero: movimiento.tercero,
            identificacion: movimiento.identificacion,
            categoria: movimiento.categoria,
            cuentaNombre: movimiento.cuenta?.nombre,
            concepto: movimiento.concepto,
            valor: movimiento.valor
        };
        const url = await generateReceipt(receiptData, true);
        if (typeof url === 'string') {
            window.open(url, '_blank');
        }
    };

    const handleDownloadReceipt = async () => {
        const receiptData = {
            id: generateConsecutive(movimiento.tipo, movimiento.fecha),
            tipo: movimiento.tipo,
            fecha: new Date(movimiento.fecha).toLocaleDateString(),
            tercero: movimiento.tercero,
            identificacion: movimiento.identificacion,
            categoria: movimiento.categoria,
            cuentaNombre: movimiento.cuenta?.nombre,
            concepto: movimiento.concepto,
            valor: movimiento.valor
        };
        await generateReceipt(receiptData, false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" title="Ver Detalle">
                        <Eye className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalle de Movimiento</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Edite los campos necesarios." : "Información completa de la transacción."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="fecha" className="text-right">Fecha</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right">Tipo</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="col-span-1 md:col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INGRESO">Ingreso</SelectItem>
                                <SelectItem value="EGRESO">Egreso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="categoria" className="text-right">Categoría</Label>
                        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="col-span-1 md:col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NOMINA">Nómina</SelectItem>
                                <SelectItem value="PROVEEDORES">Proveedores</SelectItem>
                                <SelectItem value="SUMINISTRO">Suministro</SelectItem>
                                <SelectItem value="INSTALACION">Instalación</SelectItem>
                                <SelectItem value="SERVICIOS">Servicios</SelectItem>
                                <SelectItem value="IMPUESTOS">Impuestos</SelectItem>
                                <SelectItem value="VENTAS">Ventas</SelectItem>
                                <SelectItem value="OTROS">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="concepto" className="text-right">Concepto</Label>
                        <Input
                            id="concepto"
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="tercero" className="text-right">Tercero</Label>
                        <Input
                            id="tercero"
                            value={tercero}
                            onChange={(e) => setTercero(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="valor" className="text-right">Valor</Label>
                        <Input
                            id="valor"
                            type="number"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-1 md:col-span-3 font-mono font-bold"
                        />
                    </div>

                    {!isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                            <Label className="text-right">Cuenta</Label>
                            <div className="col-span-1 md:col-span-3 text-sm font-medium border p-2 rounded-md bg-muted/50">
                                {movimiento.cuenta.nombre} ({movimiento.cuenta.tipo})
                            </div>
                        </div>
                    )}

                    {movimiento.comprobanteUrl && (
                        <Card className="col-span-1 md:col-span-4 mt-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Soporte Adjunto
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border">
                                        <span className="text-sm font-medium truncate">
                                            Soporte en formato PDF
                                        </span>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={movimiento.comprobanteUrl} target="_blank" rel="noopener noreferrer">
                                                Abrir PDF
                                            </a>
                                        </Button>
                                    </div>
                                    <iframe 
                                        src={movimiento.comprobanteUrl} 
                                        className="w-full h-64 border rounded-md" 
                                        title="Vista previa del soporte"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Guardar Cambios</Button>
                        </>
                    ) : (
                        <div className="flex justify-end w-full gap-2">
                            {movimiento.tipo === 'INGRESO' && (
                                <div className="flex gap-2 mr-auto">
                                    <Button variant="outline" onClick={handlePreviewReceipt} className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        <Eye className="mr-2 h-4 w-4" /> Vista Previa
                                    </Button>
                                    <Button variant="secondary" onClick={handleDownloadReceipt} className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                                        <Download className="mr-2 h-4 w-4" /> Descargar
                                    </Button>
                                </div>
                            )}
                            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
                            <Button onClick={() => setIsEditing(true)}>
                                <Pencil className="mr-2 h-4 w-4" /> Editar
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

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
import { Pencil, Eye, FileText, ExternalLink, Download, Upload, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { generateReceipt } from "@/lib/pdf-generator";

interface MovimientoDetailDialogProps {
    movimiento: MovimientoFinanciero;
    movimientos?: MovimientoFinanciero[];
    onMovimientoUpdated: (mov: MovimientoFinanciero) => Promise<void> | void;
    trigger?: React.ReactNode;
}

export function MovimientoDetailDialog({ movimiento, movimientos = [], onMovimientoUpdated, trigger }: MovimientoDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [comprobanteUrl, setComprobanteUrl] = useState(movimiento.comprobanteUrl || "");
    const [isUploading, setIsUploading] = useState(false);

    // Form states
    const [concepto, setConcepto] = useState(movimiento.concepto);
    const [tercero, setTercero] = useState(movimiento.tercero);
    const [identificacion, setIdentificacion] = useState(movimiento.identificacion || "");
    const [valor, setValor] = useState(movimiento.valor.toString());
    const [iva, setIva] = useState(movimiento.iva !== undefined ? movimiento.iva.toString() : "0");
    const [fecha, setFecha] = useState(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : ""); // YYYY-MM-DD
    const [categoria, setCategoria] = useState<CategoriaMovimiento>(movimiento.categoria);
    const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo);

    useEffect(() => {
        if (open) {
            setConcepto(movimiento.concepto);
            setComprobanteUrl(movimiento.comprobanteUrl || "");
            setTercero(movimiento.tercero);
            setIdentificacion(movimiento.identificacion || "");
            setValor(movimiento.valor.toString());
            setIva(movimiento.iva !== undefined ? movimiento.iva.toString() : "0");
            setFecha(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : "");
            setCategoria(movimiento.categoria);
            setTipo(movimiento.tipo);
            setIsEditing(false);
        }
    }, [open, movimiento]);

    const handleUploadSupport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            alert("Formatos permitidos: PDF, JPG, PNG y WEBP.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert("El soporte no debe superar 10 MB.");
            return;
        }
        setIsUploading(true);
        try {
            const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
            const path = `comprobantes/${movimiento.id}-${Date.now()}.${extension}`;
            const supabase = createClient();
            const { error } = await supabase.storage.from("imagenes").upload(path, file);
            if (error) throw error;
            const { data } = supabase.storage.from("imagenes").getPublicUrl(path);
            setComprobanteUrl(data.publicUrl);
        } catch (error) {
            console.error("Error actualizando soporte", error);
            alert("No se pudo subir el soporte. Verifique los permisos.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        const updatedMovimiento: MovimientoFinanciero = {
            ...movimiento,
            concepto,
            tercero,
            identificacion,
            valor: parseFloat(valor) || 0,
            iva: parseFloat(iva) || 0,
            fecha: fecha ? new Date(fecha + "T12:00:00") : movimiento.fecha,
            categoria,
            tipo,
            comprobanteUrl,
        };

        try {
            await onMovimientoUpdated(updatedMovimiento);
            setIsEditing(false);
        } catch (error) {
            console.error("Save failed in dialog:", error);
        }
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="fecha" className="text-xs font-semibold text-muted-foreground">Fecha</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={!isEditing}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="tipo" className="text-xs font-semibold text-muted-foreground">Tipo</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INGRESO">Ingreso</SelectItem>
                                <SelectItem value="EGRESO">Egreso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="categoria" className="text-xs font-semibold text-muted-foreground">Categoría</Label>
                        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="w-full">
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

                    <div className="space-y-1.5">
                        <Label htmlFor="tercero" className="text-xs font-semibold text-muted-foreground">Tercero</Label>
                        <Input
                            id="tercero"
                            value={tercero}
                            onChange={(e) => setTercero(e.target.value)}
                            disabled={!isEditing}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="identificacion" className="text-xs font-semibold text-muted-foreground">NIT / Identificación</Label>
                        <Input
                            id="identificacion"
                            value={identificacion}
                            onChange={(e) => setIdentificacion(e.target.value)}
                            disabled={!isEditing}
                            placeholder="NIT o Documento"
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="valor" className="text-xs font-semibold text-muted-foreground">Valor</Label>
                        <Input
                            id="valor"
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            disabled={!isEditing}
                            className="w-full font-mono font-bold"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="iva" className="text-xs font-semibold text-muted-foreground">IVA</Label>
                            {isEditing && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentVal = parseFloat(valor) || 0;
                                            setIva(Math.round(currentVal * 0.19).toString());
                                        }}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                                        title="Calcular 19%"
                                    >
                                        19%
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIva("0")}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-colors"
                                        title="Sin IVA"
                                    >
                                        0%
                                    </button>
                                </div>
                            )}
                        </div>
                        <Input
                            id="iva"
                            type="number"
                            step="0.01"
                            value={iva}
                            onChange={(e) => setIva(e.target.value)}
                            disabled={!isEditing}
                            className="w-full font-mono"
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground">Cuenta</Label>
                            <div className="text-sm font-medium border px-3 py-2 rounded-md bg-muted/50 truncate h-10 flex items-center">
                                {movimiento.cuenta?.nombre || "Sin cuenta"} {movimiento.cuenta?.tipo ? `(${movimiento.cuenta.tipo})` : ""}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5 col-span-1 sm:col-span-2 md:col-span-3">
                        <Label htmlFor="concepto" className="text-xs font-semibold text-muted-foreground">Concepto</Label>
                        <Input
                            id="concepto"
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            disabled={!isEditing}
                            className="w-full"
                        />
                    </div>

                    <div className="col-span-1 sm:col-span-2 md:col-span-3 space-y-3 mt-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Soporte adjunto</Label>
                            {isEditing && comprobanteUrl && (
                                <Button type="button" size="sm" variant="ghost" onClick={() => setComprobanteUrl("")}>
                                    Quitar soporte
                                </Button>
                            )}
                        </div>
                        {comprobanteUrl && (
                            <Card>
                                <CardContent className="p-3 space-y-2">
                                    <a href={comprobanteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline inline-flex gap-2 items-center">
                                        <ExternalLink className="h-4 w-4" /> Abrir documento
                                    </a>
                                    {/\\.(png|jpe?g|webp)(\\?|$)/i.test(comprobanteUrl) ? (
                                        <img src={comprobanteUrl} alt="Soporte del movimiento" className="w-full max-h-72 object-contain rounded border" />
                                    ) : (
                                        <iframe src={comprobanteUrl} className="w-full h-64 border rounded" title="Vista previa del soporte" />
                                    )}
                                </CardContent>
                            </Card>
                        )}
                        {isEditing && (
                            <div className="rounded-md border border-dashed p-3 space-y-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-2">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    {comprobanteUrl ? "Reemplazar soporte" : "Adjuntar soporte"} (PDF o imagen, máximo 10 MB)
                                </span>
                                <Input type="file" accept=".pdf,image/jpeg,image/png,image/webp"
                                    onChange={handleUploadSupport} disabled={isUploading} />
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isUploading}>Guardar Cambios</Button>
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

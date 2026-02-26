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
import { MovimientoFinanciero, TipoMovimiento, CategoriaMovimiento } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import { Pencil, Eye, ExternalLink, UploadCloud, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MovimientoDetailDialogProps {
    movimiento: MovimientoFinanciero;
    onMovimientoUpdated: (mov: MovimientoFinanciero) => void | Promise<void>;
    trigger?: React.ReactNode;
}

export function MovimientoDetailDialog({ movimiento, onMovimientoUpdated, trigger }: MovimientoDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states
    const [concepto, setConcepto] = useState(movimiento.concepto);
    const [tercero, setTercero] = useState(movimiento.tercero);
    const [valor, setValor] = useState(movimiento.valor.toString());
    const [fecha, setFecha] = useState(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : ""); // YYYY-MM-DD
    const [categoria, setCategoria] = useState<CategoriaMovimiento>(movimiento.categoria);
    const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [currentComprobanteUrl, setCurrentComprobanteUrl] = useState(movimiento.comprobanteUrl);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setConcepto(movimiento.concepto);
            setTercero(movimiento.tercero);
            setValor(movimiento.valor.toString());
            setFecha(movimiento.fecha ? new Date(movimiento.fecha).toISOString().split('T')[0] : "");
            setCategoria(movimiento.categoria);
            setTipo(movimiento.tipo);
            setCurrentComprobanteUrl(movimiento.comprobanteUrl);
            setFile(null);
            setIsEditing(false);
        }
    }, [open, movimiento]);

    const handleSave = async () => {
        setIsUploading(true);
        try {
            let updatedComprobanteUrl = currentComprobanteUrl;

            // En caso de que se haya seleccionado un nuevo archivo para reemplazar el existente
            if (file) {
                const supabase = createClient();
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `movimientos/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('Financiera_Mov')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast({
                        title: "Error",
                        description: "Error al subir el nuevo archivo adjunto.",
                        variant: "destructive"
                    });
                    setIsUploading(false);
                    return;
                }

                // Obtener URL pública y actualizar
                const { data } = supabase.storage.from('Financiera_Mov').getPublicUrl(filePath);
                updatedComprobanteUrl = data.publicUrl;
                setCurrentComprobanteUrl(data.publicUrl);
            }

            const updatedMovimiento: MovimientoFinanciero = {
                ...movimiento,
                concepto,
                tercero,
                valor: parseFloat(valor) || 0,
                fecha: new Date(fecha),
                categoria,
                tipo,
                comprobanteUrl: updatedComprobanteUrl,
                // Account info remains same for now unless we add account selector
            };

            await onMovimientoUpdated(updatedMovimiento);
            setIsEditing(false);
            setFile(null);
            toast({
                title: "Movimiento actualizado",
                description: "Los cambios han sido guardados."
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudieron guardar los cambios.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Detalle de Movimiento</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Edite los campos necesarios." : "Información completa de la transacción."}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fecha" className="text-right">Fecha</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right">Tipo</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INGRESO">Ingreso</SelectItem>
                                <SelectItem value="EGRESO">Egreso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="categoria" className="text-right">Categoría</Label>
                        <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaMovimiento)} disabled={!isEditing}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NOMINA">Nómina</SelectItem>
                                <SelectItem value="PROVEEDORES">Proveedores</SelectItem>
                                <SelectItem value="SERVICIOS">Servicios</SelectItem>
                                <SelectItem value="IMPUESTOS">Impuestos</SelectItem>
                                <SelectItem value="PRESTAMOS">Préstamos</SelectItem>
                                <SelectItem value="VENTAS">Ventas</SelectItem>
                                <SelectItem value="OTROS">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="concepto" className="text-right">Concepto</Label>
                        <Input
                            id="concepto"
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tercero" className="text-right">Tercero</Label>
                        <Input
                            id="tercero"
                            value={tercero}
                            onChange={(e) => setTercero(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="valor" className="text-right">Valor</Label>
                        <Input
                            id="valor"
                            type="number"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            disabled={!isEditing}
                            className="col-span-3 font-mono font-bold"
                        />
                    </div>

                    {!isEditing && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Cuenta</Label>
                            <div className="col-span-3 text-sm font-medium border p-2 rounded-md bg-muted/50">
                                {movimiento.cuenta?.nombre || "N/A"} ({movimiento.cuenta?.tipo || ""})
                            </div>
                        </div>
                    )}

                    {!isEditing && currentComprobanteUrl && (
                        <div className="grid gap-2 border-t pt-4 mt-2">
                            <Label>Evidencia Adjunta</Label>
                            <div className="rounded-md overflow-hidden border bg-muted/20 flex flex-col items-center justify-center min-h-[150px] relative">
                                {currentComprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={currentComprobanteUrl}
                                        className="w-full h-[250px] border-none"
                                        title="Visor PDF"
                                    />
                                ) : (
                                    <img
                                        src={currentComprobanteUrl}
                                        alt="Evidencia"
                                        className="max-w-full max-h-[300px] object-contain"
                                        loading="lazy"
                                    />
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <a
                                        href={currentComprobanteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-background/80 hover:bg-background border shadow-sm p-1.5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        title="Abrir en pestaña nueva"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {isEditing && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">
                                {currentComprobanteUrl ? "Reemplazar Evidencia" : "Añadir Evidencia"}
                            </Label>
                            <label className="col-span-3 flex items-center gap-2 px-3 py-2 border rounded-md border-input bg-background hover:bg-muted/50 cursor-pointer transition-colors text-sm text-muted-foreground w-full">
                                <UploadCloud className="w-4 h-4" />
                                <span className="truncate flex-1">
                                    {file ? file.name : "Seleccionar nuevo archivo..."}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </>
                    ) : (
                        <div className="flex justify-end w-full gap-2">
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

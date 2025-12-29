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
import { Pencil, Eye } from "lucide-react";

interface MovimientoDetailDialogProps {
    movimiento: MovimientoFinanciero;
    onMovimientoUpdated: (mov: MovimientoFinanciero) => void;
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
                                {movimiento.cuenta.nombre} ({movimiento.cuenta.tipo})
                            </div>
                        </div>
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

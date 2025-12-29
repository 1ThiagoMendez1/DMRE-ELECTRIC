"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MovementDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    movement: any; // Using any for simplicity as generic movement type, effectively MovimientoInventario
}

export function MovementDetailDialog({ open, onOpenChange, movement }: MovementDetailDialogProps) {
    if (!movement) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Detalle del Movimiento</DialogTitle>
                    <DialogDescription>ID: {movement.id}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Tipo:</span>
                        <Badge variant={movement.tipo === 'ENTRADA' ? 'default' : 'secondary'}>
                            {movement.tipo}
                        </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Fecha:</span>
                        <span>{format(new Date(movement.fecha), "PPP p", { locale: es })}</span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="font-medium">Artículo</h4>
                        <div className="bg-muted p-3 rounded-md text-sm">
                            <p><span className="font-semibold">SKU:</span> {movement.articulo.sku}</p>
                            <p><span className="font-semibold">Descripción:</span> {movement.articulo.descripcion}</p>
                            <p><span className="font-semibold">Categoría:</span> {movement.articulo.categoria}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="font-medium">Cantidad:</span>
                        <span className="text-lg font-bold">{Math.abs(movement.cantidad)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Valor Unitario:</span>
                        <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(movement.articulo.valorUnitario)}</span>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <span className="font-medium">Responsable:</span>
                        <p className="text-sm text-muted-foreground">{movement.responsableId}</p>
                    </div>
                    {movement.comentario && (
                        <div className="space-y-1">
                            <span className="font-medium">Observación:</span>
                            <p className="text-sm text-muted-foreground">{movement.comentario}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

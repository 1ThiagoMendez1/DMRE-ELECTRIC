"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { Package, MapPin, Layers, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface InventoryItemDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: any | null;
}

export function InventoryItemDetailDialog({ open, onOpenChange, item }: InventoryItemDetailDialogProps) {
    if (!item) return null;

    const stockStatus = item.cantidad <= item.stockMinimo ? 'BAJO' : 'OK';
    const precioProveedor = item.costoMateriales || Math.round(item.valorUnitario * 0.7);
    const margen = item.valorUnitario - precioProveedor;
    const margenPct = precioProveedor > 0 ? ((margen / precioProveedor) * 100).toFixed(1) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {item.descripcion}
                    </DialogTitle>
                    <DialogDescription>
                        SKU: {item.sku}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Status Banner */}
                    {stockStatus === 'BAJO' ? (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-300">Stock Bajo</p>
                                <p className="text-xs text-orange-700 dark:text-orange-400">Cantidad por debajo del mínimo ({item.stockMinimo})</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">Stock Normal</p>
                                <p className="text-xs text-green-700 dark:text-green-400">Inventario en niveles adecuados</p>
                            </div>
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Layers className="h-3 w-3" /> Categoría
                            </p>
                            <Badge variant="outline">{item.categoria}</Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Ubicación
                            </p>
                            <p className="font-medium">{item.ubicacion}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Stock Info */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold text-primary">{item.cantidad}</p>
                            <p className="text-xs text-muted-foreground">{item.unidad} disponibles</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold">{item.stockMinimo}</p>
                            <p className="text-xs text-muted-foreground">Stock Mínimo</p>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-2xl font-bold">{formatCurrency(item.valorTotal || item.cantidad * item.valorUnitario)}</p>
                            <p className="text-xs text-muted-foreground">Valor Total</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Pricing Info */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-1">
                            <DollarSign className="h-4 w-4" /> Información de Precios
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="p-2 border rounded-lg text-center">
                                <p className="text-muted-foreground text-xs">Precio Proveedor</p>
                                <p className="font-medium">{formatCurrency(precioProveedor)}</p>
                            </div>
                            <div className="p-2 border rounded-lg text-center border-primary">
                                <p className="text-muted-foreground text-xs">Precio de Venta</p>
                                <p className="font-bold text-primary">{formatCurrency(item.valorUnitario)}</p>
                            </div>
                            <div className="p-2 border rounded-lg text-center">
                                <p className="text-muted-foreground text-xs">Margen</p>
                                <p className="font-medium text-green-600">{formatCurrency(margen)} ({margenPct}%)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

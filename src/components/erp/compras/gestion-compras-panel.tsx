"use client";

import { useErp } from "@/components/providers/erp-provider";
import { useToast } from "@/hooks/use-toast";
import { Cotizacion, CotizacionProveedor, OrdenCompra } from "@/types/sistema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, ShoppingCart, Download, User, Eye, Pencil, Save, X } from "lucide-react";
import { CrearCotizacionMaterialDialog } from "./crear-cotizacion-material-dialog";
import { generateMaterialQuotePDF } from "@/utils/pdf-cotizacion-material";
import { generateOrdenCompraPDF } from "@/utils/pdf-orden-compra";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
    cotizacion: Cotizacion;
}

export function GestionComprasPanel({ cotizacion }: Props) {
    const { cotizacionesProveedor, updateCotizacionProveedorEstado, addOrdenCompra, proveedores, ordenesCompra } = useErp();
    
    // Filtrar cotizaciones de proveedores para esta oferta
    const cotizaciones = cotizacionesProveedor.filter(c => c.cotizacionId === cotizacion.id);
    const ocs = ordenesCompra.filter(oc => cotizaciones.some(c => c.id === oc.cotizacionProveedorId));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div>
                    <h3 className="text-lg font-medium">Gestión de Compras y Materiales</h3>
                    <p className="text-sm text-muted-foreground">Solicita cotizaciones a proveedores y genera órdenes de compra.</p>
                </div>
                <CrearCotizacionMaterialDialog cotizacion={cotizacion} />
            </div>

            {cotizaciones.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground">Sin solicitudes de cotización</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                        Aún no se han generado solicitudes de material para proveedores a partir de esta oferta.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cotizaciones.map(c => (
                        <CotizacionProveedorCard 
                            key={c.id} 
                            cotizacionProveedor={c} 
                            ofertaOriginal={cotizacion} 
                        />
                    ))}
                </div>
            )}
            
            {ocs.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Órdenes de Compra Generadas ({ocs.length})
                    </h4>
                    <div className="grid gap-3">
                        {ocs.map(oc => (
                            <OrdenCompraCard key={oc.id} oc={oc} cotizacion={cotizacion} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CotizacionProveedorCard({ cotizacionProveedor, ofertaOriginal }: { cotizacionProveedor: CotizacionProveedor, ofertaOriginal: Cotizacion }) {
    const { updateCotizacionProveedorEstado, updateCotizacionProveedorItemPrices, addOrdenCompra, proveedores, ordenesCompra } = useErp();
    const [isApproving, setIsApproving] = useState(false);
    const [selectedProveedorId, setSelectedProveedorId] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // Estado para guardar el precio unitario ingresado para cada ítem
    const [itemPrices, setItemPrices] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        cotizacionProveedor.items.forEach(i => initial[i.id] = i.valorUnitarioOfrecido || 0);
        return initial;
    });

    // Estado para guardar la cantidad aprobada para cada ítem
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        cotizacionProveedor.items.forEach(i => initial[i.id] = i.cantidad);
        return initial;
    });

    // Estado para ítems seleccionados para aprobar
    const [selectedApproveItems, setSelectedApproveItems] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        cotizacionProveedor.items.forEach(i => initial[i.id] = true);
        return initial;
    });

    const isApproved = cotizacionProveedor.estado === 'APROBADA';
    const hasOC = ordenesCompra.some(oc => oc.cotizacionProveedorId === cotizacionProveedor.id);

    const handleAprobar = async () => {
        if (!selectedProveedorId) return;
        
        setIsApproving(true);
        try {
            // 1. Calcular totales en base a los precios ingresados y filtrar seleccionados
            const itemsWithPrices = cotizacionProveedor.items
                .filter(i => selectedApproveItems[i.id])
                .map(i => {
                    const unitPrice = itemPrices[i.id] || 0;
                    const approvedQty = itemQuantities[i.id] || i.cantidad;
                    return {
                        id: i.id,
                        inventarioId: i.inventarioId,
                        descripcion: i.descripcion,
                        cantidad: approvedQty,
                        valorUnitario: unitPrice,
                        subtotal: unitPrice * approvedQty,
                        recibido: 0
                    };
                });

            if (itemsWithPrices.length === 0) {
                setIsApproving(false);
                return;
            }

            const ocSubtotal = itemsWithPrices.reduce((acc, item) => acc + item.subtotal, 0);
            const ocImpuestos = ocSubtotal * 0.19;
            const ocTotal = ocSubtotal + ocImpuestos;

            // 2. Guardar los precios en los items de la solicitud de cotización
            //    Esto es lo que luego se usa para generar el PDF de la solicitud aprobada
            await updateCotizacionProveedorItemPrices(
                cotizacionProveedor.id,
                itemsWithPrices.map(i => ({
                    id: i.id,
                    valorUnitario: i.valorUnitario,
                    valorTotal: i.subtotal
                }))
            );

            // 3. Aprobar la cotización y asignar proveedor
            await updateCotizacionProveedorEstado(cotizacionProveedor.id, 'APROBADA', selectedProveedorId);
            
            // 4. Generar la Orden de Compra
            const prov = proveedores.find(p => p.id === selectedProveedorId);
            const ocNumber = `OC-${Date.now().toString().slice(-4)}`;

            await addOrdenCompra({
                numero: ocNumber,
                cotizacionProveedorId: cotizacionProveedor.id,
                proveedorId: selectedProveedorId,
                proveedor: prov,
                estado: 'PENDIENTE',
                fechaEmision: new Date(),
                items: itemsWithPrices,
                subtotal: ocSubtotal,
                impuestos: ocImpuestos,
                total: ocTotal
            });
            
        } catch (error) {
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{cotizacionProveedor.numero}</span>
                        <Badge variant={isApproved ? "default" : "secondary"} className={isApproved ? "bg-green-600" : ""}>
                            {cotizacionProveedor.estado}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {format(cotizacionProveedor.fecha, "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {cotizacionProveedor.items.length} materiales solicitados
                    </p>
                    {cotizacionProveedor.proveedorId && (
                        <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {proveedores.find(p => p.id === cotizacionProveedor.proveedorId)?.nombre || 'Proveedor'}
                        </p>
                    )}
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 sm:flex-none gap-2"
                                onClick={() => {
                                    const pdfDataUrl = generateMaterialQuotePDF(cotizacionProveedor, ofertaOriginal, 'bloburl');
                                    setPreviewUrl(pdfDataUrl as string);
                                }}
                            >
                                <Eye className="h-4 w-4" />
                                Vista Previa
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Vista Previa PDF Proveedor</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 w-full mt-4 bg-muted/50 rounded-md overflow-hidden">
                                {previewUrl ? (
                                    <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        Generando vista previa...
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => generateMaterialQuotePDF(cotizacionProveedor, ofertaOriginal, 'save')}
                        className="flex-1 sm:flex-none gap-2"
                    >
                        <Download className="h-4 w-4" />
                        PDF Proveedor
                    </Button>
                    
                    {!isApproved && !hasOC && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="default" className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700 text-white">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Aprobar a OC
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Convertir en Orden de Compra</DialogTitle>
                                    <DialogDescription>
                                        Selecciona el proveedor adjudicado y proporciona los valores unitarios ofertados para cada material.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[60vh] flex flex-col">
                                    <div className="space-y-2 shrink-0">
                                        <Label>Proveedor</Label>
                                        <Select value={selectedProveedorId} onValueChange={setSelectedProveedorId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un proveedor..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {proveedores.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="space-y-2 flex-1 overflow-hidden flex flex-col min-h-[250px]">
                                        <Label>Valores Ofertados por el Proveedor</Label>
                                        <ScrollArea className="border rounded-md p-4 flex-1">
                                            <div className="space-y-3">
                                                {cotizacionProveedor.items.map(item => (
                                                    <div key={item.id} className="grid grid-cols-[auto,1fr,120px] gap-4 items-center pb-3 border-b last:border-0 last:pb-0">
                                                        <Checkbox 
                                                            id={`approve-${item.id}`}
                                                            checked={!!selectedApproveItems[item.id]}
                                                            onCheckedChange={(checked) => setSelectedApproveItems({...selectedApproveItems, [item.id]: !!checked})}
                                                        />
                                                        <div>
                                                            <Label htmlFor={`approve-${item.id}`} className="text-sm font-medium line-clamp-2 cursor-pointer">{item.descripcion}</Label>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-muted-foreground">Cant:</span>
                                                                <Input 
                                                                    type="number"
                                                                    className="h-6 w-16 text-xs px-2 py-0"
                                                                    value={itemQuantities[item.id] ?? item.cantidad}
                                                                    onChange={(e) => {
                                                                        let val = e.target.value;
                                                                        if (val.length > 1 && val.startsWith('0')) {
                                                                            val = val.replace(/^0+(?=\d)/, '');
                                                                            e.target.value = val;
                                                                        }
                                                                        setItemQuantities({...itemQuantities, [item.id]: Number(val)});
                                                                    }}
                                                                    disabled={!selectedApproveItems[item.id]}
                                                                    min={1}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                                            <Input 
                                                                type="number"
                                                                className="h-8 pl-6 text-sm"
                                                                placeholder="V. Unit"
                                                                value={itemPrices[item.id] || ''}
                                                                onChange={(e) => {
                                                                    let val = e.target.value;
                                                                    if (val.length > 1 && val.startsWith('0')) {
                                                                        val = val.replace(/^0+(?=\d)/, '');
                                                                        e.target.value = val;
                                                                    }
                                                                    setItemPrices({...itemPrices, [item.id]: Number(val)});
                                                                }}
                                                                disabled={!selectedApproveItems[item.id]}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAprobar} disabled={!selectedProveedorId || isApproving}>
                                        {isApproving ? "Procesando..." : "Confirmar y Generar OC"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function OrdenCompraCard({ oc, cotizacion }: { oc: OrdenCompra, cotizacion: Cotizacion }) {
    const { updateOrdenCompra } = useErp();
    const { toast } = useToast();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<Record<string, { cantidad: number, valorUnitario: number }>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleEditStart = () => {
        const initial: Record<string, { cantidad: number, valorUnitario: number }> = {};
        oc.items.forEach(i => {
            initial[i.id] = { cantidad: i.cantidad, valorUnitario: i.valorUnitario };
        });
        setEditItems(initial);
        setIsEditing(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedItems = oc.items.map(i => {
                const editData = editItems[i.id];
                if (editData) {
                    return {
                        ...i,
                        cantidad: editData.cantidad,
                        valorUnitario: editData.valorUnitario,
                        subtotal: editData.cantidad * editData.valorUnitario
                    };
                }
                return i;
            });

            const subtotal = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);
            const impuestos = subtotal * 0.19;
            const total = subtotal + impuestos;

            const updatedOC = {
                ...oc,
                items: updatedItems,
                subtotal,
                impuestos,
                total
            };

            await updateOrdenCompra(oc.id, updatedOC);
            setIsEditing(false);
            toast({
                title: "Orden de Compra actualizada",
                description: "Los ítems y totales se han guardado correctamente.",
            });
        } catch (error) {
            console.error("Error updating OC:", error);
            toast({
                title: "Error al guardar",
                description: "Hubo un problema intentando actualizar la orden.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <CardContent className="p-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300">
                                {oc.numero}
                            </Badge>
                            <span className="text-sm font-medium">{oc.proveedor?.nombre}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {format(oc.fechaEmision, "dd MMM yyyy", { locale: es })} • {oc.items.length} items
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-white/50">{oc.estado}</Badge>
                        
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 gap-1 bg-white dark:bg-slate-900"
                                    onClick={() => {
                                        const pdfDataUrl = generateOrdenCompraPDF(oc, cotizacion, 'bloburl');
                                        setPreviewUrl(pdfDataUrl as string);
                                    }}
                                >
                                    <Eye className="h-3 w-3" />
                                    Vista Previa
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Vista Previa Orden de Compra</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 w-full mt-4 bg-muted/50 rounded-md overflow-hidden">
                                    {previewUrl ? (
                                        <iframe src={previewUrl} className="w-full h-full border-0" title="PDF Preview" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            Generando vista previa...
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateOrdenCompraPDF(oc, cotizacion, 'save')}
                            className="h-8 gap-1 bg-white dark:bg-slate-900"
                        >
                            <Download className="h-3 w-3" />
                            PDF
                        </Button>

                        {!isEditing ? (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleEditStart}
                                className="h-8 gap-1 bg-white dark:bg-slate-900"
                            >
                                <Pencil className="h-3 w-3" />
                                Editar
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setIsEditing(false)}
                                    className="h-8 gap-1"
                                    disabled={isSaving}
                                >
                                    <X className="h-3 w-3" />
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={handleSave}
                                    className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                                    disabled={isSaving}
                                >
                                    <Save className="h-3 w-3" />
                                    Guardar
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-4 border rounded-md p-4 bg-white dark:bg-slate-950">
                        <h5 className="text-sm font-medium mb-3">Editar Ítems de la Orden de Compra</h5>
                        <ScrollArea className="max-h-[300px]">
                            <div className="space-y-3">
                                {oc.items.map(item => (
                                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-4 items-end pb-3 border-b last:border-0 last:pb-0">
                                        <div>
                                            <Label className="text-xs text-muted-foreground line-clamp-1">{item.descripcion}</Label>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Cantidad</Label>
                                                <Input 
                                                    type="number"
                                                    className="h-8 w-24 text-sm"
                                                    value={editItems[item.id]?.cantidad ?? item.cantidad}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        if (val.length > 1 && val.startsWith('0')) {
                                                            val = val.replace(/^0+(?=\d)/, '');
                                                            e.target.value = val;
                                                        }
                                                        setEditItems({
                                                            ...editItems, 
                                                            [item.id]: { ...editItems[item.id], cantidad: Number(val) }
                                                        });
                                                    }}
                                                    min={1}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">Valor Unitario</Label>
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                                    <Input 
                                                        type="number"
                                                        className="h-8 w-32 pl-6 text-sm"
                                                        value={editItems[item.id]?.valorUnitario ?? item.valorUnitario}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            if (val.length > 1 && val.startsWith('0')) {
                                                                val = val.replace(/^0+(?=\d)/, '');
                                                                e.target.value = val;
                                                            }
                                                            setEditItems({
                                                                ...editItems, 
                                                                [item.id]: { ...editItems[item.id], valorUnitario: Number(val) }
                                                            });
                                                        }}
                                                        min={0}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1 w-24 text-right">
                                                <Label className="text-xs text-muted-foreground">Subtotal</Label>
                                                <div className="text-sm font-medium">
                                                    ${((editItems[item.id]?.cantidad || 0) * (editItems[item.id]?.valorUnitario || 0)).toLocaleString('es-CO')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

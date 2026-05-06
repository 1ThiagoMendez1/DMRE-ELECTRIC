"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Cotizacion, CotizacionItem, MaterialAsociado } from "@/types/sistema";
import { FileText, Plus, ShoppingCart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useErp } from "@/components/providers/erp-provider";

interface Props {
    cotizacion: Cotizacion;
    onClose?: () => void;
}

export function CrearCotizacionMaterialDialog({ cotizacion, onClose }: Props) {
    const { addCotizacionProveedor, cotizacionesProveedor } = useErp();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [observaciones, setObservaciones] = useState("");
    const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

    // Extraer todos los materiales posibles de la oferta (items directos + subItems)
    const availableMaterials: any[] = [];
    
    cotizacion.items.forEach(item => {
        if (item.subItems && item.subItems.length > 0) {
            item.subItems.forEach(sub => {
                availableMaterials.push({
                    id: sub.id,
                    inventarioId: sub.inventarioId,
                    descripcion: sub.nombre,
                    cantidad: sub.cantidad * item.cantidad,
                    unidad: "UND", // Por defecto, se podría mejorar
                    source: `Sub-item de: ${item.descripcion}`
                });
            });
        } else {
            availableMaterials.push({
                id: item.id,
                inventarioId: item.inventarioId,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                unidad: (item as any).unidad || "UND",
                source: "Item principal"
            });
        }
    });

    const handleToggleItem = (id: string) => {
        setSelectedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelected: Record<string, boolean> = {};
        if (checked) {
            availableMaterials.forEach(m => newSelected[m.id] = true);
        }
        setSelectedItems(newSelected);
    };

    const handleSubmit = async () => {
        const selectedToInclude = availableMaterials.filter(m => selectedItems[m.id]);
        if (selectedToInclude.length === 0) return;

        setIsSubmitting(true);
        try {
            // Generate CM number
            const cmCount = cotizacionesProveedor.length + 1;
            const numero = `CM-${cmCount.toString().padStart(4, '0')}`;

            await addCotizacionProveedor({
                numero,
                cotizacionId: cotizacion.id,
                estado: 'BORRADOR',
                fecha: new Date(),
                observaciones
            }, selectedToInclude);

            setOpen(false);
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAnySelected = Object.values(selectedItems).some(v => v);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Solicitud Materiales
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        Crear Solicitud de Cotización a Proveedor
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona los materiales de la oferta <strong>{cotizacion.numero}</strong> que deseas cotizar con proveedores.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                        <Checkbox 
                            id="select-all" 
                            onCheckedChange={(c) => handleSelectAll(c as boolean)} 
                            checked={availableMaterials.length > 0 && Object.values(selectedItems).filter(v => v).length === availableMaterials.length}
                        />
                        <Label htmlFor="select-all" className="font-semibold cursor-pointer">Seleccionar Todos</Label>
                    </div>

                    <ScrollArea className="h-[300px] rounded-md border p-4">
                        {availableMaterials.length === 0 ? (
                            <div className="text-center text-muted-foreground p-4">No hay materiales disponibles en esta oferta.</div>
                        ) : (
                            <div className="space-y-4">
                                {availableMaterials.map((mat) => (
                                    <div key={mat.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                                        <Checkbox 
                                            id={`mat-${mat.id}`} 
                                            checked={!!selectedItems[mat.id]}
                                            onCheckedChange={() => handleToggleItem(mat.id)}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 flex-1 leading-none">
                                            <Label htmlFor={`mat-${mat.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                                {mat.descripcion}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Cant: {mat.cantidad} {mat.unidad} | Origen: {mat.source}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="space-y-2">
                        <Label htmlFor="observaciones">Observaciones para el proveedor (opcional)</Label>
                        <Textarea 
                            id="observaciones" 
                            placeholder="Ej. Entregar en obra principal, especificar marca, etc." 
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={!isAnySelected || isSubmitting}>
                        {isSubmitting ? "Creando..." : "Generar Cotización"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

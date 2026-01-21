"use client";

import { useState } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import {
    Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { DotacionItem, EntregaDotacion } from "@/types/sistema";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateES } from "@/lib/utils";

interface DotacionDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: DotacionItem;
    historialEntregas: EntregaDotacion[]; // Filtered by this item
    onUpdateItem: (item: DotacionItem) => void;
}

export function DotacionDetailDialog({
    open,
    onOpenChange,
    item,
    historialEntregas,
    onUpdateItem
}: DotacionDetailDialogProps) {
    const [activeTab, setActiveTab] = useState("variantes");
    const [openAddVariant, setOpenAddVariant] = useState(false);
    const [newVariant, setNewVariant] = useState({ talla: "", color: "", stock: 0 });

    const handleAddVariant = () => {
        if (!newVariant.talla || !newVariant.color) return;
        const variant = {
            id: `VAR-${Date.now()}`,
            talla: newVariant.talla,
            color: newVariant.color,
            cantidadDisponible: newVariant.stock
        };
        onUpdateItem({
            ...item,
            variantes: [...item.variantes, variant]
        });
        setNewVariant({ talla: "", color: "", stock: 0 });
        setOpenAddVariant(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item.descripcion}</DialogTitle>
                    <DialogDescription>Detalle de dotación, variantes y movimientos.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="variantes">Variantes y Stock</TabsTrigger>
                        <TabsTrigger value="historial">Historial Entregas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="variantes" className="space-y-4 py-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Talla</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead className="text-center">Stock Disponible</TableHead>
                                        <TableHead className="text-right">Ajuste Rápido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {item.variantes.map(v => {
                                        const stockMin = item.stockMinimo || 10;
                                        const isLow = v.cantidadDisponible <= stockMin;
                                        return (
                                            <TableRow key={v.id}>
                                                <TableCell>{v.talla}</TableCell>
                                                <TableCell>{v.color}</TableCell>
                                                <TableCell className={`text-center font-bold ${isLow ? 'text-amber-500' : 'text-primary'}`}>
                                                    {v.cantidadDisponible}
                                                    {isLow && <span className="ml-1 text-[10px]">⚠️</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => {
                                                                if (v.cantidadDisponible > 0) {
                                                                    onUpdateItem({
                                                                        ...item,
                                                                        variantes: item.variantes.map(vr =>
                                                                            vr.id === v.id
                                                                                ? { ...vr, cantidadDisponible: vr.cantidadDisponible - 1 }
                                                                                : vr
                                                                        )
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            -
                                                        </Button>
                                                        <span className="w-8 text-center text-sm">{v.cantidadDisponible}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => {
                                                                onUpdateItem({
                                                                    ...item,
                                                                    variantes: item.variantes.map(vr =>
                                                                        vr.id === v.id
                                                                            ? { ...vr, cantidadDisponible: vr.cantidadDisponible + 1 }
                                                                            : vr
                                                                    )
                                                                });
                                                            }}
                                                        >
                                                            +
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end">

                            <Popover open={openAddVariant} onOpenChange={setOpenAddVariant}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Plus className="mr-2 h-4 w-4" /> Agregar Variante
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Nueva Variante</h4>
                                            <p className="text-sm text-muted-foreground">Defina talla, color y stock inicial.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor="talla">Talla</Label>
                                                <Input id="talla" value={newVariant.talla} onChange={(e) => setNewVariant({ ...newVariant, talla: e.target.value })} className="col-span-2 h-8" />
                                            </div>
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor="color">Color</Label>
                                                <Input id="color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} className="col-span-2 h-8" />
                                            </div>
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor="stock">Stock</Label>
                                                <Input id="stock" type="number" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })} className="col-span-2 h-8" />
                                            </div>
                                        </div>
                                        <Button onClick={handleAddVariant} className="electric-button">Agregar</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </TabsContent>

                    <TabsContent value="historial" className="space-y-4 py-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Detalle</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historialEntregas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">Sin entregas registradas</TableCell>
                                        </TableRow>
                                    ) : (
                                        historialEntregas.map(ent => (
                                            <TableRow key={ent.id}>
                                                <TableCell>{formatDateES(ent.fecha)}</TableCell>
                                                <TableCell>{ent.empleado.nombreCompleto}</TableCell>
                                                <TableCell>
                                                    {ent.items.filter(i => i.dotacionId === item.id).map(i => (
                                                        <div key={i.varianteId} className="text-xs">
                                                            {i.detalle} (Cant: {i.cantidad})
                                                        </div>
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={ent.estado === 'ENTREGADO' ? 'default' : 'secondary'}>
                                                        {ent.estado}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

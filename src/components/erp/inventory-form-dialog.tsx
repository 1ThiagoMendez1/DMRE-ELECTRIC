"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Search, Check, Calculator, Box, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { InventarioItem, Material } from "@/types/sistema";
import { cn, formatCurrency } from "@/lib/utils";

interface InventoryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<InventarioItem>;
    onSave: (item: InventarioItem) => void;
    availableItems: InventarioItem[]; // For material selection
}

export function InventoryFormDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
    availableItems
}: InventoryFormDialogProps) {
    const [formData, setFormData] = useState<Partial<InventarioItem>>({
        tipo: 'SIMPLE',
        unidad: 'Unidad',
        cantidad: 0,
        valorUnitario: 0,
        materiales: [],
        ...initialData
    });

    // Determine if we are editing
    const isEditing = !!initialData?.id;

    // Reset when opening fresh
    useEffect(() => {
        if (open) {
            // Recalculate materials to ensure integrity
            const cleanMaterials = (initialData?.materiales || []).map(m => ({
                ...m,
                valorTotal: m.valorUnitario * m.cantidad
            }));
            const cleanTotalCost = cleanMaterials.reduce((acc, m) => acc + m.valorTotal, 0);

            // If composite, ensure unit value matches materials
            const calcUnitValue = initialData?.tipo === 'COMPUESTO' ? cleanTotalCost : (initialData?.valorUnitario || 0);

            setFormData({
                tipo: 'SIMPLE',
                unidad: 'Unidad',
                cantidad: 0,
                ...initialData,
                materiales: cleanMaterials,
                valorUnitario: calcUnitValue
            });
        }
    }, [open, initialData]);

    const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
    const [materialSearchTerm, setMaterialSearchTerm] = useState("");

    // Filter available items for materials (exclude current item if editing, and maybe composites to avoid deep recursion loop for now)
    const materialCandidates = useMemo(() => {
        return availableItems.filter(i =>
            i.id !== formData.id &&
            i.tipo === 'SIMPLE' &&
            i.descripcion.toLowerCase().includes(materialSearchTerm.toLowerCase())
        );
    }, [availableItems, formData.id, materialSearchTerm]);

    const handleAddMaterial = (candidate: InventarioItem) => {
        const newMaterial: Material = {
            id: `MAT-${Date.now()}`,
            inventarioId: candidate.id,
            descripcion: candidate.descripcion,
            unidad: candidate.unidad,
            cantidad: 1,
            valorUnitario: candidate.valorUnitario,
            valorTotal: candidate.valorUnitario * 1
        };

        const updatedMaterials = [...(formData.materiales || []), newMaterial];
        updateCompositeCost(updatedMaterials);
        setMaterialSearchOpen(false);
        setMaterialSearchTerm("");
    };

    const handleRemoveMaterial = (materialId: string) => {
        const updatedMaterials = (formData.materiales || []).filter(m => m.id !== materialId);
        updateCompositeCost(updatedMaterials);
    };

    const handleMaterialQuantityChange = (materialId: string, newQty: number) => {
        const updatedMaterials = (formData.materiales || []).map(m => {
            if (m.id === materialId) {
                return {
                    ...m,
                    cantidad: newQty,
                    valorTotal: m.valorUnitario * newQty
                };
            }
            return m;
        });
        updateCompositeCost(updatedMaterials);
    };

    const updateCompositeCost = (materials: Material[]) => {
        const totalCost = materials.reduce((acc, m) => acc + m.valorTotal, 0);
        setFormData(prev => ({
            ...prev,
            materiales: materials,
            valorUnitario: totalCost, // Auto-calculate Unit Value
            valorTotal: totalCost * (prev.cantidad || 0)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalItem = {
            ...formData,
            valorTotal: (formData.valorUnitario || 0) * (formData.cantidad || 0)
        } as InventarioItem;
        onSave(finalItem);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Item" : "Nuevo Item"}</DialogTitle>
                    <DialogDescription>
                        {formData.tipo === 'COMPUESTO'
                            ? "Configure los materiales que componen este producto."
                            : "Información básica del item de inventario."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="item">Código</Label>
                                <Input
                                    id="item"
                                    value={formData.item || ""}
                                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                                    placeholder="Ej. PROD-001"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tipo">Tipo</Label>
                                <Select
                                    value={formData.tipo}
                                    onValueChange={(val: any) => setFormData({ ...formData, tipo: val })}
                                    disabled={isEditing}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SIMPLE">Simple (Material/Insumo)</SelectItem>
                                        <SelectItem value="COMPUESTO">Compuesto (Producto/Kit)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descripcion">Descripción</Label>
                            <Input
                                id="descripcion"
                                value={formData.descripcion || ""}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unidad">Unidad</Label>
                                <Input
                                    id="unidad"
                                    value={formData.unidad || ""}
                                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cantidad">Stock Actual</Label>
                                <Input
                                    id="cantidad"
                                    type="number"
                                    value={formData.cantidad || 0}
                                    onChange={(e) => {
                                        const qty = parseFloat(e.target.value);
                                        setFormData({
                                            ...formData,
                                            cantidad: qty,
                                            valorTotal: (formData.valorUnitario || 0) * qty
                                        });
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="precio" className="flex items-center gap-2">
                                    Valor Unitario
                                    {formData.tipo === 'COMPUESTO' && <Calculator className="h-3 w-3 text-muted-foreground" />}
                                </Label>
                                <Input
                                    id="precio"
                                    type="number"
                                    value={formData.valorUnitario || 0}
                                    onChange={(e) => {
                                        const price = parseFloat(e.target.value);
                                        setFormData({
                                            ...formData,
                                            valorUnitario: price,
                                            valorTotal: price * (formData.cantidad || 0)
                                        });
                                    }}
                                    readOnly={formData.tipo === 'COMPUESTO'}
                                    className={formData.tipo === 'COMPUESTO' ? "bg-muted font-bold" : ""}
                                />
                            </div>
                        </div>

                        {formData.tipo === 'COMPUESTO' && (
                            <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Box className="h-4 w-4" /> Lista de Materiales
                                    </h4>
                                    <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-[180px] justify-between">
                                                <Plus className="mr-2 h-4 w-4" /> Agregar Material
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-2 w-[300px]" align="end">
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Buscar material..."
                                                        className="pl-8 h-9"
                                                        value={materialSearchTerm}
                                                        onChange={(e) => setMaterialSearchTerm(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="max-h-[200px] overflow-auto space-y-1">
                                                    {materialCandidates.length === 0 ? (
                                                        <div className="p-2 text-sm text-center text-muted-foreground">No encontrado</div>
                                                    ) : (
                                                        materialCandidates.map((c) => (
                                                            <div
                                                                key={c.id}
                                                                className="flex items-center justify-between p-2 rounded-sm hover:bg-accent cursor-pointer text-sm"
                                                                onClick={() => handleAddMaterial(c)}
                                                            >
                                                                <span>{c.descripcion}</span>
                                                                <span className="text-muted-foreground">{formatCurrency(c.valorUnitario)}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="rounded-md border bg-background">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Material</TableHead>
                                                <TableHead className="w-[100px]">Cant. Req</TableHead>
                                                <TableHead className="text-right">Costo Unit</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(formData.materiales || []).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                                                        No hay materiales asignados. Agregue insumos para calcular el costo.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                (formData.materiales || []).map((mat) => (
                                                    <TableRow key={mat.id}>
                                                        <TableCell className="text-sm">{mat.descripcion}</TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-20 px-2"
                                                                value={mat.cantidad}
                                                                onChange={(e) => handleMaterialQuantityChange(mat.id, parseFloat(e.target.value) || 0)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm">{formatCurrency(mat.valorUnitario)}</TableCell>
                                                        <TableCell className="text-right font-medium text-sm">{formatCurrency(mat.valorTotal)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleRemoveMaterial(mat.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-end gap-2 text-sm">
                                    <span className="text-muted-foreground">Costo Total Materiales:</span>
                                    <span className="font-bold">{formatCurrency(formData.valorUnitario || 0)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit">Guardar Item</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

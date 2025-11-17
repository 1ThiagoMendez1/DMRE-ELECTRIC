
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockInventory } from "@/lib/data";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

function InventoryForm({ onSave, item, onCancel }: { onSave: (data: any) => void; item?: any, onCancel: () => void }) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{item ? 'Editar Ítem' : 'Añadir Nuevo Ítem'}</DialogTitle>
                    <DialogDescription>
                        Completa los detalles del ítem de inventario.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descripción</Label>
                        <Input id="description" name="description" defaultValue={item?.description} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="materialDescription" className="text-right">Desc. Material</Label>
                        <Textarea id="materialDescription" name="materialDescription" defaultValue={item?.materialDescription} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">Unidad</Label>
                        <Input id="unit" name="unit" defaultValue={item?.unit} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">Cantidad</Label>
                        <Input id="quantity" name="quantity" type="number" defaultValue={item?.quantity} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unitValue" className="text-right">Valor Unitario</Label>
                        <Input id="unitValue" name="unitValue" type="number" step="0.01" defaultValue={item?.unitValue} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" className="electric-button">Guardar Ítem</Button>
                </DialogFooter>
            </DialogContent>
        </form>
    );
}

export default function InventoryPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | undefined>(undefined);

    const handleSave = (data: any) => {
        console.log("Saving item:", data);
        // Aquí iría la lógica para guardar en la base de datos
        setIsDialogOpen(false);
        setEditingItem(undefined);
    };

    const openDialog = (item?: any) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingItem(undefined);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Administra los materiales y equipos disponibles.</p>
                </div>
                <Button className="electric-button" onClick={() => openDialog()}>
                    <Plus />
                    <span>Añadir Ítem</span>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Listado de Inventario</CardTitle>
                    <CardDescription>Todos los ítems disponibles en bodega.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Valor Unitario</TableHead>
                                <TableHead className="text-right">Valor Total</TableHead>
                                <TableHead className="text-right">Valor Total (+20%)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockInventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div>{item.description}</div>
                                        <div className="text-xs text-muted-foreground">{item.materialDescription}</div>
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(item.unitValue)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(item.totalValue)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary/90">{formatCurrency(item.totalValue2)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => openDialog(item)}>
                                                    <Pencil className="mr-2"/>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2"/>
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {isDialogOpen && <InventoryForm onSave={handleSave} item={editingItem} onCancel={closeDialog} />}
            </Dialog>
        </div>
    )
}

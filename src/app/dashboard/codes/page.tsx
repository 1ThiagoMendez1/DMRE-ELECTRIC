
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockWorkCodes } from "@/lib/data";
import { MoreVertical, Pencil, Plus, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

function WorkCodeForm({ onSave, code, onCancel }: { onSave: (data: any) => void; code?: any, onCancel: () => void }) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };

    // TODO: Implementar la lógica para añadir/editar/eliminar materiales asociados
    return (
        <form onSubmit={handleSubmit}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{code ? 'Editar Código de Trabajo' : 'Crear Nuevo Código de Trabajo'}</DialogTitle>
                    <DialogDescription>
                        Define un nuevo código para estandarizar trabajos en las cotizaciones.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" name="name" defaultValue={code?.name} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descripción</Label>
                        <Textarea id="description" name="description" defaultValue={code?.description} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="labor" className="text-right">Mano de Obra</Label>
                        <Input id="labor" name="labor" type="number" placeholder="Opcional" defaultValue={code?.labor} className="col-span-3" />
                    </div>
                    
                    {/* Sección de materiales (a implementar) */}
                    <div>
                        <Label>Materiales Asociados</Label>
                        <Card className="mt-2 bg-secondary/30 p-4 text-center text-muted-foreground">
                            <p className="text-sm">La funcionalidad para agregar materiales se implementará próximamente.</p>
                        </Card>
                    </div>

                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit">Guardar Código</Button>
                </DialogFooter>
            </DialogContent>
        </form>
    );
}

export default function WorkCodesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<any | undefined>(undefined);

    const handleSave = (data: any) => {
        console.log("Saving code:", data);
        // Aquí iría la lógica para guardar en la base de datos
        setIsDialogOpen(false);
        setEditingCode(undefined);
    };

    const openDialog = (code?: any) => {
        setEditingCode(code);
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingCode(undefined);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Códigos de Trabajo</h1>
                    <p className="text-muted-foreground">Crea y gestiona códigos para estandarizar tus cotizaciones.</p>
                </div>
                <Button className="electric-button" onClick={() => openDialog()}>
                    <Plus />
                    <span>Crear Código</span>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Listado de Códigos</CardTitle>
                    <CardDescription>Estos son todos los códigos de trabajo disponibles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Trabajo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Mano de Obra</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockWorkCodes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-medium">{code.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{code.description}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(code.labor)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2"/>
                                                    Ver
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openDialog(code)}>
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
                {isDialogOpen && <WorkCodeForm onSave={handleSave} code={editingCode} onCancel={closeDialog} />}
            </Dialog>
        </div>
    )
}

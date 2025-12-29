"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Save, Activity, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CodigoDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    codigo: any;
    onUpdate: (updatedCodigo: any) => void;
}

export function CodigoDetailDialog({ open, onOpenChange, codigo, onUpdate }: CodigoDetailDialogProps) {
    const { toast } = useToast();
    const [nombre, setNombre] = useState(codigo?.nombre || '');
    const [descripcion, setDescripcion] = useState(codigo?.descripcion || '');
    const [manoDeObra, setManoDeObra] = useState(codigo?.manoDeObra || 0);

    if (!codigo) return null;

    const handleSave = () => {
        const updated = {
            ...codigo,
            nombre,
            descripcion,
            manoDeObra: Number(manoDeObra)
        };
        onUpdate(updated);
        toast({ title: "Código actualizado", description: "Cambios guardados exitosamente." });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" /> Código: {codigo.codigo}
                    </DialogTitle>
                    <DialogDescription>Edición y detalle del código de trabajo.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Nombre del Servicio</Label>
                        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Descripción</Label>
                        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Costo Mano de Obra</Label>
                            <Input type="number" value={manoDeObra} onChange={(e) => setManoDeObra(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Costo Total Estimado</Label>
                            <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(manoDeObra) + (codigo.costoTotalMateriales || 0))}
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">Materiales Asociados</h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Cant.</TableHead>
                                    <TableHead className="text-right">Unitario</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codigo.materiales && codigo.materiales.length > 0 ? (
                                    codigo.materiales.map((mat: any) => (
                                        <TableRow key={mat.id}>
                                            <TableCell>{mat.nombre}</TableCell>
                                            <TableCell className="text-right">{mat.cantidad}</TableCell>
                                            <TableCell className="text-right">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mat.valorUnitario)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">Sin materiales definidos</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="mt-2 flex justify-end">
                            <Button variant="ghost" size="sm" className="text-xs">
                                Gestionar Materiales (Próximamente)
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

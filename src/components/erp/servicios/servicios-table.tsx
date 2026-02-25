"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { ServicioLogistica } from "@/types/sistema";
import { CreateServicioDialog } from "./create-servicio-dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define props with the loaded data
export function ServiciosTable({
    servicios,
    onCreateServicio,
    onUpdateServicio,
    onDeleteServicio
}: {
    servicios: ServicioLogistica[];
    onCreateServicio: (servicio: Omit<ServicioLogistica, "id" | "codigo" | "createdAt">) => Promise<void>;
    onUpdateServicio: (id: string, updates: Partial<ServicioLogistica>) => Promise<void>;
    onDeleteServicio: (id: string) => Promise<void>;
}) {
    const [editingServicio, setEditingServicio] = useState<ServicioLogistica | null>(null);
    const [editNombre, setEditNombre] = useState("");
    const [editCosto, setEditCosto] = useState<number | string>("");

    const handleEditOpen = (srv: ServicioLogistica) => {
        setEditingServicio(srv);
        setEditNombre(srv.nombre);
        setEditCosto(srv.costo);
    };

    const handleEditSave = async () => {
        if (!editingServicio || !editNombre.trim() || editCosto === "") return;
        await onUpdateServicio(editingServicio.id, {
            nombre: editNombre.trim(),
            costo: Number(editCosto),
        });
        setEditingServicio(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground mr-4">Gestión de códigos maestros de servicios.</div>
                <CreateServicioDialog onCreateServicio={onCreateServicio} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Código</TableHead>
                            <TableHead>Nombre del Servicio</TableHead>
                            <TableHead className="text-right">Costo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {servicios.map((srv) => (
                            <TableRow key={srv.id}>
                                <TableCell className="font-mono font-medium">
                                    <Badge variant="outline">{srv.codigo}</Badge>
                                </TableCell>
                                <TableCell>{srv.nombre}</TableCell>
                                <TableCell className="text-right text-primary font-medium">
                                    {formatCurrency(srv.costo)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Dialog open={editingServicio?.id === srv.id} onOpenChange={(open) => !open && setEditingServicio(null)}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditOpen(srv)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Editar Servicio {srv.codigo}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>Nombre del Servicio</Label>
                                                        <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Costo Base</Label>
                                                        <Input
                                                            type="number"
                                                            value={editCosto === 0 ? "" : editCosto}
                                                            onChange={(e) => setEditCosto(e.target.value)}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                    </div>
                                                    <Button onClick={handleEditSave} className="w-full">Guardar Cambios</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Elminar {srv.codigo}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. ¿Seguro que deseas borrar el servicio "{srv.nombre}"?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDeleteServicio(srv.id)} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {servicios.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No hay servicios registrados. Comienza creando uno nuevo.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

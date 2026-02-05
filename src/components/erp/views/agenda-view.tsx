"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Plus, User as UserIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useErp } from "@/components/providers/erp-provider";
import { CreateTareaDialog } from "@/components/erp/create-tarea-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function AgendaView() {
    const { agenda, updateTarea, deleteTarea, isLoading } = useErp();
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const getPriorityBadge = (p: string) => {
        if (p === 'ALTA') return <Badge variant="destructive">Alta</Badge>;
        if (p === 'MEDIA') return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Media</Badge>;
        return <Badge variant="outline" className="text-green-600 border-green-200">Baja</Badge>;
    };

    const handleToggleComplete = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
        await updateTarea(id, { estado: newStatus as any });
        toast({ title: "Estado actualizado", description: `Tarea marcada como ${newStatus.toLowerCase()}.` });
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de querer eliminar esta tarea?")) {
            await deleteTarea(id);
            toast({ title: "Tarea eliminada", description: "La tarea ha sido eliminada correctamente." });
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-amber-600">Agenda de Tareas</h2>
                    <p className="text-muted-foreground">Programación de actividades y recordatorios.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Tarea
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Tarea</TableHead>
                            <TableHead>Vencimiento</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Asignado A</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agenda.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No hay tareas programadas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            agenda.map((tarea) => (
                                <TableRow key={tarea.id} className={cn(tarea.estado === 'COMPLETADA' && "bg-muted/50")}>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className={cn("font-medium", tarea.estado === 'COMPLETADA' && "line-through text-muted-foreground")}>
                                                {tarea.titulo}
                                            </span>
                                            {tarea.descripcion && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">{tarea.descripcion}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                                {format(tarea.fechaVencimiento, "dd MMM yyyy", { locale: es })}
                                            </div>
                                            {tarea.hora && (
                                                <div className="flex items-center gap-2 text-muted-foreground mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {tarea.hora}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getPriorityBadge(tarea.prioridad)}
                                    </TableCell>
                                    <TableCell>
                                        {tarea.asignadoNombre ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <UserIcon className="h-3 w-3 text-muted-foreground" />
                                                {tarea.asignadoNombre}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No asignado</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className={cn(
                                            "flex items-center gap-2 text-sm font-medium",
                                            tarea.estado === 'COMPLETADA' ? "text-green-600" : "text-amber-600"
                                        )}>
                                            {tarea.estado === 'COMPLETADA' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                            {tarea.estado.replace('_', ' ')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleToggleComplete(tarea.id, tarea.estado)}>
                                                    {tarea.estado === 'COMPLETADA' ? "Marcar como Pendiente" : "Marcar como Completada"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(tarea.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateTareaDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    );
}

"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Plus, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useErp } from "@/components/providers/erp-provider";
import { CreateTareaDialog } from "@/components/erp/create-tarea-dialog";

export default function AgendaPage() {
    const { agenda, updateTarea, isLoading } = useErp();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const getPriorityColor = (p: string) => {
        if (p === 'ALTA') return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
        if (p === 'MEDIA') return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    };

    const handleToggleComplete = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
        await updateTarea(id, { estado: newStatus as any });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando agenda...</div>;
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Agenda de Tareas</h1>
                    <p className="text-muted-foreground">Programación de actividades y recordatorios.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Tarea
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agenda.length === 0 ? (
                    <div className="col-span-full py-12 text-center border rounded-lg bg-slate-50 border-dashed">
                        <p className="text-muted-foreground">No hay tareas pendientes</p>
                    </div>
                ) : (
                    agenda.map((tarea) => (
                        <Card key={tarea.id} className="hover:shadow-lg transition-shadow border-l-4 group relative" style={{
                            borderLeftColor: tarea.prioridad === 'ALTA' ? '#ef4444' : tarea.prioridad === 'MEDIA' ? '#f59e0b' : '#94a3b8'
                        }}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className={cn("mb-2", getPriorityColor(tarea.prioridad))}>
                                            {tarea.prioridad}
                                        </Badge>
                                        {tarea.hora && (
                                            <Badge variant="secondary" className="mb-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                {tarea.hora}
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -mt-1 -mr-2"
                                        onClick={() => handleToggleComplete(tarea.id, tarea.estado)}
                                    >
                                        {tarea.estado === 'COMPLETADA' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                    </Button>
                                </div>
                                <CardTitle className={cn("text-lg leading-tight", tarea.estado === 'COMPLETADA' && "line-through text-muted-foreground")}>
                                    {tarea.titulo}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground/70 mb-4 line-clamp-3 min-h-[40px]">
                                    {tarea.descripcion}
                                </p>
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <CalendarDays className="mr-2 h-3 w-3" />
                                        Vence: {format(tarea.fechaVencimiento, "dd MMM yyyy", { locale: es })}
                                    </div>
                                    {tarea.asignadoNombre && (
                                        <div className="flex items-center">
                                            <UserIcon className="mr-2 h-3 w-3" />
                                            Asignado a: {tarea.asignadoNombre}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <CreateTareaDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    );
}

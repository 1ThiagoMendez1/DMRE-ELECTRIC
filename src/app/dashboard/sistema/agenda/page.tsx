"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { initialAgenda } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AgendaPage() {
    const { toast } = useToast();
    const [tareas, setTareas] = useState(initialAgenda);

    const getPriorityColor = (p: string) => {
        if (p === 'ALTA') return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
        if (p === 'MEDIA') return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Agenda de Tareas</h1>
                    <p className="text-muted-foreground">Programación de actividades y recordatorios.</p>
                </div>
                <Button onClick={() => toast({ title: "Nueva Tarea", description: "Diálogo de creación en desarrollo" })}>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Tarea
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tareas.map((tarea) => (
                    <Card key={tarea.id} className="hover:shadow-lg transition-shadow border-l-4" style={{
                        borderLeftColor: tarea.prioridad === 'ALTA' ? '#ef4444' : tarea.prioridad === 'MEDIA' ? '#f59e0b' : '#94a3b8'
                    }}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className={cn("mb-2", getPriorityColor(tarea.prioridad))}>
                                    {tarea.prioridad}
                                </Badge>
                                {tarea.estado === 'COMPLETADA' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <CardTitle className="text-lg leading-tight">{tarea.titulo}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground/70 mb-4 line-clamp-3">
                                {tarea.descripcion}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground">
                                <CalendarDays className="mr-2 h-3 w-3" />
                                Vence: {format(tarea.fechaVencimiento, "dd MMM yyyy", { locale: es })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function NotificationCenter() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="sr-only">Notificaciones</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex w-full justify-between items-center">
                            <span className="font-semibold text-sm">Stock Bajo</span>
                            <span className="text-[10px] text-muted-foreground">Hace 5 min</span>
                        </div>
                        <p className="text-xs text-muted-foreground">El item 'Cable #12' está por debajo del stock mínimo (20m).</p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex w-full justify-between items-center">
                            <span className="font-semibold text-sm">Cotización Aprobada</span>
                            <span className="text-[10px] text-muted-foreground">Hace 1 hora</span>
                        </div>
                        <p className="text-xs text-muted-foreground">El cliente TechSol aprobó la cotización CP-1024.</p>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex w-full justify-between items-center">
                            <span className="font-semibold text-sm">Tarea Pendiente</span>
                            <span className="text-[10px] text-muted-foreground">Hace 2 horas</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Recordatorio: Revisión de obra Proyecto Legacy 2.</p>
                    </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-center text-primary font-medium cursor-pointer">
                    Ver todas las notificaciones
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

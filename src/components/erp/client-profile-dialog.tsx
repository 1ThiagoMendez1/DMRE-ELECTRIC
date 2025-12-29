"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Building, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientProfileDialogProps {
    cliente: any;
    trigger?: React.ReactNode;
}

export function ClientProfileDialog({ cliente, trigger }: ClientProfileDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm">
                        Ver Perfil
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        Perfil del Cliente
                    </DialogTitle>
                    <DialogDescription>
                        Información detallada y resumen de actividad.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold">{cliente.nombre}</h3>
                            <div className="flex items-center text-muted-foreground mt-1">
                                <FileText className="h-4 w-4 mr-1" />
                                <span className="text-sm">NIT/CC: {cliente.documento}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                                Activo
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Cliente desde {format(new Date(cliente.fechaCreacion), "MMM yyyy", { locale: es })}
                            </p>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Contacto</h4>
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {cliente.contactoPrincipal}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {cliente.correo}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {cliente.telefono}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Ubicación</h4>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                {cliente.direccion}
                            </div>
                        </div>
                    </div>

                    {/* Stats Placeholder */}
                    <div className="bg-muted/50 p-4 rounded-lg grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Proyectos</p>
                            <p className="text-lg font-bold">Activos</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Volumen Total</p>
                            <p className="text-lg font-bold text-green-600">$ 120M+</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Última Actividad</p>
                            <p className="text-lg font-bold text-sm pt-1">Hace 2 días</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

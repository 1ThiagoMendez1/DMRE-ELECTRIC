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
import { User, Mail, CreditCard, MapPin, Truck, Calendar } from "lucide-react";

interface SupplierProfileDialogProps {
    proveedor: any;
}

export function SupplierProfileDialog({ proveedor }: SupplierProfileDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    Ver Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Perfil de Proveedor
                    </DialogTitle>
                    <DialogDescription>
                        Información comercial y bancaria.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold">{proveedor.nombre}</h3>
                            <div className="flex items-center text-muted-foreground mt-1">
                                <span className="text-sm">NIT: {proveedor.nit}</span>
                            </div>
                        </div>
                        <div className="bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                            {proveedor.categoria}
                        </div>
                    </div>

                    {/* Contact & Bank Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{proveedor.correo || "No registrado"}</span>
                        </div>

                        <div className="bg-muted p-3 rounded-md space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <CreditCard className="h-4 w-4" />
                                Datos Bancarios
                            </div>
                            <p className="text-sm pl-6 opacity-90">{proveedor.datosBancarios || "No disponibles"}</p>
                        </div>
                    </div>

                    {/* Stats Placeholder */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="border rounded p-2">
                            <p className="text-xs text-muted-foreground">Compras Totales</p>
                            <p className="font-bold text-lg">$ 45.2M</p>
                        </div>
                        <div className="border rounded p-2">
                            <p className="text-xs text-muted-foreground">Facturas Pendientes</p>
                            <p className="font-bold text-lg text-orange-500">2</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

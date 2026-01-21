"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Vehiculo, EstadoVehiculo } from "@/types/sistema";
import { format } from "date-fns";

const vehicleSchema = z.object({
    placa: z.string().min(6, "Placa requerida"),
    marcaModelo: z.string().min(3, "Marca/Modelo requerido"),
    conductorAsignado: z.string().optional(),
    estado: z.enum(['OPERATIVO', 'MANTENIMIENTO', 'INACTIVO']),
    kilometrajeActual: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Inválido"),
    ano: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 1990 && Number(val) <= 2030, "Año inválido"),
    color: z.string().min(2, "Color requerido"),
    vencimientoSoat: z.string(),
    vencimientoTecnomecanica: z.string(),
    vencimientoSeguro: z.string()
});

interface EditVehicleDialogProps {
    vehiculo: Vehiculo;
    onVehicleUpdated: (vehiculo: Vehiculo) => void;
}

export function EditVehicleDialog({ vehiculo, onVehicleUpdated }: EditVehicleDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof vehicleSchema>>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            placa: vehiculo.placa,
            marcaModelo: vehiculo.marcaModelo,
            conductorAsignado: vehiculo.conductorAsignado || "",
            estado: vehiculo.estado,
            kilometrajeActual: vehiculo.kilometrajeActual.toString(),
            ano: vehiculo.ano.toString(),
            color: vehiculo.color,
            vencimientoSoat: format(new Date(vehiculo.vencimientoSoat), "yyyy-MM-dd"),
            vencimientoTecnomecanica: format(new Date(vehiculo.vencimientoTecnomecanica), "yyyy-MM-dd"),
            vencimientoSeguro: format(new Date(vehiculo.vencimientoSeguro), "yyyy-MM-dd")
        }
    });

    useEffect(() => {
        if (open) {
            form.reset({
                placa: vehiculo.placa,
                marcaModelo: vehiculo.marcaModelo,
                conductorAsignado: vehiculo.conductorAsignado || "",
                estado: vehiculo.estado,
                kilometrajeActual: vehiculo.kilometrajeActual.toString(),
                ano: vehiculo.ano.toString(),
                color: vehiculo.color,
                vencimientoSoat: format(new Date(vehiculo.vencimientoSoat), "yyyy-MM-dd"),
                vencimientoTecnomecanica: format(new Date(vehiculo.vencimientoTecnomecanica), "yyyy-MM-dd"),
                vencimientoSeguro: format(new Date(vehiculo.vencimientoSeguro), "yyyy-MM-dd")
            });
        }
    }, [vehiculo, open, form]);

    const onSubmit = async (values: z.infer<typeof vehicleSchema>) => {
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 300));

        const updated: Vehiculo = {
            ...vehiculo,
            placa: values.placa,
            marcaModelo: values.marcaModelo,
            conductorAsignado: values.conductorAsignado || "",
            estado: values.estado as EstadoVehiculo,
            kilometrajeActual: Number(values.kilometrajeActual),
            ano: Number(values.ano),
            color: values.color,
            vencimientoSoat: new Date(values.vencimientoSoat),
            vencimientoTecnomecanica: new Date(values.vencimientoTecnomecanica),
            vencimientoSeguro: new Date(values.vencimientoSeguro)
        };

        onVehicleUpdated(updated);
        setIsSubmitting(false);
        setOpen(false);
        toast({ title: "Vehículo Actualizado", description: `${updated.placa} ha sido modificado.` });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Editar Vehículo</DialogTitle>
                    <DialogDescription>Modifique los datos del vehículo {vehiculo.placa}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="placa"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Placa</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="ABC-123" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="marcaModelo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca/Modelo</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="OPERATIVO">Operativo</SelectItem>
                                                <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                                                <SelectItem value="INACTIVO">Inactivo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ano"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Año</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="conductorAsignado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conductor Asignado</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Nombre del conductor" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="kilometrajeActual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kilometraje Actual</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="vencimientoSoat"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venc. SOAT</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vencimientoTecnomecanica"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venc. Tecno</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="vencimientoSeguro"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venc. Seguro</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="electric-button">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

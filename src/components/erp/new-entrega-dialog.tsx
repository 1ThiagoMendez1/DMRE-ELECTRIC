"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DotacionItem, Empleado, DotacionVariant } from "@/types/sistema";
import { HardHat } from "lucide-react";

interface NewEntregaDialogProps {
    items: DotacionItem[];
    empleados: Empleado[];
    onSave: (data: any) => void;
}

const formSchema = z.object({
    empleadoId: z.string().min(1, "Seleccione un empleado"),
    dotacionId: z.string().min(1, "Seleccione un item"),
    varianteId: z.string().min(1, "Seleccione una variante"),
    cantidad: z.coerce.number().min(1, "Cantidad mínima 1"),
    observacion: z.string().optional()
});

export function NewEntregaDialog({ items, empleados, onSave }: NewEntregaDialogProps) {
    const [open, setOpen] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cantidad: 1,
            observacion: ""
        }
    });

    const selectedDotacionId = form.watch("dotacionId");
    const selectedItem = items.find(i => i.id === selectedDotacionId);

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        const item = items.find(i => i.id === values.dotacionId)!;
        const variant = item.variantes.find(v => v.id === values.varianteId)!;
        const empleado = empleados.find(e => e.id === values.empleadoId)!;

        const entregaData = {
            id: `ENT-${Date.now()}`,
            fecha: new Date(),
            empleadoId: empleado.id,
            empleado: empleado,
            items: [{
                dotacionId: item.id,
                varianteId: variant.id,
                descripcion: item.descripcion,
                detalle: `${variant.talla} - ${variant.color}`,
                cantidad: values.cantidad
            }],
            estado: 'ASIGNADO', // Default status waiting for acceptance
            observacion: values.observacion || ""
        };

        onSave(entregaData);
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <HardHat className="mr-2 h-4 w-4" /> Nueva Entrega
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Entrega de Dotación</DialogTitle>
                    <DialogDescription>Asigne dotación a un empleado. Deberá ser aceptada por él.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="empleadoId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Empleado</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {empleados.map(e => (
                                                <SelectItem key={e.id} value={e.id}>{e.nombreCompleto} - {e.cargo}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dotacionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item</FormLabel>
                                        <Select onValueChange={(val) => {
                                            field.onChange(val);
                                            form.setValue("varianteId", ""); // Reset variant
                                        }} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Item..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {items.map(i => (
                                                    <SelectItem key={i.id} value={i.id}>{i.descripcion}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="varianteId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Variante</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!selectedItem}
                                        >
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Talla/Color..." /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {selectedItem?.variantes.map(v => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.talla} - {v.color} ({v.cantidadDisponible})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="cantidad"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observacion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observación</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Asignar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

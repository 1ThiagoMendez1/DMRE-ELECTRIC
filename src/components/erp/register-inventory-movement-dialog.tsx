"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight } from "lucide-react";
import { InventarioItem, TipoMovimientoInventario } from "@/types/sistema";

const formSchema = z.object({
    tipo: z.enum(["ENTRADA", "SALIDA"] as const),
    articuloId: z.string().min(1, "Seleccione un artículo"),
    cantidad: z.coerce.number().min(1, "Cantidad debe ser mayor a 0"),
    responsable: z.string().min(3, "Responsable requerido"),
    motivo: z.string().min(3, "Motivo requerido"),
});

interface RegisterInventoryMovementDialogProps {
    articulos: InventarioItem[];
    onMovementCreated: (mov: any) => void;
}

export function RegisterInventoryMovementDialog({ articulos, onMovementCreated }: RegisterInventoryMovementDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "SALIDA",
            cantidad: 1,
            responsable: "",
            motivo: ""
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const articulo = articulos.find(a => a.id === values.articuloId);

        const newMov = {
            id: `MOV-INV-${Math.floor(Math.random() * 10000)}`,
            fecha: new Date(),
            tipo: values.tipo,
            articuloId: values.articuloId,
            articulo: articulo,
            cantidad: values.cantidad,
            responsableId: values.responsable, // Using text input for now, could be employee select
            proyectoId: values.motivo // Using reason as project/reason placeholder
        };

        onMovementCreated(newMov);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <ArrowLeftRight className="mr-2 h-4 w-4" /> Registrar Movimiento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Movimiento de Inventario</DialogTitle>
                    <DialogDescription>
                        Registre entrada o salida de materiales.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="tipo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Movimiento</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ENTRADA">Entrada (Abastecimiento)</SelectItem>
                                            <SelectItem value="SALIDA">Salida (Consumo/Proyecto)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="articuloId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Artículo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione artículo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {articulos.map(a => (
                                                <SelectItem key={a.id} value={a.id}>{a.descripcion} ({a.cantidad} disp.)</SelectItem>
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
                                name="responsable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Responsable</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="motivo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Motivo / Proyecto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Proyecto Edificio Central" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Registrar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

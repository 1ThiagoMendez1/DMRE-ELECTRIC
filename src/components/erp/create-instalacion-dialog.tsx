"use client";

import { useEffect, useState } from "react";
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
import { Plus } from "lucide-react";
import { Instalacion } from "@/types/sistema";

const formSchema = z.object({
    codigo: z.string().min(3, "Código requerido"),
    descripcion: z.string().min(5, "Descripción requerida"),
    valorCalculado: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Debe ser un valor válido" }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateInstalacionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    instalacionesExistentes: Instalacion[];
    onSave: (instalacion: Omit<Instalacion, "id" | "fechaCreacion">) => void;
}

export function CreateInstalacionDialog({ open, onOpenChange, instalacionesExistentes, onSave }: CreateInstalacionDialogProps) {
    const instalacionCount = instalacionesExistentes.length;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            codigo: `IN-${(instalacionCount + 1).toString().padStart(3, '0')}`,
            descripcion: "",
            valorCalculado: "0"
        }
    });

    useEffect(() => {
        if (open) {
            form.reset({
                codigo: `IN-${(instalacionCount + 1).toString().padStart(3, '0')}`,
                descripcion: "",
                valorCalculado: "0"
            });
        }
    }, [open, instalacionCount, form]);

    const onSubmit = (values: FormValues) => {
        const val = Number(values.valorCalculado);
        const newInstalacion: Omit<Instalacion, "id" | "fechaCreacion"> = {
            codigo: values.codigo,
            descripcion: values.descripcion,
            valorCalculado: val,
            activo: true
        };

        onSave(newInstalacion);
        onOpenChange(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Instalación</DialogTitle>
                    <DialogDescription>
                        Crea un ítem de instalación rápida especificando su valor calculado fijo.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="codigo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Código Instalación</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="IN-XXX" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="valorCalculado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Calculado ($)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Descripción de la instalación" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar Instalación</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

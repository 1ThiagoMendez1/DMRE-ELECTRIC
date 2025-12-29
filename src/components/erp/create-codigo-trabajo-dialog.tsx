"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CodigoTrabajo } from "@/types/sistema";

const codigoSchema = z.object({
    codigo: z.string().min(3, "Código requerido"),
    nombre: z.string().min(5, "Nombre requerido"),
    descripcion: z.string().min(10, "Descripción requerida"),
    manoDeObra: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
});

interface CreateCodigoTrabajoDialogProps {
    onCodigoCreated: (newItem: CodigoTrabajo) => void;
}

export function CreateCodigoTrabajoDialog({ onCodigoCreated }: CreateCodigoTrabajoDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof codigoSchema>>({
        resolver: zodResolver(codigoSchema),
        defaultValues: {
            codigo: "",
            nombre: "",
            descripcion: "",
            manoDeObra: "0",
        },
    });

    const onSubmit = async (values: z.infer<typeof codigoSchema>) => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newItem: CodigoTrabajo = {
            id: `COD-${Date.now()}`,
            codigo: values.codigo,
            nombre: values.nombre,
            descripcion: values.descripcion,
            manoDeObra: Number(values.manoDeObra),
            materiales: [], // Initially empty, would add logic to add materials later if requested
            costoTotalMateriales: 0,
            costoTotal: Number(values.manoDeObra),
            fechaCreacion: new Date()
        };

        onCodigoCreated(newItem);
        toast({
            title: "Código Creado",
            description: `${newItem.codigo} agregado exitosamente.`,
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Código
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Código de Trabajo</DialogTitle>
                    <DialogDescription>
                        Defina un nuevo servicio estándar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="codigo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código Interno</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. COE-005" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Servicio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Cambio de Luminaria" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción Detallada</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describa el alcance del trabajo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="manoDeObra"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Costo Mano de Obra (Estimado)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

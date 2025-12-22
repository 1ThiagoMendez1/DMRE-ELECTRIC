"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { Cliente, TipoOferta } from "@/types/sistema";

// Schema
const formSchema = z.object({
    clienteId: z.string().min(1, "Seleccione un cliente"),
    tipo: z.enum(["NORMAL", "SIMPLIFICADA"] as const),
    descripcion: z.string().min(5, "Descripción requerida"),
    valorEstimado: z.coerce.number().min(0, "Valor positivo requerido"), // coerce number from input
});

interface CreateProjectDialogProps {
    clientes: Cliente[];
    onProjectCreated: (project: any) => void;
}

export function CreateProjectDialog({ clientes, onProjectCreated }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "NORMAL",
            descripcion: "",
            valorEstimado: 0
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const clienteObj = clientes.find(c => c.id === values.clienteId);

        const newProject = {
            id: `COT-${Math.floor(Math.random() * 10000)}`,
            numero: `CP-${Math.floor(Math.random() * 10000)}`,
            tipo: values.tipo,
            fecha: new Date(),
            clienteId: values.clienteId,
            cliente: clienteObj || { nombre: "Cliente Desconocido" },
            descripcionTrabajo: values.descripcion,
            items: [],
            subtotal: values.valorEstimado,
            aiuAdmin: 0, aiuImprevistos: 0, aiuUtilidad: 0, iva: 0,
            total: values.valorEstimado, // Simplified for creation
            estado: 'BORRADOR'
        };

        onProjectCreated(newProject);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Iniciar Nuevo Proyecto / Oferta</DialogTitle>
                    <DialogDescription>
                        Cree un borrador de oferta para un cliente existente.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="clienteId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un cliente..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clientes.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tipo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Oferta</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="NORMAL">Normal (Detallada)</SelectItem>
                                            <SelectItem value="SIMPLIFICADA">Simplificada (Rápida)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción Corta del Trabajo</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ej: Mantenimiento eléctrico sede norte..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="valorEstimado"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor Estimado (COP)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Crear Borrador</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

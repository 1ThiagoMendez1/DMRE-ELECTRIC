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
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming this exists or using simple alert

const formSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    documento: z.string().min(6, "Documento inválido"),
    correo: z.string().email("Correo electrónico inválido"),
    telefono: z.string().min(7, "Teléfono inválido"),
    direccion: z.string().min(5, "Dirección requerida"),
    contacto: z.string().min(3, "Nombre de contacto requerido"),
});

interface CreateClientDialogProps {
    onClientCreated: (client: any) => void;
}

export function CreateClientDialog({ onClientCreated }: CreateClientDialogProps) {
    const [open, setOpen] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            documento: "",
            correo: "",
            telefono: "",
            direccion: "",
            contacto: "",
        },
    });

    // 2. Define a submit handler.
    function onSubmit(values: z.infer<typeof formSchema>) {
        // In a real app, this would be an API call
        console.log(values);

        const newClient = {
            id: `CLI-${Math.floor(Math.random() * 1000)}`,
            nombre: values.nombre,
            documento: values.documento,
            correo: values.correo,
            telefono: values.telefono,
            direccion: values.direccion,
            contactoPrincipal: values.contacto,
            fechaCreacion: new Date(),
        };

        onClientCreated(newClient);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos de la empresa o persona natural.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Razón Social / Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: TechSol S.A.S" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="documento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIT / CC</FormLabel>
                                        <FormControl>
                                            <Input placeholder="900.123.456-1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefono"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teléfono</FormLabel>
                                        <FormControl>
                                            <Input placeholder="300 123 4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="correo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input placeholder="contacto@cliente.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="direccion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dirección Física</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Calle 123 # 45-67" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contacto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contacto Principal</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre del encargado" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Guardar Cliente</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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
import { Truck } from "lucide-react";

const formSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    nit: z.string().min(6, "NIT/Documento inválido"),
    categoria: z.enum(["MATERIALES", "SERVICIOS", "MIXTO"] as const),
    correo: z.string().email("Correo electrónico inválido"),
    bancoNombre: z.string().min(2, "Nombre de banco requerido"),
    bancoCuenta: z.string().min(5, "Número de cuenta requerido"),
    notas: z.string().optional(),
});

interface CreateSupplierDialogProps {
    onSupplierCreated: (supplier: any) => void;
}

export function CreateSupplierDialog({ onSupplierCreated }: CreateSupplierDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombre: "",
            nit: "",
            categoria: "MATERIALES",
            correo: "",
            bancoNombre: "",
            bancoCuenta: "",
            notas: ""
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const newSupplier = {
            id: `PROV-${Math.floor(Math.random() * 1000)}`,
            nombre: values.nombre,
            nit: values.nit,
            categoria: values.categoria,
            correo: values.correo,
            datosBancarios: `${values.bancoNombre} - ${values.bancoCuenta}`,
            notas: values.notas
        };
        try {
            await onSupplierCreated(newSupplier);
            setOpen(false);
            form.reset();
        } catch (error) {
            // El proveedor-erp ya mostró un toast con el error
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Truck className="mr-2 h-4 w-4" /> Nuevo Proveedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
                    <DialogDescription>
                        Ingrese los datos del nuevo proveedor o contratista.
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
                                        <Input placeholder="Ej: Materiales Eléctricos SAS" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>NIT / Documento</FormLabel>
                                        <FormControl>
                                            <Input placeholder="1075652553-9" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MATERIALES">Materiales</SelectItem>
                                                <SelectItem value="SERVICIOS">Servicios</SelectItem>
                                                <SelectItem value="MIXTO">Mixto</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        <Input type="email" placeholder="contacto@proveedor.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bancoNombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Banco</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Bancolombia" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="bancoCuenta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Cuenta</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: 123456789 (Ahorros)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="notas"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas / Observaciones</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: No atiende los lunes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit">Crear Proveedor</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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
import { useToast } from "@/hooks/use-toast";
import { RegistroObra } from "@/types/sistema";
import { initialClients } from "@/lib/mock-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const obraSchema = z.object({
    nombreObra: z.string().min(5, "Nombre requerido"),
    clienteId: z.string().min(1, "Cliente requerido"),
    valorTotal: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Inválido" }),
});

interface CreateObraDialogProps {
    onObraCreated: (newObra: RegistroObra) => void;
}

export function CreateObraDialog({ onObraCreated }: CreateObraDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof obraSchema>>({
        resolver: zodResolver(obraSchema),
        defaultValues: {
            nombreObra: "",
            clienteId: "",
            valorTotal: "0",
        },
    });

    const onSubmit = async (values: z.infer<typeof obraSchema>) => {
        await new Promise((resolve) => setTimeout(resolve, 800));

        const cliente = initialClients.find(c => c.id === values.clienteId);
        if (!cliente) return;

        const newObra: RegistroObra = {
            id: `REG-${Date.now()}`,
            cotizacionId: `COT-${Date.now()}`, // Dummy ID
            fechaInicio: new Date(),
            estado: 'PENDIENTE',
            anticipos: [],
            saldoPendiente: Number(values.valorTotal),
            nombreObra: values.nombreObra,
            cliente: cliente.nombre,
            valorTotal: Number(values.valorTotal),
            cotizacion: {
                id: `COT-${Date.now()}`,
                numero: `COT-${Math.floor(Math.random() * 1000)}`,
                fecha: new Date(),
                cliente: cliente,
                items: [],
                total: Number(values.valorTotal),
                estado: 'EN_EJECUCION',
                descripcionTrabajo: values.nombreObra
            } as any
        };

        onObraCreated(newObra);
        toast({
            title: "Obra Creada",
            description: `${newObra.nombreObra} registrada exitosamente.`,
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Obra
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nueva Obra</DialogTitle>
                    <DialogDescription>
                        Cree un nuevo registro de obra manualmente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nombreObra"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la Obra</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Instalación Eléctrica..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="clienteId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione Cliente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {initialClients.map(client => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="valorTotal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor Total del Contrato</FormLabel>
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

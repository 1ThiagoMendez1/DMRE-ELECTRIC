"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const quoteSchema = z.object({
    descripcionTrabajo: z.string().min(5, "Descripción requerida"),
    estado: z.enum(['PENDIENTE', 'APROBADA', 'NO_APROBADA', 'EN_EJECUCION', 'FINALIZADA']),
    total: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Valor inválido",
    }),
});

interface EditQuoteDialogProps {
    cotizacion: any;
    onQuoteUpdated: (updatedQuote: any) => void;
}

export function EditQuoteDialog({ cotizacion, onQuoteUpdated }: EditQuoteDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof quoteSchema>>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            descripcionTrabajo: cotizacion.descripcionTrabajo,
            estado: cotizacion.estado,
            total: cotizacion.total.toString(),
        },
    });

    const onSubmit = async (values: z.infer<typeof quoteSchema>) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const updated = {
            ...cotizacion,
            descripcionTrabajo: values.descripcionTrabajo,
            estado: values.estado,
            total: Number(values.total),
        };

        onQuoteUpdated(updated);
        toast({
            title: "Cotización Actualizada",
            description: `Se han guardado los cambios para ${cotizacion.numero}`,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    Editar Oferta
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Cotización {cotizacion.numero}</DialogTitle>
                    <DialogDescription>
                        Modifique los detalles principales de la oferta.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="descripcionTrabajo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción del Trabajo</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Estado actual" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                                <SelectItem value="APROBADA">Aprobada</SelectItem>
                                                <SelectItem value="NO_APROBADA">No Aprobada</SelectItem>
                                                <SelectItem value="EN_EJECUCION">En Ejecución</SelectItem>
                                                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Total (Estimado)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
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

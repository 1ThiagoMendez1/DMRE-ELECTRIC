"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Pencil, Save } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";

const invoiceSchema = z.object({
    numeroFactura: z.string().min(1, "El número de factura es requerido"),
    fechaEmision: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    fechaVencimiento: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Fecha inválida",
    }),
    estado: z.enum(["PENDIENTE", "PARCIAL", "CANCELADA"]),
});

interface EditInvoiceDialogProps {
    factura: any;
    onInvoiceUpdated: (updatedInvoice: any) => void;
}

export function EditInvoiceDialog({ factura, onInvoiceUpdated }: EditInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof invoiceSchema>>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            numeroFactura: factura.id, // Using ID as number for initial value often
            fechaEmision: format(new Date(factura.fechaEmision), "yyyy-MM-dd"),
            fechaVencimiento: format(new Date(factura.fechaVencimiento), "yyyy-MM-dd"),
            estado: factura.estado,
        },
    });

    const onSubmit = async (values: z.infer<typeof invoiceSchema>) => {
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API

        const updatedInvoice = {
            ...factura,
            id: values.numeroFactura, // Updating the ID/Number as requested
            fechaEmision: new Date(values.fechaEmision),
            fechaVencimiento: new Date(values.fechaVencimiento),
            estado: values.estado,
        };

        onInvoiceUpdated(updatedInvoice);
        toast({
            title: "Factura Actualizada",
            description: `La factura ${values.numeroFactura} ha sido modificada.`,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Factura</DialogTitle>
                    <DialogDescription>
                        Modifique los detalles de la factura y estado de cartera.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="numeroFactura"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>N° Factura (Editable)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fechaEmision"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Emisión</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fechaVencimiento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vencimiento</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="estado"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado de Cartera</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione estado" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                                            <SelectItem value="PARCIAL">Pago Parcial</SelectItem>
                                            <SelectItem value="CANCELADA">Pagada (Cancelada)</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

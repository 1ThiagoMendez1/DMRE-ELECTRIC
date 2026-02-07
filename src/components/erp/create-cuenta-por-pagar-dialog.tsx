"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { useErp } from "@/components/providers/erp-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const cxpSchema = z.object({
    proveedorId: z.string().min(1, "Seleccione un proveedor"),
    numeroFacturaProveedor: z.string().min(1, "Número de factura requerido"),
    fecha: z.string().min(1, "Fecha de factura requerida"),
    fechaVencimiento: z.string().optional(),
    concepto: z.string().min(3, "Concepto requerido"),
    valorTotal: z.preprocess((val) => Number(val), z.number().min(1, "El valor debe ser mayor a 0")),
    observaciones: z.string().optional(),
});

interface CreateCuentaPorPagarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateCuentaPorPagarDialog({ open, onOpenChange }: CreateCuentaPorPagarDialogProps) {
    const { proveedores, addCuentaPorPagar } = useErp();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof cxpSchema>>({
        resolver: zodResolver(cxpSchema),
        defaultValues: {
            proveedorId: "",
            numeroFacturaProveedor: "",
            fecha: new Date().toISOString().split('T')[0],
            concepto: "",
            valorTotal: 0,
            observaciones: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof cxpSchema>) => {
        try {
            const proveedor = proveedores.find(p => p.id === values.proveedorId);
            if (!proveedor) throw new Error("Proveedor no encontrado");

            await addCuentaPorPagar({
                proveedorId: values.proveedorId,
                proveedor: proveedor,
                numeroFacturaProveedor: values.numeroFacturaProveedor,
                fecha: new Date(values.fecha),
                fechaVencimiento: values.fechaVencimiento ? new Date(values.fechaVencimiento) : undefined,
                concepto: values.concepto,
                valorTotal: values.valorTotal,
                valorPagado: 0,
                saldoPendiente: values.valorTotal,
                estado: "PENDIENTE",
                observaciones: values.observaciones,
            });

            toast({
                title: "Cuenta por Pagar creada",
                description: "La cuenta ha sido registrada correctamente.",
            });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating CxP:", error);
            toast({
                title: "Error",
                description: "No se pudo crear la cuenta por pagar.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva Cuenta por Pagar</DialogTitle>
                    <DialogDescription>
                        Registre una nueva factura o cuenta pendiente con un proveedor.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="proveedorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Proveedor</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar proveedor" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {proveedores.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.nombre}
                                                </SelectItem>
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
                                name="numeroFacturaProveedor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>N° Factura / Ref</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: INV-123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="valorTotal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Total</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Emisión</FormLabel>
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
                            name="concepto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Compra de materiales eléctricos" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observaciones"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Registrar Cuenta
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

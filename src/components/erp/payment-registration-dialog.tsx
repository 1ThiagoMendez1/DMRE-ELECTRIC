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
import { useErp } from "@/components/providers/erp-provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const paymentSchema = z.object({
    monto: z.preprocess((val) => Number(val), z.number().min(1, "El monto debe ser mayor a 0")),
    fecha: z.string().min(1, "Fecha requerida"),
    cuentaBancariaId: z.string().min(1, "Seleccione una cuenta de origen"),
    nota: z.string().optional(),
});

interface PaymentRegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cxp: any | null;
}

export function PaymentRegistrationDialog({ open, onOpenChange, cxp }: PaymentRegistrationDialogProps) {
    const { cuentasBancarias, payCuentaPorPagar } = useErp();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            monto: cxp?.saldoPendiente || 0,
            fecha: new Date().toISOString().split('T')[0],
            cuentaBancariaId: "",
            nota: "",
        },
    });

    // Update monto when cxp changes
    if (open && form.getValues("monto") === 0 && cxp?.saldoPendiente > 0) {
        form.setValue("monto", cxp.saldoPendiente);
    }

    const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
        if (!cxp) return;

        try {
            if (values.monto > cxp.saldoPendiente) {
                form.setError("monto", { message: "El abono no puede superar el saldo pendiente" });
                return;
            }

            await payCuentaPorPagar(
                cxp.id,
                values.cuentaBancariaId,
                values.monto,
                new Date(values.fecha),
                values.nota
            );

            toast({
                title: "Pago registrado",
                description: `Se ha registrado un abono de ${formatCurrency(values.monto)}`,
            });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Error registering payment:", error);
            toast({
                title: "Error",
                description: "No se pudo registrar el pago.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar Pago / Abono</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del pago para la factura <strong>{cxp?.numeroFacturaProveedor}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/40 p-3 rounded-md mb-4 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Saldo Pendiente:</span>
                    <span className="font-bold text-red-600">{formatCurrency(cxp?.saldoPendiente || 0)}</span>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="monto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor a Pagar</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="cuentaBancariaId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cuenta de Origen</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar cuenta" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cuentasBancarias.map((cta) => (
                                                <SelectItem key={cta.id} value={cta.id}>
                                                    {cta.nombre} ({formatCurrency(cta.saldoActual)})
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
                            name="fecha"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Pago</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nota"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nota / Referencia</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Transferencia #8822" {...field} />
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
                                Confirmar Pago
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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
import { Plus } from "lucide-react";
import { CuentaBancaria, TipoMovimiento, CategoriaMovimiento } from "@/types/sistema";

const formSchema = z.object({
    tipo: z.enum(["INGRESO", "EGRESO"] as const),
    cuentaId: z.string().min(1, "Seleccione una cuenta"),
    categoria: z.string().min(1, "Categoría requerida"),
    tercero: z.string().min(3, "Tercero requerido"),
    concepto: z.string().min(3, "Concepto requerido"),
    valor: z.coerce.number().min(1, "Valor debe ser mayor a 0"),
});

interface CreateTransactionDialogProps {
    cuentas: CuentaBancaria[];
    onTransactionCreated: (tx: any) => void;
}

export function CreateTransactionDialog({ cuentas, onTransactionCreated }: CreateTransactionDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "EGRESO",
            categoria: "OTROS",
            concepto: "",
            valor: 0,
            tercero: ""
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const cuenta = cuentas.find(c => c.id === values.cuentaId);

        const newTx = {
            id: `MOV-${Math.floor(Math.random() * 10000)}`,
            fecha: new Date(),
            tipo: values.tipo,
            cuentaId: values.cuentaId,
            cuenta: cuenta,
            categoria: values.categoria as CategoriaMovimiento,
            tercero: values.tercero,
            concepto: values.concepto,
            valor: values.valor
        };

        onTransactionCreated(newTx);
        setOpen(false);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Registrar Movimiento
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Transacción</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del ingreso o egreso.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="INGRESO">Ingreso</SelectItem>
                                                <SelectItem value="EGRESO">Egreso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cuentaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cuenta</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione cuenta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {cuentas.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                            {/* Simplified categories */}
                                            <SelectItem value="VENTAS">Ventas</SelectItem>
                                            <SelectItem value="NOMINA">Nómina</SelectItem>
                                            <SelectItem value="PROVEEDORES">Proveedores</SelectItem>
                                            <SelectItem value="SERVICIOS">Servicios</SelectItem>
                                            <SelectItem value="IMPUESTOS">Impuestos</SelectItem>
                                            <SelectItem value="OTROS">Otros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tercero"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tercero (Beneficiario/Pagador)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre del tercero" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="concepto"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Concepto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Descripción del movimiento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="valor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Registrar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

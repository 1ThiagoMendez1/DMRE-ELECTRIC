"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this or will use Input
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Schema
const expenseSchema = z.object({
    fecha: z.date({
        required_error: "La fecha es requerida.",
    }),
    vehiculoId: z.string({
        required_error: "Seleccione un vehículo.",
    }),
    tipo: z.string({
        required_error: "Seleccione un tipo de gasto.",
    }),
    valor: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El valor debe ser positivo.",
    }),
    proveedor: z.string().min(2, "El proveedor es requerido"),
    kilometraje: z.string().optional(),
    notas: z.string().optional(),
});

interface RegisterExpenseDialogProps {
    vehiculos: any[];
    onExpenseCreated: (expense: any) => void;
}

export function RegisterExpenseDialog({ vehiculos, onExpenseCreated }: RegisterExpenseDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            fecha: new Date(),
            valor: "",
            proveedor: "",
            kilometraje: "",
            notas: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const vehicle = vehiculos.find(v => v.id === values.vehiculoId);

        const newExpense = {
            id: `GST-${Math.floor(Math.random() * 10000)}`,
            fecha: values.fecha,
            vehiculo: {
                id: values.vehiculoId,
                placa: vehicle ? vehicle.placa : "UNK",
            },
            tipo: values.tipo,
            valor: Number(values.valor),
            proveedor: values.proveedor,
            kilometraje: values.kilometraje ? Number(values.kilometraje) : undefined,
        };

        onExpenseCreated(newExpense);
        toast({
            title: "Gasto registrado",
            description: `Se ha registrado el gasto de ${newExpense.vehiculo.placa} por $${newExpense.valor}`,
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Gasto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Gasto Operativo</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del gasto, mantenimiento o combustible.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha del Gasto</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Seleccionar fecha</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date > new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="vehiculoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehículo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione placa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {vehiculos.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.placa} - {v.marcaModelo}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Gasto</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="COMBUSTIBLE">Combustible</SelectItem>
                                                <SelectItem value="MANTENIMIENTO_PREVENTIVO">Mant. Preventivo</SelectItem>
                                                <SelectItem value="MANTENIMIENTO_CORRECTIVO">Mant. Correctivo</SelectItem>
                                                <SelectItem value="DOCUMENTACION">Documentación (SOAT/Imp)</SelectItem>
                                                <SelectItem value="LAVADO">Lavado / Aseo</SelectItem>
                                                <SelectItem value="PEAJES">Peajes / Parqueadero</SelectItem>
                                                <SelectItem value="OTROS">Otros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="valor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Total</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 50000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="proveedor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Proveedor / Estación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Terpel La 80" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="kilometraje"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kilometraje (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 15400" {...field} />
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
                                Registrar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

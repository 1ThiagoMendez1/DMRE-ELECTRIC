"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

// Schema
const novedadSchema = z.object({
    fecha: z.date({
        required_error: "La fecha es requerida.",
    }),
    empleadoId: z.string({
        required_error: "Seleccione un empleado.",
    }),
    tipo: z.string({
        required_error: "Seleccione un tipo de novedad.",
    }),
    cantidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "La cantidad debe ser positiva.",
    }),
    valorUnitario: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "El valor unitario debe ser válido.",
    }),
    observaciones: z.string().optional(),
});

interface RegisterNovedadDialogProps {
    empleados: any[];
    onNovedadCreated: (novedad: any) => void;
}

export function RegisterNovedadDialog({ empleados, onNovedadCreated }: RegisterNovedadDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof novedadSchema>>({
        resolver: zodResolver(novedadSchema),
        defaultValues: {
            fecha: new Date(),
            cantidad: "1",
            valorUnitario: "0",
            observaciones: "",
        },
    });

    // Auto-calculate base rate based on employee salary if selected (Mock logic)
    const selectedEmpleadoId = form.watch("empleadoId");
    useEffect(() => {
        if (selectedEmpleadoId) {
            const emp = empleados.find(e => e.id === selectedEmpleadoId);
            if (emp) {
                // Assume 240 hours month work (30 days * 8 hours)
                const hourlyRate = Math.round(emp.salarioBase / 240);
                form.setValue("valorUnitario", hourlyRate.toString());
            }
        }
    }, [selectedEmpleadoId, empleados, form]);

    const onSubmit = async (values: z.infer<typeof novedadSchema>) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        const rate = Number(values.valorUnitario);
        const qty = Number(values.cantidad);
        let valorCalculado = qty * rate;

        // Deduction Logic
        const isDeduction = ['AUSENCIA_INJUS', 'LICENCIA_NO_REM', 'SANCION', 'PRESTAMO'].includes(values.tipo);
        const efecto = isDeduction ? 'RESTA' : 'SUMA';

        // Recargo logic (example: Recargo Nocturno = 35% extra, assuming rate is base)
        // Check if rate provided is "Extra Value" or "Full Value". Assuming Full Value here for simplicity.
        // If user inputs the surcharge value directly, we use that.

        const newNovedad = {
            id: `NOV-${Math.floor(Math.random() * 10000)}`,
            fecha: values.fecha,
            empleadoId: values.empleadoId,
            tipo: values.tipo,
            cantidad: qty,
            valorUnitario: rate,
            valorCalculado: valorCalculado,
            efecto: efecto,
        };

        onNovedadCreated(newNovedad);
        toast({
            title: "Novedad registrada",
            description: `Se ha registrado ${formatCurrency(valorCalculado)} (${efecto}) para el empleado.`,
        });
        setOpen(false);
        form.reset({
            fecha: new Date(),
            cantidad: "1",
            valorUnitario: "0",
            observaciones: ""
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Novedad
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Registrar Novedad de Nómina</DialogTitle>
                    <DialogDescription>
                        Ingrese horas extras, recargos, o deducciones. El valor se calculará automáticamente.
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
                                        <FormLabel>Fecha del Evento</FormLabel>
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
                                name="empleadoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Empleado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione nombre" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {empleados.map((e) => (
                                                    <SelectItem key={e.id} value={e.id}>
                                                        {e.nombreCompleto}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo"
                                render={({ field }) => (
                                    <FormItem className="col-span-1">
                                        <FormLabel>Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="HE_DIURNA">H.E. Diurna</SelectItem>
                                                <SelectItem value="HE_NOCTURNA">H.E. Nocturna</SelectItem>
                                                <SelectItem value="HE_DOM_FES">H.E. Dom/Fes</SelectItem>
                                                <SelectItem value="RECARGO_NOCTURNO">Recargo Nocturno</SelectItem>
                                                <SelectItem value="BONIFICACION">Bonificación</SelectItem>
                                                <SelectItem value="AUSENCIA_INJUS">Ausencia (Deducción)</SelectItem>
                                                <SelectItem value="INCAPACIDAD">Incapacidad</SelectItem>
                                                <SelectItem value="LICENCIA_NO_REM">Licencia NR (Deducción)</SelectItem>
                                                <SelectItem value="PRESTAMO">Préstamo (Deducción)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cantidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cant (Horas/Días)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 8" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="valorUnitario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor por Hora/Día</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="bg-muted p-3 rounded-md text-sm flex justify-between items-center">
                            <span>Total Estimado:</span>
                            <span className="font-bold text-lg">
                                {formatCurrency(Number(form.watch("cantidad")) * Number(form.watch("valorUnitario")))}
                            </span>
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

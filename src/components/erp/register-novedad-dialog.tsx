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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
            cantidad: "",
            observaciones: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof novedadSchema>) => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simple calculation logic for demo
        const rate = 10000; // hourly/daily base rate
        let valorCalculado = Number(values.cantidad) * rate;
        if (values.tipo === 'AUSENCIA_INJUS' || values.tipo === 'LICENCIA_NO_REM') {
            valorCalculado = 0; // Deduction logic handled elsewhere usually
        }

        const newNovedad = {
            id: `NOV-${Math.floor(Math.random() * 10000)}`,
            fecha: values.fecha,
            empleadoId: values.empleadoId,
            tipo: values.tipo,
            cantidad: Number(values.cantidad),
            valorCalculado: valorCalculado
        };

        onNovedadCreated(newNovedad);
        toast({
            title: "Novedad registrada",
            description: `Se ha registrado la novedad para el empleado.`,
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Novedad
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Registrar Novedad de Nómina</DialogTitle>
                    <DialogDescription>
                        Ingrese horas extras, recargos, ausencias o licencias.
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo Novedad</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Categoría" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="HE_DIURNA">Hora Extra Diurna</SelectItem>
                                                <SelectItem value="HE_NOCTURNA">Hora Extra Nocturna</SelectItem>
                                                <SelectItem value="HE_DOM_FES">Hora Extra Dom/Fes</SelectItem>
                                                <SelectItem value="RECARGO_NOCTURNO">Recargo Nocturno</SelectItem>
                                                <SelectItem value="AUSENCIA_INJUS">Ausencia Injustificada</SelectItem>
                                                <SelectItem value="INCAPACIDAD">Incapacidad</SelectItem>
                                                <SelectItem value="LICENCIA_REM">Licencia Remunerada</SelectItem>
                                                <SelectItem value="LICENCIA_NO_REM">Licencia No Remunerada</SelectItem>
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
                                        <FormLabel>Cantidad (Horas/Días)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 2" {...field} />
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

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
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
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
    descripcion: z.string().optional(), // Added descripcion
});

interface NovedadDialogProps {
    empleados: any[];
    onNovedadSaved: (novedad: any) => void;
    novedadToEdit?: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NovedadDialog({ empleados, onNovedadSaved, novedadToEdit, open, onOpenChange }: NovedadDialogProps) {
    const { toast } = useToast();
    const isEditing = !!novedadToEdit;

    const form = useForm<z.infer<typeof novedadSchema>>({
        resolver: zodResolver(novedadSchema),
        defaultValues: {
            fecha: new Date(),
            cantidad: "1",
            valorUnitario: "0",
            observaciones: "",
            descripcion: "",
        },
    });

    // Reset when opening/changing selection
    useEffect(() => {
        if (open) {
            if (novedadToEdit) {
                form.reset({
                    fecha: new Date(novedadToEdit.fecha),
                    empleadoId: novedadToEdit.empleadoId,
                    tipo: novedadToEdit.tipo,
                    cantidad: String(novedadToEdit.cantidad),
                    valorUnitario: String(novedadToEdit.valorUnitario),
                    observaciones: novedadToEdit.observaciones || "", // Correct key
                    descripcion: novedadToEdit.descripcion || "", // Correct key
                });
            } else {
                form.reset({
                    fecha: new Date(),
                    cantidad: "1",
                    valorUnitario: "0",
                    observaciones: "",
                    descripcion: "",
                    empleadoId: undefined,
                    tipo: undefined
                });
            }
        }
    }, [open, novedadToEdit, form]);

    // Auto-calculate base rate based on employee salary if selected
    const selectedEmpleadoId = form.watch("empleadoId");
    useEffect(() => {
        if (!isEditing && selectedEmpleadoId) {
            const emp = empleados.find(e => e.id === selectedEmpleadoId);
            if (emp) {
                // Assume 240 hours month work (30 days * 8 hours)
                const hourlyRate = Math.round(emp.salarioBase / 240);
                form.setValue("valorUnitario", hourlyRate.toString());
            }
        }
    }, [selectedEmpleadoId, empleados, form, isEditing]);

    const onSubmit = async (values: z.infer<typeof novedadSchema>) => {
        const rate = Number(values.valorUnitario);
        const qty = Number(values.cantidad);
        let valorCalculado = qty * rate;

        // Deduction Logic
        const isDeduction = ['AUSENCIA_INJUS', 'LICENCIA_NO_REM', 'SANCION', 'PRESTAMO'].includes(values.tipo);
        const efecto = isDeduction ? 'RESTA' : 'SUMA';

        const novedadData = {
            id: novedadToEdit?.id,
            fecha: values.fecha,
            empleadoId: values.empleadoId,
            tipo: values.tipo,
            cantidad: qty,
            valorUnitario: rate,
            valorTotal: valorCalculado,
            valorCalculado: valorCalculado,
            efecto: efecto,
            observaciones: values.observaciones, // Updated to plural
            descripcion: values.descripcion, // Added
            estado: isEditing ? novedadToEdit.estado : 'PENDIENTE' // Maintain or Default
        };

        try {
            await onNovedadSaved(novedadData); // Parent handles async action
            toast({
                title: isEditing ? "Novedad actualizada" : "Novedad registrada",
                description: `Se ha ${isEditing ? 'actualizado' : 'registrado'} ${formatCurrency(valorCalculado)} (${efecto}).`,
            });
            onOpenChange(false);
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar la novedad.", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Novedad" : "Registrar Novedad"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifique los detalles de la novedad." : "Ingrese horas extras, recargos, o deducciones."}
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditing}>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Descripción / Concepto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Trabajo extra proyecto X" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="observaciones"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Observaciones Detalladas</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Detalles adicionales..." {...field} />
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
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Guardar Cambios" : "Registrar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

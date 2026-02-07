"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Upload, FileText, X, Edit2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { GastoVehiculo } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";
import { useEffect } from "react";

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
import { cn, formatCurrency } from "@/lib/utils";

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
    cuentaId: z.string().optional(),
});

interface RegisterExpenseDialogProps {
    vehiculos: any[];
    cuentas: any[];
    onExpenseCreated?: (expense: any, cuentaId?: string) => void;
    gasto?: GastoVehiculo;
}

export function RegisterExpenseDialog({ vehiculos, cuentas, onExpenseCreated, gasto }: RegisterExpenseDialogProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [soporteUrl, setSoporteUrl] = useState<string | "">(gasto?.soporteUrl || "");
    const [fileName, setFileName] = useState<string | "">(gasto?.soporteUrl ? "Soporte cargado" : "");
    const { toast } = useToast();
    const { updateGastoVehiculo } = useErp();
    const supabase = createClient();

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            fecha: gasto ? new Date(gasto.fecha) : new Date(),
            vehiculoId: gasto?.vehiculoId || "",
            tipo: gasto?.tipo || "",
            valor: gasto ? String(gasto.valor) : "",
            proveedor: gasto?.proveedor || "",
            kilometraje: gasto?.kilometraje ? String(gasto.kilometraje) : "",
            notas: gasto?.observaciones || gasto?.descripcion || "",
            cuentaId: "",
        },
    });

    // Reset form when gasto changes (for edit mode in same dialog instance)
    useEffect(() => {
        if (gasto) {
            form.reset({
                fecha: new Date(gasto.fecha),
                vehiculoId: gasto.vehiculoId,
                tipo: gasto.tipo,
                valor: String(gasto.valor),
                proveedor: gasto.proveedor,
                kilometraje: gasto.kilometraje ? String(gasto.kilometraje) : "",
                notas: gasto.observaciones || gasto.descripcion || "",
                cuentaId: "",
            });
            setSoporteUrl(gasto.soporteUrl || "");
            setFileName(gasto.soporteUrl ? "Soporte cargado" : "");
        }
    }, [gasto, form]);

    const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
        const vehicle = vehiculos.find(v => v.id === values.vehiculoId);

        if (gasto) {
            // Update mode
            const updatedExpense: GastoVehiculo = {
                ...gasto,
                fecha: values.fecha,
                vehiculoId: values.vehiculoId,
                tipo: values.tipo as any,
                valor: Number(values.valor),
                proveedor: values.proveedor,
                kilometraje: values.kilometraje ? Number(values.kilometraje) : 0,
                soporteUrl: soporteUrl,
                observaciones: values.notas,
                descripcion: values.notas,
            };

            await updateGastoVehiculo(updatedExpense);
            toast({
                title: "Gasto actualizado",
                description: `Se ha actualizado el gasto de ${vehicle?.placa || 'vehículo'}`,
            });
        } else {
            // Create mode
            const newExpense = {
                id: `GST-${Math.floor(Math.random() * 10000)}`,
                fecha: values.fecha,
                vehiculoId: values.vehiculoId,
                vehiculo: {
                    id: values.vehiculoId,
                    placa: vehicle ? vehicle.placa : "UNK",
                } as any,
                tipo: values.tipo as any,
                valor: Number(values.valor),
                proveedor: values.proveedor,
                kilometraje: values.kilometraje ? Number(values.kilometraje) : 0,
                soporteUrl: soporteUrl,
                observaciones: values.notas,
                descripcion: values.notas,
            };

            if (onExpenseCreated) {
                onExpenseCreated(newExpense, values.cuentaId);
            }
            toast({
                title: "Gasto registrado",
                description: `Se ha registrado el gasto de ${newExpense.vehiculo.placa} por $${newExpense.valor}`,
            });
        }

        setOpen(false);
        if (!gasto) {
            form.reset();
            setSoporteUrl("");
            setFileName("");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const vehiculoId = form.getValues("vehiculoId");
        if (!vehiculoId) {
            toast({ title: "Error", description: "Seleccione un vehículo primero", variant: "destructive" });
            return;
        }

        const vehicle = vehiculos.find(v => v.id === vehiculoId);
        const placa = vehicle?.placa || "UNK";

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const path = `gastos/${placa}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Archivos Carros')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('Archivos Carros')
                .getPublicUrl(path);

            setSoporteUrl(publicUrl);
            setFileName(file.name);
            toast({ title: "Archivo cargado" });
        } catch (error: any) {
            toast({ title: "Error al cargar", description: error.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={gasto ? "ghost" : "default"} size={gasto ? "icon" : "default"}>
                    {gasto ? (
                        <Edit2 className="h-4 w-4" />
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar Gasto
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{gasto ? "Editar Gasto" : "Registrar Gasto Operativo"}</DialogTitle>
                    <DialogDescription>
                        {gasto ? "Modifique los detalles del gasto registrado." : "Ingrese los detalles del gasto, mantenimiento o combustible."}
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
                            <FormField
                                control={form.control}
                                name="cuentaId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pagar desde (Opcional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione cuenta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NO_CASH">Solo registro (Sin movimiento)</SelectItem>
                                                {cuentas.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.nombre} ({formatCurrency(c.saldoActual)})
                                                    </SelectItem>
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
                            name="notas"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas / Observaciones</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales del gasto..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Soporte de Gasto (Foto/PDF)</FormLabel>
                            <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                                {soporteUrl ? (
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-5 w-5 text-primary shrink-0" />
                                            <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => { setSoporteUrl(""); setFileName(""); }}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="relative w-full text-center py-2">
                                        <div className="flex flex-col items-center gap-1 cursor-pointer">
                                            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                                            <span className="text-xs font-medium">{isUploading ? 'Subiendo...' : 'Haga clic para subir soporte'}</span>
                                        </div>
                                        <Input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {gasto ? "Guardar Cambios" : "Registrar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

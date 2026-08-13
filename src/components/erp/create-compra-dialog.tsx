"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Upload, FileText, X, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { CompraFinanciera, Cotizacion } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";

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
    FormDescription,
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

const compraSchema = z.object({
    cotizacionId: z.string().optional(),
    cotizacionProveedorId: z.string().optional(),
    numeroFactura: z.string().min(1, "El número de factura es requerido."),
    iva: z.string().refine((val) => !isNaN(Number(val)), { message: "IVA debe ser un número." }),
    valorFactura: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El valor de la factura debe ser positivo.",
    }),
    fecha: z.date({
        required_error: "La fecha es requerida.",
    }),
    valorPago: z.string().refine((val) => !isNaN(Number(val)), { message: "Valor de pago debe ser un número." }),
    fechaPago: z.date().optional(),
    diasCredito: z.string().refine((val) => !isNaN(Number(val)), { message: "Días debe ser un número." }),
    metodoPago: z.string().optional(),
    cuentaId: z.string().optional().or(z.literal("")),
    cuotas: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "El número de cuotas debe ser al menos 1.",
    }),
}).superRefine((data, ctx) => {
    if (Number(data.valorPago) > 0 && (!data.cuentaId || data.cuentaId === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Seleccione una cuenta bancaria de origen para el pago registrado.",
            path: ["cuentaId"],
        });
    }
});

interface CreateCompraDialogProps {
    compra?: CompraFinanciera;
}

export function CreateCompraDialog({ compra }: CreateCompraDialogProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [soporteUrl, setSoporteUrl] = useState<string | "">(compra?.soporteUrl || "");
    const [fileName, setFileName] = useState<string | "">(compra?.soporteUrl ? "Soporte cargado" : "");
    const { toast } = useToast();
    const { addCompraFinanciera, updateCompraFinanciera, cotizaciones, cotizacionesProveedor, cuentasBancarias } = useErp();
    const supabase = createClient();

    // Filter approved supplier quotes (CM-XXXX)
    const approvedSupplierQuotes = cotizacionesProveedor.filter(cp => cp.estado === 'APROBADA');

    // Approved client quotes (Offers)
    const approvedQuotes = cotizaciones.filter(c => 
        c.estado === 'APROBADA' || c.estado === 'EN_EJECUCION' || c.estado === 'FINALIZADA'
    );

    const form = useForm<z.infer<typeof compraSchema>>({
        resolver: zodResolver(compraSchema),
        defaultValues: {
            cotizacionId: compra?.cotizacionId || "",
            cotizacionProveedorId: compra?.cotizacionProveedorId || "",
            numeroFactura: compra?.numeroFactura || "",
            iva: compra ? String(compra.iva) : "0",
            valorFactura: compra ? String(compra.valorFactura) : "",
            fecha: compra ? new Date(compra.fecha) : new Date(),
            valorPago: compra ? String(compra.valorPago) : "0",
            fechaPago: compra?.fechaPago ? new Date(compra.fechaPago) : undefined,
            diasCredito: compra ? String(compra.diasCredito) : "0",
            metodoPago: compra?.metodoPago || "TRANSFERENCIA",
            cuentaId: "",
            cuotas: compra ? String(compra.cuotas) : "1",
        },
    });

    useEffect(() => {
        if (compra && open) {
            form.reset({
                cotizacionId: compra.cotizacionId,
                cotizacionProveedorId: compra.cotizacionProveedorId,
                numeroFactura: compra.numeroFactura,
                iva: String(compra.iva),
                valorFactura: String(compra.valorFactura),
                fecha: new Date(compra.fecha),
                valorPago: String(compra.valorPago),
                fechaPago: compra.fechaPago ? new Date(compra.fechaPago) : undefined,
                diasCredito: String(compra.diasCredito),
                metodoPago: compra.metodoPago,
                cuentaId: "",
                cuotas: String(compra.cuotas || 1),
            });
            setSoporteUrl(compra.soporteUrl || "");
            setFileName(compra.soporteUrl ? "Soporte cargado" : "");
        }
    }, [compra, open, form]);

    const onSubmit = async (values: z.infer<typeof compraSchema>) => {
        const data = {
            cotizacionId: values.cotizacionId === "sin_oferta" ? undefined : (values.cotizacionId || undefined),
            cotizacionProveedorId: values.cotizacionProveedorId || undefined,
            numeroFactura: values.numeroFactura,
            iva: Number(values.iva),
            valorFactura: Number(values.valorFactura),
            fecha: values.fecha,
            valorPago: Number(values.valorPago),
            fechaPago: values.fechaPago,
            diasCredito: Number(values.diasCredito),
            metodoPago: values.metodoPago,
            cuentaId: values.cuentaId || undefined,
            soporteUrl: soporteUrl,
            cuotas: Number(values.cuotas),
        };

        try {
            if (compra) {
                await updateCompraFinanciera(compra.id, data);
            } else {
                await addCompraFinanciera(data);
            }
            setOpen(false);
            if (!compra) {
                form.reset();
                setSoporteUrl("");
                setFileName("");
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo guardar la compra", variant: "destructive" });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const path = `compras/${Date.now()}.${fileExt}`;

            // Try using 'imagenes' bucket which we know exists
            const { error: uploadError } = await supabase.storage
                .from('imagenes')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes')
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
                <Button variant={compra ? "ghost" : "default"}>
                    {compra ? "Editar" : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Compra
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{compra ? "Editar Compra" : "Registrar Nueva Compra"}</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la factura del proveedor vinculada a una oferta aprobada.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cotizacionId"
                                render={({ field }) => (
                                    <FormItem className="col-span-1 md:col-span-2">
                                        <FormLabel>Oferta Vinculada (Cliente)</FormLabel>
                                        <Select 
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                // Reset CM selection when Offer changes
                                                form.setValue("cotizacionProveedorId", "");
                                            }} 
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione una oferta..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sin_oferta">Sin Oferta</SelectItem>
                                                {approvedQuotes.map((q) => (
                                                    <SelectItem key={q.id} value={q.id}>
                                                        {q.numero} - {q.cliente?.nombre} ({q.descripcionTrabajo})
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
                                name="cotizacionProveedorId"
                                render={({ field }) => {
                                    const selectedOfferId = form.watch("cotizacionId");
                                    const filteredCMs = approvedSupplierQuotes.filter(
                                        cp => (!selectedOfferId || selectedOfferId === "sin_oferta") ? true : cp.cotizacionId === selectedOfferId
                                    );

                                    return (
                                        <FormItem className="col-span-1 md:col-span-2">
                                            <FormLabel>Compra Aprobada (Solicitud CM-XXXX)</FormLabel>
                                            <Select 
                                                onValueChange={field.onChange} 
                                                value={field.value}
                                                disabled={!selectedOfferId}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={selectedOfferId ? "Seleccione CM-XXXX..." : "Seleccione una oferta primero"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {filteredCMs.map((q) => (
                                                        <SelectItem key={q.id} value={q.id}>
                                                            {q.numero} - {q.proveedor?.nombre || 'Sin Proveedor'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {!selectedOfferId && (
                                                <p className="text-[0.8rem] text-muted-foreground">
                                                    Debe seleccionar una oferta para ver sus compras asociadas.
                                                </p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <FormField
                                control={form.control}
                                name="numeroFactura"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Factura</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: INV-1234" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha Factura</FormLabel>
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
                                                            format(field.value, "PPP", { locale: es })
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="valorFactura"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor de la Factura</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="iva"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>IVA</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="valorPago"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Pagado</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="fechaPago"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fecha de Pago</FormLabel>
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
                                                            format(field.value, "PPP", { locale: es })
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="diasCredito"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Días de Crédito</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>Si aplica crédito de proveedor.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cuotas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Cuotas</FormLabel>
                                        <FormControl>
                                            <Input type="number" min="1" {...field} />
                                        </FormControl>
                                        <FormDescription>Para compras diferidas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="metodoPago"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Método de Pago</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                                <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                                <SelectItem value="CREDITO">Crédito</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cuentaId"
                                render={({ field }) => {
                                    const valorPagoStr = form.watch("valorPago");
                                    const isPaid = !isNaN(Number(valorPagoStr)) && Number(valorPagoStr) > 0;
                                    
                                    if (!isPaid) return <div className="col-span-1" />; // Placeholder if not paid

                                    return (
                                        <FormItem>
                                            <FormLabel>Cuenta de Salida (Opcional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione la cuenta bancaria" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {cuentasBancarias.map((cuenta) => (
                                                        <SelectItem key={cuenta.id} value={cuenta.id}>
                                                            {cuenta.nombre} ({formatCurrency(cuenta.saldoActual)})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>De donde salieron los fondos.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <FormLabel>Soporte de Pago/Factura (PDF/Imagen)</FormLabel>
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

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {compra ? "Guardar Cambios" : "Registrar Compra"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

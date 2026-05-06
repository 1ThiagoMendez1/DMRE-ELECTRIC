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
import { Plus, FileText, Upload, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CuentaBancaria, TipoMovimiento, CategoriaMovimiento, Cotizacion, ObligacionFinanciera } from "@/types/sistema";
import { createClient } from "@/utils/supabase/client";

const formSchema = z.object({
    tipo: z.enum(["INGRESO", "EGRESO", "TRANSFERENCIA"] as const),
    cuentaId: z.string().min(1, "Seleccione una cuenta origen"),
    cuentaDestinoId: z.string().optional(),
    categoria: z.string().optional().or(z.literal("")),
    tercero: z.string().optional().or(z.literal("")),
    concepto: z.string().min(3, "Concepto requerido"),
    valor: z.coerce.number().min(1, "Valor debe ser mayor a 0"),
    cuotas: z.coerce.number().optional(),
    cuotaActual: z.coerce.number().optional(),
    cotizacionId: z.string().optional().or(z.literal("")),
    comprobanteUrl: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.tipo === "TRANSFERENCIA") {
        if (!data.cuentaDestinoId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Seleccione la cuenta destino",
                path: ["cuentaDestinoId"]
            });
        } else if (data.cuentaId === data.cuentaDestinoId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La cuenta destino debe ser diferente",
                path: ["cuentaDestinoId"]
            });
        }
    } else {
        if (!data.categoria || data.categoria.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Categoría requerida",
                path: ["categoria"]
            });
        }
        if (!data.tercero || data.tercero.trim().length < 3) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Tercero requerido",
                path: ["tercero"]
            });
        }
    }
});

interface CreateTransactionDialogProps {
    cuentas: CuentaBancaria[];
    cotizaciones?: Cotizacion[];
    onTransactionCreated: (tx: any) => void;
}

export function CreateTransactionDialog({ cuentas, cotizaciones = [], onTransactionCreated }: CreateTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "EGRESO",
            categoria: "OTROS",
            concepto: "",
            valor: 0,
            tercero: "",
            cuotas: 1,
            cuotaActual: 1,
            cotizacionId: "",
            comprobanteUrl: ""
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Solo se permiten archivos PDF");
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `comprobantes/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('imagenes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes')
                .getPublicUrl(filePath);

            form.setValue('comprobanteUrl', publicUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert("Error al subir el archivo");
        } finally {
            setIsUploading(false);
        }
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        const cuenta = cuentas.find(c => c.id === values.cuentaId);

        if (values.tipo === "TRANSFERENCIA") {
            const cuentaDestino = cuentas.find(c => c.id === values.cuentaDestinoId);
            
            const egreso = {
                id: `MOV-${Math.floor(Math.random() * 10000)}`,
                fecha: new Date(),
                tipo: "EGRESO",
                cuentaId: values.cuentaId,
                cuenta: cuenta,
                categoria: "OTROS" as CategoriaMovimiento,
                tercero: cuentaDestino?.nombre || "Traspaso Propio",
                concepto: `Traspaso a ${cuentaDestino?.nombre}: ${values.concepto}`,
                valor: values.valor
            };
            
            const ingreso = {
                id: `MOV-${Math.floor(Math.random() * 10000)}`,
                fecha: new Date(),
                tipo: "INGRESO",
                cuentaId: values.cuentaDestinoId as string,
                cuenta: cuentaDestino,
                categoria: "OTROS" as CategoriaMovimiento,
                tercero: cuenta?.nombre || "Traspaso Propio",
                concepto: `Traspaso desde ${cuenta?.nombre}: ${values.concepto}`,
                valor: values.valor,
                comprobanteUrl: values.comprobanteUrl
            };
            
            onTransactionCreated(egreso);
            setTimeout(() => onTransactionCreated(ingreso), 300);
        } else {
            const newTx = {
                id: `MOV-${Math.floor(Math.random() * 10000)}`,
                fecha: new Date(),
                tipo: values.tipo,
                cuentaId: values.cuentaId,
                cuenta: cuenta,
                categoria: values.categoria as CategoriaMovimiento,
                tercero: values.tercero,
                concepto: values.concepto,
                valor: values.valor,
                cuotas: values.cuotas,
                cuotaActual: values.cuotaActual,
                cotizacionId: values.cotizacionId,
                comprobanteUrl: values.comprobanteUrl
            };
            onTransactionCreated(newTx);
        }

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
                                                <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
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
                                        <FormLabel>{form.watch("tipo") === "TRANSFERENCIA" ? "Cuenta Origen" : "Cuenta"}</FormLabel>
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

                        {form.watch("tipo") === "TRANSFERENCIA" && (
                            <FormField
                                control={form.control}
                                name="cuentaDestinoId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cuenta Destino</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione cuenta destino" />
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
                        )}

                        {form.watch("tipo") !== "TRANSFERENCIA" && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="cotizacionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Oferta Vinculada (Proyecto)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Opcional: Vincular a oferta..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin Vincular</SelectItem>
                                                    {cotizaciones.filter(q => ['APROBADA', 'EN_EJECUCION', 'FINALIZADA'].includes(q.estado)).map(q => (
                                                        <SelectItem key={q.id} value={q.id}>
                                                            {q.numero} - {q.cliente?.nombre}
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
                                                    <SelectItem value="VENTAS">Ventas</SelectItem>
                                                    <SelectItem value="NOMINA">Nómina</SelectItem>
                                                    <SelectItem value="PROVEEDORES">Proveedores</SelectItem>
                                                    <SelectItem value="SUMINISTRO">Suministro</SelectItem>
                                                    <SelectItem value="INSTALACION">Instalación</SelectItem>
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
                            </>
                        )}



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

                        <FormField
                            control={form.control}
                            name="comprobanteUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Soporte (PDF)</FormLabel>
                                    <div className="flex flex-col gap-2">
                                        {field.value ? (
                                            <div className="flex items-center justify-between p-2 border rounded-md bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span className="text-xs truncate max-w-[200px]">Comprobante cargado</span>
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6"
                                                    onClick={() => form.setValue('comprobanteUrl', '')}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                    className="cursor-pointer pr-10"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {isUploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground italic">
                                            Sube el PDF del soporte bancario o factura.
                                        </p>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {(() => {
                            const selectedAccount = cuentas.find(c => c.id === form.watch("cuentaId"));
                            if (selectedAccount?.tipo === 'CREDITO') {
                                return (
                                    <div className="grid grid-cols-2 gap-4 border p-3 rounded-md bg-primary/5">
                                        <FormField
                                            control={form.control}
                                            name="cuotaActual"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Cuota Actual</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" size={1} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="cuotas"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Total Cuotas</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" size={1} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <DialogFooter>
                            <Button type="submit">Registrar</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

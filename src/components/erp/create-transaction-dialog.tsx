"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Upload, Loader2, X, ExternalLink, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CuentaBancaria, TipoMovimiento, CategoriaMovimiento, Cotizacion, ObligacionFinanciera, MovimientoFinanciero } from "@/types/sistema";
import { createClient } from "@/utils/supabase/client";
import { FINANCE_CATEGORIES } from "@/lib/categorias-financieras";
import { useErp } from "@/components/providers/erp-provider";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
    tipo: z.enum(["INGRESO", "EGRESO", "TRANSFERENCIA"] as const),
    cuentaId: z.string().min(1, "Seleccione una cuenta origen"),
    cuentaDestinoId: z.string().optional(),
    categoria: z.string().optional().or(z.literal("")),
    tercero: z.string().optional().or(z.literal("")),
    identificacion: z.string().optional().or(z.literal("")),
    concepto: z.string().min(3, "Concepto requerido"),
    valor: z.coerce.number().min(1, "Valor debe ser mayor a 0"),
    iva: z.coerce.number().optional().default(0),
    retencion: z.coerce.number().min(0, "La retención debe ser positiva.").optional().default(0),
    fecha: z.string().optional(),
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
    movimientos?: MovimientoFinanciero[];
    onTransactionCreated: (tx: any) => Promise<void> | void;
}

export function CreateTransactionDialog({ cuentas, cotizaciones = [], movimientos = [], onTransactionCreated }: CreateTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errorSave, setErrorSave] = useState("");
    const { toast } = useToast();
    const [uploadedFileName, setUploadedFileName] = useState<string>("");
    const [retencionPct, setRetencionPct] = useState("");
    const supabase = createClient();
    const { clientes, proveedores, empleados } = useErp();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tipo: "EGRESO",
            categoria: "OTROS",
            concepto: "",
            valor: 0,
            iva: 0,
            retencion: 0,
            fecha: new Date().toISOString().split('T')[0],
            tercero: "",
            identificacion: "",
            cuotas: 1,
            cuotaActual: 1,
            cotizacionId: "",
            comprobanteUrl: ""
        },
    });

    const [assignedEmployees, setAssignedEmployees] = useState<{id: string, nombre: string, salario: number}[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    const [providersList, setProvidersList] = useState<{id: string, nombre: string, identificacion: string}[]>([]);
    const [employeesList, setEmployeesList] = useState<{id: string, nombre: string, salario: number, identificacion: string}[]>([]);
    const [loadingTerceros, setLoadingTerceros] = useState(false);

    const contactos = [
        ...clientes.map(c => ({ nombre: c.nombre, identificacion: c.documento, origen: "Cliente" })),
        ...proveedores.map(p => ({ nombre: p.nombre, identificacion: p.nit || "", origen: "Proveedor" })),
        ...empleados.map(e => ({ nombre: e.nombreCompleto, identificacion: e.cedula || "", origen: "Empleado", salario: e.salarioBase })),
        ...movimientos.filter(m=>!!m.tercero).map(m=>({ nombre: m.tercero || "", identificacion: m.identificacion || "", origen: "Tercero" }))
    ].filter((contact, index, list)=>list.findIndex(other=>other.nombre.toLowerCase()===contact.nombre.toLowerCase())===index);

    const watchCategoria = form.watch("categoria");
    const watchCotizacionId = form.watch("cotizacionId");

    useEffect(() => {
        if (watchCategoria === "NOMINA" && watchCotizacionId && watchCotizacionId !== "none") {
            setLoadingEmployees(true);
            supabase
                .from("asignaciones_programador")
                .select(`
                    empleado_id,
                    empleados ( id, nombre_completo, salario_base, numero_documento )
                `)
                .eq("cotizacion_id", watchCotizacionId)
                .then(({ data, error }) => {
                    setLoadingEmployees(false);
                    if (!error && data) {
                        const emps = new Map();
                        data.forEach((row: any) => {
                            if (row.empleados && !emps.has(row.empleados.id)) {
                                emps.set(row.empleados.id, {
                                    id: row.empleados.id,
                                    nombre: row.empleados.nombre_completo,
                                    salario: Number(row.empleados.salario_base) || 0,
                                    identificacion: row.empleados.numero_documento || ""
                                });
                            }
                        });
                        setAssignedEmployees(Array.from(emps.values()));
                    } else {
                        setAssignedEmployees([]);
                    }
                });
        } else {
            setAssignedEmployees([]);
        }
    }, [watchCategoria, watchCotizacionId, supabase]);

    useEffect(() => {
        if (watchCategoria === "PROVEEDORES") {
            setLoadingTerceros(true);
            supabase.from("proveedores").select("id, nombre, nit").then(({ data }) => {
                if (data) setProvidersList(data.map((p: any) => ({ id: p.id, nombre: p.nombre, identificacion: p.nit || "" })));
                setLoadingTerceros(false);
            });
        } else if (watchCategoria === "NOMINA") {
            setLoadingTerceros(true);
            supabase.from("empleados").select("id, nombre_completo, salario_base, numero_documento").then(({ data }) => {
                if (data) setEmployeesList(data.map((e: any) => ({ id: e.id, nombre: e.nombre_completo, salario: Number(e.salario_base) || 0, identificacion: e.numero_documento || "" })));
                setLoadingTerceros(false);
            });
        }
    }, [watchCategoria, supabase]);

    // Auto-actualizar IVA si cambia tipo o categoría
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "categoria" || name === "tipo") {
                const currentValor = Number(value.valor) || 0;
                if (value.tipo === "TRANSFERENCIA" || value.categoria === "NOMINA") {
                    form.setValue("iva", 0, { shouldValidate: true });
                } else if (currentValor > 0) {
                    form.setValue("iva", Number((currentValor * 0.19).toFixed(2)), { shouldValidate: true });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            alert("Solo se permiten PDF e imágenes JPG, PNG o WEBP.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert("El soporte no puede superar 10 MB.");
            return;
        }

        try {
            setIsUploading(true);
            setUploadedFileName(file.name);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `comprobantes/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('imagenes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('imagenes')
                .getPublicUrl(filePath);

            form.setValue('comprobanteUrl', publicUrl, { shouldValidate: true });
        } catch (error) {
            console.error('Error uploading file:', error);
            alert("Error al subir el archivo");
            setUploadedFileName("");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = () => {
        form.setValue('comprobanteUrl', '');
        setUploadedFileName('');
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setSaving(true); setErrorSave("");
        let partialTransfer = false;
        try {
        const cuenta = cuentas.find(c => c.id === values.cuentaId);
        const txDate = values.fecha ? new Date(values.fecha + "T12:00:00") : new Date();

        if (values.tipo === "TRANSFERENCIA") {
            const cuentaDestino = cuentas.find(c => c.id === values.cuentaDestinoId);
            
            const egreso = {
                id: `MOV-${Math.floor(Math.random() * 10000)}`,
                fecha: txDate,
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
                fecha: txDate,
                tipo: "INGRESO",
                cuentaId: values.cuentaDestinoId as string,
                cuenta: cuentaDestino,
                categoria: "OTROS" as CategoriaMovimiento,
                tercero: cuenta?.nombre || "Traspaso Propio",
                concepto: `Traspaso desde ${cuenta?.nombre}: ${values.concepto}`,
                valor: values.valor,
                comprobanteUrl: values.comprobanteUrl
            };
            
            await onTransactionCreated(egreso);
            partialTransfer = true;
            await onTransactionCreated(ingreso);
        } else {
            const emp = employeesList.find(e => e.nombre === values.tercero) || assignedEmployees.find(e => e.nombre === values.tercero);
            const newTx = {
                id: `MOV-${Math.floor(Math.random() * 10000)}`,
                fecha: txDate,
                tipo: values.tipo,
                cuentaId: values.cuentaId,
                cuenta: cuenta,
                categoria: values.categoria as CategoriaMovimiento,
                tercero: values.tercero,
                identificacion: values.identificacion,
                concepto: ["OFICINA", "ADMINISTRATIVO"].includes(values.cotizacionId || "") ? `${values.cotizacionId} - ${values.concepto}` : values.concepto,
                valor: values.valor,
                iva: values.iva,
                retencion: values.retencion,
                cuotas: values.cuotas,
                cuotaActual: values.cuotaActual,
                cotizacionId: values.cotizacionId && !["none", "OFICINA", "ADMINISTRATIVO"].includes(values.cotizacionId) ? values.cotizacionId : undefined,
                comprobanteUrl: values.comprobanteUrl,
                referencia: emp ? `EMP-${emp.id}` : undefined
            };
            await onTransactionCreated(newTx);
        }

        setOpen(false);
        form.reset();
        setUploadedFileName("");
        setRetencionPct("");
        } catch (error) {
            if (partialTransfer) {
                toast({ variant: "destructive", title: "Traspaso parcialmente registrado", description: "Se guardó el egreso, pero falló el ingreso. No repitas el pago: concilia ambas cuentas." });
                setErrorSave("Traspaso pendiente de conciliación; consulta el historial antes de intentar otra vez.");
                setOpen(false);
            } else {
                setErrorSave(error instanceof Error ? error.message : "No se pudo guardar el movimiento.");
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Registrar Movimiento
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[500px] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar Transacción</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del ingreso o egreso.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                    <SelectItem value="none">Sin vincular</SelectItem>
                                                    <SelectItem value="OFICINA">Oficina</SelectItem>
                                                    <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                                                    {cotizaciones.filter(q => ['APROBADA', 'EN_EJECUCION', 'FINALIZADA'].includes(q.estado)).sort((a,b) => (a.tipo==='SIMPLIFICADA'?0:1)-(b.tipo==='SIMPLIFICADA'?0:1) || a.numero.localeCompare(b.numero,'es',{numeric:true})).map(q => (
                                                        <SelectItem key={q.id} value={q.id}>
                                                            {q.tipo === "SIMPLIFICADA" ? "Simple" : "Normal"} · {q.numero} - {q.cliente?.nombre}
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
                                                    {FINANCE_CATEGORIES.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
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
                                            <FormLabel>Tercero (empleado, cliente, proveedor o beneficiario)</FormLabel>
                                            <FormControl>
                                                <Input list="dmre-contactos" autoComplete="off" placeholder="Empieza a escribir el nombre..." {...field}
                                                    onChange={e => {
                                                        const name = e.target.value;
                                                        field.onChange(name);
                                                        const match = contactos.find(c=>c.nombre.toLocaleLowerCase("es-CO")===name.toLocaleLowerCase("es-CO"));
                                                        if (match) {
                                                            form.setValue("identificacion", match.identificacion || "");
                                                            if ("salario" in match && form.getValues("categoria") === "NOMINA" && Number(match.salario) > 0)
                                                                form.setValue("valor", Number(match.salario));
                                                        }
                                                    }}/>
                                            </FormControl>
                                            <datalist id="dmre-contactos">{contactos.map(c=><option key={c.nombre} value={c.nombre} label={c.origen} />)}</datalist>
                                            <p className="text-[11px] text-muted-foreground">Selecciona una sugerencia para completar identificación o escribe un nombre nuevo.</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="identificacion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Identificación</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="CC/NIT del tercero" 
                                                    {...field} 
                                                />
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="fecha"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
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
                                        <FormLabel>Valor (COP)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00 (COP)"
                                                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                                                    if (raw.split(".").length > 2) return;
                                                    field.onChange(raw);
                                                    const num = Number(raw) || 0;
                                                    const tipo = form.getValues("tipo");
                                                    const cat = form.getValues("categoria");
                                                    form.setValue("iva", tipo === "TRANSFERENCIA" || cat === "NOMINA"
                                                        ? 0 : Number((num * 0.19).toFixed(2)), { shouldValidate: true });
                                                    if (Number(retencionPct) > 0)
                                                        form.setValue("retencion", Number((num * Number(retencionPct) / 100).toFixed(2)), { shouldValidate: true });
                                                }}
                                                className="font-medium"
                                            />
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
                                        <div className="flex items-center justify-between">
                                            <FormLabel>IVA (19%)</FormLabel>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = Number(form.getValues("valor")) || 0;
                                                        form.setValue("iva", Number((currentVal * 0.19).toFixed(2)), { shouldValidate: true });
                                                    }}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                                                    title="Calcular 19% de IVA"
                                                >
                                                    19%
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => form.setValue("iva", 0, { shouldValidate: true })}
                                                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground font-medium transition-colors"
                                                    title="Sin IVA (0%)"
                                                >
                                                    0%
                                                </button>
                                            </div>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="$ 0 COP"
                                                value={field.value === undefined || field.value === null ? "" : String(field.value)}
                                                onChange={(e) => {
                                                    const raw = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                                                    if (raw.split(".").length > 2) return;
                                                    field.onChange(raw);
                                                }}
                                                className="font-medium"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {form.watch("tipo") !== "TRANSFERENCIA" && (
                            <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                                <p className="text-sm font-semibold">Retención aplicada</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="ret-porcentaje">Porcentaje (%)</Label>
                                        <Input id="ret-porcentaje" type="number" min="0" max="100" step="0.0001" value={retencionPct} placeholder="Ej. 2.5"
                                            onChange={e=>{
                                                const pct = e.target.value;setRetencionPct(pct);
                                                form.setValue("retencion", Number(((Number(form.getValues("valor"))||0)*Number(pct)/100).toFixed(2)), { shouldValidate: true });
                                            }} />
                                    </div>
                                    <FormField control={form.control} name="retencion" render={({field})=>(
                                        <FormItem><FormLabel>Valor retenido (COP)</FormLabel><FormControl><Input type="number" min="0" step="0.01" value={Number(field.value) || 0} onChange={e=>{setRetencionPct("");field.onChange(e.target.value);}} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <p className="text-[11px] text-muted-foreground">Se registra en el reporte contable. El movimiento bancario conserva el valor efectivo ingresado.</p>
                            </div>
                        )}

                        {Number(form.watch("valor") || 0) > 0 && (
                            <div className="flex items-center justify-between px-3 py-2 bg-primary/5 rounded-md border border-primary/15 text-xs">
                                <span className="text-muted-foreground font-medium">
                                    Total del movimiento (Valor + IVA):
                                </span>
                                <span className="font-bold text-sm text-primary">
                                    {formatCurrency((Number(form.watch("valor")) || 0) + (Number(form.watch("iva")) || 0))} COP
                                </span>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="comprobanteUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Soporte (PDF o imagen)</FormLabel>
                                    <div className="flex flex-col gap-2">
                                        {field.value ? (
                                            <div className="flex flex-col gap-2 p-3 border rounded-lg bg-card/60 dark:bg-card/40 shadow-sm">
                                                <div className="flex items-center justify-between gap-2 border-b pb-2">
                                                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                                        <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 shrink-0">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px]">
                                                                {uploadedFileName || "Comprobante cargado (PDF)"}
                                                            </p>
                                                            <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                                                                Soporte listo para registrar
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-xs flex items-center gap-1 hover:bg-primary/10 hover:text-primary"
                                                            onClick={() => window.open(field.value, '_blank')}
                                                            title="Abrir soporte en pestaña nueva"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Abrir</span>
                                                        </Button>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={handleRemoveFile}
                                                            title="Quitar comprobante"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Vista previa embebida del PDF */}
                                                <div className="relative w-full h-72 border rounded-md overflow-hidden bg-background shadow-inner">
                                                    {/\.(png|jpe?g|webp)(\?|$)/i.test(field.value) ? (
                                                        <img src={field.value} alt="Vista previa del soporte" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <iframe src={field.value} className="w-full h-full border-0" title="Vista previa del soporte" />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept=".pdf,image/png,image/jpeg,image/webp"
                                                    onChange={handleFileUpload}
                                                    disabled={isUploading}
                                                    className="cursor-pointer pr-10"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                                                    {isUploading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    ) : (
                                                        <Upload className="h-4 w-4" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground italic">
                                            {field.value 
                                                ? "Verifique los datos del documento en la vista previa antes de registrar." 
                                                : "Adjunta un PDF o una imagen (JPG, PNG, WEBP) de hasta 10 MB."}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-3 rounded-md bg-primary/5">
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

                        {errorSave && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{errorSave}</p>}
                        <DialogFooter>
                            <Button type="submit" disabled={saving || isUploading}>{saving ? "Guardando..." : "Registrar"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

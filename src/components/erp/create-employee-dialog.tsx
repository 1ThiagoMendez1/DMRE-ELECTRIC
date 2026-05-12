"use client";

import { useState, useRef } from "react";
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
    DialogFooter,
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    UserPlus,
    FileText,
    Upload,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createEmpleadoAction } from "@/app/dashboard/sistema/talento-humano/actions";

// ─── Document categories ─────────────────────────────────────────────────────
const DOC_CATEGORIES = [
    { key: "cedula",         label: "Cédula de Ciudadanía",   required: true  },
    { key: "alturas",        label: "Curso de Alturas",        required: false },
    { key: "seguridad",      label: "Seguridad Social",        required: true  },
    { key: "hoja_vida",      label: "Hoja de Vida",            required: false },
    { key: "antecedentes",   label: "Antecedentes",            required: false },
    { key: "contrato",       label: "Contrato / Acuerdo",      required: false },
    { key: "otro",           label: "Otro documento",          required: false },
] as const;

type DocKey = (typeof DOC_CATEGORIES)[number]["key"];

interface UploadedDoc {
    category: DocKey;
    name: string;
    url: string;
}

// ─── Form schema ──────────────────────────────────────────────────────────────
const formSchema = z.object({
    nombreCompleto:    z.string().min(5,  "Nombre completo requerido"),
    cedula:            z.string().min(5,  "Documento inválido"),
    cargo:             z.string().min(2,  "Cargo requerido"),
    tipoVinculacion:   z.string().min(1,  "Tipo de vinculación requerido"),
    salarioBase:       z.coerce.number().min(0, "Valor inválido"),
    fechaIngreso:      z.date({ required_error: "Fecha de ingreso requerida" }),
    telefono:          z.string().optional(),
    correo:            z.string().email("Correo inválido").optional().or(z.literal("")),
});

interface CreateEmployeeDialogProps {
    onEmployeeCreated: (emp: any) => void;
}

export function CreateEmployeeDialog({ onEmployeeCreated }: CreateEmployeeDialogProps) {
    const { toast } = useToast();
    const [open, setOpen]         = useState(false);
    const [tab, setTab]           = useState("info");
    const [uploading, setUploading] = useState<DocKey | null>(null);
    const [docs, setDocs]         = useState<UploadedDoc[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRefs           = useRef<Record<string, HTMLInputElement | null>>({});
    const supabase                = createClient();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nombreCompleto:  "",
            cedula:          "",
            cargo:           "",
            tipoVinculacion: "",
            salarioBase:     0,
            telefono:        "",
            correo:          "",
        },
    });

    // ── File upload ─────────────────────────────────────────────────────────
    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        category: DocKey
    ) => {
        if (!e.target.files?.[0]) return;
        const file     = e.target.files[0];
        const cedula   = form.getValues("cedula") || "sin-cedula";
        const fileExt  = file.name.split(".").pop();
        const path     = `empleados/${cedula}/${category}_${Date.now()}.${fileExt}`;

        setUploading(category);
        try {
            const { error } = await supabase.storage
                .from("Doc Empleados")
                .upload(path, file, { upsert: true });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from("Doc Empleados")
                .getPublicUrl(path);

            // Replace existing doc in same category or add new
            setDocs(prev => [
                ...prev.filter(d => d.category !== category),
                { category, name: file.name, url: publicUrl },
            ]);

            toast({ title: "Documento cargado", description: `${DOC_CATEGORIES.find(c => c.key === category)?.label} subido correctamente.` });
        } catch (err: any) {
            toast({ title: "Error al subir", description: err.message, variant: "destructive" });
        } finally {
            setUploading(null);
            if (fileInputRefs.current[category]) {
                fileInputRefs.current[category]!.value = "";
            }
        }
    };

    const removeDoc = (category: DocKey) => {
        setDocs(prev => prev.filter(d => d.category !== category));
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSaving(true);
        try {
            const archivosMapped = docs.map(d => ({
                name: `[${DOC_CATEGORIES.find(c => c.key === d.category)?.label}] ${d.name}`,
                url:  d.url,
                date: new Date(),
                type: d.category,
            }));

            // Persist in Supabase via server action
            const saved = await createEmpleadoAction({
                nombreCompleto:  values.nombreCompleto,
                cedula:          values.cedula,
                cargo:           values.cargo,
                salarioBase:     values.salarioBase,
                fechaIngreso:    values.fechaIngreso,
                telefono:        values.telefono   || undefined,
                correo:          values.correo     || undefined,
                tipoVinculacion: values.tipoVinculacion,
                tipoContrato:    values.tipoVinculacion, // mirror for payroll compat
                estado:          "ACTIVO",
                archivos:        archivosMapped,
            });

            onEmployeeCreated(saved);
            toast({
                title: "Empleado registrado",
                description: `${values.nombreCompleto} (${values.tipoVinculacion}) fue añadido exitosamente.`,
            });
            handleClose();
        } catch (err: any) {
            toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const handleClose = () => {
        setOpen(false);
        setTab("info");
        setDocs([]);
        form.reset();
    };

    // Required docs not yet uploaded
    const missingRequired = DOC_CATEGORIES
        .filter(c => c.required && !docs.find(d => d.category === c.key))
        .map(c => c.label);

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); else setOpen(true); }}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Nuevo Empleado
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Registrar Personal</DialogTitle>
                    <DialogDescription>
                        Complete la información y suba los documentos requeridos.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">Información Personal</TabsTrigger>
                        <TabsTrigger value="docs" className="relative">
                            Documentos
                            {missingRequired.length > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                    {missingRequired.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── INFO TAB ─────────────────────────────────────────── */}
                    <TabsContent value="info" className="flex-1 overflow-y-auto mt-0 pt-4">
                        <Form {...form}>
                            <form id="emp-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                {/* Nombre */}
                                <FormField control={form.control} name="nombreCompleto"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl><Input placeholder="Ej: Carlos Pérez González" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Cédula + Teléfono */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="cedula"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cédula / Documento</FormLabel>
                                                <FormControl><Input placeholder="123456789" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="telefono"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl><Input placeholder="300 123 4567" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Correo */}
                                <FormField control={form.control} name="correo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl><Input type="email" placeholder="correo@ejemplo.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Cargo + Tipo Vinculación */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="cargo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cargo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Seleccione cargo" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Técnico</SelectLabel>
                                                            <SelectItem value="TÉCNICO ELECTRICISTA">Técnico Electricista</SelectItem>
                                                            <SelectItem value="AYUDANTE">Ayudante</SelectItem>
                                                            <SelectItem value="INGENIERO RESIDENTE">Ingeniero Residente</SelectItem>
                                                        </SelectGroup>
                                                        <SelectGroup>
                                                            <SelectLabel>Externo / Independiente</SelectLabel>
                                                            <SelectItem value="CONTRATISTA">Contratista</SelectItem>
                                                            <SelectItem value="PRESTACIÓN DE SERVICIOS">Prestación de Servicios</SelectItem>
                                                        </SelectGroup>
                                                        <SelectGroup>
                                                            <SelectLabel>Administrativo</SelectLabel>
                                                            <SelectItem value="ADMINISTRATIVO">Administrativo</SelectItem>
                                                            <SelectItem value="GERENTE">Gerente</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField control={form.control} name="tipoVinculacion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Vinculación</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="EMPLEADO DIRECTO">Empleado Directo</SelectItem>
                                                        <SelectItem value="CONTRATISTA">Contratista</SelectItem>
                                                        <SelectItem value="PRESTACIÓN DE SERVICIOS">Prestación de Servicios</SelectItem>
                                                        <SelectItem value="TEMPORAL">Temporal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Salario + Fecha Ingreso */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="salarioBase"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Salario / Honorarios (COP)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="fechaIngreso"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha de Ingreso</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                                            >
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={date => date > new Date() || date < new Date("1900-01-01")}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </form>
                        </Form>
                    </TabsContent>

                    {/* ── DOCS TAB ─────────────────────────────────────────── */}
                    <TabsContent value="docs" className="flex-1 overflow-y-auto mt-0 pt-4 space-y-3">
                        <p className="text-xs text-muted-foreground mb-1">
                            Los documentos marcados con <span className="text-amber-500 font-medium">*</span> son requeridos.
                            Puede subirlos ahora o desde el perfil del empleado.
                        </p>

                        {DOC_CATEGORIES.map(cat => {
                            const uploaded = docs.find(d => d.category === cat.key);
                            const isUploading = uploading === cat.key;

                            return (
                                <div
                                    key={cat.key}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg border px-4 py-3 transition-colors",
                                        uploaded ? "border-green-500/50 bg-green-500/5" : "border-border bg-card"
                                    )}
                                >
                                    {/* Left: icon + label */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        {uploaded ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <FileText className={cn("h-5 w-5 flex-shrink-0", cat.required ? "text-amber-500" : "text-muted-foreground")} />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {cat.label}
                                                {cat.required && <span className="text-amber-500 ml-1">*</span>}
                                            </p>
                                            {uploaded ? (
                                                <p className="text-xs text-green-600 truncate">{uploaded.name}</p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">Sin documento</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        {uploaded ? (
                                            <>
                                                <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                                                    <a href={uploaded.url} target="_blank" rel="noopener noreferrer">Ver</a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2"
                                                    onClick={() => removeDoc(cat.key)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    ref={el => { fileInputRefs.current[cat.key] = el; }}
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                    onChange={e => handleFileUpload(e, cat.key)}
                                                    disabled={!!uploading}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-3 text-xs pointer-events-none"
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? (
                                                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Subiendo...</>
                                                    ) : (
                                                        <><Upload className="mr-1 h-3 w-3" />Subir</>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Missing required warning */}
                        {missingRequired.length > 0 && (
                            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <p>
                                    <span className="font-medium">Documentos pendientes: </span>
                                    {missingRequired.join(", ")}. Podrá subirlos desde el perfil del empleado.
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="pt-2 border-t">
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button
                        type="submit"
                        form="emp-form"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                            : <><UserPlus className="mr-2 h-4 w-4" />Registrar Empleado</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

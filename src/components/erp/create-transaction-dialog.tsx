"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
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
import { Plus, Loader2, UploadCloud } from "lucide-react";
import { CuentaBancaria, TipoMovimiento, CategoriaMovimiento } from "@/types/sistema";
import { useToast } from "@/hooks/use-toast";

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
    onTransactionCreated: (mov: any) => void | Promise<void>;
}

export function CreateTransactionDialog({ cuentas, onTransactionCreated }: CreateTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsUploading(true);
        try {
            let comprobanteUrl = undefined;

            if (file) {
                const supabase = createClient();
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `movimientos/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('Financiera_Mov')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast({
                        title: "Error",
                        description: "Error al subir el archivo",
                        variant: "destructive"
                    });
                    setIsUploading(false);
                    return;
                }

                // Get public URL
                const { data } = supabase.storage.from('Financiera_Mov').getPublicUrl(filePath);
                comprobanteUrl = data.publicUrl;
            }

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
                valor: values.valor,
                comprobanteUrl: comprobanteUrl
            };

            await onTransactionCreated(newTx);
            setOpen(false);
            form.reset();
            setFile(null);
            toast({
                title: "Movimiento registrado",
                description: file ? "Con archivo adjunto" : "Sin evidencias",
            });
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "Error inesperado al registrar el movimiento",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
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

                        <div className="space-y-2">
                            <FormLabel>Evidencia / Comprobante (Opcional)</FormLabel>
                            <label className="flex items-center gap-2 px-3 py-2 border rounded-md border-input bg-background hover:bg-muted/50 cursor-pointer transition-colors text-sm text-muted-foreground w-full">
                                <UploadCloud className="w-4 h-4" />
                                <span className="truncate flex-1">
                                    {file ? file.name : "Seleccionar archivo (PDF, Imagen)..."}
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Registrar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

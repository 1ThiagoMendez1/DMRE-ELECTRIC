"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Pencil } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
    sku: z.string().min(3, "SKU requerido"),
    descripcion: z.string().min(5, "Descripción requerida"),
    categoria: z.enum(['MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP']),
    ubicacion: z.enum(['BODEGA', 'OBRA']),
    unidad: z.enum(['und', 'mts', 'kg', 'lts', 'rollo', 'caja']),
    cantidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    stockMinimo: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Inválido" }),
    precioProveedor: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    valorUnitario: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
});

interface EditInventoryDialogProps {
    articulo: any;
    onItemUpdated: (updatedItem: any) => void;
}

export function EditInventoryDialog({ articulo, onItemUpdated }: EditInventoryDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof itemSchema>>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            sku: articulo.sku,
            descripcion: articulo.descripcion,
            categoria: articulo.categoria,
            ubicacion: articulo.ubicacion,
            unidad: articulo.unidad,
            cantidad: articulo.cantidad?.toString() || "0",
            stockMinimo: articulo.stockMinimo?.toString() || "10",
            precioProveedor: (articulo.costoMateriales || Math.round(articulo.valorUnitario * 0.7)).toString(),
            valorUnitario: articulo.valorUnitario?.toString() || "0",
        },
    });

    // Reset form when articulo changes
    useEffect(() => {
        if (open) {
            form.reset({
                sku: articulo.sku,
                descripcion: articulo.descripcion,
                categoria: articulo.categoria,
                ubicacion: articulo.ubicacion,
                unidad: articulo.unidad,
                cantidad: articulo.cantidad?.toString() || "0",
                stockMinimo: articulo.stockMinimo?.toString() || "10",
                precioProveedor: (articulo.costoMateriales || Math.round(articulo.valorUnitario * 0.7)).toString(),
                valorUnitario: articulo.valorUnitario?.toString() || "0",
            });
        }
    }, [articulo, open, form]);

    const onSubmit = async (values: z.infer<typeof itemSchema>) => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updated = {
            ...articulo,
            sku: values.sku,
            descripcion: values.descripcion,
            categoria: values.categoria,
            ubicacion: values.ubicacion,
            unidad: values.unidad,
            cantidad: Number(values.cantidad),
            stockMinimo: Number(values.stockMinimo),
            costoMateriales: Number(values.precioProveedor),
            valorUnitario: Number(values.valorUnitario),
            valorTotal: Number(values.cantidad) * Number(values.valorUnitario),
        };

        onItemUpdated(updated);
        toast({
            title: "Artículo Actualizado",
            description: `Se han guardado los cambios para ${values.sku}`,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Editar Artículo {articulo.sku}</DialogTitle>
                    <DialogDescription>
                        Modifique todos los detalles del artículo de inventario.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU / Código</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="MATERIAL">Material</SelectItem>
                                                <SelectItem value="HERRAMIENTA">Herramienta</SelectItem>
                                                <SelectItem value="DOTACION">Dotación</SelectItem>
                                                <SelectItem value="EPP">EPP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BODEGA">Bodega</SelectItem>
                                                <SelectItem value="OBRA">Obra</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidad</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="und">Unidad</SelectItem>
                                                <SelectItem value="mts">Metros</SelectItem>
                                                <SelectItem value="kg">Kilogramos</SelectItem>
                                                <SelectItem value="lts">Litros</SelectItem>
                                                <SelectItem value="rollo">Rollo</SelectItem>
                                                <SelectItem value="caja">Caja</SelectItem>
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
                                        <FormLabel>Cantidad Actual</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="stockMinimo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Mínimo</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="precioProveedor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Proveedor</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
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
                                        <FormLabel>Precio de Venta</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
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
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

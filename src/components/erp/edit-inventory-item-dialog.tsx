"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Package, Check, ChevronsUpDown } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import { InventarioItem, CategoriaItem, UbicacionItem } from "@/types/sistema";
import { cn, formatCurrency } from "@/lib/utils";

const itemSchema = z.object({
    sku: z.string().min(3, "SKU requerido"),
    descripcion: z.string().min(5, "Descripción requerida"),
    categoria: z.enum(['MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP']),
    ubicacion: z.enum(['BODEGA', 'OBRA']),
    unidad: z.string().min(1, "Unidad requerida"),
    cantidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    stockMinimo: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Inválido" }),
    valorUnitario: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    precioProveedor: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    porcentajeVenta: z.string().optional(),
    porcentajeInstalacion: z.string().optional(),
    proveedorId: z.string().min(1, "Proveedor requerido"),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    notas: z.string().optional(),
});

interface EditInventoryItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: Partial<InventarioItem>;
    onSave: (updatedItem: InventarioItem) => void;
}

export function EditInventoryItemDialog({ open, onOpenChange, initialData, onSave }: EditInventoryItemDialogProps) {
    const [proveedorOpen, setProveedorOpen] = useState(false);
    const { toast } = useToast();
    const { proveedores, updateInstalacion, addInstalacion, instalaciones } = useErp();

    const form = useForm<z.infer<typeof itemSchema>>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            sku: initialData?.sku || "SU-",
            descripcion: initialData?.descripcion || "",
            categoria: (initialData?.categoria as any) || 'MATERIAL',
            ubicacion: (initialData?.ubicacion as any) || 'BODEGA',
            unidad: initialData?.unidad || "Und",
            cantidad: String(initialData?.cantidad || 0),
            stockMinimo: String(initialData?.stockMinimo || 10),
            valorUnitario: String(initialData?.valorUnitario || 0),
            precioProveedor: String(initialData?.precioProveedor || initialData?.costoMateriales || 0),
            porcentajeVenta: "0",
            porcentajeInstalacion: "0",
            proveedorId: initialData?.proveedorId || "",
            marca: initialData?.marca || "",
            modelo: initialData?.modelo || "",
            notas: initialData?.notas || ""
        },
    });

    // We can try to infer margins
    useEffect(() => {
        if (open && initialData) {
            form.reset({
                sku: initialData.sku || initialData.item || "SU-",
                descripcion: initialData.descripcion || "",
                categoria: (initialData.categoria as any) || 'MATERIAL',
                ubicacion: (initialData.ubicacion as any) || 'BODEGA',
                unidad: initialData.unidad || "Und",
                cantidad: String(initialData.cantidad || 0),
                stockMinimo: String(initialData.stockMinimo || 10),
                valorUnitario: String(initialData.valorUnitario || 0),
                precioProveedor: String(initialData.precioProveedor || initialData.costoMateriales || 0),
                porcentajeVenta: "0",
                porcentajeInstalacion: "0",
                proveedorId: initialData.proveedorId || "",
                marca: initialData.marca || "",
                modelo: initialData.modelo || "",
                notas: initialData.notas || ""
            });

            // Try to infer percentages based on actual values
            const comp = Number(initialData.precioProveedor || initialData.costoMateriales || 0);
            const vent = Number(initialData.valorUnitario || 0);
            if (comp > 0 && vent > comp) {
                const pct = Math.round(((vent / comp) - 1) * 100);
                form.setValue("porcentajeVenta", pct.toString());
            }

            // check if installation exists
            let instSku = initialData.sku || initialData.item || "";
            if (instSku.startsWith('SU-')) instSku = instSku.replace('SU-', 'IN-');
            else if (instSku.startsWith('SU')) instSku = instSku.replace('SU', 'IN-');
            else instSku = `IN-${instSku}`;

            const relatedInst = instalaciones.find(i => i.codigo === (initialData.item) || i.codigo === instSku || i.codigo === (initialData.item)?.replace('SU-', 'IN-'));
            if (relatedInst && vent > 0) {
                const instVal = Number(relatedInst.valorCalculado || 0);
                if (instVal > 0) {
                    const pctInst = Math.round((instVal / vent) * 100);
                    form.setValue("porcentajeInstalacion", pctInst.toString());
                }
            }
        }
    }, [open, initialData, form, instalaciones]);

    const porcentajeStr = form.watch("porcentajeInstalacion");
    const precioVentaStr = form.watch("valorUnitario");
    const precioCompraStr = form.watch("precioProveedor");
    const porcentajeVentaStr = form.watch("porcentajeVenta");
    const calculoInstalacion = (Number(precioVentaStr || 0) * Number(porcentajeStr || 0)) / 100;

    useEffect(() => {
        const compra = Number(precioCompraStr || 0);
        const margen = Number(porcentajeVentaStr || 0);
        
        if (margen > 0) {
            const ventaCalc = compra * (1 + (margen / 100));
            const ventaToSet = Math.round(ventaCalc).toString();
            if (form.getValues("valorUnitario") !== ventaToSet) {
                form.setValue("valorUnitario", ventaToSet, { shouldValidate: true, shouldDirty: true });
            }
        }
    }, [precioCompraStr, porcentajeVentaStr, form]);

    // We don't auto-generate SKU on Edit unless it's empty, but usually it's not.

    const onSubmit = async (values: z.infer<typeof itemSchema>) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const updatedItem: InventarioItem = {
            ...initialData,
            sku: values.sku,
            item: values.sku,
            descripcion: values.descripcion,
            categoria: values.categoria as CategoriaItem,
            ubicacion: values.ubicacion as UbicacionItem,
            unidad: values.unidad,
            cantidad: Number(values.cantidad),
            stockMinimo: Number(values.stockMinimo),
            valorUnitario: Number(values.valorUnitario),
            precioProveedor: Number(values.precioProveedor),
            costoMateriales: Number(values.precioProveedor),
            valorTotal: Number(values.valorUnitario),
            t1: Number(values.valorUnitario),
            t2: Number(values.valorUnitario),
            t3: Number(values.valorUnitario),
            proveedorId: values.proveedorId,
            marca: values.marca || "",
            modelo: values.modelo || "",
            notas: values.notas || ""
        } as InventarioItem;

        onSave(updatedItem);

        let instalacionActualizada = false;
        const porcentaje = Number(values.porcentajeInstalacion || "0");
        let instSku = values.sku;
        if (instSku.startsWith('SU-')) {
            instSku = instSku.replace('SU-', 'IN-');
        } else if (instSku.startsWith('SU')) {
            instSku = instSku.replace('SU', 'IN-');
        } else {
            instSku = `IN-${instSku}`;
        }
        
        const valorInstalacion = (Number(values.valorUnitario) * porcentaje) / 100;

        const relatedInst = instalaciones.find(i => i.codigo === initialData?.item || i.codigo === instSku || i.codigo === initialData?.item?.replace('SU-', 'IN-'));
        
        if (relatedInst) {
            updateInstalacion({
                ...relatedInst,
                codigo: instSku,
                descripcion: `Instalación - ${values.descripcion}`,
                valorCalculado: valorInstalacion
            });
            instalacionActualizada = true;
        } else if (porcentaje > 0 && addInstalacion) {
            addInstalacion({
                codigo: instSku,
                descripcion: `Instalación - ${values.descripcion}`,
                valorCalculado: valorInstalacion,
                activo: true
            });
            instalacionActualizada = true;
        }

        toast({
            title: "Item Actualizado",
            description: `${updatedItem.descripcion} actualizado en el inventario.${instalacionActualizada ? " Instalación sincronizada." : ""}`,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Item de Inventario</DialogTitle>
                    <DialogDescription>
                        Modifique la información del material.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU / Código</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g. SU-0001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unidad de Medida</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m, und, gal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="marca"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marca</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g. Schneider, 3M" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="modelo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Modelo / Referencia</FormLabel>
                                        <FormControl>
                                            <Input placeholder="E.g. iC60N" {...field} />
                                        </FormControl>
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
                                        <Input placeholder="Nombre del producto" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Proveedor Combobox */}
                        <FormField
                            control={form.control}
                            name="proveedorId"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Proveedor</FormLabel>
                                    <Popover open={proveedorOpen} onOpenChange={setProveedorOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                                >
                                                    {field.value
                                                        ? proveedores.find((p) => p.id === field.value)?.nombre
                                                        : "Seleccionar proveedor..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar proveedor..." />
                                                <CommandList>
                                                    <CommandEmpty>No se encontró el proveedor.</CommandEmpty>
                                                    <CommandGroup>
                                                        {proveedores.map((p) => (
                                                            <CommandItem
                                                                key={p.id}
                                                                value={p.nombre}
                                                                onSelect={() => {
                                                                    form.setValue("proveedorId", p.id);
                                                                    setProveedorOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", field.value === p.id ? "opacity-100" : "opacity-0")} />
                                                                {p.nombre}
                                                                <span className="ml-auto text-xs text-muted-foreground">{p.nit}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione" />
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
                            <FormField
                                control={form.control}
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación Inicial</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="BODEGA">Bodega Principal</SelectItem>
                                                <SelectItem value="OBRA">Obra (In situ)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cantidad"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Inicial</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="precioProveedor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Compra</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="porcentajeVenta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>% Utilidad</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type="number" className="pr-8" {...field} />
                                                <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                            </div>
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

                        <div className="pt-4 mt-2 border-t border-muted">
                            <h4 className="text-sm font-medium mb-4 text-muted-foreground">Adicional: Creación de Instalación</h4>
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                                <div className="w-full sm:flex-1">
                                    <FormField
                                        control={form.control}
                                        name="porcentajeInstalacion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>% Costo Instalación</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type="number" className="pr-8" {...field} />
                                                        <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">%</span>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Si es mayor a 0, se creará el código en paralelo al guardar.
                                                </p>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="w-full sm:flex-1 sm:pb-6">
                                    {calculoInstalacion > 0 && (
                                        <div className="flex flex-col p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                                            <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Costo Calculado</span>
                                            <span className="text-xl font-bold text-green-700 dark:text-green-500 tracking-tight">
                                                +{formatCurrency(calculoInstalacion)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

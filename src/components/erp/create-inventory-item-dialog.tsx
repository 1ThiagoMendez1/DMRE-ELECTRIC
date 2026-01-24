"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

const itemSchema = z.object({
    sku: z.string().min(3, "SKU requerido"),
    descripcion: z.string().min(5, "Descripción requerida"),
    categoria: z.enum(['MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP']),
    ubicacion: z.enum(['BODEGA', 'OBRA']),
    unidad: z.string().min(1, "Unidad requerida"),
    cantidad: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    stockMinimo: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: "Inválido" }),
    valorUnitario: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
    proveedorId: z.string().min(1, "Proveedor requerido"),
});

interface CreateInventoryItemDialogProps {
    onItemCreated: (newItem: InventarioItem) => void;
}

export function CreateInventoryItemDialog({ onItemCreated }: CreateInventoryItemDialogProps) {
    const [open, setOpen] = useState(false);
    const [proveedorOpen, setProveedorOpen] = useState(false);
    const { toast } = useToast();
    const { proveedores } = useErp();

    const form = useForm<z.infer<typeof itemSchema>>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            sku: "",
            descripcion: "",
            categoria: 'MATERIAL',
            ubicacion: 'BODEGA',
            unidad: "Und",
            cantidad: "0",
            stockMinimo: "10",
            valorUnitario: "0",
            proveedorId: ""
        },
    });

    const onSubmit = async (values: z.infer<typeof itemSchema>) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        const newItem: InventarioItem = {
            id: `INV-${Date.now()}`,
            item: `IT-${Date.now()}`,
            sku: values.sku,
            descripcion: values.descripcion,
            categoria: values.categoria as CategoriaItem,
            ubicacion: values.ubicacion as UbicacionItem,
            unidad: values.unidad,
            cantidad: Number(values.cantidad),
            stockMinimo: Number(values.stockMinimo),
            valorUnitario: Number(values.valorUnitario),
            fechaCreacion: new Date(),
            tipo: 'SIMPLE',
            costoMateriales: 0,
            margenUtilidad: 0,
            valorTotal: Number(values.valorUnitario),
            t1: Number(values.valorUnitario),
            t2: Number(values.valorUnitario),
            t3: Number(values.valorUnitario),
            proveedorId: values.proveedorId
        };

        onItemCreated(newItem);
        toast({
            title: "Item Creado",
            description: `${newItem.descripcion} agregado al inventario.`,
        });
        setOpen(false);
        form.reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Item de Inventario</DialogTitle>
                    <DialogDescription>
                        Agregue un nuevo producto o material al catálogo.
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
                                            <Input placeholder="E.g. CBL-001" {...field} />
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

                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-3 gap-4">
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
                            <FormField
                                control={form.control}
                                name="valorUnitario"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Unitario</FormLabel>
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
                                Guardar Item
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
    codigo: z.string().min(3, "Código requerido"),
    descripcion: z.string().min(5, "Descripción requerida"),
    valorManoObra: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, { message: "Inválido" }),
});

export function CreateWorkCodeDialog() {
    const [open, setOpen] = useState(false);
    const { addCodigoTrabajo, inventario, codigosTrabajo } = useErp();
    const { toast } = useToast();

    // Materials Selection State
    const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]); // { inventarioId, subCodigoId, cantidad, itemRef, type }
    const [comboOpen, setComboOpen] = useState(false);

    // Combine Inventory and Work Codes for selection
    const availableItems = [
        ...inventario.map(i => ({ ...i, type: 'MATERIAL', label: i.descripcion, value: i.descripcion })),
        ...codigosTrabajo.map(c => ({
            ...c,
            type: 'APU',
            label: `(APU) ${c.nombre}`,
            value: `(APU) ${c.nombre}`,
            valorUnitario: c.costoTotal // Use calculated total cost for APU
        }))
    ];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            codigo: "",
            descripcion: "",
            valorManoObra: "0",
        },
    });

    const handleAddMaterial = (item: any) => {
        const idToCheck = item.id;
        const typeToCheck = item.type; // MATERIAL or APU

        if (selectedMaterials.some(m => (m.inventarioId === idToCheck || m.subCodigoId === idToCheck))) {
            toast({ variant: "destructive", title: "Ya agregado", description: "El ítem ya está en la lista." });
            return;
        }

        setSelectedMaterials([...selectedMaterials, {
            inventarioId: typeToCheck === 'MATERIAL' ? item.id : undefined,
            subCodigoId: typeToCheck === 'APU' ? item.id : undefined,
            cantidad: 1,
            itemRef: item,
            type: typeToCheck
        }]);
        setComboOpen(false);
    };

    const handleUpdateQuantity = (id: string, qty: number) => {
        setSelectedMaterials(prev => prev.map(m => (m.inventarioId === id || m.subCodigoId === id) ? { ...m, cantidad: qty } : m));
    };

    const handleRemoveMaterial = (id: string) => {
        setSelectedMaterials(prev => prev.filter(m => (m.inventarioId !== id && m.subCodigoId !== id)));
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        const materialsTotal = selectedMaterials.reduce((acc, curr) => acc + (curr.itemRef.valorUnitario * curr.cantidad), 0);
        const total = materialsTotal + Number(values.valorManoObra);

        const newCode = {
            id: crypto.randomUUID(),
            codigo: values.codigo,
            descripcion: values.descripcion,
            nombre: values.descripcion, // Unified field
            valorManoObra: Number(values.valorManoObra),
            manoDeObra: Number(values.valorManoObra), // Unified field
            costoTotalMateriales: materialsTotal,
            costoTotal: total,
            materiales: selectedMaterials.map(m => ({
                inventarioId: m.inventarioId,
                subCodigoId: m.subCodigoId,
                nombre: m.itemRef.descripcion || m.itemRef.nombre,
                cantidad: m.cantidad,
                valorUnitario: m.itemRef.valorUnitario
            }))
        };

        addCodigoTrabajo(newCode as any); // Casting since mock types might differ slightly in strictness
        toast({ title: "Código Creado", description: "El código de trabajo se ha guardado correctamente." });
        setOpen(false);
        form.reset();
        setSelectedMaterials([]);
    }

    // Calculate Estimated Cost
    const totalMaterialsCost = selectedMaterials.reduce((acc, curr) => acc + (curr.itemRef.valorUnitario * curr.cantidad), 0);
    const moCost = Number(form.watch("valorManoObra") || 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Crear Código
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Nuevo Código de Trabajo</DialogTitle>
                    <DialogDescription>
                        Define un APU o Kit con materiales, mano de obra u otros APUs (anidados).
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="codigo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Código Interno</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. ELEC-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="valorManoObra"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor Mano de Obra</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="descripcion"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Descripción detallada del trabajo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium">Lista de Materiales y Sub-APUs</h4>
                                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-[300px] justify-between">
                                                Agregar Ítem...
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar material o APU..." />
                                                <CommandEmpty>No encontrado.</CommandEmpty>
                                                <ScrollArea className="h-[200px]">
                                                    <CommandGroup>
                                                        {availableItems.map((item) => (
                                                            <CommandItem
                                                                key={`${item.type}-${item.id}`}
                                                                value={item.label}
                                                                onSelect={() => handleAddMaterial(item)}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", selectedMaterials.some(m => (m.inventarioId === item.id || m.subCodigoId === item.id)) ? "opacity-100" : "opacity-0")} />
                                                                {item.label}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </ScrollArea>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="border rounded-md">
                                    <div className="grid grid-cols-12 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                                        <div className="col-span-6">Descripción</div>
                                        <div className="col-span-2 text-right">Cant.</div>
                                        <div className="col-span-3 text-right">Subtotal</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto">
                                        {selectedMaterials.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No hay materiales seleccionados
                                            </div>
                                        ) : selectedMaterials.map((mat) => (
                                            <div key={mat.inventarioId || mat.subCodigoId} className="grid grid-cols-12 gap-2 p-2 items-center border-t text-sm">
                                                <div className="col-span-6 truncate">
                                                    {mat.type === 'APU' && <span className="font-bold mr-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">APU</span>}
                                                    {mat.itemRef.descripcion || mat.itemRef.nombre}
                                                </div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        className="h-7 text-right px-2"
                                                        value={mat.cantidad}
                                                        onChange={(e) => handleUpdateQuantity(mat.inventarioId || mat.subCodigoId, Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-3 text-right">
                                                    {formatCurrency(mat.itemRef.valorUnitario * mat.cantidad)}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleRemoveMaterial(mat.inventarioId || mat.subCodigoId)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-2 border-t bg-muted/20 flex justify-between items-center text-sm font-medium">
                                        <span>Costo Materiales: {formatCurrency(totalMaterialsCost)}</span>
                                        <span className="text-primary">Costo Total Estimado: {formatCurrency(totalMaterialsCost + moCost)}</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Guardar Código</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

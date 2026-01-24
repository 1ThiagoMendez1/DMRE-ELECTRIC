"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Check, ChevronsUpDown, Pencil } from "lucide-react";

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

interface EditWorkCodeDialogProps {
    code: any;
    onClose?: () => void;
}

export function EditWorkCodeDialog({ code, onClose }: EditWorkCodeDialogProps) {
    const [open, setOpen] = useState(false);
    const { updateCodigoTrabajo, inventario } = useErp();
    const { toast } = useToast();

    // Materials Selection State
    const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
    const [comboOpen, setComboOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            codigo: code.codigo,
            descripcion: code.descripcion || code.nombre,
            valorManoObra: String(code.valorManoObra || code.manoDeObra || 0),
        },
    });

    // Load initial materials
    useEffect(() => {
        if (code && code.materiales) {
            // Need to map existing materials to include itemRef (from inventory)
            const mapped = code.materiales.map((m: any) => {
                // Try to find by ID first
                let invItem = inventario.find(i => i.id === m.inventarioId || i.id === m.id);

                // If found, verify Name/Description match (fuzzy) to avoid ID collisions in mock data
                if (invItem && m.nombre && !invItem.descripcion.toLowerCase().includes(m.nombre.toLowerCase()) && !m.nombre.toLowerCase().includes(invItem.descripcion.toLowerCase())) {
                    // Mismatch detected. Try finding by Name instead.
                    const nameMatch = inventario.find(i => i.descripcion === m.nombre || i.descripcion === m.descripcion);
                    if (nameMatch) {
                        invItem = nameMatch;
                    } else {
                        // If no name match, keep invItem? Or discard? 
                        // For safety, if names are wildly different, discard the ID match.
                        // But for now, let's assume Name Match is better if ID match is suspicious.
                        invItem = undefined;
                    }
                }

                // If still not found, try finding by Name directly
                if (!invItem && (m.nombre || m.descripcion)) {
                    invItem = inventario.find(i => i.descripcion === (m.nombre || m.descripcion));
                }

                return {
                    inventarioId: invItem?.id || m.id,
                    cantidad: m.cantidad,
                    // Use found item, or fallback to stored data
                    itemRef: invItem || {
                        id: m.id,
                        valorUnitario: m.valorUnitario || 0,
                        descripcion: m.nombre || m.descripcion || "Item Desconocido",
                    }
                };
            });
            setSelectedMaterials(mapped);
        }
    }, [code, inventario]);

    const handleAddMaterial = (item: any) => {
        if (selectedMaterials.some(m => m.inventarioId === item.id)) {
            toast({ variant: "destructive", title: "Ya agregado", description: "El material ya está en la lista." });
            return;
        }
        setSelectedMaterials([...selectedMaterials, { inventarioId: item.id, cantidad: 1, itemRef: item }]);
        setComboOpen(false);
    };

    const handleUpdateQuantity = (id: string, qty: number) => {
        setSelectedMaterials(prev => prev.map(m => m.inventarioId === id ? { ...m, cantidad: qty } : m));
    };

    const handleRemoveMaterial = (id: string) => {
        setSelectedMaterials(prev => prev.filter(m => m.inventarioId !== id));
    };

    function onSubmit(values: z.infer<typeof formSchema>) {
        const updatedCode = {
            ...code,
            codigo: values.codigo,
            descripcion: values.descripcion,
            nombre: values.descripcion, // Sync nombre for compatibility
            valorManoObra: Number(values.valorManoObra),
            manoDeObra: Number(values.valorManoObra), // Sync for compatibility
            materiales: selectedMaterials.map(m => ({
                inventarioId: m.inventarioId,
                id: m.inventarioId, // Compatibility
                nombre: m.itemRef.descripcion, // Compatibility
                descripcion: m.itemRef.descripcion, // Compatibility
                cantidad: m.cantidad,
                valorUnitario: m.itemRef.valorUnitario
            }))
        };

        updateCodigoTrabajo(updatedCode);
        toast({ title: "Código Actualizado", description: "Los cambios se han guardado correctamente." });
        setOpen(false);
        if (onClose) onClose();
    }

    // Calculate Estimated Cost
    const totalMaterialsCost = selectedMaterials.reduce((acc, curr) => acc + ((curr.itemRef.valorUnitario || 0) * curr.cantidad), 0);
    const moCost = Number(form.watch("valorManoObra") || 0);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val && onClose) onClose();
        }}>
            <DialogTrigger asChild>
                <div className="flex items-center w-full cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Editar Código de Trabajo</DialogTitle>
                    <DialogDescription>
                        Modificar el APU o Kit.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Same fields as Create... reused */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="codigo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Código Interno</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium">Lista de Materiales</h4>
                                    <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" aria-expanded={comboOpen} className="w-[300px] justify-between">
                                                Agregar Material...
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Buscar material..." />
                                                <CommandEmpty>No encontrado.</CommandEmpty>
                                                <ScrollArea className="h-[200px]">
                                                    <CommandGroup>
                                                        {inventario.map((item) => (
                                                            <CommandItem
                                                                key={item.id}
                                                                value={item.descripcion}
                                                                onSelect={() => handleAddMaterial(item)}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", selectedMaterials.some(m => m.inventarioId === item.id) ? "opacity-100" : "opacity-0")} />
                                                                {item.descripcion}
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
                                        <div className="col-span-5">Descripción</div>
                                        <div className="col-span-2 text-right">Cant.</div>
                                        <div className="col-span-2 text-right">Unitario</div>
                                        <div className="col-span-2 text-right">Subtotal</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto">
                                        {selectedMaterials.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No hay materiales seleccionados
                                            </div>
                                        ) : selectedMaterials.map((mat) => (
                                            <div key={mat.inventarioId} className="grid grid-cols-12 gap-2 p-2 items-center border-t text-sm">
                                                <div className="col-span-5 truncate" title={mat.itemRef.descripcion}>{mat.itemRef.descripcion}</div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        className="h-7 text-right px-2"
                                                        value={mat.cantidad}
                                                        onChange={(e) => handleUpdateQuantity(mat.inventarioId, Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-2 text-right text-muted-foreground">
                                                    {formatCurrency(mat.itemRef.valorUnitario || 0)}
                                                </div>
                                                <div className="col-span-2 text-right font-medium">
                                                    {formatCurrency((mat.itemRef.valorUnitario || 0) * mat.cantidad)}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700" onClick={() => handleRemoveMaterial(mat.inventarioId)}>
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
                                <Button type="submit">Guardar Cambios</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

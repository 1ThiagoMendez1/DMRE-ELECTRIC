"use client";

import { useState, useEffect } from "react";
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
import { CodigoTrabajo } from "@/types/sistema";
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

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkCodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    codigosExistentes: CodigoTrabajo[];
    onSave: (codigo: CodigoTrabajo) => void;
}

export function CreateWorkCodeDialog({ open, onOpenChange, codigosExistentes, onSave }: CreateWorkCodeDialogProps) {
    const { inventario, addInstalacion } = useErp(); // Removed codigosTrabajo from here
    const { toast } = useToast();

    // Materials Selection State
    const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]); // { inventarioId, subCodigoId, cantidad, itemRef, type }
    const [comboOpen, setComboOpen] = useState(false);

    // Profit Margins State
    const [margenMateriales, setMargenMateriales] = useState<number>(0);
    const [margenManoObra, setMargenManoObra] = useState<number>(0);

    // Combine Inventory and Work Codes for selection
    const availableItems = [
        ...inventario.map(i => ({ ...i, type: 'MATERIAL', label: i.descripcion, value: i.descripcion })),
        ...codigosExistentes.map(c => ({ // Use codigosExistentes instead of codigosTrabajo
            ...c,
            type: 'APU',
            label: `(APU) ${c.nombre}`,
            value: `(APU) ${c.nombre}`,
            valorUnitario: c.costoTotal // Use calculated total cost for APU
        }))
    ];

    // Initialize form with generated code prefix
    const numApus = codigosExistentes.length;
    const consecutivo = numApus + 1;
    const prefijo = 'ELEC-';

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            codigo: `${prefijo}${consecutivo.toString().padStart(3, '0')}`,
            descripcion: "",
            valorManoObra: "0"
        }
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
        // Sub Totals Calculation
        const materialsTotal = selectedMaterials.reduce((acc, curr) => acc + (curr.itemRef.valorUnitario * curr.cantidad), 0);
        const materialsAiu = materialsTotal * (margenMateriales / 100);
        const materialsConMargen = materialsTotal + materialsAiu;

        const baseMo = Number(values.valorManoObra);
        const moAiu = baseMo * (margenManoObra / 100);
        const moConMargen = baseMo + moAiu;

        const total = materialsConMargen + moConMargen;

        const newCodigo: CodigoTrabajo = {
            id: `COD-${Date.now()}`,
            codigo: values.codigo,
            nombre: values.descripcion, // Fallback if nombre is missing in simplistic form
            descripcion: values.descripcion,
            manoDeObra: moWithProfit,
            valorManoObra: Number(values.valorManoObra || 0),
            materiales: selectedMaterials.map(m => ({
                id: m.itemRef.id,
                nombre: m.type === 'APU' ? `(Sub-APU) ${m.itemRef.descripcion || m.itemRef.nombre}` : m.itemRef.descripcion,
                cantidad: m.cantidad,
                valorUnitario: m.itemRef.valorUnitario
            })),
            costoTotalMateriales: materialsWithProfit,
            costoTotal: grandTotalEstimated,
            fechaCreacion: new Date()
        };

        onSave(newCodigo);

        // CREACIÓN DOBLE AUTOMÁTICA
        try {
            if (addInstalacion) {
                addInstalacion({
                    codigo: values.codigo,
                    descripcion: values.descripcion,
                    valorCalculado: moAiu,
                    activo: true
                });
            }
        } catch (e) {
            console.error("No se pudo crear la instalación clonada:", e);
        }

        toast({ title: "Código Creado", description: "El código de trabajo se ha guardado y replicado como Instalación correctamente." });
        onOpenChange(false); // Close dialog using prop
        form.reset();
        setSelectedMaterials([]);
    }

    // Calculate Estimated Cost Display
    const totalMaterialsCost = selectedMaterials.reduce((acc, curr) => acc + (curr.itemRef.valorUnitario * curr.cantidad), 0);
    const profitMaterials = totalMaterialsCost * (margenMateriales / 100);
    const materialsWithProfit = totalMaterialsCost + profitMaterials;

    // Auto-sync materials total into mano de obra if materials exist
    useEffect(() => {
        if (materialsWithProfit >= 0) {
            // we sync the Subtotal into the Form so the user sees it visually populate
            // use a small timeout to avoid hook conflicts on mount or state spam
            const t = setTimeout(() => {
                const currentMo = Number(form.getValues("valorManoObra") || 0);
                if (currentMo !== materialsWithProfit) {
                    form.setValue("valorManoObra", materialsWithProfit.toString(), { shouldValidate: true });
                }
            }, 50);
            return () => clearTimeout(t);
        }
    }, [materialsWithProfit, form]);

    const moBaseCost = Number(form.watch("valorManoObra") || 0);
    const profitMo = moBaseCost * (margenManoObra / 100);
    const moWithProfit = moBaseCost + profitMo;

    const grandTotalEstimated = materialsWithProfit + moWithProfit;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <DialogTitle className="text-xl font-bold font-headline">
                        Nuevo Código de Trabajo
                    </DialogTitle>
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
                                    name="descripcion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descripción</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Descripción detallada del trabajo" {...field} />
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
                                            <FormLabel>Valor Base Estimado / Mano de Obra</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 px-1">
                                                <span>Valor importado de materiales</span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>Ganancia M.O (%)</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="w-24 text-right"
                                                value={margenManoObra === 0 ? '' : margenManoObra}
                                                onChange={(e) => setMargenManoObra(Number(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                        </FormControl>
                                        <span className="text-sm">%</span>
                                        {profitMo > 0 && <span className="text-sm font-semibold text-green-500 ml-2">+ {formatCurrency(profitMo)}</span>}
                                    </div>
                                    <div className="text-xs text-right mt-1 px-1 bg-primary/10 rounded-md py-1 space-x-2">
                                        <span className="text-muted-foreground">Calculado:</span>
                                        <span className="text-primary font-bold">{formatCurrency(moWithProfit)}</span>
                                    </div>
                                </FormItem>
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
                                    <div className="p-3 border-t bg-muted/20 text-sm rounded-b-md">
                                        <div className="flex justify-between items-center mb-2 text-muted-foreground">
                                            <span>Costo Neto Materiales:</span>
                                            <span>{formatCurrency(totalMaterialsCost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">% Ganancia Materiales:</span>
                                                <Input
                                                    type="number"
                                                    className="h-7 w-16 text-right"
                                                    value={margenMateriales === 0 ? '' : margenMateriales}
                                                    onChange={(e) => setMargenMateriales(Number(e.target.value) || 0)}
                                                    placeholder="0"
                                                />
                                                <span className="text-xs">%</span>
                                            </div>
                                            {profitMaterials > 0 && <span className="text-xs text-green-500 font-medium">+ {formatCurrency(profitMaterials)}</span>}
                                        </div>
                                        <div className="flex justify-between items-center font-bold text-base pt-2 border-t">
                                            <span>Subtotal Materiales (+%):</span>
                                            <span className="text-primary">{formatCurrency(materialsWithProfit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <DialogFooter className="mt-4">
                                <Button type="submit">Guardar Código</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

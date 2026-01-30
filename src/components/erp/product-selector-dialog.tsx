"use client";

import { useState, useMemo } from "react";
import { Search, Package, Wrench, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { CotizacionItem, InventarioItem, CodigoTrabajo } from "@/types/sistema";

interface ProductSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemSelected: (item: CotizacionItem) => void;
    inventario: InventarioItem[];
    codigosTrabajo: CodigoTrabajo[];
}

export function ProductSelectorDialog({ open, onOpenChange, onItemSelected, inventario, codigosTrabajo }: ProductSelectorDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PRODUCTO' | 'SERVICIO'>('ALL');

    const filteredItems = useMemo(() => {
        const products = inventario.map(p => ({
            ...p,
            sourceType: 'PRODUCTO' as const,
            searchStr: `${p.descripcion} ${p.sku} ${p.categoria}`.toLowerCase()
        }));

        const services = codigosTrabajo.map(s => ({
            ...s,
            sourceType: 'SERVICIO' as const,
            searchStr: `${s.nombre} ${s.codigo} ${s.descripcion}`.toLowerCase()
        }));

        let all = [...products, ...services];

        if (activeFilter !== 'ALL') {
            all = all.filter(item => item.sourceType === activeFilter);
        }

        if (searchTerm) {
            const lowerDate = searchTerm.toLowerCase();
            all = all.filter(item => item.searchStr.includes(lowerDate));
        }

        return all;
    }, [searchTerm, activeFilter]);

    const handleSelect = (item: any) => {
        const isService = item.sourceType === 'SERVICIO';

        const newItem: CotizacionItem = {
            id: crypto.randomUUID(), // Temp ID for the quote item
            inventarioId: isService ? undefined : item.id,
            codigoTrabajoId: isService ? item.id : undefined,
            tipo: isService ? 'SERVICIO' : 'PRODUCTO',
            descripcion: isService ? item.nombre : item.descripcion,
            cantidad: 1,
            valorUnitario: isService ? item.costoTotal : item.valorUnitario,
            valorTotal: isService ? item.costoTotal : item.valorUnitario,
            descuentoValor: 0,
            descuentoPorcentaje: 0,
            impuesto: 19, // Default IVA
            ocultarDetalles: false,
            costoUnitario: isService ? item.costoTotal : item.valorUnitario,
            // If it's a service (Code), include subitems
            subItems: isService ? item.materiales : undefined
        };

        onItemSelected(newItem);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Agregar Item a Cotización</DialogTitle>
                    <DialogDescription>
                        Seleccione productos del inventario o códigos de trabajo.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 py-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre, código o descripción..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-1 border rounded-md p-1 bg-muted/20">
                        <Button
                            variant={activeFilter === 'ALL' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('ALL')}
                        >
                            Todos
                        </Button>
                        <Button
                            variant={activeFilter === 'PRODUCTO' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('PRODUCTO')}
                        >
                            <Package className="mr-2 h-3 w-3" /> Productos
                        </Button>
                        <Button
                            variant={activeFilter === 'SERVICIO' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('SERVICIO')}
                        >
                            <Wrench className="mr-2 h-3 w-3" /> Servicios
                        </Button>
                    </div>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-secondary z-10">
                                <TableRow>
                                    <TableHead>Descripión</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Precio Ref.</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No se encontraron items
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item: any) => (
                                        <TableRow key={!!item.sku ? item.sku : item.codigo} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="font-medium">
                                                    {item.sourceType === 'PRODUCTO' ? item.descripcion : item.nombre}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.sourceType === 'PRODUCTO' ? `SKU: ${item.sku} • Stock: ${item.cantidad}` : `COD: ${item.codigo} • ${item.descripcion}`}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.sourceType === 'PRODUCTO' ? (
                                                    <Badge variant="outline" className="gap-1">
                                                        <Package className="h-3 w-3" /> Producto
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Wrench className="h-3 w-3" /> Servicio
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(item.sourceType === 'PRODUCTO' ? item.valorUnitario : item.costoTotal)}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" className="w-full" onClick={() => handleSelect(item)}>
                                                    <Plus className="h-4 w-4 mr-1" /> Agregar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

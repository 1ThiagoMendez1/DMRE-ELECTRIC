"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Package, Code, Bolt, Plus } from "lucide-react";
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
import { CotizacionItem, InventarioItem, CodigoTrabajo, Instalacion, ServicioLogistica } from "@/types/sistema";
import { createClient } from "@/utils/supabase/client";

interface ItemOptions {
    id: string;
    tipo: 'PRODUCTO' | 'SERVICIO';
    subTipo?: 'INSTALACION' | 'APU' | 'SERVICIO_LOGISTICO'; // Se añade este tipado opcional
    codigo: string;
    descripcion: string;
    valorUnitario: number;
    _extraText?: string;
    // Add other properties that might be needed from InventarioItem or CodigoTrabajo
    // For products
    sku?: string;
    cantidad?: number; // stock
    precio_proveedor?: number;
    precioProveedor?: number;
    costoMateriales?: number;
    categoria?: string;
    // For services
    materiales?: any[];
    valorManoObra?: number;
    manoDeObra?: number;
    costoTotal?: number; // Original costTotal from CodigoTrabajo
    searchStr?: string; // Mapeo de búsqueda indexada
}

interface ProductSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onItemSelected: (item: CotizacionItem) => void;
    inventario: InventarioItem[];
    codigosTrabajo: CodigoTrabajo[];
    instalaciones: Instalacion[];
    serviciosLogistica?: any[]; // using any since ServicioLogistica is not directly exported in this file but mapped in the component
}

export function ProductSelectorDialog({ open, onOpenChange, onItemSelected, inventario, codigosTrabajo, instalaciones }: ProductSelectorDialogProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PRODUCTO' | 'SUMINISTRO' | 'INSTALACION' | 'SERVICIO'>('ALL');
    const [serviciosState, setServiciosState] = useState<ServicioLogistica[]>([]);
    const [instalacionesState, setInstalacionesState] = useState<Instalacion[]>([]);

    // Fetch servicios logisticos directly from Supabase when dialog opens
    useEffect(() => {
        if (!open) return;
        const supabase = createClient();

        // Fetch servicios
        supabase
            .from("servicios_logistica")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (!error && data) {
                    setServiciosState(data.map((sl: any) => ({
                        id: sl.id,
                        codigo: sl.codigo,
                        nombre: sl.nombre,
                        costo: Number(sl.costo || 0),
                    })));
                } else if (error) {
                    console.error("Error fetching servicios:", error);
                }
            });

        // Fetch instalaciones
        supabase
            .from("instalaciones")
            .select("*")
            .then(({ data, error }) => {
                if (!error && data) {
                    setInstalacionesState(data.map((i: any) => ({
                        id: i.id,
                        codigo: i.codigo,
                        descripcion: i.descripcion || "",
                        valorCalculado: Number(i.valor_calculado) || 0,
                        activo: i.activo,
                    })));
                } else if (error) {
                    console.error("Error fetching instalaciones:", error);
                }
            });
    }, [open]);

    const filteredItems = useMemo(() => {
        const products: ItemOptions[] = (inventario || []).map(p => ({
            id: p.id,
            tipo: 'PRODUCTO',
            codigo: p.sku || '', // Use SKU as code for products
            descripcion: p.descripcion,
            valorUnitario: p.valorUnitario || 0,
            sku: p.sku,
            cantidad: p.cantidad,
            precioProveedor: p.precioProveedor,
            costoMateriales: p.costoMateriales,
            _extraText: p.categoria,
            searchStr: `${p.descripcion} ${p.sku} ${p.categoria}`.toLowerCase()
        }));

        const services: ItemOptions[] = (codigosTrabajo || []).map(s => {
            const invMatch = (inventario || []).find(inv => inv.sku === s.codigo || inv.item === s.codigo);
            return {
                id: s.id,
                tipo: 'SERVICIO',
                subTipo: 'APU',
                codigo: s.codigo,
                descripcion: s.nombre,
                valorUnitario: s.costoTotal || 0, // Use costoTotal as the reference price
                _extraText: s.descripcion,
                materiales: s.materiales,
                valorManoObra: s.valorManoObra,
                manoDeObra: s.manoDeObra,
                costoTotal: s.costoTotal, // Keep original costTotal for calculation if needed
                cantidad: invMatch?.cantidad ?? 0, // Extract stock organically
                searchStr: `${s.nombre} ${s.codigo} ${s.descripcion}`.toLowerCase()
            };
        });



        const installs: ItemOptions[] = instalacionesState.map(i => {
            const invMatch = (inventario || []).find(inv => inv.sku === i.codigo || inv.item === i.codigo);
            return {
                id: i.id,
                tipo: 'SERVICIO',
                subTipo: 'INSTALACION',
                codigo: i.codigo,
                descripcion: i.descripcion,
                valorUnitario: i.valorCalculado || 0,
                _extraText: 'Instalación Básica',
                valorManoObra: i.valorCalculado,
                manoDeObra: i.valorCalculado,
                costoTotal: i.valorCalculado,
                cantidad: invMatch?.cantidad ?? 0,
                searchStr: `${i.descripcion} ${i.codigo}`.toLowerCase()
            };
        });

        const srvLogistica: ItemOptions[] = serviciosState.map(sl => {
            const invMatch = (inventario || []).find(inv => inv.sku === sl.codigo || inv.item === sl.codigo);
            return {
                id: sl.id,
                tipo: 'SERVICIO',
                subTipo: 'SERVICIO_LOGISTICO',
                codigo: sl.codigo,
                descripcion: sl.nombre,
                valorUnitario: sl.costo || 0,
                _extraText: 'Servicio Logístico',
                valorManoObra: sl.costo,
                manoDeObra: sl.costo,
                costoTotal: sl.costo,
                cantidad: invMatch?.cantidad ?? 0,
                searchStr: `${sl.nombre} ${sl.codigo}`.toLowerCase()
            };
        });

        // Combinar todos asegurando que productos no se dupliquen con servicios que comparten código (sincronizados)
        const existingCodes = new Set([...services, ...installs, ...srvLogistica].map(x => x.codigo));
        const standaloneProducts = products.filter(p => !existingCodes.has(p.codigo));
        
        let all = [...standaloneProducts, ...services, ...installs, ...srvLogistica];

        if (activeFilter !== 'ALL') {
            if (activeFilter === 'PRODUCTO') {
                all = [...products]; // In case they force the filter
            } else if (activeFilter === 'SUMINISTRO') {
                all = all.filter(item => item.subTipo === 'APU' || item.tipo === 'PRODUCTO');
            } else if (activeFilter === 'INSTALACION') {
                all = all.filter(item => item.subTipo === 'INSTALACION');
            } else if (activeFilter === 'SERVICIO') {
                all = all.filter(item => item.subTipo === 'SERVICIO_LOGISTICO');
            }
        }

        if (searchTerm) {
            const lowerDate = searchTerm.toLowerCase();
            all = all.filter(item => item.searchStr?.includes(lowerDate));
        }

        return all;
    }, [searchTerm, activeFilter, inventario, codigosTrabajo, instalacionesState, serviciosState]);

    const handleSelect = (item: ItemOptions) => {
        const isService = item.tipo === 'SERVICIO';

        // Robust calculation for services that might have been saved with cost 0
        let servicePrice = isService ? (item.costoTotal || 0) : 0;
        if (isService && servicePrice === 0) {
            const materialsPrice = (item.materiales || []).reduce((acc: number, m: any) => acc + (Number(m.valorUnitario || 0) * Number(m.cantidad || 0)), 0);
            servicePrice = materialsPrice + Number(item.valorManoObra || item.manoDeObra || 0);
        }

        const newItem: CotizacionItem = {
            id: crypto.randomUUID(), // Temp ID for the quote item
            inventarioId: isService ? undefined : item.id,
            // Only APU items (CodigosTrabajo) have a valid codigoTrabajoId FK.
            // Instalaciones and Servicios Logísticos live in separate tables.
            codigoTrabajoId: item.subTipo === 'APU' ? item.id : undefined,
            tipo: item.tipo,
            descripcion: item.subTipo === 'APU' && !item.descripcion.toUpperCase().includes('SUMINISTRO')
                ? `Suministro: ${item.descripcion}`
                : item.subTipo === 'INSTALACION' && !item.descripcion.toUpperCase().includes('INSTALACIÓN') && !item.descripcion.toUpperCase().includes('INSTALACION')
                    ? `Instalación: ${item.descripcion}`
                    : item.descripcion,
            cantidad: 1,
            valorUnitario: isService ? servicePrice : (item.valorUnitario || 0),
            valorTotal: isService ? servicePrice : (item.valorUnitario || 0),
            descuentoValor: 0,
            descuentoPorcentaje: 0,
            impuesto: 19, // Default IVA
            ocultarDetalles: true,
            costoUnitario: isService ? servicePrice : (item.precio_proveedor || item.precioProveedor || item.costoMateriales || 0),
            // Only APU services have sub-items (materials); Instalaciones/Servicios Logísticos do not
            subItems: item.subTipo === 'APU' ? item.materiales : undefined,
            codigoItem: item.codigo
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
                            variant={activeFilter === 'SUMINISTRO' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('SUMINISTRO')}
                        >
                            <Code className="mr-2 h-3 w-3" /> Suministros
                        </Button>
                        <Button
                            variant={activeFilter === 'INSTALACION' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('INSTALACION')}
                        >
                            <Bolt className="mr-2 h-3 w-3" /> Instalaciones
                        </Button>
                        <Button
                            variant={activeFilter === 'SERVICIO' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveFilter('SERVICIO')}
                        >
                            <Bolt className="mr-2 h-3 w-3" /> Servicios
                        </Button>
                    </div>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden relative">
                    <div className="absolute inset-0 overflow-auto">
                        {filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                <Search className="h-8 w-8 mb-4 text-muted-foreground/50" />
                                <p>No se encontraron items que coincidan con la búsqueda.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 p-2">
                                {filteredItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-default"
                                    >
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="mt-1 flex-shrink-0">
                                                {item.tipo === 'PRODUCTO' ? (
                                                    <Package className="h-5 w-5 text-blue-500" />
                                                ) : item.subTipo === 'INSTALACION' ? (
                                                    <Bolt className="h-5 w-5 text-orange-500" />
                                                ) : (
                                                    <Code className="h-5 w-5 text-green-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold truncate" title={item.descripcion}>{item.descripcion}</span>
                                                    <Badge variant={item.tipo === 'PRODUCTO' ? 'outline' : item.subTipo === 'INSTALACION' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                                                        {item.tipo === 'PRODUCTO' ? 'Producto' : item.subTipo === 'INSTALACION' ? 'Instalación' : 'APU'}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <span className="font-mono text-xs px-1.5 py-0.5 bg-muted rounded">
                                                        {item.codigo}
                                                    </span>
                                                    {item._extraText && (
                                                        <span className="truncate max-w-[250px]" title={item._extraText}>{item._extraText}</span>
                                                    )}
                                                    {(item.cantidad || 0) > 0 && (
                                                        <Badge variant="outline" className="text-[10px] ml-2 bg-green-500/10 text-green-600 border-green-500/20">
                                                            Stock: {item.cantidad}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 ml-4 shrink-0">
                                            <div className="text-right">
                                                <div className="font-bold text-primary font-mono">
                                                    {formatCurrency(item.valorUnitario)}
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => handleSelect(item)} className="shrink-0 flex items-center gap-1">
                                                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Agregar</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import { Cliente, InventarioItem, CotizacionItem, Cotizacion, CodigoTrabajo } from "@/types/sistema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, User, Search, Plus, Save, FileDown, X, Package, Wrench, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { ProductSelectorDialog } from "@/components/erp/product-selector-dialog";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CotizadorProps {
    clientes: Cliente[];
    inventario: InventarioItem[];
    codigosTrabajo: CodigoTrabajo[];
    initialData?: Cotizacion | null;
    onClose: () => void;
    onSave?: (quote: Cotizacion) => void;
}

export function Cotizador({ clientes, inventario, codigosTrabajo, initialData, onClose, onSave }: CotizadorProps) {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [items, setItems] = useState<CotizacionItem[]>([]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showProductsInPdf, setShowProductsInPdf] = useState(true);
    const [fechaCotizacion, setFechaCotizacion] = useState<string>(new Date().toISOString().split('T')[0]);
    const [descripcionTrabajo, setDescripcionTrabajo] = useState("");
    const [tipoOferta, setTipoOferta] = useState<Cotizacion['tipo']>('NORMAL');

    // Global AIU & Tax State
    const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
    const [globalIvaPct, setGlobalIvaPct] = useState(19);
    const [aiuAdminPct, setAiuAdminPct] = useState(0);
    const [aiuImprevistoPct, setAiuImprevistoPct] = useState(0);
    const [aiuUtilidadPct, setAiuUtilidadPct] = useState(0);
    const [ivaUtilidadPct, setIvaUtilidadPct] = useState(19);

    const handleInternalSave = () => {
        if (!selectedCliente || !onSave) return;

        const quote: Cotizacion = {
            id: initialData?.id || `COT-${Math.floor(Math.random() * 10000)}`,
            numero: initialData?.numero || `COT-${Math.floor(Math.random() * 10000)}`,
            tipo: tipoOferta,
            fecha: new Date(fechaCotizacion),
            cliente: selectedCliente,
            clienteId: selectedCliente.id,
            descripcionTrabajo: descripcionTrabajo,
            items: items,
            subtotal: subtotal,
            iva: iva,
            descuentoGlobal: descuento,
            descuentoGlobalPorcentaje: globalDiscountPct,
            impuestoGlobalPorcentaje: globalIvaPct,
            aiuAdminGlobalPorcentaje: aiuAdminPct,
            aiuImprevistoGlobalPorcentaje: aiuImprevistoPct,
            aiuUtilidadGlobalPorcentaje: aiuUtilidadPct,
            ivaUtilidadGlobalPorcentaje: ivaUtilidadPct,
            aiuAdmin: aiuAdminVal,
            aiuImprevistos: aiuImprevistoVal,
            aiuUtilidad: aiuUtilidadVal,
            total: total,
            estado: initialData?.estado || 'BORRADOR'
        };

        onSave(quote);
        onClose();
    };

    // Removal of old global state as we moved it up

    // Cargar datos iniciales si existen (Modo Edición/Visualización)
    useEffect(() => {
        if (initialData) {
            setSelectedCliente(initialData.cliente);
            setItems(initialData.items.map(item => ({
                ...item,
                aiuAdminPorcentaje: item.aiuAdminPorcentaje || initialData.aiuAdminGlobalPorcentaje || 0,
                aiuImprevistoPorcentaje: item.aiuImprevistoPorcentaje || initialData.aiuImprevistoGlobalPorcentaje || 0,
                aiuUtilidadPorcentaje: item.aiuUtilidadPorcentaje || initialData.aiuUtilidadGlobalPorcentaje || 0,
                ivaUtilidadPorcentaje: item.ivaUtilidadPorcentaje || initialData.ivaUtilidadGlobalPorcentaje || 19,
            })));
            setFechaCotizacion(new Date(initialData.fecha).toISOString().split('T')[0]);
            setDescripcionTrabajo(initialData.descripcionTrabajo || "");
            setTipoOferta(initialData.tipo || 'NORMAL');
            setGlobalDiscountPct(initialData.descuentoGlobalPorcentaje || 0);
            setGlobalIvaPct(initialData.impuestoGlobalPorcentaje || 19);
            setAiuAdminPct(initialData.aiuAdminGlobalPorcentaje || 0);
            setAiuImprevistoPct(initialData.aiuImprevistoGlobalPorcentaje || 0);
            setAiuUtilidadPct(initialData.aiuUtilidadGlobalPorcentaje || 0);
            setIvaUtilidadPct(initialData.ivaUtilidadGlobalPorcentaje || 19);
        }
    }, [initialData]);

    const handleExportPDF = () => {
        console.log("Exportando PDF...", {
            cliente: selectedCliente,
            items: showProductsInPdf ? items : "Ocultos en PDF",
            total
        });
        alert(`Generando PDF... \n¿Incluir Productos?: ${showProductsInPdf ? "Sí" : "No"}`);
    };

    // Totales
    const { subtotal, descuento, aiuAdminVal, aiuImprevistoVal, aiuUtilidadVal, iva, total } = useMemo(() => {
        const sub = items.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0);
        const discountVal = sub * (globalDiscountPct / 100);
        const subAfterDiscount = sub - discountVal;

        const aiuAdmin = subAfterDiscount * (aiuAdminPct / 100);
        const aiuImprevisto = subAfterDiscount * (aiuImprevistoPct / 100);
        const aiuUtilidad = subAfterDiscount * (aiuUtilidadPct / 100);

        const taxableBase = subAfterDiscount + (aiuUtilidad); // Usually IVA is on Utility
        const totalIva = taxableBase * (globalIvaPct / 100);

        return {
            subtotal: sub,
            descuento: discountVal,
            aiuAdminVal: aiuAdmin,
            aiuImprevistoVal: aiuImprevisto,
            aiuUtilidadVal: aiuUtilidad,
            iva: totalIva,
            total: subAfterDiscount + aiuAdmin + aiuImprevisto + aiuUtilidad + totalIva
        };
    }, [items, globalDiscountPct, globalIvaPct, aiuAdminPct, aiuImprevistoPct, aiuUtilidadPct]);

    // Handlers
    const handleSelectClient = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsClientModalOpen(false);
    };

    const handleAddItem = (newItem: CotizacionItem) => {
        const itemWithAiu: CotizacionItem = {
            ...newItem,
            aiuAdminPorcentaje: aiuAdminPct,
            aiuImprevistoPorcentaje: aiuImprevistoPct,
            aiuUtilidadPorcentaje: aiuUtilidadPct,
            ivaUtilidadPorcentaje: ivaUtilidadPct,
        };
        setItems([...items, itemWithAiu]);
        setIsInventoryModalOpen(false);
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setItems(items.map((item) => {
            if (item.id === itemId) {
                return {
                    ...item,
                    cantidad: newQuantity,
                    valorTotal: item.valorUnitario * newQuantity
                };
            }
            return item;
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter((i) => i.id !== itemId));
    };

    const filteredInventory = inventario.filter(i =>
        i.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* Left Column: Quote Details */}
                <div className="lg:col-span-2 space-y-4 flex flex-col h-full overflow-hidden">
                    {/* Header Info Section */}
                    <Card className="shrink-0">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-medium">Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="fecha" className="text-xs">Fecha de Emisión</Label>
                                <Input
                                    id="fecha"
                                    type="date"
                                    value={fechaCotizacion}
                                    onChange={(e) => setFechaCotizacion(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="tipo" className="text-xs">Tipo de Oferta</Label>
                                <Select value={tipoOferta} onValueChange={(v: any) => setTipoOferta(v)}>
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="SIMPLIFICADA">Simplificada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <Label htmlFor="descripcion" className="text-xs">Descripción del Trabajo</Label>
                                <Input
                                    id="descripcion"
                                    value={descripcionTrabajo}
                                    onChange={(e) => setDescripcionTrabajo(e.target.value)}
                                    placeholder="Ej: Instalación eléctrica trifásica..."
                                    className="h-8 text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client Section */}
                    <Card className="shrink-0">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 py-3">
                            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setIsClientModalOpen(true)}>
                                <User className="mr-2 h-3 w-3" />
                                {selectedCliente ? "Cambiar" : "Seleccionar"}
                            </Button>
                        </CardHeader>
                        <CardContent className="py-2">
                            {selectedCliente ? (
                                <div className="text-sm">
                                    <p className="font-semibold">{selectedCliente.nombre}</p>
                                    <p className="text-muted-foreground">{selectedCliente.documento} - {selectedCliente.telefono}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Ningún cliente seleccionado</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items Section */}
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between py-3 shrink-0">
                            <CardTitle className="text-sm font-medium">Items</CardTitle>
                            <Button size="sm" onClick={() => setIsInventoryModalOpen(true)} disabled={!selectedCliente}>
                                <Plus className="mr-2 h-3 w-3" /> Agregar
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="w-[80px]">Cant.</TableHead>
                                        <TableHead className="text-right w-[100px]">Precio Prov.</TableHead>
                                        <TableHead className="text-right w-[100px]">Precio Venta</TableHead>
                                        <TableHead className="text-right w-[100px]">Total</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Sin items.
                                            </TableCell>
                                        </TableRow>
                                    ) : items.map((item, index) => {
                                        const finalTotal = item.cantidad * item.valorUnitario;

                                        return (
                                            <Fragment key={item.id}>
                                                <TableRow>
                                                    <TableCell className="text-xs">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                {item.tipo === 'SERVICIO' ? <Wrench className="h-3 w-3 text-blue-500" /> : <Package className="h-3 w-3 text-green-500" />}
                                                                <span className="font-medium">{item.descripcion}</span>
                                                            </div>
                                                            {item.tipo === 'SERVICIO' && item.subItems && item.subItems.length > 0 && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <CheckboxUI
                                                                        id={`hide-details-${item.id}`}
                                                                        checked={!!item.ocultarDetalles}
                                                                        onCheckedChange={(checked) => {
                                                                            const updated = [...items];
                                                                            updated[index].ocultarDetalles = !!checked;
                                                                            setItems(updated);
                                                                        }}
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <Label htmlFor={`hide-details-${item.id}`} className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                                                                        <EyeOff className="h-3 w-3" /> Ocultar detalles
                                                                    </Label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.cantidad}
                                                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            className="h-7 w-14 text-xs"
                                                            min={1}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.costoUnitario}
                                                            onChange={(e) => {
                                                                const updated = [...items];
                                                                updated[index].costoUnitario = parseFloat(e.target.value) || 0;
                                                                setItems(updated);
                                                            }}
                                                            className="h-7 w-20 text-xs text-right"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Input
                                                            type="number"
                                                            value={item.valorUnitario}
                                                            onChange={(e) => {
                                                                const updated = [...items];
                                                                updated[index].valorUnitario = parseFloat(e.target.value) || 0;
                                                                setItems(updated);
                                                            }}
                                                            className="h-7 w-20 text-xs text-right"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-bold">
                                                        {formatCurrency(finalTotal)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {/* Subitems Render */}
                                                {item.tipo === 'SERVICIO' && item.subItems && !item.ocultarDetalles && (
                                                    item.subItems.map((sub, subIdx) => (
                                                        <TableRow key={`${item.id}-sub-${subIdx}`} className="bg-muted/10 border-0 hover:bg-transparent">
                                                            <TableCell colSpan={2} className="pl-8 py-1">
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span>↳</span>
                                                                    <span>{sub.nombre}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center py-1 text-[10px] text-muted-foreground">
                                                                {sub.cantidad * item.cantidad} un.
                                                            </TableCell>
                                                            <TableCell colSpan={2}></TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary & Actions */}
                <div className="space-y-4">
                    <Card className="bg-muted/30">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 py-2">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">IVA</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-6 w-12 text-right text-xs p-1"
                                            value={globalIvaPct}
                                            onChange={e => setGlobalIvaPct(Number(e.target.value))}
                                            placeholder="19"
                                        />
                                        <span className="text-xs">%</span>
                                        <span className="ml-2">{formatCurrency(iva)}</span>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                <div className="space-y-2">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Desglose AIU</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[9px]">Admin %</Label>
                                            <Input type="number" className="h-6 text-[10px] p-1" value={aiuAdminPct} onChange={e => setAiuAdminPct(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px]">Impr. %</Label>
                                            <Input type="number" className="h-6 text-[10px] p-1" value={aiuImprevistoPct} onChange={e => setAiuImprevistoPct(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px]">Util. %</Label>
                                            <Input type="number" className="h-6 text-[10px] p-1" value={aiuUtilidadPct} onChange={e => setAiuUtilidadPct(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Total Amortización:</span>
                                        <span className="font-mono">{formatCurrency(aiuAdminVal + aiuImprevistoVal + aiuUtilidadVal)}</span>
                                    </div>
                                </div>

                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="showProducts"
                                    checked={showProductsInPdf}
                                    onChange={(e) => setShowProductsInPdf(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary"
                                />
                                <Label htmlFor="showProducts" className="text-xs cursor-pointer">
                                    Mostrar productos en PDF
                                </Label>
                            </div>

                            <div className="grid gap-2 pt-2">
                                <Button className="w-full" size="sm" disabled={items.length === 0 || !selectedCliente} onClick={handleInternalSave}>
                                    <Save className="mr-2 h-3 w-3" /> {initialData ? "Actualizar" : "Guardar"}
                                </Button>
                                <Button variant="outline" className="w-full" size="sm" disabled={items.length === 0} onClick={handleExportPDF}>
                                    <FileDown className="mr-2 h-3 w-3" /> Exportar PDF
                                </Button>
                                <Button variant="ghost" className="w-full" size="sm" onClick={onClose}>
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals placed at root of component to avoid z-index issues inside relative parents if any */}

            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Seleccionar Cliente</DialogTitle>
                        <DialogDescription>
                            Busque y seleccione un cliente para asociar a la cotización.
                        </DialogDescription>
                    </DialogHeader>
                    {/* ... Client Search Content ... */}
                    <div className="space-y-4">
                        <div className="flex items-center border rounded-md px-3">
                            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input className="border-0 focus-visible:ring-0" placeholder="Buscar cliente..." />
                        </div>
                        <ScrollArea className="h-[300px]">
                            {clientes.map(cliente => (
                                <div
                                    key={cliente.id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border mb-2"
                                    onClick={() => handleSelectClient(cliente)}
                                >
                                    <div>
                                        <p className="font-medium">{cliente.nombre}</p>
                                        <p className="text-xs text-muted-foreground">{cliente.documento}</p>
                                    </div>
                                    <Badge variant="outline">Seleccionar</Badge>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <ProductSelectorDialog
                open={isInventoryModalOpen}
                onOpenChange={setIsInventoryModalOpen}
                onItemSelected={handleAddItem}
                inventario={inventario}
                codigosTrabajo={codigosTrabajo}
            />
        </div>
    );
}

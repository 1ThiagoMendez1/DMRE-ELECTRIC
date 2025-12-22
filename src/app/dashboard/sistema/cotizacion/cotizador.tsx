"use client";

import { useState, useMemo, useEffect } from "react";
import { Cliente, InventarioItem, CotizacionItem, Cotizacion } from "@/types/sistema";
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
import { Trash2, User, Search, Plus, Save, FileDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface CotizadorProps {
    clientes: Cliente[];
    inventario: InventarioItem[];
    initialData?: Cotizacion | null;
    onClose: () => void;
}

export function Cotizador({ clientes, inventario, initialData, onClose }: CotizadorProps) {
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [items, setItems] = useState<CotizacionItem[]>([]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showProductsInPdf, setShowProductsInPdf] = useState(true);
    const [fechaCotizacion, setFechaCotizacion] = useState<string>(new Date().toISOString().split('T')[0]);

    // Cargar datos iniciales si existen (Modo Edición/Visualización)
    useEffect(() => {
        if (initialData) {
            setSelectedCliente(initialData.cliente);
            setItems(initialData.items);
            setFechaCotizacion(new Date(initialData.fecha).toISOString().split('T')[0]);
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
    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.valorTotal, 0), [items]);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // Handlers
    const handleSelectClient = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setIsClientModalOpen(false);
    };

    const handleAddItem = (producto: InventarioItem) => {
        const existingItem = items.find((i) => i.inventarioId === producto.id);
        if (existingItem) {
            handleUpdateQuantity(existingItem.id, existingItem.cantidad + 1);
        } else {
            const newItem: CotizacionItem = {
                id: Math.random().toString(36).substr(2, 9),
                inventarioId: producto.id,
                descripcion: producto.descripcion,
                cantidad: 1,
                valorUnitario: producto.valorUnitario,
                valorTotal: producto.valorUnitario,
            };
            setItems([...items, newItem]);
        }
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
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="w-[40px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                Sin items.
                                            </TableCell>
                                        </TableRow>
                                    ) : items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs">{item.descripcion}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.cantidad}
                                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                    className="h-7 w-16 text-xs"
                                                    min={1}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-medium">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.valorTotal)}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                                    <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">IVA (19%)</span>
                                    <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(iva)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}</span>
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
                                <Button className="w-full" size="sm" disabled={items.length === 0 || !selectedCliente} onClick={onClose}>
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

            <Dialog open={isInventoryModalOpen} onOpenChange={setIsInventoryModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Inventario</DialogTitle>
                    </DialogHeader>
                    {/* ... Inventory Search Content ... */}
                    <div className="space-y-4">
                        <div className="flex items-center border rounded-md px-3">
                            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="border-0 focus-visible:ring-0"
                                placeholder="Buscar producto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[400px]">
                            {filteredInventory.map(item => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors border mb-2"
                                    onClick={() => handleAddItem(item)}
                                >
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <Badge variant={item.tipo === 'COMPUESTO' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                {item.tipo}
                                            </Badge>
                                            <p className="font-medium text-sm">{item.descripcion}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Ref: {item.item} | Disp: {item.cantidad}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.valorUnitario)}
                                        </p>
                                        <Badge variant="outline" className="mt-1 cursor-pointer">Agregar</Badge>
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

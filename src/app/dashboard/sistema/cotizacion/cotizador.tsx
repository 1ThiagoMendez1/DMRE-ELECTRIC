"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import { Cliente, InventarioItem, CotizacionItem, Cotizacion, CodigoTrabajo, Instalacion, ServicioLogistica } from "@/types/sistema";
import { useErp } from "@/components/providers/erp-provider";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateQuotePDF } from "@/utils/pdf-generator";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";
interface CotizadorProps {
    clientes: Cliente[];
    inventario: InventarioItem[];
    codigosTrabajo: CodigoTrabajo[];
    instalaciones?: Instalacion[];
    servicios?: ServicioLogistica[];
    initialData?: Cotizacion | null;
    onClose: () => void;
    onSave?: (quote: Cotizacion) => void;
}

export function Cotizador({ clientes, inventario, codigosTrabajo, instalaciones: propInstalaciones, servicios, initialData, onClose, onSave }: CotizadorProps) {
    const { currentUser } = useErp();
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [items, setItems] = useState<CotizacionItem[]>([]);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [visibilityMode, setVisibilityMode] = useState<'MOSTRAR_TODO' | 'MODO_PRIVADO' | 'OCULTAR_TODO'>('MOSTRAR_TODO');
    const [privadoSuministros, setPrivadoSuministros] = useState("");
    const [privadoInstalacion, setPrivadoInstalacion] = useState("");
    const [privadoServicios, setPrivadoServicios] = useState("");
    const [fechaCotizacion, setFechaCotizacion] = useState<string>(new Date().toISOString().split('T')[0]);
    const [fechaValidez, setFechaValidez] = useState<string>("");
    const [descripcionTrabajo, setDescripcionTrabajo] = useState("");
    const [tipoOferta, setTipoOferta] = useState<Cotizacion['tipo']>('NORMAL');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("editor");

    // Terms
    const [alcance, setAlcance] = useState("");
    const [formaPago, setFormaPago] = useState("");
    const [notaFinal, setNotaFinal] = useState("");
    const [elaboradoPor, setElaboradoPor] = useState("");

    // Global AIU & Tax State
    const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
    const [globalIvaPct, setGlobalIvaPct] = useState(19);
    const [esAiu, setEsAiu] = useState(false);
    const [aiuAdminPct, setAiuAdminPct] = useState(0);
    const [aiuImprevistoPct, setAiuImprevistoPct] = useState(0);
    const [aiuUtilidadPct, setAiuUtilidadPct] = useState(0);
    const [ivaUtilidadPct, setIvaUtilidadPct] = useState(19);

    const handleInternalSave = async () => {
        if (!selectedCliente || !onSave || isSaving) return;

        setIsSaving(true);
        try {
            const quote: Cotizacion = {
                id: initialData?.id || `temp-${Date.now()}`,
                numero: initialData?.numero || "", // Let server generate if new
                tipo: tipoOferta,
                fecha: new Date(`${fechaCotizacion}T12:00:00`),
                fechaValidez: fechaValidez ? new Date(`${fechaValidez}T12:00:00`) : undefined,
                cliente: selectedCliente,
                clienteId: selectedCliente.id,
                descripcionTrabajo: descripcionTrabajo,
                items: items,
                subtotal: subtotal,
                iva: iva,
                descuentoGlobal: descuento,
                descuentoGlobalPorcentaje: globalDiscountPct,
                impuestoGlobalPorcentaje: globalIvaPct,
                aiuAdminGlobalPorcentaje: esAiu ? aiuAdminPct : 0,
                aiuImprevistoGlobalPorcentaje: esAiu ? aiuImprevistoPct : 0,
                aiuUtilidadGlobalPorcentaje: esAiu ? aiuUtilidadPct : 0,
                ivaUtilidadGlobalPorcentaje: ivaUtilidadPct,
                aiuAdmin: aiuAdminVal,
                aiuImprevistos: aiuImprevistoVal,
                aiuUtilidad: aiuUtilidadVal,
                total: total,
                estado: initialData?.estado || 'BORRADOR',
                elaboradoPor: elaboradoPor || currentUser?.name || "José Gabriel Ramirez Bernal",
                alcance: alcance,
                formaPago: formaPago,
                notaFinal: notaFinal,
                opcionesPdf: {
                    visibilityMode: visibilityMode,
                    privadoSuministros: privadoSuministros,
                    privadoInstalacion: privadoInstalacion,
                    privadoServicios: privadoServicios
                }
            };

            await onSave(quote);
            onClose();
        } catch (error) {
            console.error("Error saving quotation:", error);
            // Error handling is managed by erp-provider toast
        } finally {
            setIsSaving(false);
        }
    };

    // Extraction of global items for the modals
    const globalContext = useErp();
    const globalInstalaciones = globalContext.instalaciones;

    // Determine final instalaciones to use (props override global if provided)
    const activeInstalaciones = propInstalaciones || globalInstalaciones || [];

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
            if (initialData.fechaValidez) {
                setFechaValidez(new Date(initialData.fechaValidez).toISOString().split('T')[0]);
            } else {
                setFechaValidez("");
            }
            setDescripcionTrabajo(initialData.descripcionTrabajo || "");
            setAlcance(initialData.alcance || "");
            setFormaPago(initialData.formaPago || "");
            setNotaFinal(initialData.notaFinal || "");
            
            // Cargar estado de Opciones PDF (Modo Privado, etc.)
            setVisibilityMode(initialData.opcionesPdf?.visibilityMode || 'MOSTRAR_TODO');
            setPrivadoSuministros(initialData.opcionesPdf?.privadoSuministros || "");
            setPrivadoInstalacion(initialData.opcionesPdf?.privadoInstalacion || "");
            setPrivadoServicios(initialData.opcionesPdf?.privadoServicios || "");

            setTipoOferta(initialData.tipo || 'NORMAL');
            setGlobalDiscountPct(initialData.descuentoGlobalPorcentaje || 0);
            setGlobalIvaPct(initialData.impuestoGlobalPorcentaje || 19);
            setAiuAdminPct(initialData.aiuAdminGlobalPorcentaje || 0);
            setAiuImprevistoPct(initialData.aiuImprevistoGlobalPorcentaje || 0);
            setAiuUtilidadPct(initialData.aiuUtilidadGlobalPorcentaje || 0);
            setIvaUtilidadPct(initialData.ivaUtilidadGlobalPorcentaje || 19);
            const hasAiu = (initialData.aiuAdminGlobalPorcentaje || 0) > 0 || (initialData.aiuImprevistoGlobalPorcentaje || 0) > 0 || (initialData.aiuUtilidadGlobalPorcentaje || 0) > 0;
            setEsAiu(hasAiu);
            setElaboradoPor(initialData.elaboradoPor || "");
        } else {
            // Default preparer for new quotes
            setElaboradoPor(currentUser?.name || "");
        }
    }, [initialData?.id, currentUser?.name]);


    const { subtotal, descuento, aiuAdminVal, aiuImprevistoVal, aiuUtilidadVal, iva, total } = useMemo(() => {
        const sub = items.reduce((acc, item) => {
            const extra = item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0;
            return acc + (item.cantidad * (item.valorUnitario + extra));
        }, 0);
        const discountVal = sub * (globalDiscountPct / 100);
        const subAfterDiscount = sub - discountVal;

        const aiuAdmin = esAiu ? subAfterDiscount * (aiuAdminPct / 100) : 0;
        const aiuImprevisto = esAiu ? subAfterDiscount * (aiuImprevistoPct / 100) : 0;
        const aiuUtilidad = esAiu ? subAfterDiscount * (aiuUtilidadPct / 100) : 0;

        // If AIU is active, calculate IVA based on the `ivaUtilidadPct` input (usually 19%), over the 'Utilidad' value only.
        // If AIU is inactive, apply `globalIvaPct` (usually 19%) over the full discounted subtotal.
        const totalIva = esAiu
            ? aiuUtilidad * (ivaUtilidadPct / 100)
            : subAfterDiscount * (globalIvaPct / 100);

        return {
            subtotal: sub,
            descuento: discountVal,
            aiuAdminVal: aiuAdmin,
            aiuImprevistoVal: aiuImprevisto,
            aiuUtilidadVal: aiuUtilidad,
            iva: totalIva,
            total: subAfterDiscount + aiuAdmin + aiuImprevisto + aiuUtilidad + totalIva
        };
    }, [items, globalDiscountPct, globalIvaPct, aiuAdminPct, aiuImprevistoPct, aiuUtilidadPct, ivaUtilidadPct, esAiu]);

    const getCurrentQuoteObj = (): Cotizacion => ({
        id: initialData?.id || `temp-${Date.now()}`,
        numero: initialData?.numero || (tipoOferta === 'SIMPLIFICADA' ? 'S-NUEVO' : 'NUEVO'),
        tipo: tipoOferta,
        fecha: new Date(`${fechaCotizacion}T12:00:00`),
        fechaValidez: fechaValidez ? new Date(`${fechaValidez}T12:00:00`) : undefined,
        cliente: selectedCliente || {
            id: 'temp', nombre: 'Cliente de Prueba', documento: '000000',
            direccion: 'No definida', correo: '', telefono: '',
            contactoPrincipal: '', fechaCreacion: new Date()
        },
        clienteId: selectedCliente?.id || 'temp',
        descripcionTrabajo: descripcionTrabajo,
        items: items.map(item => {
            const extra = item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0;
            return {
                ...item,
                valorTotal: item.cantidad * (item.valorUnitario + extra)
            };
        }),
        subtotal: subtotal,
        iva: iva,
        descuentoGlobal: descuento,
        alcance: alcance,
        formaPago: formaPago,
        notaFinal: notaFinal,
        opcionesPdf: {
            visibilityMode: visibilityMode,
            privadoSuministros: privadoSuministros,
            privadoInstalacion: privadoInstalacion,
            privadoServicios: privadoServicios
        },
        descuentoGlobalPorcentaje: globalDiscountPct,
        impuestoGlobalPorcentaje: globalIvaPct,
        aiuAdminGlobalPorcentaje: esAiu ? aiuAdminPct : 0,
        aiuImprevistoGlobalPorcentaje: esAiu ? aiuImprevistoPct : 0,
        aiuUtilidadGlobalPorcentaje: esAiu ? aiuUtilidadPct : 0,
        ivaUtilidadGlobalPorcentaje: ivaUtilidadPct,
        aiuAdmin: aiuAdminVal,
        aiuImprevistos: aiuImprevistoVal,
        aiuUtilidad: aiuUtilidadVal,
        total: total,
        estado: initialData?.estado || 'BORRADOR'
    });

    const handleGeneratePreview = () => {
        setIsGeneratingPdf(true);
        setTimeout(() => {
            try {
                const quoteObj = getCurrentQuoteObj();
                const privadoOptions = visibilityMode === 'MODO_PRIVADO' ? {
                    suministros: privadoSuministros,
                    instalacion: privadoInstalacion,
                    servicios: privadoServicios
                } : undefined;

                const url = generateQuotePDF(
                    quoteObj,
                    visibilityMode as any, // type cast if needed
                    undefined, // default company
                    undefined, // default style
                    'bloburl',
                    elaboradoPor || currentUser?.name,
                    undefined,
                    privadoOptions
                ) as string;

                setPdfUrl(url);
            } catch (err) {
                console.error("Error generating PDF preview", err);
            } finally {
                setIsGeneratingPdf(false);
            }
        }, 100);
    };

    // Generate PDF automatically when switching to the preview tab if it's not generated yet
    useEffect(() => {
        if (activeTab === "preview") {
            handleGeneratePreview();
        }
    }, [activeTab]);

    const handleExportPDF = () => {
        if (!selectedCliente) return;
        const quoteObj = getCurrentQuoteObj();
        const privadoOptions = visibilityMode === 'MODO_PRIVADO' ? {
            suministros: privadoSuministros,
            instalacion: privadoInstalacion,
            servicios: privadoServicios
        } : undefined;

        generateQuotePDF(
            quoteObj,
            visibilityMode as any,
            undefined,
            undefined,
            'save',
            elaboradoPor || currentUser?.name,
            undefined,
            privadoOptions
        );
    };

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
                {/* Left Column: Quote Details / PDF Preview */}
                <div className="lg:col-span-2 space-y-4 flex flex-col h-full overflow-hidden">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center shrink-0 mb-4">
                            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                                <TabsTrigger value="editor">Editor</TabsTrigger>
                                <TabsTrigger value="preview">Vista Previa PDF</TabsTrigger>
                            </TabsList>
                            {activeTab === "preview" && (
                                <Button variant="outline" size="sm" onClick={handleGeneratePreview} disabled={isGeneratingPdf}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                                    Actualizar
                                </Button>
                            )}
                        </div>

                        <TabsContent value="editor" className="flex-1 flex-col space-y-4 overflow-auto m-0 outline-none pb-4">
                            {/* Header Info Section */}
                            <Card className="shrink-0">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm font-medium">Información General</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                        <Label htmlFor="fechaValidez" className="text-xs">Fecha de Vencimiento</Label>
                                        <Input
                                            id="fechaValidez"
                                            type="date"
                                            value={fechaValidez}
                                            onChange={(e) => setFechaValidez(e.target.value)}
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
                                    <div className="col-span-1 md:col-span-3 space-y-1">
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
                                                <TableHead className="text-right w-[100px]">Precio proveedor</TableHead>
                                                <TableHead className="text-center w-[80px]">%</TableHead>
                                                <TableHead className="text-right w-[100px]">Precio %</TableHead>
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
                                                const extra = item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0;
                                                const finalTotal = item.cantidad * (item.valorUnitario + extra);

                                                return (
                                                    <Fragment key={item.id}>
                                                        <TableRow>
                                                            <TableCell className="text-xs">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        {item.tipo === 'SERVICIO' ? <Wrench className="h-3 w-3 text-blue-500" /> : <Package className="h-3 w-3 text-green-500" />}
                                                                        <span className="font-medium">{item.descripcion.replace(/INSTALACIONES:/gi, 'Instalación:')}</span>
                                                                    </div>
                                                                    {item.tipo === 'SERVICIO' && item.subItems && item.subItems.length > 0 && (
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <CheckboxUI
                                                                                id={`show-details-${item.id}`}
                                                                                checked={!item.ocultarDetalles}
                                                                                onCheckedChange={(checked) => {
                                                                                    const updated = [...items];
                                                                                    updated[index].ocultarDetalles = !checked;
                                                                                    setItems(updated);
                                                                                }}
                                                                                className="h-3 w-3"
                                                                            />
                                                                            <Label htmlFor={`show-details-${item.id}`} className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                                                                                {item.ocultarDetalles ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Mostrar materiales
                                                                            </Label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    type="number"
                                                                    value={item.cantidad === 0 ? '' : item.cantidad}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                                                    className="h-7 text-xs px-2"
                                                                    style={{
                                                                        fieldSizing: 'content',
                                                                        width: `${Math.max(4, (item.cantidad === 0 ? 0 : item.cantidad.toString().length) + 4)}ch`,
                                                                        minWidth: '4ch'
                                                                    } as any}
                                                                    min={1}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    value={item.valorUnitario === 0 ? '' : item.valorUnitario}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={(e) => {
                                                                        const updated = [...items];
                                                                        const val = parseFloat(e.target.value) || 0;
                                                                        updated[index].valorUnitario = val;
                                                                        const ex = updated[index].porcentaje ? val * (updated[index].porcentaje / 100) : 0;
                                                                        updated[index].valorTotal = updated[index].cantidad * (val + ex);
                                                                        setItems(updated);
                                                                    }}
                                                                    className="h-7 text-xs text-right px-2"
                                                                    style={{
                                                                        fieldSizing: 'content',
                                                                        width: `${Math.max(8, (item.valorUnitario === 0 ? 0 : item.valorUnitario.toString().length) + 5)}ch`,
                                                                        minWidth: '8ch'
                                                                    } as any}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <div className="flex items-center justify-center">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.porcentaje ?? ''}
                                                                        onFocus={(e) => e.target.select()}
                                                                        onChange={(e) => {
                                                                            const updated = [...items];
                                                                            const val = e.target.value;
                                                                            const newPct = val === '' ? undefined : parseFloat(val);
                                                                            updated[index].porcentaje = newPct;
                                                                            const ex = newPct ? updated[index].valorUnitario * (newPct / 100) : 0;
                                                                            updated[index].valorTotal = updated[index].cantidad * (updated[index].valorUnitario + ex);
                                                                            setItems(updated);
                                                                        }}
                                                                        className="h-7 text-xs text-center px-1"
                                                                        style={{
                                                                            fieldSizing: 'content',
                                                                            width: `${Math.max(5, (item.porcentaje?.toString().length || 0) + 4)}ch`,
                                                                            minWidth: '5ch'
                                                                        } as any}
                                                                        placeholder="%"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Input
                                                                    type="number"
                                                                    readOnly
                                                                    value={item.porcentaje !== undefined ? Math.round(item.valorUnitario * (1 + item.porcentaje / 100)) : ''}
                                                                    className="h-7 text-xs text-right bg-muted/20 px-2"
                                                                    style={{
                                                                        fieldSizing: 'content',
                                                                        width: `${Math.max(8, (item.porcentaje !== undefined ? Math.round(item.valorUnitario * (1 + item.porcentaje / 100)).toString().length : 0) + 5)}ch`,
                                                                        minWidth: '8ch'
                                                                    } as any}
                                                                    placeholder="$"
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

                            {/* Terms Section */}
                            <Card className="shrink-0">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm font-medium">Condiciones Comerciales</CardTitle>
                                </CardHeader>
                                <CardContent className="py-2 space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="alcance" className="text-xs">Alcance</Label>
                                        <Textarea
                                            id="alcance"
                                            value={alcance}
                                            onChange={(e) => setAlcance(e.target.value)}
                                            placeholder="Describa el alcance de los trabajos..."
                                            className="min-h-[60px] text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="formaPago" className="text-xs">Forma de Pago</Label>
                                        <Textarea
                                            id="formaPago"
                                            value={formaPago}
                                            onChange={(e) => setFormaPago(e.target.value)}
                                            placeholder="Especificar anticipos, contraentregas..."
                                            className="min-h-[40px] text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="notaFinal" className="text-xs">Nota Final (Condiciones)</Label>
                                        <Textarea
                                            id="notaFinal"
                                            value={notaFinal}
                                            onChange={(e) => setNotaFinal(e.target.value)}
                                            placeholder="Información adicional e importante..."
                                            className="min-h-[60px] text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preview" className="flex-1 h-full min-h-[60vh] md:min-h-[80vh] m-0 outline-none">
                            <Card className="h-full flex flex-col items-center justify-center p-0 overflow-hidden border">
                                {isGeneratingPdf ? (
                                    <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                                        <RefreshCw className="h-8 w-8 mb-4 animate-spin" />
                                        <p>Generando vista previa...</p>
                                    </div>
                                ) : pdfUrl ? (
                                    <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full min-h-[60vh] md:min-h-[80vh] rounded-md" title="PDF Preview" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <p>No se pudo generar el PDF o no hay datos suficientes.</p>
                                        <Button variant="outline" className="mt-4" onClick={handleGeneratePreview}>Intentar de nuevo</Button>
                                    </div>
                                )}
                            </Card>
                        </TabsContent>
                    </Tabs>
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

                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-muted-foreground">Descuento</span>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            className="h-6 text-right text-xs p-1 px-2"
                                            style={{
                                                fieldSizing: 'content',
                                                width: `${Math.max(4, (globalDiscountPct === 0 ? 0 : globalDiscountPct.toString().length) + 3)}ch`,
                                                minWidth: '4ch'
                                            } as any}
                                            value={globalDiscountPct === 0 ? '' : globalDiscountPct}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => setGlobalDiscountPct(Number(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                        <span className="text-xs">%</span>
                                        <span className="ml-2">-{formatCurrency(descuento)}</span>
                                    </div>
                                </div>

                                {descuento > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-primary mt-1">
                                        <span>Subtotal con descuento</span>
                                        <span>{formatCurrency(subtotal - descuento)}</span>
                                    </div>
                                )}

                                <Separator className="my-2" />

                                {/* We hide general IVA if AIU is checked since AIU uses IVA on Utility */}
                                {!esAiu && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">IVA</span>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                className="h-6 text-right text-xs p-1 px-2"
                                                style={{
                                                    fieldSizing: 'content',
                                                    width: `${Math.max(4, (globalIvaPct === 0 ? 0 : globalIvaPct.toString().length) + 3)}ch`,
                                                    minWidth: '4ch'
                                                } as any}
                                                value={globalIvaPct === 0 ? '' : globalIvaPct}
                                                onFocus={(e) => e.target.select()}
                                                onChange={e => setGlobalIvaPct(Number(e.target.value) || 0)}
                                                placeholder="19"
                                            />
                                            <span className="text-xs">%</span>
                                            <span className="ml-2">{formatCurrency(iva)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 py-1">
                                    <CheckboxUI
                                        id="es-aiu"
                                        checked={esAiu}
                                        onCheckedChange={(checked) => setEsAiu(!!checked)}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="es-aiu" className="text-xs cursor-pointer font-medium">
                                        Cotización con AIU
                                    </Label>
                                </div>

                                {esAiu && (
                                    <>
                                        <Separator className="my-2" />

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Desglose AIU</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[9px]">Admin %</Label>
                                                    <Input type="number" className="h-6 text-[10px] p-1" style={{ width: '100%' }} value={aiuAdminPct === 0 ? '' : aiuAdminPct} onFocus={(e) => e.target.select()} onChange={e => setAiuAdminPct(Number(e.target.value) || 0)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px]">Impr. %</Label>
                                                    <Input type="number" className="h-6 text-[10px] p-1" style={{ width: '100%' }} value={aiuImprevistoPct === 0 ? '' : aiuImprevistoPct} onFocus={(e) => e.target.select()} onChange={e => setAiuImprevistoPct(Number(e.target.value) || 0)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px]">Util. %</Label>
                                                    <Input type="number" className="h-6 text-[10px] p-1" style={{ width: '100%' }} value={aiuUtilidadPct === 0 ? '' : aiuUtilidadPct} onFocus={(e) => e.target.select()} onChange={e => setAiuUtilidadPct(Number(e.target.value) || 0)} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-sm pt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground text-xs">IVA s/ Util.</span>
                                                    <div className="flex items-center">
                                                        <Input
                                                            type="number"
                                                            className="h-6 text-right text-xs p-1 px-2"
                                                            style={{
                                                                fieldSizing: 'content',
                                                                width: `${Math.max(4, (ivaUtilidadPct === 0 ? 0 : ivaUtilidadPct.toString().length) + 3)}ch`,
                                                                minWidth: '4ch'
                                                            } as any}
                                                            value={ivaUtilidadPct === 0 ? '' : ivaUtilidadPct}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={e => setIvaUtilidadPct(Number(e.target.value) || 0)}
                                                            placeholder="19"
                                                        />
                                                        <span className="text-xs ml-1">%</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs">{formatCurrency(iva)}</span>
                                            </div>

                                            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t">
                                                <span>Total Amortización:</span>
                                                <span className="font-mono">{formatCurrency(aiuAdminVal + aiuImprevistoVal + aiuUtilidadVal + iva)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>


                            <Separator className="my-2" />

                            <div className="space-y-2 pb-2">
                                <Label className="text-xs font-medium">Visibilidad</Label>
                                <Select
                                    value={visibilityMode}
                                    onValueChange={(value) => setVisibilityMode(value as any)}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-muted/50">
                                        <SelectValue placeholder="Seleccione visibilidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MOSTRAR_TODO">
                                            <div className="flex items-center gap-2">
                                                <span>📋</span>
                                                <span>Mostrar Todo</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="MODO_PRIVADO">
                                            <div className="flex items-center gap-2">
                                                <span>🔒</span>
                                                <span>Modo Privado</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="OCULTAR_TODO">
                                            <div className="flex items-center gap-2">
                                                <span>🚫</span>
                                                <span>Ocultar Todo</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {visibilityMode === 'MODO_PRIVADO' && (
                                <div className="space-y-3 pt-2 pb-2 border-t mt-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Textos Modo Privado</p>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold">Suministros:</Label>
                                        <Input className="h-7 text-xs" value={privadoSuministros} onChange={e => setPrivadoSuministros(e.target.value)} placeholder="Ej: Materiales generales..." />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold">Instalación:</Label>
                                        <Input className="h-7 text-xs" value={privadoInstalacion} onChange={e => setPrivadoInstalacion(e.target.value)} placeholder="Ej: Mano de obra empleada..." />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold">Servicios:</Label>
                                        <Input className="h-7 text-xs" value={privadoServicios} onChange={e => setPrivadoServicios(e.target.value)} placeholder="Ej: Logística, viáticos..." />
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-2 pt-2">
                                <Button className="w-full" size="sm" disabled={items.length === 0 || !selectedCliente || isSaving} onClick={handleInternalSave}>
                                    {isSaving ? (
                                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-3 w-3" />
                                    )}
                                    {isSaving ? "Guardando..." : (initialData ? "Actualizar" : "Guardar")}
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
                            <Input
                                className="border-0 focus-visible:ring-0"
                                placeholder="Buscar cliente por nombre o NIT..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[300px]">
                            {clientes.filter(c =>
                                c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
                                (c.documento && c.documento.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                            ).map(cliente => (
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
                instalaciones={activeInstalaciones}
                serviciosLogistica={servicios}
            />
        </div>
    );
}

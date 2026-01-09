"use client";

import { useState, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    FileText,
    Pencil,
    Plus,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Eye,
    EyeOff,
    Package,
    Trash2,
    Save
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Cotizacion, CotizacionItem, EstadoCotizacion, InventarioItem } from "@/types/sistema";
import { generateQuotePDF } from "@/utils/pdf-generator";
import { initialInventory, initialCodigosTrabajo } from "@/lib/mock-data";
import { ProductSelectorDialog } from "./product-selector-dialog";

interface HistorialEntry {
    id: string;
    fecha: Date;
    tipo: 'CREACION' | 'ESTADO' | 'PROGRESO' | 'EDICION' | 'NOTA' | 'ITEM_AGREGADO' | 'ITEM_OCULTO';
    descripcion: string;
    usuario: string;
    valorAnterior?: string;
    valorNuevo?: string;
}

interface ItemConVisibilidad extends CotizacionItem {
    visibleEnPdf: boolean;
}

interface TrabajoHistoryDialogProps {
    trabajo: Cotizacion;
    onTrabajoUpdated: (updated: Cotizacion) => void;
    trigger?: React.ReactNode;
    defaultTab?: 'detalles' | 'items' | 'preview' | 'historial';
}

const getStatusColor = (estado: EstadoCotizacion): string => {
    switch (estado) {
        case 'BORRADOR': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        case 'ENVIADA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'EN_REVISION': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'APROBADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'EN_EJECUCION': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        case 'FINALIZADA': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'RECHAZADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default: return '';
    }
};

export function TrabajoHistoryDialog({ trabajo, onTrabajoUpdated, trigger, defaultTab = 'detalles' }: TrabajoHistoryDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [newNote, setNewNote] = useState("");
    const [newProgress, setNewProgress] = useState<string>(trabajo.estado);
    const [progressPercent, setProgressPercent] = useState<number>(50);

    // Items with visibility control
    const [items, setItems] = useState<ItemConVisibilidad[]>(
        trabajo.items.map(item => ({ ...item, visibleEnPdf: true }))
    );

    // Add item dialog
    const [showAddItem, setShowAddItem] = useState(false);

    // Global Settings (Initialize from Trabajo or Defaults)
    const [globalDiscountPct, setGlobalDiscountPct] = useState(trabajo.descuentoGlobalPorcentaje || 0);
    const [globalIvaPct, setGlobalIvaPct] = useState(trabajo.impuestoGlobalPorcentaje || 19);

    // AIU Global Defaults
    const [aiuAdminPct, setAiuAdminPct] = useState(trabajo.aiuAdminGlobalPorcentaje || 0);
    const [aiuImprevPct, setAiuImprevPct] = useState(trabajo.aiuImprevistoGlobalPorcentaje || 0);
    const [aiuUtilPct, setAiuUtilPct] = useState(trabajo.aiuUtilidadGlobalPorcentaje || 0);
    const [ivaUtilPct, setIvaUtilPct] = useState(trabajo.ivaUtilidadGlobalPorcentaje || 19);

    const visibleItems = useMemo(() => items.filter(i => i.visibleEnPdf), [items]);

    // Update all items when global AIU changes (User Requirement: "si se pone un 5%... automatico para todos")
    const updateGlobalAiu = (type: 'ADMIN' | 'IMPREV' | 'UTIL' | 'IVAUTIL', value: number) => {
        if (type === 'ADMIN') setAiuAdminPct(value);
        if (type === 'IMPREV') setAiuImprevPct(value);
        if (type === 'UTIL') setAiuUtilPct(value);
        if (type === 'IVAUTIL') setIvaUtilPct(value);

        setItems(prev => prev.map(item => ({
            ...item,
            aiuAdminPorcentaje: type === 'ADMIN' ? value : item.aiuAdminPorcentaje,
            aiuImprevistoPorcentaje: type === 'IMPREV' ? value : item.aiuImprevistoPorcentaje,
            aiuUtilidadPorcentaje: type === 'UTIL' ? value : item.aiuUtilidadPorcentaje,
            ivaUtilidadPorcentaje: type === 'IVAUTIL' ? value : item.ivaUtilidadPorcentaje,
        })));
    };


    // Anexo materiales toggle
    const [showAnexoMateriales, setShowAnexoMateriales] = useState(true);
    const [showMaterialsInline, setShowMaterialsInline] = useState(false); // New: Inline materials in PDF preview

    // Simulate history - in production this would come from backend
    const [historial, setHistorial] = useState<HistorialEntry[]>([
        {
            id: '1',
            fecha: trabajo.fecha,
            tipo: 'CREACION',
            descripcion: 'Trabajo creado',
            usuario: 'Sistema',
        },
        ...(trabajo.estado !== 'BORRADOR' ? [{
            id: '2',
            fecha: new Date(new Date(trabajo.fecha).getTime() + 86400000),
            tipo: 'ESTADO' as const,
            descripcion: 'Estado actualizado',
            usuario: 'Admin',
            valorAnterior: 'BORRADOR',
            valorNuevo: trabajo.estado,
        }] : [])
    ]);





    // Calculate totals with AIU logic
    const { subtotal, descuento, iva, total, totalAiuAdmin, totalAiuImprev, totalAiuUtil } = useMemo(() => {
        let sub = 0;
        let tAdmin = 0;
        let tImprev = 0;
        let tUtil = 0;

        // Sum up derived values from items
        const itemResults = items.map(item => {
            const cost = item.costoUnitario || (item.valorUnitario * 0.7); // Fallback if no cost (approx margin)

            // Item AIU Values
            const admin = cost * ((item.aiuAdminPorcentaje || 0) / 100);
            const imprev = cost * ((item.aiuImprevistoPorcentaje || 0) / 100);
            const util = cost * ((item.aiuUtilidadPorcentaje || 0) / 100);

            // Price Sale Base (Cost + AIU)
            const priceSale = cost + admin + imprev + util;

            // IVA on Utility (if applicable)
            const ivaUtilVal = util * ((item.ivaUtilidadPorcentaje || 0) / 100);

            // Item Final Total (Unitary)
            const itemTotalUnit = priceSale + ivaUtilVal;

            // Total Line
            const lineTotal = itemTotalUnit * item.cantidad;

            return {
                lineTotal,
                admin: admin * item.cantidad,
                imprev: imprev * item.cantidad,
                util: util * item.cantidad
            };
        });

        sub = itemResults.reduce((acc, r) => acc + r.lineTotal, 0);
        tAdmin = itemResults.reduce((acc, r) => acc + r.admin, 0);
        tImprev = itemResults.reduce((acc, r) => acc + r.imprev, 0);
        tUtil = itemResults.reduce((acc, r) => acc + r.util, 0);

        // Apply Global Discount to the Subtotal
        const discountVal = sub * (globalDiscountPct / 100);
        const subAfterDiscount = sub - discountVal;

        // Apply Global IVA (Standard Tax on the whole amount, if configured)
        // Note: If IVA on Utility is used, usually Global IVA is 0 or specific logic. 
        // We faithfully apply what the user asked: "Recuerda el IVA anterior" + AIU logic.
        const totalIva = subAfterDiscount * (globalIvaPct / 100);

        return {
            subtotal: sub,
            descuento: discountVal,
            iva: totalIva,
            total: subAfterDiscount + totalIva,
            totalAiuAdmin: tAdmin,
            totalAiuImprev: tImprev,
            totalAiuUtil: tUtil
        };
    }, [items, globalDiscountPct, globalIvaPct]);

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        const entry: HistorialEntry = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'NOTA',
            descripcion: newNote,
            usuario: 'Usuario Actual',
        };

        setHistorial([entry, ...historial]);
        setNewNote("");
    };

    const handleUpdateProgress = () => {
        const entry: HistorialEntry = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'PROGRESO',
            descripcion: `Progreso actualizado a ${progressPercent}%`,
            usuario: 'Usuario Actual',
            valorAnterior: `${progressPercent - 10}%`,
            valorNuevo: `${progressPercent}%`,
        };

        setHistorial([entry, ...historial]);

        // Update trabajo estado based on progress
        let nuevoEstado: EstadoCotizacion = trabajo.estado;
        if (progressPercent >= 100) nuevoEstado = 'FINALIZADA';
        else if (progressPercent >= 60) nuevoEstado = 'EN_EJECUCION';
        else if (progressPercent >= 40) nuevoEstado = 'APROBADA';

        const updated = {
            ...trabajo,
            estado: nuevoEstado,
            fechaActualizacion: new Date()
        };
        onTrabajoUpdated(updated);
    };

    const handleToggleItemVisibility = (itemId: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const newVisibility = !item.visibleEnPdf;
                // Log to history
                const entry: HistorialEntry = {
                    id: Date.now().toString(),
                    fecha: new Date(),
                    tipo: 'ITEM_OCULTO',
                    descripcion: newVisibility ? `Item "${item.descripcion}" visible en PDF` : `Item "${item.descripcion}" oculto del PDF`,
                    usuario: 'Usuario Actual',
                };
                setHistorial(h => [entry, ...h]);
                return { ...item, visibleEnPdf: newVisibility };
            }
            return item;
        }));
    };

    const handleAddItem = (newItem: CotizacionItem) => {
        const itemWithVis: ItemConVisibilidad = {
            ...newItem,
            visibleEnPdf: true
        };

        const updatedItems = [...items, itemWithVis];
        setItems(updatedItems);

        // Update parent
        const updatedTrabajo = {
            ...trabajo,
            items: updatedItems,
        };
        onTrabajoUpdated(updatedTrabajo);

        // Add history entry
        const historyEntry: HistorialEntry = {
            id: crypto.randomUUID(),
            fecha: new Date(),
            tipo: 'ITEM_AGREGADO',
            descripcion: `Se agregó el item: ${newItem.descripcion}`,
            usuario: 'Usuario Actual'
        };
        setHistorial(h => [historyEntry, ...h]);
        setShowAddItem(false);

    };

    const handleRemoveItem = (itemId: string) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        setItems(prev => prev.filter(i => i.id !== itemId));

        const entry: HistorialEntry = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'EDICION',
            descripcion: `Item eliminado: ${item.descripcion}`,
            usuario: 'Usuario Actual',
        };
        setHistorial(h => [entry, ...h]);
    };

    const handleUpdateItemQuantity = (itemId: string, cantidad: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, cantidad, valorTotal: item.valorUnitario * cantidad };
            }
            return item;
        }));
    };

    const getEntryIcon = (tipo: HistorialEntry['tipo']) => {
        switch (tipo) {
            case 'CREACION': return <Plus className="h-4 w-4 text-green-500" />;
            case 'ESTADO': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case 'PROGRESO': return <TrendingUp className="h-4 w-4 text-purple-500" />;
            case 'EDICION': return <Pencil className="h-4 w-4 text-orange-500" />;
            case 'NOTA': return <AlertCircle className="h-4 w-4 text-gray-500" />;
            case 'ITEM_AGREGADO': return <Package className="h-4 w-4 text-green-500" />;
            case 'ITEM_OCULTO': return <EyeOff className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <span className="cursor-pointer hover:underline text-primary font-medium">
                        {trabajo.cliente.nombre}
                    </span>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Trabajo #{trabajo.numero} - {trabajo.cliente.nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Gestión completa del trabajo: progreso, items, historial y vista previa
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'detalles' | 'items' | 'preview' | 'historial')} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="detalles">Detalles</TabsTrigger>
                        <TabsTrigger value="items">Items & Edición</TabsTrigger>
                        <TabsTrigger value="preview">Vista PDF</TabsTrigger>
                        <TabsTrigger value="historial">Historial</TabsTrigger>
                    </TabsList>

                    {/* DETALLES TAB */}
                    <TabsContent value="detalles" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Client Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <User className="h-4 w-4" /> Cliente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-semibold">{trabajo.cliente.nombre}</p>
                                    <p className="text-xs text-muted-foreground">{trabajo.cliente.documento}</p>
                                    <p className="text-xs text-muted-foreground">{trabajo.cliente.telefono}</p>
                                    <p className="text-xs text-muted-foreground">{trabajo.cliente.correo}</p>
                                </CardContent>
                            </Card>

                            {/* Trabajo Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Información
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div>
                                        <span className="text-xs text-muted-foreground">Descripción:</span>
                                        <p className="text-sm">{trabajo.descripcionTrabajo}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline">{trabajo.tipo}</Badge>

                                        <div className="flex-1">
                                            <Select
                                                value={trabajo.estado}
                                                onValueChange={(val) => onTrabajoUpdated({ ...trabajo, estado: val as any, fechaActualizacion: new Date() })}
                                            >
                                                <SelectTrigger className="h-7 w-auto text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="BORRADOR">Borrador</SelectItem>
                                                    <SelectItem value="ENVIADA">Enviada</SelectItem>
                                                    <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                                                    <SelectItem value="APROBADA">Aprobada</SelectItem>
                                                    <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                                                    <SelectItem value="EN_EJECUCION">En Ejecución</SelectItem>
                                                    <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                                                    <SelectItem value="NO_APROBADA">No Aprobada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Value */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Valor Total</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                                    <p className="text-xs text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                                    <p className="text-xs text-muted-foreground">IVA (19%): {formatCurrency(iva)}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Progress Section */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Progreso del Trabajo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Slider
                                            value={[progressPercent]}
                                            onValueChange={(v) => setProgressPercent(v[0])}
                                            max={100}
                                            step={5}
                                        />
                                    </div>
                                    <div className="w-20 text-center">
                                        <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Progress value={progressPercent} className="flex-1 h-3 mr-4" />
                                    <Button size="sm" onClick={handleUpdateProgress}>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Progreso
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Add Note */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">Agregar Nota</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Escribe una nota sobre el avance..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="min-h-[60px]"
                                    />
                                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ITEMS TAB */}
                    <TabsContent value="items" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Items de la Cotización</h3>
                            <Button size="sm" onClick={() => setShowAddItem(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Item
                            </Button>
                        </div>
                        <div className="bg-muted p-2 rounded mb-4 grid grid-cols-4 gap-4">
                            <div>
                                <Label className="text-xs">AIU Admin %</Label>
                                <Input
                                    type="number"
                                    value={aiuAdminPct}
                                    onChange={e => updateGlobalAiu('ADMIN', Number(e.target.value))}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">AIU Imprev %</Label>
                                <Input
                                    type="number"
                                    value={aiuImprevPct}
                                    onChange={e => updateGlobalAiu('IMPREV', Number(e.target.value))}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">AIU Util %</Label>
                                <Input
                                    type="number"
                                    value={aiuUtilPct}
                                    onChange={e => updateGlobalAiu('UTIL', Number(e.target.value))}
                                    className="h-7 text-xs"
                                />
                            </div>
                            <div>
                                <Label className="text-xs">IVA s/Util %</Label>
                                <Input
                                    type="number"
                                    value={ivaUtilPct}
                                    disabled={aiuUtilPct === 0} // "si agrega un % en utilidad automaticamente este tambien debe habilitarlo"
                                    onChange={e => updateGlobalAiu('IVAUTIL', Number(e.target.value))}
                                    className="h-7 text-xs"
                                />
                            </div>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="w-[60px]">Cant.</TableHead>
                                            <TableHead className="text-right w-[100px]">P. Prov.</TableHead>
                                            <TableHead className="text-right w-[100px]">P. Venta</TableHead>
                                            <TableHead className="text-center w-[60px]">Adm %</TableHead>
                                            <TableHead className="text-center w-[60px]">Imp %</TableHead>
                                            <TableHead className="text-center w-[60px]">Util %</TableHead>
                                            <TableHead className="text-center w-[60px]">IVA U%</TableHead>
                                            <TableHead className="text-right w-[110px]">Total</TableHead>
                                            <TableHead className="w-[40px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => {
                                            // Calculations per item
                                            const cost = item.costoUnitario || (item.valorUnitario * 0.7); // Simulation if missing
                                            const admin = cost * ((item.aiuAdminPorcentaje || 0) / 100);
                                            const imprev = cost * ((item.aiuImprevistoPorcentaje || 0) / 100);
                                            const util = cost * ((item.aiuUtilidadPorcentaje || 0) / 100);
                                            const priceSale = cost + admin + imprev + util;
                                            const ivaUtilVal = util * ((item.ivaUtilidadPorcentaje || 0) / 100);
                                            const finalUnitTotal = priceSale + ivaUtilVal;
                                            const rowTotal = finalUnitTotal * item.cantidad;

                                            return (
                                                <>
                                                    <TableRow key={item.id} className={!item.visibleEnPdf ? 'opacity-50 bg-muted/30' : ''}>
                                                        <TableCell className="min-w-[200px]">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    {item.tipo === 'SERVICIO' ? <Wrench className="h-3 w-3 text-blue-500" /> : <Package className="h-3 w-3 text-green-500" />}
                                                                    <span className="font-medium text-xs">{item.descripcion}</span>
                                                                </div>
                                                                {/* Sub-item count badge */}
                                                                {item.subItems && item.subItems.length > 0 && (
                                                                    <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1 py-0">
                                                                        {item.subItems.length} materiales
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                className="h-7 w-12 text-xs p-1"
                                                                min={1}
                                                            />
                                                        </TableCell>
                                                        {/* P. Proveedor (Cost) */}
                                                        <TableCell className="text-right p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.costoUnitario || ''}
                                                                placeholder={formatCurrency(cost)}
                                                                onChange={e => {
                                                                    const val = parseFloat(e.target.value);
                                                                    setItems(prev => prev.with(index, { ...item, costoUnitario: val }));
                                                                }}
                                                                className="h-7 w-20 text-xs text-right p-1"
                                                            />
                                                        </TableCell>
                                                        {/* P. Venta (Calc) */}
                                                        <TableCell className="text-right text-xs font-mono">
                                                            {formatCurrency(priceSale)}
                                                        </TableCell>
                                                        {/* AIU Inputs per Item */}
                                                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs p-1 text-center" value={item.aiuAdminPorcentaje || 0} onChange={e => setItems(prev => prev.with(index, { ...item, aiuAdminPorcentaje: parseFloat(e.target.value) }))} /></TableCell>
                                                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs p-1 text-center" value={item.aiuImprevistoPorcentaje || 0} onChange={e => setItems(prev => prev.with(index, { ...item, aiuImprevistoPorcentaje: parseFloat(e.target.value) }))} /></TableCell>
                                                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs p-1 text-center" value={item.aiuUtilidadPorcentaje || 0} onChange={e => setItems(prev => prev.with(index, { ...item, aiuUtilidadPorcentaje: parseFloat(e.target.value) }))} /></TableCell>
                                                        <TableCell className="p-1"><Input type="number" className="h-7 text-xs p-1 text-center" disabled={!item.aiuUtilidadPorcentaje} value={item.ivaUtilidadPorcentaje || 0} onChange={e => setItems(prev => prev.with(index, { ...item, ivaUtilidadPorcentaje: parseFloat(e.target.value) }))} /></TableCell>

                                                        <TableCell className="text-right font-bold text-xs font-mono">
                                                            {formatCurrency(rowTotal)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Subitems Materials View */}
                                                    {item.subItems && item.subItems.length > 0 && item.subItems.map((sub, sIdx) => (
                                                        <TableRow key={`${item.id}-sub-${sIdx}`} className="bg-muted/10 border-0 hover:bg-transparent">
                                                            <TableCell colSpan={2} className="pl-6 py-1">
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                                    <span>↳</span>
                                                                    <span>{sub.nombre}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-1 text-[10px] font-mono text-muted-foreground">
                                                                {formatCurrency(sub.valorUnitario)}
                                                            </TableCell>
                                                            <TableCell className="text-center py-1 text-[10px] text-muted-foreground">
                                                                x {sub.cantidad * item.cantidad}
                                                            </TableCell>
                                                            <TableCell colSpan={6}></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Product/Service Selector Dialog */}
                        <ProductSelectorDialog
                            open={showAddItem}
                            onOpenChange={setShowAddItem}
                            onItemSelected={handleAddItem}
                        />

                        {/* Totals */}
                        <Card className="bg-muted/30">
                            <CardContent className="p-4">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({items.length} items):</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-2">
                                    <span className="text-muted-foreground">Descuento Global</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                            <Input
                                                type="number"
                                                className="h-6 w-12 text-right text-xs p-1"
                                                value={globalDiscountPct}
                                                onChange={e => setGlobalDiscountPct(Number(e.target.value))}
                                                placeholder="0"
                                            />
                                            <span className="text-xs ml-1">%</span>
                                        </div>
                                        <span className="font-mono text-red-500">-{formatCurrency(descuento)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-1">
                                    <span className="text-muted-foreground">IVA</span>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center">
                                            <Input
                                                type="number"
                                                className="h-6 w-12 text-right text-xs p-1"
                                                value={globalIvaPct}
                                                onChange={e => setGlobalIvaPct(Number(e.target.value))}
                                                placeholder="19"
                                            />
                                            <span className="text-xs ml-1">%</span>
                                        </div>
                                        <span className="font-mono">{formatCurrency(iva)}</span>
                                    </div>
                                </div>
                                <Separator className="my-2" />
                                {/* AIU Breakdown Display (Informational) */}
                                {(totalAiuAdmin > 0 || totalAiuImprev > 0 || totalAiuUtil > 0) && (
                                    <div className="text-xs text-muted-foreground mb-2 space-y-1">
                                        <div className="flex justify-between"><span>Admin:</span><span>{formatCurrency(totalAiuAdmin)}</span></div>
                                        <div className="flex justify-between"><span>Imprev:</span><span>{formatCurrency(totalAiuImprev)}</span></div>
                                        <div className="flex justify-between"><span>Util:</span><span>{formatCurrency(totalAiuUtil)}</span></div>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="font-mono text-primary">{formatCurrency(total)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PREVIEW TAB */}
                    <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
                        <Card className="bg-white dark:bg-gray-950 border-2">
                            <CardContent className="p-8">
                                {/* PDF Preview Header */}
                                <div className="flex justify-between items-start mb-8 border-b pb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-primary">D.M.R.E</h1>
                                        <p className="text-sm text-muted-foreground">DISEÑO, MONTAJE Y REPARACIÓN ELÉCTRICA</p>
                                        <p className="text-xs text-muted-foreground mt-2">NIT: 123.456.789-0</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-bold">COTIZACIÓN</h2>
                                        <p className="text-lg font-mono">{trabajo.numero}</p>
                                        <p className="text-sm text-muted-foreground">{format(trabajo.fecha, "dd/MM/yyyy", { locale: es })}</p>
                                    </div>
                                </div>

                                {/* Client Info */}
                                <div className="mb-6 p-4 bg-muted/30 rounded">
                                    <h3 className="font-semibold mb-2">Cliente:</h3>
                                    <p className="font-bold">{trabajo.cliente.nombre}</p>
                                    <p className="text-sm">{trabajo.cliente.documento}</p>
                                    <p className="text-sm">{trabajo.cliente.direccion}</p>
                                    <p className="text-sm">{trabajo.cliente.telefono}</p>
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Descripción del Trabajo:</h3>
                                    <p className="text-sm">{trabajo.descripcionTrabajo}</p>
                                </div>

                                {/* Items Table - Only visible ones */}
                                <Table className="mb-6">
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-center">Cant.</TableHead>
                                            <TableHead className="text-right">V. Unit.</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleItems.map((item) => {
                                            const itemSub = item.valorTotal; // Already includes AIU + IvaU per item
                                            // Logic: Show item ONLY if it is a 'SERVICIO' (Work Code) OR if visibility toggle is ON.
                                            // This ensures Products (Materials) or untyped items are hidden by default when toggle is off.
                                            const isService = item.tipo === 'SERVICIO';
                                            const shouldRender = isService || showMaterialsInline;

                                            if (!shouldRender) return null;

                                            return (
                                                <Fragment key={item.id}>
                                                    <TableRow>
                                                        <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                        <TableCell className="text-center">{item.cantidad}</TableCell>
                                                        <TableCell className="text-right font-mono">{formatCurrency(item.valorUnitario)}</TableCell>
                                                        <TableCell className="text-right font-mono">{formatCurrency(item.valorTotal)}</TableCell>
                                                    </TableRow>
                                                    {showMaterialsInline && item.subItems && item.subItems.map((sub, sIdx) => (
                                                        <TableRow key={`${item.id}-sub-${sIdx}`} className="bg-muted/5 border-0">
                                                            <TableCell className="pl-8 text-xs text-muted-foreground flex items-center gap-2">
                                                                <span>•</span> {sub.nombre}
                                                            </TableCell>
                                                            <TableCell className="text-center text-xs text-muted-foreground">{sub.cantidad * item.cantidad}</TableCell>
                                                            <TableCell className="text-right text-xs font-mono text-muted-foreground">{formatCurrency(sub.valorUnitario)}</TableCell>
                                                            <TableCell></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-1">
                                        {(() => {
                                            // Recalculate totals for Visible Items
                                            const subVisible = visibleItems.reduce((a, i) => a + i.valorTotal, 0);
                                            const descVisible = subVisible * (globalDiscountPct / 100);
                                            const baseVisible = subVisible - descVisible;
                                            const ivaVisible = baseVisible * (globalIvaPct / 100);
                                            const totalVisible = baseVisible + ivaVisible;

                                            return (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Subtotal ({visibleItems.length} items):</span>
                                                        <span className="font-mono">{formatCurrency(subVisible)}</span>
                                                    </div>
                                                    {descVisible > 0 && (
                                                        <div className="flex justify-between text-sm text-red-500">
                                                            <span>Desc. Global ({globalDiscountPct}%):</span>
                                                            <span className="font-mono">-{formatCurrency(descVisible)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-sm">
                                                        <span>IVA ({globalIvaPct}%):</span>
                                                        <span className="font-mono">{formatCurrency(ivaVisible)}</span>
                                                    </div>
                                                    <Separator />
                                                    <div className="flex justify-between font-bold text-lg">
                                                        <span>TOTAL:</span>
                                                        <span className="font-mono">{formatCurrency(totalVisible)}</span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
                                    <p>Cotización válida por 30 días</p>
                                    <p>Forma de pago: 50% anticipo, 50% contra entrega</p>
                                </div>

                                {/* Anexo Materiales Preview */}
                                {showAnexoMateriales && (
                                    <div className="mt-8 pt-6 border-t-2">
                                        <h3 className="text-lg font-bold mb-4">Anexo: Listado de Materiales</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-primary/10">
                                                    <TableHead className="w-[40px]">#</TableHead>
                                                    <TableHead>Material / Insumo</TableHead>
                                                    <TableHead className="w-[80px]">Unidad</TableHead>
                                                    <TableHead className="w-[60px]">Cant</TableHead>
                                                    <TableHead>Obs</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {visibleItems.map((item, index) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>Materiales para {item.descripcion}</TableCell>
                                                        <TableCell>Global</TableCell>
                                                        <TableCell>{item.cantidad}</TableCell>
                                                        <TableCell className="text-muted-foreground">Disponibilidad Inmediata</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="show-anexo"
                                    checked={showAnexoMateriales}
                                    onCheckedChange={(checked) => setShowAnexoMateriales(checked === true)}
                                />
                                <label htmlFor="show-anexo" className="text-sm cursor-pointer">
                                    Incluir Anexo de Materiales en PDF
                                </label>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <Checkbox
                                    id="show-inline-materials"
                                    checked={showMaterialsInline}
                                    onCheckedChange={(checked) => setShowMaterialsInline(checked === true)}
                                />
                                <label htmlFor="show-inline-materials" className="text-sm cursor-pointer">
                                    Mostrar Materiales en Lista Principal
                                </label>
                            </div>

                            <Button onClick={() => {
                                // Create cotizacion with only visible items
                                const cotizacionFiltrada = {
                                    ...trabajo,
                                    items: visibleItems.map(({ visibleEnPdf, ...item }) => item)
                                };
                                generateQuotePDF(cotizacionFiltrada, showAnexoMateriales);
                            }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Descargar PDF
                            </Button>
                        </div>
                    </TabsContent>

                    {/* HISTORIAL TAB */}
                    <TabsContent value="historial" className="flex-1 overflow-auto mt-4">
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {historial.map((entry) => (
                                    <div key={entry.id} className="flex gap-3 p-3 rounded-lg border bg-card">
                                        <div className="mt-0.5">
                                            {getEntryIcon(entry.tipo)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{entry.descripcion}</span>
                                                {entry.valorAnterior && entry.valorNuevo && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {entry.valorAnterior} → {entry.valorNuevo}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {format(entry.fecha, "dd MMM yyyy HH:mm", { locale: es })}
                                                <span>•</span>
                                                <User className="h-3 w-3" />
                                                {entry.usuario}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
}

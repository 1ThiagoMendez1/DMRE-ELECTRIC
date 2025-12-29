"use client";

import { useState, useMemo } from "react";
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
import { initialInventory } from "@/lib/mock-data";

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
    const [searchItem, setSearchItem] = useState("");

    // Anexo materiales toggle
    const [showAnexoMateriales, setShowAnexoMateriales] = useState(true);

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

    // Filtered inventory for adding items
    const filteredInventory = useMemo(() => {
        return initialInventory.filter(i =>
            i.descripcion.toLowerCase().includes(searchItem.toLowerCase()) ||
            i.sku.toLowerCase().includes(searchItem.toLowerCase())
        ).slice(0, 10);
    }, [searchItem]);

    // Calculate totals from visible items
    const visibleItems = items.filter(i => i.visibleEnPdf);
    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.valorTotal, 0), [items]);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

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

    const handleAddItem = (inventarioItem: InventarioItem) => {
        const newItem: ItemConVisibilidad = {
            id: `NEW-${Date.now()}`,
            inventarioId: inventarioItem.id,
            descripcion: inventarioItem.descripcion,
            cantidad: 1,
            valorUnitario: inventarioItem.valorUnitario,
            valorTotal: inventarioItem.valorUnitario,
            visibleEnPdf: true,
        };

        setItems(prev => [...prev, newItem]);

        const entry: HistorialEntry = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'ITEM_AGREGADO',
            descripcion: `Item agregado: ${inventarioItem.descripcion}`,
            usuario: 'Usuario Actual',
        };
        setHistorial(h => [entry, ...h]);
        setShowAddItem(false);
        setSearchItem("");
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

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">PDF</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="w-[100px]">Cantidad</TableHead>
                                            <TableHead className="text-right">V. Unitario</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-[80px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item) => (
                                            <TableRow key={item.id} className={!item.visibleEnPdf ? 'opacity-50 bg-muted/30' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={item.visibleEnPdf}
                                                        onCheckedChange={() => handleToggleItemVisibility(item.id)}
                                                        title={item.visibleEnPdf ? "Visible en PDF" : "Oculto del PDF"}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {!item.visibleEnPdf && <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                                        <span className={!item.visibleEnPdf ? 'line-through' : ''}>{item.descripcion}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.cantidad}
                                                        onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                        className="w-20 h-8"
                                                        min={1}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.valorUnitario)}</TableCell>
                                                <TableCell className="text-right font-mono font-bold">{formatCurrency(item.valorTotal)}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Add Item Modal */}
                        {showAddItem && (
                            <Card className="border-primary">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm">Agregar Item del Inventario</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={() => setShowAddItem(false)}>✕</Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="Buscar producto..."
                                        value={searchItem}
                                        onChange={(e) => setSearchItem(e.target.value)}
                                        className="mb-2"
                                    />
                                    <ScrollArea className="h-[200px]">
                                        {filteredInventory.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleAddItem(item)}
                                                className="p-2 hover:bg-muted rounded cursor-pointer flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{item.descripcion}</p>
                                                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                                                </div>
                                                <span className="font-mono text-sm">{formatCurrency(item.valorUnitario)}</span>
                                            </div>
                                        ))}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        {/* Totals */}
                        <Card className="bg-muted/30">
                            <CardContent className="p-4">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal ({items.length} items):</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA (19%):</span>
                                    <span className="font-mono">{formatCurrency(iva)}</span>
                                </div>
                                <Separator className="my-2" />
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
                                        {visibleItems.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.descripcion}</TableCell>
                                                <TableCell className="text-center">{item.cantidad}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.valorUnitario)}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(item.valorTotal)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Subtotal:</span>
                                            <span className="font-mono">{formatCurrency(visibleItems.reduce((a, i) => a + i.valorTotal, 0))}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>IVA (19%):</span>
                                            <span className="font-mono">{formatCurrency(visibleItems.reduce((a, i) => a + i.valorTotal, 0) * 0.19)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>TOTAL:</span>
                                            <span className="font-mono">{formatCurrency(visibleItems.reduce((a, i) => a + i.valorTotal, 0) * 1.19)}</span>
                                        </div>
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
        </Dialog>
    );
}

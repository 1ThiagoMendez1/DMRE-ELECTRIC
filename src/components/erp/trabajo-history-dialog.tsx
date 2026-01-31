"use client";

import React, { useState, useMemo, Fragment, useRef, useEffect } from "react";
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
    Save,
    Camera,
    MapPin,
    Image,
    Share2,
    Navigation, // For location
    Wrench,
    Video,
    Settings
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Cotizacion, CotizacionItem, EstadoCotizacion, InventarioItem, EvidenciaTrabajo, Ubicacion } from "@/types/sistema";
import { generateQuotePDF } from "@/utils/pdf-generator";
import { useErp } from "@/components/providers/erp-provider";
import { ProductSelectorDialog } from "./product-selector-dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { getHistorialAction, addHistorialEntryAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PDF_STYLES, getStyleById, PDFStyleConfig } from '@/utils/pdf-styles';

// Helper: RGB to Hex
const rgbToHex = (c: [number, number, number]) => "#" + c.map(x => x.toString(16).padStart(2, '0')).join('');
// Helper: Hex to RGB
const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
};

export type MaterialVisibilityMode = 'MOSTRAR_TODO' | 'MODO_PRIVADO' | 'OCULTAR_TODO';


interface HistorialEntry {
    id: string;
    fecha: Date;
    tipo: 'CREACION' | 'ESTADO' | 'PROGRESO' | 'EDICION' | 'NOTA' | 'ITEM_AGREGADO' | 'ITEM_OCULTO' | 'ITEM_ELIMINADO' | 'UBICACION' | 'FOTO' | 'VIDEO';
    descripcion: string;
    usuario: string;
    valorAnterior?: string;
    valorNuevo?: string;
    url?: string; // For evidence compatibility
    metadata?: any;
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
    const { inventario, codigosTrabajo, deductInventoryItem } = useErp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [newNote, setNewNote] = useState("");
    const [newProgress, setNewProgress] = useState<EstadoCotizacion>(trabajo.estado);
    const [progressPercent, setProgressPercent] = useState<number>(trabajo.progreso || 0);

    // Items with visibility control
    const [items, setItems] = useState<ItemConVisibilidad[]>(
        trabajo.items.map(item => ({
            ...item,
            aiuAdminPorcentaje: item.aiuAdminPorcentaje || trabajo.aiuAdminGlobalPorcentaje || 0,
            aiuImprevistoPorcentaje: item.aiuImprevistoPorcentaje || trabajo.aiuImprevistoGlobalPorcentaje || 0,
            aiuUtilidadPorcentaje: item.aiuUtilidadPorcentaje || trabajo.aiuUtilidadGlobalPorcentaje || 0,
            ivaUtilidadPorcentaje: item.ivaUtilidadPorcentaje || trabajo.ivaUtilidadGlobalPorcentaje || 19,
            visibleEnPdf: true
        }))
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



    // Material visibility mode for PDF
    const [materialVisibilityMode, setMaterialVisibilityMode] = useState<MaterialVisibilityMode>('MOSTRAR_TODO');

    // PDF Style State
    const [selectedStyleId, setSelectedStyleId] = useState<string>('corporate_blue');
    const [customColors, setCustomColors] = useState<{ primary: string, secondary: string } | null>(null);

    // Current Style Config (Memoized)
    const currentStyle = useMemo(() => {
        const base = getStyleById(selectedStyleId);
        if (customColors) {
            return {
                ...base,
                colors: {
                    ...base.colors,
                    primary: hexToRgb(customColors.primary),
                    secondary: hexToRgb(customColors.secondary)
                }
            };
        }
        return base;
    }, [selectedStyleId, customColors]);

    // Company info state (editable for PDF generation)
    const [companyInfo, setCompanyInfo] = useState({
        nombre: "D.M.R.E. S.A.S.",
        nit: "900.123.456-7",
        direccion: "Calle 123 #45-67, Bogotá D.C.",
        telefono: "(601) 123 4567",
        email: "info@dmre.com.co",
        descripcion: "Diseño y Montajes de Redes Eléctricas"
    });

    // Helper to calculate item totals with AIU (Fix for Display Discrepancy)
    const calculateItemDetails = (item: ItemConVisibilidad) => {
        const pVenta = item.valorUnitario || 0;
        const admin = pVenta * ((item.aiuAdminPorcentaje || 0) / 100);
        const imprev = pVenta * ((item.aiuImprevistoPorcentaje || 0) / 100);
        const util = pVenta * ((item.aiuUtilidadPorcentaje || 0) / 100);

        // Base for sale = P.Venta + AIU
        const priceSale = pVenta + admin + imprev + util;

        // IVA on utility
        const ivaUtilVal = util * ((item.ivaUtilidadPorcentaje || 0) / 100);

        const unitTotal = priceSale + ivaUtilVal;
        const lineTotal = unitTotal * item.cantidad;

        return { unitTotal, lineTotal };
    };

    // EXECUTION / EVIDENCE STATE
    const { toast } = useToast();
    const [evidenceNote, setEvidenceNote] = useState("");
    const [localEvidence, setLocalEvidence] = useState<EvidenciaTrabajo[]>(trabajo.evidencia || []);
    const [isLocating, setIsLocating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // Track consumed materials by item ID (Set of material inventory IDs that have been deducted)
    const [materialesUsados, setMaterialesUsados] = useState<Set<string>>(new Set());

    const photoInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Job Execution Details State
    const [direccionProyecto, setDireccionProyecto] = useState(trabajo.direccionProyecto || "");
    const [fechaInicio, setFechaInicio] = useState(trabajo.fechaInicio ? new Date(trabajo.fechaInicio).toISOString().split('T')[0] : "");
    const [fechaFinEstimada, setFechaFinEstimada] = useState(trabajo.fechaFinEstimada ? new Date(trabajo.fechaFinEstimada).toISOString().split('T')[0] : "");
    const [fechaFinReal, setFechaFinReal] = useState(trabajo.fechaFinReal ? new Date(trabajo.fechaFinReal).toISOString().split('T')[0] : "");
    const [costoReal, setCostoReal] = useState(trabajo.costoReal || 0);
    const [responsableId, setResponsableId] = useState(trabajo.responsableId || "");
    const [notas, setNotas] = useState(trabajo.notas || "");

    const handleAddEvidence = async (type: 'FOTO' | 'VIDEO' | 'NOTA', content?: string, fileUrl?: string) => {
        const newEvidence: EvidenciaTrabajo = {
            id: `EVID-NEW-${Date.now()}`,
            fecha: new Date(),
            usuarioId: 'CURRENT-USER',
            usuarioNombre: 'Usuario Actual',
            tipo: type,
            descripcion: type === 'NOTA' ? content : (evidenceNote || `Evidencia ${type}: ${new Date().toLocaleTimeString()}`),
            url: fileUrl || (type === 'NOTA' ? undefined : 'https://images.unsplash.com/photo-1581092921461-eab32e97f693?w=800&q=80')
        };

        const updatedEvidence = [newEvidence, ...localEvidence];
        setLocalEvidence(updatedEvidence);
        onTrabajoUpdated({ ...trabajo, evidencia: updatedEvidence });
        setEvidenceNote("");

        // Persist to History Table
        await addHistorialEntryAction({
            cotizacionId: trabajo.id,
            fecha: new Date(),
            usuarioId: "current-user-id", // Should act. get current user
            usuarioNombre: "Usuario Actual",
            tipo: type,
            descripcion: newEvidence.descripcion || `Nueva evidencia: ${type}`,
            metadata: {
                url: newEvidence.url,
                evidenceId: newEvidence.id
            }
        });

        // Refresh history list
        getHistorialAction(trabajo.id).then(data => {
            setHistorial(data.map(d => ({
                id: d.id,
                fecha: d.fecha,
                tipo: d.tipo as any,
                descripcion: d.descripcion,
                usuario: d.usuarioNombre || 'Sistema',
                valorAnterior: d.valorAnterior,
                valorNuevo: d.valorNuevo,
                url: d.metadata?.url,
                metadata: d.metadata
            })));
        });

        if (!fileUrl && type !== 'NOTA') {
            toast({ title: "Modo Simulación", description: "Se agregó una imagen de ejemplo. Usa el botón de subir para archivos reales." });
        } else {
            toast({ title: "Evidencia Guardada", description: "La evidencia se ha registrado correctamente." });
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'FOTO' | 'VIDEO') => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const bucket = type === 'FOTO' ? 'imagenes' : 'videos';
            const fileExt = file.name.split('.').pop();
            const fileName = `${trabajo.id}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            handleAddEvidence(type, undefined, publicUrl);
        } catch (error: any) {
            console.error("Error uploading file:", error);
            toast({
                title: "Error al subir",
                description: error.message || "No se pudo subir el archivo.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            if (event.target) event.target.value = '';
        }
    };

    const handleAddLocation = () => {
        setIsLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const newLocationEvidence: EvidenciaTrabajo = {
                        id: `LOC-${Date.now()}`,
                        fecha: new Date(),
                        usuarioId: 'CURRENT-USER',
                        usuarioNombre: 'Usuario Actual',
                        tipo: 'UBICACION',
                        descripcion: evidenceNote || 'Reporte de ubicación en sitio',
                        ubicacion: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            precision: position.coords.accuracy,
                            timestamp: position.timestamp
                        }
                    };
                    const updatedEvidence = [newLocationEvidence, ...localEvidence];
                    setLocalEvidence(updatedEvidence);
                    onTrabajoUpdated({ ...trabajo, evidencia: updatedEvidence });
                    setEvidenceNote("");
                    setIsLocating(false);

                    // Persist to History Table
                    await addHistorialEntryAction({
                        cotizacionId: trabajo.id,
                        fecha: new Date(),
                        usuarioId: "current-user-id",
                        usuarioNombre: "Usuario Actual",
                        tipo: 'UBICACION',
                        descripcion: evidenceNote || 'Reporte de ubicación en sitio',
                        metadata: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            precision: position.coords.accuracy,
                            timestamp: position.timestamp
                        }
                    });

                    // Refresh history list
                    getHistorialAction(trabajo.id).then(data => {
                        setHistorial(data.map(d => ({
                            id: d.id,
                            fecha: d.fecha,
                            tipo: d.tipo as any,
                            descripcion: d.descripcion,
                            usuario: d.usuarioNombre || 'Sistema',
                            valorAnterior: d.valorAnterior,
                            valorNuevo: d.valorNuevo,
                            url: d.metadata?.url,
                            metadata: d.metadata
                        })));
                    });

                    toast({ title: "Ubicación Registrada", description: `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}` });
                },
                (error) => {
                    console.error("Error getting location", error);
                    setIsLocating(false);
                    toast({ title: "Error de Ubicación", description: "No se pudo obtener la ubicación actual.", variant: "destructive" });
                }
            );
        } else {
            setIsLocating(false);
            toast({ title: "No soportado", description: "Geolocalización no disponible en este navegador.", variant: "destructive" });
        }
    };

    // Real History Loading
    const [historial, setHistorial] = useState<HistorialEntry[]>([]);

    useEffect(() => {
        if (isOpen && trabajo.id) {
            getHistorialAction(trabajo.id).then(data => {
                const formatted: HistorialEntry[] = data.map(d => ({
                    id: d.id,
                    fecha: d.fecha,
                    tipo: d.tipo as any,
                    descripcion: d.descripcion,
                    usuario: d.usuarioNombre || 'Sistema',
                    valorAnterior: d.valorAnterior,
                    valorNuevo: d.valorNuevo,
                    url: d.metadata?.url, // Map metadata if needed
                    metadata: d.metadata
                }));
                setHistorial(formatted);
            });
        }
    }, [isOpen, trabajo.id]);





    // Calculate totals with AIU logic
    const { subtotal, descuento, iva, total, totalAiuAdmin, totalAiuImprev, totalAiuUtil } = useMemo(() => {
        let sub = 0;
        let tAdmin = 0;
        let tImprev = 0;
        let tUtil = 0;

        // Sum up derived values from items
        const itemResults = items.map(item => {
            // P. Venta is the base sale price from inventory
            const pVenta = item.valorUnitario || 0;
            const cost = item.costoUnitario || 0; // P. Prov (for reference/margin calculation)

            // AIU is traditionally a percentage of the COST (P. Prov) added on top
            // However, if the user wants P. Venta to be the "base price for final",
            // we apply AIU as additional charges on top of P. Venta.
            const admin = pVenta * ((item.aiuAdminPorcentaje || 0) / 100);
            const imprev = pVenta * ((item.aiuImprevistoPorcentaje || 0) / 100);
            const util = pVenta * ((item.aiuUtilidadPorcentaje || 0) / 100);

            // Final Price = P. Venta + AIU components
            const priceSale = pVenta + admin + imprev + util;

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
        handleAddEvidence('NOTA', newNote);
        setNewNote("");
    };

    const handleUpdateProgress = () => {
        // Log to history
        const entry: HistorialEntry = {
            id: Date.now().toString(),
            fecha: new Date(),
            tipo: 'PROGRESO',
            descripcion: `Progreso actualizado a ${progressPercent}% y datos de ejecución actualizados`,
            usuario: 'Usuario Actual',
            valorAnterior: `Estado: ${trabajo.estado}`,
            valorNuevo: `Estado: ${progressPercent === 100 ? 'FINALIZADA' : (progressPercent > 0 ? 'EN_EJECUCION' : trabajo.estado)}`,
        };

        setHistorial([entry, ...historial]);

        // We use the status from the dropdown/manual selection OR force it if progress is 100
        const finalEstado = progressPercent === 100 ? 'FINALIZADA' : newProgress;

        const updated: Cotizacion = {
            ...trabajo,
            items: items.map(({ visibleEnPdf, ...item }) => item), // Strip UI-only field
            subtotal,
            iva,
            total,
            aiuAdmin: totalAiuAdmin,
            aiuImprevistos: totalAiuImprev,
            aiuUtilidad: totalAiuUtil,
            descuentoGlobal: descuento,
            descuentoGlobalPorcentaje: globalDiscountPct,
            impuestoGlobalPorcentaje: globalIvaPct,
            aiuAdminGlobalPorcentaje: aiuAdminPct,
            aiuImprevistoGlobalPorcentaje: aiuImprevPct,
            aiuUtilidadGlobalPorcentaje: aiuUtilPct,
            ivaUtilidadGlobalPorcentaje: ivaUtilPct,
            estado: finalEstado,
            progreso: progressPercent,
            notas: notas,
            fechaActualizacion: new Date(),
            direccionProyecto,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
            fechaFinEstimada: fechaFinEstimada ? new Date(fechaFinEstimada) : undefined,
            fechaFinReal: fechaFinReal ? new Date(fechaFinReal) : undefined,
            costoReal,
            responsableId,
            evidencia: localEvidence
        };
        onTrabajoUpdated(updated);
        toast({ title: "Cambios guardados", description: "La información del trabajo ha sido actualizada." });
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
            aiuAdminPorcentaje: aiuAdminPct,
            aiuImprevistoPorcentaje: aiuImprevPct,
            aiuUtilidadPorcentaje: aiuUtilPct,
            ivaUtilidadPorcentaje: ivaUtilPct,
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
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="detalles">Detalles</TabsTrigger>
                        <TabsTrigger value="items">Items & Edición</TabsTrigger>
                        <TabsTrigger value="ejecucion">Ejecución</TabsTrigger>
                        <TabsTrigger value="preview">Vista PDF</TabsTrigger>
                        <TabsTrigger value="historial">Historial</TabsTrigger>
                    </TabsList>

                    {/* DETALLES TAB */}
                    <TabsContent value="detalles" className="flex-1 overflow-auto space-y-4 mt-4">
                        {/* ... Existing Details Content ... */}
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
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">Descripción:</span>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                value={trabajo.descripcionTrabajo}
                                                onChange={(e) => onTrabajoUpdated({ ...trabajo, descripcionTrabajo: e.target.value })}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center mt-2">
                                        <Select
                                            value={trabajo.tipo}
                                            onValueChange={(val) => onTrabajoUpdated({ ...trabajo, tipo: val as any })}
                                        >
                                            <SelectTrigger className="h-7 w-[110px] text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NORMAL">Normal</SelectItem>
                                                <SelectItem value="SIMPLIFICADA">Simplificada</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex-1">
                                            <Select
                                                value={newProgress}
                                                onValueChange={(val) => {
                                                    const status = val as EstadoCotizacion;
                                                    setNewProgress(status);
                                                    // Optional: auto-adjust progress if needed, but better to keep them independent as requested
                                                }}
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

                    {/* EJECUCIÓN / EVIDENCIA TAB */}
                    <TabsContent value="ejecucion" className="flex-1 overflow-auto space-y-4 mt-4">
                        {/* Project Management Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader className="py-2 px-4 border-b">
                                    <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Ubicación y Datos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Dirección del Proyecto</Label>
                                        <Input
                                            value={direccionProyecto}
                                            onChange={(e) => setDireccionProyecto(e.target.value)}
                                            placeholder="Calle 123 #45-67..."
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Responsable (ID)</Label>
                                        <Input
                                            value={responsableId}
                                            onChange={(e) => setResponsableId(e.target.value)}
                                            placeholder="ID del Empleado"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Costo Real Ejecución</Label>
                                        <Input
                                            type="number"
                                            value={costoReal}
                                            onChange={(e) => setCostoReal(Number(e.target.value))}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Notas Generales Trabajo</Label>
                                        <Textarea
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            placeholder="Notas generales sobre el trabajo..."
                                            className="min-h-[60px] text-xs"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="py-2 px-4 border-b">
                                    <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                        <Clock className="h-3 w-3" /> Cronograma Ejecución
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Fecha Inicio</Label>
                                        <Input
                                            type="date"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Fin Estimado</Label>
                                        <Input
                                            type="date"
                                            value={fechaFinEstimada}
                                            onChange={(e) => setFechaFinEstimada(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Fin Real</Label>
                                        <Input
                                            type="date"
                                            value={fechaFinReal}
                                            onChange={(e) => setFechaFinReal(e.target.value)}
                                            className="h-8 text-sm cursor-pointer border-green-200 focus:border-green-500 bg-green-50/30"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col">
                                <CardHeader className="py-2 px-4 border-b">
                                    <CardTitle className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" /> Guardar Cambios
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 flex-1 flex flex-col justify-center items-center gap-4">
                                    <p className="text-xs text-center text-muted-foreground">Recuerda guardar los cambios despues de actualizar los datos de ejecución.</p>
                                    <Button className="w-full" onClick={handleUpdateProgress}>
                                        <Save className="mr-2 h-4 w-4" /> Guardar Todo
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Materials Consumption Section */}
                        <Collapsible defaultOpen className="mt-4">
                            <Card>
                                <CollapsibleTrigger className="w-full">
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Package className="h-4 w-4 text-orange-500" /> Materiales del Trabajo
                                            <Badge variant="outline" className="ml-auto">{items.filter(i => i.tipo === 'PRODUCTO').length} items</Badge>
                                        </CardTitle>
                                        <CardDescription>Marca como utilizado para descontar del inventario.</CardDescription>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="p-4 space-y-2">
                                        {items.filter(i => i.tipo === 'PRODUCTO').length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">No hay productos en esta cotización.</p>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-12">Usado</TableHead>
                                                        <TableHead>Material</TableHead>
                                                        <TableHead className="text-right">Cant.</TableHead>
                                                        <TableHead className="text-right">Existencias</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.filter(i => i.tipo === 'PRODUCTO').map((item) => {
                                                        const itemKey = `${trabajo.id}-${item.inventarioId || item.id}`;
                                                        const inventoryItem = inventario.find(inv => inv.id === item.inventarioId);
                                                        const isUsed = materialesUsados.has(itemKey);

                                                        return (
                                                            <TableRow key={item.id} className={isUsed ? "bg-green-50 dark:bg-green-950/20" : ""}>
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={isUsed}
                                                                        disabled={!item.inventarioId || isUsed}
                                                                        onCheckedChange={async (checked) => {
                                                                            if (checked && item.inventarioId) {
                                                                                const success = await deductInventoryItem(item.inventarioId, item.cantidad);
                                                                                if (success) {
                                                                                    setMaterialesUsados(prev => new Set(prev).add(itemKey));
                                                                                    toast({
                                                                                        title: "Inventario Actualizado",
                                                                                        description: `Se descontaron ${item.cantidad} unidades de ${item.descripcion}.`
                                                                                    });
                                                                                } else {
                                                                                    toast({
                                                                                        title: "Error",
                                                                                        description: "No se pudo actualizar el inventario.",
                                                                                        variant: "destructive"
                                                                                    });
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                                <TableCell className="text-right">{item.cantidad}</TableCell>
                                                                <TableCell className="text-right text-muted-foreground">
                                                                    {inventoryItem ? inventoryItem.cantidad : 'N/A'}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </CollapsibleContent>
                            </Card>
                        </Collapsible>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Evidence Upload Form */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Camera className="h-4 w-4" /> Nueva Evidencia
                                    </CardTitle>
                                    <CardDescription>Sube fotos, videos o registra tu ubicación.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder="Describe la evidencia o actividad..."
                                        value={evidenceNote}
                                        onChange={(e) => setEvidenceNote(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            ref={photoInputRef}
                                            onChange={(e) => handleFileUpload(e, 'FOTO')}
                                        />
                                        <input
                                            type="file"
                                            accept="video/*"
                                            capture="environment"
                                            className="hidden"
                                            ref={videoInputRef}
                                            onChange={(e) => handleFileUpload(e, 'VIDEO')}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => photoInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            <Camera className="mr-2 h-4 w-4" />
                                            {isUploading ? "..." : "Foto"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => videoInputRef.current?.click()}
                                            disabled={isUploading}
                                        >
                                            <Share2 className="mr-2 h-4 w-4" /> Video
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleAddEvidence('NOTA', evidenceNote)}
                                            disabled={!evidenceNote}
                                        >
                                            <FileText className="mr-2 h-4 w-4" /> Nota
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        variant={isLocating ? "secondary" : "default"}
                                        onClick={handleAddLocation}
                                        disabled={isLocating}
                                    >
                                        {isLocating ? (
                                            <>
                                                <Navigation className="mr-2 h-4 w-4 animate-spin" /> ...
                                            </>
                                        ) : (
                                            <>
                                                <MapPin className="mr-2 h-4 w-4" /> Registrar Ubicación GPS
                                            </>
                                        )}
                                    </Button>

                                </CardContent>
                            </Card>

                            {/* Recent Location / Map Placeholder */}
                            <Card className="h-fit">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" /> Última Ubicación
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {localEvidence.filter(e => e.tipo === 'UBICACION').length > 0 ? (
                                        (() => {
                                            const lastLoc = localEvidence.filter(e => e.tipo === 'UBICACION').sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                                            return (
                                                <div className="space-y-2">
                                                    <div className="h-[150px] bg-muted rounded-md flex items-center justify-center relative overflow-hidden group">
                                                        {/* Simulated Map View */}
                                                        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                            <MapPin className="h-8 w-8 text-primary drop-shadow-md" />
                                                            <span className="sr-only">Mapa simulado</span>
                                                        </div>
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${lastLoc.ubicacion?.lat},${lastLoc.ubicacion?.lng}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 text-xs px-2 py-1 rounded shadow-sm hover:bg-primary hover:text-white transition-colors"
                                                        >
                                                            Ver en Google Maps
                                                        </a>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{format(lastLoc.fecha, "dd MMM HH:mm", { locale: es })}</span>
                                                        <span>Lat: {lastLoc.ubicacion?.lat.toFixed(4)}, Lng: {lastLoc.ubicacion?.lng.toFixed(4)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="h-[150px] border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground">
                                            <Navigation className="h-8 w-8 mb-2 opacity-50" />
                                            <span className="text-xs">Sin ubicación registrada</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Evidence History Timeline */}
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Historial de Ejecución ({localEvidence.length})
                            </h3>
                            <div className="space-y-4 pl-2">
                                {localEvidence.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((ev) => (
                                    <div key={ev.id} className="flex gap-4 border-l-2 border-muted pl-4 relative pb-4 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 bg-background border rounded-full p-1">
                                            {ev.tipo === 'FOTO' && <Camera className="h-3 w-3 text-blue-500" />}
                                            {ev.tipo === 'VIDEO' && <Video className="h-3 w-3 text-purple-500" />}
                                            {ev.tipo === 'NOTA' && <FileText className="h-3 w-3 text-amber-500" />}
                                            {ev.tipo === 'UBICACION' && <MapPin className="h-3 w-3 text-red-500" />}
                                        </div>
                                        <div className="flex-1 bg-muted/30 p-3 rounded-md">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <span className="font-medium text-sm">{ev.usuarioNombre}</span>
                                                    <Badge variant="outline" className="ml-2 text-[10px]">{ev.tipo}</Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{format(ev.fecha, "dd MMM yyyy HH:mm", { locale: es })}</span>
                                            </div>

                                            {ev.descripcion && (
                                                <p className="text-sm mb-2">{ev.descripcion}</p>
                                            )}

                                            {ev.url && ev.tipo === 'FOTO' && (
                                                <div className="relative h-40 w-full max-w-sm rounded-md overflow-hidden bg-black/5 mt-2">
                                                    {/* Simulated Image */}
                                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                                                        <Image className="h-8 w-8 opacity-20" />
                                                    </div>
                                                    <img src={ev.url} alt="Evidencia" className="object-cover w-full h-full relative z-10" />
                                                </div>
                                            )}
                                            {ev.url && ev.tipo === 'VIDEO' && (
                                                <div className="relative mt-2 rounded-md overflow-hidden bg-black max-w-sm aspect-video">
                                                    <video
                                                        src={ev.url}
                                                        controls
                                                        playsInline
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            )}

                                            {ev.tipo === 'UBICACION' && ev.ubicacion && (
                                                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1 bg-background/50 p-1 rounded w-fit">
                                                    <MapPin className="h-3 w-3" />
                                                    {ev.ubicacion.lat.toFixed(6)}, {ev.ubicacion.lng.toFixed(6)}
                                                    <span className="text-[10px] opacity-70">(±{ev.ubicacion.precision?.toFixed(0)}m)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ITEMS TAB */}
                    <TabsContent value="items" className="flex-1 overflow-auto space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Items de la Cotización</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="secondary" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20" onClick={handleUpdateProgress}>
                                    <Save className="mr-2 h-4 w-4" /> Guardar Actualización
                                </Button>
                                <Button size="sm" onClick={() => setShowAddItem(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Item
                                </Button>
                            </div>
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
                                            const cost = item.costoUnitario || 0; // P. Prov (for reference)
                                            const pVenta = item.valorUnitario || 0; // P. Venta - Base price

                                            // AIU is calculated on top of P. Venta
                                            const admin = pVenta * ((item.aiuAdminPorcentaje || 0) / 100);
                                            const imprev = pVenta * ((item.aiuImprevistoPorcentaje || 0) / 100);
                                            const util = pVenta * ((item.aiuUtilidadPorcentaje || 0) / 100);

                                            // Final Price = P. Venta + AIU components
                                            const priceSale = pVenta + admin + imprev + util;

                                            const ivaUtilVal = util * ((item.ivaUtilidadPorcentaje || 0) / 100);
                                            const finalUnitTotal = priceSale + ivaUtilVal;
                                            const rowTotal = finalUnitTotal * item.cantidad;

                                            return (
                                                <React.Fragment key={item.id}>
                                                    <TableRow className={!item.visibleEnPdf ? 'opacity-50 bg-muted/30' : ''}>
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
                                                                value={item.costoUnitario || 0}
                                                                onChange={(e) => {
                                                                    const newVal = parseFloat(e.target.value) || 0;
                                                                    setItems(prev => prev.map((it, i) => i === index ? { ...it, costoUnitario: newVal } : it));
                                                                }}
                                                                className="h-7 w-24 text-xs text-right p-1"
                                                            />
                                                        </TableCell>
                                                        {/* P. Venta (Base) */}
                                                        <TableCell className="text-right p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.valorUnitario || 0}
                                                                onChange={(e) => {
                                                                    const newVal = parseFloat(e.target.value) || 0;
                                                                    setItems(prev => prev.map((it, i) => i === index ? { ...it, valorUnitario: newVal } : it));
                                                                }}
                                                                className="h-7 w-24 text-xs text-right p-1 font-semibold text-primary"
                                                            />
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
                                                </React.Fragment>
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
                            inventario={inventario}
                            codigosTrabajo={codigosTrabajo}
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

                    {/* PREVIEW & DESIGN TAB */}
                    <TabsContent value="preview" className="flex-1 overflow-hidden mt-4 h-full">
                        <div className="flex flex-col md:flex-row gap-6 h-full">

                            {/* LEFT SIDEBAR: CONTROLS */}
                            <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">

                                {/* 1. Style Selector */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Package className="w-4 h-4" /> Estilo PDF
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-2">
                                        {PDF_STYLES.map(style => (
                                            <div
                                                key={style.id}
                                                onClick={() => {
                                                    setSelectedStyleId(style.id);
                                                    setCustomColors(null); // Reset custom colors on style switch
                                                }}
                                                className={`cursor-pointer rounded-lg border-2 p-2 text-center transition-all hover:bg-muted ${selectedStyleId === style.id ? 'border-primary bg-primary/10' : 'border-transparent bg-muted/50'}`}
                                            >
                                                <div className="w-full h-8 rounded mb-2" style={{ background: `linear-gradient(135deg, rgb(${style.colors.primary.join(',')}) 0%, rgb(${style.colors.secondary.join(',')}) 100%)` }} />
                                                <p className="text-xs font-medium truncate">{style.name}</p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* 2. Brand Colors */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Settings className="w-4 h-4" /> Personalización
                                        </CardTitle>
                                        <CardDescription className="text-xs">Ajusta los colores de tu marca</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Color Primario</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                                                <Input
                                                    type="color"
                                                    value={rgbToHex(currentStyle.colors.primary)}
                                                    onChange={(e) => setCustomColors({
                                                        primary: e.target.value,
                                                        secondary: customColors ? customColors.secondary : rgbToHex(currentStyle.colors.secondary)
                                                    })}
                                                    className="w-12 h-8 p-1 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Color Secundario</Label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: rgbToHex(currentStyle.colors.secondary) }} />
                                                <Input
                                                    type="color"
                                                    value={rgbToHex(currentStyle.colors.secondary)}
                                                    onChange={(e) => setCustomColors({
                                                        primary: customColors ? customColors.primary : rgbToHex(currentStyle.colors.primary),
                                                        secondary: e.target.value
                                                    })}
                                                    className="w-12 h-8 p-1 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* 3. Data & Actions */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-bold">Opciones</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Visibilidad</Label>
                                            <Select
                                                value={materialVisibilityMode}
                                                onValueChange={(value) => setMaterialVisibilityMode(value as MaterialVisibilityMode)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MOSTRAR_TODO">📋 Mostrar Todo</SelectItem>
                                                    <SelectItem value="MODO_PRIVADO">🔒 Modo Privado</SelectItem>
                                                    <SelectItem value="OCULTAR_TODO">🚫 Ocultar Todo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Pencil className="mr-2 h-3 w-3" /> Editar Info Empresa
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[340px]">
                                                <div className="space-y-3">
                                                    <div><Label className="text-xs">Nombre</Label><Input value={companyInfo.nombre} onChange={(e) => setCompanyInfo({ ...companyInfo, nombre: e.target.value })} className="h-8 text-sm" /></div>
                                                    <div><Label className="text-xs">NIT</Label><Input value={companyInfo.nit} onChange={(e) => setCompanyInfo({ ...companyInfo, nit: e.target.value })} className="h-8 text-sm" /></div>
                                                    <div><Label className="text-xs">Dirección</Label><Input value={companyInfo.direccion} onChange={(e) => setCompanyInfo({ ...companyInfo, direccion: e.target.value })} className="h-8 text-sm" /></div>
                                                    <div><Label className="text-xs">Teléfono</Label><Input value={companyInfo.telefono} onChange={(e) => setCompanyInfo({ ...companyInfo, telefono: e.target.value })} className="h-8 text-sm" /></div>
                                                    <div><Label className="text-xs">Email</Label><Input value={companyInfo.email} onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })} className="h-8 text-sm" /></div>
                                                    <div><Label className="text-xs">Slogan</Label><Input value={companyInfo.descripcion} onChange={(e) => setCompanyInfo({ ...companyInfo, descripcion: e.target.value })} className="h-8 text-sm" /></div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        <Button className="w-full" onClick={() => {
                                            try {
                                                const itemsCalculados = visibleItems.map((item) => {
                                                    const { unitTotal, lineTotal } = calculateItemDetails(item);
                                                    const { visibleEnPdf, ...rest } = item;
                                                    return { ...rest, valorUnitario: unitTotal, valorTotal: lineTotal };
                                                });

                                                const subTotalPDF = itemsCalculados.reduce((a, b) => a + b.valorTotal, 0);
                                                const descuentoPDF = subTotalPDF * (globalDiscountPct / 100);
                                                const basePDF = subTotalPDF - descuentoPDF;
                                                const ivaPDF = basePDF * (globalIvaPct / 100);
                                                const totalPDF = basePDF + ivaPDF;

                                                const cotizacionFiltrada = {
                                                    ...trabajo,
                                                    items: itemsCalculados,
                                                    subtotal: subTotalPDF,
                                                    iva: ivaPDF,
                                                    total: totalPDF
                                                };
                                                generateQuotePDF(cotizacionFiltrada, materialVisibilityMode, companyInfo, currentStyle);
                                                toast({ title: "PDF Generado", description: `Estilo: ${currentStyle.name}` });
                                            } catch (error) {
                                                console.error(error);
                                                toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
                                            }
                                        }}>
                                            <FileText className="mr-2 h-4 w-4" /> Descargar PDF
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* RIGHT: LIVE PREVIEW */}
                            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded-xl border shadow-inner flex justify-center">
                                {/* A4 Ratio Container (approx) */}
                                <Card
                                    className="w-full max-w-[800px] bg-white shadow-xl min-h-[1000px] origin-top transition-all duration-300"
                                    style={{ fontFamily: currentStyle.fonts.body === 'times' ? 'Times New Roman, serif' : currentStyle.fonts.body === 'courier' ? 'Courier New, monospace' : 'Arial, sans-serif' }}
                                >
                                    <div className="relative p-0 overflow-hidden h-full flex flex-col">

                                        {/* HEADER BAR if applicable */}
                                        {currentStyle.components.headerStyle === 'bar' && (
                                            <div className="h-2 w-full" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                                        )}
                                        {currentStyle.layout === 'bold' && (
                                            <div className="h-32 w-full absolute top-0 left-0" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                                        )}
                                        {currentStyle.layout === 'sidebar' && (
                                            <div className="absolute top-0 left-0 bottom-0 w-20 h-full" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                                        )}

                                        <div className={`p-8 relative z-10 ${currentStyle.layout === 'sidebar' ? 'pl-28' : ''}`}>
                                            {/* HEADER CONTENT */}
                                            <div className={`flex justify-between items-start mb-8 ${currentStyle.layout === 'centered' ? 'flex-col items-center text-center' : ''} ${currentStyle.layout === 'bold' ? 'text-white' : ''}`}>
                                                <div className={`flex items-start gap-4 ${currentStyle.layout === 'centered' ? 'flex-col items-center' : ''}`}>
                                                    <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain bg-white rounded-md p-1" />
                                                    <div>
                                                        <h3 className="text-2xl font-bold" style={{ color: currentStyle.layout === 'bold' ? '#fff' : rgbToHex(currentStyle.colors.primary) }}>{companyInfo.nombre}</h3>
                                                        <p className={`text-sm font-medium ${currentStyle.layout === 'bold' ? 'text-gray-100' : 'text-gray-600'}`}>{companyInfo.descripcion}</p>

                                                        {/* If not sidebar, show contact here */}
                                                        {currentStyle.layout !== 'sidebar' && (
                                                            <div className={`text-xs mt-2 space-y-0.5 ${currentStyle.layout === 'bold' ? 'text-gray-200' : 'text-gray-500'}`}>
                                                                <p>NIT: {companyInfo.nit}</p>
                                                                <p>{companyInfo.direccion}</p>
                                                                <p>{companyInfo.telefono} | {companyInfo.email}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* In Sidebar layout, company info is in the sidebar (simulated in CSS above) */}

                                                {/* QUOTE BOX */}
                                                <div className={`mt-4 ${currentStyle.layout === 'centered' ? 'mt-8 text-center' : 'text-right'}`}>
                                                    <div className={`p-4 rounded-lg ${currentStyle.components.clientBoxStyle === 'box' && currentStyle.layout !== 'bold' ? 'bg-gray-50' : ''}`}>
                                                        <h2 className="text-xl font-bold" style={{ color: currentStyle.layout === 'bold' ? '#fff' : rgbToHex(currentStyle.colors.secondary) }}>COTIZACIÓN</h2>
                                                        <p className="text-lg font-mono text-red-600">{trabajo.numero}</p>
                                                        <p className={`text-sm ${currentStyle.layout === 'bold' ? 'text-gray-200' : 'text-gray-500'}`}>{format(trabajo.fecha, "dd MMMM yyyy", { locale: es })}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CLIENT */}
                                            <div className={`mb-8 p-4 rounded ${currentStyle.components.clientBoxStyle === 'filled' ? 'text-white' : 'bg-gray-50'} ${currentStyle.components.clientBoxStyle === 'line' ? 'border-t-2 border-gray-200 bg-transparent px-0' : ''}`}
                                                style={{ backgroundColor: currentStyle.components.clientBoxStyle === 'filled' ? rgbToHex(currentStyle.colors.accent) : (currentStyle.components.clientBoxStyle === 'box' ? '#f9fafb' : 'transparent') }}
                                            >
                                                <h3 className="font-bold mb-2 uppercase text-sm" style={{ color: currentStyle.components.clientBoxStyle === 'filled' ? rgbToHex(currentStyle.colors.primary) : rgbToHex(currentStyle.colors.secondary) }}>Cliente:</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                                    <p className="font-bold col-span-2 text-base">{trabajo.cliente.nombre}</p>
                                                    <p><span className="opacity-70">NIT/CC:</span> {trabajo.cliente.documento}</p>
                                                    <p><span className="opacity-70">Contacto:</span> {trabajo.cliente.contactoPrincipal}</p>
                                                    <p className="col-span-2"><span className="opacity-70">Dirección:</span> {trabajo.cliente.direccion}</p>
                                                </div>
                                            </div>

                                            {/* BODY */}
                                            <div className="mb-8">
                                                <h3 className="font-bold mb-2 uppercase text-sm" style={{ color: rgbToHex(currentStyle.colors.secondary) }}>Objeto:</h3>
                                                <p className="text-sm bg-white p-2 rounded border border-transparent">{trabajo.descripcionTrabajo}</p>
                                            </div>

                                            {/* TABLE */}
                                            <div className="mb-8">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr style={{ backgroundColor: currentStyle.components.tableTheme === 'plain' ? 'transparent' : rgbToHex(currentStyle.colors.secondary), color: currentStyle.components.tableTheme === 'plain' ? '#000' : '#fff' }}>
                                                            <th className="p-2 text-left">Item</th>
                                                            <th className="p-2 text-left">Descripción</th>
                                                            <th className="p-2 text-center">Cant</th>
                                                            <th className="p-2 text-center">Und</th>
                                                            <th className="p-2 text-right">V. Unit</th>
                                                            <th className="p-2 text-right">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleItems.map((item, idx) => {
                                                            const details = calculateItemDetails(item);
                                                            const isProduct = item.tipo === 'PRODUCTO';
                                                            const hide = isProduct && materialVisibilityMode === 'OCULTAR_TODO';
                                                            const showValues = !isProduct || materialVisibilityMode === 'MOSTRAR_TODO';
                                                            if (hide) return null;

                                                            return (
                                                                <tr key={item.id} className={`border-b ${currentStyle.components.tableTheme === 'striped' && idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                                                                    <td className="p-2 font-mono text-xs">{idx + 1}</td>
                                                                    <td className="p-2">{item.descripcion}</td>
                                                                    <td className="p-2 text-center">{showValues ? item.cantidad : '-'}</td>
                                                                    <td className="p-2 text-center">UND</td>
                                                                    <td className="p-2 text-right font-mono">{showValues ? formatCurrency(details.unitTotal) : '-'}</td>
                                                                    <td className="p-2 text-right font-bold font-mono">{showValues ? formatCurrency(details.lineTotal) : '-'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* TOTALS */}
                                            <div className="flex justify-end mb-12">
                                                <div className="w-64 space-y-2">
                                                    {(() => {
                                                        const subVisible = visibleItems.reduce((a, i) => a + calculateItemDetails(i).lineTotal, 0);
                                                        const ivaVisible = (subVisible * (100 - globalDiscountPct) / 100) * (globalIvaPct / 100);
                                                        const totalVisible = subVisible + ivaVisible; // Simplification for preview
                                                        return (
                                                            <>
                                                                <div className="flex justify-between text-sm"><span>Subtotal:</span> <span className="font-mono">{formatCurrency(subVisible)}</span></div>
                                                                <div className="flex justify-between text-sm"><span>IVA:</span> <span className="font-mono">{formatCurrency(ivaVisible)}</span></div>
                                                                <div className="border-t pt-2 flex justify-between text-lg font-bold" style={{ color: rgbToHex(currentStyle.colors.secondary) }}>
                                                                    <span>TOTAL:</span>
                                                                    <span className="font-mono">{formatCurrency(totalVisible)}</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* FOOTER */}
                                            {currentStyle.components.footerStyle === 'branded' && (
                                                <div className="absolute bottom-0 left-0 w-full h-2" style={{ backgroundColor: rgbToHex(currentStyle.colors.primary) }} />
                                            )}
                                            <div className="absolute create-bottom p-8 text-xs text-center w-full text-gray-400">
                                                <p>Cotización válida por 15 días calendario.</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
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

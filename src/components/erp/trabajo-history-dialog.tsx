"use client";

import React, { useState, useMemo, Fragment, useRef, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Plus, Search, FileText, CheckCircle, Package, Receipt, Copy, Download, Share2, Printer, Edit2, History, MapPin, Check, Truck, Settings, Hammer,
    User, Mail, Phone, Calendar, Clock, Lock, ArrowRight, Eye, MoreHorizontal, MessageSquare, Briefcase, PlayCircle, StopCircle, RefreshCw, Star, ArrowUpRight, Wrench, Building2, UserCircle, PhoneCall, Trash2, Banknote, Save, FileSignature, Image, MonitorPlay, Zap, X, Map, LayoutTemplate, Palette, EyeOff, FilePlus, ChevronRight, Navigation, Camera, Video, AlertTriangle,
    FolderOpen, CheckCircle2, TrendingUp, Pencil, AlertCircle, Loader2, Upload, Shield
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
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
import { Cotizacion, CotizacionItem, EstadoCotizacion, InventarioItem, EvidenciaTrabajo, Ubicacion, MaterialAsociado, CodigoTrabajo } from "@/types/sistema";
import { generateQuotePDF, generateActaPDF, ActaData } from "@/utils/pdf-generator";
import { useErp } from "@/components/providers/erp-provider";
import { ProductSelectorDialog } from "./product-selector-dialog";
import { QuotePreview } from "./quote-preview";
import { GestionComprasPanel } from "./compras/gestion-compras-panel";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { getHistorialAction, addHistorialEntryAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { getConsumosByCotizacionAction } from "@/app/dashboard/sistema/inventario/materiales-consumo-actions";
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
    showExecution?: boolean;
}

// --- FINANCIAL SUB-COMPONENT ---
function FinancialTabContent({ trabajoId, totalTrabajo }: { trabajoId: string, totalTrabajo: number }) {
    const { facturas } = useErp();

    const jobInvoices = useMemo(() => {
        return facturas.filter(f => f.cotizacionId === trabajoId || f.trabajoId === trabajoId);
    }, [facturas, trabajoId]);

    const stats = useMemo(() => {
        const billed = jobInvoices.reduce((sum, f) => sum + (f.estado !== 'PAGADA' && f.estado !== 'PENDIENTE' && f.estado !== 'PARCIAL' ? 0 : f.valorFacturado), 0);
        // Note: Counting ALL valid invoices.

        const paid = jobInvoices.reduce((sum, f) => sum + (f.valorPagado || (f.valorFacturado - f.saldoPendiente)), 0);

        return {
            billed,
            paid,
            pendingBill: Math.max(0, totalTrabajo - billed),
            pendingPay: billed - paid
        };
    }, [jobInvoices, totalTrabajo]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Total Trabajo</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold">{formatCurrency(totalTrabajo)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Facturado</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.billed)}</div>
                        <Progress value={(stats.billed / totalTrabajo) * 100} className="h-2 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Recaudado (Pagado)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.billed > 0 ? Math.round((stats.paid / stats.billed) * 100) : 0}% de lo facturado
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Por Facturar</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pendingBill)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Facturación</CardTitle>
                    <CardDescription>Facturas emitidas asociadas a este trabajo</CardDescription>
                </CardHeader>
                <CardContent>
                    {jobInvoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No hay facturas registradas para este trabajo.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Factura</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Pagado</TableHead>
                                    <TableHead>Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobInvoices.map(f => (
                                    <TableRow key={f.id}>
                                        <TableCell className="font-mono font-medium">{f.numero || f.id}</TableCell>
                                        <TableCell>{format(new Date(f.fechaEmision), "dd/MM/yyyy")}</TableCell>
                                        <TableCell>
                                            <Badge variant={f.estado === 'PAGADA' ? 'default' : f.estado === 'PARCIAL' ? 'secondary' : 'outline'}
                                                className={f.estado === 'PAGADA' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                                                {f.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(f.valorFacturado)}</TableCell>
                                        <TableCell className="text-green-600 font-medium">{formatCurrency(f.valorPagado || (f.valorFacturado - f.saldoPendiente))}</TableCell>
                                        <TableCell className="text-red-500">{formatCurrency(f.saldoPendiente)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

const getStatusColor = (estado: EstadoCotizacion): string => {
    switch (estado) {
        case 'BORRADOR': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        case 'EN_REVISION': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'ENVIADA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'APROBADA': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'RECHAZADA': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        case 'MODIFICACION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
        default: return '';
    }
};

export function TrabajoHistoryDialog({
    trabajo,
    onTrabajoUpdated,
    trigger,
    defaultTab = 'detalles',
    showExecution = true
}: TrabajoHistoryDialogProps) {
    const { inventario, codigosTrabajo, instalaciones, addConsumoMaterial, currentUser } = useErp();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'detalles' | 'items' | 'ejecucion' | 'preview' | 'documentos' | 'compras' | 'historial'>(defaultTab);
    const [newNote, setNewNote] = useState("");
    const [newProgress, setNewProgress] = useState<EstadoCotizacion>(trabajo.estado);
    const [progressPercent, setProgressPercent] = useState<number>(trabajo.progreso || 0);

    const [editAlcance, setEditAlcance] = useState(trabajo.alcance || "");
    const [editFormaPago, setEditFormaPago] = useState(trabajo.formaPago || "");
    const [editNotaFinal, setEditNotaFinal] = useState(trabajo.notaFinal || "");

    // Items with visibility control
    const [items, setItems] = useState<ItemConVisibilidad[]>(
        trabajo.items.map(item => ({
            ...item,
            aiuAdminPorcentaje: item.aiuAdminPorcentaje || trabajo.aiuAdminGlobalPorcentaje || 0,
            aiuImprevistoPorcentaje: item.aiuImprevistoPorcentaje || trabajo.aiuImprevistoGlobalPorcentaje || 0,
            aiuUtilidadPorcentaje: item.aiuUtilidadPorcentaje || trabajo.aiuUtilidadGlobalPorcentaje || 0,
            ivaUtilidadPorcentaje: item.ivaUtilidadPorcentaje || trabajo.ivaUtilidadGlobalPorcentaje || 19,
            visibleEnPdf: true,
            ocultarDetalles: item.ocultarDetalles || false
        }))
    );

    // Add item dialog
    const [showAddItem, setShowAddItem] = useState(false);

    // Global Settings (Initialize from Trabajo or Defaults)
    const [globalDiscountPct, setGlobalDiscountPct] = useState(trabajo.descuentoGlobalPorcentaje || 0);
    const [globalIvaPct, setGlobalIvaPct] = useState(trabajo.impuestoGlobalPorcentaje || 19);

    const [aiuAdminPct, setAiuAdminPct] = useState(trabajo.aiuAdminGlobalPorcentaje || 0);
    const [aiuImprevPct, setAiuImprevPct] = useState(trabajo.aiuImprevistoGlobalPorcentaje || 0);
    const [aiuUtilPct, setAiuUtilPct] = useState(trabajo.aiuUtilidadGlobalPorcentaje || 0);
    const [ivaUtilPct, setIvaUtilPct] = useState(trabajo.ivaUtilidadGlobalPorcentaje || 19);

    const [esAiu, setEsAiu] = useState(
        (trabajo.aiuAdminGlobalPorcentaje || 0) > 0 ||
        (trabajo.aiuImprevistoGlobalPorcentaje || 0) > 0 ||
        (trabajo.aiuUtilidadGlobalPorcentaje || 0) > 0
    );

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
    const [privadoSuministros, setPrivadoSuministros] = useState("");
    const [privadoInstalacion, setPrivadoInstalacion] = useState("");
    const [privadoServicios, setPrivadoServicios] = useState("");

    useEffect(() => {
        if (trabajo?.opcionesPdf) {
            setMaterialVisibilityMode(trabajo.opcionesPdf.visibilityMode || 'MOSTRAR_TODO');
            setPrivadoSuministros(trabajo.opcionesPdf.privadoSuministros || "");
            setPrivadoInstalacion(trabajo.opcionesPdf.privadoInstalacion || "");
            setPrivadoServicios(trabajo.opcionesPdf.privadoServicios || "");
        } else {
            setMaterialVisibilityMode('MOSTRAR_TODO');
            setPrivadoSuministros("");
            setPrivadoInstalacion("");
            setPrivadoServicios("");
        }
    }, [trabajo]);

    // PDF Style State
    const [selectedStyleId, setSelectedStyleId] = useState<string>('official_dmre');
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
        nombre: "DMRE",
        nit: "1075652553-9",
        direccion: "CARRERA 4 N° 5 -122 INT 2 BARANDILLAS, Zipaquirá, Cundinamarca",
        telefono: "CEL: 3115368577 - 3124074257 | TEL: 8816064",
        email: "info@dmre.com.co",
        descripcion: "Diseño y Montajes de Redes Eléctricas"
    });

    // Helper to calculate item totals with the new simple Additional Margin logic
    const calculateItemDetails = (item: ItemConVisibilidad) => {
        const pVenta = item.valorUnitario || 0;
        const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;

        const unitTotal = pVenta + margen;
        const lineTotal = unitTotal * item.cantidad;

        return { unitTotal, lineTotal };
    };

    // EXECUTION / EVIDENCE STATE
    const { toast } = useToast();
    const [evidenceNote, setEvidenceNote] = useState("");
    const [localEvidence, setLocalEvidence] = useState<EvidenciaTrabajo[]>(trabajo.evidencia || []);
    const [isLocating, setIsLocating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    // Track consumed materials by item ID (Set of material keys that have been used)
    const [materialesUsados, setMaterialesUsados] = useState<Set<string>>(new Set());
    // Final quantities per item: { [itemId]: number } — initialized from persisted cantidadFinal on each item
    const [cantidadesFinales, setCantidadesFinales] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        trabajo.items.forEach(item => {
            if (item.cantidadFinal !== undefined) {
                initial[item.id] = item.cantidadFinal;
            }
        });
        return initial;
    });
    // Acta dialog state
    const [showActa, setShowActa] = useState(false);
    const [observacionesActa, setObservacionesActa] = useState(trabajo.notas || '');

    // Load existing consumo records for this cotizacion to persist checkbox state
    useEffect(() => {
        if (isOpen && trabajo.id) {
            getConsumosByCotizacionAction(trabajo.id).then(consumos => {
                const usedKeys = new Set<string>();
                for (const c of consumos) {
                    // The checkbox key format is: `${trabajo.id}-${pItem.inventarioId || pItem.id}`
                    // We need to match by inventarioId if available
                    if (c.inventarioId) {
                        usedKeys.add(`${trabajo.id}-${c.inventarioId}`);
                    }
                    // Also match by description for items without inventarioId
                    // We search items to find the matching item ID
                    if (c.descripcionMaterial) {
                        const matchingItem = items.find(i => i.descripcion === c.descripcionMaterial);
                        if (matchingItem) {
                            usedKeys.add(`${trabajo.id}-${matchingItem.inventarioId || matchingItem.id}`);
                        }
                    }
                }
                if (usedKeys.size > 0) {
                    setMaterialesUsados(usedKeys);
                }
            }).catch(err => console.error("Error loading existing consumos:", err));
        }
    }, [isOpen, trabajo.id, items]);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // --- DOCUMENT TAB STATE ---
    const [documentosLegales, setDocumentosLegales] = useState<{ name: string, url: string, size: number, created_at: string }[]>([]);
    const [polizasSeguros, setPolizasSeguros] = useState<{ name: string, url: string, size: number, created_at: string }[]>([]);
    const [ordenesCompra, setOrdenesCompra] = useState<{ name: string, url: string, size: number, created_at: string }[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const docLegalInputRef = useRef<HTMLInputElement>(null);
    const docPolizaInputRef = useRef<HTMLInputElement>(null);
    const docOrdenInputRef = useRef<HTMLInputElement>(null);
    const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

    // Job Execution Details State
    const [notas, setNotas] = useState(trabajo.notas || "");
    const [direccionProyecto, setDireccionProyecto] = useState(trabajo.direccionProyecto || "");
    const [fechaInicio, setFechaInicio] = useState(trabajo.fechaInicio ? new Date(trabajo.fechaInicio).toISOString().split('T')[0] : "");
    const [fechaFinEstimada, setFechaFinEstimada] = useState(trabajo.fechaFinEstimada ? new Date(trabajo.fechaFinEstimada).toISOString().split('T')[0] : "");
    const [fechaFinReal, setFechaFinReal] = useState(trabajo.fechaFinReal ? new Date(trabajo.fechaFinReal).toISOString().split('T')[0] : "");
    const [costoReal, setCostoReal] = useState(trabajo.costoReal || 0);
    const [responsableId, setResponsableId] = useState(trabajo.responsableId || "");
    const [editDescripcion, setEditDescripcion] = useState(trabajo.descripcionTrabajo || "");

    // Sync local state with prop changes (Real-time updates)
    useEffect(() => {
        if (trabajo) {
            setNewProgress(trabajo.estado);
            setProgressPercent(trabajo.progreso || 0);
            setDireccionProyecto(trabajo.direccionProyecto || "");
            setFechaInicio(trabajo.fechaInicio ? new Date(trabajo.fechaInicio).toISOString().split('T')[0] : "");
            setFechaFinEstimada(trabajo.fechaFinEstimada ? new Date(trabajo.fechaFinEstimada).toISOString().split('T')[0] : "");
            setFechaFinReal(trabajo.fechaFinReal ? new Date(trabajo.fechaFinReal).toISOString().split('T')[0] : "");
            setCostoReal(trabajo.costoReal || 0);
            setResponsableId(trabajo.responsableId || "");
            setNotas(trabajo.notas || "");

            // Only update editDescripcion if the underlying ID changed (new modal opened) or if it's currently empty
            if (!editDescripcion || editDescripcion === trabajo.descripcionTrabajo) {
                setEditDescripcion(trabajo.descripcionTrabajo || "");
            }

            setGlobalIvaPct(trabajo.impuestoGlobalPorcentaje ?? 19);
            setGlobalDiscountPct(trabajo.descuentoGlobalPorcentaje ?? 0);
            setAiuAdminPct(trabajo.aiuAdminGlobalPorcentaje || 0);
            setAiuImprevPct(trabajo.aiuImprevistoGlobalPorcentaje || 0);
            setAiuUtilPct(trabajo.aiuUtilidadGlobalPorcentaje || 0);
            setIvaUtilPct(trabajo.ivaUtilidadGlobalPorcentaje || 19);

            setEditAlcance(trabajo.alcance || "");
            setEditFormaPago(trabajo.formaPago || "");
            setEditNotaFinal(trabajo.notaFinal || "");

            // Note: intentionally bypassing `setLocalEvidence(trabajo.evidencia || [])` to avoid destroying optimistic UI
            // Evidences are now primarily hydrated via the DB History (historial) safely.
            
            // Rebuild cantidadesFinales merging: incoming item.cantidadFinal (DB) + whatever user has in memory
            // Memory wins to avoid realtime round-trip from erasing just-typed values
            setCantidadesFinales(prev => {
                const merged = { ...prev };
                trabajo.items.forEach(item => {
                    if (item.cantidadFinal !== undefined && merged[item.id] === undefined) {
                        merged[item.id] = item.cantidadFinal;
                    }
                });
                return merged;
            });

            setItems(trabajo.items.map(item => ({
                ...item,
                // Preserve cantidadFinal from in-memory state if present (user just typed it)
                cantidadFinal: cantidadesFinales[item.id] ?? item.cantidadFinal,
                aiuAdminPorcentaje: item.aiuAdminPorcentaje || trabajo.aiuAdminGlobalPorcentaje || 0,
                aiuImprevistoPorcentaje: item.aiuImprevistoPorcentaje || trabajo.aiuImprevistoGlobalPorcentaje || 0,
                aiuUtilidadPorcentaje: item.aiuUtilidadPorcentaje || trabajo.aiuUtilidadGlobalPorcentaje || 0,
                ivaUtilidadPorcentaje: item.ivaUtilidadPorcentaje || trabajo.ivaUtilidadGlobalPorcentaje || 19,
                visibleEnPdf: true,
                ocultarDetalles: item.ocultarDetalles || false
            })));
        }
    }, [trabajo.id, trabajo.estado, trabajo.progreso, trabajo.fechaActualizacion]);

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
            estado: progressPercent === 100 ? 'APROBADA' : newProgress,
            progreso: progressPercent,
            descripcionTrabajo: editDescripcion,
            notas: notas,
            fechaActualizacion: new Date(),
            direccionProyecto,
            fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
            fechaFinEstimada: fechaFinEstimada ? new Date(fechaFinEstimada) : undefined,
            fechaFinReal: fechaFinReal ? new Date(fechaFinReal) : undefined,
            costoReal,
            responsableId,
            evidencia: updatedEvidence
        };

        onTrabajoUpdated(updated);
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

    // --- DOCUMENT TAB HANDLERS ---
    const loadDocuments = async () => {
        setIsLoadingDocs(true);
        try {
            const { data: legalFiles } = await supabase.storage
                .from('Documentost_rabajos')
                .list(`Documentacion/${trabajo.id}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

            const { data: polizaFiles } = await supabase.storage
                .from('Documentost_rabajos')
                .list(`Polizasyseguros/${trabajo.id}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

            const { data: ordenesFiles } = await supabase.storage
                .from('Documentost_rabajos')
                .list(`OrdenesDeCompra/${trabajo.id}`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

            if (legalFiles) {
                setDocumentosLegales(legalFiles.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
                    name: f.name,
                    url: supabase.storage.from('Documentost_rabajos').getPublicUrl(`Documentacion/${trabajo.id}/${f.name}`).data.publicUrl,
                    size: f.metadata?.size || 0,
                    created_at: f.created_at || ''
                })));
            }

            if (polizaFiles) {
                setPolizasSeguros(polizaFiles.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
                    name: f.name,
                    url: supabase.storage.from('Documentost_rabajos').getPublicUrl(`Polizasyseguros/${trabajo.id}/${f.name}`).data.publicUrl,
                    size: f.metadata?.size || 0,
                    created_at: f.created_at || ''
                })));
            }

            if (ordenesFiles) {
                setOrdenesCompra(ordenesFiles.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({
                    name: f.name,
                    url: supabase.storage.from('Documentost_rabajos').getPublicUrl(`OrdenesDeCompra/${trabajo.id}/${f.name}`).data.publicUrl,
                    size: f.metadata?.size || 0,
                    created_at: f.created_at || ''
                })));
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setIsLoadingDocs(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (activeTab === 'documentos' && isOpen) {
            loadDocuments();
        }
    }, [activeTab, isOpen]);

    const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>, category: 'Documentacion' | 'Polizasyseguros' | 'OrdenesDeCompra') => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingDoc(true);
        try {
            for (const file of Array.from(files)) {
                const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                const filePath = `${category}/${trabajo.id}/${safeFileName}`;

                const { error } = await supabase.storage
                    .from('Documentost_rabajos')
                    .upload(filePath, file);

                if (error) throw error;
            }

            toast({ title: "Archivo(s) subido(s)", description: "Se cargaron correctamente." });
            await loadDocuments();
        } catch (error: any) {
            console.error('Error uploading document:', error);
            toast({ variant: "destructive", title: "Error al subir", description: error.message || "No se pudo subir el archivo." });
        } finally {
            setIsUploadingDoc(false);
            if (event.target) event.target.value = '';
        }
    };

    const handleDeleteDoc = async (fileName: string, category: 'Documentacion' | 'Polizasyseguros' | 'OrdenesDeCompra') => {
        try {
            const { error } = await supabase.storage
                .from('Documentost_rabajos')
                .remove([`${category}/${trabajo.id}/${fileName}`]);

            if (error) throw error;

            toast({ title: "Archivo eliminado", description: `${fileName.replace(/^\d+_/, '')} eliminado.` });
            await loadDocuments();
        } catch (error: any) {
            console.error('Error deleting document:', error);
            toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    const getDocFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <Image className="h-5 w-5 text-green-500" />;
        if (['pdf'].includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
        if (['doc', 'docx'].includes(ext)) return <FileText className="h-5 w-5 text-blue-500" />;
        if (['xls', 'xlsx'].includes(ext)) return <FileText className="h-5 w-5 text-emerald-500" />;
        return <FolderOpen className="h-5 w-5 text-gray-500" />;
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

    const combinedEvidences = useMemo(() => {
        const historyEvidences: EvidenciaTrabajo[] = historial
            .filter(h => ['UBICACION', 'FOTO', 'VIDEO'].includes(h.tipo) || (h.tipo === 'NOTA' && h.descripcion && !h.descripcion.includes('Item ')))
            .map(h => ({
                id: h.id,
                fecha: new Date(h.fecha),
                usuarioId: 'history',
                usuarioNombre: h.usuario,
                tipo: h.tipo as any,
                descripcion: h.descripcion,
                url: h.url || h.metadata?.url,
                ubicacion: h.metadata?.lat ? {
                    lat: h.metadata?.lat,
                    lng: h.metadata?.lng,
                    precision: h.metadata?.precision,
                    timestamp: h.metadata?.timestamp
                } : undefined
            }));

        // Filter out local evidences that are older than 10 seconds to avoid duplicates with history
        const recentLocal = localEvidence.filter(le => (Date.now() - new Date(le.fecha).getTime()) < 10000);
        return [...recentLocal, ...historyEvidences];
    }, [historial, localEvidence]);





    // Calculate totals
    const { subtotal, descuento, iva, total, totalAiuAdmin, totalAiuImprev, totalAiuUtil } = useMemo(() => {
        let sub = 0;

        // Sum up derived values from items
        const itemResults = items.map(item => {
            // P. Venta is the base sale price from inventory
            const pVenta = item.valorUnitario || 0;

            // Margen Adicional (Adicional %) applied on top of P. Venta
            const extra = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;

            // Item Final Total (Unitary)
            const itemTotalUnit = pVenta + extra;

            // Total Line
            const lineTotal = itemTotalUnit * item.cantidad;

            return {
                lineTotal
            };
        });

        sub = itemResults.reduce((acc, r) => acc + r.lineTotal, 0);

        // Apply Global Discount to the Subtotal
        const discountVal = sub * (globalDiscountPct / 100);
        const subAfterDiscount = sub - discountVal;

        const aiuAdmin = esAiu ? subAfterDiscount * (aiuAdminPct / 100) : 0;
        const aiuImprevisto = esAiu ? subAfterDiscount * (aiuImprevPct / 100) : 0;
        const aiuUtilidad = esAiu ? subAfterDiscount * (aiuUtilPct / 100) : 0;

        // If AIU is active, calculate IVA based on the `ivaUtilPct` input (usually 19%), over the 'Utilidad' value only.
        // If AIU is inactive, apply `globalIvaPct` (usually 19%) over the full discounted subtotal.
        const totalIva = esAiu
            ? aiuUtilidad * (ivaUtilPct / 100)
            : subAfterDiscount * (globalIvaPct / 100);

        return {
            subtotal: sub,
            descuento: discountVal,
            iva: totalIva,
            total: subAfterDiscount + aiuAdmin + aiuImprevisto + aiuUtilidad + totalIva,
            totalAiuAdmin: aiuAdmin,
            totalAiuImprev: aiuImprevisto,
            totalAiuUtil: aiuUtilidad
        };
    }, [items, globalDiscountPct, globalIvaPct, aiuAdminPct, aiuImprevPct, aiuUtilPct, ivaUtilPct, esAiu]);

    // Helper for recursive deduction of Work Codes (APUs)
    const [isDeducting, setIsDeducting] = useState(false);
    const deductRecursive = async (item: CotizacionItem, multiplier: number = 1): Promise<number> => {
        let count = 0;

        // 1. If it has direct sub-items (typical for saved Work Codes)
        if (item.subItems && item.subItems.length > 0) {
            for (const mat of item.subItems) {
                const qty = (mat.cantidad || 0) * multiplier;
                if (mat.inventarioId) {
                    await addConsumoMaterial({
                        inventarioId: mat.inventarioId,
                        descripcionMaterial: mat.nombre,
                        cotizacionId: trabajo.id,
                        cantidad: qty,
                        unidad: 'UND',
                        descripcion: `Consumo desde trabajo #${trabajo.numero} — ${item.descripcion}`,
                    });
                    count++;
                } else if (mat.subCodigoId) {
                    const subCode = codigosTrabajo.find((c: any) => c.id === mat.subCodigoId);
                    if (subCode) {
                        count += await deductRecursive({
                            ...item,
                            subItems: subCode.materiales
                        }, qty);
                    }
                }
            }
        }
        // 2. If it's a SERVICE type and we can find its definition in global Work Codes
        else if (item.tipo === 'SERVICIO' && item.codigoTrabajoId) {
            const fullCode = codigosTrabajo.find((c: any) => c.id === item.codigoTrabajoId);
            if (fullCode && fullCode.materiales) {
                for (const mat of fullCode.materiales) {
                    const qty = (mat.cantidad || 0) * multiplier;
                    if (mat.inventarioId) {
                        await addConsumoMaterial({
                            inventarioId: mat.inventarioId,
                            descripcionMaterial: mat.nombre,
                            cotizacionId: trabajo.id,
                            cantidad: qty,
                            unidad: 'UND',
                            descripcion: `Consumo desde trabajo #${trabajo.numero} — ${item.descripcion}`,
                        });
                        count++;
                    } else if (mat.subCodigoId) {
                        const subCode = codigosTrabajo.find((c: any) => c.id === mat.subCodigoId);
                        if (subCode) {
                            count += await deductRecursive({
                                ...item,
                                subItems: subCode.materiales
                            }, qty);
                        }
                    }
                }
            }
        }
        return count;
    };

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
            valorNuevo: `Estado: ${progressPercent === 100 ? 'APROBADA' : (progressPercent > 0 ? 'EN_REVISION' : trabajo.estado)}`,
        };

        setHistorial([entry, ...historial]);

        // We use the status from the dropdown/manual selection OR force it if progress is 100
        // FIXED: Only override with APROBADA if progress is 100, otherwise ALWAYS respect newProgress selected by user
        let finalEstado = newProgress;
        if (progressPercent === 100) {
            finalEstado = 'APROBADA';
        }

        const updated: Cotizacion = {
            ...trabajo,
            descripcionTrabajo: editDescripcion,
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
            evidencia: localEvidence,
            alcance: editAlcance,
            formaPago: editFormaPago,
            notaFinal: editNotaFinal,
            opcionesPdf: {
                ...trabajo.opcionesPdf,
                visibilityMode: materialVisibilityMode,
                privadoSuministros,
                privadoInstalacion,
                privadoServicios,
            }
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
            visibleEnPdf: true,
            esExtra: true // Mark as an extra item when added from this dashboard
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
            default: return null;
        }
    };

    const previewQuote = useMemo(() => {
        const visibleItems = items.filter(i => i.visibleEnPdf);
        const itemsCalculados = visibleItems.map((item) => {
            const { unitTotal, lineTotal } = calculateItemDetails(item);
            const { visibleEnPdf, ...rest } = item;
            return { ...rest, valorUnitario: unitTotal, valorTotal: lineTotal, porcentaje: 0 };
        });

        const subTotalPDF = itemsCalculados.reduce((a, b) => a + b.valorTotal, 0);
        const descuentoPDF = subTotalPDF * (globalDiscountPct / 100);
        const basePDF = subTotalPDF - descuentoPDF;

        const aiuAdminPDF = esAiu ? basePDF * (aiuAdminPct / 100) : 0;
        const aiuImprevPDF = esAiu ? basePDF * (aiuImprevPct / 100) : 0;
        const aiuUtilPDF = esAiu ? basePDF * (aiuUtilPct / 100) : 0;

        const ivaPDF = esAiu ? (aiuUtilPDF * (ivaUtilPct / 100)) : (basePDF * (globalIvaPct / 100));
        const totalPDF = basePDF + aiuAdminPDF + aiuImprevPDF + aiuUtilPDF + ivaPDF;

        return {
            ...trabajo,
            items: itemsCalculados,
            subtotal: subTotalPDF,
            descuentoGlobal: descuentoPDF,
            descuentoGlobalPorcentaje: globalDiscountPct,
            aiuAdmin: aiuAdminPDF,
            aiuImprevistos: aiuImprevPDF,
            aiuUtilidad: aiuUtilPDF,
            iva: ivaPDF,
            total: totalPDF,
            impuestoGlobalPorcentaje: globalIvaPct,
            aiuAdminGlobalPorcentaje: aiuAdminPct,
            aiuImprevistoGlobalPorcentaje: aiuImprevPct,
            aiuUtilidadGlobalPorcentaje: aiuUtilPct,
            ivaUtilidadGlobalPorcentaje: ivaUtilPct,
        };
    }, [trabajo, items, globalDiscountPct, esAiu, aiuAdminPct, aiuImprevPct, aiuUtilPct, globalIvaPct, ivaUtilPct]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
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

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'detalles' | 'items' | 'ejecucion' | 'preview' | 'documentos' | 'historial')} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1">
                        <TabsTrigger value="detalles" className="flex-1 sm:flex-none">Detalles</TabsTrigger>
                        {trabajo.estado !== 'APROBADA' && <TabsTrigger value="items" className="flex-1 sm:flex-none">Items & Edición</TabsTrigger>}
                        {showExecution && <TabsTrigger value="ejecucion" className="flex-1 sm:flex-none">Ejecución</TabsTrigger>}
                        <TabsTrigger value="preview" className="flex-1 sm:flex-none">Vista PDF</TabsTrigger>
                        {trabajo.estado === 'APROBADA' && <TabsTrigger value="documentos" className="flex-1 sm:flex-none">Documentos</TabsTrigger>}
                        {trabajo.estado === 'APROBADA' && <TabsTrigger value="compras" className="flex-1 sm:flex-none">Compras</TabsTrigger>}
                        <TabsTrigger value="historial" className="flex-1 sm:flex-none">Historial</TabsTrigger>
                    </TabsList>

                    {/* DETALLES TAB */}
                    <TabsContent value="detalles" className="flex-1 overflow-auto space-y-4 mt-4">
                        {/* ... Existing Details Content ... */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                                value={editDescripcion}
                                                onChange={(e) => setEditDescripcion(e.target.value)}
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
                                                    {trabajo.estado === 'ENVIADA' ? (
                                                        <>
                                                            <SelectItem value="ENVIADA" disabled className="hidden">Enviada</SelectItem>
                                                            <SelectItem value="APROBADA">Aprobada</SelectItem>
                                                            <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                                                            <SelectItem value="MODIFICACION">Modificación</SelectItem>
                                                        </>
                                                    ) : trabajo.estado === 'MODIFICACION' ? (
                                                        <>
                                                            <SelectItem value="MODIFICACION" disabled className="hidden">Modificación</SelectItem>
                                                            <SelectItem value="BORRADOR">Borrador</SelectItem>
                                                            <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                                                            <SelectItem value="ENVIADA">Enviada</SelectItem>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SelectItem value="BORRADOR">Borrador</SelectItem>
                                                            <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                                                            <SelectItem value="ENVIADA">Enviada</SelectItem>
                                                            <SelectItem value="APROBADA">Aprobada</SelectItem>
                                                            <SelectItem value="RECHAZADA">Rechazada</SelectItem>
                                                            <SelectItem value="MODIFICACION">Modificación</SelectItem>
                                                        </>
                                                    )}
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
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <Progress value={progressPercent} className="w-full sm:flex-1 h-3 sm:mr-4" />
                                    <Button size="sm" onClick={handleUpdateProgress} className="w-full sm:w-auto">
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

                        {/* Condiciones Comerciales - Added for UI Parity */}
                        <Card>
                            <CardHeader className="py-3 bg-muted/20">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" /> Condiciones Comerciales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="edit-alcance" className="text-xs">Alcance</Label>
                                    <Textarea
                                        id="edit-alcance"
                                        value={editAlcance}
                                        onChange={(e) => setEditAlcance(e.target.value)}
                                        placeholder="Describa el alcance de los trabajos..."
                                        className="min-h-[80px] text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-formaPago" className="text-xs">Forma de Pago</Label>
                                    <Textarea
                                        id="edit-formaPago"
                                        value={editFormaPago}
                                        onChange={(e) => setEditFormaPago(e.target.value)}
                                        placeholder="Especificar anticipos, contraentregas..."
                                        className="min-h-[50px] text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-notaFinal" className="text-xs">Nota Final (Condiciones)</Label>
                                    <Textarea
                                        id="edit-notaFinal"
                                        value={editNotaFinal}
                                        onChange={(e) => setEditNotaFinal(e.target.value)}
                                        placeholder="Información adicional e importante..."
                                        className="min-h-[80px] text-sm"
                                    />
                                </div>
                                <div className="flex justify-end mt-2">
                                    <Button size="sm" onClick={handleUpdateProgress}>
                                        <Save className="mr-2 h-4 w-4" /> Guardar Términos
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* EJECUCIÓN / EVIDENCIA TAB */}
                    {showExecution && (
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
                                                defaultValue={direccionProyecto}
                                                onBlur={(e) => setDireccionProyecto(e.target.value)}
                                                placeholder="Carrera 4 # 5-122..."
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Responsable (ID)</Label>
                                            <Input
                                                defaultValue={responsableId}
                                                onBlur={(e) => setResponsableId(e.target.value)}
                                                placeholder="ID del Empleado"
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Costo Real Ejecución</Label>
                                            <Input
                                                type="number"
                                                defaultValue={costoReal || ''}
                                                onBlur={(e) => setCostoReal(Number(e.target.value))}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Notas Generales Trabajo</Label>
                                            <Textarea
                                                defaultValue={notas}
                                                onBlur={(e) => setNotas(e.target.value)}
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
                                                defaultValue={fechaInicio}
                                                onBlur={(e) => setFechaInicio(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Fin Estimado</Label>
                                            <Input
                                                type="date"
                                                defaultValue={fechaFinEstimada}
                                                onBlur={(e) => setFechaFinEstimada(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px]">Fin Real</Label>
                                            <Input
                                                type="date"
                                                defaultValue={fechaFinReal}
                                                onBlur={(e) => setFechaFinReal(e.target.value)}
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

                            {/* Análisis de Cantidades y Extras en Tiempo Real */}
                            {(() => {
                                let costoOriginal = 0;
                                let costoExtras = 0;
                                let cantOriginales = 0;
                                let cantExtras = 0;

                                // Quantity analysis: items with variances
                                const itemsConVariacion: { item: ItemConVisibilidad; cantOferta: number; cantFinal: number; diff: number; pVentaUnit: number }[] = [];

                                items.forEach(item => {
                                    const pVenta = item.valorUnitario || 0;
                                    const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                    const pUnit = pVenta + margen;

                                    if (item.esExtra) {
                                        costoExtras += pUnit * item.cantidad;
                                        cantExtras++;
                                    } else {
                                        costoOriginal += pUnit * item.cantidad;
                                        cantOriginales++;
                                    }

                                    // Check quantity variance for non-extra items
                                    if (!item.esExtra) {
                                        const cantFinal = cantidadesFinales[item.id];
                                        if (cantFinal !== undefined && cantFinal !== item.cantidad) {
                                            itemsConVariacion.push({
                                                item,
                                                cantOferta: item.cantidad,
                                                cantFinal,
                                                diff: cantFinal - item.cantidad,
                                                pVentaUnit: pUnit
                                            });
                                        }
                                    }
                                });

                                const costoVariacion = itemsConVariacion.reduce((acc, v) => acc + v.diff * v.pVentaUnit, 0);

                                return (
                                    <div className="flex flex-col gap-4 mb-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <Card className="bg-muted/10 border-dashed">
                                                <CardContent className="p-4 flex flex-col justify-center items-center">
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                                                        Originales ({cantOriginales})
                                                    </p>
                                                    <p className="font-mono text-lg font-semibold">{formatCurrency(costoOriginal)}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 border-dashed">
                                                <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                                        <Plus className="h-3 w-3" /> Extras ({cantExtras})
                                                    </p>
                                                    <p className="font-mono text-lg font-bold text-amber-600 dark:text-amber-500">+{formatCurrency(costoExtras)}</p>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-primary/5 hover:bg-primary/10 transition-colors">
                                                <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                                                    <p className="text-[10px] text-primary font-bold uppercase mb-1">Costo Actual</p>
                                                    <p className="font-mono text-xl font-bold text-primary">{formatCurrency(costoOriginal + costoExtras)}</p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Análisis de Variación de Cantidades */}
                                        {itemsConVariacion.length > 0 && (
                                            <Card className="border-blue-200 dark:border-blue-900 overflow-hidden">
                                                <div className="bg-blue-50 dark:bg-blue-950/30 py-2 px-4 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                        <TrendingUp className="h-3 w-3" /> Variación de Cantidades
                                                    </span>
                                                    <span className={`text-xs font-mono font-semibold ${costoVariacion > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                        {costoVariacion > 0 ? '+' : ''}{formatCurrency(costoVariacion)}
                                                    </span>
                                                </div>
                                                <CardContent className="p-0">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-muted/20">
                                                                <TableHead className="text-[10px] py-1">Ítem</TableHead>
                                                                <TableHead className="text-center text-[10px] py-1">Oferta</TableHead>
                                                                <TableHead className="text-center text-[10px] py-1">Final</TableHead>
                                                                <TableHead className="text-center text-[10px] py-1">Δ Cant.</TableHead>
                                                                <TableHead className="text-right text-[10px] py-1">Δ Valor</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {itemsConVariacion.map(v => (
                                                                <TableRow key={v.item.id}>
                                                                    <TableCell className="text-xs py-1.5 font-medium">{v.item.descripcion}</TableCell>
                                                                    <TableCell className="text-center text-xs py-1.5 text-muted-foreground">{v.cantOferta}</TableCell>
                                                                    <TableCell className="text-center text-xs py-1.5 font-semibold">{v.cantFinal}</TableCell>
                                                                    <TableCell className="text-center py-1.5">
                                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${v.diff > 0 ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'}`}>
                                                                            {v.diff > 0 ? '+' : ''}{v.diff}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className={`text-right text-xs font-mono font-semibold py-1.5 ${v.diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                        {v.diff > 0 ? '+' : ''}{formatCurrency(v.diff * v.pVentaUnit)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Extras Detail */}
                                        {cantExtras > 0 && (
                                            <Card className="border-amber-200 dark:border-amber-900 overflow-hidden">
                                                <div className="bg-amber-50 dark:bg-amber-950/30 py-2 px-4 border-b border-amber-100 dark:border-amber-900/50 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                                                        <AlertCircle className="h-3 w-3" /> Detalle de Extras
                                                    </span>
                                                    <span className="text-xs font-mono font-medium text-amber-600 dark:text-amber-500">
                                                        {cantExtras} item{cantExtras > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <CardContent className="p-0">
                                                    <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                                        {items.filter(i => i.esExtra).map(extra => {
                                                            const pVenta = extra.valorUnitario || 0;
                                                            const margen = extra.porcentaje ? pVenta * (extra.porcentaje / 100) : 0;
                                                            const unitTotal = pVenta + margen;
                                                            return (
                                                                <div key={extra.id} className="flex justify-between items-center py-2 px-4 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors group">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-medium">{extra.descripcion}</span>
                                                                        <span className="text-[10px] text-muted-foreground mt-0.5">
                                                                            Cant: {extra.cantidad} x {formatCurrency(unitTotal)}
                                                                            {extra.porcentaje ? ` (+${extra.porcentaje}% extra)` : ''}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="font-mono text-sm font-semibold text-amber-600 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                                                                            +{formatCurrency(unitTotal * extra.cantidad)}
                                                                        </div>
                                                                        <button
                                                                            title="Eliminar extra"
                                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500"
                                                                            onClick={() => {
                                                                                const updatedItems = items.filter(i => i.id !== extra.id);
                                                                                setItems(updatedItems);
                                                                                onTrabajoUpdated({
                                                                                    ...trabajo,
                                                                                    items: updatedItems.map(({ visibleEnPdf, ...item }) => item),
                                                                                });
                                                                                toast({ title: 'Extra eliminado', description: `"${extra.descripcion}" fue removido de los extras.` });
                                                                            }}
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {/* Generar Acta Button */}
                                        <div className="flex justify-end">
                                            <Button
                                                variant="default"
                                                className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all gap-2"
                                                onClick={() => setShowActa(true)}
                                            >
                                                <FileSignature className="h-4 w-4" />
                                                Generar Acta
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Materials Consumption Section */}
                            <Collapsible defaultOpen className="mt-4">
                                <Card>
                                    <CollapsibleTrigger className="w-full">
                                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Package className="h-4 w-4 text-orange-500" /> Materiales y Códigos del Trabajo
                                                <Badge variant="outline" className="ml-auto">
                                                    {items.length} grupos
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>Marca como utilizado para descontar del inventario (incluye materiales de códigos).</CardDescription>
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex justify-end">
                                                <Button size="sm" variant="outline" onClick={() => setShowAddItem(true)} className="border-primary text-primary hover:bg-primary/10">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Agregar Suministro o Servicio
                                                </Button>
                                            </div>
                                            {items.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">No hay suministros, instalaciones ni servicios agregados en este trabajo.</p>
                                            ) : (
                                                <div className="space-y-6">
                                                    {/* Independent Materials */}
                                                    {items.filter(i => i.tipo === 'PRODUCTO').length > 0 && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase text-muted-foreground px-2">Materiales Independientes</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-12">Usado</TableHead>
                                                                        <TableHead>Material</TableHead>
                                                                        <TableHead className="text-right">Cant. Oferta</TableHead>
                                                                        <TableHead className="text-right w-28">Cant. Final</TableHead>
                                                                        <TableHead className="text-right">Existencias</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {items.filter(i => i.tipo === 'PRODUCTO').map((pItem: ItemConVisibilidad) => {
                                                                        const itemKey = `${trabajo.id}-${pItem.inventarioId || pItem.id}`;
                                                                        const inventoryItem = inventario.find(inv => inv.id === pItem.inventarioId);
                                                                        const isUsed = materialesUsados.has(itemKey);
                                                                        const cantFinal = cantidadesFinales[pItem.id];
                                                                        const hasDiff = cantFinal !== undefined && cantFinal !== pItem.cantidad;

                                                                        return (
                                                                            <TableRow key={pItem.id} className={`${isUsed ? "bg-green-50 dark:bg-green-950/20" : pItem.esExtra ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}>
                                                                                <TableCell>
                                                                                    <CheckboxUI
                                                                                        checked={isUsed}
                                                                                        disabled={isUsed}
                                                                                        onCheckedChange={async (checked: boolean) => {
                                                                                            if (checked) {
                                                                                                setMaterialesUsados(prev => new Set(prev).add(itemKey));
                                                                                                try {
                                                                                                    await addConsumoMaterial({
                                                                                                        inventarioId: pItem.inventarioId || undefined,
                                                                                                        descripcionMaterial: pItem.descripcion,
                                                                                                        cotizacionId: trabajo.id,
                                                                                                        cantidad: cantidadesFinales[pItem.id] ?? pItem.cantidad,
                                                                                                        unidad: 'UND',
                                                                                                        descripcion: `Consumo desde trabajo #${trabajo.numero} — ${pItem.descripcion}`,
                                                                                                    });
                                                                                                    toast({ title: "✅ Consumo Registrado", description: `${pItem.descripcion} marcado como utilizado.` });
                                                                                                } catch (err: any) {
                                                                                                    setMaterialesUsados(prev => { const next = new Set(prev); next.delete(itemKey); return next; });
                                                                                                    toast({ title: "Error al Registrar", description: err?.message || "No se pudo registrar el consumo.", variant: "destructive" });
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </TableCell>
                                                                                <TableCell className="font-medium">
                                                                                    {pItem.descripcion}
                                                                                    {pItem.esExtra && <Badge variant="secondary" className="ml-2 text-[8px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">EXTRA</Badge>}
                                                                                </TableCell>
                                                                                <TableCell className="text-right text-muted-foreground">{pItem.cantidad}</TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Input
                                                                                            type="number"
                                                                                            min={0}
                                                                                            placeholder={String(pItem.cantidad)}
                                                                                            value={cantidadesFinales[pItem.id] ?? ''}
                                                                                            onChange={e => {
                                                                                                const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                                                const newCants = val === undefined
                                                                                                    ? (({ [pItem.id]: _, ...rest }) => rest)(cantidadesFinales)
                                                                                                    : { ...cantidadesFinales, [pItem.id]: val };
                                                                                                setCantidadesFinales(newCants);
                                                                                                // Persist cantidadFinal in the item itself
                                                                                                const updatedItems = items.map(i =>
                                                                                                    i.id === pItem.id ? { ...i, cantidadFinal: val } : i
                                                                                                );
                                                                                                setItems(updatedItems);
                                                                                                onTrabajoUpdated({
                                                                                                    ...trabajo,
                                                                                                    items: updatedItems.map(({ visibleEnPdf, ...item }) => item),
                                                                                                });
                                                                                            }}
                                                                                            className={`h-7 w-20 text-xs text-right p-1 ${hasDiff ? (cantFinal! > pItem.cantidad ? 'border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600 font-bold' : 'border-green-400 bg-green-50 dark:bg-green-950/20 text-green-700 font-bold') : ''}`}
                                                                                        />
                                                                                        {hasDiff && (
                                                                                            <span className={`text-[10px] font-bold ${cantFinal! > pItem.cantidad ? 'text-red-500' : 'text-green-600'}`}>
                                                                                                {cantFinal! > pItem.cantidad ? '+' : ''}{cantFinal! - pItem.cantidad}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right text-muted-foreground">
                                                                                    {inventoryItem ? inventoryItem.cantidad : 'N/A'}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}

                                                    {/* Instalaciones y Servicios */}
                                                    {items.filter(i => i.tipo !== 'PRODUCTO').map((sItem: ItemConVisibilidad) => {
                                                        const itemKey = `${trabajo.id}-${sItem.id}`;
                                                        const isUsed = materialesUsados.has(itemKey);
                                                        const cantFinalSrv = cantidadesFinales[sItem.id];
                                                        const hasDiffSrv = cantFinalSrv !== undefined && cantFinalSrv !== sItem.cantidad;

                                                        return (
                                                            <div key={sItem.id} className={`border rounded-lg overflow-hidden ${sItem.esExtra ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                                                                <div className={`p-3 border-b flex justify-between items-center ${isUsed ? "bg-green-50 dark:bg-green-950/20" : sItem.esExtra ? "bg-amber-50/70 dark:bg-amber-950/30" : "bg-muted/30"}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <CheckboxUI
                                                                            checked={isUsed}
                                                                            disabled={isUsed || isDeducting}
                                                                            onCheckedChange={async (checked: boolean) => {
                                                                                if (checked) {
                                                                                    // Optimistic UI Update
                                                                                    setMaterialesUsados(prev => new Set(prev).add(itemKey));
                                                                                    setIsDeducting(true);
                                                                                    
                                                                                    try {
                                                                                        const totalDeducted = await deductRecursive(sItem, sItem.cantidad);
                                                                                        toast({
                                                                                            title: "Código Aplicado",
                                                                                            description: `Se descontaron los materiales para ${sItem.cantidad} unidades de "${sItem.descripcion}".`
                                                                                        });
                                                                                    } catch (err) {
                                                                                        // Rollback on failure
                                                                                        setMaterialesUsados(prev => {
                                                                                            const next = new Set(prev);
                                                                                            next.delete(itemKey);
                                                                                            return next;
                                                                                        });
                                                                                        toast({
                                                                                            title: "Error",
                                                                                            description: "No se pudieron descontar todos los materiales del código.",
                                                                                            variant: "destructive"
                                                                                        });
                                                                                    } finally {
                                                                                        setIsDeducting(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                        />
                                                                        <div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                    {sItem.tipo === 'SERVICIO' ? (
                                                                                        <span style={{ color: '#3b82f6', fontSize: '10px' }}>🔧</span>
                                                                                    ) : (
                                                                                        <span style={{ color: '#22c55e', fontSize: '10px' }}>📦</span>
                                                                                    )}
                                                                                    <span>{sItem.descripcion}</span>
                                                                                </div>
                                                                                {sItem.subItems && sItem.subItems.length > 0 && !sItem.ocultarDetalles && (
                                                                                    <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                                                        {sItem.subItems.map((sub: any, sIdx: number) => (
                                                                                            <div key={sIdx} style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px' }}>
                                                                                                <span style={{ fontSize: '10px' }}>↳</span>
                                                                                                <span>{sub.nombre} ({sub.cantidad * sItem.cantidad} un.)</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[9px] text-muted-foreground">Oferta: {sItem.cantidad}</span>
                                                                            <Input
                                                                                type="number"
                                                                                min={0}
                                                                                placeholder={String(sItem.cantidad)}
                                                                                value={cantidadesFinales[sItem.id] ?? ''}
                                                                                onChange={e => {
                                                                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                                                                    const newCants = val === undefined
                                                                                        ? (({ [sItem.id]: _, ...rest }) => rest)(cantidadesFinales)
                                                                                        : { ...cantidadesFinales, [sItem.id]: val };
                                                                                    setCantidadesFinales(newCants);
                                                                                    // Persist cantidadFinal in the item itself
                                                                                    const updatedItems = items.map(i =>
                                                                                        i.id === sItem.id ? { ...i, cantidadFinal: val } : i
                                                                                    );
                                                                                    setItems(updatedItems);
                                                                                    onTrabajoUpdated({
                                                                                        ...trabajo,
                                                                                        items: updatedItems.map(({ visibleEnPdf, ...item }) => item),
                                                                                    });
                                                                                }}
                                                                                className={`h-6 w-16 text-[10px] text-right p-1 ${hasDiffSrv ? (cantFinalSrv! > sItem.cantidad ? 'border-red-400 bg-red-50 text-red-600 font-bold' : 'border-green-400 bg-green-50 text-green-700 font-bold') : ''}`}
                                                                            />
                                                                            {hasDiffSrv && <span className={`text-[9px] font-bold ${cantFinalSrv! > sItem.cantidad ? 'text-red-500' : 'text-green-600'}`}>{cantFinalSrv! > sItem.cantidad ? '+' : ''}{cantFinalSrv! - sItem.cantidad}</span>}
                                                                        </div>
                                                                        <Badge variant={isUsed ? "default" : "outline"} className={isUsed ? "bg-green-600" : ""}>
                                                                            {isUsed ? "Consumido" : "Pendiente"}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                {sItem.subItems && sItem.subItems.length > 0 && (
                                                                    <Collapsible>
                                                                        <CollapsibleTrigger className="w-full text-left text-[10px] p-2 hover:bg-muted/50 transition-colors flex items-center gap-2">
                                                                            Ver materiales incluidos ({sItem.subItems.length})
                                                                        </CollapsibleTrigger>
                                                                        <CollapsibleContent>
                                                                            <Table>
                                                                                <TableBody>
                                                                                    {sItem.subItems.map((sub: MaterialAsociado, sIdx: number) => (
                                                                                        <TableRow key={sIdx} className="bg-muted/5 border-0">
                                                                                            <TableCell className="pl-10 py-1 text-xs">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <span className="text-muted-foreground">↳</span>
                                                                                                    {sub.nombre}
                                                                                                </div>
                                                                                            </TableCell>
                                                                                            <TableCell className="text-right py-1 text-xs text-muted-foreground">
                                                                                                {(sub.cantidad || 0) * sItem.cantidad} unidades
                                                                                            </TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </CollapsibleContent>
                                                                    </Collapsible>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
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
                                        {combinedEvidences.filter(e => e.tipo === 'UBICACION').length > 0 ? (
                                            (() => {
                                                const lastLoc = combinedEvidences.filter(e => e.tipo === 'UBICACION').sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
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
                                    <Clock className="h-4 w-4" /> Historial de Ejecución ({combinedEvidences.length})
                                </h3>
                                <div className="space-y-4 pl-2">
                                    {combinedEvidences.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((ev) => (
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
                    )}

                    {/* ACTA DIALOG */}
                    <Dialog open={showActa} onOpenChange={setShowActa}>
                        <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-lg">
                                    <FileSignature className="h-5 w-5 text-primary" />
                                    Acta de Ejecución — Trabajo #{trabajo.numero}
                                </DialogTitle>
                                <DialogDescription>
                                    Documento oficial para entrega al cliente. Ajuste los datos y luego imprima.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="flex-1 overflow-auto pr-2">
                                <div className="space-y-6 py-2">

                                    {/* === MEMBRETE EMPRESA + CLIENTE === */}
                                    <div className="rounded-xl border-2 border-primary/20 overflow-hidden">

                                        {/* Top bar */}
                                        <div className="bg-primary px-5 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white/20 rounded-lg p-2">
                                                    <Zap className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-base leading-none">{companyInfo.nombre}</p>
                                                    <p className="text-white/70 text-[10px] mt-0.5">{companyInfo.descripcion}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/80 text-[10px] uppercase tracking-wider font-bold">Acta de Ejecución</p>
                                                <p className="text-white font-mono font-bold text-sm">N° {trabajo.numero}</p>
                                                <p className="text-white/70 text-[10px]">{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}</p>
                                            </div>
                                        </div>

                                        {/* Company info row */}
                                        <div className="bg-primary/5 px-5 py-2 border-b border-primary/10 flex flex-wrap gap-x-6 gap-y-1">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {companyInfo.direccion}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {companyInfo.telefono}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> {companyInfo.email}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                NIT: {companyInfo.nit}
                                            </span>
                                        </div>

                                        {/* Main two-column block */}
                                        <div className="grid grid-cols-2 divide-x">
                                            {/* Client info */}
                                            <div className="p-4 space-y-1">
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Datos del Cliente</p>
                                                <p className="font-bold text-sm">{trabajo.cliente.nombre}</p>
                                                {trabajo.cliente.documento && (
                                                    <p className="text-xs text-muted-foreground">NIT / C.C.: {trabajo.cliente.documento}</p>
                                                )}
                                                {trabajo.cliente.telefono && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {trabajo.cliente.telefono}
                                                    </p>
                                                )}
                                                {trabajo.cliente.correo && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {trabajo.cliente.correo}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Project info */}
                                            <div className="p-4 space-y-1">
                                                <p className="text-[10px] text-primary font-bold uppercase tracking-wider mb-2">Datos del Proyecto</p>
                                                <p className="font-bold text-sm">{trabajo.descripcionTrabajo || ''}</p>
                                                {direccionProyecto && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {direccionProyecto}
                                                    </p>
                                                )}
                                                <div className="flex gap-4 mt-1">
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Inicio</p>
                                                        <p className="text-xs font-medium">{fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-CO') : '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Fin Real</p>
                                                        <p className="text-xs font-medium">{fechaFinReal ? new Date(fechaFinReal).toLocaleDateString('es-CO') : '—'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase">Progreso</p>
                                                        <p className="text-xs font-medium">{progressPercent}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Análisis de Cantidades: Oferta vs. Final */}
                                    <div>
                                        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-blue-500" />
                                            Análisis de Cantidades — Oferta vs. Final
                                        </h3>
                                        <Card className="overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/40">
                                                        <TableHead className="text-xs py-2">Ítem</TableHead>
                                                        <TableHead className="text-center text-xs py-2">Tipo</TableHead>
                                                        <TableHead className="text-center text-xs py-2">Cant. Oferta</TableHead>
                                                        <TableHead className="text-center text-xs py-2">Cant. Final</TableHead>
                                                        <TableHead className="text-center text-xs py-2">Δ</TableHead>
                                                        <TableHead className="text-right text-xs py-2">V. Unit.</TableHead>
                                                        <TableHead className="text-right text-xs py-2">Δ Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.filter(i => !i.esExtra).map(item => {
                                                        const pVenta = item.valorUnitario || 0;
                                                        const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                                        const pUnit = pVenta + margen;
                                                        const cantFinal = cantidadesFinales[item.id] ?? item.cantidad;
                                                        const diff = cantFinal - item.cantidad;
                                                        const deltaValor = diff * pUnit;
                                                        return (
                                                            <TableRow key={item.id} className={diff !== 0 ? (diff > 0 ? 'bg-red-50/50 dark:bg-red-950/10' : 'bg-green-50/50 dark:bg-green-950/10') : ''}>
                                                                <TableCell className="text-xs py-2 font-medium">{item.descripcion}</TableCell>
                                                                <TableCell className="text-center py-2">
                                                                    <Badge variant="outline" className="text-[9px] py-0">{item.tipo === 'SERVICIO' ? '🔧 Serv.' : '📦 Mat.'}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center text-xs py-2 text-muted-foreground">{item.cantidad}</TableCell>
                                                                <TableCell className="text-center text-xs py-2 font-semibold">{cantFinal}</TableCell>
                                                                <TableCell className="text-center py-2">
                                                                    {diff === 0 ? (
                                                                        <span className="text-[10px] text-muted-foreground">—</span>
                                                                    ) : (
                                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'}`}>
                                                                            {diff > 0 ? '+' : ''}{diff}
                                                                        </span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right text-xs font-mono py-2">{formatCurrency(pUnit)}</TableCell>
                                                                <TableCell className={`text-right text-xs font-mono font-semibold py-2 ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                                    {diff !== 0 ? (diff > 0 ? '+' : '') + formatCurrency(deltaValor) : '—'}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </Card>
                                    </div>

                                    {/* Extras Section */}
                                    {items.filter(i => i.esExtra).length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                                                <Plus className="h-4 w-4 text-amber-500" />
                                                Ítems Adicionales / Extras
                                            </h3>
                                            <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-amber-50 dark:bg-amber-950/30">
                                                            <TableHead className="text-xs py-2">Ítem Extra</TableHead>
                                                            <TableHead className="text-center text-xs py-2">Cant.</TableHead>
                                                            <TableHead className="text-right text-xs py-2">V. Unit.</TableHead>
                                                            <TableHead className="text-right text-xs py-2">Total</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.filter(i => i.esExtra).map(extra => {
                                                            const pVenta = extra.valorUnitario || 0;
                                                            const margen = extra.porcentaje ? pVenta * (extra.porcentaje / 100) : 0;
                                                            const pUnit = pVenta + margen;
                                                            return (
                                                                <TableRow key={extra.id}>
                                                                    <TableCell className="text-xs py-2 font-medium text-amber-700 dark:text-amber-400">{extra.descripcion}</TableCell>
                                                                    <TableCell className="text-center text-xs py-2">{extra.cantidad}</TableCell>
                                                                    <TableCell className="text-right text-xs font-mono py-2">{formatCurrency(pUnit)}</TableCell>
                                                                    <TableCell className="text-right text-xs font-mono font-bold py-2 text-amber-600">
                                                                        +{formatCurrency(pUnit * extra.cantidad)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </Card>
                                        </div>
                                    )}

                                    {/* Financial Summary */}
                                    {(() => {
                                        const totalOriginal = items.filter(i => !i.esExtra).reduce((acc, item) => {
                                            const pVenta = item.valorUnitario || 0;
                                            const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                            return acc + (pVenta + margen) * item.cantidad;
                                        }, 0);
                                        const totalExtras = items.filter(i => i.esExtra).reduce((acc, item) => {
                                            const pVenta = item.valorUnitario || 0;
                                            const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                            return acc + (pVenta + margen) * item.cantidad;
                                        }, 0);
                                        const totalVariacion = items.filter(i => !i.esExtra).reduce((acc, item) => {
                                            const pVenta = item.valorUnitario || 0;
                                            const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                            const pUnit = pVenta + margen;
                                            const cantFinal = cantidadesFinales[item.id] ?? item.cantidad;
                                            return acc + (cantFinal - item.cantidad) * pUnit;
                                        }, 0);
                                        const totalFinal = totalOriginal + totalExtras + totalVariacion;

                                        return (
                                            <Card className="bg-muted/20">
                                                <CardContent className="p-4 space-y-2">
                                                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                                        <Receipt className="h-4 w-4 text-primary" /> Resumen Financiero
                                                    </h3>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Valor Oferta Original:</span>
                                                        <span className="font-mono font-medium">{formatCurrency(totalOriginal)}</span>
                                                    </div>
                                                    {totalVariacion !== 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Ajuste por Cantidades:</span>
                                                            <span className={`font-mono font-medium ${totalVariacion > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                {totalVariacion > 0 ? '+' : ''}{formatCurrency(totalVariacion)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {totalExtras > 0 && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground">Ítems Extras:</span>
                                                            <span className="font-mono font-medium text-amber-600">+{formatCurrency(totalExtras)}</span>
                                                        </div>
                                                    )}
                                                    <Separator className="my-1" />
                                                    <div className="flex justify-between text-base font-bold">
                                                        <span>Total a Cobrar:</span>
                                                        <span className="font-mono text-primary">{formatCurrency(totalFinal)}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })()}

                                    {/* Notas del Acta */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Observaciones del Acta</Label>
                                        <Textarea
                                            placeholder="Ingrese observaciones, firma o condiciones adicionales del acta..."
                                            className="min-h-[80px] text-sm"
                                            value={observacionesActa}
                                            onChange={e => setObservacionesActa(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </ScrollArea>
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowActa(false)}>Cerrar</Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => {
                                        try {
                                            const actaData: ActaData = {
                                                numero: trabajo.numero,
                                                descripcionTrabajo: trabajo.descripcionTrabajo || '',
                                                direccionProyecto: direccionProyecto || undefined,
                                                fechaInicio: fechaInicio || undefined,
                                                fechaFinReal: fechaFinReal || undefined,
                                                progreso: progressPercent,
                                                cliente: {
                                                    nombre: trabajo.cliente.nombre,
                                                    documento: trabajo.cliente.documento || undefined,
                                                    telefono: trabajo.cliente.telefono || undefined,
                                                    correo: trabajo.cliente.correo || undefined,
                                                    direccion: trabajo.cliente.direccion || undefined,
                                                },
                                                items: items.map(item => {
                                                    const pVenta = item.valorUnitario || 0;
                                                    const margen = item.porcentaje ? pVenta * (item.porcentaje / 100) : 0;
                                                    return {
                                                        descripcion: item.descripcion,
                                                        tipo: item.tipo,
                                                        cantOferta: item.cantidad,
                                                        cantFinal: cantidadesFinales[item.id] ?? item.cantidad,
                                                        valorUnitario: pVenta + margen,
                                                        esExtra: item.esExtra || false,
                                                    };
                                                })
                                            };
                                            generateActaPDF(actaData, companyInfo, observacionesActa || undefined);
                                            toast({ title: 'PDF Generado', description: 'El acta de ejecución se descargó correctamente.' });
                                        } catch (err) {
                                            console.error(err);
                                            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF del acta.' });
                                        }
                                    }}
                                >
                                    <Printer className="h-4 w-4" /> Descargar PDF
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

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
                        {/* Global Settings removed automatically since they are no longer in use */}

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-center w-20">Cant.</TableHead>
                                            <TableHead className="text-right w-32">Precio proveedor</TableHead>
                                            <TableHead className="text-center w-20">%</TableHead>
                                            <TableHead className="text-right w-32">Precio %</TableHead>
                                            <TableHead className="text-right w-32">Total</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest bg-muted/5">
                                                    No hay items agregados a esta cotización
                                                </TableCell>
                                            </TableRow>
                                        ) : items.map((item, index) => {
                                            // Calculations per item
                                            const cost = item.costoUnitario || 0; // P. Prov (for reference)
                                            const pVenta = item.valorUnitario || 0; // P. Venta - Base price

                                            // AIU represents the additional % on top of P. Venta
                                            const margen = pVenta * ((item.aiuUtilidadPorcentaje || 0) / 100);

                                            // Final Price
                                            const finalUnitTotal = pVenta + margen;
                                            const rowTotal = finalUnitTotal * item.cantidad;

                                            return (
                                                <React.Fragment key={item.id}>
                                                    <TableRow className={!item.visibleEnPdf ? 'opacity-50 bg-muted/30' : ''}>
                                                        <TableCell className="min-w-[200px]">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    {item.tipo === 'SERVICIO' ? <Wrench className="h-3 w-3 text-blue-500" /> : <Package className="h-3 w-3 text-green-500" />}
                                                                    <span className="font-medium text-xs">
                                                                        {item.descripcion}
                                                                        {item.esExtra && <Badge variant="secondary" className="ml-2 py-0 h-4 text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">EXTRA</Badge>}
                                                                    </span>
                                                                </div>
                                                                {/* Sub-item count badge & toggle */}
                                                                {item.subItems && item.subItems.length > 0 && (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1 py-0">
                                                                            {item.subItems.length} materiales
                                                                        </Badge>
                                                                        {item.tipo === 'SERVICIO' && (
                                                                            <div className="flex items-center gap-1 bg-muted/30 px-1 rounded-sm border border-muted-foreground/10">
                                                                                <CheckboxUI
                                                                                    id={`show-details-edit-${item.id}`}
                                                                                    checked={!item.ocultarDetalles}
                                                                                    onCheckedChange={(checked) => {
                                                                                        setItems(prev => prev.map((it, i) => i === index ? { ...it, ocultarDetalles: !checked } : it));
                                                                                    }}
                                                                                    className="h-3 w-3"
                                                                                />
                                                                                <Label
                                                                                    htmlFor={`show-details-edit-${item.id}`}
                                                                                    className="text-[9px] text-muted-foreground cursor-pointer flex items-center gap-1"
                                                                                >
                                                                                    {item.ocultarDetalles ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                                                                                    Mostrar materiales
                                                                                </Label>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Input
                                                                type="number"
                                                                value={item.cantidad}
                                                                onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                className="h-7 w-12 text-xs p-1 text-center mx-auto"
                                                                min={1}
                                                            />
                                                        </TableCell>
                                                        {/* P. Venta (Base) */}
                                                        <TableCell className="text-right p-1">
                                                            <Input
                                                                type="number"
                                                                value={item.valorUnitario === 0 ? '' : item.valorUnitario}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={(e) => {
                                                                    const newVal = parseFloat(e.target.value) || 0;
                                                                    setItems(prev => prev.map((it, i) => i === index ? { ...it, valorUnitario: newVal } : it));
                                                                }}
                                                                className="h-7 w-24 text-xs text-right p-1 font-semibold"
                                                            />
                                                        </TableCell>
                                                        {/* Percentage Input */}
                                                        <TableCell className="p-1">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    className="h-7 w-12 text-xs p-1 text-center font-bold text-primary bg-primary/5"
                                                                    value={item.porcentaje || 0}
                                                                    onFocus={(e) => e.target.select()}
                                                                    onChange={e => setItems(prev => prev.map((it, i) => i === index ? { ...it, porcentaje: parseFloat(e.target.value) || 0 } : it))}
                                                                />
                                                                <span className="text-[10px]">%</span>
                                                            </div>
                                                        </TableCell>
                                                        {/* Precio % (Calculated & Rounded) */}
                                                        <TableCell className="text-right text-xs font-mono">
                                                            {formatCurrency(Math.round(item.valorUnitario * (1 + (item.porcentaje || 0) / 100)))}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-xs font-mono">
                                                            {formatCurrency(Math.round(item.valorUnitario * (1 + (item.porcentaje || 0) / 100)) * item.cantidad)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleRemoveItem(item.id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {/* Subitems Materials View */}
                                                    {item.subItems && item.subItems.length > 0 && !item.ocultarDetalles && item.subItems.map((sub, sIdx) => (
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
                                                            <TableCell colSpan={3}></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>


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
                                                value={globalDiscountPct === 0 ? '' : globalDiscountPct}
                                                onFocus={(e) => e.target.select()}
                                                onChange={e => setGlobalDiscountPct(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                            <span className="text-xs ml-1">%</span>
                                        </div>
                                        <span className="font-mono text-red-500">-{formatCurrency(descuento)}</span>
                                    </div>
                                </div>
                                {descuento > 0 && (
                                    <div className="flex justify-between items-center text-sm font-semibold mt-1">
                                        <span>Subt. c/ descuento</span>
                                        <span className="font-mono text-primary">{formatCurrency(subtotal - descuento)}</span>
                                    </div>
                                )}
                                {/* We hide general IVA if AIU is checked since AIU uses IVA on Utility */}
                                {!esAiu && (
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-muted-foreground">IVA</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                <Input
                                                    type="number"
                                                    className="h-6 w-12 text-right text-xs p-1"
                                                    value={globalIvaPct === 0 ? '' : globalIvaPct}
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={e => setGlobalIvaPct(parseFloat(e.target.value) || 0)}
                                                    placeholder="19"
                                                />
                                                <span className="text-xs ml-1">%</span>
                                            </div>
                                            <span className="font-mono">{formatCurrency(iva)}</span>
                                        </div>
                                    </div>
                                )}
                                <Separator className="my-2" />

                                <div className="flex items-center space-x-2 py-1">
                                    <CheckboxUI
                                        id="es-aiu-history"
                                        checked={esAiu}
                                        onCheckedChange={(checked) => setEsAiu(!!checked)}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="es-aiu-history" className="text-xs cursor-pointer font-medium">
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
                                                    <Input type="number" className="h-6 text-[10px] p-1" value={aiuAdminPct === 0 ? '' : aiuAdminPct} onFocus={(e) => e.target.select()} onChange={e => {
                                                        const val = Number(e.target.value) || 0;
                                                        setAiuAdminPct(val);
                                                        updateGlobalAiu('ADMIN', val);
                                                    }} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px]">Impr. %</Label>
                                                    <Input type="number" className="h-6 text-[10px] p-1" value={aiuImprevPct === 0 ? '' : aiuImprevPct} onFocus={(e) => e.target.select()} onChange={e => {
                                                        const val = Number(e.target.value) || 0;
                                                        setAiuImprevPct(val);
                                                        updateGlobalAiu('IMPREV', val);
                                                    }} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[9px]">Util. %</Label>
                                                    <Input type="number" className="h-6 text-[10px] p-1" value={aiuUtilPct === 0 ? '' : aiuUtilPct} onFocus={(e) => e.target.select()} onChange={e => {
                                                        const val = Number(e.target.value) || 0;
                                                        setAiuUtilPct(val);
                                                        updateGlobalAiu('UTIL', val);
                                                    }} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-sm pt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground text-xs">IVA s/ Util.</span>
                                                    <div className="flex items-center">
                                                        <Input
                                                            type="number"
                                                            className="h-6 w-12 text-right text-xs p-1"
                                                            value={ivaUtilPct === 0 ? '' : ivaUtilPct}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={e => {
                                                                const val = Number(e.target.value) || 0;
                                                                setIvaUtilPct(val);
                                                                updateGlobalAiu('IVAUTIL', val);
                                                            }}
                                                            placeholder="19"
                                                        />
                                                        <span className="text-xs ml-1">%</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs">{formatCurrency(iva)}</span>
                                            </div>

                                            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t">
                                                <span>Total Amortización:</span>
                                                <span className="font-mono">{formatCurrency(totalAiuAdmin + totalAiuImprev + totalAiuUtil + iva)}</span>
                                            </div>
                                        </div>
                                        <Separator className="my-2" />
                                    </>
                                )}
                                {/* Additional breakdowns can be added here if necessary */}
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span className="font-mono text-primary">{formatCurrency(total)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PREVIEW & DESIGN TAB */}
                    <TabsContent value="preview" className="flex-1 overflow-y-auto mt-4">
                        <div className="flex flex-col md:flex-row gap-6 min-h-0">

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

                                        {materialVisibilityMode === 'MODO_PRIVADO' && (
                                            <div className="space-y-3 pt-2 pb-2 border-t mt-2">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold">Suministros:</Label>
                                                    <Input className="h-7 text-xs" value={privadoSuministros} onChange={e => setPrivadoSuministros(e.target.value)} placeholder="Ej: Materiales e insumos..." />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold">Instalación:</Label>
                                                    <Input className="h-7 text-xs" value={privadoInstalacion} onChange={e => setPrivadoInstalacion(e.target.value)} placeholder="Ej: Mano de obra..." />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-bold">Servicios:</Label>
                                                    <Input className="h-7 text-xs" value={privadoServicios} onChange={e => setPrivadoServicios(e.target.value)} placeholder="Ej: Transporte..." />
                                                </div>
                                            </div>
                                        )}

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
                                                const privadoOpts = materialVisibilityMode === 'MODO_PRIVADO' ? {
                                                    suministros: privadoSuministros,
                                                    instalacion: privadoInstalacion,
                                                    servicios: privadoServicios
                                                } : undefined;
                                                generateQuotePDF(previewQuote, materialVisibilityMode, companyInfo, currentStyle, 'save', trabajo.elaboradoPor || currentUser?.name, undefined, privadoOpts);
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
                                <QuotePreview
                                    quote={previewQuote}
                                    currentStyle={currentStyle}
                                    companyInfo={companyInfo}
                                    preparedByFallback={currentUser?.name}
                                    materialVisibilityMode={materialVisibilityMode}
                                    privadoOptions={{
                                        suministros: privadoSuministros,
                                        instalacion: privadoInstalacion,
                                        servicios: privadoServicios
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* DOCUMENTOS TAB */}
                    < TabsContent value="documentos" className="flex-1 overflow-auto mt-4" >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* DOCUMENTACIÓN LEGAL */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <FolderOpen className="h-5 w-5 text-blue-600" />
                                        Documentación Legal
                                    </CardTitle>
                                    <CardDescription>Contratos, permisos, certificaciones y documentos legales</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Upload zone */}
                                    <div
                                        onClick={() => !isUploadingDoc && docLegalInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isUploadingDoc
                                            ? 'border-muted-foreground/15 bg-muted/30 cursor-not-allowed'
                                            : 'border-muted-foreground/25 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                                            }`}
                                    >
                                        {isUploadingDoc ? (
                                            <>
                                                <Loader2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2 animate-spin" />
                                                <p className="text-sm font-medium text-muted-foreground">Subiendo...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                <p className="text-sm font-medium">Click para subir archivos</p>
                                                <p className="text-xs text-muted-foreground mt-1">PDF, imágenes, Word, Excel y más</p>
                                            </>
                                        )}
                                        <input
                                            ref={docLegalInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="*/*"
                                            multiple
                                            onChange={(e) => handleDocUpload(e, 'Documentacion')}
                                        />
                                    </div>

                                    {/* File list */}
                                    {isLoadingDocs ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-sm text-muted-foreground">Cargando documentos...</span>
                                        </div>
                                    ) : documentosLegales.length === 0 ? (
                                        <div className="text-center py-6">
                                            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground">No hay documentos legales cargados</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[220px]">
                                            <div className="space-y-2 pr-3">
                                                {documentosLegales.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
                                                        {getDocFileIcon(doc.name)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={doc.name.replace(/^\d+_/, '')}>
                                                                {doc.name.replace(/^\d+_/, '')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(doc.size)}
                                                                {doc.created_at && ` • ${format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDoc({ url: doc.url, name: doc.name.replace(/^\d+_/, '') })} title="Vista previa">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" title="Descargar">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.name, 'Documentacion')} title="Eliminar">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>

                            {/* PÓLIZAS Y SEGUROS */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                        Pólizas y Seguros
                                    </CardTitle>
                                    <CardDescription>Pólizas de cumplimiento, seguros y garantías</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Upload zone */}
                                    <div
                                        onClick={() => !isUploadingDoc && docPolizaInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isUploadingDoc
                                            ? 'border-muted-foreground/15 bg-muted/30 cursor-not-allowed'
                                            : 'border-muted-foreground/25 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                                            }`}
                                    >
                                        {isUploadingDoc ? (
                                            <>
                                                <Loader2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2 animate-spin" />
                                                <p className="text-sm font-medium text-muted-foreground">Subiendo...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                <p className="text-sm font-medium">Click para subir archivos</p>
                                                <p className="text-xs text-muted-foreground mt-1">PDF, imágenes, Word, Excel y más</p>
                                            </>
                                        )}
                                        <input
                                            ref={docPolizaInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="*/*"
                                            multiple
                                            onChange={(e) => handleDocUpload(e, 'Polizasyseguros')}
                                        />
                                    </div>

                                    {/* File list */}
                                    {isLoadingDocs ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-sm text-muted-foreground">Cargando documentos...</span>
                                        </div>
                                    ) : polizasSeguros.length === 0 ? (
                                        <div className="text-center py-6">
                                            <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground">No hay pólizas cargadas</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[220px]">
                                            <div className="space-y-2 pr-3">
                                                {polizasSeguros.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
                                                        {getDocFileIcon(doc.name)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={doc.name.replace(/^\d+_/, '')}>
                                                                {doc.name.replace(/^\d+_/, '')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(doc.size)}
                                                                {doc.created_at && ` • ${format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDoc({ url: doc.url, name: doc.name.replace(/^\d+_/, '') })} title="Vista previa">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" title="Descargar">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.name, 'Polizasyseguros')} title="Eliminar">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* ÓRDENES DE COMPRA (Third card below the other two, full width or adjust grid) */}
                        <div className="mt-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Banknote className="h-5 w-5 text-green-600" />
                                        Órdenes de Compra
                                    </CardTitle>
                                    <CardDescription>Documentos de aprobación formal y órdenes de compra enviadas por el cliente</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Upload zone */}
                                    <div
                                        onClick={() => !isUploadingDoc && docOrdenInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isUploadingDoc
                                            ? 'border-muted-foreground/15 bg-muted/30 cursor-not-allowed'
                                            : 'border-muted-foreground/25 hover:border-green-500/50 hover:bg-green-50/50 dark:hover:bg-green-950/20'
                                            }`}
                                    >
                                        {isUploadingDoc ? (
                                            <>
                                                <Loader2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2 animate-spin" />
                                                <p className="text-sm font-medium text-muted-foreground">Subiendo...</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                <p className="text-sm font-medium">Click para subir órdenes de compra</p>
                                                <p className="text-xs text-muted-foreground mt-1">PDF, imágenes, Word, Excel y más</p>
                                            </>
                                        )}
                                        <input
                                            ref={docOrdenInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="*/*"
                                            multiple
                                            onChange={(e) => handleDocUpload(e, 'OrdenesDeCompra')}
                                        />
                                    </div>

                                    {/* File list */}
                                    {isLoadingDocs ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            <span className="ml-2 text-sm text-muted-foreground">Cargando documentos...</span>
                                        </div>
                                    ) : ordenesCompra.length === 0 ? (
                                        <div className="text-center py-6">
                                            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                            <p className="text-sm text-muted-foreground">No hay órdenes de compra cargadas</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[220px]">
                                            <div className="space-y-2 pr-3">
                                                {ordenesCompra.map((doc, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/30 transition-colors group">
                                                        {getDocFileIcon(doc.name)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate" title={doc.name.replace(/^\d+_/, '')}>
                                                                {doc.name.replace(/^\d+_/, '')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatFileSize(doc.size)}
                                                                {doc.created_at && ` • ${format(new Date(doc.created_at), "dd MMM yyyy", { locale: es })}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDoc({ url: doc.url, name: doc.name.replace(/^\d+_/, '') })} title="Vista previa">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" title="Descargar">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.name, 'OrdenesDeCompra')} title="Eliminar">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* DOCUMENT PREVIEW DIALOG */}
                        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                            <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Eye className="h-5 w-5" />
                                        {previewDoc?.name || 'Vista previa'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        <Button variant="outline" size="sm" className="mt-1" asChild>
                                            <a href={previewDoc?.url} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4 mr-2" /> Descargar archivo
                                            </a>
                                        </Button>
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 rounded-lg overflow-hidden border bg-muted/30">
                                    {previewDoc && (() => {
                                        const ext = previewDoc.name.split('.').pop()?.toLowerCase() || '';
                                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                                        const isPdf = ext === 'pdf';

                                        if (isPdf) {
                                            return (
                                                <iframe
                                                    src={previewDoc.url}
                                                    className="w-full h-[70vh] border-0"
                                                    title={previewDoc.name}
                                                />
                                            );
                                        }
                                        if (isImage) {
                                            return (
                                                <div className="flex items-center justify-center h-[70vh] p-4">
                                                    <img
                                                        src={previewDoc.url}
                                                        alt={previewDoc.name}
                                                        className="max-w-full max-h-full object-contain rounded-lg"
                                                    />
                                                </div>
                                            );
                                        }
                                        // Other file types — show download message
                                        return (
                                            <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
                                                <FolderOpen className="h-16 w-16 text-muted-foreground/30" />
                                                <p className="text-muted-foreground">Vista previa no disponible para este tipo de archivo.</p>
                                                <Button asChild>
                                                    <a href={previewDoc.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 mr-2" /> Descargar para ver
                                                    </a>
                                                </Button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TabsContent >

                    {/* HISTORIAL TAB */}
                    < TabsContent value="historial" className="flex-1 overflow-auto mt-4" >
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
                    
                    {/* COMPRAS TAB */}
                    {trabajo.estado === 'APROBADA' && (
                        <TabsContent value="compras" className="flex-1 overflow-auto space-y-4 mt-4 p-1">
                            <GestionComprasPanel cotizacion={trabajo} />
                        </TabsContent>
                    )}
                </Tabs>
                
                {/* Product/Service Selector Dialog Global */}
                <ProductSelectorDialog
                    open={showAddItem}
                    onOpenChange={setShowAddItem}
                    onItemSelected={handleAddItem}
                    inventario={inventario}
                    codigosTrabajo={codigosTrabajo}
                    instalaciones={instalaciones}
                />
            </DialogContent>
        </Dialog>
    );
}

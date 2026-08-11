"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, MessageSquare, Send, CheckCircle2, MapPin, Calendar, Printer, Lock, ShieldAlert, Upload, Loader2, Eye, FileDigit, ArrowLeft } from "lucide-react";
import { Cotizacion, ComentarioCotizacion } from "@/types/sistema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useErp } from "@/components/providers/erp-provider";
import { getSecureCotizacionDocumentsAction, getPublicCotizacionAction, uploadPublicCotizacionDocumentAction } from "@/app/dashboard/sistema/cotizacion/actions";

interface ComercialInteractionPanelProps {
    cotizacionId: string;
    onBack?: () => void;
}

export function ComercialInteractionPanel({ cotizacionId, onBack }: ComercialInteractionPanelProps) {
    const { toast } = useToast();
    const { cotizaciones, updateCotizacion } = useErp();

    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [newComment, setNewComment] = useState("");

    // Instead of mock, we'll use the quote's embedded comments or start empty.
    const [comments, setComments] = useState<ComentarioCotizacion[]>([]);
    const [secureDocs, setSecureDocs] = useState<{ legalDocs: any[], polizas: any[], ordenesCompra: any[] } | null>(null);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    
    const docLegalInputRef = useRef<HTMLInputElement>(null);
    const docPolizaInputRef = useRef<HTMLInputElement>(null);
    const docOrdenCompraInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);
    const activeCotizacionIdRef = useRef<string | null>(null);

    // Initial load auto-scroll or when we forcibly want to scroll down (new message sent)
    useEffect(() => {
        if (shouldAutoScrollRef.current && messagesEndRef.current) {
            const viewport = messagesEndRef.current.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
            if (viewport) {
                viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
            } else {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [comments]);

    // Check if user is scrolled up
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        // In a flex-col-reverse or normal list, if we are near bottom:
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        // If they scroll up, stop auto-scrolling on new polls. If they go to bottom, re-enable.
        shouldAutoScrollRef.current = isNearBottom;
    };

    useEffect(() => {
        const fetchDocs = async (id: string, estado: string) => {
            if (estado !== 'APROBADA') {
                setSecureDocs(null);
                return;
            }
            setIsLoadingDocs(true);
            try {
                // The backend action checks for APROBADA state, we load what the client sees
                const docs = await getSecureCotizacionDocumentsAction(id);
                if (docs) {
                    setSecureDocs({ legalDocs: docs.legalDocs, polizas: docs.polizas, ordenesCompra: docs.ordenesCompra });
                }
            } catch (error) {
                console.error("Failed to load secure documents", error);
            } finally {
                setIsLoadingDocs(false);
            }
        };

        const found = cotizaciones.find(c => c.id === cotizacionId);
        if (found) {
            setQuote(found);

            // Load initial comments or reset when switching quotes
            if (activeCotizacionIdRef.current !== cotizacionId) {
                setComments(found.comentarios || []);
                shouldAutoScrollRef.current = true;
                activeCotizacionIdRef.current = cotizacionId;
            }

            // Load Docs if applicable
            fetchDocs(found.numero || found.id, found.estado);

            // Setup polling for live chat updates overriding global state lag
            const pollInterval = setInterval(async () => {
                try {
                    const freshQuote = await getPublicCotizacionAction(found.numero || found.id);
                    if (freshQuote && freshQuote.comentarios) {
                        // Only update state if length changed to prevent re-renders when reading static history
                        setComments(prev => {
                            if (freshQuote.comentarios!.length !== prev.length) {
                                return freshQuote.comentarios as ComentarioCotizacion[];
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    // Ignore poll errors silently
                }
            }, 3000); // 3 seconds polling

            return () => clearInterval(pollInterval);
        } else {
            setQuote(null);
            setSecureDocs(null);
        }
    }, [cotizacionId, cotizaciones]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'Documentacion' | 'Polizasyseguros' | 'OrdenesDeCompra') => {
        const file = e.target.files?.[0];
        if (!file || !quote) return;

        setIsUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Reusing the public action since it's perfectly safe for admin to use it too
            await uploadPublicCotizacionDocumentAction(quote.numero, category, formData);

            toast({
                title: "Archivo subido correctamente",
                description: "El documento se ha cargado a la cotización.",
            });

            // Reload the documents to show the newly uploaded one
            if (quote.id) {
                const docs = await getSecureCotizacionDocumentsAction(quote.numero || quote.id);
                if (docs) {
                    setSecureDocs({ legalDocs: docs.legalDocs, polizas: docs.polizas, ordenesCompra: docs.ordenesCompra });
                }
            }

        } catch (error: any) {
            console.error("Error uploading", error);
            toast({
                title: "Error al subir",
                description: error.message || "Ocurrió un error al subir el documento.",
                variant: "destructive"
            });
        } finally {
            setIsUploadingDoc(false);
            if (e.target) e.target.value = '';
        }
    };


    const handleSendComment = () => {
        if (!newComment.trim() || !quote) return;

        const newMsg: ComentarioCotizacion = {
            id: `new-${Date.now()}`,
            fecha: new Date(),
            autor: 'DMRE', // Autor is DMRE in this view
            mensaje: newComment,
            leido: true // Assuming we read our own messages immediately
        };

        const updatedComments = [...comments, newMsg];
        shouldAutoScrollRef.current = true; // Always scroll down on my own message
        setComments(updatedComments);

        // Persist to the quote object in the global state
        const updatedQuote = { ...quote, comentarios: updatedComments };
        updateCotizacion(updatedQuote);

        setNewComment("");
    };

    if (!quote) return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold">Seleccione una Oferta</h2>
            <p>Seleccione una cotización enviada o aprobada del panel lateral para interactuar.</p>
        </div>
    );

    return (
        <div className="flex flex-col space-y-4 md:space-y-6 max-w-5xl mx-auto h-full overflow-y-auto lg:overflow-hidden pb-2 pr-2">
            {/* Header Badge & Title min-h fixed to avoid layout shift */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div className="flex items-start gap-3">
                    {onBack && (
                        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden mt-0.5 shrink-0 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs font-mono">{quote.numero}</Badge>
                            <StatusBadge status={quote.estado} />
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-primary">{quote.descripcionTrabajo}</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" /> Creada el {format(quote.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse lg:grid lg:grid-cols-1 md:grid-cols-3 gap-6 flex-1 lg:overflow-hidden mt-2">
                {/* Main Content: Details */}
                <div className="lg:col-span-1 md:col-span-2 space-y-6 lg:overflow-y-auto pr-1 pb-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de la Oferta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Cliente</span>
                                    <span className="font-medium">{typeof quote.cliente === 'string' ? quote.cliente : quote.cliente?.nombre}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Tipo</span>
                                    <span className="font-medium">{quote.tipo === 'NORMAL' ? 'Normal' : 'Simplificada'}</span>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h3 className="font-semibold mb-3">Ítems Cotizados</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="p-3 font-medium">Descripción</th>
                                                <th className="p-3 font-medium text-right">Cant.</th>
                                                <th className="p-3 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {quote.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3">
                                                        <div className="font-medium">{item.descripcion}</div>
                                                        <div className="text-xs text-muted-foreground">{item.tipo}</div>
                                                    </td>
                                                    <td className="p-3 text-right">{item.cantidad}</td>
                                                    <td className="p-3 text-right">${item.valorTotal.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/20 font-medium">
                                            <tr>
                                                <td colSpan={2} className="p-3 text-right">Subtotal</td>
                                                <td className="p-3 text-right">${quote.subtotal.toLocaleString()}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2} className="p-3 text-right">IVA</td>
                                                <td className="p-3 text-right">${quote.iva.toLocaleString()}</td>
                                            </tr>
                                            <tr className="text-base border-t-2 border-primary/20">
                                                <td colSpan={2} className="p-3 text-right font-bold text-primary">Total</td>
                                                <td className="p-3 text-right font-bold text-primary">${quote.total.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documentos Compartidos */}
                    <Card className="border-emerald-500/30 bg-emerald-50/10 shadow-sm relative overflow-hidden">
                        <CardHeader className="pb-3 border-b border-emerald-500/10">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                                    <Lock className="h-4 w-4" />
                                    Documentos Confidenciales del Cliente
                                </CardTitle>
                                <CardDescription>
                                    Documentos y pólizas subidas por el cliente a través del portal. Sólo visible en cotizaciones APROBADAS.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {isLoadingDocs ? (
                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
                            ) : secureDocs ? (
                                <div className="space-y-6">
                                    {/* Legal Docs */}
                                    <div>
                                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
                                            <FileText className="h-4 w-4 text-emerald-600" /> Documentación Legal
                                        </h4>
                                        {secureDocs.legalDocs.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">El cliente aún no ha cargado documentos legales.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {secureDocs.legalDocs.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:border-emerald-500/40 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                                                                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="text-xs font-medium truncate">{doc.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" asChild>
                                                            <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" title="Ver Documento">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="bg-emerald-500/10" />

                                    {/* Polizas */}
                                    <div>
                                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
                                            <ShieldAlert className="h-4 w-4 text-emerald-600" /> Pólizas y Seguros
                                        </h4>
                                        {secureDocs.polizas.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">El cliente aún no ha cargado pólizas.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {secureDocs.polizas.map(doc => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:border-emerald-500/40 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                                                                <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="text-xs font-medium truncate">{doc.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" asChild>
                                                            <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" title="Ver Póliza">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="bg-emerald-500/10" />

                                    {/* Orden de Compra */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                                <FileText className="h-4 w-4 text-emerald-600" /> Órdenes de Compra
                                            </h4>
                                            <div>
                                                <input type="file" ref={docOrdenCompraInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'OrdenesDeCompra')} />
                                                <Button variant="outline" size="sm" onClick={() => docOrdenCompraInputRef.current?.click()} disabled={isUploadingDoc}>
                                                    {isUploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                    Subir O.C.
                                                </Button>
                                            </div>
                                        </div>
                                        {secureDocs.ordenesCompra?.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No se han cargado órdenes de compra.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {secureDocs.ordenesCompra?.map((doc: any) => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:border-emerald-500/40 transition-colors">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                                                                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            <div className="truncate">
                                                                <p className="text-xs font-medium truncate">{doc.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">{doc.size}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" asChild>
                                                            <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" title="Ver Orden de Compra">
                                                                <Eye className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic text-center py-4">
                                    Esta sección se activará automáticamente cuando la cotización sea APROBADA y el cliente suba la documentación aprobatoria.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar: Chat */}
                <div className="space-y-6 flex flex-col h-[500px] lg:h-full lg:overflow-hidden shrink-0">
                    <Card className="flex flex-col flex-1 border-primary/20 shadow-md min-h-[400px]">
                        <CardHeader className="py-4 border-b bg-primary/5">
                            <CardTitle className="text-base flex items-center gap-2 text-primary">
                                <MessageSquare className="h-5 w-5" /> Chat con el Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <ScrollArea className="h-full p-4 flex flex-col-reverse" onScrollCapture={handleScroll}>
                                <div className="space-y-4 flex flex-col justify-end min-h-full">
                                    <div className="flex justify-center mt-2">
                                        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
                                            Inicio del chat de cotización
                                        </span>
                                    </div>
                                    {comments.map((comment) => (
                                        <div key={comment.id} className={`flex flex-col max-w-[90%] ${comment.autor === 'DMRE' ? 'self-end items-end ml-auto' : 'items-start mr-auto'}`}>
                                            <span className="text-[10px] font-semibold text-muted-foreground mb-1 ml-1 mr-1">
                                                {comment.autor}
                                            </span>
                                            <div className={`p-3 text-sm shadow-sm ${comment.autor === 'DMRE'
                                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm'
                                                : 'bg-muted rounded-2xl rounded-tl-sm border'
                                                }`}>
                                                {comment.mensaje}
                                            </div>
                                            <span className="text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                                                {format(new Date(comment.fecha), 'dd MMM HH:mm', { locale: es })}
                                                {comment.autor === 'DMRE' && (
                                                    <CheckCircle2 className={`h-3 w-3 ${comment.leido ? 'text-primary' : 'text-muted-foreground/40'}`} />
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-3 border-t bg-muted/10">
                            <div className="flex w-full gap-2 relative">
                                <Input
                                    placeholder="Responder al cliente..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                    className="pr-10 bg-background"
                                />
                                <Button size="icon" onClick={handleSendComment} className="absolute right-1 top-1 h-8 w-8 rounded-full" disabled={!newComment.trim()}>
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'APROBADA': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Aprobada</Badge>;
        case 'RECHAZADA': return <Badge variant="destructive">Rechazada</Badge>;
        case 'ENVIADA': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Enviada</Badge>;
        case 'EN_REVISION': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">En Revisión</Badge>;
        case 'MODIFICACION': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Modificación</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

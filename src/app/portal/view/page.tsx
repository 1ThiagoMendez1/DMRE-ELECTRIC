"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, MessageSquare, Send, CheckCircle2, Clock, MapPin, Calendar, ArrowLeft, Printer, Lock, ShieldAlert, Upload, Loader2, Eye } from "lucide-react";
import { getPublicCotizacionAction, getSecureCotizacionDocumentsAction, uploadPublicCotizacionDocumentAction, addPublicCotizacionCommentAction } from "@/app/dashboard/sistema/cotizacion/actions";
import { Cotizacion, ComentarioCotizacion } from "@/types/sistema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { QuotePreview } from "@/components/erp/quote-preview";
import { generateQuotePDF, COMPANY_INFO } from "@/utils/pdf-generator";
import { getStyleById } from "@/utils/pdf-styles";

// Mock comments keep for backwards compatibility with COT-001
const initialComments: Record<string, ComentarioCotizacion[]> = {
    'COT-001': [
        { id: 'c1', fecha: new Date(2024, 6, 22), autor: 'DMRE', mensaje: 'Adjuntamos la cotización solicitada. Quedamos atentos.', leido: true },
        { id: 'c2', fecha: new Date(2024, 6, 23), autor: 'Cliente', mensaje: 'Gracias. ¿Es posible ajustar el tiempo de entrega?', leido: true },
    ]
};

function PortalViewContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const { toast } = useToast();

    const [quote, setQuote] = useState<Cotizacion | null>(null);
    const [comments, setComments] = useState<ComentarioCotizacion[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [secureDocs, setSecureDocs] = useState<{ legalDocs: any[], polizas: any[] } | null>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);

    const docLegalInputRef = useRef<HTMLInputElement>(null);
    const docPolizaInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);

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

    const loadSecureDocs = async (quoteId: string) => {
        const docs = await getSecureCotizacionDocumentsAction(quoteId);
        if (docs) {
            setSecureDocs({ legalDocs: docs.legalDocs, polizas: docs.polizas });
        }
    };

    useEffect(() => {
        let isFirstLoad = true;
        async function fetchQuote() {
            if (id) {
                try {
                    const found = await getPublicCotizacionAction(id);
                    if (found) {
                        setQuote(found);

                        if (found.comentarios && found.comentarios.length > 0) {
                            if (comments.length === 0) { // Initial load only
                                setComments(found.comentarios);
                                shouldAutoScrollRef.current = true;
                            }
                        } else if (comments.length === 0) {
                            setComments(initialComments[found.numero] || []); // Mock comments support
                            shouldAutoScrollRef.current = true;
                        }

                        if (isFirstLoad && ['APROBADA'].includes(found.estado)) {
                            await loadSecureDocs(id);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load quote", e);
                }
            }
            if (isFirstLoad) {
                setLoading(false);
                isFirstLoad = false;
            }
        }

        // Initial fetch
        fetchQuote();

        // Setup polling every 4 seconds
        const pollInterval = setInterval(async () => {
            if (id) {
                try {
                    const freshQuote = await getPublicCotizacionAction(id);
                    if (freshQuote && freshQuote.comentarios) {
                        setComments(prev => {
                            if (freshQuote.comentarios!.length > prev.length) {
                                return freshQuote.comentarios as ComentarioCotizacion[];
                            }
                            return prev;
                        });
                    }
                } catch (e) { }
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: 'Documentacion' | 'Polizasyseguros') => {
        const file = e.target.files?.[0];
        if (!file || !quote) return;

        setIsUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            await uploadPublicCotizacionDocumentAction(quote.numero, category, formData);

            toast({
                title: "Archivo subido correctamente",
                description: "El documento se ha compartido de manera segura con DMRE.",
            });

            // Reload the documents to show the newly uploaded one
            if (id) await loadSecureDocs(id);

        } catch (error: any) {
            console.error("Error uploading from portal", error);
            toast({
                title: "Error al subir",
                description: error.message || "Ocurrió un error al subir su documento.",
                variant: "destructive"
            });
        } finally {
            setIsUploadingDoc(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !quote) return;

        const newMsg: ComentarioCotizacion = {
            id: `new-${Date.now()}`,
            fecha: new Date(),
            autor: 'Cliente',
            mensaje: newComment,
            leido: false
        };

        const updatedComments = [...comments, newMsg];
        shouldAutoScrollRef.current = true; // Always scroll down on my own message
        setComments(updatedComments);
        setNewComment("");

        try {
            await addPublicCotizacionCommentAction(quote.numero, newMsg);
        } catch (error) {
            console.error("Failed to save comment:", error);
            // Revert state if we want strictness, but here we just warn
            toast({ title: "Error", description: "No se pudo guardar el mensaje.", variant: "destructive" });
        }
    };

    const handleDownloadPDF = async () => {
        if (!quote) return;
        toast({ title: "Descargando PDF", description: "Generando documento oficial..." });
        try {
            const officialStyle = getStyleById('official_dmre');
            const visibilityMode = quote.opcionesPdf?.visibilityMode || 'MOSTRAR_TODO';
            const privadoOptions = visibilityMode === 'MODO_PRIVADO' ? {
                suministros: quote.opcionesPdf?.privadoSuministros || '',
                instalacion: quote.opcionesPdf?.privadoInstalacion || '',
                servicios: quote.opcionesPdf?.privadoServicios || ''
            } : undefined;

            // Signature: cotizacion, materialVisibilityMode, companyInfo, selectedStyle, action, preparedBy, watermarkText, privadoOptions
            await generateQuotePDF(
                quote,
                visibilityMode,
                COMPANY_INFO,
                officialStyle,
                'save',
                quote.elaboradoPor || 'D.M.R.E',
                'D.M.R.E', // Watermark text
                privadoOptions
            );
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
        }
    };

    if (loading) return <div className="flex items-center justify-center p-12">Cargando información...</div>;

    if (!quote) return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
            <h2 className="text-2xl font-bold text-muted-foreground">Cotización No Encontrada</h2>
            <p className="mb-4">No se pudo cargar la información solicitada.</p>
            <Button asChild><Link href="/portal">Regresar</Link></Button>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <Link href="/portal" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4">
                <ArrowLeft className="h-4 w-4" /> Volver a consulta
            </Link>

            {/* Header Badge & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">{quote.numero}</Badge>
                        <StatusBadge status={quote.estado} />
                    </div>
                    <h1 className="text-3xl font-bold text-primary text-glow-primary">{quote.descripcionTrabajo}</h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" /> Solicitado el {format(quote.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                    <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4" /> Válida hasta el {format(quote.fechaValidez ? new Date(quote.fechaValidez) : new Date(new Date(quote.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" /> Descargar PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden">
                        <QuotePreview
                            quote={quote}
                            currentStyle={getStyleById('official_dmre')}
                            companyInfo={COMPANY_INFO}
                            preparedByFallback="D.M.R.E"
                            materialVisibilityMode={quote.opcionesPdf?.visibilityMode || 'MOSTRAR_TODO'}
                            privadoOptions={{
                                suministros: quote.opcionesPdf?.privadoSuministros || '',
                                instalacion: quote.opcionesPdf?.privadoInstalacion || '',
                                servicios: quote.opcionesPdf?.privadoServicios || ''
                            }}
                        />
                    </Card>

                    {/* Secure Documents Section (Conditionally Rendered based on State AND Backend verification) */}
                    {secureDocs && (
                        <Card className="border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <ShieldAlert className="w-32 h-32" />
                            </div>
                            <CardHeader className="pb-3 border-b border-emerald-500/10">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                                        <Lock className="h-4 w-4" />
                                        Documentación Confidencial Encriptada
                                    </CardTitle>
                                    <CardDescription className="text-emerald-700/70 dark:text-emerald-500/70">
                                        Documentación de carácter legal y pólizas, accesibles únicamente bajo una conexión segura aprobada.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6 relative z-10">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                            <FileText className="h-4 w-4 text-emerald-600" /> Documentación Legal
                                        </h4>
                                        <div>
                                            <input type="file" ref={docLegalInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'Documentacion')} />
                                            <Button variant="outline" size="sm" onClick={() => docLegalInputRef.current?.click()} disabled={isUploadingDoc}>
                                                {isUploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                Subir Documento
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {secureDocs.legalDocs.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:border-emerald-500/40 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                                                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium truncate">{doc.name}</p>
                                                        <p className="text-xs text-muted-foreground">{doc.size} • Verificado DMRE</p>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="shrink-0" asChild>
                                                    <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" title="Ver Documento">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-emerald-500/10" />

                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                            <ShieldAlert className="h-4 w-4 text-emerald-600" /> Pólizas y Seguros
                                        </h4>
                                        <div>
                                            <input type="file" ref={docPolizaInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'Polizasyseguros')} />
                                            <Button variant="outline" size="sm" onClick={() => docPolizaInputRef.current?.click()} disabled={isUploadingDoc}>
                                                {isUploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                Subir Póliza
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {secureDocs.polizas.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-background hover:border-emerald-500/40 transition-colors">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded">
                                                        <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium truncate">{doc.name}</p>
                                                        <p className="text-xs text-muted-foreground">{doc.size} • Verificado DMRE</p>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="shrink-0" asChild>
                                                    <a href={doc.secureUrl} target="_blank" rel="noopener noreferrer" title="Ver Póliza">
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Chat */}
                <div className="space-y-6">
                    <Card className="flex flex-col h-[500px]">
                        <CardHeader className="py-4 border-b bg-muted/20">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Comunicación
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <ScrollArea className="h-full p-4" onScrollCapture={handleScroll}>
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                                            Inicio de la conversación
                                        </span>
                                    </div>
                                    {comments.map((comment) => (
                                        <div key={comment.id} className={`flex flex-col max-w-[90%] ${comment.autor === 'Cliente' ? 'self-end items-end ml-auto' : 'items-start mr-auto'}`}>
                                            <div className={`p-3 rounded-2xl text-sm ${comment.autor === 'Cliente' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                                                {comment.mensaje}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                {format(comment.fecha, 'dd MMM HH:mm', { locale: es })}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </ScrollArea>
                        </CardContent>
                        <CardFooter className="p-2 border-t bg-background">
                            <div className="flex w-full gap-2">
                                <Input
                                    placeholder="Escriba un mensaje..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                    className="focus-visible:ring-1"
                                />
                                <Button size="icon" onClick={handleSendComment}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-primary">Garantía D.M.R.E</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    Todos nuestros servicios incluyen póliza de cumplimiento y soporte técnico post-instalación por 12 meses.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Suspense Wrapper for useSearchParams
export default function PortalViewPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
            <PortalViewContent />
        </Suspense>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'APROBADA': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Aprobada</Badge>;
        case 'RECHAZADA': return <Badge variant="destructive">Rechazada</Badge>;
        case 'EN_REVISION': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">En Revisión</Badge>;
        case 'MODIFICACION': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Modificación</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}

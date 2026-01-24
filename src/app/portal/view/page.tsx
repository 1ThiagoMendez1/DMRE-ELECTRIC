"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, MessageSquare, Send, CheckCircle2, Clock, MapPin, Calendar, ArrowLeft, Printer } from "lucide-react";
import { initialQuotes } from "@/lib/mock-data";
import { Cotizacion, ComentarioCotizacion } from "@/types/sistema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

// Mock comments
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

    useEffect(() => {
        // Simulate fetch
        if (id) {
            const found = initialQuotes.find(q => q.id === id);
            if (found) {
                setQuote(found);
                setComments(initialComments[found.numero] || []); // Use Numero for reliable mock key match if ID varies
            }
        }
        setLoading(false);
    }, [id]);

    const handleSendComment = () => {
        if (!newComment.trim()) return;

        const newMsg: ComentarioCotizacion = {
            id: `new-${Date.now()}`,
            fecha: new Date(),
            autor: 'Cliente',
            mensaje: newComment,
            leido: false
        };

        setComments([...comments, newMsg]);
        setNewComment("");

        toast({ title: "Mensaje Enviado", description: "Su comentario ha sido registrado." });
    };

    const handleDownloadPDF = () => {
        toast({ title: "Descargando PDF", description: "Generando documento oficial..." });
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
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" /> Descargar PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Cliente</span>
                                    <span className="font-medium">{typeof quote.cliente === 'string' ? quote.cliente : quote.cliente?.nombre}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Ubicación</span>
                                    <span className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> Bogotá, Chapinero (Simulado)</span>
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
                                                <td colSpan={2} className="p-3 text-right">IVA (19%)</td>
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
                            <ScrollArea className="h-full p-4">
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
        case 'PENDIENTE': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Pendiente</Badge>;
        case 'NO_APROBADA': return <Badge variant="destructive">Rechazada</Badge>;
        case 'EN_EJECUCION': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">En Ejecución</Badge>;
        case 'FINALIZADA': return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">Finalizada</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClients, mockQuotes } from "@/lib/data";
import { ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function QuoteDetailsPage({ params }: { params: { id: string }}) {
    const quote = mockQuotes.find(q => q.id === params.id);
    const client = mockClients.find(c => c.name === quote?.client);

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="text-2xl font-bold text-destructive">Cotización no encontrada</h1>
                <p className="text-muted-foreground">La cotización que buscas no existe o ha sido eliminada.</p>
                 <Button variant="outline" asChild className="mt-4">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2" />
                        Volver al inicio
                    </Link>
                </Button>
            </div>
        )
    }

    const subtotal = quote.total / 1.19;
    const iva = quote.total - subtotal;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Detalle de Cotización: {quote.id}</h1>
                    <p className="text-muted-foreground">Resumen de la oferta generada.</p>
                </div>
            </div>

            <Card className="border-border/50">
                <CardHeader className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <CardTitle>Cliente: {quote.client}</CardTitle>
                        {client && (
                            <CardDescription className="space-y-1 mt-2">
                                <p><strong>Documento:</strong> {client.document}</p>
                                <p><strong>Dirección:</strong> {client.address}</p>
                                <p><strong>Contacto:</strong> {client.email} - {client.phone}</p>
                            </CardDescription>
                        )}
                    </div>
                    <div className="text-left md:text-right">
                        <p><strong>N° Oferta:</strong> {quote.id}</p>
                        <p><strong>Fecha:</strong> {new Date(quote.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Estado:</strong> {quote.status}</p>
                    </div>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[100px]">Cantidad</TableHead>
                                <TableHead className="w-[150px] text-right">Valor Unit.</TableHead>
                                <TableHead className="w-[150px] text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Los items se deben cargar dinámicamente aquí en un futuro */}
                            <TableRow className="font-bold bg-secondary/20">
                                <TableCell colSpan={5}>Punto de red certificado</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Mano de Obra</TableCell>
                                <TableCell className="text-center">1</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(80000)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(80000)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Cable UTP Cat 6A</TableCell>
                                <TableCell className="text-center">25</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(3000)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(75000)}</TableCell>
                            </TableRow>
                             <TableRow className="font-bold bg-secondary/20">
                                <TableCell colSpan={5}>Instalación de tablero de distribución</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>Mano de Obra</TableCell>
                                <TableCell className="text-center">1</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(250000)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(250000)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex flex-col items-end gap-2 p-6">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>IVA (19%)</span>
                            <span className="font-mono">{formatCurrency(iva)}</span>
                        </div>
                         <Separator />
                        <div className="flex justify-between text-lg font-bold text-primary">
                            <span>TOTAL</span>
                            <span className="font-mono">{formatCurrency(quote.total)}</span>
                        </div>
                    </div>
                     <Button size="lg" variant="outline" className="w-full max-w-sm mt-4 electric-button">
                        <FileDown />
                        Exportar a PDF
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

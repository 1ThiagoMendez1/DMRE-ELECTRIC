"use client";

import { useState } from "react";
import { Cotizador } from "./cotizador";
import { initialClients, initialInventory, initialQuotes } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateES } from "@/lib/utils";
import { FilePlus, Search, Filter, Edit, Trash2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Cotizacion } from "@/types/sistema";
import { generateQuotePDF } from "@/utils/pdf-generator";

export default function CotizacionPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [quotes, setQuotes] = useState<Cotizacion[]>(initialQuotes);
    const [selectedQuote, setSelectedQuote] = useState<Cotizacion | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const handleOpenNew = () => {
        setSelectedQuote(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (quote: Cotizacion) => {
        setSelectedQuote(quote);
        setIsModalOpen(true);
    };

    const filteredQuotes = quotes.filter(q =>
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedQuotes = filteredQuotes.slice((currentPage - 1) * 10, currentPage * 10);

    return (
        <div className="space-y-6">
            {/* Header Unificado */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Cotizaciones</h1>
                    <p className="text-muted-foreground">Gestiona y crea nuevas ofertas comerciales.</p>
                </div>
                <Button size="lg" className="electric-button font-bold text-lg px-8" onClick={handleOpenNew}>
                    <FilePlus className="mr-2 h-5 w-5" />
                    Crear Cotización
                </Button>
            </div>

            {/* Filters & Actions */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por cliente o ID..."
                        className="pl-9 bg-background/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Table Card */}
            <Card className="border-border/50">
                <CardHeader className="py-4">
                    <CardTitle className="text-lg">Historial de Ofertas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] pl-6">ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right pr-4">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedQuotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No se encontraron cotizaciones.
                                    </TableCell>
                                </TableRow>
                            ) : paginatedQuotes.map((quote) => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium pl-6">{quote.id}</TableCell>
                                    <TableCell>{formatDateES(quote.fecha)}</TableCell>
                                    <TableCell className="font-medium">{quote.cliente.nombre}</TableCell>
                                    <TableCell>{quote.items.length} items</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn({
                                                "border-green-500 text-green-500 bg-green-500/10": quote.estado === 'APROBADA',
                                                "border-yellow-500 text-yellow-500 bg-yellow-500/10": quote.estado === 'ENVIADA',
                                                "border-muted text-muted-foreground": quote.estado === 'BORRADOR',
                                                "border-red-500 text-red-500 bg-red-500/10": quote.estado === 'RECHAZADA'
                                            })}
                                        >
                                            {quote.estado}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(quote.total)}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => generateQuotePDF(quote)} title="Descargar PDF">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(quote)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => {
                                                if (confirm("¿Estás seguro de eliminar esta cotización?")) {
                                                    setQuotes(quotes.filter(q => q.id !== quote.id));
                                                }
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                {/* Pagination Controls */}
                <div className="flex items-center justify-end space-x-2 p-4 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {Math.ceil(filteredQuotes.length / 10) || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredQuotes.length / 10), p + 1))}
                        disabled={currentPage >= Math.ceil(filteredQuotes.length / 10)}
                    >
                        Siguiente
                    </Button>
                </div>
            </Card>

            {/* Modal de Cotizador */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl">
                    <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                        <div>
                            <h2 className="text-lg font-bold font-headline flex items-center gap-2">
                                <FilePlus className="h-5 w-5 text-primary" />
                                {selectedQuote ? `Editar Cotización ${selectedQuote.id}` : "Nueva Cotización"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedQuote ? "Modifica los detalles de la oferta." : "Agrega items y selecciona un cliente."}
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-6">
                        <Cotizador
                            clientes={initialClients}
                            inventario={initialInventory}
                            initialData={selectedQuote}
                            onClose={() => setIsModalOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

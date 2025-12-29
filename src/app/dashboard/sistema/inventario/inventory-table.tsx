"use client";

import React, { useState } from "react";
import { InventarioItem, Material } from "@/types/sistema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, Search, ChevronDown, ChevronRight, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

import { formatDateES } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { InventoryFormDialog } from "@/components/erp/inventory-form-dialog";
import { RegisterInventoryMovementDialog } from "@/components/erp/register-inventory-movement-dialog";
import { Cotizacion } from "@/types/sistema";

interface InventoryTableProps {
    data: InventarioItem[];
    cotizaciones?: Cotizacion[];
}

export function InventoryTable({ data: initialData, cotizaciones = [] }: InventoryTableProps) {
    const [data, setData] = useState<InventarioItem[]>(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<InventarioItem>>({});

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = data.filter((item) =>
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.toLowerCase().includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleAddNew = () => {
        setCurrentItem({
            tipo: 'SIMPLE',
            unidad: 'Unidad',
            cantidad: 0,
            valorUnitario: 0,
            fechaCreacion: new Date()
        });
        setIsDialogOpen(true);
    };

    const handleRegisterMovement = (mov: any) => {
        // Logic to update inventory based on movement
        const itemIndex = data.findIndex(i => i.id === mov.articuloId);
        if (itemIndex > -1) {
            const updatedItems = [...data];
            const item = { ...updatedItems[itemIndex] };

            if (mov.tipo === 'ENTRADA') {
                item.cantidad += mov.cantidad;
            } else {
                item.cantidad -= mov.cantidad;
            }
            updatedItems[itemIndex] = item;
            setData(updatedItems);
        }
    };

    const handleEdit = (item: InventarioItem) => {
        setCurrentItem({ ...item });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar este item?")) {
            setData(data.filter((item) => item.id !== id));
        }
    };

    const handleSave = (item: InventarioItem) => {
        if (item.id && data.some(i => i.id === item.id)) {
            // Update
            setData(data.map(i => i.id === item.id ? item : i));
        } else {
            // Create
            const newItem = {
                ...item,
                id: item.id || `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                fechaCreacion: new Date()
            } as InventarioItem;
            setData([newItem, ...data]);
        }
        setIsDialogOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descripción o código..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-9 bg-background/50"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <RegisterInventoryMovementDialog articulos={data} onMovementCreated={handleRegisterMovement} />
                    <Button onClick={handleAddNew} className="electric-button font-bold flex-1 sm:flex-none">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Item
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] pl-4"></TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead>Cant.</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor Unit.</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right pr-4">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => (
                                <React.Fragment key={item.id}>
                                    <TableRow key={item.id} className={expandedRows.has(item.id) ? "bg-muted/50" : ""}>
                                        <TableCell className="pl-4">
                                            {item.tipo === 'COMPUESTO' && (
                                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleRow(item.id)}>
                                                    {expandedRows.has(item.id) ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDateES(item.fechaCreacion)}
                                        </TableCell>
                                        <TableCell className="font-medium">{item.item}</TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={item.descripcion}>{item.descripcion}</TableCell>
                                        <TableCell>{item.unidad}</TableCell>
                                        <TableCell className="text-center">
                                            {(() => {
                                                // Calculate Reserved Stock from Quotes
                                                const reserved = cotizaciones
                                                    .filter(c => c.estado !== 'NO_APROBADA' && c.estado !== 'RECHAZADA' && c.estado !== 'BORRADOR') // Descontar si está en proceso
                                                    .flatMap(c => c.items)
                                                    .filter(quoteItem => quoteItem.inventarioId === item.id)
                                                    .reduce((sum, quoteItem) => sum + quoteItem.cantidad, 0);

                                                const available = item.cantidad - reserved;

                                                return (
                                                    <div className="flex flex-col items-center">
                                                        <span className={available < 0 ? "text-red-600 font-bold" : "font-medium"}>
                                                            {available} {item.unidad}
                                                        </span>
                                                        {reserved > 0 && (
                                                            <span className="text-[10px] text-muted-foreground" title="Reservado en cotizaciones">
                                                                (Físico: {item.cantidad})
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.tipo === 'SIMPLE' ? 'secondary' : 'default'} className="text-[10px]">
                                                {item.tipo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.valorUnitario)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.valorTotal)}
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {/* Expanded Row for Combined Items */}
                                    {expandedRows.has(item.id) && item.materiales && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="p-0">
                                                <div className="bg-muted/30 p-4 border-b shadow-inner">
                                                    <h4 className="mb-3 text-sm font-semibold flex items-center text-primary">
                                                        <Box className="mr-2 h-4 w-4" /> Materiales Compuestos
                                                    </h4>
                                                    <div className="rounded-md border bg-background">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead className="pl-4">Descripción Material</TableHead>
                                                                    <TableHead>Unidad</TableHead>
                                                                    <TableHead>Cant.</TableHead>
                                                                    <TableHead className="text-right">Vr. Unit</TableHead>
                                                                    <TableHead className="text-right pr-4">Total</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {item.materiales.map((mat) => (
                                                                    <TableRow key={mat.id}>
                                                                        <TableCell className="pl-4">{mat.descripcion}</TableCell>
                                                                        <TableCell>{mat.unidad}</TableCell>
                                                                        <TableCell>{mat.cantidad}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mat.valorUnitario)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-4">
                                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mat.valorTotal)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    Siguiente
                </Button>
            </div>



            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>Anterior</Button>
                <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages || 1}</div>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
            </div>

            <InventoryFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={currentItem}
                onSave={handleSave}
                availableItems={data}
            />
        </div>
    );
}

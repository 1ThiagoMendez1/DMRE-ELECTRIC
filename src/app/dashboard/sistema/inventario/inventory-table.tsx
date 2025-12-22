"use client";

import { useState } from "react";
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
} from "@/components/ui/dialog";

interface InventoryTableProps {
    data: InventarioItem[];
}

export function InventoryTable({ data: initialData }: InventoryTableProps) {
    const [data, setData] = useState<InventarioItem[]>(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const filteredData = data.filter((item) =>
        item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.toLowerCase().includes(searchTerm)
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por descripción o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background/50"
                    />
                </div>
                <Button className="electric-button font-bold w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Item
                </Button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] pl-4"></TableHead>
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
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <>
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
                                        <TableCell className="font-medium">{item.item}</TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={item.descripcion}>{item.descripcion}</TableCell>
                                        <TableCell>{item.unidad}</TableCell>
                                        <TableCell>{item.cantidad}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.tipo === 'SIMPLE' ? 'secondary' : 'default'} className="text-[10px]">
                                                {item.tipo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.valorUnitario)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.valorTotal)}
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="ghost" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    {/* Expanded Row for Combined Items */}
                                    {expandedRows.has(item.id) && item.materiales && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="p-0">
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
                                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(mat.valorUnitario)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-4">
                                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(mat.valorTotal)}
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
                                </>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useErp } from "@/components/providers/erp-provider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MoreHorizontal, FileText, Trash2, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Placeholder for Dialogs we will create next
import { CreateWorkCodeDialog } from "./create-work-code-dialog";
import { EditWorkCodeDialog } from "./edit-work-code-dialog";
import { WorkCodeDetailDialog } from "./work-code-detail-dialog";
import { EditInventoryItemDialog } from "@/components/erp/edit-inventory-item-dialog";

export function WorkCodesTable() {
    const { codigosTrabajo, addCodigoTrabajo, deleteCodigoTrabajo, inventario, deleteInventarioItem, updateInventarioItem } = useErp();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCode, setSelectedCode] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editCode, setEditCode] = useState<any>(null);
    const [editInventarioItem, setEditInventarioItem] = useState<any>(null);

    const ITEMS_PER_PAGE = 50;
    const [currentPage, setCurrentPage] = useState(1);

    const extractSuCode = (item: any) => {
        let raw = (item.codigo || item.sku || item.item || '').toUpperCase().trim();
        if (raw.startsWith('SU')) return raw;
        const match = (item.descripcion || '').toUpperCase().match(/SU-?\s*\d+/);
        if (match) return match[0].replace(/\s+/g, '');
        return '';
    };

    const combinedCodes = [
        ...codigosTrabajo.filter(c => extractSuCode(c) !== '').map(c => ({ ...c, codigo: extractSuCode(c), isInventario: false, originalItem: c })),
        ...inventario.filter(i => extractSuCode(i) !== '').map(i => ({
            id: i.id,
            codigo: extractSuCode(i),
            descripcion: i.descripcion,
            materiales: i.tipo === 'COMPUESTO' && i.materiales ? i.materiales : [],
            costoTotal: i.valorUnitario || i.precioProveedor || i.costoMateriales || 0,
            isInventario: true,
            originalItem: i
        }))
    ].sort((a, b) => {
        const numA = parseInt((a.codigo || '').replace(/\D/g, '')) || 0;
        const numB = parseInt((b.codigo || '').replace(/\D/g, '')) || 0;
        if (numA !== numB) return numB - numA; // Descending sequential
        return (a.codigo || '').localeCompare(b.codigo || '');
    });

    const filteredCodes = combinedCodes.filter(code => {
        const searchMatch = code.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            code.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
        return searchMatch;
    });

    // Helper to reflect cost (using the saved total which now reflects materials with profit)
    const calculateCost = (code: any) => {
        return code.costoTotal || 0;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Suministros</CardTitle>
                    <CardDescription>
                        Administración de Suministros
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar código..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-8 w-[250px]"
                        />
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Crear Código
                    </Button>
                    <CreateWorkCodeDialog
                        open={isCreateOpen}
                        onOpenChange={setIsCreateOpen}
                        codigosExistentes={codigosTrabajo}
                        onSave={addCodigoTrabajo}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Materiales</TableHead>
                                <TableHead className="text-right">Costo Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCodes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No se encontraron códigos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCodes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((code) => {
                                    const totalCost = calculateCost(code);
                                    return (
                                        <TableRow
                                            key={code.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                setSelectedCode(code);
                                                setDetailOpen(true);
                                            }}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    {code.codigo}
                                                </div>
                                            </TableCell>
                                            <TableCell>{code.descripcion}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{code.materiales.length} Ítems</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(totalCost)}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => {
                                                            if (code.isInventario) setEditInventarioItem(code.originalItem);
                                                            else setEditCode(code);
                                                        }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => {
                                                            if (code.isInventario) {
                                                                if (confirm("¿Eliminar este material?")) deleteInventarioItem(code.id);
                                                            } else {
                                                                deleteCodigoTrabajo(code.id);
                                                            }
                                                        }}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredCodes.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredCodes.length)} de {filteredCodes.length} ítems
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredCodes.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                    </div>
                </div>
            </CardContent>

            <WorkCodeDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                code={selectedCode}
            />
            {editCode && (
                <EditWorkCodeDialog
                    code={editCode}
                    open={!!editCode}
                    onClose={() => setEditCode(null)}
                />
            )}
            <EditInventoryItemDialog
                open={!!editInventarioItem}
                onOpenChange={(open) => !open && setEditInventarioItem(null)}
                initialData={editInventarioItem || {}}
                onSave={(item) => {
                    updateInventarioItem(item);
                    setEditInventarioItem(null);
                }}
            />
        </Card>
    );
}

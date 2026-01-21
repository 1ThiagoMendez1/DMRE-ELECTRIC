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

export function WorkCodesTable() {
    const { codigosTrabajo, deleteCodigoTrabajo, inventario } = useErp();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCode, setSelectedCode] = useState<any>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const filteredCodes = codigosTrabajo.filter(code =>
        code.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to calculate cost
    const calculateCost = (code: any) => {
        const materialCost = (code.materiales || []).reduce((sum: number, mat: any) => {
            // Find current cost in inventory if possible
            let invItem = inventario.find(i => i.id === mat.inventarioId || i.id === mat.id);

            // Validate Match (Fix for Mock Data ID discrepancies)
            if (invItem && mat.nombre && !invItem.descripcion.toLowerCase().includes(mat.nombre.toLowerCase()) && !mat.nombre.toLowerCase().includes(invItem.descripcion.toLowerCase())) {
                // Try finding by name
                const nameMatch = inventario.find(i => i.descripcion === mat.nombre || i.descripcion === mat.descripcion);
                if (nameMatch) {
                    invItem = nameMatch;
                } else {
                    invItem = undefined; // Fallback to stored price
                }
            }

            const unitCost = invItem ? invItem.valorUnitario : (mat.valorUnitario || 0);
            return sum + (unitCost * mat.cantidad);
        }, 0);
        return materialCost + (code.valorManoObra || code.manoDeObra || 0);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Códigos de Trabajo</CardTitle>
                    <CardDescription>
                        Administración de APUs y Kits de Instalación
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[250px]"
                        />
                    </div>
                    <CreateWorkCodeDialog />
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
                                <TableHead className="text-right">Mano de Obra</TableHead>
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
                                filteredCodes.map((code) => {
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
                                            <TableCell className="text-right">
                                                {formatCurrency(code.valorManoObra || code.manoDeObra || 0)}
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
                                                        <DropdownMenuItem onSelect={(e) => {
                                                            e.preventDefault();
                                                            // We can also open Detail and switch tab, but simpler to just Edit
                                                            // Actually, Detail has Edit button too.
                                                            // Let's keep Edit here for quick access.
                                                        }}>
                                                            <EditWorkCodeDialog code={code} onClose={() => { }} />
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => deleteCodigoTrabajo(code.id)}>
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
            </CardContent>

            <WorkCodeDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                code={selectedCode}
            />
        </Card>
    );
}

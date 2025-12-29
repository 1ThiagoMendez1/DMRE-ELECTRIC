"use client";

import { useState } from "react";
import { RegistroObra, Anticipo, Cliente } from "@/types/sistema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn, formatDateES } from "@/lib/utils";
import { ObraDetailDialog } from "@/components/erp/obra-detail-dialog";
import { CreateObraDialog } from "@/components/erp/create-obra-dialog";

interface RegistroTableProps {
    data: RegistroObra[];
}

export function RegistroTable({ data: initialData }: RegistroTableProps) {
    const [data, setData] = useState<RegistroObra[]>(initialData);

    // Obra Detail State
    const [selectedObraDetail, setSelectedObraDetail] = useState<RegistroObra | null>(null);
    const [isObraDetailOpen, setIsObraDetailOpen] = useState(false);

    const handleObraClick = (obra: RegistroObra) => {
        setSelectedObraDetail(obra);
        setIsObraDetailOpen(true);
    };

    const handleObraUpdate = (updated: RegistroObra) => {
        setData(data.map(d => d.id === updated.id ? updated : d));
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE': return <Badge variant="secondary">Pendiente</Badge>;
            case 'EN_PROCESO': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">En Proceso</Badge>;
            case 'FINALIZADO': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Finalizado</Badge>;
            default: return <Badge variant="outline">{estado}</Badge>;
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-md border shadow-sm">
                <h3 className="text-lg font-semibold">Registro de Obras y Proyectos</h3>
                <CreateObraDialog onObraCreated={(newObra) => setData([newObra, ...data])} />
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px] pl-6">Fecha Inicio</TableHead>
                            <TableHead>Cliente / Obra</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                            <TableHead className="text-right">Abonado</TableHead>
                            <TableHead className="text-right">Saldo</TableHead>
                            <TableHead className="w-[120px]">Estado</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((registro) => (
                            <TableRow
                                key={registro.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleObraClick(registro)}
                            >
                                <TableCell className="font-medium pl-6">
                                    {formatDateES(registro.cotizacion.fecha)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-base flex items-center gap-1">
                                            {registro.cotizacion.cliente.nombre}
                                        </p>
                                        <span className="text-sm text-muted-foreground">{registro.nombreObra}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {formatCurrency(registro.valorTotal)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                                    {formatCurrency(registro.valorTotal - registro.saldoPendiente)}
                                </TableCell>
                                <TableCell className={cn("text-right font-mono font-bold", registro.saldoPendiente > 0 ? "text-orange-600" : "text-muted-foreground")}>
                                    {formatCurrency(registro.saldoPendiente)}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(registro.estado)}
                                </TableCell>
                                <TableCell>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ObraDetailDialog
                open={isObraDetailOpen}
                onOpenChange={setIsObraDetailOpen}
                registro={selectedObraDetail}
                onUpdate={handleObraUpdate}
            />
        </div>
    );
}

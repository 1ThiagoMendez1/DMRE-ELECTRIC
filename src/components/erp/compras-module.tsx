"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Search, 
    FileText, 
    MoreHorizontal, 
    Eye, 
    Download, 
    Trash2, 
    AlertCircle,
    Calendar as CalendarIcon,
    ArrowUpDown
} from "lucide-react";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateCompraDialog } from "./create-compra-dialog";

export function ComprasModule() {
    const { comprasFinanciera, deleteCompraFinanciera } = useErp();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCompras = comprasFinanciera.filter(c => 
        c.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cotizacion?.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cotizacion?.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalFacturado = filteredCompras.reduce((acc, curr) => acc + curr.valorFactura, 0);
    const totalPagado = filteredCompras.reduce((acc, curr) => acc + curr.valorPago, 0);
    const totalPendiente = totalFacturado - totalPagado;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Facturado</CardDescription>
                        <CardTitle className="text-2xl font-bold text-primary">
                            {formatCurrency(totalFacturado)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Pagado</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalPagado)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Saldo Pendiente</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-600">
                            {formatCurrency(totalPendiente)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por factura, oferta o cliente..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <CreateCompraDialog />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Factura No.</TableHead>
                                <TableHead>Compra Ref. (CM)</TableHead>
                                <TableHead>Oferta Ref.</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Valor Factura</TableHead>
                                <TableHead className="text-right">Pagado</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompras.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                        No se encontraron compras registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompras.map((compra) => {
                                    const saldo = compra.valorFactura - compra.valorPago;
                                    const isPaid = saldo <= 0;
                                    const isPartial = saldo > 0 && compra.valorPago > 0;

                                    return (
                                        <TableRow key={compra.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(compra.fecha), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>{compra.numeroFactura}</TableCell>
                                            <TableCell>
                                                {compra.cotizacionProveedor ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {compra.cotizacionProveedor.numero}
                                                    </Badge>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {compra.cotizacion?.numero || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate">
                                                {compra.cotizacion?.cliente?.nombre || "Sin Vincular"}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(compra.valorFactura)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {formatCurrency(compra.valorPago)}
                                            </TableCell>
                                            <TableCell className="text-right text-orange-600 font-bold">
                                                {formatCurrency(saldo)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    isPaid ? "bg-green-100 text-green-800" : 
                                                    isPartial ? "bg-blue-100 text-blue-800" : 
                                                    "bg-orange-100 text-orange-800"
                                                )}>
                                                    {isPaid ? "PAGADA" : isPartial ? "PARCIAL" : "PENDIENTE"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <CreateCompraDialog compra={compra} />
                                                        </DropdownMenuItem>
                                                        {compra.soporteUrl && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={compra.soporteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver Soporte
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                if (confirm("¿Está seguro de eliminar esta compra?")) {
                                                                    deleteCompraFinanciera(compra.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
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
                </CardContent>
            </Card>
        </div>
    );
}

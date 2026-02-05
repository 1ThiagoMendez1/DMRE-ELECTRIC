"use client";

import { useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency } from "@/lib/utils";
import { useErp } from "@/components/providers/erp-provider";
import { BarChart, Users, FileText, CheckCircle, Clock, Package, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EditWorkCodeDialog } from "./edit-work-code-dialog";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WorkCodeDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    code: any | null; // CodigoTrabajo
}

export function WorkCodeDetailDialog({ open, onOpenChange, code }: WorkCodeDetailDialogProps) {
    const { cotizaciones, deductInventoryItem, codigosTrabajo } = useErp();
    const { toast } = useToast();
    const [isDeducting, setIsDeducting] = useState(false);

    // Helper for recursive deduction
    const deductRecursive = async (currentCode: any, multiplier: number = 1) => {
        let count = 0;

        // Ensure materials array availability
        if (!currentCode.materiales) return 0;

        for (const mat of currentCode.materiales) {
            const qty = mat.cantidad * multiplier;

            if (mat.inventarioId) {
                // It's a raw material, deduct it
                await deductInventoryItem(mat.inventarioId, qty);
                count++;
            } else if (mat.subCodigoId) {
                // It's a nested APU, find it and recurse
                const subCode = codigosTrabajo.find((c: any) => c.id === mat.subCodigoId);
                if (subCode) {
                    count += await deductRecursive(subCode, qty);
                }
            }
        }
        return count;
    };

    const metrics = useMemo(() => {
        if (!code || !cotizaciones) return null;

        let totalQuotations = 0;
        let totalUnitsSold = 0;
        let totalRevenue = 0;
        let wonQuotations = 0;
        const clientUsage: Record<string, { count: number, revenue: number, name: string }> = {};
        const recentQuotes: any[] = [];

        cotizaciones.forEach(quote => {
            const matchedItems = quote.items.filter((i: any) =>
                i.descripcion === code.descripcion ||
                i.descripcion === code.nombre ||
                (i.codigoTrabajoId === code.id)
            );

            if (matchedItems.length > 0) {
                totalQuotations++;
                if (quote.estado === 'APROBADA' || quote.estado === 'FINALIZADA') {
                    wonQuotations++;
                }

                matchedItems.forEach((item: any) => {
                    totalUnitsSold += item.cantidad;
                    totalRevenue += item.valorTotal;
                });

                if (quote.cliente) {
                    if (!clientUsage[quote.cliente.id]) {
                        clientUsage[quote.cliente.id] = { count: 0, revenue: 0, name: quote.cliente.nombre };
                    }
                    clientUsage[quote.cliente.id].count++;
                    clientUsage[quote.cliente.id].revenue += matchedItems.reduce((acc: number, curr: any) => acc + curr.valorTotal, 0);
                }

                recentQuotes.push({
                    id: quote.id,
                    numero: quote.numero,
                    cliente: quote.cliente?.nombre || "N/A",
                    fecha: quote.fecha,
                    estado: quote.estado,
                    cantidad: matchedItems.reduce((acc: number, curr: any) => acc + curr.cantidad, 0)
                });
            }
        });

        const sortedClients = Object.values(clientUsage).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        recentQuotes.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return {
            totalQuotations,
            totalUnitsSold,
            totalRevenue,
            conversionRate: totalQuotations > 0 ? (wonQuotations / totalQuotations) * 100 : 0,
            topClients: sortedClients,
            recentQuotes: recentQuotes.slice(0, 10)
        };
    }, [code, cotizaciones]);

    if (!code) return null;

    const materialsCost = code.materiales?.reduce((acc: number, m: any) => acc + (m.valorUnitario || 0) * m.cantidad, 0) || 0;
    const moCost = code.valorManoObra || code.manoDeObra || 0;
    const totalCost = materialsCost + moCost;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <FileText className="h-6 w-6 text-primary" />
                                {code.descripcion || code.nombre}
                            </DialogTitle>
                            <DialogDescription asChild className="flex items-center gap-2 mt-1">
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline">{code.codigo}</Badge>
                                    <span>Costo Base: {formatCurrency(totalCost)}</span>
                                </div>
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                                disabled={isDeducting || !code.materiales?.length}
                                onClick={async () => {
                                    setIsDeducting(true);
                                    try {
                                        const count = await deductRecursive(code, 1);
                                        toast({
                                            title: "Materiales Descontados",
                                            description: `Se ha actualizado el stock (incluyendo sub-niveles).`
                                        });
                                    } catch (error) {
                                        console.error(error);
                                        toast({
                                            title: "Error",
                                            description: "No se pudieron descontar todos los materiales.",
                                            variant: "destructive"
                                        });
                                    } finally {
                                        setIsDeducting(false);
                                    }
                                }}
                            >
                                {isDeducting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                                Registrar Uso
                            </Button>
                            <EditWorkCodeDialog code={code} />
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">Información General</TabsTrigger>
                        <TabsTrigger value="metrics">Métricas e Histórico</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-2 p-1">
                        <TabsContent value="info" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Composición del Costo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                                            <span className="font-medium">Mano de Obra</span>
                                            <span className="font-bold">{formatCurrency(moCost)}</span>
                                        </div>
                                        <div className="border rounded-lg">
                                            <div className="p-2 bg-muted/50 text-xs font-semibold">Materiales ({code.materiales?.length || 0})</div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Material / APU</TableHead>
                                                        <TableHead className="text-right">Cant</TableHead>
                                                        <TableHead className="text-right">Unitario</TableHead>
                                                        <TableHead className="text-right">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {code.materiales?.map((mat: any, i: number) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="py-2 text-sm">
                                                                {mat.subCodigoId && <Badge variant="secondary" className="mr-2 text-[10px] h-5 px-1">APU</Badge>}
                                                                {mat.nombre || mat.descripcion}
                                                            </TableCell>
                                                            <TableCell className="text-right py-2 text-sm">{mat.cantidad}</TableCell>
                                                            <TableCell className="text-right py-2 text-sm">{formatCurrency(mat.valorUnitario)}</TableCell>
                                                            <TableCell className="text-right py-2 text-sm font-medium">{formatCurrency((mat.valorUnitario || 0) * mat.cantidad)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <div className="p-2 border-t flex justify-between items-center font-medium bg-muted/10">
                                                <span>Total Materiales</span>
                                                <span>{formatCurrency(materialsCost)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="metrics" className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <FileText className="h-8 w-8 text-blue-500 mb-2" />
                                        <p className="text-xs text-muted-foreground">Presencia en Cotizaciones</p>
                                        <p className="text-2xl font-bold">{metrics?.totalQuotations}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                        <p className="text-xs text-muted-foreground">Tasa de Cierre</p>
                                        <p className="text-2xl font-bold">{metrics?.conversionRate.toFixed(0)}%</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <BarChart className="h-8 w-8 text-amber-500 mb-2" />
                                        <p className="text-xs text-muted-foreground">Unidades Vendidas</p>
                                        <p className="text-2xl font-bold">{metrics?.totalUnitsSold}</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <Users className="h-8 w-8 text-purple-500 mb-2" />
                                        <p className="text-xs text-muted-foreground">Top Cliente</p>
                                        <p className="text-sm font-bold truncate w-full">{metrics?.topClients[0]?.name || "N/A"}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Clock className="h-4 w-4" /> Uso Reciente
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha</TableHead>
                                                    <TableHead>Cliente</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {metrics?.recentQuotes.map((q: any) => (
                                                    <TableRow key={q.id}>
                                                        <TableCell className="text-xs">{new Date(q.fecha).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-xs truncate max-w-[100px]">{q.cliente}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={q.estado === 'APROBADA' ? 'default' : 'secondary'} className="text-[10px]">
                                                                {q.estado}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!metrics?.recentQuotes.length) && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">
                                                            Sin uso registrado reciente
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Mejores Clientes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {metrics?.topClients.map((client, i) => (
                                                <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                                    <span className="font-medium truncate max-w-[150px]">{client.name}</span>
                                                    <div className="text-right">
                                                        <p className="font-bold">{client.count} Cotiz.</p>
                                                        <p className="text-xs text-muted-foreground">{formatCurrency(client.revenue)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!metrics?.topClients.length) && (
                                                <div className="text-center text-xs text-muted-foreground py-4">
                                                    Sin datos de clientes
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useState, useMemo } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Vehiculo, GastoVehiculo } from "@/types/sistema";
import { formatCurrency, formatDateES } from "@/lib/utils";
import { Car, FileText, Receipt, TrendingUp, Fuel, Wrench, Calendar, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";

interface VehicleDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehiculo: Vehiculo | null;
    gastos: GastoVehiculo[];
}

export function VehicleDetailDialog({ open, onOpenChange, vehiculo, gastos }: VehicleDetailDialogProps) {
    const [activeTab, setActiveTab] = useState("general");

    const vehicleGastos = useMemo(() =>
        gastos.filter(g => g.vehiculo.placa === vehiculo?.placa)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
        [gastos, vehiculo]
    );

    const metrics = useMemo(() => {
        if (!vehiculo || vehicleGastos.length === 0) {
            return { total: 0, promedio: 0, combustible: 0, mantenimiento: 0, costoPorKm: 0 };
        }
        const total = vehicleGastos.reduce((acc, g) => acc + g.valor, 0);
        const combustible = vehicleGastos.filter(g => g.tipo === 'COMBUSTIBLE').reduce((acc, g) => acc + g.valor, 0);
        const mantenimiento = vehicleGastos.filter(g => g.tipo === 'MANTENIMIENTO').reduce((acc, g) => acc + g.valor, 0);
        const months = Math.max(1, new Set(vehicleGastos.map(g => `${new Date(g.fecha).getMonth()}-${new Date(g.fecha).getFullYear()}`)).size);
        const kmRecorridos = vehiculo.kilometrajeActual > 0 ? vehiculo.kilometrajeActual : 1;

        return {
            total,
            promedio: total / months,
            combustible,
            mantenimiento,
            costoPorKm: total / kmRecorridos
        };
    }, [vehicleGastos, vehiculo]);

    if (!vehiculo) return null;

    const getDocStatus = (date: Date) => {
        const days = differenceInDays(new Date(date), new Date());
        if (days < 0) return { color: 'bg-red-500', label: 'Vencido', variant: 'destructive' as const };
        if (days <= 30) return { color: 'bg-amber-500', label: `${days} días`, variant: 'secondary' as const };
        if (days <= 60) return { color: 'bg-yellow-500', label: `${days} días`, variant: 'outline' as const };
        return { color: 'bg-green-500', label: `${days} días`, variant: 'default' as const };
    };

    const soatStatus = getDocStatus(vehiculo.vencimientoSoat);
    const tecnoStatus = getDocStatus(vehiculo.vencimientoTecnomecanica);
    const seguroStatus = getDocStatus(vehiculo.vencimientoSeguro);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        {vehiculo.placa} - {vehiculo.marcaModelo}
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2">
                        <Badge variant={vehiculo.estado === 'OPERATIVO' ? 'default' : vehiculo.estado === 'MANTENIMIENTO' ? 'secondary' : 'outline'}>
                            {vehiculo.estado}
                        </Badge>
                        <span>{vehiculo.color} • {vehiculo.ano}</span>
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                        <TabsTrigger value="documentos" className="text-xs">Documentos</TabsTrigger>
                        <TabsTrigger value="gastos" className="text-xs">Gastos</TabsTrigger>
                        <TabsTrigger value="metricas" className="text-xs">Métricas</TabsTrigger>
                    </TabsList>

                    {/* Tab: General */}
                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Placa</p>
                                <p className="font-bold">{vehiculo.placa}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                                <p className="font-medium">{vehiculo.marcaModelo}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Conductor Asignado</p>
                                <p className="font-medium">{vehiculo.conductorAsignado || 'Sin asignar'}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Estado</p>
                                <Badge variant={vehiculo.estado === 'OPERATIVO' ? 'default' : 'secondary'}>
                                    {vehiculo.estado}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Kilometraje Actual</p>
                                <p className="font-bold text-primary">{(vehiculo.kilometrajeActual || 0).toLocaleString()} km</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Año / Color</p>
                                <p className="font-medium">{vehiculo.ano} • {vehiculo.color}</p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tab: Documentos */}
                    <TabsContent value="documentos" className="space-y-4 py-4">
                        <div className="space-y-3">
                            {[
                                { label: 'SOAT', date: vehiculo.vencimientoSoat, status: soatStatus },
                                { label: 'Tecnomecánica', date: vehiculo.vencimientoTecnomecanica, status: tecnoStatus },
                                { label: 'Seguro', date: vehiculo.vencimientoSeguro, status: seguroStatus }
                            ].map((doc) => (
                                <div key={doc.label} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-sm">{doc.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Vence: {formatDateES(new Date(doc.date))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${doc.status.color}`} />
                                        <Badge variant={doc.status.variant}>{doc.status.label}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Tab: Gastos */}
                    <TabsContent value="gastos" className="space-y-4 py-4">
                        <div className="rounded-md border max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicleGastos.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                Sin gastos registrados
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        vehicleGastos.slice(0, 15).map((gasto) => (
                                            <TableRow key={gasto.id}>
                                                <TableCell className="text-xs">{formatDateES(new Date(gasto.fecha))}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] gap-1">
                                                        {gasto.tipo === 'COMBUSTIBLE' && <Fuel className="h-3 w-3" />}
                                                        {gasto.tipo === 'MANTENIMIENTO' && <Wrench className="h-3 w-3" />}
                                                        {gasto.tipo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs">{gasto.proveedor || '-'}</TableCell>
                                                <TableCell className="text-right font-mono text-xs">{formatCurrency(gasto.valor)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Tab: Métricas */}
                    <TabsContent value="metricas" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Receipt className="h-4 w-4" /> Gasto Total
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatCurrency(metrics.total)}</p>
                                    <p className="text-xs text-muted-foreground">{vehicleGastos.length} registros</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Promedio Mensual
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">{formatCurrency(metrics.promedio)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Costo por KM
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold">${Math.round(metrics.costoPorKm)}</p>
                                    <p className="text-xs text-muted-foreground">por kilómetro</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs text-muted-foreground">Distribución</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="flex items-center gap-1"><Fuel className="h-3 w-3 text-orange-500" /> Combustible</span>
                                        <span>{metrics.total > 0 ? Math.round((metrics.combustible / metrics.total) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={metrics.total > 0 ? (metrics.combustible / metrics.total) * 100 : 0} className="h-2" />
                                    <div className="flex justify-between text-xs">
                                        <span className="flex items-center gap-1"><Wrench className="h-3 w-3 text-blue-500" /> Mantenimiento</span>
                                        <span>{metrics.total > 0 ? Math.round((metrics.mantenimiento / metrics.total) * 100) : 0}%</span>
                                    </div>
                                    <Progress value={metrics.total > 0 ? (metrics.mantenimiento / metrics.total) * 100 : 0} className="h-2" />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

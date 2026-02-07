"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Vehiculo, GastoVehiculo } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import {
    Car, FileText, Receipt, TrendingUp, Fuel, Wrench, Calendar as CalendarIcon, AlertTriangle,
    Loader2, Upload, ExternalLink, Trash2, Pencil, Save, X as CloseIcon, Camera, Image as ImageIcon
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/utils/supabase/client";
import { useErp } from "@/components/providers/erp-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn, formatDateES } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { RegisterExpenseDialog } from "./register-expense-dialog";

const vehicleSchema = z.object({
    placa: z.string().min(6, "Placa inválida"),
    marcaModelo: z.string().min(3, "Marca/Modelo requerido"),
    conductorAsignado: z.string().optional(),
    estado: z.string(),
    color: z.string().optional(),
    ano: z.coerce.number().optional(),
    kilometrajeActual: z.coerce.number().optional(),
    vencimientoSoat: z.date(),
    vencimientoTecnomecanica: z.date(),
    vencimientoSeguro: z.date(),
});

interface VehicleDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vehiculo: Vehiculo | null;
    gastos: GastoVehiculo[];
}

export function VehicleDetailDialog({ open, onOpenChange, vehiculo, gastos }: VehicleDetailDialogProps) {
    const [activeTab, setActiveTab] = useState("general");
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { updateVehiculo, currentUser, deleteGastoVehiculo, vehiculos, cuentasBancarias } = useErp();
    const { toast } = useToast();
    const supabase = createClient();

    const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'ENGINEER';

    const form = useForm<z.infer<typeof vehicleSchema>>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            placa: vehiculo?.placa || "",
            marcaModelo: vehiculo?.marcaModelo || "",
            conductorAsignado: vehiculo?.conductorAsignado || "",
            estado: vehiculo?.estado || "OPERATIVO",
            color: vehiculo?.color || "",
            ano: vehiculo?.ano || new Date().getFullYear(),
            kilometrajeActual: vehiculo?.kilometrajeActual || 0,
            vencimientoSoat: vehiculo?.vencimientoSoat || new Date(),
            vencimientoTecnomecanica: vehiculo?.vencimientoTecnomecanica || new Date(),
            vencimientoSeguro: vehiculo?.vencimientoSeguro || new Date(),
        },
    });

    // Reset form when vehicle changes
    React.useEffect(() => {
        if (vehiculo) {
            form.reset({
                placa: vehiculo.placa,
                marcaModelo: vehiculo.marcaModelo,
                conductorAsignado: vehiculo.conductorAsignado,
                estado: vehiculo.estado,
                color: vehiculo.color,
                ano: vehiculo.ano,
                kilometrajeActual: vehiculo.kilometrajeActual,
                vencimientoSoat: new Date(vehiculo.vencimientoSoat),
                vencimientoTecnomecanica: new Date(vehiculo.vencimientoTecnomecanica),
                vencimientoSeguro: new Date(vehiculo.vencimientoSeguro),
            });
        }
    }, [vehiculo, form]);

    const onSave = async (values: z.infer<typeof vehicleSchema>) => {
        if (!vehiculo) return;
        try {
            await updateVehiculo({
                ...vehiculo,
                ...values,
                estado: values.estado as any,
                vencimientoSoat: values.vencimientoSoat,
                vencimientoTecnomecanica: values.vencimientoTecnomecanica,
                vencimientoSeguro: values.vencimientoSeguro,
            });
            setIsEditing(false);
            toast({ title: "Vehículo actualizado" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
        }
    };

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !vehiculo) return;
        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${vehiculo.placa}/${Date.now()}.${fileExt}`;
            const filePath = `vehiculos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('Archivos Carros')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('Archivos Carros')
                .getPublicUrl(filePath);

            const newArchivo = {
                name: file.name,
                url: publicUrl,
                category: activeTab === 'documentos' ? 'DOCUMENT' : 'PHOTO',
                date: new Date()
            };

            const updatedArchivos = [...(vehiculo.archivos || []), newArchivo];
            await updateVehiculo({ ...vehiculo, archivos: updatedArchivos });
            toast({ title: "Archivo subido", description: "El archivo se ha guardado correctamente." });
        } catch (error: any) {
            console.error("Error uploading file:", error);
            toast({
                title: "Error al subir",
                description: error.message || "No se pudo subir el archivo.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const deleteArchivo = async (url: string) => {
        if (!vehiculo) return;
        try {
            const updatedArchivos = (vehiculo.archivos || []).filter(a => a.url !== url);
            await updateVehiculo({ ...vehiculo, archivos: updatedArchivos });
            toast({ title: "Archivo eliminado" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
        }
    };

    const handleDeleteGasto = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este gasto?")) return;
        try {
            await deleteGastoVehiculo(id);
            toast({ title: "Gasto eliminado" });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el gasto", variant: "destructive" });
        }
    };

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
                <DialogHeader className="relative">
                    <div className="flex justify-between items-start mr-8">
                        <div>
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
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? <><CloseIcon className="h-4 w-4" /> Cancelar</> : <><Pencil className="h-4 w-4" /> Editar</>}
                        </Button>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSave)}>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                                <TabsTrigger value="documentos" className="text-xs">Documentos</TabsTrigger>
                                <TabsTrigger value="gastos" className="text-xs">Gastos</TabsTrigger>
                                <TabsTrigger value="metricas" className="text-xs">Métricas</TabsTrigger>
                                <TabsTrigger value="archivos" className="text-xs">Archivos</TabsTrigger>
                            </TabsList>

                            {/* Tab: General */}
                            <TabsContent value="general" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Placa</p>
                                        {isEditing ? (
                                            <FormField
                                                control={form.control}
                                                name="placa"
                                                render={({ field }) => (
                                                    <Input {...field} />
                                                )}
                                            />
                                        ) : (
                                            <p className="font-bold">{vehiculo.placa}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Marca/Modelo</p>
                                        {isEditing ? (
                                            <FormField
                                                control={form.control}
                                                name="marcaModelo"
                                                render={({ field }) => (
                                                    <Input {...field} />
                                                )}
                                            />
                                        ) : (
                                            <p className="font-medium">{vehiculo.marcaModelo}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Conductor Asignado</p>
                                        {isEditing ? (
                                            <FormField
                                                control={form.control}
                                                name="conductorAsignado"
                                                render={({ field }) => (
                                                    <Input {...field} />
                                                )}
                                            />
                                        ) : (
                                            <p className="font-medium">{vehiculo.conductorAsignado || 'Sin asignar'}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Estado</p>
                                        {isEditing ? (
                                            <FormField
                                                control={form.control}
                                                name="estado"
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="OPERATIVO">OPERATIVO</SelectItem>
                                                            <SelectItem value="MANTENIMIENTO">MANTENIMIENTO</SelectItem>
                                                            <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        ) : (
                                            <Badge variant={vehiculo.estado === 'OPERATIVO' ? 'default' : 'secondary'}>
                                                {vehiculo.estado}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Kilometraje Actual</p>
                                        {isEditing ? (
                                            <FormField
                                                control={form.control}
                                                name="kilometrajeActual"
                                                render={({ field }) => (
                                                    <Input type="number" {...field} />
                                                )}
                                            />
                                        ) : (
                                            <p className="font-bold text-primary">{(vehiculo.kilometrajeActual || 0).toLocaleString()} km</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Año / Color</p>
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name="ano"
                                                    render={({ field }) => (
                                                        <Input type="number" placeholder="Año" {...field} />
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="color"
                                                    render={({ field }) => (
                                                        <Input placeholder="Color" {...field} />
                                                    )}
                                                />
                                            </div>
                                        ) : (
                                            <p className="font-medium">{vehiculo.ano} • {vehiculo.color}</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab: Documentos */}
                            <TabsContent value="documentos" className="space-y-4 py-4">
                                <div className="space-y-3">
                                    {[
                                        { label: 'SOAT', name: 'vencimientoSoat', date: vehiculo.vencimientoSoat, status: soatStatus },
                                        { label: 'Tecnomecánica', name: 'vencimientoTecnomecanica', date: vehiculo.vencimientoTecnomecanica, status: tecnoStatus },
                                        { label: 'Seguro', name: 'vencimientoSeguro', date: vehiculo.vencimientoSeguro, status: seguroStatus }
                                    ].map((doc) => (
                                        <div key={doc.label} className="flex items-center justify-between p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-sm">{doc.label}</p>
                                                    {isEditing ? (
                                                        <FormField
                                                            control={form.control}
                                                            name={doc.name as any}
                                                            render={({ field }) => (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button
                                                                            variant={"outline"}
                                                                            size="sm"
                                                                            className={cn(
                                                                                "h-8 text-left font-normal",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            {field.value ? format(field.value, "dd/MM/yyyy") : "Seleccionar fecha"}
                                                                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0" align="start">
                                                                        <CalendarComponent
                                                                            mode="single"
                                                                            selected={field.value}
                                                                            onSelect={field.onChange}
                                                                            initialFocus
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            Vence: {formatDateES(new Date(doc.date))}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!isEditing && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${doc.status.color}`} />
                                                    <Badge variant={doc.status.variant}>{doc.status.label}</Badge>
                                                </div>
                                            )}
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
                                                {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vehicleGastos.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground">
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
                                                        {canEdit && (
                                                            <TableCell className="text-right p-0 pr-4">
                                                                <div className="flex justify-end gap-1">
                                                                    <RegisterExpenseDialog
                                                                        vehiculos={vehiculos}
                                                                        cuentas={cuentasBancarias}
                                                                        gasto={gasto}
                                                                        onExpenseCreated={() => { }}
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive"
                                                                        onClick={() => handleDeleteGasto(gasto.id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        )}
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

                            {/* Tab: Archivos */}
                            <TabsContent value="archivos" className="space-y-4 py-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-semibold">Galería y Documentos</h3>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="relative cursor-pointer" disabled={isUploading}>
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Subir Archivo
                                            <Input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                            />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {(vehiculo.archivos || []).map((archivo, idx) => (
                                        <Card key={idx} className="overflow-hidden group relative">
                                            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                                {archivo.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                    <img src={archivo.url} alt={archivo.name} className="object-cover w-full h-full" />
                                                ) : (
                                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[10px] truncate font-medium">{archivo.name}</p>
                                                <div className="flex justify-between mt-1">
                                                    <a href={archivo.url} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </a>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => deleteArchivo(archivo.url)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {/* Show expense supports as well */}
                                    {vehicleGastos.filter(g => g.soporteUrl).map((gasto, idx) => (
                                        <Card key={`gasto-${idx}`} className="overflow-hidden border-blue-100 bg-blue-50/30">
                                            <div className="aspect-square flex items-center justify-center overflow-hidden italic text-xs text-blue-600 px-2 text-center">
                                                Soporte Gasto: {gasto.tipo}
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[10px] truncate">{formatDateES(gasto.fecha)}</p>
                                                <div className="flex justify-end mt-1">
                                                    <a href={gasto.soporteUrl} target="_blank" rel="noopener noreferrer">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}

                                    {!(vehiculo.archivos?.length) && !vehicleGastos.some(g => g.soporteUrl) && (
                                        <div className="col-span-3 py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                            No hay archivos cargados para este vehículo
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {isEditing && (
                            <div className="flex justify-end pt-4 border-t">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Guardar Cambios
                                </Button>
                            </div>
                        )}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

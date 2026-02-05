"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, Banknote, FileText, Edit, History, Save, X, Upload, Loader2, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Empleado, LiquidacionNomina, NovedadNomina } from "@/types/sistema";
import { createClient } from "@/utils/supabase/client";

interface EmployeeDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    empleado: Empleado | null;
    liquidaciones: LiquidacionNomina[];
    novedades: NovedadNomina[];
    onUpdate: (updated: Empleado) => void;
}

export function EmployeeDetailDialog({
    open,
    onOpenChange,
    empleado,
    liquidaciones,
    novedades,
    onUpdate
}: EmployeeDetailDialogProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const supabase = createClient();

    // Editable fields
    const [editCargo, setEditCargo] = useState(empleado?.cargo || "");
    const [editSalario, setEditSalario] = useState(empleado?.salarioBase.toString() || "");
    const [editBanco, setEditBanco] = useState((empleado as any)?.banco || "Bancolombia");
    const [editCuenta, setEditCuenta] = useState((empleado as any)?.cuentaBancaria || "");
    const [editTipoCuenta, setEditTipoCuenta] = useState((empleado as any)?.tipoCuenta || "Ahorros");

    if (!empleado) return null;

    const empLiquidaciones = liquidaciones.filter(l => l.empleadoId === empleado.id);
    const empNovedades = novedades.filter(n => n.empleadoId === empleado.id);

    const handleSave = () => {
        const updated = {
            ...empleado,
            cargo: editCargo,
            salarioBase: Number(editSalario),
            banco: editBanco,
            cuentaBancaria: editCuenta,
            tipoCuenta: editTipoCuenta,
        };
        onUpdate(updated as Empleado);
        toast({ title: "Datos Actualizados", description: "La información del empleado ha sido guardada." });
        setIsEditing(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !empleado) return;

        setIsUploading(true);
        const file = e.target.files[0];
        try {
            const fileExt = file.name.split('.').pop();
            const path = `empleados/${empleado.cedula}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('Doc Empleados')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('Doc Empleados')
                .getPublicUrl(path);

            const newFile = {
                name: file.name,
                url: publicUrl,
                date: new Date(),
                type: file.type
            };

            const updatedArchivos = [...(empleado.archivos || []), newFile];

            // Create a temporary updated object for processing state
            const updatedEmpleado = { ...empleado, archivos: updatedArchivos };

            // Call parent update
            onUpdate(updatedEmpleado);

            toast({ title: "Documento cargado", description: "El archivo se ha guardado en el historial." });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "No se pudo cargar el archivo", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFile = async (index: number) => {
        if (!empleado || !empleado.archivos) return;

        const updatedArchivos = [...empleado.archivos];
        updatedArchivos.splice(index, 1);

        const updatedEmpleado = { ...empleado, archivos: updatedArchivos };
        onUpdate(updatedEmpleado);
        toast({ title: "Documento eliminado", description: "El archivo se ha removido del historial." });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {empleado.nombreCompleto}
                    </DialogTitle>
                    <DialogDescription>
                        CC: {empleado.cedula} | Ingreso: {format(new Date(empleado.fechaIngreso), "PPP", { locale: es })}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="perfil" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="perfil"><User className="h-4 w-4 mr-1" /> Perfil</TabsTrigger>
                        <TabsTrigger value="pagos"><Banknote className="h-4 w-4 mr-1" /> Pagos</TabsTrigger>
                        <TabsTrigger value="novedades"><History className="h-4 w-4 mr-1" /> Novedades</TabsTrigger>
                        <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1" /> Documentos</TabsTrigger>
                    </TabsList>

                    {/* PERFIL TAB */}
                    <TabsContent value="perfil" className="flex-1 overflow-auto py-4 space-y-4">
                        <div className="flex justify-end">
                            {!isEditing ? (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-1" /> Editar
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4 mr-1" /> Cancelar
                                    </Button>
                                    <Button size="sm" onClick={handleSave}>
                                        <Save className="h-4 w-4 mr-1" /> Guardar
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Info Card */}
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Información Personal</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nombre:</span>
                                        <span className="font-medium">{empleado.nombreCompleto}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Cédula:</span>
                                        <span>{empleado.cedula}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fecha Ingreso:</span>
                                        <span>{format(new Date(empleado.fechaIngreso), "dd/MM/yyyy")}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Cargo:</span>
                                        {isEditing ? (
                                            <Input className="w-40 h-7" value={editCargo} onChange={(e) => setEditCargo(e.target.value)} />
                                        ) : (
                                            <Badge variant="outline">{empleado.cargo}</Badge>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Salario Base:</span>
                                        {isEditing ? (
                                            <Input type="number" className="w-40 h-7" value={editSalario} onChange={(e) => setEditSalario(e.target.value)} />
                                        ) : (
                                            <span className="font-bold text-primary">{formatCurrency(empleado.salarioBase)}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Estado:</span>
                                        <Badge className="bg-green-100 text-green-800">ACTIVO</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bank Info Card */}
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Datos Bancarios (Nómina)</CardTitle></CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Banco:</span>
                                        {isEditing ? (
                                            <Input className="w-40 h-7" value={editBanco} onChange={(e) => setEditBanco(e.target.value)} />
                                        ) : (
                                            <span>{editBanco || "No registrado"}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Tipo Cuenta:</span>
                                        {isEditing ? (
                                            <Input className="w-40 h-7" value={editTipoCuenta} onChange={(e) => setEditTipoCuenta(e.target.value)} />
                                        ) : (
                                            <span>{editTipoCuenta || "Ahorros"}</span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Número Cuenta:</span>
                                        {isEditing ? (
                                            <Input className="w-40 h-7" value={editCuenta} onChange={(e) => setEditCuenta(e.target.value)} />
                                        ) : (
                                            <span className="font-mono">{editCuenta || "***-***-****"}</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <Card className="bg-primary/5">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-2xl font-bold">{empLiquidaciones.length}</p>
                                    <p className="text-xs text-muted-foreground">Pagos Realizados</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-green-500/5">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(empLiquidaciones.reduce((a: number, l) => a + (l.netoPagar || 0), 0))}</p>
                                    <p className="text-xs text-muted-foreground">Total Pagado</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-500/5">
                                <CardContent className="pt-4 text-center">
                                    <p className="text-2xl font-bold text-orange-600">{empNovedades.length}</p>
                                    <p className="text-xs text-muted-foreground">Novedades Registradas</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* PAGOS TAB */}
                    <TabsContent value="pagos" className="flex-1 overflow-auto py-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Historial de Pagos de Nómina</CardTitle></CardHeader>
                            <CardContent>
                                {empLiquidaciones.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No hay pagos registrados.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Periodo</TableHead>
                                                <TableHead>Devengado</TableHead>
                                                <TableHead>Deducido</TableHead>
                                                <TableHead>Neto</TableHead>
                                                <TableHead>Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {empLiquidaciones.map(liq => (
                                                <TableRow key={liq.id}>
                                                    <TableCell className="font-mono">{liq.periodo}</TableCell>
                                                    <TableCell>{formatCurrency(liq.totalDevengado)}</TableCell>
                                                    <TableCell className="text-red-500">-{formatCurrency(liq.totalDeducido)}</TableCell>
                                                    <TableCell className="font-bold">{formatCurrency(liq.netoPagar)}</TableCell>
                                                    <TableCell>
                                                        <Badge className={liq.estado === 'PAGADO' ? "bg-green-100 text-green-800" : ""}>{liq.estado}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NOVEDADES TAB */}
                    <TabsContent value="novedades" className="flex-1 overflow-auto py-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Historial de Novedades</CardTitle></CardHeader>
                            <CardContent>
                                {empNovedades.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No hay novedades registradas.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Cantidad</TableHead>
                                                <TableHead>Valor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {empNovedades.map(nov => (
                                                <TableRow key={nov.id}>
                                                    <TableCell>{format(new Date(nov.fecha), "dd/MM/yyyy")}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={nov.efecto === 'RESTA' ? 'destructive' : 'secondary'}>
                                                            {nov.tipo.replace(/_/g, " ")}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{nov.cantidad}</TableCell>
                                                    <TableCell className={nov.efecto === 'RESTA' ? "text-red-500" : "text-green-600"}>
                                                        {nov.efecto === 'RESTA' ? '-' : '+'}{formatCurrency(nov.valorCalculado)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* DOCUMENTOS TAB */}
                    <TabsContent value="documentos" className="flex-1 overflow-auto py-4">
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Documentos del Empleado</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {/* Upload Section */}
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                        <Button variant="outline" disabled={isUploading}>
                                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Subir Documento
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">PDF, Imágenes (Max 5MB)</p>
                                </div>

                                {/* Files List */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Historial de Archivos</h4>
                                    {!empleado.archivos || empleado.archivos.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No hay documentos registrados.</p>
                                    ) : (
                                        <div className="grid gap-2">
                                            {empleado.archivos.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <FileText className="h-8 w-8 text-primary/80 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {file.date ? format(new Date(file.date), "PPP p", { locale: es }) : "Fecha desconocida"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={file.url} target="_blank" rel="noopener noreferrer">Ver</a>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(idx)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

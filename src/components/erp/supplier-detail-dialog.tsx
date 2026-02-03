"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useErp } from "@/components/providers/erp-provider";
import { BarChart as BarIcon, Package, FileText, TrendingUp, History, DollarSign, Pencil, Save, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    ResponsiveContainer,
} from "recharts";

const supplierSchema = z.object({
    nombre: z.string().min(3, "Nombre requerido"),
    nit: z.string().min(5, "NIT requerido"),
    correo: z.string().email("Correo inválido"),
    telefono: z.string().optional(),
    categoria: z.string().min(1, "Categoría requerida"),
    datosBancarios: z.string().optional(),
    notas: z.string().optional(),
});

interface SupplierDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proveedor: any | null;
}

export function SupplierDetailDialog({ open, onOpenChange, proveedor }: SupplierDetailDialogProps) {
    const { ordenesCompra, cuentasPorPagar, inventario, updateProveedor } = useErp();
    const { toast } = useToast();
    const [selectedProduct, setSelectedProduct] = useState<string>("default");
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<z.infer<typeof supplierSchema>>({
        resolver: zodResolver(supplierSchema),
        defaultValues: {
            nombre: "",
            nit: "",
            correo: "",
            telefono: "",
            categoria: "",
            datosBancarios: "",
            notas: "",
        },
    });

    // Sync form with proveedor
    useEffect(() => {
        if (open && proveedor) {
            form.reset({
                nombre: proveedor.nombre || "",
                nit: proveedor.nit || "",
                correo: proveedor.correo || "",
                telefono: proveedor.telefono || "",
                categoria: proveedor.categoria || "",
                datosBancarios: proveedor.datosBancarios || "",
                notas: proveedor.notas || "",
            });
            setSelectedProduct("default");
            setIsEditing(false);
        }
    }, [open, proveedor, form]);

    const stats = useMemo(() => {
        if (!proveedor || !ordenesCompra) return null;

        const orders = ordenesCompra.filter(o => o.proveedorId === proveedor.id);
        const bills = cuentasPorPagar.filter(c => c.proveedorId === proveedor.id);

        const totalPurchased = orders.reduce((acc, curr) => acc + curr.total, 0);
        const totalPending = bills.reduce((acc, curr) => acc + curr.saldoPendiente, 0);
        const orderCount = orders.length;

        // Item Analysis
        const itemFrequency: Record<string, number> = {};
        const itemHistory: Record<string, { date: string, price: number }[]> = {};
        const allProductsSet = new Set<string>();

        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.descripcion;
                allProductsSet.add(key);

                if (!itemFrequency[key]) itemFrequency[key] = 0;
                itemFrequency[key]++;

                if (!itemHistory[key]) itemHistory[key] = [];
                itemHistory[key].push({
                    date: new Date(order.fechaEmision).toLocaleDateString(),
                    price: item.valorUnitario
                });
            });
        });

        // Sort history
        Object.keys(itemHistory).forEach(key => {
            itemHistory[key].reverse(); // Assuming Mock data is descending
        });

        const topItem = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1])[0];
        const defaultProduct = topItem ? topItem[0] : "";

        const currentProduct = selectedProduct === "default" ? defaultProduct : selectedProduct;
        const trendData = currentProduct ? itemHistory[currentProduct] : [];

        // Catalog Logic
        const catalogItems = inventario ? inventario.filter(i =>
            i.proveedorId === proveedor.id ||
            orders.some(o => o.items.some(oi => oi.descripcion === i.descripcion || oi.inventarioId === i.id))
        ) : [];

        return {
            totalPurchased,
            totalPending,
            orderCount,
            orders,
            trendData,
            topItemName: topItem ? topItem[0] : "N/A",
            currentProductName: currentProduct,
            allProducts: Array.from(allProductsSet).sort(),
            catalogItems
        };
    }, [proveedor, ordenesCompra, cuentasPorPagar, inventario, selectedProduct]);

    if (!proveedor) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            {isEditing ? (
                                <DialogTitle className="text-2xl">Editar Proveedor</DialogTitle>
                            ) : (
                                <>
                                    <DialogTitle className="text-2xl flex items-center gap-2">
                                        {proveedor.nombre}
                                        <Badge variant="outline">{proveedor.categoria}</Badge>
                                    </DialogTitle>
                                    <DialogDescription>
                                        NIT: {proveedor.nit} • {proveedor.correo}
                                    </DialogDescription>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                                    <Pencil className="h-4 w-4" /> Editar
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                                        <X className="h-4 w-4" /> Cancelar
                                    </Button>
                                    <Button variant="default" size="sm" onClick={form.handleSubmit(async (values) => {
                                        try {
                                            const updated = { ...proveedor, ...values };
                                            await updateProveedor(updated);
                                            toast({ title: "Proveedor Actualizado", description: "Los cambios se guardaron correctamente." });
                                            setIsEditing(false);
                                        } catch (error) {
                                            toast({ title: "Error", description: "No se pudo actualizar el proveedor.", variant: "destructive" });
                                        }
                                    })} className="gap-2" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Guardar
                                    </Button>
                                </div>
                            )}
                            <div className="text-right ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Total Comprado</p>
                                <p className="text-xl font-bold text-primary">{formatCurrency(stats?.totalPurchased || 0)}</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Resumen y Finanzas</TabsTrigger>
                        <TabsTrigger value="history">Historial de Pedidos</TabsTrigger>
                        <TabsTrigger value="analytics">Análisis de Precios</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-2 p-1">
                        <TabsContent value="overview" className="space-y-4">
                            {isEditing ? (
                                <Form {...form}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="nombre" render={({ field }) => (
                                            <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="nit" render={({ field }) => (
                                            <FormItem><FormLabel>NIT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="correo" render={({ field }) => (
                                            <FormItem><FormLabel>Correo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="categoria" render={({ field }) => (
                                            <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="datosBancarios" render={({ field }) => (
                                            <FormItem className="col-span-2"><FormLabel>Datos Bancarios</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="notas" render={({ field }) => (
                                            <FormItem className="col-span-2"><FormLabel>Notas / Proyecto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </Form>
                            ) : (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats?.orderCount}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-red-600">{formatCurrency(stats?.totalPending || 0)}</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-medium">Top Material</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm font-bold truncate" title={stats?.topItemName}>{stats?.topItemName}</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between py-2">
                                            <CardTitle className="text-base">Datos Bancarios</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{proveedor.datosBancarios || "No registrado"}</p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between py-2">
                                            <CardTitle className="text-base">Notas / Proyecto</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{proveedor.notas || "Sin notas registradas"}</p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="history">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Órdenes de Compra</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Número</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Items</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats?.orders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell>{new Date(order.fechaEmision).toLocaleDateString()}</TableCell>
                                                    <TableCell className="font-medium">{order.numero}</TableCell>
                                                    <TableCell>{formatCurrency(order.total)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{order.estado}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-xs max-w-[200px] truncate" title={order.items.map(i => i.descripcion).join(", ")}>
                                                        {order.items.length} items ({order.items[0]?.descripcion}...)
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!stats?.orders.length) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">Sin registro de compras</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4">
                            <div className="flex justify-end">
                                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                    <SelectTrigger className="w-[280px]">
                                        <SelectValue placeholder="Seleccionar producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Más Frecuente ({stats?.topItemName})</SelectItem>
                                        {stats?.allProducts.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" /> Variación de Precios: {stats?.currentProductName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={stats?.trendData}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                                <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                                                <YAxis fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Histórico de compras del ítem seleccionado.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="catalog" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Catálogo de Productos Suministrados</CardTitle>
                                    <CardDescription>Items vinculados a este proveedor o comprados históricamente</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead className="text-right">Ult. Costo</TableHead>
                                                <TableHead className="text-right">Stock Actual</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stats?.catalogItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                        No hay items asociados en el inventario.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                stats?.catalogItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                        <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                        <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                                                        <TableCell className="text-right">{formatCurrency(item.costoMateriales || item.valorUnitario)}</TableCell>
                                                        <TableCell className="text-right font-medium">{item.cantidad} {item.unidad}</TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

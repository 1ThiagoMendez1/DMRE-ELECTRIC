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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { useErp } from "@/components/providers/erp-provider";
import { TrendingUp, Pencil, Save, X, Loader2, ExternalLink, CreditCard, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip
} from "recharts";
import { MovimientoFinanciero, CuentaPorPagar } from "@/types/sistema";

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

const normNit = (nit?: string) => (nit || "").replace(/[^0-9a-zA-Z]/g, "").toLowerCase().trim();
const normText = (txt?: string) => (txt || "").toLowerCase().trim();

export function SupplierDetailDialog({ open, onOpenChange, proveedor }: SupplierDetailDialogProps) {
    const {
        ordenesCompra,
        cuentasPorPagar,
        inventario,
        movimientosFinancieros,
        comprasFinanciera,
        cotizacionesProveedor,
        cuentasBancarias,
        updateProveedor
    } = useErp();
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
        if (!proveedor) return null;

        const provNit = normNit(proveedor.nit);
        const provName = normText(proveedor.nombre);

        // 1. Matching Orders
        const matchingOrders = (ordenesCompra || []).filter(o => {
            if (o.proveedorId && o.proveedorId === proveedor.id) return true;
            if (o.proveedor?.id && o.proveedor.id === proveedor.id) return true;
            if (provNit && normNit(o.proveedor?.nit) === provNit) return true;
            if (provName && normText(o.proveedor?.nombre) === provName) return true;
            return false;
        });

        // 2. Matching Bills (CXP)
        const matchingBills = (cuentasPorPagar || []).filter(c => {
            if (c.proveedorId && c.proveedorId === proveedor.id) return true;
            if (c.proveedor?.id && c.proveedor.id === proveedor.id) return true;
            if (provNit && normNit(c.proveedor?.nit) === provNit) return true;
            if (provName && normText(c.proveedor?.nombre) === provName) return true;
            return false;
        });

        // 3. Matching Compras Financiera
        const matchingCompras = (comprasFinanciera || []).filter(c => {
            const cp = c.cotizacionProveedor;
            if (cp?.proveedorId && cp.proveedorId === proveedor.id) return true;
            if (cp?.proveedor?.id && cp.proveedor.id === proveedor.id) return true;
            if (provNit && normNit(cp?.proveedor?.nit) === provNit) return true;
            if (provName && normText(cp?.proveedor?.nombre) === provName) return true;
            return false;
        });

        // 4. Matching Cotizaciones Proveedor
        const matchingCotizaciones = (cotizacionesProveedor || []).filter(cp => {
            if (cp.proveedorId && cp.proveedorId === proveedor.id) return true;
            if (cp.proveedor?.id && cp.proveedor.id === proveedor.id) return true;
            if (provNit && normNit(cp.proveedor?.nit) === provNit) return true;
            if (provName && normText(cp.proveedor?.nombre) === provName) return true;
            return false;
        });

        // 5. Matching Movements (Movimientos Financieros)
        const matchingMovements = (movimientosFinancieros || []).filter(m => {
            const mNit = normNit(m.identificacion);
            if (provNit && mNit && mNit === provNit) return true;

            const mTercero = normText(m.tercero);
            if (provName && mTercero && (mTercero === provName || mTercero.includes(provName) || provName.includes(mTercero))) return true;

            const mConcepto = normText(m.concepto);
            if (provName && mConcepto && mConcepto.includes(provName)) return true;

            if (m.cuentaPorPagarId && matchingBills.some(b => b.id === m.cuentaPorPagarId)) return true;
            if (m.compraId && matchingCompras.some(c => c.id === m.compraId)) return true;

            return false;
        });

        // Totals calculation
        const ordersTotal = matchingOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        const comprasTotal = matchingCompras.reduce((acc, curr) => acc + (Number(curr.valorFactura) || 0), 0);
        const egresoMovements = matchingMovements.filter(m => m.tipo === 'EGRESO');

        const unlinkedMovements = egresoMovements.filter(m =>
            !matchingCompras.some(c => c.id === m.compraId) &&
            !matchingBills.some(b => b.id === m.cuentaPorPagarId)
        );
        const unlinkedMovementsTotal = unlinkedMovements.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

        const totalPurchased = (ordersTotal > 0 || comprasTotal > 0)
            ? Math.max(ordersTotal, comprasTotal) + unlinkedMovementsTotal
            : egresoMovements.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);

        const billsPending = matchingBills.reduce((acc, curr) => acc + (Number(curr.saldoPendiente) || 0), 0);
        const comprasPending = matchingCompras.reduce((acc, curr) => acc + Math.max(0, (Number(curr.valorFactura) || 0) - (Number(curr.valorPago) || 0)), 0);
        const totalPending = billsPending + comprasPending;

        const orderCount = matchingOrders.length > 0
            ? matchingOrders.length + unlinkedMovements.length
            : matchingMovements.length + matchingCompras.length;

        // Item & Price Analysis
        const itemFrequency: Record<string, number> = {};
        const itemHistory: Record<string, { date: string, price: number, source: string }[]> = {};
        const allProductsSet = new Set<string>();

        const addItemPoint = (name: string, price: number, dateVal: string | Date, source: string) => {
            if (!name || price === undefined || price === null || isNaN(price)) return;
            const cleanName = name.trim();
            if (!cleanName) return;
            allProductsSet.add(cleanName);

            if (!itemFrequency[cleanName]) itemFrequency[cleanName] = 0;
            itemFrequency[cleanName]++;

            if (!itemHistory[cleanName]) itemHistory[cleanName] = [];
            const d = new Date(dateVal);
            const dateStr = !isNaN(d.getTime())
                ? d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                : String(dateVal);

            itemHistory[cleanName].push({
                date: dateStr,
                price: Number(price),
                source
            });
        };

        // Items from orders
        matchingOrders.forEach(order => {
            order.items?.forEach(item => {
                addItemPoint(item.descripcion, item.valorUnitario, order.fechaEmision, `OC ${order.numero}`);
            });
        });

        // Items from supplier quotes
        matchingCotizaciones.forEach(cp => {
            cp.items?.forEach(item => {
                addItemPoint(item.descripcion, item.valorUnitarioOfrecido ?? 0, cp.fecha, `Cot. ${cp.numero}`);
            });
        });

        // Concepts from movements
        egresoMovements.forEach(m => {
            addItemPoint(m.concepto || "Compra / Pago Suministro", m.valor, m.fecha, "Movimiento Financiero");
        });

        // Invoices from compras
        matchingCompras.forEach(c => {
            addItemPoint(`Factura ${c.numeroFactura || c.id}`, c.valorFactura, c.fecha, "Compra Financiera");
        });

        // Catalog Logic
        const catalogItems = inventario ? inventario.filter(i =>
            (i.proveedorId && i.proveedorId === proveedor.id) ||
            matchingOrders.some(o => o.items?.some(oi => oi.descripcion === i.descripcion || oi.inventarioId === i.id)) ||
            matchingCotizaciones.some(cp => cp.items?.some(ci => ci.descripcion === i.descripcion || ci.inventarioId === i.id)) ||
            (provName && normText(i.descripcion).includes(provName))
        ) : [];

        catalogItems.forEach(i => {
            if (i.costoMateriales || i.valorUnitario) {
                addItemPoint(i.descripcion, i.costoMateriales || i.valorUnitario, i.fechaCreacion, "Inventario");
            }
        });

        // Sort items by frequency
        const topItem = Object.entries(itemFrequency).sort((a, b) => b[1] - a[1])[0];
        const defaultProduct = topItem ? topItem[0] : "";
        const currentProduct = selectedProduct === "default" ? defaultProduct : selectedProduct;
        const trendData = currentProduct ? (itemHistory[currentProduct] || []) : [];

        return {
            totalPurchased,
            totalPending,
            orderCount,
            orders: matchingOrders,
            bills: matchingBills,
            movements: matchingMovements,
            compras: matchingCompras,
            trendData,
            topItemName: topItem ? topItem[0] : "N/A",
            currentProductName: currentProduct,
            allProducts: Array.from(allProductsSet).sort(),
            catalogItems
        };
    }, [proveedor, ordenesCompra, cuentasPorPagar, inventario, movimientosFinancieros, comprasFinanciera, cotizacionesProveedor, selectedProduct]);

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
                                <p className="text-xs font-medium text-muted-foreground uppercase">Total Comprado</p>
                                <p className="text-xl font-bold text-primary">{formatCurrency(stats?.totalPurchased || 0)}</p>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                        <TabsTrigger value="overview">Resumen y Finanzas</TabsTrigger>
                        <TabsTrigger value="history">Historial y Movimientos</TabsTrigger>
                        <TabsTrigger value="analytics">Análisis de Precios</TabsTrigger>
                        <TabsTrigger value="catalog">Catálogo ({stats?.catalogItems.length || 0})</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-2 p-1">
                        {/* TAB 1: OVERVIEW */}
                        <TabsContent value="overview" className="space-y-4">
                            {isEditing ? (
                                <Form {...form}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            <FormItem className="col-span-1 md:col-span-2"><FormLabel>Datos Bancarios</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="notas" render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2"><FormLabel>Notas / Proyecto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                </Form>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Operaciones</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{stats?.orderCount || 0}</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {(stats?.orders.length || 0)} pedidos • {(stats?.movements.length || 0)} movimientos
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Saldo Pendiente</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={`text-2xl font-bold ${(stats?.totalPending || 0) > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                                    {formatCurrency(stats?.totalPending || 0)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {(stats?.bills.length || 0)} cuentas por pagar
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Facturado / Pagos</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-primary">
                                                    {formatCurrency(stats?.totalPurchased || 0)}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Acumulado registrado</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Top Material / Concepto</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm font-bold truncate" title={stats?.topItemName}>
                                                    {stats?.topItemName}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">Ítem más recurrente</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between py-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                Datos Bancarios
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-foreground font-mono bg-muted/40 p-2.5 rounded-md">
                                                {proveedor.datosBancarios || "No registrado"}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between py-3">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                Notas / Proyecto
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {proveedor.notas || "Sin notas registradas"}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </TabsContent>

                        {/* TAB 2: HISTORIAL Y MOVIMIENTOS */}
                        <TabsContent value="history" className="space-y-4">
                            <Tabs defaultValue={stats?.movements?.length ? "movimientos" : (stats?.orders?.length ? "ordenes" : "movimientos")} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 max-w-md">
                                    <TabsTrigger value="movimientos" className="text-xs">
                                        Movimientos ({stats?.movements.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="ordenes" className="text-xs">
                                        Órdenes ({stats?.orders.length || 0})
                                    </TabsTrigger>
                                    <TabsTrigger value="cxp" className="text-xs">
                                        CXP / Facturas ({stats?.bills.length || 0})
                                    </TabsTrigger>
                                </TabsList>

                                {/* SUB-TAB MOVIMIENTOS */}
                                <TabsContent value="movimientos" className="mt-3">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Movimientos de Tesorería Registrados</CardTitle>
                                            <CardDescription>Egresos y transacciones financieras asociadas al proveedor</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Fecha</TableHead>
                                                        <TableHead>Tipo</TableHead>
                                                        <TableHead>Concepto</TableHead>
                                                        <TableHead>Cuenta</TableHead>
                                                        <TableHead className="text-right">IVA</TableHead>
                                                        <TableHead className="text-right">Valor</TableHead>
                                                        <TableHead className="text-center">Soporte</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(!stats?.movements || stats.movements.length === 0) ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                                                                Sin movimientos financieros registrados para este proveedor.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        stats.movements.map((mov: MovimientoFinanciero) => {
                                                            const cuentaName = cuentasBancarias.find(c => c.id === mov.cuentaId)?.nombre || mov.cuenta?.nombre || "Cuenta Bancaria";
                                                            const d = new Date(mov.fecha);
                                                            const dateFormatted = !isNaN(d.getTime())
                                                                ? d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
                                                                : String(mov.fecha);

                                                            return (
                                                                <TableRow key={mov.id}>
                                                                    <TableCell className="text-sm font-medium">{dateFormatted}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={mov.tipo === "EGRESO" ? "destructive" : "default"}>
                                                                            {mov.tipo}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="max-w-[240px] truncate text-sm" title={mov.concepto}>
                                                                        {mov.concepto || "Sin concepto"}
                                                                    </TableCell>
                                                                    <TableCell className="text-sm text-muted-foreground">{cuentaName}</TableCell>
                                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                                        {formatCurrency(mov.iva || 0)}
                                                                    </TableCell>
                                                                    <TableCell className={`text-right font-bold text-sm ${mov.tipo === "EGRESO" ? "text-red-500" : "text-emerald-500"}`}>
                                                                        {mov.tipo === "EGRESO" ? `-${formatCurrency(mov.valor)}` : `+${formatCurrency(mov.valor)}`}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {mov.comprobanteUrl ? (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0"
                                                                                onClick={() => window.open(mov.comprobanteUrl, "_blank")}
                                                                                title="Ver Comprobante"
                                                                            >
                                                                                <ExternalLink className="h-4 w-4 text-primary" />
                                                                            </Button>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">-</span>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* SUB-TAB ORDENES */}
                                <TabsContent value="ordenes" className="mt-3">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Órdenes de Compra</CardTitle>
                                            <CardDescription>Historial de pedidos formales emitidos</CardDescription>
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
                                                    {(!stats?.orders || stats.orders.length === 0) ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                                                Sin órdenes de compra registradas.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        stats.orders.map(order => (
                                                            <TableRow key={order.id}>
                                                                <TableCell>{new Date(order.fechaEmision).toLocaleDateString("es-CO")}</TableCell>
                                                                <TableCell className="font-medium">{order.numero}</TableCell>
                                                                <TableCell className="font-bold">{formatCurrency(order.total)}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="secondary">{order.estado}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs max-w-[200px] truncate" title={order.items?.map(i => i.descripcion).join(", ")}>
                                                                    {order.items?.length || 0} items ({order.items?.[0]?.descripcion || "Varios"}...)
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* SUB-TAB CXP */}
                                <TabsContent value="cxp" className="mt-3">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Cuentas por Pagar y Facturas</CardTitle>
                                            <CardDescription>Saldos pendientes y facturas vinculadas</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Fecha</TableHead>
                                                        <TableHead>Factura No.</TableHead>
                                                        <TableHead>Concepto</TableHead>
                                                        <TableHead className="text-right">Total</TableHead>
                                                        <TableHead className="text-right">Pagado</TableHead>
                                                        <TableHead className="text-right">Saldo Pendiente</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(!stats?.bills || stats.bills.length === 0) ? (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                                                                Sin cuentas por pagar registradas.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        stats.bills.map((bill: CuentaPorPagar) => (
                                                            <TableRow key={bill.id}>
                                                                <TableCell>{new Date(bill.fecha).toLocaleDateString("es-CO")}</TableCell>
                                                                <TableCell className="font-medium">{bill.numeroFacturaProveedor || "S/N"}</TableCell>
                                                                <TableCell className="max-w-[200px] truncate">{bill.concepto || "Sin concepto"}</TableCell>
                                                                <TableCell className="text-right">{formatCurrency(bill.valorTotal)}</TableCell>
                                                                <TableCell className="text-right text-emerald-500 font-medium">{formatCurrency(bill.valorPagado)}</TableCell>
                                                                <TableCell className="text-right text-red-500 font-bold">{formatCurrency(bill.saldoPendiente)}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant={bill.saldoPendiente <= 0 ? "secondary" : "destructive"}>
                                                                        {bill.saldoPendiente <= 0 ? "PAGADO" : "PENDIENTE"}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </TabsContent>

                        {/* TAB 3: ANÁLISIS DE PRECIOS */}
                        <TabsContent value="analytics" className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                    Seleccione un ítem o concepto para visualizar la fluctuación de precios histórica.
                                </p>
                                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                    <SelectTrigger className="w-full sm:w-[320px]">
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
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Variación de Precios: <span className="font-semibold text-primary">{stats?.currentProductName || "Sin selección"}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(!stats?.trendData || stats.trendData.length === 0) ? (
                                        <div className="h-[220px] w-full flex flex-col items-center justify-center border border-dashed rounded-lg text-muted-foreground p-6 text-center">
                                            <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                            <p className="font-medium text-foreground text-sm">Sin registro histórico de precios para este ítem</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Los precios se registran automáticamente con los movimientos, compras y pedidos asociados.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="h-[260px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={stats.trendData}>
                                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                                        <XAxis dataKey="date" fontSize={11} tickMargin={8} />
                                                        <YAxis fontSize={11} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="price"
                                                            stroke="#2563eb"
                                                            strokeWidth={2}
                                                            dot={{ r: 5, fill: "#2563eb" }}
                                                            activeDot={{ r: 7 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Data Breakdown Table */}
                                            <div className="mt-4 border rounded-md overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Fecha</TableHead>
                                                            <TableHead>Concepto / Ítem</TableHead>
                                                            <TableHead>Origen</TableHead>
                                                            <TableHead className="text-right">Precio / Valor</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {stats.trendData.map((item, idx) => (
                                                            <TableRow key={idx}>
                                                                <TableCell className="text-sm font-medium">{item.date}</TableCell>
                                                                <TableCell className="text-sm">{stats.currentProductName}</TableCell>
                                                                <TableCell className="text-sm">
                                                                    <Badge variant="outline">{item.source}</Badge>
                                                                </TableCell>
                                                                <TableCell className="text-sm text-right font-bold text-primary">
                                                                    {formatCurrency(item.price)}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 4: CATÁLOGO */}
                        <TabsContent value="catalog" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Catálogo de Productos Suministrados</CardTitle>
                                    <CardDescription>Ítems vinculados al proveedor en inventario o comprados históricamente</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Descripción</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead className="text-right">Últ. Costo</TableHead>
                                                <TableHead className="text-right">Stock Actual</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(!stats?.catalogItems || stats.catalogItems.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                        No hay ítems asociados directamente en el inventario para este proveedor.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                stats.catalogItems.map(item => (
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

"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Package,
    Truck,
    Car,
    HardHat,
    LayoutDashboard,
    Box,
    AlertTriangle,
    Mail,
    Receipt,
    Wrench,
    Fuel,
    Search,
    ListOrdered
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import {
    initialInventory,
    initialProveedores,
    initialVehiculos,
    initialDotacionItems,
    initialEntregasDotacion,
    initialGastosVehiculos,
    initialCuentasPorPagar,
    initialQuotes,
    initialEmpleados,
    initialCodigosTrabajo
} from "@/lib/mock-data";
import { CodigoTrabajo } from "@/types/sistema";

// Import submodule components
import { InventoryTable } from "../inventario/inventory-table";
import { CreateSupplierDialog } from "@/components/erp/create-supplier-dialog";
import { SupplierDetailDialog } from "@/components/erp/supplier-detail-dialog";
import { DotacionDetailDialog } from "@/components/erp/dotacion-detail-dialog";
import { NewEntregaDialog } from "@/components/erp/new-entrega-dialog";
import { SuministroDashboard } from "@/components/erp/suministro-dashboard";
import { ActivosDashboard } from "@/components/erp/activos-dashboard";
import { DotacionMetricsDashboard } from "@/components/erp/dotacion-metrics-dashboard";
import { DotacionItem } from "@/types/sistema";
import { CreateVehicleDialog } from "@/components/erp/create-vehicle-dialog";
import { RegisterExpenseDialog } from "@/components/erp/register-expense-dialog";
import { CreateInventoryItemDialog } from "@/components/erp/create-inventory-item-dialog";
import { EditInventoryDialog } from "@/components/erp/edit-inventory-dialog";
import { InventoryItemDetailDialog } from "@/components/erp/inventory-item-detail-dialog";
import { VehicleDetailDialog } from "@/components/erp/vehicle-detail-dialog";
import { EditVehicleDialog } from "@/components/erp/edit-vehicle-dialog";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

import { AlertConfigDialog } from "@/components/erp/alert-config-dialog";
import { AlertsBanner } from "@/components/erp/alerts-banner";
import { WorkCodesTable } from "@/components/erp/work-codes-table";
import { CuentasPorPagarDashboard } from "@/components/erp/cuentas-por-pagar-dashboard";

export default function LogisticaPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("resumen");

    // Context Integration
    const {
        inventario: catalogoItems, // Alias mapping
        proveedores,
        cuentasPorPagar,
        vehiculos,
        dotacionItems,
        entregasDotacion: entregas,
        gastosVehiculos: gastos,
        empleados, // Fetch real employees
        addProveedor,
        addVehiculo,
        addGastoVehiculo,
        updateCuentaPorPagar,
        addEntregaDotacion,
        updateDotacionItem,
        addInventarioItem,
        updateInventarioItem,
        updateEntregaDotacion,
        ordenesCompra,
        cuentasBancarias // Correct property name
    } = useErp();

    // Sub-tabs for Suministro
    const [suministroTab, setSuministroTab] = useState("resumen");
    // Sub-tabs for Activos
    const [activosTab, setActivosTab] = useState("resumen");

    // Local UI State
    const [selectedDotacionItem, setSelectedDotacionItem] = useState<DotacionItem | null>(null);
    const [dotacionDetailOpen, setDotacionDetailOpen] = useState(false);
    const [dotacionSearch, setDotacionSearch] = useState("");
    const [dotacionFilter, setDotacionFilter] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [itemDetailOpen, setItemDetailOpen] = useState(false);

    // Supplier State
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [supplierDetailOpen, setSupplierDetailOpen] = useState(false);

    // Vehicle State
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [vehicleDetailOpen, setVehicleDetailOpen] = useState(false);

    const handleItemClick = (item: any) => {
        setSelectedItem(item);
        setItemDetailOpen(true);
    };

    // Actions Wrapper (Connecting Dialogs to Context)
    const handleCreateSupplier = (newProv: any) => addProveedor(newProv);
    const handleCreateVehicle = (newVeh: any) => addVehiculo(newVeh);
    const handleCreateExpense = (newExpense: any, cuentaId?: string) => addGastoVehiculo(newExpense, cuentaId);

    // Custom Logic for Payment (Context has universal update, we need specific logic)
    // Custom Logic for Payment (Context has universal update, we need specific logic)
    const handleRegisterPayment = (id: string, amount: number) => {
        const item = cuentasPorPagar.find(c => c.id === id);
        if (item) {
            const newBalance = Math.max(0, item.saldoPendiente - amount);
            const newPaid = item.valorPagado + amount;
            updateCuentaPorPagar({ ...item, valorPagado: newPaid, saldoPendiente: newBalance });
            toast({ title: "Pago Registrado", description: `Se ha registrado un pago de ${formatCurrency(amount)}.` });
        }
    };

    // KPIs (Calculated from Context Data)
    const totalInventoryValue = catalogoItems.reduce((acc, item) => acc + item.valorTotal, 0);
    const lowStockItems = catalogoItems.filter(i => i.cantidad <= (i.stockMinimo || 10)).length;
    const totalProveedores = proveedores.length;
    const totalVehiculos = vehiculos.length;
    const totalDotacion = dotacionItems.length;
    const totalDeuda = cuentasPorPagar.reduce((acc, cxp) => acc + cxp.saldoPendiente, 0);
    const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Logística e Inventarios</h1>
                    <p className="text-muted-foreground">Centro de gestión de bienes, suministros y activos.</p>
                </div>
                <AlertConfigDialog />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="catalogo" className="gap-2"><ListOrdered className="h-4 w-4" /> Catálogo de Inventario</TabsTrigger>
                    <TabsTrigger value="inventario" className="gap-2"><Package className="h-4 w-4" /> Códigos de Trabajo</TabsTrigger>
                    <TabsTrigger value="suministro" className="gap-2"><Truck className="h-4 w-4" /> Suministro</TabsTrigger>
                    <TabsTrigger value="dotacion" className="gap-2"><HardHat className="h-4 w-4" /> Dotación</TabsTrigger>
                    <TabsTrigger value="activos" className="gap-2"><Car className="h-4 w-4" /> Activos</TabsTrigger>
                </TabsList>

                {/* RESUMEN TAB */}
                <TabsContent value="resumen" className="space-y-6">
                    {/* Alerts Banner */}
                    <AlertsBanner />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
                                <Box className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                                <p className="text-xs text-muted-foreground">{catalogoItems.length} items registrados</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{lowStockItems}</div>
                                <p className="text-xs text-muted-foreground">Artículos requieren reposición</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
                                <Truck className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalProveedores}</div>
                                <p className="text-xs text-muted-foreground">Deuda: {formatCurrency(totalDeuda)}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Flota Vehicular</CardTitle>
                                <Car className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalVehiculos}</div>
                                <p className="text-xs text-muted-foreground">Gastos: {formatCurrency(totalGastos)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <button onClick={() => setActiveTab("inventario")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Package className="h-5 w-5 text-primary" />
                                    <span>Gestionar Inventario</span>
                                </button>
                                <button onClick={() => setActiveTab("suministro")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Truck className="h-5 w-5 text-blue-500" />
                                    <span>Ver Proveedores</span>
                                </button>
                                <button onClick={() => setActiveTab("activos")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Car className="h-5 w-5 text-green-500" />
                                    <span>Flota y Documentación</span>
                                </button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Estado General</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Inventario</span>
                                        <span className="text-sm font-medium text-green-600">Operativo</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Dotación EPP</span>
                                        <span className="text-sm font-medium text-green-600">{totalDotacion} items</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* CATALOGO DE INVENTARIO TAB */}
                <TabsContent value="catalogo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Catálogo de Inventario</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nombre o SKU..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <CreateInventoryItemDialog onItemCreated={addInventarioItem} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Marca</TableHead>
                                        <TableHead>Modelo</TableHead>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Ubicación</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Precio Proveedor</TableHead>
                                        <TableHead className="text-right">Precio de Venta</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {catalogoItems
                                        .filter(item =>
                                            item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            item.sku.toLowerCase().includes(searchTerm.toLowerCase())
                                        )
                                        .map((item) => {
                                            const stockStatus = item.cantidad <= item.stockMinimo ? 'BAJO' : 'OK';
                                            // const precioProveedor = item.costoMateriales || Math.round(item.valorUnitario * 0.7);
                                            const precioProveedor = item.precioProveedor || item.costoMateriales || 0;
                                            const proveedorInfo = proveedores.find(p => p.id === item.proveedorId);
                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => handleItemClick(item)}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                    <TableCell className="text-xs">{item.marca || '-'}</TableCell>
                                                    <TableCell className="text-xs">{item.modelo || '-'}</TableCell>
                                                    <TableCell>
                                                        {proveedorInfo ? (
                                                            <span className="text-xs text-muted-foreground">{proveedorInfo.nombre}</span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                                                    <TableCell>{item.ubicacion}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span>{item.cantidad} {item.unidad}</span>
                                                            {stockStatus === 'BAJO' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="w-[100px]">
                                                            <Progress value={(item.cantidad / (item.stockMinimo * 3)) * 100} className={cn("h-2", stockStatus === 'BAJO' ? "bg-orange-200" : "")} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">{formatCurrency(precioProveedor)}</TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(item.valorUnitario)}</TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <EditInventoryDialog articulo={item} onItemUpdated={updateInventarioItem} />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CÓDIGOS DE TRABAJO TAB */}
                <TabsContent value="inventario" className="space-y-4">
                    <WorkCodesTable />
                </TabsContent>

                {/* SUMINISTRO TAB - WITH SUB-TABS */}
                <TabsContent value="suministro" className="space-y-4">
                    <Tabs value={suministroTab} onValueChange={setSuministroTab}>
                        <TabsList>
                            <TabsTrigger value="resumen">Resumen</TabsTrigger>
                            <TabsTrigger value="proveedores">Directorio Proveedores</TabsTrigger>
                            <TabsTrigger value="cxp">Cuentas por Pagar</TabsTrigger>
                        </TabsList>

                        {/* Suministro - Resumen */}
                        <TabsContent value="resumen" className="space-y-4 mt-4">
                            <SuministroDashboard proveedores={proveedores} cuentasPorPagar={cuentasPorPagar} ordenesCompra={ordenesCompra} />
                        </TabsContent>

                        {/* Suministro - Proveedores */}
                        <TabsContent value="proveedores" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Directorio de Proveedores</CardTitle>
                                        <CreateSupplierDialog onSupplierCreated={handleCreateSupplier} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Proveedor</TableHead>
                                                <TableHead>Categoría</TableHead>
                                                <TableHead>NIT</TableHead>
                                                <TableHead>Contacto</TableHead>
                                                <TableHead>Datos Bancarios</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="cursor-pointer">
                                            {proveedores.map((prov) => (
                                                <TableRow key={prov.id} className="hover:bg-muted/50" onClick={() => {
                                                    setSelectedSupplier(prov);
                                                    setSupplierDetailOpen(true);
                                                }}>
                                                    <TableCell className="font-medium">{prov.nombre}</TableCell>
                                                    <TableCell><Badge variant="secondary">{prov.categoria}</Badge></TableCell>
                                                    <TableCell>{prov.nit}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <Mail className="h-3 w-3" /> {prov.correo}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{prov.datosBancarios}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm">Ver Detalle</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                            {selectedSupplier && (
                                <SupplierDetailDialog
                                    open={supplierDetailOpen}
                                    onOpenChange={setSupplierDetailOpen}
                                    proveedor={selectedSupplier}
                                />
                            )}
                        </TabsContent>

                        {/* Suministro - Cuentas por Pagar */}
                        {/* Suministro - Cuentas por Pagar */}
                        <TabsContent value="cxp" className="mt-4">
                            <CuentasPorPagarDashboard
                                cuentas={cuentasPorPagar}
                                proveedores={proveedores}
                                onRegisterPayment={handleRegisterPayment}
                            />
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* DOTACION TAB */}
                {/* DOTACION TAB */}
                <TabsContent value="dotacion" className="space-y-4">
                    {/* Metrics Dashboard */}
                    <DotacionMetricsDashboard dotacionItems={dotacionItems} entregas={entregas} />

                    {/* Actions Bar */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {dotacionItems.length} tipos de dotación
                            </Badge>
                        </div>
                        <NewEntregaDialog
                            items={dotacionItems}
                            empleados={empleados}
                            onSave={(ent) => {
                                addEntregaDotacion(ent);
                                const updatedItems = dotacionItems.map(item => {
                                    if (item.id === ent.items[0].dotacionId) {
                                        const newItem = {
                                            ...item,
                                            variantes: item.variantes.map(v =>
                                                v.id === ent.items[0].varianteId
                                                    ? { ...v, cantidadDisponible: v.cantidadDisponible - ent.items[0].cantidad }
                                                    : v
                                            )
                                        };
                                        updateDotacionItem(newItem);
                                        return newItem;
                                    }
                                    return item;
                                });
                                toast({
                                    title: "Dotación Asignada",
                                    description: "La dotación deberá ser aceptada por el empleado antes de marcarse como entregada."
                                });
                            }}
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* INVENTORY PANEL - LEFT */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" /> Inventario Disponible
                                </CardTitle>
                                <div className="relative mt-2">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar dotación..."
                                        className="pl-8 h-9"
                                        value={dotacionSearch}
                                        onChange={(e) => setDotacionSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dotacionItems
                                            .filter(item => item.descripcion.toLowerCase().includes(dotacionSearch.toLowerCase()))
                                            .map((item) => {
                                                const totalStock = item.variantes.reduce((acc, v) => acc + v.cantidadDisponible, 0);
                                                const stockMin = item.stockMinimo || 10;
                                                const stockStatus = totalStock <= stockMin
                                                    ? 'critical'
                                                    : totalStock <= stockMin * 2
                                                        ? 'warning'
                                                        : 'ok';

                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => {
                                                            setSelectedDotacionItem(item);
                                                            setDotacionDetailOpen(true);
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg">
                                                                    {item.categoria === 'EPP' ? '🦺' : item.categoria === 'UNIFORME' ? '👔' : '🔧'}
                                                                </span>
                                                                <div>
                                                                    <div className="font-medium text-sm">{item.descripcion}</div>
                                                                    <div className="text-xs text-muted-foreground">{item.genero}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-[10px]">{item.categoria}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className={cn(
                                                                "font-bold",
                                                                stockStatus === 'ok' && "text-primary",
                                                                stockStatus === 'warning' && "text-amber-500",
                                                                stockStatus === 'critical' && "text-red-400"
                                                            )}>
                                                                {totalStock}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* HISTORY PANEL - RIGHT */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <HardHat className="h-5 w-5" /> Historial de Entregas
                                </CardTitle>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['Todos', 'Pendientes', 'Aceptados', 'Entregados'].map((filter) => (
                                        <Badge
                                            key={filter}
                                            variant={dotacionFilter === filter ? 'default' : 'outline'}
                                            className="cursor-pointer text-[10px]"
                                            onClick={() => setDotacionFilter(filter)}
                                        >
                                            {filter}
                                        </Badge>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Empleado</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Detalle</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {entregas
                                            .filter(e => {
                                                if (dotacionFilter === 'Pendientes') return e.estado === 'ASIGNADO';
                                                if (dotacionFilter === 'Aceptados') return e.estado === 'ACEPTADO';
                                                if (dotacionFilter === 'Entregados') return e.estado === 'ENTREGADO';
                                                return true;
                                            })
                                            .slice(0, 12)
                                            .map((entrega) => {
                                                const estadoLabel = {
                                                    'ASIGNADO': 'Pendiente de aceptación',
                                                    'ACEPTADO': 'Listo para entrega',
                                                    'ENTREGADO': 'Entrega confirmada',
                                                    'RECHAZADO': 'Rechazado',
                                                    'DEVUELTO': 'Devuelto'
                                                }[entrega.estado] || entrega.estado;

                                                return (
                                                    <TableRow key={entrega.id}>
                                                        <TableCell className="font-medium text-sm">{entrega.empleado.nombreCompleto}</TableCell>
                                                        <TableCell className="text-xs">{format(entrega.fecha, "dd MMM", { locale: es })}</TableCell>
                                                        <TableCell className="text-xs max-w-[150px] truncate">{entrega.items[0].descripcion}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge
                                                                    variant={entrega.estado === 'ENTREGADO' ? 'default' : entrega.estado === 'ACEPTADO' ? 'secondary' : 'outline'}
                                                                    className="text-[9px]"
                                                                >
                                                                    {estadoLabel}
                                                                </Badge>
                                                                {entrega.estado === 'ACEPTADO' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        className="h-6 text-[10px] px-2"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateEntregaDotacion(entrega.id, { estado: 'ENTREGADO' });
                                                                            toast({
                                                                                title: "Entrega Confirmada",
                                                                                description: "Se ha registrado la entrega física."
                                                                            });
                                                                        }}
                                                                    >
                                                                        Confirmar Entrega
                                                                    </Button>
                                                                )}
                                                                {entrega.estado === 'ASIGNADO' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-6 text-[10px] px-2"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            updateEntregaDotacion(entrega.id, { estado: 'ACEPTADO' });
                                                                            toast({
                                                                                title: "Recepción Confirmada",
                                                                                description: "El empleado ha aceptado la dotación."
                                                                            });
                                                                        }}
                                                                    >
                                                                        Confirmar recepción
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    {selectedDotacionItem && (
                        <DotacionDetailDialog
                            open={dotacionDetailOpen}
                            onOpenChange={setDotacionDetailOpen}
                            item={selectedDotacionItem}
                            historialEntregas={entregas.filter(e => e.items.some(i => i.dotacionId === selectedDotacionItem.id))}
                            onUpdateItem={(updated) => {
                                updateDotacionItem(updated);
                            }}
                        />
                    )}
                </TabsContent>

                {/* ACTIVOS TAB - WITH SUB-TABS */}
                <TabsContent value="activos" className="space-y-4">
                    <Tabs value={activosTab} onValueChange={setActivosTab}>
                        <TabsList>
                            <TabsTrigger value="resumen">Resumen</TabsTrigger>
                            <TabsTrigger value="flota">Flota y Documentación</TabsTrigger>
                            <TabsTrigger value="bitacora">Bitácora de Gastos</TabsTrigger>
                        </TabsList>

                        {/* Activos - Resumen */}
                        <TabsContent value="resumen" className="space-y-4 mt-4">
                            <ActivosDashboard vehiculos={vehiculos} gastos={gastos} />
                        </TabsContent>

                        {/* Activos - Flota */}
                        <TabsContent value="flota" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>Flota Vehicular</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Gestión completa de vehículos y documentación
                                            </p>
                                        </div>
                                        <CreateVehicleDialog onVehicleCreated={handleCreateVehicle} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Placa</TableHead>
                                                <TableHead>Vehículo</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Conductor</TableHead>
                                                <TableHead>SOAT</TableHead>
                                                <TableHead>Tecno</TableHead>
                                                <TableHead className="text-right">Gastos</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vehiculos.map((veh) => {
                                                const vehicleGastos = gastos.filter(g => g.vehiculoId === veh.id);
                                                const totalVehicleGastos = vehicleGastos.reduce((acc, g) => acc + g.valor, 0);

                                                // Document status semaphore
                                                const getDocSemaphore = (date: Date) => {
                                                    const days = differenceInDays(new Date(date), new Date());
                                                    if (days < 0) return { color: 'bg-red-500', variant: 'destructive' as const };
                                                    if (days <= 30) return { color: 'bg-amber-500', variant: 'secondary' as const };
                                                    if (days <= 60) return { color: 'bg-yellow-500', variant: 'outline' as const };
                                                    return { color: 'bg-green-500', variant: 'default' as const };
                                                };

                                                const soatStatus = getDocSemaphore(veh.vencimientoSoat);
                                                const tecnoStatus = getDocSemaphore(veh.vencimientoTecnomecanica);

                                                return (
                                                    <TableRow
                                                        key={veh.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => {
                                                            setSelectedVehicle(veh);
                                                            setVehicleDetailOpen(true);
                                                        }}
                                                    >
                                                        <TableCell className="font-bold">{veh.placa}</TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <div className="text-sm">{veh.marcaModelo}</div>
                                                                <div className="text-xs text-muted-foreground">{veh.ano} • {veh.color}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={veh.estado === 'OPERATIVO' ? 'default' : veh.estado === 'MANTENIMIENTO' ? 'secondary' : 'outline'}>
                                                                {veh.estado}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{veh.conductorAsignado || 'Sin asignar'}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-2 h-2 rounded-full ${soatStatus.color}`} />
                                                                <Badge variant={soatStatus.variant} className="text-[10px]">
                                                                    {format(veh.vencimientoSoat, "dd/MM/yy", { locale: es })}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-2 h-2 rounded-full ${tecnoStatus.color}`} />
                                                                <Badge variant={tecnoStatus.variant} className="text-[10px]">
                                                                    {format(veh.vencimientoTecnomecanica, "dd/MM/yy", { locale: es })}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(totalVehicleGastos)}</TableCell>
                                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <EditVehicleDialog
                                                                    vehiculo={veh}
                                                                    onVehicleUpdated={(updated) => {
                                                                        // Would use updateVehiculo from context if available
                                                                        toast({ title: "Vehículo actualizado", description: updated.placa });
                                                                    }}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                    onClick={() => {
                                                                        setSelectedVehicle(veh);
                                                                        setVehicleDetailOpen(true);
                                                                    }}
                                                                >
                                                                    👁️
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Vehicle Detail Dialog */}
                            <VehicleDetailDialog
                                open={vehicleDetailOpen}
                                onOpenChange={setVehicleDetailOpen}
                                vehiculo={selectedVehicle}
                                gastos={gastos}
                            />
                        </TabsContent>

                        {/* Activos - Bitácora */}
                        <TabsContent value="bitacora" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Bitácora de Gastos</CardTitle>
                                        <RegisterExpenseDialog
                                            vehiculos={vehiculos}
                                            cuentas={cuentasBancarias}
                                            onExpenseCreated={handleCreateExpense}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Vehículo</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Proveedor</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {gastos.map((gasto) => (
                                                <TableRow key={gasto.id}>
                                                    <TableCell>{format(gasto.fecha, "dd MMM yy", { locale: es })}</TableCell>
                                                    <TableCell className="font-medium">{gasto.vehiculo.placa}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="gap-1">
                                                            {gasto.tipo === 'COMBUSTIBLE' && <Fuel className="h-3 w-3" />}
                                                            {gasto.tipo === 'MANTENIMIENTO' && <Wrench className="h-3 w-3" />}
                                                            {gasto.tipo}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{gasto.proveedor || gasto.tipo}</TableCell>
                                                    <TableCell className="text-right font-mono">{formatCurrency(gasto.valor)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
            </Tabs>

            <InventoryItemDetailDialog
                open={itemDetailOpen}
                onOpenChange={setItemDetailOpen}
                item={selectedItem}
                onItemUpdated={updateInventarioItem}
            />
        </div>
    );
}

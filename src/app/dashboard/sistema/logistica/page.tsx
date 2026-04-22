"use client";

import { useState, useMemo, useEffect } from "react";
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
    ListOrdered,
    Bolt,
    Edit,
    Hammer,
    TrendingUp,
    ChevronDown,
    ChevronRight
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
import { CodigoTrabajo, InventarioItem, Cotizacion } from "@/types/sistema";

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
import { EditWorkCodeDialog } from "@/components/erp/edit-work-code-dialog";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

import { AlertConfigDialog } from "@/components/erp/alert-config-dialog";
import { AlertsBanner } from "@/components/erp/alerts-banner";
import { WorkCodesTable } from "@/components/erp/work-codes-table";
import { InstalacionesTable } from "@/components/erp/instalaciones-table";
import { CuentasPorPagarDashboard } from "@/components/erp/cuentas-por-pagar-dashboard";
import { MaterialDetailConsumoDialog } from "@/components/erp/material-detail-consumo-dialog";
import { getTrabajosListAction } from "@/app/dashboard/sistema/inventario/trabajos-list-action";
import { ServiciosTable } from "@/components/erp/servicios/servicios-table";
import {
    getServiciosAction,
    createServicioAction,
    updateServicioAction,
    deleteServicioAction
} from "./servicios-actions";
import { ServicioLogistica } from "@/types/sistema";

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
        cuentasBancarias,
        consumosResumen,
        addConsumoMaterial,
        refreshConsumosResumen,
        codigosTrabajo,
        cotizaciones
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
    const [materialDetailOpen, setMaterialDetailOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<InventarioItem | null>(null);
    const [trabajosList, setTrabajosList] = useState<{ id: string; nombre: string; codigo: string }[]>([]);
    const [editWorkCode, setEditWorkCode] = useState<any>(null);

    // Servicios State
    const [servicios, setServicios] = useState<ServicioLogistica[]>([]);
    // Ejecucion tab search
    const [ejecucionSearch, setEjecucionSearch] = useState("");
    const [expandedProyecto, setExpandedProyecto] = useState<string | null>(null);

    // Supplier State
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [supplierDetailOpen, setSupplierDetailOpen] = useState(false);

    // Vehicle State
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [vehicleDetailOpen, setVehicleDetailOpen] = useState(false);

    const ITEMS_PER_PAGE = 50;
    const [pageMateriales, setPageMateriales] = useState(1);
    const [pageProveedores, setPageProveedores] = useState(1);
    const [pageDotacionInv, setPageDotacionInv] = useState(1);
    const [pageDotacionHist, setPageDotacionHist] = useState(1);
    const [pageVehiculos, setPageVehiculos] = useState(1);
    const [pageGastos, setPageGastos] = useState(1);
    const [pageEjecucion, setPageEjecucion] = useState(1);

    const handleItemClick = (item: any) => {
        setSelectedMaterial(item);
        setMaterialDetailOpen(true);
    };

    // Load trabajos list for consumo dialogs
    useEffect(() => {
        getTrabajosListAction().then(setTrabajosList).catch(console.error);
        getServiciosAction().then(setServicios).catch(console.error);
    }, []);

    const materialesFiltrados = useMemo(() => {
        const extractSuCode = (item: any) => {
            let raw = (item.codigo || item.sku || item.item || '').toUpperCase().trim();
            if (raw.startsWith('SU')) return raw;
            const match = (item.descripcion || '').toUpperCase().match(/SU-?\s*\d+/);
            if (match) return match[0].replace(/\s+/g, '');
            return '';
        };

        return [
            ...catalogoItems.filter(i => extractSuCode(i) !== '').map(i => ({ 
                ...i, 
                sku: extractSuCode(i), 
                item: extractSuCode(i), 
                isTrabajo: false, 
                originalCode: undefined 
            })),
            ...codigosTrabajo.filter(c => extractSuCode(c) !== '').map(c => ({
                id: c.id,
                sku: extractSuCode(c),
                item: extractSuCode(c),
                descripcion: c.descripcion || (c as any).nombre || '',
                marca: '-',
                proveedorId: '',
                categoria: 'SUMINISTRO',
                unidad: 'UND',
                cantidad: 0,
                tipo: 'COMPUESTO' as const,
                valorUnitario: c.costoTotal,
                valorTotal: c.costoTotal,
                precioProveedor: c.costoTotal,
                costoMateriales: c.costoTotal,
                fechaCreacion: c.fechaCreacion,
                isTrabajo: true,
                originalCode: c
            }))
        ]
        .sort((a, b) => {
            const codeA = a.sku || '';
            const codeB = b.sku || '';
            const numA = parseInt(codeA.replace(/\D/g, '')) || 0;
            const numB = parseInt(codeB.replace(/\D/g, '')) || 0;
            if (numA !== numB) return numB - numA; // Descending sequential
            return codeA.localeCompare(codeB);
        })
        .filter(item =>
            item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [catalogoItems, codigosTrabajo, searchTerm]);

    const handleCreateServicio = async (srv: Omit<ServicioLogistica, "id" | "codigo" | "createdAt">) => {
        const nuevo = await createServicioAction(srv);
        setServicios(prev => [nuevo, ...prev]);
    };

    const handleUpdateServicio = async (id: string, srv: Partial<ServicioLogistica>) => {
        const updated = await updateServicioAction(id, srv);
        setServicios(prev => prev.map(s => s.id === id ? updated : s));
    };

    const handleDeleteServicio = async (id: string) => {
        await deleteServicioAction(id);
        setServicios(prev => prev.filter(s => s.id !== id));
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
                    <TabsTrigger value="catalogo" className="gap-2"><ListOrdered className="h-4 w-4" /> Materiales</TabsTrigger>
                    <TabsTrigger value="inventario" className="gap-2"><Package className="h-4 w-4" /> Suministro</TabsTrigger>
                    <TabsTrigger value="servicios" className="gap-2"><Wrench className="h-4 w-4" /> Servicios</TabsTrigger>
                    <TabsTrigger value="instalaciones" className="gap-2"><Bolt className="h-4 w-4" /> Instalaciones</TabsTrigger>
                    <TabsTrigger value="suministro" className="gap-2"><Truck className="h-4 w-4" /> Proveedores</TabsTrigger>
                    <TabsTrigger value="dotacion" className="gap-2"><HardHat className="h-4 w-4" /> Dotación</TabsTrigger>
                    <TabsTrigger value="activos" className="gap-2"><Car className="h-4 w-4" /> Activos</TabsTrigger>
                    <TabsTrigger value="ejecucion" className="gap-2"><Hammer className="h-4 w-4" /> Ejecución</TabsTrigger>
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

                <TabsContent value="catalogo" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Materiales</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nombre o SKU..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setPageMateriales(1); }}
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
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Unidad</TableHead>
                                        <TableHead className="text-right">Total Consumido</TableHead>
                                        <TableHead className="text-right">Precio Proveedor</TableHead>
                                        <TableHead className="text-right">Precio de Venta</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {materialesFiltrados.slice((pageMateriales - 1) * ITEMS_PER_PAGE, pageMateriales * ITEMS_PER_PAGE).map((item) => {
                                            const precioProveedor = item.precioProveedor || item.costoMateriales || 0;
                                            const proveedorInfo = proveedores.find(p => p.id === item.proveedorId);
                                            const totalConsumido = consumosResumen[item.id] || 0;
                                            return (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => handleItemClick(item)}
                                                >
                                                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                    <TableCell className="text-xs">{item.marca || '-'}</TableCell>
                                                    <TableCell>
                                                        {proveedorInfo ? (
                                                            <span className="text-xs text-muted-foreground">{proveedorInfo.nombre}</span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                                                    <TableCell className="text-xs">{item.unidad}</TableCell>
                                                    <TableCell className="text-right">
                                                        {totalConsumido > 0 ? (
                                                            <Badge variant="secondary" className="font-medium">
                                                                {totalConsumido.toLocaleString("es-CO")} {item.unidad}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">0</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">{formatCurrency(precioProveedor)}</TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{formatCurrency(item.valorUnitario)}</TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        {item.isTrabajo ? (
                                                            <Button variant="ghost" size="icon" onClick={() => setEditWorkCode(item.originalCode)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        ) : (
                                                            <EditInventoryDialog articulo={item as InventarioItem} onItemUpdated={updateInventarioItem} />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {materialesFiltrados.length === 0 ? 0 : Math.min((pageMateriales - 1) * ITEMS_PER_PAGE + 1, materialesFiltrados.length)} - {Math.min(pageMateriales * ITEMS_PER_PAGE, materialesFiltrados.length)} de {materialesFiltrados.length} ítems
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => setPageMateriales(p => Math.max(1, p - 1))} disabled={pageMateriales === 1}>Anterior</Button>
                                    <Button variant="outline" size="sm" onClick={() => setPageMateriales(p => p + 1)} disabled={pageMateriales >= Math.ceil(materialesFiltrados.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <MaterialDetailConsumoDialog
                        open={materialDetailOpen}
                        onOpenChange={setMaterialDetailOpen}
                        material={selectedMaterial}
                        totalConsumido={selectedMaterial ? (consumosResumen[selectedMaterial.id] || 0) : 0}
                        trabajos={trabajosList}
                        onConsumoRegistered={addConsumoMaterial}
                        onConsumoDeleted={refreshConsumosResumen}
                    />

                    {editWorkCode && (
                        <EditWorkCodeDialog
                            code={editWorkCode}
                            open={!!editWorkCode}
                            onClose={() => setEditWorkCode(null)}
                        />
                    )}
                </TabsContent>

                {/* SUMINISTRO TAB */}
                <TabsContent value="inventario" className="space-y-4">
                    <WorkCodesTable />
                </TabsContent>

                {/* SERVICIOS TAB */}
                <TabsContent value="servicios" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Catálogo de Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ServiciosTable
                                servicios={servicios}
                                onCreateServicio={handleCreateServicio}
                                onUpdateServicio={handleUpdateServicio}
                                onDeleteServicio={handleDeleteServicio}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* INSTALACIONES TAB */}
                <TabsContent value="instalaciones" className="space-y-4">
                    <InstalacionesTable />
                </TabsContent>

                {/* PROVEEDORES TAB - WITH SUB-TABS */}
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
                                            {proveedores.slice((pageProveedores - 1) * ITEMS_PER_PAGE, pageProveedores * ITEMS_PER_PAGE).map((prov) => (
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
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Mostrando {proveedores.length === 0 ? 0 : Math.min((pageProveedores - 1) * ITEMS_PER_PAGE + 1, proveedores.length)} - {Math.min(pageProveedores * ITEMS_PER_PAGE, proveedores.length)} de {proveedores.length} ítems
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setPageProveedores(p => Math.max(1, p - 1))} disabled={pageProveedores === 1}>Anterior</Button>
                                            <Button variant="outline" size="sm" onClick={() => setPageProveedores(p => p + 1)} disabled={pageProveedores >= Math.ceil(proveedores.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                        </div>
                                    </div>
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
                                        onChange={(e) => { setDotacionSearch(e.target.value); setPageDotacionInv(1); }}
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
                                            .slice((pageDotacionInv - 1) * ITEMS_PER_PAGE, pageDotacionInv * ITEMS_PER_PAGE)
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
                                {(() => {
                                    const filteredDotacion = dotacionItems.filter(item => item.descripcion.toLowerCase().includes(dotacionSearch.toLowerCase()));
                                    return (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {filteredDotacion.length === 0 ? 0 : Math.min((pageDotacionInv - 1) * ITEMS_PER_PAGE + 1, filteredDotacion.length)} - {Math.min(pageDotacionInv * ITEMS_PER_PAGE, filteredDotacion.length)} de {filteredDotacion.length} ítems
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => setPageDotacionInv(p => Math.max(1, p - 1))} disabled={pageDotacionInv === 1}>Anterior</Button>
                                                <Button variant="outline" size="sm" onClick={() => setPageDotacionInv(p => p + 1)} disabled={pageDotacionInv >= Math.ceil(filteredDotacion.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                            .slice((pageDotacionHist - 1) * ITEMS_PER_PAGE, pageDotacionHist * ITEMS_PER_PAGE)
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
                                {(() => {
                                    const filteredEntregas = entregas.filter(e => {
                                        if (dotacionFilter === 'Pendientes') return e.estado === 'ASIGNADO';
                                        if (dotacionFilter === 'Aceptados') return e.estado === 'ACEPTADO';
                                        if (dotacionFilter === 'Entregados') return e.estado === 'ENTREGADO';
                                        return true;
                                    });
                                    return (
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {filteredEntregas.length === 0 ? 0 : Math.min((pageDotacionHist - 1) * ITEMS_PER_PAGE + 1, filteredEntregas.length)} - {Math.min(pageDotacionHist * ITEMS_PER_PAGE, filteredEntregas.length)} de {filteredEntregas.length} ítems
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => setPageDotacionHist(p => Math.max(1, p - 1))} disabled={pageDotacionHist === 1}>Anterior</Button>
                                                <Button variant="outline" size="sm" onClick={() => setPageDotacionHist(p => p + 1)} disabled={pageDotacionHist >= Math.ceil(filteredEntregas.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                            {vehiculos.slice((pageVehiculos - 1) * ITEMS_PER_PAGE, pageVehiculos * ITEMS_PER_PAGE).map((veh) => {
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
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Mostrando {vehiculos.length === 0 ? 0 : Math.min((pageVehiculos - 1) * ITEMS_PER_PAGE + 1, vehiculos.length)} - {Math.min(pageVehiculos * ITEMS_PER_PAGE, vehiculos.length)} de {vehiculos.length} ítems
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setPageVehiculos(p => Math.max(1, p - 1))} disabled={pageVehiculos === 1}>Anterior</Button>
                                            <Button variant="outline" size="sm" onClick={() => setPageVehiculos(p => p + 1)} disabled={pageVehiculos >= Math.ceil(vehiculos.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                        </div>
                                    </div>
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
                                            {gastos.slice((pageGastos - 1) * ITEMS_PER_PAGE, pageGastos * ITEMS_PER_PAGE).map((gasto) => (
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
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Mostrando {gastos.length === 0 ? 0 : Math.min((pageGastos - 1) * ITEMS_PER_PAGE + 1, gastos.length)} - {Math.min(pageGastos * ITEMS_PER_PAGE, gastos.length)} de {gastos.length} ítems
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => setPageGastos(p => Math.max(1, p - 1))} disabled={pageGastos === 1}>Anterior</Button>
                                            <Button variant="outline" size="sm" onClick={() => setPageGastos(p => p + 1)} disabled={pageGastos >= Math.ceil(gastos.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* EJECUCION TAB */}
                <TabsContent value="ejecucion" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center gap-2">
                                    <Hammer className="h-5 w-5 text-primary" />
                                    Análisis de Ejecución — Cantidades Ofertadas vs. Finales
                                </CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        placeholder="Buscar proyecto o cliente..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-background"
                                        value={ejecucionSearch}
                                        onChange={e => { setEjecucionSearch(e.target.value); setPageEjecucion(1); }}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(() => {
                                const proyectosEnEjecucion = (cotizaciones || []).filter(c =>
                                    c.items.some(i => i.cantidadFinal !== undefined || i.esExtra)
                                ).filter(c =>
                                    !ejecucionSearch ||
                                    c.numero.toLowerCase().includes(ejecucionSearch.toLowerCase()) ||
                                    c.cliente.nombre.toLowerCase().includes(ejecucionSearch.toLowerCase())
                                );

                                const paginatedProyectos = proyectosEnEjecucion.slice((pageEjecucion - 1) * ITEMS_PER_PAGE, pageEjecucion * ITEMS_PER_PAGE);

                                if (proyectosEnEjecucion.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                            <Hammer className="h-10 w-10 opacity-30" />
                                            <p className="text-sm">No hay proyectos con cantidades finales registradas.</p>
                                            <p className="text-xs">Ingrese cantidades finales en la pestaña Ejecución de cada proyecto aprobado.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col">
                                        <div className="divide-y">
                                            {paginatedProyectos.map(proyecto => {
                                                const isExpanded = expandedProyecto === proyecto.id;
                                            const origItems = proyecto.items.filter(i => !i.esExtra);
                                            const extraItems = proyecto.items.filter(i => i.esExtra);
                                            const totalOferta = origItems.reduce((acc, i) => acc + (i.valorUnitario || 0) * i.cantidad, 0);
                                            const totalFinal = origItems.reduce((acc, i) => {
                                                const cantF = i.cantidadFinal ?? i.cantidad;
                                                return acc + (i.valorUnitario || 0) * cantF;
                                            }, 0);
                                            const totalExtras = extraItems.reduce((acc, i) => acc + (i.valorUnitario || 0) * i.cantidad, 0);
                                            const variacion = totalFinal - totalOferta;

                                            return (
                                                <div key={proyecto.id} className="">
                                                    {/* Project header row */}
                                                    <button
                                                        className="w-full text-left p-4 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
                                                        onClick={() => setExpandedProyecto(isExpanded ? null : proyecto.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                            <div>
                                                                <p className="font-semibold text-sm">#{proyecto.numero} — {proyecto.cliente.nombre}</p>
                                                                <p className="text-xs text-muted-foreground">{proyecto.descripcionTrabajo}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-right shrink-0">
                                                            <div>
                                                                <p className="text-[10px] text-muted-foreground uppercase">Oferta</p>
                                                                <p className="text-sm font-mono">{formatCurrency(totalOferta)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-muted-foreground uppercase">Ejecutado</p>
                                                                <p className="text-sm font-mono font-semibold">{formatCurrency(totalFinal)}</p>
                                                            </div>
                                                            {variacion !== 0 && (
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase">Variación</p>
                                                                    <p className={`text-sm font-mono font-bold ${variacion > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                        {variacion > 0 ? '+' : ''}{formatCurrency(variacion)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {extraItems.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] text-muted-foreground uppercase">Extras</p>
                                                                    <p className="text-sm font-mono font-bold text-amber-600">+{formatCurrency(totalExtras)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>

                                                    {/* Expanded item rows */}
                                                    {isExpanded && (
                                                        <div className="bg-muted/20 border-t">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-muted/40">
                                                                        <TableHead className="text-xs py-2">Item</TableHead>
                                                                        <TableHead className="text-center text-xs py-2">Tipo</TableHead>
                                                                        <TableHead className="text-center text-xs py-2">Cant. Oferta</TableHead>
                                                                        <TableHead className="text-center text-xs py-2">Cant. Final</TableHead>
                                                                        <TableHead className="text-center text-xs py-2">Δ</TableHead>
                                                                        <TableHead className="text-right text-xs py-2">V. Unit.</TableHead>
                                                                        <TableHead className="text-right text-xs py-2">Δ Valor</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {proyecto.items.map(item => {
                                                                        const cantF = item.cantidadFinal ?? item.cantidad;
                                                                        const diff = cantF - item.cantidad;
                                                                        const deltaVal = diff * (item.valorUnitario || 0);
                                                                        return (
                                                                            <TableRow key={item.id} className={item.esExtra ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                                                                                <TableCell className="text-xs py-2">
                                                                                    {item.descripcion}
                                                                                    {item.esExtra && <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-1 rounded">EXTRA</span>}
                                                                                </TableCell>
                                                                                <TableCell className="text-center text-xs py-2 text-muted-foreground">{item.tipo === 'SERVICIO' ? 'Serv.' : 'Mat.'}</TableCell>
                                                                                <TableCell className="text-center text-xs py-2">{item.cantidad}</TableCell>
                                                                                <TableCell className="text-center text-xs py-2 font-semibold">{cantF}</TableCell>
                                                                                <TableCell className="text-center py-2">
                                                                                    {diff === 0 ? (
                                                                                        <span className="text-xs text-muted-foreground">—</span>
                                                                                    ) : (
                                                                                        <span className={`text-xs font-bold px-1 py-0.5 rounded ${
                                                                                            diff > 0
                                                                                                ? 'bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                                                                                                : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                                                                                        }`}>{diff > 0 ? '+' : ''}{diff}</span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="text-right text-xs py-2">{formatCurrency(item.valorUnitario || 0)}</TableCell>
                                                                                <TableCell className={`text-right text-xs font-mono font-semibold py-2 ${
                                                                                    diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-muted-foreground'
                                                                                }`}>
                                                                                    {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${formatCurrency(deltaVal)}`}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        </div>
                                        <div className="flex items-center justify-between mt-4 px-4 pb-4">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {proyectosEnEjecucion.length === 0 ? 0 : Math.min((pageEjecucion - 1) * ITEMS_PER_PAGE + 1, proyectosEnEjecucion.length)} - {Math.min(pageEjecucion * ITEMS_PER_PAGE, proyectosEnEjecucion.length)} de {proyectosEnEjecucion.length} ítems
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => setPageEjecucion(p => Math.max(1, p - 1))} disabled={pageEjecucion === 1}>Anterior</Button>
                                                <Button variant="outline" size="sm" onClick={() => setPageEjecucion(p => p + 1)} disabled={pageEjecucion >= Math.ceil(proyectosEnEjecucion.length / ITEMS_PER_PAGE)}>Siguiente</Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
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

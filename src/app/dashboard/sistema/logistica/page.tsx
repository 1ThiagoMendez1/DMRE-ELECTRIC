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
    Fuel
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
    initialInventory,
    initialProveedores,
    initialVehiculos,
    initialDotacionItems,
    initialEntregasDotacion,
    initialGastosVehiculos,
    initialCuentasPorPagar,
    initialQuotes,
    initialEmpleados
} from "@/lib/mock-data";

// Import submodule components
import { InventoryTable } from "../inventario/inventory-table";
import { CreateSupplierDialog } from "@/components/erp/create-supplier-dialog";
import { SupplierProfileDialog } from "@/components/erp/supplier-profile-dialog";
import { DotacionDetailDialog } from "@/components/erp/dotacion-detail-dialog";
import { NewEntregaDialog } from "@/components/erp/new-entrega-dialog";
import { SuministroDashboard } from "@/components/erp/suministro-dashboard";
import { ActivosDashboard } from "@/components/erp/activos-dashboard";
import { DotacionItem } from "@/types/sistema";
import { CreateVehicleDialog } from "@/components/erp/create-vehicle-dialog";
import { RegisterExpenseDialog } from "@/components/erp/register-expense-dialog";

export default function LogisticaPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("resumen");

    // Sub-tabs for Suministro
    const [suministroTab, setSuministroTab] = useState("resumen");
    // Sub-tabs for Activos
    const [activosTab, setActivosTab] = useState("resumen");

    // Suministro state
    const [proveedores, setProveedores] = useState(initialProveedores);
    const [cuentasPorPagar, setCuentasPorPagar] = useState(initialCuentasPorPagar);

    // Dotacion state
    const [entregas, setEntregas] = useState(initialEntregasDotacion);
    const [dotacionItems, setDotacionItems] = useState(initialDotacionItems);
    const [selectedDotacionItem, setSelectedDotacionItem] = useState<DotacionItem | null>(null);
    const [dotacionDetailOpen, setDotacionDetailOpen] = useState(false);

    // Activos state
    const [vehiculos, setVehiculos] = useState(initialVehiculos);
    const [gastos, setGastos] = useState(initialGastosVehiculos);

    const handleCreateSupplier = (newProv: any) => {
        setProveedores([newProv, ...proveedores]);
    };

    const handleCreateVehicle = (newVeh: any) => {
        setVehiculos([newVeh, ...vehiculos]);
    };

    const handleCreateExpense = (newExpense: any) => {
        setGastos([newExpense, ...gastos]);
    };

    const handleRegisterPayment = (id: string) => {
        setCuentasPorPagar(prev => prev.map(cxp => {
            if (cxp.id === id) {
                return { ...cxp, valorPagado: cxp.valorTotal, saldoPendiente: 0 };
            }
            return cxp;
        }));
    };

    // KPIs
    const totalInventoryValue = initialInventory.reduce((acc, item) => acc + item.valorTotal, 0);
    const lowStockItems = initialInventory.filter(i => i.cantidad <= 10).length;
    const totalProveedores = proveedores.length;
    const totalVehiculos = vehiculos.length;
    const totalDotacion = dotacionItems.length;
    const totalDeuda = cuentasPorPagar.reduce((acc, cxp) => acc + cxp.saldoPendiente, 0);
    const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Logística e Inventarios</h1>
                <p className="text-muted-foreground">Centro de gestión de bienes, suministros y activos.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="inventario" className="gap-2"><Package className="h-4 w-4" /> Inventario</TabsTrigger>
                    <TabsTrigger value="suministro" className="gap-2"><Truck className="h-4 w-4" /> Suministro</TabsTrigger>
                    <TabsTrigger value="dotacion" className="gap-2"><HardHat className="h-4 w-4" /> Dotación</TabsTrigger>
                    <TabsTrigger value="activos" className="gap-2"><Car className="h-4 w-4" /> Activos</TabsTrigger>
                </TabsList>

                {/* RESUMEN TAB */}
                <TabsContent value="resumen" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
                                <Box className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
                                <p className="text-xs text-muted-foreground">{initialInventory.length} items registrados</p>
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

                {/* INVENTARIO TAB */}
                <TabsContent value="inventario">
                    <InventoryTable data={initialInventory} cotizaciones={initialQuotes} />
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
                            <SuministroDashboard proveedores={proveedores} cuentasPorPagar={cuentasPorPagar} />
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
                                        <TableBody>
                                            {proveedores.map((prov) => (
                                                <TableRow key={prov.id}>
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
                                                        <SupplierProfileDialog proveedor={prov} />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Suministro - Cuentas por Pagar */}
                        <TabsContent value="cxp" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Facturas de Proveedores Pendientes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Proveedor</TableHead>
                                                <TableHead>Ref / Factura</TableHead>
                                                <TableHead>Concepto</TableHead>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Total</TableHead>
                                                <TableHead>Pagado</TableHead>
                                                <TableHead>Saldo</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cuentasPorPagar.map((cxp) => (
                                                <TableRow key={cxp.id}>
                                                    <TableCell className="font-medium">{cxp.proveedor.nombre}</TableCell>
                                                    <TableCell>{cxp.numeroFacturaProveedor}</TableCell>
                                                    <TableCell>{cxp.concepto}</TableCell>
                                                    <TableCell>{format(cxp.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                                    <TableCell>{formatCurrency(cxp.valorTotal)}</TableCell>
                                                    <TableCell>{formatCurrency(cxp.valorPagado)}</TableCell>
                                                    <TableCell className="font-bold text-red-600">{formatCurrency(cxp.saldoPendiente)}</TableCell>
                                                    <TableCell>
                                                        {cxp.saldoPendiente > 0 && (
                                                            <Button size="sm" variant="outline" onClick={() => handleRegisterPayment(cxp.id)}>Pagar</Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* DOTACION TAB */}
                {/* DOTACION TAB */}
                <TabsContent value="dotacion" className="space-y-4">
                    <div className="flex justify-end">
                        <NewEntregaDialog
                            items={dotacionItems}
                            empleados={initialEmpleados}
                            // Wait, previous file view showed initialEmpleados export in mock-data?
                            // Checking line 484 of mock-data: export const initialEmpleados = ...
                            // Logistica imports initialCuentasPorPagar, etc. Need to check if initialEmpleados is imported.
                            // I'll assume I need to import it or use a fallback. 
                            // Wait, I should make sure to import it in LogisticaPage if not present.
                            onSave={(ent) => {
                                setEntregas([ent, ...entregas]);
                                // Update Stock logic (decrease available)
                                const updatedItems = dotacionItems.map(item => {
                                    if (item.id === ent.items[0].dotacionId) {
                                        return {
                                            ...item,
                                            variantes: item.variantes.map(v =>
                                                v.id === ent.items[0].varianteId
                                                    ? { ...v, cantidadDisponible: v.cantidadDisponible - ent.items[0].cantidad }
                                                    : v
                                            )
                                        };
                                    }
                                    return item;
                                });
                                setDotacionItems(updatedItems);
                                toast({ title: "Entrega Registrada", description: "El empleado debe aceptar la entrega." });
                            }}
                        />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" /> Inventario Disponible
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Desc</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dotacionItems.map((item) => {
                                            const totalStock = item.variantes.reduce((acc, v) => acc + v.cantidadDisponible, 0);
                                            const tallas = Array.from(new Set(item.variantes.map(v => v.talla))).join(", ");
                                            return (
                                                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                                    setSelectedDotacionItem(item);
                                                    setDotacionDetailOpen(true);
                                                }}>
                                                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">
                                                        {tallas} ({item.genero})
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{totalStock}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <HardHat className="h-5 w-5" /> Historial Entregas
                                </CardTitle>
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
                                        {entregas.slice(0, 10).map((entrega) => (
                                            <TableRow key={entrega.id}>
                                                <TableCell className="font-medium text-sm">{entrega.empleado.nombreCompleto}</TableCell>
                                                <TableCell className="text-xs">{format(entrega.fecha, "dd MMM", { locale: es })}</TableCell>
                                                <TableCell className="text-xs">{entrega.items[0].descripcion} - {entrega.items[0].detalle}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={entrega.estado === 'ENTREGADO' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {entrega.estado}
                                                        </Badge>
                                                        {entrega.estado === 'ASIGNADO' && (
                                                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => {
                                                                setEntregas(entregas.map(e => e.id === entrega.id ? { ...e, estado: 'ENTREGADO', fechaAceptacion: new Date() } : e));
                                                                toast({ title: "Entrega Aceptada", description: "Se ha confirmado la recepción." });
                                                            }}>
                                                                Aceptar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
                                setDotacionItems(dotacionItems.map(i => i.id === updated.id ? updated : i));
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
                                        <CardTitle>Flota Vehicular</CardTitle>
                                        <CreateVehicleDialog onVehicleCreated={handleCreateVehicle} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Placa</TableHead>
                                                <TableHead>Vehículo</TableHead>
                                                <TableHead>Conductor</TableHead>
                                                <TableHead>SOAT</TableHead>
                                                <TableHead>Tecno</TableHead>
                                                <TableHead className="text-right">Gastos</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {vehiculos.map((veh) => {
                                                const vehicleGastos = gastos.filter(g => g.vehiculo.placa === veh.placa);
                                                const totalVehicleGastos = vehicleGastos.reduce((acc, g) => acc + g.valor, 0);
                                                return (
                                                    <TableRow key={veh.id}>
                                                        <TableCell className="font-bold">{veh.placa}</TableCell>
                                                        <TableCell>{veh.marcaModelo}</TableCell>
                                                        <TableCell>{veh.conductorAsignado || 'Sin asignar'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={new Date(veh.vencimientoSoat) < new Date() ? 'destructive' : 'secondary'}>
                                                                {format(veh.vencimientoSoat, "dd MMM yy", { locale: es })}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={new Date(veh.vencimientoTecnomecanica) < new Date() ? 'destructive' : 'secondary'}>
                                                                {format(veh.vencimientoTecnomecanica, "dd MMM yy", { locale: es })}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{formatCurrency(totalVehicleGastos)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Activos - Bitácora */}
                        <TabsContent value="bitacora" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Bitácora de Gastos</CardTitle>
                                        <RegisterExpenseDialog vehiculos={vehiculos} onExpenseCreated={handleCreateExpense} />
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
        </div>
    );
}

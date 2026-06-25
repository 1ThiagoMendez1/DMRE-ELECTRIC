"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    LayoutDashboard,
    Wallet,
    Landmark,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Download,
    Plus,
    CreditCard,
    DollarSign,
    PieChart,
    History,
    FileText,
    MoreHorizontal,
    Pencil,
    AlertTriangle,
    ShoppingCart
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CreateAccountDialog } from "@/components/erp/create-account-dialog";
import { CreateTransactionDialog } from "@/components/erp/create-transaction-dialog";
import { CuentaHistoryDialog } from "@/components/erp/cuenta-history-dialog";
import { EditAccountDialog } from "@/components/erp/edit-account-dialog";
import { MovimientoDetailDialog } from "@/components/erp/movimiento-detail-dialog";
import { CreateFacturaDialog } from "@/components/erp/create-factura-dialog";
import { FacturaHistoryDialog } from "@/components/erp/factura-history-dialog";
import { CreateObligacionDialog } from "@/components/erp/create-obligacion-dialog";
import { ObligacionDetailDialog } from "@/components/erp/obligacion-detail-dialog";

import { BillingModule } from "@/components/erp/billing-module";
import { ComprasModule } from "@/components/erp/compras-module";
import { ProjectProfitabilityModule } from "@/components/erp/project-profitability-module";

import { useToast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { CuentaBancaria, MovimientoFinanciero, ObligacionFinanciera } from "@/types/sistema";

export default function FinancieraPage() {
    const { toast } = useToast();
    const {
        cuentasBancarias: cuentas,
        movimientosFinancieros: movementsRaw,
        obligacionesFinancieras: obligaciones,
        addCuentaBancaria,
        updateCuentaBancaria,
        addMovimientoFinanciero,
        addObligacionFinanciera,
        updateObligacionFinanciera,
        cotizaciones,
        facturas
    } = useErp();

    // Filtros para Movimientos
    const [filterFecha, setFilterFecha] = useState("");
    const [filterTipo, setFilterTipo] = useState("TODOS");
    const [filterCategoria, setFilterCategoria] = useState("TODOS");
    const [filterCuenta, setFilterCuenta] = useState("TODOS");


    // Map movements to ensure it has valor/concepto if DB uses monto/descripcion
    const movimientos = movementsRaw.map(m => {
        let esSimple = false;
        if (m.trabajoId) {
            const cot = cotizaciones.find(c => c.id === m.trabajoId);
            if (cot?.tipo === 'SIMPLIFICADA') esSimple = true;
        } else if (m.facturaId) {
            const fac = facturas.find(f => f.id === m.facturaId);
            if (fac && fac.cotizacion?.tipo === 'SIMPLIFICADA') esSimple = true;
        }
        return {
            ...m,
            valor: m.valor || 0,
            concepto: m.concepto || m.descripcion || "Sin concepto",
            cuenta: m.cuenta || cuentas.find(c => c.id === m.cuentaId) || { nombre: "Cuenta Desconocida" },
            esSimple
        };
    }) as any[];

    // Filtro aplicado para Movimientos Generales
    const movimientosFiltrados = movimientos.filter(mov => {
        if (mov.esSimple) return false;
        const d = new Date(mov.fecha);
        const localD = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        if (filterFecha && format(localD, "yyyy-MM-dd") !== filterFecha) return false;
        if (filterTipo !== "TODOS" && mov.tipo !== filterTipo) return false;
        if (filterCategoria !== "TODOS" && mov.categoria !== filterCategoria) return false;
        if (filterCuenta !== "TODOS" && mov.cuentaId !== filterCuenta) return false;
        return true;
    });




    // --- LOGIC MOVED TO BILLING MODULE ---
    // nextInvoiceId, filteredFacturas, handlers, useEffect

    // Calculate next Invoice ID
    // const nextInvoiceId = useMemo(() => {
    //     if (facturas.length === 0) return "Fac-0001";
    //     const ids = facturas.map(f => {
    //         const num = parseInt(f.id.replace(/[^0-9]/g, ''));
    //         return isNaN(num) ? 0 : num;
    //     });
    //     const maxId = Math.max(0, ...ids);
    //     return `Fac-${String(maxId + 1).padStart(4, '0')}`;
    // }, [facturas]);

    // Check for Overdue Invoices
    // useEffect(() => {
    //     const today = new Date();
    //     const overdueCount = facturas.filter(f => {
    //         if (f.estado === 'CANCELADA') return false;
    //         return new Date(f.fechaVencimiento) < today;
    //     }).length;

    //     if (overdueCount > 0) {
    //         toast({
    //             title: "Atención: Facturas Vencidas",
    //             description: `Tienes ${overdueCount} facturas vencidas que requieren gestión.`,
    //             variant: "destructive",
    //         });
    //     }
    // }, [facturas, toast]);

    // const filteredFacturas = facturas.filter(f =>
    //     f.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    //     f.cotizacion?.cliente?.nombre.toLowerCase().includes(invoiceSearch.toLowerCase())
    // );

    // Calculate totals
    const totalSaldo = cuentas.reduce((acc, curr) => {
        if (curr.tipo === 'CREDITO') return acc - curr.saldoActual;
        return acc + curr.saldoActual;
    }, 0);
    const totalIngresos = movimientos
        .filter(m => m.tipo === 'INGRESO' && !m.esSimple)
        .reduce((acc, m) => acc + m.valor, 0);
    const totalEgresos = movimientos
        .filter(m => m.tipo === 'EGRESO' && !m.esSimple)
        .reduce((acc, m) => acc + m.valor, 0);



    const handleCreateAccount = (newAccount: CuentaBancaria) => {
        addCuentaBancaria(newAccount);
        toast({ title: "Cuenta creada", description: "La cuenta ha sido registrada exitosamente." });
    };

    const handleUpdateAccount = (updatedAccount: CuentaBancaria) => {
        updateCuentaBancaria(updatedAccount);
        toast({ title: "Cuenta actualizada", description: "Los datos de la cuenta han sido guardados." });
    };

    const handleCreateTransaction = (newTransaction: MovimientoFinanciero) => {
        addMovimientoFinanciero(newTransaction);
        toast({ title: "Transacción registrada", description: "El movimiento ha sido guardado exitosamente." });
    };

    const handleUpdateTransaction = (updatedMov: MovimientoFinanciero) => {
        // updateMovimientoFinanciero(updatedMov); // If exists
        toast({ title: "Movimiento actualizado", description: "Los detalles han sido guardados." });
    };

    const handleCreateObligacion = (newObligacion: ObligacionFinanciera) => {
        addObligacionFinanciera(newObligacion);
        toast({ title: "Obligación registrada", description: "El crédito ha sido guardado exitosamente." });
    };

    const handleUpdateObligacion = (updatedObl: ObligacionFinanciera) => {
        updateObligacionFinanciera(updatedObl);
        toast({ title: "Obligación actualizada", description: "Los cambios han sido guardados." });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Financiera</h2>
                    <p className="text-muted-foreground">Gestión de tesorería, bancos y obligaciones.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="cuentas" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="cuentas">Cuentas y Saldos</TabsTrigger>
                    <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
                    <TabsTrigger value="facturacion">Facturación</TabsTrigger>
                    <TabsTrigger value="obligaciones">Obligaciones</TabsTrigger>
                    <TabsTrigger value="compras">Compras</TabsTrigger>
                    <TabsTrigger value="rentabilidad">Análisis de Proyectos</TabsTrigger>

                </TabsList>

                {/* --- CUENTAS TAB --- */}
                <TabsContent value="cuentas" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(totalSaldo)}</div>
                                <p className="text-xs text-muted-foreground">+2.5% vs mes anterior</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos (Mes)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIngresos)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Egresos (Mes)</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalEgresos)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cuentas Activas</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{cuentas.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Cuentas Bancarias y Cajas</CardTitle>
                                <CreateAccountDialog onAccountCreated={handleCreateAccount} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre / Banco</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Número de Cuenta</TableHead>
                                        <TableHead className="text-right">Saldo Actual</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cuentas.map((account) => {
                                        const isCredit = account.tipo === 'CREDITO';
                                        return (
                                            <TableRow key={account.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {account.tipo === 'BANCO' ? <Landmark className="h-4 w-4 text-muted-foreground" /> : 
                                                         account.tipo === 'CREDITO' ? <CreditCard className="h-4 w-4 text-primary" /> :
                                                         <Wallet className="h-4 w-4 text-muted-foreground" />}
                                                        <div className="flex flex-col">
                                                            <span>{account.nombre}</span>
                                                            {account.banco && <span className="text-[10px] text-muted-foreground">{account.banco}</span>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(isCredit && "border-primary text-primary")}>
                                                        {account.tipo === 'CREDITO' ? 'CRÉDITO' : account.tipo}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    <div className="flex flex-col">
                                                        <span>{account.numeroCuenta || "N/A"}</span>
                                                        {isCredit && account.cupoTotal && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                Cupo: {formatCurrency(account.cupoTotal)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-bold", isCredit ? "text-red-600" : "text-green-600")}>
                                                    {formatCurrency(account.saldoActual)}
                                                    {isCredit && account.cupoTotal && (
                                                        <div className="text-[10px] font-normal text-muted-foreground">
                                                            Disp: {formatCurrency(account.cupoTotal - account.saldoActual)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <EditAccountDialog cuenta={account} onAccountUpdated={handleUpdateAccount} />
                                                        <CuentaHistoryDialog
                                                            cuenta={account}
                                                            movimientos={movimientos}
                                                            trigger={
                                                                <Button variant="ghost" size="icon" title="Ver Historial">
                                                                    <History className="h-4 w-4" />
                                                                </Button>
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Total en Bancos</div>
                                <div className="text-xl font-bold text-green-600">{formatCurrency(cuentas.filter(c => c.tipo === 'BANCO').reduce((a, c) => a + c.saldoActual, 0))}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Caja Menor</div>
                                <div className="text-xl font-bold text-amber-600">{formatCurrency(cuentas.filter(c => c.tipo === 'EFECTIVO').reduce((a, c) => a + c.saldoActual, 0))}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-red-500 bg-red-50/30">
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                    Pasivos / Crédito
                                </div>
                                <div className="text-xl font-bold text-red-600">
                                    {formatCurrency(cuentas.filter(c => c.tipo === 'CREDITO').reduce((a, c) => a + c.saldoActual, 0))}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-primary bg-primary/5">
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Total Disponible</div>
                                <div className="text-xl font-bold text-primary">{formatCurrency(totalSaldo)}</div>
                                <div className="text-[10px] text-muted-foreground">Activos - Pasivos</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- MOVIMIENTOS TAB --- */}
                <TabsContent value="movimientos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <CardTitle>Historial de Transacciones</CardTitle>
                                <CreateTransactionDialog 
                                    cuentas={cuentas} 
                                    cotizaciones={cotizaciones}
                                    onTransactionCreated={handleCreateTransaction} 
                                />
                            </div>
                            
                            {/* Barra de Filtros */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                                    <Input 
                                        type="date" 
                                        value={filterFecha} 
                                        onChange={(e) => setFilterFecha(e.target.value)} 
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                                    <select 
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={filterTipo}
                                        onChange={(e) => setFilterTipo(e.target.value)}
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="INGRESO">Ingreso</option>
                                        <option value="EGRESO">Egreso</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Categoría</label>
                                    <select 
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={filterCategoria}
                                        onChange={(e) => setFilterCategoria(e.target.value)}
                                    >
                                        <option value="TODOS">Todas</option>
                                        <option value="VENTAS">Ventas</option>
                                        <option value="NOMINA">Nómina</option>
                                        <option value="PROVEEDORES">Proveedores</option>
                                        <option value="SUMINISTRO">Suministro</option>
                                        <option value="INSTALACION">Instalación</option>
                                        <option value="SERVICIOS">Servicios</option>
                                        <option value="IMPUESTOS">Impuestos</option>
                                        <option value="OTROS">Otros</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Cuenta</label>
                                    <select 
                                        className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={filterCuenta}
                                        onChange={(e) => setFilterCuenta(e.target.value)}
                                    >
                                        <option value="TODOS">Todas las Cuentas</option>
                                        {cuentas.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Concepto / Tercero</TableHead>
                                        <TableHead>Cuenta</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-center">Detalle</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movimientosFiltrados.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No se encontraron movimientos con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {movimientosFiltrados.map((mov) => {
                                        const d = new Date(mov.fecha);
                                        const localD = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                                        return (
                                        <TableRow key={mov.id}>
                                            <TableCell>{format(localD, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>
                                                <Badge variant={mov.tipo === 'INGRESO' ? 'default' : 'secondary'} className={mov.tipo === 'EGRESO' ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'}>
                                                    {mov.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{mov.categoria?.toLowerCase() || 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{mov.concepto}</span>
                                                    <span className="text-xs text-muted-foreground">{mov.tercero}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{mov.cuenta?.nombre || 'N/A'}</TableCell>
                                            <TableCell className={cn("text-right font-medium", mov.tipo === 'INGRESO' ? "text-green-600" : "text-red-600")}>
                                                {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.valor)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <MovimientoDetailDialog
                                                    movimiento={mov}
                                                    onMovimientoUpdated={handleUpdateTransaction}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- OBLIGACIONES TAB --- */}
                <TabsContent value="obligaciones" className="space-y-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg shadow-sm border">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">Obligaciones Financieras</h3>
                            <p className="text-sm text-muted-foreground">Control de créditos y préstamos activos.</p>
                        </div>
                        <CreateObligacionDialog onObligacionCreated={handleCreateObligacion} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {obligaciones.map((obl) => {
                            const progress = ((obl.montoPrestado - obl.saldoCapital) / obl.montoPrestado) * 100;
                            return (
                                <Card key={obl.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-center">
                                            <ObligacionDetailDialog
                                                obligacion={obl}
                                                onObligacionUpdated={handleUpdateObligacion}
                                                trigger={
                                                    <span className="text-lg font-semibold hover:underline cursor-pointer flex items-center gap-2">
                                                        {obl.entidad}
                                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                    </span>
                                                }
                                            />
                                            <Badge variant="outline">{(obl.tasaInteres * 100).toFixed(1)}% E.A.</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Monto Original</p>
                                                <p className="font-medium">{formatCurrency(obl.montoPrestado)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-muted-foreground">Cuota Mensual</p>
                                                <p className="font-medium">{formatCurrency(obl.valorCuota)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>Progreso Pago</span>
                                                <span>{formatCurrency(obl.saldoCapital)} pendientes</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                            <ObligacionDetailDialog
                                                obligacion={obl}
                                                onObligacionUpdated={handleUpdateObligacion}
                                                trigger={
                                                    <Button variant="secondary" size="sm">
                                                        Ver Tabla Amortización
                                                    </Button>
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                {/* --- FACTURACION TAB --- */}
                <TabsContent value="facturacion" className="space-y-4">
                    <BillingModule />
                </TabsContent>

                <TabsContent value="compras" className="space-y-4">
                    <ComprasModule />
                </TabsContent>
                <TabsContent value="rentabilidad" className="space-y-4">
                    <ProjectProfitabilityModule />
                </TabsContent>


            </Tabs>
        </div>
    );
}

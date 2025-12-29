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
    Pencil
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

import { useToast } from "@/hooks/use-toast";
import { initialCuentas, initialMovimientos, initialFacturas, initialObligaciones } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { CuentaBancaria, MovimientoFinanciero, Factura, ObligacionFinanciera } from "@/types/sistema";

export default function FinancieraPage() {
    const { toast } = useToast();
    const [cuentas, setCuentas] = useState<CuentaBancaria[]>(initialCuentas);
    const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>(initialMovimientos);
    const [facturas, setFacturas] = useState<Factura[]>(initialFacturas);
    const [obligaciones, setObligaciones] = useState<ObligacionFinanciera[]>(initialObligaciones);
    const [invoiceSearch, setInvoiceSearch] = useState("");

    // Calculate next Invoice ID
    const nextInvoiceId = useMemo(() => {
        if (facturas.length === 0) return "Fac-0001";
        const ids = facturas.map(f => {
            const num = parseInt(f.id.replace(/[^0-9]/g, ''));
            return isNaN(num) ? 0 : num;
        });
        const maxId = Math.max(0, ...ids);
        return `Fac-${String(maxId + 1).padStart(4, '0')}`;
    }, [facturas]);

    const filteredFacturas = facturas.filter(f =>
        f.id.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        f.cotizacion?.cliente?.nombre.toLowerCase().includes(invoiceSearch.toLowerCase())
    );

    // Calculate totals
    const totalSaldo = cuentas.reduce((acc, curr) => acc + curr.saldoActual, 0);
    const totalIngresos = movimientos
        .filter(m => m.tipo === 'INGRESO')
        .reduce((acc, m) => acc + m.valor, 0);
    const totalEgresos = movimientos
        .filter(m => m.tipo === 'EGRESO')
        .reduce((acc, m) => acc + m.valor, 0);

    const handleCreateAccount = (newAccount: CuentaBancaria) => {
        setCuentas([...cuentas, newAccount]);
        toast({ title: "Cuenta creada", description: "La cuenta ha sido registrada exitosamente." });
    };

    const handleUpdateAccount = (updatedAccount: CuentaBancaria) => {
        setCuentas(cuentas.map(c => c.id === updatedAccount.id ? updatedAccount : c));
        toast({ title: "Cuenta actualizada", description: "Los datos de la cuenta han sido guardados." });
    };

    const handleCreateTransaction = (newTransaction: MovimientoFinanciero) => {
        setMovimientos([newTransaction, ...movimientos]);

        // Update account balance
        const updatedCuentas = cuentas.map(c => {
            if (c.id === newTransaction.cuenta.id) {
                const newBalance = newTransaction.tipo === 'INGRESO'
                    ? c.saldoActual + newTransaction.valor
                    : c.saldoActual - newTransaction.valor;
                return { ...c, saldoActual: newBalance };
            }
            return c;
        });
        setCuentas(updatedCuentas);

        toast({ title: "Transacción registrada", description: "El movimiento ha sido guardado exitosamente." });
    };

    const handleUpdateTransaction = (updatedMov: MovimientoFinanciero) => {
        setMovimientos(movimientos.map(m => m.id === updatedMov.id ? updatedMov : m));
        // Note: Logic to revert old balance and apply new one is complex, skipping for MVP UI demo
        toast({ title: "Movimiento actualizado", description: "Los detalles han sido guardados." });
    }

    const handleInvoiceUpdate = (updatedInvoice: Factura) => {
        setFacturas(facturas.map(f => f.id === updatedInvoice.id ? updatedInvoice : f));
        // toast handles in component usually, but good to have here
    };

    const handleCreateInvoice = (newInvoice: Factura) => {
        setFacturas([newInvoice, ...facturas]);
        toast({ title: "Factura Creada", description: "Nueva factura registrada en el sistema." });
    };

    const handleCreateObligacion = (newObligacion: ObligacionFinanciera) => {
        setObligaciones([...obligaciones, newObligacion]);
        toast({ title: "Obligación registrada", description: "Nuevo crédito añadido." });
    };

    const handleUpdateObligacion = (updatedObl: ObligacionFinanciera) => {
        setObligaciones(obligaciones.map(o => o.id === updatedObl.id ? updatedObl : o));
        toast({ title: "Obligación actualizada", description: "Cambios guardados." });
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
                                    {cuentas.map((account) => (
                                        <TableRow key={account.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {account.tipo === 'BANCO' ? <Landmark className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                                                    {account.nombre}
                                                    {account.banco && <span className="text-xs text-muted-foreground">({account.banco})</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{account.tipo}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{account.numeroCuenta || "N/A"}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(account.saldoActual)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <EditAccountDialog cuenta={account} onAccountUpdated={handleUpdateAccount} />
                                                    <CuentaHistoryDialog
                                                        cuenta={account}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" title="Ver Historial">
                                                                <History className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-3">
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
                        <Card className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground">Saldo Total</div>
                                <div className="text-xl font-bold">{formatCurrency(totalSaldo)}</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- MOVIMIENTOS TAB --- */}
                <TabsContent value="movimientos" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Historial de Transacciones</CardTitle>
                                <CreateTransactionDialog cuentas={cuentas} onTransactionCreated={handleCreateTransaction} />
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
                                    {movimientos.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell>{format(mov.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>
                                                <Badge variant={mov.tipo === 'INGRESO' ? 'default' : 'secondary'} className={mov.tipo === 'EGRESO' ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'}>
                                                    {mov.tipo}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{mov.categoria.toLowerCase()}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{mov.concepto}</span>
                                                    <span className="text-xs text-muted-foreground">{mov.tercero}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{mov.cuenta.nombre}</TableCell>
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
                                    ))}
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
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <CardTitle>Gestión de Facturación y Cartera</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar factura o cliente..."
                                            className="pl-8"
                                            value={invoiceSearch}
                                            onChange={(e) => setInvoiceSearch(e.target.value)}
                                        />
                                    </div>
                                    <CreateFacturaDialog onFacturaCreated={handleCreateInvoice} nextId={nextInvoiceId} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>N° Factura</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Emisión</TableHead>
                                        <TableHead>Vencimiento</TableHead>
                                        <TableHead>Valor Total</TableHead>
                                        <TableHead>Saldo Pendiente</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFacturas.map((fac) => (
                                        <TableRow key={fac.id}>
                                            <TableCell className="font-mono font-bold">{fac.id}</TableCell>
                                            <TableCell>{fac.cotizacion?.cliente?.nombre || "Cliente General"}</TableCell>
                                            <TableCell>{format(new Date(fac.fechaEmision), "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>{format(new Date(fac.fechaVencimiento), "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>{formatCurrency(fac.valorFacturado)}</TableCell>
                                            <TableCell className="font-bold text-red-500">{formatCurrency(fac.saldoPendiente)}</TableCell>
                                            <TableCell>
                                                <Badge variant={fac.estado === 'CANCELADA' ? 'default' : fac.estado === 'PARCIAL' ? 'secondary' : 'destructive'}>
                                                    {fac.estado}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <FacturaHistoryDialog
                                                    factura={fac}
                                                    onFacturaUpdated={handleInvoiceUpdate}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="text-xs">
                                                            Gestionar
                                                        </Button>
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

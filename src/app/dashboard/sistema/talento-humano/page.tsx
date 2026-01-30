"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users,
    Briefcase,
    CalendarDays,
    Banknote,
    UserPlus,
    LayoutDashboard as LayoutDashboardIcon,
    Search,
    FileText,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { DynamicChart, DashboardPanel } from "@/components/erp/charts";
import { DateRange } from "react-day-picker";
import { startOfYear, endOfYear, isWithinInterval } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency } from "@/lib/utils";
import { CreateEmployeeDialog } from "@/components/erp/create-employee-dialog";
import { RegisterNovedadDialog } from "@/components/erp/register-novedad-dialog";
import { Empleado, LiquidacionNomina, NovedadNomina } from "@/types/sistema";
import { PayrollDetailDialog } from "@/components/erp/payroll-detail-dialog";
import { EmployeeDetailDialog } from "@/components/erp/employee-detail-dialog";

export default function TalentoHumanoPage() {
    const { toast } = useToast();
    const {
        empleados,
        novedadesNomina: novedades,
        addEmpleado,
        updateEmpleado,
        addNovedadNomina,
        payNomina,
        cuentasBancarias
    } = useErp();

    // const [empleados, setEmpleados] = useState(initialEmpleados); // Replaced by context
    // const [novedades, setNovedades] = useState<NovedadNomina[]>(initialNovedades as any); // Replaced by context in alias

    const [liquidaciones, setLiquidaciones] = useState<LiquidacionNomina[]>([]);

    const [searchTerm, setSearchTerm] = useState("");

    const handleCreateEmployee = (newEmp: any) => {
        addEmpleado(newEmp);
    };

    const handleCreateNovedad = (newNov: any) => {
        addNovedadNomina(newNov);
    };

    // --- EMPLOYEE DETAIL ---
    const [selectedEmployee, setSelectedEmployee] = useState<Empleado | null>(null);
    const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);

    const handleEmployeeClick = (emp: Empleado) => {
        setSelectedEmployee(emp);
        setEmployeeDialogOpen(true);
    };

    const handleEmployeeUpdate = (updated: Empleado) => {
        updateEmpleado(updated);
    };

    // --- FILTERS ---
    const filteredEmpleados = empleados.filter(e =>
        e.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cedula.includes(searchTerm)
    );

    const filteredNovedades = novedades.filter(n => {
        const emp = empleados.find(e => e.id === n.empleadoId);
        return emp?.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || n.tipo.includes(searchTerm);
    });

    const filteredLiquidaciones = liquidaciones.filter(l => {
        const emp = empleados.find(e => e.id === l.empleadoId);
        return emp?.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || l.periodo.includes(searchTerm);
    });

    // --- PAYROLL GENERATION ---
    const [isGenPayrollOpen, setIsGenPayrollOpen] = useState(false);
    const [genPeriod, setGenPeriod] = useState(format(new Date(), "yyyy-MM"));

    const handleGeneratePayroll = () => {
        if (!genPeriod) return;

        const newLiquidaciones: LiquidacionNomina[] = empleados
            .filter(e => e.estado === 'ACTIVO')
            .map(emp => {
                // Find novedades for this employee (ignoring date filter for mock simplicity, in real app filter by month)
                const empNovedades = novedades.filter(n => n.empleadoId === emp.id);

                const totalDevengadoExtras = empNovedades
                    .filter(n => n.efecto === 'SUMA')
                    .reduce((acc, n) => acc + (n.valorCalculado || 0), 0);

                const totalDeducciones = empNovedades
                    .filter(n => n.efecto === 'RESTA')
                    .reduce((acc, n) => acc + (n.valorCalculado || 0), 0);

                const totalDevengado = emp.salarioBase + totalDevengadoExtras;
                const netoPagar = totalDevengado - totalDeducciones;

                return {
                    id: `LIQ-${Date.now()}-${emp.id}`,
                    periodo: genPeriod,
                    empleadoId: emp.id,
                    empleado: emp,
                    totalDevengado: totalDevengado,
                    totalDeducido: totalDeducciones,
                    netoPagar: netoPagar,
                    estado: 'PENDIENTE',
                    detalle: JSON.stringify({
                        base: emp.salarioBase,
                        extras: totalDevengadoExtras,
                        novedades: empNovedades.map(n => ({ tipo: n.tipo, valor: n.valorCalculado, efecto: n.efecto }))
                    })
                };
            });

        setLiquidaciones(prev => [...newLiquidaciones, ...prev]);
        toast({ title: "Nómina Generada", description: `Se han generado ${newLiquidaciones.length} desprendibles para el periodo ${genPeriod}` });
        setIsGenPayrollOpen(false);
    };

    // --- PAYROLL PAYMENT ---
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedLiq, setSelectedLiq] = useState<LiquidacionNomina | null>(null);
    const [selectedAccount, setSelectedAccount] = useState("");

    const handlePayClick = (liq: LiquidacionNomina) => {
        setSelectedLiq(liq);
        setPaymentModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedLiq || !selectedAccount) return;

        try {
            await payNomina(
                selectedLiq.empleadoId,
                selectedLiq.periodo,
                selectedLiq.netoPagar,
                selectedAccount,
                new Date()
            );

            // Update local state to reflect payment (since Liquidations are local for now)
            setLiquidaciones(prev => prev.map(l => l.id === selectedLiq.id ? { ...l, estado: 'PAGADO' as any } : l));

            toast({ title: "Pago Realizado", description: `Se ha registrado el pago de ${formatCurrency(selectedLiq.netoPagar)} desde la cuenta seleccionada.` });
            setPaymentModalOpen(false);
            setSelectedLiq(null);
            setSelectedAccount("");
        } catch (error) {
            toast({ title: "Error", description: "No se pudo procesar el pago.", variant: "destructive" });
        }
    };

    // --- DETALLE NOMINA ---
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailNomina, setDetailNomina] = useState<LiquidacionNomina | null>(null);

    const handleViewDetail = (liq: LiquidacionNomina) => {
        setDetailNomina(liq);
        setDetailOpen(true);
    };

    // --- KPI MOCKS ---
    const kpiTotalEmployees = empleados.length;
    const kpiTotalPayroll = liquidaciones.reduce((acc, l) => acc + l.netoPagar, 0);
    const kpiAvgSalary = kpiTotalPayroll / (liquidaciones.length || 1);

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Talento Humano</h1>
                    <p className="text-muted-foreground">Gestión de personal, novedades y nómina.</p>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar empleado..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="nomina" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="empleados">Empleados</TabsTrigger>
                    <TabsTrigger value="novedades">Novedades</TabsTrigger>
                    <TabsTrigger value="nomina">Pagos de Nómina</TabsTrigger>
                    <TabsTrigger value="liquidaciones">Liquidaciones</TabsTrigger>
                </TabsList>

                {/* RESUMEN TAB */}
                <TabsContent value="resumen" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Personal Activo</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{kpiTotalEmployees}</div></CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Nómina Acumulada</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{formatCurrency(kpiTotalPayroll)}</div></CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm">Promedio Salarial</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{formatCurrency(kpiAvgSalary)}</div></CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* EMPLEADOS TAB */}
                <TabsContent value="empleados" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Directorio de Personal</CardTitle>
                            <CreateEmployeeDialog onEmployeeCreated={handleCreateEmployee} />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Cédula</TableHead>
                                        <TableHead>Cargo</TableHead>
                                        <TableHead>Salario Base</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredEmpleados.map((emp) => (
                                        <TableRow
                                            key={emp.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleEmployeeClick(emp)}
                                        >
                                            <TableCell className="font-medium">{emp.nombreCompleto}</TableCell>
                                            <TableCell>{emp.cedula}</TableCell>
                                            <TableCell><Badge variant="outline">{emp.cargo}</Badge></TableCell>
                                            <TableCell>{formatCurrency(emp.salarioBase)}</TableCell>
                                            <TableCell><Badge className="bg-green-100 text-green-800">ACTIVO</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOVEDADES TAB */}
                <TabsContent value="novedades" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Registro de Novedades</CardTitle>
                            <RegisterNovedadDialog empleados={empleados} onNovedadCreated={handleCreateNovedad} />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Detalle</TableHead>
                                        <TableHead>Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNovedades.map((nov) => (
                                        <TableRow key={nov.id}>
                                            <TableCell>{format(nov.fecha, "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="font-medium">{empleados.find(e => e.id === nov.empleadoId)?.nombreCompleto}</TableCell>
                                            <TableCell>
                                                <Badge variant={nov.efecto === 'RESTA' ? 'destructive' : 'secondary'}>
                                                    {nov.tipo.replace(/_/g, " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{nov.cantidad} (Rate: {formatCurrency(nov.valorUnitario || 0)})</TableCell>
                                            <TableCell className={nov.efecto === 'RESTA' ? "text-red-500" : "text-green-600"}>
                                                {nov.efecto === 'RESTA' ? '-' : '+'}{formatCurrency(nov.valorCalculado || 0)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOMINA TAB (Massive Gen & Pay) */}
                <TabsContent value="nomina" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Pagos de Nómina</CardTitle>
                                <CardDescription>Gestionar pagos masivos y ver desprendibles.</CardDescription>
                            </div>
                            <Dialog open={isGenPayrollOpen} onOpenChange={setIsGenPayrollOpen}>
                                <DialogTrigger asChild>
                                    <Button><Banknote className="mr-2 h-4 w-4" /> Generar Nómina Mensual</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Generar Desprendibles</DialogTitle>
                                        <CardDescription>Esto calculará la nómina para todos los empleados activos.</CardDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Periodo (Mes/Año)</Label>
                                            <Input type="month" value={genPeriod} onChange={(e) => setGenPeriod(e.target.value)} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleGeneratePayroll}>Generar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {/* Group by Period using Accordion */}
                            <Accordion type="single" collapsible className="w-full">
                                {Array.from(new Set(filteredLiquidaciones.map(l => l.periodo))).sort().reverse().map(period => (
                                    <AccordionItem key={period} value={period}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Periodo: {period}</span>
                                                <Badge variant="outline">{filteredLiquidaciones.filter(l => l.periodo === period).length} Empleados</Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Empleado</TableHead>
                                                        <TableHead>Base</TableHead>
                                                        <TableHead>Novedades</TableHead>
                                                        <TableHead>Neto</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead className="text-right">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredLiquidaciones.filter(l => l.periodo === period).map(liq => (
                                                        <TableRow key={liq.id}>
                                                            <TableCell className="font-medium">{liq.empleado.nombreCompleto}</TableCell>
                                                            <TableCell>{formatCurrency(liq.empleado.salarioBase)}</TableCell>
                                                            <TableCell className="text-xs">
                                                                <span className="text-green-600">+{formatCurrency(liq.totalDevengado - liq.empleado.salarioBase)}</span>
                                                                {" / "}
                                                                <span className="text-red-500">-{formatCurrency(liq.totalDeducido)}</span>
                                                            </TableCell>
                                                            <TableCell className="font-bold">{formatCurrency(liq.netoPagar)}</TableCell>
                                                            <TableCell>
                                                                {liq.estado === 'PAGADO' ?
                                                                    <Badge className="bg-green-100 text-green-800">PAGADO</Badge> :
                                                                    <Badge variant="secondary">PENDIENTE</Badge>
                                                                }
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button size="sm" variant="ghost" onClick={() => handleViewDetail(liq)}>Ver</Button>
                                                                {liq.estado !== 'PAGADO' && (
                                                                    <Button size="sm" onClick={() => handlePayClick(liq)}>Pagar</Button>
                                                                )}
                                                                {liq.estado === 'PAGADO' && (
                                                                    <Button size="sm" variant="ghost" disabled><CheckCircle2 className="h-4 w-4 text-green-600" /></Button>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LIQUIDACIONES TAB (Archive) */}
                <TabsContent value="liquidaciones">
                    <Card>
                        <CardHeader><CardTitle>Historial Completo</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Empleado</TableHead>
                                        <TableHead>Neto</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLiquidaciones.map(liq => (
                                        <TableRow key={liq.id}>
                                            <TableCell>{liq.periodo}</TableCell>
                                            <TableCell>{liq.empleado.nombreCompleto}</TableCell>
                                            <TableCell>{formatCurrency(liq.netoPagar)}</TableCell>
                                            <TableCell>{liq.estado}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Payment Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago de Nómina</DialogTitle>
                        <DialogDescription>
                            Seleccione la cuenta de origen para debitar el pago.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLiq && (
                        <div className="py-4 space-y-4">
                            <div className="p-3 bg-muted rounded-md space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Empleado:</span>
                                    <span className="font-bold">{selectedLiq.empleado.nombreCompleto}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Periodo:</span>
                                    <span>{selectedLiq.periodo}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 mt-2">
                                    <span>Total a Pagar:</span>
                                    <span className="font-bold text-lg text-primary">{formatCurrency(selectedLiq.netoPagar)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Cuenta Bancaria (Origen)</Label>
                                <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione cuenta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cuentasBancarias.map(acc => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                                {acc.nombre} ({acc.banco} - {formatCurrency(acc.saldoActual)})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmPayment} disabled={!selectedAccount}>Confirmar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PayrollDetailDialog open={detailOpen} onOpenChange={setDetailOpen} nomina={detailNomina} />

            <EmployeeDetailDialog
                open={employeeDialogOpen}
                onOpenChange={setEmployeeDialogOpen}
                empleado={selectedEmployee}
                liquidaciones={liquidaciones}
                novedades={novedades}
                onUpdate={handleEmployeeUpdate}
            />
        </div>
    );
}

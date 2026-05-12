"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users,
    CalendarDays,
    Banknote,
    Search,
    CheckCircle2,
    Edit,
    Trash2,
    Plus,
    MapPin,
    Clock,
    ClipboardList,
    AlertCircle,
    Loader2,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    UserCheck
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency } from "@/lib/utils";
import { CreateEmployeeDialog } from "@/components/erp/create-employee-dialog";
import { NovedadDialog } from "@/components/erp/register-novedad-dialog";
import { Empleado, LiquidacionNomina, NovedadNomina, AsignacionProgramador, EstadoAsignacion } from "@/types/sistema";
import { PayrollDetailDialog } from "@/components/erp/payroll-detail-dialog";
import { EmployeeDetailDialog } from "@/components/erp/employee-detail-dialog";
import {
    getAsignacionesAction,
    createAsignacionAction,
    updateAsignacionAction,
    deleteAsignacionAction
} from "@/app/dashboard/sistema/talento-humano/programador-actions";

// ─── Status helpers ───────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<EstadoAsignacion, { label: string; color: string; icon: React.ReactNode }> = {
    PROGRAMADO:  { label: "Programado",  color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",  icon: <ClipboardList className="h-3 w-3" /> },
    CONFIRMADO:  { label: "Confirmado",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",    icon: <CheckCircle2 className="h-3 w-3" /> },
    EN_CAMINO:   { label: "En Camino",   color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",  icon: <MapPin className="h-3 w-3" /> },
    COMPLETADO:  { label: "Completado",  color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: <CheckCircle2 className="h-3 w-3" /> },
    CANCELADO:   { label: "Cancelado",   color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",         icon: <AlertCircle className="h-3 w-3" /> },
};

function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

export default function TalentoHumanoPage() {
    const { toast } = useToast();
    const {
        empleados,
        cotizaciones,
        novedadesNomina: novedades,
        addEmpleado,
        updateEmpleado,
        addNovedadNomina,
        updateNovedadNomina,
        deleteNovedadNomina,
        payNomina,
        cuentasBancarias,
        liquidacionesNomina: liquidacionesContext,
        addLiquidacion
    } = useErp();

    // const [empleados, setEmpleados] = useState(initialEmpleados); // Replaced by context
    // const [novedades, setNovedades] = useState<NovedadNomina[]>(initialNovedades as any); // Replaced by context in alias

    // Use context data instead of local state
    const liquidaciones = liquidacionesContext || [];

    const [searchTerm, setSearchTerm] = useState("");

    const handleCreateEmployee = (newEmp: any) => {
        addEmpleado(newEmp);
    };

    // --- NOVEDADES LOGIC ---
    const [selectedNovedad, setSelectedNovedad] = useState<NovedadNomina | null>(null);
    const [novedadDialogOpen, setNovedadDialogOpen] = useState(false);

    const handleSaveNovedad = async (novedad: any) => {
        if (selectedNovedad) {
            await updateNovedadNomina(novedad);
        } else {
            await addNovedadNomina(novedad);
        }
    };

    const handleEditNovedad = (nov: NovedadNomina) => {
        setSelectedNovedad(nov);
        setNovedadDialogOpen(true);
    };

    const handleDeleteNovedad = async (id: string) => {
        if (confirm("¿Está seguro de eliminar esta novedad?")) {
            await deleteNovedadNomina(id);
            toast({ title: "Novedad eliminada" });
        }
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

        // Persist each calculation
        newLiquidaciones.forEach(liq => {
            // Remove 'id' and 'empleado' (full object) as createLiquidacionAction expects Omit<LiquidacionNomina, "id" | "empleado">
            const { id, empleado, ...rest } = liq;
            addLiquidacion(rest);
        });

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
                selectedLiq.id,
                selectedLiq.empleadoId,
                selectedLiq.periodo,
                selectedLiq.netoPagar,
                selectedAccount,
                new Date()
            );

            // No need to manually update state, context will refresh

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

    // ──────────────────────────────────────────────────────────────────────────
    // PROGRAMADOR STATE
    // ──────────────────────────────────────────────────────────────────────────
    const [asignaciones, setAsignaciones] = useState<AsignacionProgramador[]>([]);
    const [asignLoading, setAsignLoading] = useState(false);
    const [asignDialogOpen, setAsignDialogOpen] = useState(false);
    const [editingAsign, setEditingAsign] = useState<AsignacionProgramador | null>(null);

    // Week navigation
    const [weekOffset, setWeekOffset] = useState(0);
    const weekStart = useMemo(() => {
        const base = new Date();
        base.setDate(base.getDate() + weekOffset * 7);
        return startOfWeek(base, { weekStartsOn: 1 });
    }, [weekOffset]);
    const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }), [weekStart]);

    // Form state
    const [fEmpleados, setFEmpleados] = useState<string[]>([]);
    const [fEmpSearch, setFEmpSearch] = useState("");
    const [fCotizacion, setFCotizacion] = useState("");
    const [fFecha, setFFecha] = useState(new Date().toISOString().split("T")[0]);
    const [fHoraInicio, setFHoraInicio] = useState("08:00");
    const [fHoraFin, setFHoraFin] = useState("");
    const [fRol, setFRol] = useState("");
    const [fEstado, setFEstado] = useState<EstadoAsignacion>("PROGRAMADO");
    const [fNotas, setFNotas] = useState("");

    // Auto-filled from cotizacion
    const [fDireccion, setFDireccion] = useState("");
    const [fProyecto, setFProyecto] = useState("");
    const [fCliente, setFCliente] = useState("");

    const loadAsignaciones = useCallback(async () => {
        setAsignLoading(true);
        try {
            const data = await getAsignacionesAction();
            setAsignaciones(data);
        } catch (e) {
            console.error(e);
        } finally {
            setAsignLoading(false);
        }
    }, []);

    useEffect(() => { loadAsignaciones(); }, [loadAsignaciones]);

    // When cotizacion changes → auto-fill address/project/client
    const handleCotizacionChange = (id: string) => {
        setFCotizacion(id);
        const cot = cotizaciones.find(c => c.id === id);
        if (cot) {
            setFDireccion(cot.direccionProyecto || "");
            setFProyecto(cot.descripcionTrabajo || cot.numero || "");
            setFCliente(cot.cliente?.nombre || "");
        }
    };

    const resetForm = () => {
        setFEmpleados([]); setFEmpSearch(""); setFCotizacion(""); setFFecha(new Date().toISOString().split("T")[0]);
        setFHoraInicio("08:00"); setFHoraFin(""); setFRol(""); setFEstado("PROGRAMADO");
        setFNotas(""); setFDireccion(""); setFProyecto(""); setFCliente("");
        setEditingAsign(null);
    };

    const openEdit = (a: AsignacionProgramador) => {
        setEditingAsign(a);
        setFEmpleados([a.empleadoId]);   // single employee in edit mode
        setFEmpSearch("");
        setFCotizacion(a.cotizacionId);
        setFFecha(format(a.fecha, "yyyy-MM-dd"));
        setFHoraInicio(a.horaInicio);
        setFHoraFin(a.horaFin || "");
        setFRol(a.rol || "");
        setFEstado(a.estado);
        setFNotas(a.notasInternas || "");
        setFDireccion(a.direccionObra || "");
        setFProyecto(a.nombreProyecto || "");
        setFCliente(a.clienteNombre || "");
        setAsignDialogOpen(true);
    };

    const handleSaveAsign = async () => {
        if (fEmpleados.length === 0 || !fCotizacion || !fFecha || !fHoraInicio) {
            toast({ title: "Campos requeridos", description: "Seleccione al menos un empleado, oferta, fecha y hora de inicio.", variant: "destructive" });
            return;
        }
        setAsignLoading(true);
        try {
            const basePayload = {
                cotizacionId: fCotizacion,
                fecha: new Date(fFecha + "T12:00:00"),
                horaInicio: fHoraInicio, horaFin: fHoraFin || undefined,
                rol: fRol || undefined, estado: fEstado,
                notasInternas: fNotas || undefined,
                direccionObra: fDireccion || undefined,
                nombreProyecto: fProyecto || undefined,
                clienteNombre: fCliente || undefined,
            };

            if (editingAsign) {
                // Edit mode: single record update
                const updated = await updateAsignacionAction(editingAsign.id, { ...basePayload, empleadoId: fEmpleados[0] });
                setAsignaciones(prev => prev.map(a => a.id === updated.id ? updated : a));
                toast({ title: "Asignación actualizada" });
            } else {
                // Create mode: one record per selected employee (parallel)
                const results = await Promise.all(
                    fEmpleados.map(empId => createAsignacionAction({ ...basePayload, empleadoId: empId }))
                );
                setAsignaciones(prev => [...results, ...prev]);
                toast({
                    title: `${results.length} asignación${results.length > 1 ? "es creadas" : " creada"}`,
                    description: results.length > 1
                        ? `Se programaron ${results.length} personas para el ${format(new Date(fFecha + "T12:00:00"), "dd MMM", { locale: es })}.`
                        : `${empleados.find(e => e.id === fEmpleados[0])?.nombreCompleto} asignado correctamente.`
                });
            }
            resetForm();
            setAsignDialogOpen(false);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setAsignLoading(false);
        }
    };

    const handleDeleteAsign = async (id: string) => {
        if (!confirm("¿Eliminar esta asignación?")) return;
        try {
            await deleteAsignacionAction(id);
            setAsignaciones(prev => prev.filter(a => a.id !== id));
            toast({ title: "Asignación eliminada" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleQuickStatus = async (a: AsignacionProgramador, estado: EstadoAsignacion) => {
        try {
            const updated = await updateAsignacionAction(a.id, { estado });
            setAsignaciones(prev => prev.map(x => x.id === updated.id ? updated : x));
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    // KPIs
    const today = new Date();
    const asignacionesSemana = asignaciones.filter(a => a.fecha >= weekStart && a.fecha <= weekDays[6]);
    const asignacionesPendientes = asignaciones.filter(a => a.estado === "PROGRAMADO" || a.estado === "CONFIRMADO");
    const empleadosHoy = new Set(asignaciones.filter(a => isSameDay(a.fecha, today)).map(a => a.empleadoId)).size;

    // Cotizaciones aprobadas
    const ofertasActivas = useMemo(() => cotizaciones.filter(c => ["APROBADA", "EN_REVISION", "ENVIADA"].includes(c.estado)), [cotizaciones]);

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
                    <TabsTrigger value="programador">🗓 Programador</TabsTrigger>
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
                            <Button onClick={() => { setSelectedNovedad(null); setNovedadDialogOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Registrar Novedad
                            </Button>
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
                                        <TableHead className="text-right">Acciones</TableHead>
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
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => handleEditNovedad(nov)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDeleteNovedad(nov.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <NovedadDialog
                        open={novedadDialogOpen}
                        onOpenChange={setNovedadDialogOpen}
                        empleados={empleados}
                        onNovedadSaved={handleSaveNovedad}
                        novedadToEdit={selectedNovedad}
                    />
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

                {/* ─── PROGRAMADOR TAB ───────────────────────────────────────────────── */}
                <TabsContent value="programador" className="space-y-6">

                    {/* KPIs */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-l-4 border-l-indigo-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" />Esta Semana</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{asignacionesSemana.length}</div><p className="text-xs text-muted-foreground">asignaciones</p></CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-500" />Pendientes</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{asignacionesPendientes.length}</div><p className="text-xs text-muted-foreground">sin completar</p></CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-500" />Hoy en Obra</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">{empleadosHoy}</div><p className="text-xs text-muted-foreground">personas</p></CardContent>
                        </Card>
                    </div>

                    {/* Header actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm font-medium min-w-[200px] text-center">
                                {format(weekStart, "d MMM", { locale: es })} — {format(weekDays[6], "d MMM yyyy", { locale: es })}
                            </span>
                            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>Hoy</Button>
                        </div>
                        <Dialog open={asignDialogOpen} onOpenChange={(v) => { if (!v) { resetForm(); } setAsignDialogOpen(v); }}>
                            <DialogTrigger asChild>
                                <Button><Plus className="mr-2 h-4 w-4" />Nueva Asignación</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingAsign ? "Editar Asignación" : "Nueva Asignación"}</DialogTitle>
                                    <DialogDescription>Sincroniza un empleado o colaborador con una oferta/proyecto.</DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    {/* Multi-selector de Empleados */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>
                                                Personal *
                                                {fEmpleados.length > 0 && (
                                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                        ({fEmpleados.length} seleccionado{fEmpleados.length > 1 ? "s" : ""})
                                                    </span>
                                                )}
                                            </Label>
                                            {fEmpleados.length > 0 && (
                                                <button
                                                    type="button"
                                                    className="text-xs text-muted-foreground hover:text-destructive underline"
                                                    onClick={() => setFEmpleados([])}
                                                >
                                                    Limpiar
                                                </button>
                                            )}
                                        </div>

                                        {/* Chips de seleccionados */}
                                        {fEmpleados.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {fEmpleados.map(id => {
                                                    const emp = empleados.find(e => e.id === id);
                                                    return (
                                                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                                            {getInitials(emp?.nombreCompleto || "?")}
                                                            <span className="max-w-[100px] truncate">{emp?.nombreCompleto}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFEmpleados(prev => prev.filter(x => x !== id))}
                                                                className="ml-0.5 hover:text-destructive font-bold"
                                                            >×</button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Búsqueda */}
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre o cargo..."
                                                className="pl-7 h-8 text-sm"
                                                value={fEmpSearch}
                                                onChange={e => setFEmpSearch(e.target.value)}
                                            />
                                        </div>

                                        {/* Lista scrollable con checkboxes */}
                                        <div className="border rounded-md overflow-y-auto max-h-[180px] divide-y">
                                            {empleados
                                                .filter(e => e.estado === "ACTIVO")
                                                .filter(e =>
                                                    fEmpSearch === "" ||
                                                    e.nombreCompleto.toLowerCase().includes(fEmpSearch.toLowerCase()) ||
                                                    e.cargo.toLowerCase().includes(fEmpSearch.toLowerCase())
                                                )
                                                .map(e => {
                                                    const checked = fEmpleados.includes(e.id);
                                                    return (
                                                        <label
                                                            key={e.id}
                                                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${checked ? "bg-primary/5" : ""}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() =>
                                                                    setFEmpleados(prev =>
                                                                        checked ? prev.filter(x => x !== e.id) : [...prev, e.id]
                                                                    )
                                                                }
                                                                className="accent-primary h-4 w-4 flex-shrink-0"
                                                            />
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                                                {getInitials(e.nombreCompleto)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate">{e.nombreCompleto}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{e.cargo}</p>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            }
                                            {empleados.filter(e => e.estado === "ACTIVO" && (fEmpSearch === "" || e.nombreCompleto.toLowerCase().includes(fEmpSearch.toLowerCase()) || e.cargo.toLowerCase().includes(fEmpSearch.toLowerCase()))).length === 0 && (
                                                <p className="text-center text-sm text-muted-foreground py-4">Sin resultados</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Oferta */}
                                    <div className="space-y-1">
                                        <Label>Oferta / Proyecto *</Label>
                                        <Select value={fCotizacion} onValueChange={handleCotizacionChange}>
                                            <SelectTrigger><SelectValue placeholder="Seleccione oferta..." /></SelectTrigger>
                                            <SelectContent>
                                                {ofertasActivas.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.numero} — {c.descripcionTrabajo || c.cliente?.nombre}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Auto-filled info */}
                                    {(fProyecto || fCliente || fDireccion) && (
                                        <div className="rounded-md border bg-muted/40 p-3 space-y-1 text-sm">
                                            {fProyecto && <p><span className="font-medium">Proyecto:</span> {fProyecto}</p>}
                                            {fCliente && <p><span className="font-medium">Cliente:</span> {fCliente}</p>}
                                            {fDireccion && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{fDireccion}</p>}
                                        </div>
                                    )}

                                    {/* Dirección manual override */}
                                    <div className="space-y-1">
                                        <Label>Dirección de Obra</Label>
                                        <Input placeholder="Se completa desde la oferta, o ingresa manualmente..." value={fDireccion} onChange={e => setFDireccion(e.target.value)} />
                                    </div>

                                    <Separator />

                                    {/* Fecha y horas */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label>Fecha *</Label>
                                            <Input type="date" value={fFecha} onChange={e => setFFecha(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Hora Inicio *</Label>
                                            <Input type="time" value={fHoraInicio} onChange={e => setFHoraInicio(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Hora Fin</Label>
                                            <Input type="time" value={fHoraFin} onChange={e => setFHoraFin(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Rol y Estado */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label>Rol en la Obra</Label>
                                            <Input placeholder="Ej: Técnico, Ayudante..." value={fRol} onChange={e => setFRol(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Estado</Label>
                                            <Select value={fEstado} onValueChange={v => setFEstado(v as EstadoAsignacion)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {(Object.keys(ESTADO_CONFIG) as EstadoAsignacion[]).map(k => (
                                                        <SelectItem key={k} value={k}>{ESTADO_CONFIG[k].label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Notas */}
                                    <div className="space-y-1">
                                        <Label>Notas Internas</Label>
                                        <Textarea placeholder="Instrucciones, materiales a llevar, observaciones..." value={fNotas} onChange={e => setFNotas(e.target.value)} rows={3} />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { resetForm(); setAsignDialogOpen(false); }}>Cancelar</Button>
                                    <Button onClick={handleSaveAsign} disabled={asignLoading}>
                                        {asignLoading
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                                            : editingAsign
                                                ? "Actualizar"
                                                : fEmpleados.length > 1
                                                    ? `Crear ${fEmpleados.length} Asignaciones`
                                                    : "Crear Asignación"
                                        }
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Weekly calendar */}
                    {asignLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {weekDays.map(day => {
                                const dayAsigns = asignaciones.filter(a => isSameDay(a.fecha, day));
                                const isCurrentDay = isToday(day);
                                return (
                                    <div key={day.toISOString()} className={`rounded-lg border min-h-[200px] ${isCurrentDay ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                                        {/* Day header */}
                                        <div className={`p-2 text-center border-b ${isCurrentDay ? "border-primary/30" : "border-border"}`}>
                                            <p className="text-xs text-muted-foreground capitalize">{format(day, "EEE", { locale: es })}</p>
                                            <p className={`text-lg font-bold ${isCurrentDay ? "text-primary" : ""}`}>{format(day, "d")}</p>
                                            {dayAsigns.length > 0 && (
                                                <Badge variant="secondary" className="text-xs">{dayAsigns.length}</Badge>
                                            )}
                                        </div>

                                        {/* Assignments */}
                                        <div className="p-1 space-y-1">
                                            {dayAsigns.map(a => {
                                                const emp = a.empleado || empleados.find(e => e.id === a.empleadoId);
                                                const cfg = ESTADO_CONFIG[a.estado];
                                                return (
                                                    <div key={a.id} className="rounded-md border bg-background p-1.5 text-xs space-y-1 group relative">
                                                        {/* Status badge */}
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}>
                                                            {cfg.icon}{cfg.label}
                                                        </span>
                                                        {/* Hora */}
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            <span>{a.horaInicio}{a.horaFin ? ` - ${a.horaFin}` : ""}</span>
                                                        </div>
                                                        {/* Nombre */}
                                                        <p className="font-semibold truncate">{emp?.nombreCompleto || "—"}</p>
                                                        {a.rol && <p className="text-muted-foreground truncate">{a.rol}</p>}
                                                        {/* Proyecto */}
                                                        {a.nombreProyecto && <p className="text-muted-foreground truncate text-[10px]">{a.nombreProyecto}</p>}
                                                        {/* Dirección */}
                                                        {a.direccionObra && (
                                                            <a
                                                                href={`https://maps.google.com/?q=${encodeURIComponent(a.direccionObra)}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-primary hover:underline truncate"
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                                                                <span className="truncate">{a.direccionObra}</span>
                                                                <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                                                            </a>
                                                        )}
                                                        {/* Actions on hover */}
                                                        <div className="flex gap-1 pt-1 border-t">
                                                            <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px]" onClick={() => openEdit(a)}>
                                                                <Edit className="h-2.5 w-2.5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px] text-destructive" onClick={() => handleDeleteAsign(a.id)}>
                                                                <Trash2 className="h-2.5 w-2.5" />
                                                            </Button>
                                                            {/* Quick status */}
                                                            {a.estado === "PROGRAMADO" && (
                                                                <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px] text-blue-600" onClick={() => handleQuickStatus(a, "CONFIRMADO")}>
                                                                    ✓
                                                                </Button>
                                                            )}
                                                            {a.estado === "CONFIRMADO" && (
                                                                <Button size="sm" variant="ghost" className="h-5 px-1 text-[10px] text-green-600" onClick={() => handleQuickStatus(a, "COMPLETADO")}>
                                                                    ✓✓
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* All assignments list (future/past outside week) */}
                    {asignaciones.filter(a => !isSameDay(a.fecha, weekStart) && !weekDays.some(d => isSameDay(a.fecha, d))).length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-sm">Todas las Asignaciones</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Persona</TableHead>
                                            <TableHead>Proyecto</TableHead>
                                            <TableHead>Dirección</TableHead>
                                            <TableHead>Horario</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {asignaciones.sort((a, b) => a.fecha.getTime() - b.fecha.getTime()).map(a => {
                                            const emp = a.empleado || empleados.find(e => e.id === a.empleadoId);
                                            const cfg = ESTADO_CONFIG[a.estado];
                                            return (
                                                <TableRow key={a.id}>
                                                    <TableCell className="font-medium">{format(a.fecha, "dd MMM yyyy", { locale: es })}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                {getInitials(emp?.nombreCompleto || "?")}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{emp?.nombreCompleto}</p>
                                                                {a.rol && <p className="text-xs text-muted-foreground">{a.rol}</p>}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="text-sm font-medium">{a.nombreProyecto || "—"}</p>
                                                        {a.clienteNombre && <p className="text-xs text-muted-foreground">{a.clienteNombre}</p>}
                                                    </TableCell>
                                                    <TableCell>
                                                        {a.direccionObra ? (
                                                            <a href={`https://maps.google.com/?q=${encodeURIComponent(a.direccionObra)}`} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-primary hover:underline text-sm">
                                                                <MapPin className="h-3 w-3" />{a.direccionObra}
                                                            </a>
                                                        ) : "—"}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{a.horaInicio}{a.horaFin ? ` - ${a.horaFin}` : ""}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                                            {cfg.icon}{cfg.label}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteAsign(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

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

"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Pencil, DollarSign, Calendar, RefreshCcw, TrendingDown, Wallet } from "lucide-react";
import { registrarPagoObligacionAction, getObligacionFinancieraByIdAction } from "@/app/dashboard/sistema/financiera/obligaciones-actions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ObligacionFinanciera } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import { calculateAmortizationSchedule } from "@/lib/financial-math";

interface ObligacionDetailDialogProps {
    obligacion: ObligacionFinanciera;
    onObligacionUpdated: (obligacion: ObligacionFinanciera) => void;
    trigger?: React.ReactNode;
}

type TipoPago = 'CUOTA' | 'ABONO_CAPITAL';

export function ObligacionDetailDialog({ obligacion, onObligacionUpdated, trigger }: ObligacionDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [localObligacion, setLocalObligacion] = useState<ObligacionFinanciera>(obligacion);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states for general editing
    const [entidad, setEntidad] = useState(obligacion.entidad);
    const [saldo, setSaldo] = useState(obligacion.saldoCapital.toString());

    // Payment Form state
    const [pagoTipo, setPagoTipo] = useState<TipoPago>('CUOTA');
    const [pagoValor, setPagoValor] = useState("");
    const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split('T')[0]);

    // Auto-calculated fields display
    const [calcInteres, setCalcInteres] = useState(0);
    const [calcCapital, setCalcCapital] = useState(0);

    // Fetch fresh data when dialog opens
    useEffect(() => {
        if (open) {
            refreshData();
        } else {
            setLocalObligacion(obligacion);
            setEntidad(obligacion.entidad);
            setSaldo(obligacion.saldoCapital.toString());
        }
    }, [open, obligacion]);

    // Recalculate split when Value or Type changes
    useEffect(() => {
        const valor = parseFloat(pagoValor) || 0;
        if (valor === 0) {
            setCalcInteres(0);
            setCalcCapital(0);
            return;
        }

        if (pagoTipo === 'ABONO_CAPITAL') {
            // Extra payment reduces capital 100% (assuming interest is paid separately or this is purely extra)
            // Or typically, user pays interest accrued so far + extra.
            // Requirement: "Depends on quota... other payment is to capital".
            // Let's implement: Abono Capital = 100% to Capital.
            setCalcInteres(0);
            setCalcCapital(valor);
        } else {
            // Standard Quota
            // Interest = Balance * Rate
            const rateMonthly = localObligacion.tasaInteres; // e.g. 0.02
            const interest = localObligacion.saldoCapital * rateMonthly;

            // Capital = Payment - Interest
            const capital = valor - interest;

            setCalcInteres(interest > 0 ? interest : 0);
            setCalcCapital(capital);
        }
    }, [pagoValor, pagoTipo, localObligacion.saldoCapital, localObligacion.tasaInteres]);


    const refreshData = async () => {
        setIsLoading(true);
        try {
            const freshData = await getObligacionFinancieraByIdAction(obligacion.id);
            if (freshData) {
                setLocalObligacion(freshData);
                setEntidad(freshData.entidad);
                setSaldo(freshData.saldoCapital.toString());
            }
        } catch (error) {
            console.error("Failed to refresh obligacion details", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Amortization Calculation (Dynamic)
    const amortizationTable = useMemo(() => {
        return calculateAmortizationSchedule(
            localObligacion.montoPrestado,
            localObligacion.tasaInteres,
            localObligacion.plazoMeses,
            new Date(localObligacion.fechaInicio),
            localObligacion.pagos
        );
    }, [localObligacion]);

    const handleSaveGeneral = () => {
        const updated: ObligacionFinanciera = {
            ...localObligacion,
            entidad,
            saldoCapital: parseFloat(saldo)
        };
        onObligacionUpdated(updated);
        setLocalObligacion(updated);
        setIsEditing(false);
    };

    const handleRegistrarPago = async () => {
        if (!pagoValor || !pagoFecha) {
            toast({ title: "Campos incompletos", description: "Ingrese fecha y valor.", variant: "destructive" });
            return;
        }

        const valor = parseFloat(pagoValor);
        if (isNaN(valor) || valor <= 0) {
            toast({ title: "Valor inválido", description: "El valor debe ser mayor a 0.", variant: "destructive" });
            return;
        }

        const nuevoSaldo = localObligacion.saldoCapital - calcCapital;

        setIsLoading(true);
        try {
            const updatedObligacion = await registrarPagoObligacionAction({
                obligacionId: localObligacion.id,
                fecha: new Date(pagoFecha),
                valor: valor,
                interes: calcInteres,
                capital: calcCapital,
                saldoRestante: nuevoSaldo > 0 ? nuevoSaldo : 0
            });

            setLocalObligacion(updatedObligacion);
            onObligacionUpdated(updatedObligacion);

            setPagoValor("");
            setSaldo(updatedObligacion.saldoCapital.toString());
            toast({ title: "Pago registrado", description: "El abono ha sido guardado correctamente." });
        } catch (error) {
            console.error("Error registering payment:", error);
            toast({ title: "Error", description: "No se pudo registrar el pago. Revise la consola.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="secondary" size="sm">
                        Ver Detalles
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Detalle de Obligación: {localObligacion.entidad}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={refreshData} disabled={isLoading}>
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="pagos" className="flex-1 overflow-hidden flex flex-col mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pagos">Registrar & Historial</TabsTrigger>
                        <TabsTrigger value="amortizacion">Proyección Dinámica</TabsTrigger>
                        <TabsTrigger value="detalle">Info. General</TabsTrigger>
                    </TabsList>

                    {/* --- DETAILS TAB --- */}
                    <TabsContent value="detalle" className="flex-1 overflow-auto p-4 border rounded-md mt-2">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Entidad</Label>
                                <Input
                                    value={entidad}
                                    onChange={(e) => setEntidad(e.target.value)}
                                    disabled={!isEditing}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Monto Original</Label>
                                <div className="col-span-3 p-2 bg-muted rounded-md">{formatCurrency(localObligacion.montoPrestado)}</div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            {isEditing ? (
                                <Button onClick={handleSaveGeneral}>Guardar Cambios Manuales</Button>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 h-4 w-4" /> Editar Info Manualmente
                                </Button>
                            )}
                        </div>
                    </TabsContent>

                    {/* --- AMORTIZATION TAB --- */}
                    <TabsContent value="amortizacion" className="flex-1 overflow-auto rounded-md border mt-2">
                        <div className="p-2 text-sm text-center sticky top-0 bg-background border-b z-10 grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-center gap-2 text-green-600">
                                <span className="w-3 h-3 rounded-full bg-green-100 border border-green-600"></span>
                                Historico Real
                            </div>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-400"></span>
                                Proyección Futura
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">#</TableHead>
                                    <TableHead>Fecha Aprox.</TableHead>
                                    <TableHead className="text-right">Cuota</TableHead>
                                    <TableHead className="text-right">Interés</TableHead>
                                    <TableHead className="text-right">Abono Cap.</TableHead>
                                    <TableHead className="text-right">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {amortizationTable.map((row) => (
                                    <TableRow key={row.periodo} className={row.isReal ? "bg-green-50/50" : ""}>
                                        <TableCell className="font-medium">{row.periodo}</TableCell>
                                        <TableCell>{format(row.fecha, "MMM yyyy", { locale: es })}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.cuota)}</TableCell>
                                        <TableCell className="text-right text-red-500">{formatCurrency(row.interes)}</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(row.capital)}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">{formatCurrency(row.saldo)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    {/* --- PAYMENTS & HISTORY TAB --- */}
                    <TabsContent value="pagos" className="flex-1 overflow-hidden flex flex-col mt-2">
                        {/* PAYMENT FORM */}
                        <div className="p-4 border rounded-md bg-muted/20 mb-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <h4 className="font-semibold flex items-center gap-2 text-primary">
                                    <Wallet className="h-5 w-5" /> Registrar Nuevo Pago
                                </h4>
                                <div className="text-right text-sm">
                                    <p className="text-muted-foreground">Saldo Actual</p>
                                    <p className="text-xl font-bold text-red-600">{formatCurrency(localObligacion.saldoCapital)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="mb-2 block">Tipo de Movimiento</Label>
                                        <RadioGroup defaultValue="CUOTA" value={pagoTipo} onValueChange={(v) => setPagoTipo(v as TipoPago)} className="flex gap-4">
                                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted bg-white">
                                                <RadioGroupItem value="CUOTA" id="r1" />
                                                <Label htmlFor="r1" className="cursor-pointer">Pago de Cuota</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted bg-white">
                                                <RadioGroupItem value="ABONO_CAPITAL" id="r2" />
                                                <Label htmlFor="r2" className="cursor-pointer">Abono a Capital</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Fecha</Label>
                                            <Input type="date" value={pagoFecha} onChange={e => setPagoFecha(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Valor Total a Pagar</Label>
                                            <Input type="number" placeholder="0" value={pagoValor} onChange={e => setPagoValor(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-md border shadow-sm space-y-2">
                                    <p className="font-semibold text-sm border-b pb-2 mb-2">Desglose del Pago</p>
                                    <div className="flex justify-between text-sm">
                                        <span>Intereses:</span>
                                        <span className="text-red-500 font-medium">{formatCurrency(calcInteres)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Abono a Capital:</span>
                                        <span className="text-green-600 font-medium">{formatCurrency(calcCapital)}</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                        <span>Nuevo Saldo:</span>
                                        <span>{formatCurrency(localObligacion.saldoCapital - calcCapital)}</span>
                                    </div>
                                    <Button className="w-full mt-4" onClick={handleRegistrarPago} disabled={isLoading}>
                                        {isLoading ? "Procesando..." : "Confirmar Pago"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* HISTORY TABLE */}
                        <div className="flex-1 overflow-auto rounded-md border bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Valor Pagado</TableHead>
                                        <TableHead className="text-right">Interés</TableHead>
                                        <TableHead className="text-right">Capital</TableHead>
                                        <TableHead className="text-right">Saldo Restante</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!localObligacion.pagos || localObligacion.pagos.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No hay pagos registrados aún.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        localObligacion.pagos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((pago) => (
                                            <TableRow key={pago.id}>
                                                <TableCell>{format(new Date(pago.fecha), "dd MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(pago.valor)}</TableCell>
                                                <TableCell className="text-right text-red-500">{pago.interes ? formatCurrency(pago.interes) : '-'}</TableCell>
                                                <TableCell className="text-right text-green-600">{pago.capital ? formatCurrency(pago.capital) : '-'}</TableCell>
                                                <TableCell className="text-right font-mono text-xs">{formatCurrency(pago.saldoRestante)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

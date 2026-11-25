"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Pencil, DollarSign, Calendar, RefreshCcw, TrendingDown, Wallet, Upload, ExternalLink } from "lucide-react";
import { registrarPagoObligacionAction, getObligacionFinancieraByIdAction } from "@/app/dashboard/sistema/financiera/obligaciones-actions";
import { toast } from "@/hooks/use-toast";
import { useErp } from "@/components/providers/erp-provider";
import { createClient } from "@/utils/supabase/client";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ObligacionFinanciera } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";
import { calculateAmortizationSchedule, annualEffectiveToMonthly, calculatePaymentBreakdown } from "@/lib/financial-math";
import { uploadObligacionSupportAction, getObligacionSupportUrlAction } from "@/app/dashboard/sistema/financiera/obligaciones-documentos-actions";

interface ObligacionDetailDialogProps {
    obligacion: ObligacionFinanciera;
    onObligacionUpdated: (obligacion: ObligacionFinanciera) => Promise<void> | void;
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
    const [pagoFecha, setPagoFecha] = useState(format(new Date(), "yyyy-MM-dd"));
    const [cuentaId, setCuentaId] = useState("");
    const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

    const { cuentasBancarias, refreshData: refreshErpData } = useErp();

    // Auto-calculated fields display
    const [calcInteres, setCalcInteres] = useState(0);
    const [calcCapital, setCalcCapital] = useState(0);
    const [pagoError, setPagoError] = useState("");

    // Fetch fresh data when dialog opens
    useEffect(() => {
        if (open) {
            void refreshData();
        } else {
            setLocalObligacion(obligacion);
            setEntidad(obligacion.entidad);
            setSaldo(obligacion.saldoCapital.toString());
        }
    }, [open, obligacion]);

    // Desglose con tasa mensual efectiva derivada de la E.A. contractual.
    useEffect(() => {
        const amount = Number(pagoValor);
        if (!Number.isFinite(amount) || amount <= 0) {
            setCalcInteres(0); setCalcCapital(0); setPagoError(""); return;
        }
        try {
            const result = calculatePaymentBreakdown(localObligacion.saldoCapital, localObligacion.tasaInteres, amount, pagoTipo === "ABONO_CAPITAL");
            setCalcInteres(result.interes);setCalcCapital(result.capital);setPagoError("");
        } catch (error) {
            setCalcInteres(0);setCalcCapital(0);
            setPagoError(error instanceof Error ? error.message : "Monto inválido.");
        }
    }, [pagoValor, pagoTipo, localObligacion.saldoCapital, localObligacion.tasaInteres]);

    const openPrivateSupport = async (path?: string) => {
        if (!path) return;
        try {
            if (path.startsWith("https://")) {
                window.open(path, "_blank", "noopener,noreferrer"); return;
            }
            const url = await getObligacionSupportUrlAction(path);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (error) {
            toast({ variant: "destructive", title: "No se pudo abrir el soporte", description: error instanceof Error ? error.message : "Revisa tus permisos." });
        }
    };

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
            localObligacion.pagos,
            localObligacion.valorCuota,
            localObligacion.tipoCuota || "FIJA"
        );
    }, [localObligacion]);

    const handleSaveGeneral = async () => {
        const updated: ObligacionFinanciera = {
            ...localObligacion,
            entidad,
            saldoCapital: parseFloat(saldo)
        };
        try {
            await onObligacionUpdated(updated);
            setLocalObligacion(updated);
        } catch (error) {
            toast({ title: "No se guardaron los cambios", description: error instanceof Error ? error.message : "Compruebe los datos.", variant: "destructive" });
            return;
        }
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

        if (pagoError || calcCapital <= 0 || calcCapital > localObligacion.saldoCapital + 0.01) {
            toast({ title: "Desglose inválido", description: pagoError || "El abono al capital debe ser positivo y no superar el saldo.", variant: "destructive" });
            return;
        }
        const nuevoSaldo = localObligacion.saldoCapital - calcCapital;

        setIsLoading(true);
        try {
            let comprobanteUrl: string | undefined;
            if (comprobanteFile) {
                const payload = new FormData(); payload.append("file", comprobanteFile);
                comprobanteUrl = await uploadObligacionSupportAction(payload);
            }

            const updatedObligacion = await registrarPagoObligacionAction({
                obligacionId: localObligacion.id,
                fecha: new Date(pagoFecha + "T12:00:00"),
                valor: valor,
                interes: calcInteres,
                capital: calcCapital,
                saldoRestante: nuevoSaldo > 0 ? nuevoSaldo : 0,
                cuentaBancariaId: cuentaId || undefined,
                comprobanteUrl: comprobanteUrl,
                tipoPago: pagoTipo
            });

            setLocalObligacion(updatedObligacion);
            onObligacionUpdated(updatedObligacion);

            setPagoValor("");
            setCuentaId("");
            setComprobanteFile(null);
            setSaldo(updatedObligacion.saldoCapital.toString());
            await refreshErpData();
            toast({ title: "Pago registrado", description: "El abono ha sido guardado correctamente." });
        } catch (error) {
            console.error("Error registering payment:", error);
            toast({ title: "No se completó el proceso", description: error instanceof Error ? error.message : "Compruebe la conexión y revise el historial antes de repetir el pago.", variant: "destructive" });
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
            <DialogContent className="w-[min(96vw,920px)] max-w-[96vw] h-[min(90dvh,860px)] max-h-[90dvh] flex flex-col overflow-hidden p-4 sm:p-6">
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
                    <TabsList className="flex w-full overflow-x-auto gap-1 justify-start">
                        <TabsTrigger className="shrink-0 min-w-[130px] text-xs sm:text-sm" value="pagos">Registrar & Historial</TabsTrigger>
                        <TabsTrigger className="shrink-0 min-w-[130px] text-xs sm:text-sm" value="amortizacion">Proyección Dinámica</TabsTrigger>
                        <TabsTrigger className="shrink-0 min-w-[130px] text-xs sm:text-sm" value="detalle">Info. General</TabsTrigger>
                    </TabsList>

                    {/* --- DETAILS TAB --- */}
                    <TabsContent value="detalle" className="flex-1 overflow-auto p-4 border rounded-md mt-2">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Entidad</Label>
                                <Input
                                    value={entidad}
                                    onChange={(e) => setEntidad(e.target.value)}
                                    disabled={!isEditing}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Monto Original</Label>
                                <div className="col-span-1 md:col-span-3 p-2 bg-muted rounded-md">{formatCurrency(localObligacion.montoPrestado)}</div>
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
                        <div className="p-2 text-sm text-center sticky top-0 bg-background border-b z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <TabsContent value="pagos" className="flex-1 min-h-0 overflow-y-auto flex flex-col mt-2">
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
                                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted bg-background">
                                                <RadioGroupItem value="CUOTA" id="r1" />
                                                <Label htmlFor="r1" className="cursor-pointer">Pago de Cuota</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted bg-background">
                                                <RadioGroupItem value="ABONO_CAPITAL" id="r2" />
                                                <Label htmlFor="r2" className="cursor-pointer">Abono a Capital</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Fecha</Label>
                                            <Input type="date" value={pagoFecha} onChange={e => setPagoFecha(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Valor Total a Pagar</Label>
                                            <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={pagoValor} onChange={e => setPagoValor(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Cuenta de Salida (Opcional)</Label>
                                        <Select onValueChange={setCuentaId} value={cuentaId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione cuenta bancaria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cuentasBancarias.map((cuenta) => (
                                                    <SelectItem key={cuenta.id} value={cuenta.id}>
                                                        {cuenta.nombre} ({formatCurrency(cuenta.saldoActual)})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Comprobante de Pago (Opcional)</Label>
                                        <Input 
                                            type="file" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    setComprobanteFile(e.target.files[0]);
                                                } else {
                                                    setComprobanteFile(null);
                                                }
                                            }}
                                            className="cursor-pointer"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                </div>

                                <div className="bg-background p-4 rounded-md border shadow-sm space-y-2">
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
                                    {pagoError && <p role="alert" className="text-xs rounded border border-destructive/30 bg-destructive/5 p-2 text-destructive">{pagoError}</p>}
                                    <Button className="w-full mt-4" onClick={handleRegistrarPago} disabled={isLoading || !!pagoError || !pagoValor}>
                                        {isLoading ? "Procesando..." : "Confirmar Pago"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* HISTORY TABLE */}
                        <div className="min-h-[180px] max-h-[340px] overflow-auto rounded-md border bg-background">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Valor Pagado</TableHead>
                                        <TableHead className="text-right">Interés</TableHead>
                                        <TableHead className="text-right">Capital</TableHead>
                                        <TableHead className="text-right">Saldo Restante</TableHead>
                                        <TableHead className="text-center w-[80px]">Soporte</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!localObligacion.pagos || localObligacion.pagos.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No hay pagos registrados aún.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        [...localObligacion.pagos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((pago) => {
                                            const d = new Date(pago.fecha);
                                            const localD = d;
                                            return (
                                            <TableRow key={pago.id}>
                                                <TableCell>{format(localD, "dd MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(pago.valor)}</TableCell>
                                                <TableCell className="text-right text-red-500">{pago.interes ? formatCurrency(pago.interes) : '-'}</TableCell>
                                                <TableCell className="text-right text-green-600">{pago.capital ? formatCurrency(pago.capital) : '-'}</TableCell>
                                                <TableCell className="text-right font-mono text-xs">{formatCurrency(pago.saldoRestante)}</TableCell>
                                                <TableCell className="text-center">
                                                    {pago.comprobanteUrl ? (
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <a href={pago.comprobanteUrl} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4 text-blue-600" />
                                                            </a>
                                                        </Button>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        )})
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

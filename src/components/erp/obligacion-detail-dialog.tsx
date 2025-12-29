"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, Pencil, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { ObligacionFinanciera, PagoObligacion } from "@/types/sistema";
import { formatCurrency } from "@/lib/utils";

interface ObligacionDetailDialogProps {
    obligacion: ObligacionFinanciera;
    onObligacionUpdated: (obligacion: ObligacionFinanciera) => void;
    trigger?: React.ReactNode;
}

export function ObligacionDetailDialog({ obligacion, onObligacionUpdated, trigger }: ObligacionDetailDialogProps) {
    const [open, setOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form states for general editing
    const [entidad, setEntidad] = useState(obligacion.entidad);
    const [saldo, setSaldo] = useState(obligacion.saldoCapital.toString());

    // Payment Form state
    const [pagoValor, setPagoValor] = useState("");
    const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().split('T')[0]);

    // Amortization Calculation (Projected)
    const amortizationTable = useMemo(() => {
        const rows = [];
        let currentBalance = obligacion.montoPrestado;
        const rateMonthly = Math.pow(1 + obligacion.tasaInteres, 1 / 12) - 1;
        const cuota = obligacion.valorCuota;

        for (let i = 1; i <= obligacion.plazoMeses; i++) {
            const interest = currentBalance * rateMonthly;
            const capital = cuota - interest;
            const endingBalance = currentBalance - capital;

            rows.push({
                periodo: i,
                cuota: cuota,
                interes: interest,
                capital: capital,
                saldo: endingBalance > 0 ? endingBalance : 0
            });
            currentBalance = endingBalance;
        }
        return rows;
    }, [obligacion.montoPrestado, obligacion.tasaInteres, obligacion.plazoMeses, obligacion.valorCuota]);

    const handleSaveGeneral = () => {
        const updated: ObligacionFinanciera = {
            ...obligacion,
            entidad,
            saldoCapital: parseFloat(saldo)
        };
        onObligacionUpdated(updated);
        setIsEditing(false);
    };

    const handleRegistrarPago = () => {
        if (!pagoValor || !pagoFecha) return;
        const valor = parseFloat(pagoValor);
        const rateMonthly = Math.pow(1 + obligacion.tasaInteres, 1 / 12) - 1;

        // Calculate breakdown based on current saldo
        const interes = obligacion.saldoCapital * rateMonthly;
        const capital = valor - interes;
        const nuevoSaldo = obligacion.saldoCapital - capital;

        const nuevoPago: PagoObligacion = {
            id: `PAY-${Date.now()}`,
            fecha: new Date(pagoFecha),
            valor: valor,
            interes: interes > 0 ? interes : 0,
            capital: capital,
            saldoRestante: nuevoSaldo > 0 ? nuevoSaldo : 0
        };

        const updated: ObligacionFinanciera = {
            ...obligacion,
            saldoCapital: nuevoPago.saldoRestante,
            pagos: [...(obligacion.pagos || []), nuevoPago]
        };

        onObligacionUpdated(updated);
        setPagoValor("");
        setSaldo(nuevoPago.saldoRestante.toString()); // Sync local saldo display
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
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Detalle de Obligación: {obligacion.entidad}
                    </DialogTitle>
                    <DialogDescription>
                        Información del crédito, tabla de amortización y registro de pagos.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="detalle" className="flex-1 overflow-hidden flex flex-col mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="detalle">Información General</TabsTrigger>
                        <TabsTrigger value="amortizacion">Tabla Proyectada</TabsTrigger>
                        <TabsTrigger value="pagos">Historial de Pagos</TabsTrigger>
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
                                <div className="col-span-3 p-2 bg-muted rounded-md">{formatCurrency(obligacion.montoPrestado)}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Tasa Interés</Label>
                                <div className="col-span-3 p-2 bg-muted rounded-md">{(obligacion.tasaInteres * 100).toFixed(2)}% E.A.</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Saldo Actual</Label>
                                <Input
                                    type="number"
                                    value={saldo}
                                    onChange={(e) => setSaldo(e.target.value)}
                                    disabled={!isEditing} // Often we disable manual editing if payments drive it
                                    className="col-span-3 font-bold text-red-600"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right font-bold">Cuota Mensual</Label>
                                <div className="col-span-3 p-2 bg-muted rounded-md">{formatCurrency(obligacion.valorCuota)}</div>
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
                        <div className="p-2 text-sm text-muted-foreground bg-muted/50 text-center sticky top-0">
                            Proyección de pagos (Cuota Fija)
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Periodo</TableHead>
                                    <TableHead className="text-right">Cuota</TableHead>
                                    <TableHead className="text-right">Interés</TableHead>
                                    <TableHead className="text-right">Abono Capital</TableHead>
                                    <TableHead className="text-right">Saldo Final</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {amortizationTable.map((row) => (
                                    <TableRow key={row.periodo}>
                                        <TableCell className="font-medium">{row.periodo}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(row.cuota)}</TableCell>
                                        <TableCell className="text-right text-red-500">{formatCurrency(row.interes)}</TableCell>
                                        <TableCell className="text-right text-green-600">{formatCurrency(row.capital)}</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(row.saldo)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>

                    {/* --- PAYMENTS HISTORY TAB --- */}
                    <TabsContent value="pagos" className="flex-1 overflow-hidden flex flex-col mt-2">
                        <div className="p-4 border rounded-md bg-muted/30 mb-4">
                            <h4 className="font-semibold mb-2 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Registrar Nuevo Abono</h4>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label>Fecha de Pago</Label>
                                    <Input type="date" value={pagoFecha} onChange={e => setPagoFecha(e.target.value)} />
                                </div>
                                <div className="flex-1">
                                    <Label>Valor Pagado</Label>
                                    <Input type="number" placeholder="0" value={pagoValor} onChange={e => setPagoValor(e.target.value)} />
                                </div>
                                <Button onClick={handleRegistrarPago}>Registrar Pago</Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-right">Valor Pagado</TableHead>
                                        <TableHead className="text-right">Interés Calc.</TableHead>
                                        <TableHead className="text-right">Capital Abonado</TableHead>
                                        <TableHead className="text-right">Nuevo Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!obligacion.pagos || obligacion.pagos.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No hay pagos registrados aún.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        obligacion.pagos.map((pago) => (
                                            <TableRow key={pago.id}>
                                                <TableCell>{format(new Date(pago.fecha), "dd MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell className="text-right font-bold">{formatCurrency(pago.valor)}</TableCell>
                                                <TableCell className="text-right text-red-500">{pago.interes ? formatCurrency(pago.interes) : '-'}</TableCell>
                                                <TableCell className="text-right text-green-600">{pago.capital ? formatCurrency(pago.capital) : '-'}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(pago.saldoRestante)}</TableCell>
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

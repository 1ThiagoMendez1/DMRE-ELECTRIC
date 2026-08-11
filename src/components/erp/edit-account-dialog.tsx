"use client";

import { useState, useEffect } from "react";
import { Plus, Landmark, Wallet, Pencil } from "lucide-react";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CuentaBancaria, TipoCuenta } from "@/types/sistema";

interface EditAccountDialogProps {
    cuenta: CuentaBancaria;
    onAccountUpdated: (account: CuentaBancaria) => void;
    trigger?: React.ReactNode;
}

export function EditAccountDialog({ cuenta, onAccountUpdated, trigger }: EditAccountDialogProps) {
    const [open, setOpen] = useState(false);
    const [nombre, setNombre] = useState(cuenta.nombre);
    const [numero, setNumero] = useState(cuenta.numeroCuenta || "");
    const [tipo, setTipo] = useState<TipoCuenta>(cuenta.tipo);
    const [saldo, setSaldo] = useState(cuenta.saldoActual.toString());
    const [banco, setBanco] = useState(cuenta.banco || "");

    // Credit fields
    const [cupoTotal, setCupoTotal] = useState(cuenta.cupoTotal?.toString() || "");
    const [fechaCorte, setFechaCorte] = useState(cuenta.fechaCorte?.toString() || "");
    const [fechaPago, setFechaPago] = useState(cuenta.fechaPago?.toString() || "");
    const [tasaInteres, setTasaInteres] = useState(cuenta.tasaInteres?.toString() || "");

    useEffect(() => {
        if (open) {
            setNombre(cuenta.nombre);
            setNumero(cuenta.numeroCuenta || "");
            setTipo(cuenta.tipo);
            setSaldo(cuenta.saldoActual.toString());
            setBanco(cuenta.banco || "");
            setCupoTotal(cuenta.cupoTotal?.toString() || "");
            setFechaCorte(cuenta.fechaCorte?.toString() || "");
            setFechaPago(cuenta.fechaPago?.toString() || "");
            setTasaInteres(cuenta.tasaInteres?.toString() || "");
        }
    }, [open, cuenta]);

    const handleSave = () => {
        if (!nombre || !saldo) return;

        const updatedAccount: CuentaBancaria = {
            ...cuenta,
            nombre,
            numeroCuenta: numero,
            banco: banco || (tipo === 'BANCO' || tipo === 'CREDITO' ? nombre : undefined),
            tipo,
            saldoActual: parseFloat(saldo),
            cupoTotal: tipo === 'CREDITO' ? parseFloat(cupoTotal) : undefined,
            fechaCorte: tipo === 'CREDITO' ? parseInt(fechaCorte) : undefined,
            fechaPago: tipo === 'CREDITO' ? parseInt(fechaPago) : undefined,
            tasaInteres: tipo === 'CREDITO' ? parseFloat(tasaInteres) : undefined,
        };

        onAccountUpdated(updatedAccount);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" title="Editar">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Cuenta</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles de la cuenta.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo-edit" className="text-right">
                            Tipo
                        </Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCuenta)}>
                            <SelectTrigger className="col-span-1 md:col-span-3">
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANCO">Cuenta Bancaria</SelectItem>
                                <SelectItem value="EFECTIVO">Caja / Efectivo</SelectItem>
                                <SelectItem value="CREDITO">Tarjeta / Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre-edit" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="nombre-edit"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>

                    {(tipo === 'BANCO' || tipo === 'CREDITO') && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="banco-edit" className="text-right">
                                    Banco
                                </Label>
                                <Input
                                    id="banco-edit"
                                    value={banco}
                                    onChange={(e) => setBanco(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="numero-edit" className="text-right">
                                    Número
                                </Label>
                                <Input
                                    id="numero-edit"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                        </>
                    )}

                    {tipo === 'CREDITO' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="cupo-edit" className="text-right">
                                    Cupo Total
                                </Label>
                                <Input
                                    id="cupo-edit"
                                    type="number"
                                    placeholder="0"
                                    value={cupoTotal}
                                    onChange={(e) => setCupoTotal(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="corte-edit" className="text-right text-xs">
                                    Día Corte
                                </Label>
                                <Input
                                    id="corte-edit"
                                    type="number"
                                    placeholder="DD"
                                    min="1"
                                    max="31"
                                    value={fechaCorte}
                                    onChange={(e) => setFechaCorte(e.target.value)}
                                    className="col-span-1"
                                />
                                <Label htmlFor="pago-edit" className="text-right text-xs">
                                    Día Pago
                                </Label>
                                <Input
                                    id="pago-edit"
                                    type="number"
                                    placeholder="DD"
                                    min="1"
                                    max="31"
                                    value={fechaPago}
                                    onChange={(e) => setFechaPago(e.target.value)}
                                    className="col-span-1"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="interes-edit" className="text-right text-xs">
                                    Tasa (%)
                                </Label>
                                <Input
                                    id="interes-edit"
                                    type="number"
                                    step="0.01"
                                    placeholder="2.5"
                                    value={tasaInteres}
                                    onChange={(e) => setTasaInteres(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="saldo-edit" className="text-right">
                            {tipo === 'CREDITO' ? 'Deuda Actual' : 'Saldo Actual'}
                        </Label>
                        <Input
                            id="saldo-edit"
                            type="number"
                            value={saldo}
                            onChange={(e) => setSaldo(e.target.value)}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

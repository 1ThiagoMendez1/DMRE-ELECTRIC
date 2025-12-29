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

    useEffect(() => {
        if (open) {
            setNombre(cuenta.nombre);
            setNumero(cuenta.numeroCuenta || "");
            setTipo(cuenta.tipo);
            setSaldo(cuenta.saldoActual.toString());
            setBanco(cuenta.banco || "");
        }
    }, [open, cuenta]);

    const handleSave = () => {
        if (!nombre || !saldo) return;

        const updatedAccount: CuentaBancaria = {
            ...cuenta,
            nombre,
            numeroCuenta: numero,
            banco: banco || (tipo === 'BANCO' ? nombre : undefined), // Default bank name to account name if empty and is bank
            tipo,
            saldoActual: parseFloat(saldo),
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
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo-edit" className="text-right">
                            Tipo
                        </Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCuenta)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANCO">Cuenta Bancaria</SelectItem>
                                <SelectItem value="EFECTIVO">Caja / Efectivo</SelectItem>
                                <SelectItem value="CREDITO">Crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre-edit" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="nombre-edit"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="col-span-3"
                        />
                    </div>

                    {tipo === 'BANCO' && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="banco-edit" className="text-right">
                                    Banco
                                </Label>
                                <Input
                                    id="banco-edit"
                                    value={banco}
                                    onChange={(e) => setBanco(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="numero-edit" className="text-right">
                                    Número
                                </Label>
                                <Input
                                    id="numero-edit"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="saldo-edit" className="text-right">
                            Saldo
                        </Label>
                        <Input
                            id="saldo-edit"
                            type="number"
                            value={saldo}
                            onChange={(e) => setSaldo(e.target.value)}
                            className="col-span-3"
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

"use client";

import { useState } from "react";
import { Plus, Landmark, Wallet } from "lucide-react";
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
import { CuentaBancaria } from "@/types/sistema";

interface CreateAccountDialogProps {
    onAccountCreated: (account: CuentaBancaria) => void;
}

export function CreateAccountDialog({ onAccountCreated }: CreateAccountDialogProps) {
    const [open, setOpen] = useState(false);
    const [nombre, setNombre] = useState("");
    const [numero, setNumero] = useState("");
    const [tipo, setTipo] = useState<"BANCO" | "EFECTIVO" | "CREDITO">("BANCO");
    const [saldo, setSaldo] = useState("");
    const [banco, setBanco] = useState("");
    
    // Credit fields
    const [cupoTotal, setCupoTotal] = useState("");
    const [fechaCorte, setFechaCorte] = useState("");
    const [fechaPago, setFechaPago] = useState("");
    const [tasaInteres, setTasaInteres] = useState("");

    const handleSave = () => {
        if (!nombre) return;

        const newAccount: CuentaBancaria = {
            id: `ACC-${Date.now()}`,
            nombre,
            numeroCuenta: numero,
            banco: banco || nombre,
            tipo,
            saldoActual: parseFloat(saldo) || 0,
            cupoTotal: tipo === 'CREDITO' ? parseFloat(cupoTotal) : undefined,
            fechaCorte: tipo === 'CREDITO' ? parseInt(fechaCorte) : undefined,
            fechaPago: tipo === 'CREDITO' ? parseInt(fechaPago) : undefined,
            tasaInteres: tipo === 'CREDITO' ? parseFloat(tasaInteres) : undefined,
        };

        onAccountCreated(newAccount);
        setOpen(false);
        setNombre("");
        setNumero("");
        setTipo("BANCO");
        setSaldo("");
        setBanco("");
        setCupoTotal("");
        setFechaCorte("");
        setFechaPago("");
        setTasaInteres("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Cuenta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Cuenta</DialogTitle>
                    <DialogDescription>
                        Registra una nueva cuenta bancaria, caja menor o tarjeta de crédito.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right">
                            Tipo
                        </Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
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
                        <Label htmlFor="nombre" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="nombre"
                            placeholder="Ej: Bancolombia Principal"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>

                    {(tipo === 'BANCO' || tipo === 'CREDITO') && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="banco" className="text-right">
                                    Banco
                                </Label>
                                <Input
                                    id="banco"
                                    placeholder="Ej: Bancolombia"
                                    value={banco}
                                    onChange={(e) => setBanco(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="numero" className="text-right">
                                    Número
                                </Label>
                                <Input
                                    id="numero"
                                    placeholder="000-000-000-00"
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
                                <Label htmlFor="cupo" className="text-right">
                                    Cupo Total
                                </Label>
                                <Input
                                    id="cupo"
                                    type="number"
                                    placeholder="0"
                                    value={cupoTotal}
                                    onChange={(e) => setCupoTotal(e.target.value)}
                                    className="col-span-1 md:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                <Label htmlFor="corte" className="text-right text-xs">
                                    Día Corte
                                </Label>
                                <Input
                                    id="corte"
                                    type="number"
                                    placeholder="DD"
                                    min="1"
                                    max="31"
                                    value={fechaCorte}
                                    onChange={(e) => setFechaCorte(e.target.value)}
                                    className="col-span-1"
                                />
                                <Label htmlFor="pago" className="text-right text-xs">
                                    Día Pago
                                </Label>
                                <Input
                                    id="pago"
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
                                <Label htmlFor="interes" className="text-right text-xs">
                                    Tasa (%)
                                </Label>
                                <Input
                                    id="interes"
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
                        <Label htmlFor="saldo" className="text-right">
                            {tipo === 'CREDITO' ? 'Deuda Actual' : 'Saldo Inicial'}
                        </Label>
                        <Input
                            id="saldo"
                            type="number"
                            placeholder="0"
                            value={saldo}
                            onChange={(e) => setSaldo(e.target.value)}
                            className="col-span-1 md:col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Guardar Cuenta</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

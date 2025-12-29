"use client";

import { useState } from "react";
import { Plus, CreditCard } from "lucide-react";
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
import { ObligacionFinanciera } from "@/types/sistema";

interface CreateObligacionDialogProps {
    onObligacionCreated: (obligacion: ObligacionFinanciera) => void;
}

export function CreateObligacionDialog({ onObligacionCreated }: CreateObligacionDialogProps) {
    const [open, setOpen] = useState(false);

    // States
    const [entidad, setEntidad] = useState("");
    const [monto, setMonto] = useState("");
    const [tasa, setTasa] = useState(""); // E.A.
    const [plazo, setPlazo] = useState("");
    const [fecha, setFecha] = useState("");

    const calculateCuota = (P: number, ea: number, n: number) => {
        if (ea === 0) return P / n;
        const mv = Math.pow(1 + ea, 1 / 12) - 1;
        return P * (mv * Math.pow(1 + mv, n)) / (Math.pow(1 + mv, n) - 1);
    }

    const handleSave = () => {
        if (!entidad || !monto || !tasa || !plazo || !fecha) return;

        const P = parseFloat(monto);
        const rate = parseFloat(tasa) / 100; // Input as percentage e.g. 15
        const n = parseInt(plazo);
        const cuota = calculateCuota(P, rate, n);

        const newObligacion: ObligacionFinanciera = {
            id: `OBL-${Date.now()}`,
            entidad,
            montoPrestado: P,
            tasaInteres: rate,
            plazoMeses: n,
            saldoCapital: P, // Initially full amount
            valorCuota: cuota,
            fechaInicio: new Date(fecha)
        };

        onObligacionCreated(newObligacion);
        setOpen(false);
        // Reset
        setEntidad("");
        setMonto("");
        setTasa("");
        setPlazo("");
        setFecha("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Obligación
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Obligación Financiera</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles del préstamos o crédito.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="entidad" className="text-right">Entidad</Label>
                        <Input
                            id="entidad"
                            placeholder="Ej: Banco Agrario"
                            value={entidad}
                            onChange={(e) => setEntidad(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="monto" className="text-right">Monto</Label>
                        <Input
                            id="monto"
                            type="number"
                            placeholder="0"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tasa" className="text-right">Tasa (E.A %)</Label>
                        <Input
                            id="tasa"
                            type="number"
                            placeholder="Ej: 14.5"
                            value={tasa}
                            onChange={(e) => setTasa(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="plazo" className="text-right">Plazo (Meses)</Label>
                        <Input
                            id="plazo"
                            type="number"
                            placeholder="Ej: 36"
                            value={plazo}
                            onChange={(e) => setPlazo(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fecha" className="text-right">Fecha Inicio</Label>
                        <Input
                            id="fecha"
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Guardar Obligación</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

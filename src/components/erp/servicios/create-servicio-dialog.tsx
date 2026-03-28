"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ServicioLogistica } from "@/types/sistema";
import { useToast } from "@/hooks/use-toast";

interface CreateServicioDialogProps {
    onCreateServicio: (servicio: Omit<ServicioLogistica, "id" | "codigo" | "createdAt">) => Promise<void>;
}

export function CreateServicioDialog({ onCreateServicio }: CreateServicioDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [nombre, setNombre] = useState("");
    const [costo, setCosto] = useState<number | string>("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" });
            return;
        }

        const numCosto = Number(costo);
        if (isNaN(numCosto) || numCosto < 0) {
            toast({ title: "Error", description: "El costo debe ser numérico", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await onCreateServicio({
                nombre: nombre.trim(),
                costo: numCosto,
            });
            toast({ title: "¡Servicio Creado!", description: "El servicio ha sido guardado y el código fue asignado exitosamente." });
            setOpen(false);
            setNombre("");
            setCosto("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Ocurrió un error al crear.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Servicio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Servicio</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Código</Label>
                        <Input disabled placeholder="Auto-generado (ej: SE-001)" className="bg-muted" />
                        <p className="text-[10px] text-muted-foreground">El código se asignará de manera incremental y única automáticamente.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Nombre del Servicio <span className="text-red-500">*</span></Label>
                        <Input
                            required
                            placeholder="Mantenimiento eléctrico..."
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Costo ($)</Label>
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={costo === 0 ? "" : costo}
                            onChange={(e) => setCosto(e.target.value)}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creando..." : "Crear Servicio"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

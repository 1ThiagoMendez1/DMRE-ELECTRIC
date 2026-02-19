"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface RegisterConsumoDialogProps {
    materialId: string;
    materialNombre: string;
    materialUnidad: string;
    trabajos: { id: string; nombre: string; codigo: string }[];
    onConsumoRegistered: (input: {
        inventarioId?: string;
        descripcionMaterial?: string;
        cotizacionId?: string;
        cantidad: number;
        unidad: string;
        descripcion?: string;
    }) => Promise<void>;
}

export function RegisterConsumoDialog({
    materialId,
    materialNombre,
    materialUnidad,
    trabajos,
    onConsumoRegistered,
}: RegisterConsumoDialogProps) {
    const [open, setOpen] = useState(false);
    const [cantidad, setCantidad] = useState("");
    const [cotizacionId, setCotizacionId] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        const qty = parseFloat(cantidad);
        if (!qty || qty <= 0) {
            toast({ title: "Error", description: "Ingrese una cantidad válida.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const cleanCotizacionId = cotizacionId && cotizacionId !== "none" ? cotizacionId : undefined;
            await onConsumoRegistered({
                inventarioId: materialId,
                descripcionMaterial: materialNombre,
                cotizacionId: cleanCotizacionId,
                cantidad: qty,
                unidad: materialUnidad,
                descripcion: descripcion || undefined,
            });
            toast({ title: "✅ Consumo Registrado", description: `Se registraron ${qty} ${materialUnidad} de ${materialNombre}.` });
            setCantidad("");
            setCotizacionId("");
            setDescripcion("");
            setOpen(false);
        } catch (error: any) {
            console.error("Register consumo error:", error);
            toast({
                title: "Error al Registrar",
                description: error?.message || "No se pudo registrar el consumo. Verifica que la tabla consumo_material exista en Supabase.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button variant="default" size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> Registrar Consumo
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar Consumo</DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Material: <strong>{materialNombre}</strong>
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Cantidad *</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(e.target.value)}
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unidad</Label>
                                <Input value={materialUnidad} disabled />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Proyecto / Trabajo</Label>
                            <Select value={cotizacionId} onValueChange={setCotizacionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proyecto (opcional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin proyecto</SelectItem>
                                    {trabajos.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.codigo} — {t.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Descripción / Nota</Label>
                            <Textarea
                                placeholder="Ej: Instalación eléctrica piso 3..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Registrando..." : "Registrar"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

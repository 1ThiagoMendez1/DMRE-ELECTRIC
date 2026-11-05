"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { DotacionItem } from "@/types/sistema";

type NuevoItem = Omit<DotacionItem, "id">;

export function CreateDotacionItemDialog({ onCreated }: { onCreated: (item: NuevoItem) => Promise<void> }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [descripcion, setDescripcion] = useState("");
    const [codigo, setCodigo] = useState("");
    const [categoria, setCategoria] = useState<DotacionItem["categoria"]>("EPP");
    const [genero, setGenero] = useState<DotacionItem["genero"]>("UNISEX");
    const [talla, setTalla] = useState("ÚNICA");
    const [color, setColor] = useState("ESTÁNDAR");
    const [cantidad, setCantidad] = useState("0");
    const [minimo, setMinimo] = useState("0");

    const handleSave = async () => {
        const stock = Number(cantidad), min = Number(minimo);
        if (!descripcion.trim() || !talla.trim() || !color.trim() ||
            !Number.isInteger(stock) || stock < 0 || !Number.isInteger(min) || min < 0) {
            toast({ title: "Revisa los campos", description: "Indica una descripción, talla, color y cantidades enteras no negativas.", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            await onCreated({
                descripcion: descripcion.trim(), codigo: codigo.trim() || undefined,
                categoria, genero, activo: true, stockMinimo: min,
                variantes: [{ id: "", talla: talla.trim(), color: color.trim(), cantidadDisponible: stock }]
            });
            toast({ title: "Dotación registrada", description: "El artículo ya está disponible para asignaciones." });
            setOpen(false);
            setDescripcion(""); setCodigo(""); setTalla("ÚNICA"); setColor("ESTÁNDAR");
            setCantidad("0"); setMinimo("0");
        } catch (error) {
            toast({ title: "No se pudo registrar", description: error instanceof Error ? error.message : "Comprueba los permisos y la conexión.", variant: "destructive" });
        } finally { setSaving(false); }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Registrar dotación</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Registrar artículo de dotación</DialogTitle>
                    <DialogDescription>Crea uniformes, equipos de protección o herramientas con su existencia inicial.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    <div className="sm:col-span-2 space-y-1.5"><Label htmlFor="dot-descripcion">Descripción *</Label><Input id="dot-descripcion" value={descripcion} onChange={e=>setDescripcion(e.target.value)} placeholder="Ej. Casco de seguridad" /></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-codigo">Código (opcional)</Label><Input id="dot-codigo" value={codigo} onChange={e=>setCodigo(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-categoria">Categoría</Label><select id="dot-categoria" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={categoria} onChange={e=>setCategoria(e.target.value as DotacionItem["categoria"])}><option value="EPP">Protección / EPP</option><option value="UNIFORME">Uniforme</option><option value="HERRAMIENTA">Herramienta</option></select></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-genero">Tipo</Label><select id="dot-genero" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={genero} onChange={e=>setGenero(e.target.value as DotacionItem["genero"])}><option value="UNISEX">Unisex</option><option value="MASCULINO">Hombre</option><option value="FEMENINO">Mujer</option></select></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-talla">Talla / medida *</Label><Input id="dot-talla" value={talla} onChange={e=>setTalla(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-color">Color / referencia *</Label><Input id="dot-color" value={color} onChange={e=>setColor(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-cantidad">Existencia inicial *</Label><Input id="dot-cantidad" type="number" min="0" step="1" value={cantidad} onChange={e=>setCantidad(e.target.value)} /></div>
                    <div className="space-y-1.5"><Label htmlFor="dot-minimo">Stock mínimo</Label><Input id="dot-minimo" type="number" min="0" step="1" value={minimo} onChange={e=>setMinimo(e.target.value)} /></div>
                </div>
                <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)} disabled={saving}>Cancelar</Button><Button onClick={handleSave} disabled={saving || !descripcion.trim()}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar artículo</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

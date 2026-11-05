"use client";

import { useMemo, useState } from "react";
import { HardHat, Package, Search, ClipboardCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useErp } from "@/components/providers/erp-provider";
import { CreateDotacionItemDialog } from "@/components/erp/create-dotacion-item-dialog";
import { NewEntregaDialog } from "@/components/erp/new-entrega-dialog";

export default function DotacionPage() {
    const { dotacionItems, entregasDotacion, empleados, addDotacionItem, addEntregaDotacion } = useErp();
    const [search, setSearch] = useState("");
    const stock = useMemo(() => dotacionItems.flatMap(item =>
        item.variantes.map(v => ({ ...v, nombre: item.descripcion, itemId: item.id, minimo: item.stockMinimo || 0, categoria: item.categoria }))
    ), [dotacionItems]);
    const filtered = stock.filter(v => [v.nombre, v.talla, v.color].join(" ").toLowerCase().includes(search.toLowerCase()));
    const pendientes = entregasDotacion.filter(e => e.estado === "ASIGNADO").length;
    const stockBajo = stock.filter(v => v.cantidadDisponible <= v.minimo).length;
    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Dotación</h1>
                    <p className="text-muted-foreground">Registro, existencias y trazabilidad de uniformes y EPP.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <CreateDotacionItemDialog onCreated={addDotacionItem} />
                    <NewEntregaDialog items={dotacionItems} empleados={empleados} onSave={addEntregaDotacion} />
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-l-4 border-l-primary"><CardContent className="flex gap-3 items-center p-5"><Package className="text-primary" /><div><p className="text-xs text-muted-foreground">Referencias</p><p className="text-2xl font-bold">{dotacionItems.length}</p></div></CardContent></Card>
                <Card className="border-l-4 border-l-amber-500"><CardContent className="flex gap-3 items-center p-5"><AlertTriangle className="text-amber-500" /><div><p className="text-xs text-muted-foreground">Variantes en stock bajo</p><p className="text-2xl font-bold">{stockBajo}</p></div></CardContent></Card>
                <Card className="border-l-4 border-l-sky-500"><CardContent className="flex gap-3 items-center p-5"><ClipboardCheck className="text-sky-500" /><div><p className="text-xs text-muted-foreground">Entregas por confirmar</p><p className="text-2xl font-bold">{pendientes}</p></div></CardContent></Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                <Card className="min-w-0">
                    <CardHeader className="space-y-3">
                        <CardTitle className="flex gap-2 items-center"><Package className="h-5 w-5" /> Inventario de dotación</CardTitle>
                        <div className="relative"><Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar artículo, talla o color" value={search} onChange={e=>setSearch(e.target.value)} /></div>
                    </CardHeader>
                    <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Artículo</TableHead><TableHead>Talla y color</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Disponible</TableHead></TableRow></TableHeader>
                        <TableBody>{filtered.length ? filtered.map(v => <TableRow key={v.id}><TableCell className="font-medium">{v.nombre}<p className="text-xs text-muted-foreground">{v.categoria}</p></TableCell><TableCell>{v.talla} · {v.color}</TableCell><TableCell>{v.cantidadDisponible <= v.minimo ? <Badge variant="destructive">Stock bajo</Badge> : <Badge variant="secondary">Disponible</Badge>}</TableCell><TableCell className="text-right font-mono font-semibold">{v.cantidadDisponible}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay referencias que coincidan. Utiliza «Registrar dotación» para crear una.</TableCell></TableRow>}</TableBody>
                    </Table></div></CardContent>
                </Card>
                <Card className="min-w-0">
                    <CardHeader><CardTitle className="flex gap-2 items-center"><HardHat className="h-5 w-5" /> Historial de entregas</CardTitle></CardHeader>
                    <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead>Fecha</TableHead><TableHead>Artículo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                        <TableBody>{entregasDotacion.length ? entregasDotacion.slice(0, 30).map(e=><TableRow key={e.id}><TableCell className="font-medium">{e.empleado?.nombreCompleto || "Empleado"}</TableCell><TableCell>{format(new Date(e.fecha), "dd MMM yyyy", {locale: es})}</TableCell><TableCell>{e.items.map(i=>i.descripcion || i.detalle).join(", ")}</TableCell><TableCell><Badge variant={e.estado==="ENTREGADO"?"default":"outline"}>{e.estado}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay entregas registradas.</TableCell></TableRow>}</TableBody>
                    </Table></div></CardContent>
                </Card>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Package,
    Search,
    Trash2,
    TrendingUp,
    Calendar,
    Building2,
    Loader2,
} from "lucide-react";
import { InventarioItem, ConsumoMaterial } from "@/types/sistema";
import {
    getConsumosByMaterialAction,
    deleteConsumoAction,
} from "@/app/dashboard/sistema/inventario/materiales-consumo-actions";
import { RegisterConsumoDialog } from "./register-consumo-dialog";
import { useToast } from "@/hooks/use-toast";

interface MaterialDetailConsumoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    material: InventarioItem | null;
    totalConsumido: number;
    trabajos: { id: string; nombre: string; codigo: string }[];
    onConsumoRegistered: (input: {
        inventarioId?: string;
        descripcionMaterial?: string;
        cotizacionId?: string;
        cantidad: number;
        unidad: string;
        descripcion?: string;
    }) => Promise<void>;
    onConsumoDeleted?: () => void;
}

export function MaterialDetailConsumoDialog({
    open,
    onOpenChange,
    material,
    totalConsumido,
    trabajos,
    onConsumoRegistered,
    onConsumoDeleted,
}: MaterialDetailConsumoDialogProps) {
    const [consumos, setConsumos] = useState<ConsumoMaterial[]>([]);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Load consumos when dialog opens
    useEffect(() => {
        if (open && material) {
            setIsLoading(true);
            getConsumosByMaterialAction(material.id)
                .then((data) => setConsumos(data))
                .catch((err) => console.error("Error loading consumos:", err))
                .finally(() => setIsLoading(false));
        } else {
            setConsumos([]);
            setSearch("");
        }
    }, [open, material]);

    // Filter consumos by search (project name/code or description)
    const filtered = useMemo(() => {
        if (!search.trim()) return consumos;
        const s = search.toLowerCase();
        return consumos.filter(
            (c) =>
                c.cotizacionNumero?.toLowerCase().includes(s) ||
                c.cotizacionDescripcion?.toLowerCase().includes(s) ||
                c.descripcion?.toLowerCase().includes(s) ||
                c.descripcionMaterial?.toLowerCase().includes(s)
        );
    }, [consumos, search]);

    const handleDelete = async (consumoId: string) => {
        try {
            await deleteConsumoAction(consumoId);
            setConsumos((prev) => prev.filter((c) => c.id !== consumoId));
            onConsumoDeleted?.();
            toast({ title: "Eliminado", description: "Registro de consumo eliminado." });
        } catch (err) {
            toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
        }
    };

    const handleConsumoRegistered = async (input: any) => {
        await onConsumoRegistered(input);
        // Refresh consumos list
        if (material) {
            const data = await getConsumosByMaterialAction(material.id);
            setConsumos(data);
        }
    };

    if (!material) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-blue-500" />
                        {material.descripcion || material.nombre}
                    </DialogTitle>
                </DialogHeader>

                {/* Material Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">SKU</p>
                        <p className="font-semibold text-sm">{material.sku || "—"}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Unidad</p>
                        <p className="font-semibold text-sm">{material.unidad}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Precio Proveedor</p>
                        <p className="font-semibold text-sm">
                            ${(material.precioProveedor || 0).toLocaleString("es-CO")}
                        </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Total Consumido
                        </p>
                        <p className="font-bold text-lg text-blue-700 dark:text-blue-300">
                            {totalConsumido.toLocaleString("es-CO")} {material.unidad}
                        </p>
                    </div>
                </div>

                {material.marca && (
                    <p className="text-sm text-muted-foreground">
                        <strong>Marca:</strong> {material.marca}
                        {material.modelo && ` | Modelo: ${material.modelo}`}
                    </p>
                )}

                <Separator />

                {/* Consumo History Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Historial de Consumo</h3>
                        <RegisterConsumoDialog
                            materialId={material.id}
                            materialNombre={material.descripcion || material.nombre || ""}
                            materialUnidad={material.unidad}
                            trabajos={trabajos}
                            onConsumoRegistered={handleConsumoRegistered}
                        />
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por proyecto o descripción..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Consumo Table */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Cargando historial...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="mx-auto h-10 w-10 mb-2 opacity-40" />
                            <p className="text-sm">
                                {consumos.length === 0
                                    ? "No hay consumos registrados para este material."
                                    : "No se encontraron resultados para la búsqueda."}
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[130px]">
                                            <Calendar className="h-3 w-3 inline mr-1" />
                                            Fecha
                                        </TableHead>
                                        <TableHead>
                                            <Building2 className="h-3 w-3 inline mr-1" />
                                            Proyecto
                                        </TableHead>
                                        <TableHead className="text-right w-[100px]">Cantidad</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell className="text-xs">
                                                {format(new Date(c.fecha), "dd MMM yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>
                                                {c.cotizacionNumero ? (
                                                    <Badge variant="outline" className="text-xs">
                                                        {c.cotizacionNumero}
                                                        {c.cotizacionDescripcion && ` — ${c.cotizacionDescripcion.substring(0, 30)}`}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Sin proyecto</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {Number(c.cantidad).toLocaleString("es-CO")} {c.unidad}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                {c.descripcion || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(c.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Summary footer */}
                    {filtered.length > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                            Mostrando {filtered.length} de {consumos.length} registro(s)
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

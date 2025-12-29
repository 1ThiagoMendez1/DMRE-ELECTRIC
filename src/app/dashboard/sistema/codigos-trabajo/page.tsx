"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Eye, Copy, Wrench, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { initialCodigosTrabajo, initialInventory } from "@/lib/mock-data";
import { CodigoTrabajo, MaterialAsociado } from "@/types/sistema";

export default function CodigosTrabajoPage() {
    const { toast } = useToast();
    const [codigos, setCodigos] = useState<CodigoTrabajo[]>(initialCodigosTrabajo);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCodigo, setEditingCodigo] = useState<CodigoTrabajo | null>(null);

    // Form state
    const [formNombre, setFormNombre] = useState("");
    const [formDescripcion, setFormDescripcion] = useState("");
    const [formManoDeObra, setFormManoDeObra] = useState("");
    const [formMateriales, setFormMateriales] = useState<MaterialAsociado[]>([]);

    const filteredCodigos = useMemo(() => {
        return codigos.filter(c =>
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [codigos, searchTerm]);

    const resetForm = () => {
        setFormNombre("");
        setFormDescripcion("");
        setFormManoDeObra("");
        setFormMateriales([]);
        setEditingCodigo(null);
    };

    const openCreateDialog = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const openEditDialog = (codigo: CodigoTrabajo) => {
        setEditingCodigo(codigo);
        setFormNombre(codigo.nombre);
        setFormDescripcion(codigo.descripcion);
        setFormManoDeObra(codigo.manoDeObra.toString());
        setFormMateriales([...codigo.materiales]);
        setIsDialogOpen(true);
    };

    const addMaterial = () => {
        setFormMateriales([
            ...formMateriales,
            { id: `M-${Date.now()}`, nombre: "", cantidad: 1, valorUnitario: 0 }
        ]);
    };

    const updateMaterial = (id: string, field: keyof MaterialAsociado, value: any) => {
        setFormMateriales(prev =>
            prev.map(m => m.id === id ? { ...m, [field]: value } : m)
        );
    };

    const removeMaterial = (id: string) => {
        setFormMateriales(prev => prev.filter(m => m.id !== id));
    };

    const calculateTotals = () => {
        const costoMateriales = formMateriales.reduce((acc, m) => acc + (m.cantidad * m.valorUnitario), 0);
        const manoObra = parseFloat(formManoDeObra) || 0;
        return { costoMateriales, total: costoMateriales + manoObra };
    };

    const handleSave = () => {
        if (!formNombre.trim()) {
            toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
            return;
        }

        const { costoMateriales, total } = calculateTotals();

        if (editingCodigo) {
            setCodigos(prev => prev.map(c => c.id === editingCodigo.id ? {
                ...c,
                nombre: formNombre,
                descripcion: formDescripcion,
                manoDeObra: parseFloat(formManoDeObra) || 0,
                materiales: formMateriales,
                costoTotalMateriales: costoMateriales,
                costoTotal: total
            } : c));
            toast({ title: "Código Actualizado", description: `"${formNombre}" ha sido modificado.` });
        } else {
            const newCodigo: CodigoTrabajo = {
                id: `COD-${Date.now()}`,
                codigo: `COD-${(codigos.length + 1).toString().padStart(3, '0')}`,
                nombre: formNombre,
                descripcion: formDescripcion,
                manoDeObra: parseFloat(formManoDeObra) || 0,
                materiales: formMateriales,
                costoTotalMateriales: costoMateriales,
                costoTotal: total,
                fechaCreacion: new Date()
            };
            setCodigos([newCodigo, ...codigos]);
            toast({ title: "Código Creado", description: `"${formNombre}" ha sido añadido.` });
        }
        setIsDialogOpen(false);
        resetForm();
    };

    const handleDelete = (id: string) => {
        const codigo = codigos.find(c => c.id === id);
        if (confirm(`¿Eliminar el código "${codigo?.nombre}"?`)) {
            setCodigos(codigos.filter(c => c.id !== id));
            toast({ title: "Código Eliminado", description: "El código ha sido eliminado correctamente." });
        }
    };

    const handleDuplicate = (codigo: CodigoTrabajo) => {
        const duplicated: CodigoTrabajo = {
            ...codigo,
            id: `COD-${Date.now()}`,
            codigo: `COD-${(codigos.length + 1).toString().padStart(3, '0')}`,
            nombre: `${codigo.nombre} (Copia)`,
            fechaCreacion: new Date()
        };
        setCodigos([duplicated, ...codigos]);
        toast({ title: "Código Duplicado", description: `Se creó una copia de "${codigo.nombre}".` });
    };

    const { costoMateriales: previewCostoMat, total: previewTotal } = calculateTotals();

    return (
        <div className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Códigos de Trabajo</h1>
                    <p className="text-muted-foreground">Define y gestiona códigos estándar para tus cotizaciones.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog} className="electric-button">
                            <Plus className="mr-2 h-4 w-4" /> Crear Código
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingCodigo ? "Editar Código" : "Nuevo Código de Trabajo"}</DialogTitle>
                            <DialogDescription>
                                {editingCodigo ? "Modifica los detalles del código." : "Define un nuevo código estándar para cotizaciones."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nombre" className="text-right">Nombre</Label>
                                <Input id="nombre" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="col-span-3" placeholder="Ej: Punto de red Cat 6A" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="descripcion" className="text-right">Descripción</Label>
                                <Textarea id="descripcion" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} className="col-span-3" placeholder="Detalles del trabajo..." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="manoDeObra" className="text-right">Mano de Obra</Label>
                                <Input id="manoDeObra" type="number" value={formManoDeObra} onChange={(e) => setFormManoDeObra(e.target.value)} className="col-span-3" placeholder="Valor en COP" />
                            </div>

                            {/* Materiales Section */}
                            <div className="space-y-3 mt-4">
                                <div className="flex justify-between items-center">
                                    <Label className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Materiales Asociados</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                                        <Plus className="h-3 w-3 mr-1" /> Añadir
                                    </Button>
                                </div>
                                {formMateriales.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-4 border rounded-md bg-muted/30">
                                        No hay materiales. Haz clic en "Añadir" para agregar.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {formMateriales.map((mat) => (
                                            <div key={mat.id} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                                                <Input
                                                    placeholder="Nombre material"
                                                    value={mat.nombre}
                                                    onChange={(e) => updateMaterial(mat.id, "nombre", e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Cant"
                                                    value={mat.cantidad}
                                                    onChange={(e) => updateMaterial(mat.id, "cantidad", parseFloat(e.target.value) || 0)}
                                                    className="w-20"
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="V. Unit"
                                                    value={mat.valorUnitario}
                                                    onChange={(e) => updateMaterial(mat.id, "valorUnitario", parseFloat(e.target.value) || 0)}
                                                    className="w-28"
                                                />
                                                <span className="text-sm font-mono w-28 text-right">{formatCurrency(mat.cantidad * mat.valorUnitario)}</span>
                                                <Button variant="ghost" size="icon" onClick={() => removeMaterial(mat.id)} className="text-destructive h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Totals Preview */}
                            <Card className="mt-4 bg-muted/50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Materiales:</span>
                                        <span className="font-mono">{formatCurrency(previewCostoMat)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Mano de Obra:</span>
                                        <span className="font-mono">{formatCurrency(parseFloat(formManoDeObra) || 0)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                                        <span>Total Código:</span>
                                        <span className="font-mono text-primary">{formatCurrency(previewTotal)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingCodigo ? "Guardar Cambios" : "Crear Código"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, código o descripción..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Listado de Códigos</CardTitle>
                    <CardDescription>{filteredCodigos.length} código(s) encontrado(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Código</TableHead>
                                <TableHead>Nombre / Descripción</TableHead>
                                <TableHead className="text-center">Materiales</TableHead>
                                <TableHead className="text-right">Mano Obra</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right w-[80px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCodigos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron códigos de trabajo.
                                    </TableCell>
                                </TableRow>
                            ) : filteredCodigos.map((codigo) => (
                                <TableRow key={codigo.id}>
                                    <TableCell className="font-mono font-medium">{codigo.codigo}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{codigo.nombre}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">{codigo.descripcion}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{codigo.materiales.length} items</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(codigo.manoDeObra)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(codigo.costoTotal)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => openEditDialog(codigo)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(codigo)}>
                                                    <Copy className="mr-2 h-4 w-4" /> Duplicar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(codigo.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

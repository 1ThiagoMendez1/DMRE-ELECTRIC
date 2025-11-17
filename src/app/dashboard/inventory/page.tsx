import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockInventory } from "@/lib/data";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function InventoryPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Gestión de Inventario</h1>
                    <p className="text-muted-foreground">Administra los materiales y equipos disponibles.</p>
                </div>
                <Button className="electric-button">
                    <Plus />
                    <span>Añadir Ítem</span>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Listado de Inventario</CardTitle>
                    <CardDescription>Todos los ítems disponibles en bodega.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead className="text-center">Cantidad</TableHead>
                                <TableHead className="text-right">Valor Unitario</TableHead>
                                <TableHead className="text-right">Valor Total</TableHead>
                                <TableHead className="text-right">Valor Total (+20%)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockInventory.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        <div>{item.description}</div>
                                        <div className="text-xs text-muted-foreground">{item.materialDescription}</div>
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(item.unitValue)}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(item.totalValue)}</TableCell>
                                    <TableCell className="text-right font-mono font-bold text-primary/90">{formatCurrency(item.totalValue2)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Pencil className="mr-2"/>
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2"/>
                                                    Eliminar
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
    )
}

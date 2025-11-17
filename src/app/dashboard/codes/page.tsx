import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockWorkCodes } from "@/lib/data";
import { MoreVertical, Pencil, Plus, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);


export default function WorkCodesPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Códigos de Trabajo</h1>
                    <p className="text-muted-foreground">Crea y gestiona códigos para estandarizar tus cotizaciones.</p>
                </div>
                <Button className="electric-button">
                    <Plus />
                    <span>Crear Código</span>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Listado de Códigos</CardTitle>
                    <CardDescription>Estos son todos los códigos de trabajo disponibles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Trabajo</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Mano de Obra</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockWorkCodes.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-medium">{code.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{code.description}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(code.labor)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2"/>
                                                    Ver
                                                </DropdownMenuItem>
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

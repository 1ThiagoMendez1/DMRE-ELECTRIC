"use client";

import { useState } from "react";
import { HardHat, Package, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { initialEntregasDotacion, initialDotacionItems } from "@/lib/mock-data";

export default function DotacionPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [entregas, setEntregas] = useState(initialEntregasDotacion);
    const [inventory, setInventory] = useState(initialDotacionItems);

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión de Dotación</h1>
                    <p className="text-muted-foreground">Entrega y control de uniformes y EPP.</p>
                </div>
                <Button onClick={() => toast({ title: "Nueva Entrega", description: "Formulario de entrega en desarrollo" })}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Entrega
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" /> Inventario Disponible
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Talla</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventory.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.descripcion}</TableCell>
                                        <TableCell>{item.talla}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{item.cantidadDisponible}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardHat className="h-5 w-5" /> Historial Entregas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Item</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entregas.slice(0, 5).map((entrega) => (
                                    <TableRow key={entrega.id}>
                                        <TableCell className="font-medium">{entrega.empleado.nombreCompleto}</TableCell>
                                        <TableCell>{format(entrega.fecha, "dd MMM", { locale: es })}</TableCell>
                                        <TableCell>{entrega.items[0].descripcion}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

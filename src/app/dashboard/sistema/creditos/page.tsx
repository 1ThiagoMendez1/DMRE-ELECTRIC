"use client";

import { useState } from "react";
import { HandCoins, Plus, Wallet } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initialCreditosEmpleados } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function CreditosPage() {
    const { toast } = useToast();
    const [creditos, setCreditos] = useState(initialCreditosEmpleados);

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Créditos a Empleados</h1>
                    <p className="text-muted-foreground">Gestión de préstamos y descuentos de nómina.</p>
                </div>
                <Button onClick={() => toast({ title: "Nuevo Préstamo", description: "Formulario de solicitud en desarrollo" })}>
                    <Plus className="mr-2 h-4 w-4" /> Registrar Préstamo
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Prestado (Activo)</CardDescription>
                        <CardTitle className="text-3xl text-primary">
                            {formatCurrency(creditos.filter(c => c.estado === 'ACTIVO').reduce((acc, curr) => acc + curr.saldoPendiente, 0))}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Créditos Activos</CardDescription>
                        <CardTitle className="text-3xl font-mono">
                            {creditos.filter(c => c.estado === 'ACTIVO').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" /> Saldos Pendientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Monto Original</TableHead>
                                <TableHead>Cuota Mensual</TableHead>
                                <TableHead>Saldo Pendiente</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {creditos.map((credito) => (
                                <TableRow key={credito.id}>
                                    <TableCell className="font-medium">{credito.empleado.nombreCompleto}</TableCell>
                                    <TableCell>{formatCurrency(credito.montoPrestado)}</TableCell>
                                    <TableCell>{formatCurrency(credito.cuotaMensual)}</TableCell>
                                    <TableCell className="font-bold text-red-600 font-mono">{formatCurrency(credito.saldoPendiente)}</TableCell>
                                    <TableCell>
                                        <Badge variant={credito.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                                            {credito.estado}
                                        </Badge>
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

"use client";

import { useState } from "react";
import { useErp } from "@/components/providers/erp-provider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bolt, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateInstalacionDialog } from "./create-instalacion-dialog";

export function InstalacionesTable() {
    const { instalaciones, addInstalacion, deleteInstalacion } = useErp();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Aplicar buscador
    const filteredCodes = instalaciones.filter(inst =>
        inst.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Bolt className="h-6 w-6 text-primary" />
                        Instalaciones
                    </CardTitle>
                    <CardDescription>
                        Administración de valores precalculados para instalaciones
                    </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar instalación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[250px]"
                        />
                    </div>

                    {/* Botón de Nueva Instalación eliminado a petición del usuario ya que se crean automáticamente */}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Código Instalación</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Valor Calculado</TableHead>
                                <TableHead className="w-[80px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCodes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No se encontraron instalaciones. Crea una nueva para comenzar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCodes.map((inst) => {
                                    return (
                                        <TableRow key={inst.id} className="hover:bg-muted/50">
                                            <TableCell className="font-bold font-mono">
                                                {inst.codigo}
                                            </TableCell>
                                            <TableCell>{inst.descripcion}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {formatCurrency(inst.valorCalculado)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => {
                                                        if (confirm(`¿Deseas eliminar la instalación ${inst.codigo}?`)) {
                                                            deleteInstalacion(inst.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Truck,
    Receipt,
    Mail,
    LayoutDashboard as LayoutDashboardIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency } from "@/lib/utils";
import { CreateSupplierDialog } from "@/components/erp/create-supplier-dialog";
import { SupplierDetailDialog } from "@/components/erp/supplier-detail-dialog";
import { SuministroDashboard } from "@/components/erp/suministro-dashboard";
import { CuentasPorPagarDashboard } from "@/components/erp/cuentas-por-pagar-dashboard";

export default function SuministroPage() {
    const {
        proveedores,
        cuentasPorPagar,
        ordenesCompra,
        addProveedor,
        payCuentaPorPagar,
        cuentasBancarias,
    } = useErp();

    const [selectedProv, setSelectedProv] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleCreateSupplier = (newProv: any) => {
        addProveedor(newProv);
    };

    const handleRegisterPayment = (id: string) => {
        const cxp = cuentasPorPagar.find(c => c.id === id);
        if (cxp) {
            const bank = cuentasBancarias.find(b => b.saldoActual >= cxp.saldoPendiente) || cuentasBancarias[0];
            if (bank) {
                payCuentaPorPagar(id, bank.id, cxp.saldoPendiente, new Date());
            }
        }
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Cadena de Suministro</h1>
                <p className="text-muted-foreground">Gestión de proveedores y cuentas por pagar.</p>
            </div>

            {/* KPIs Moved to Resumen Tab */}


            {/* Main Tabs */}
            <Tabs defaultValue="resumen" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboardIcon className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="proveedores" className="gap-2"><Truck className="h-4 w-4" /> Directorio Proveedores</TabsTrigger>
                    <TabsTrigger value="cxp" className="gap-2"><Receipt className="h-4 w-4" /> Cuentas por Pagar</TabsTrigger>
                </TabsList>

                {/* --- RESUMEN TAB --- */}
                <TabsContent value="resumen" className="space-y-6">
                    <SuministroDashboard
                        proveedores={proveedores}
                        cuentasPorPagar={cuentasPorPagar}
                        ordenesCompra={ordenesCompra}
                    />
                </TabsContent>

                {/* --- PROVEEDORES TAB --- */}
                <TabsContent value="proveedores" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Listado de Proveedores</CardTitle>
                                <CreateSupplierDialog onSupplierCreated={handleCreateSupplier} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Proveedor</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>NIT</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Datos Bancarios</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {proveedores.map((prov) => (
                                        <TableRow key={prov.id}>
                                            <TableCell className="font-medium">{prov.nombre}</TableCell>
                                            <TableCell><Badge variant="secondary">{prov.categoria}</Badge></TableCell>
                                            <TableCell>{prov.nit}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {prov.correo}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{prov.datosBancarios || "No registrado"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => { setSelectedProv(prov); setIsDetailOpen(true); }}>
                                                    Detalles y Análisis
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- CXP TAB --- */}
                <TabsContent value="cxp" className="space-y-4">
                    <CuentasPorPagarDashboard
                        cuentas={cuentasPorPagar}
                        proveedores={proveedores}
                        onRegisterPayment={(id) => handleRegisterPayment(id)}
                    />
                </TabsContent>
            </Tabs>

            <SupplierDetailDialog
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                proveedor={selectedProv}
            />
        </div>
    );
}

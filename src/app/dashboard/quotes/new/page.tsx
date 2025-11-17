import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClients, mockWorkCodes, mockInventory } from "@/lib/data";
import { ArrowLeft, FileDown, PlusCircle, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function NewQuotePage() {

    const subtotal = 395000;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Crear Nueva Cotización</h1>
                    <p className="text-muted-foreground">Completa los detalles para generar una nueva oferta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Detalles del Cliente y Cotización */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Información General</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="cliente">Cliente</Label>
                                <Select>
                                    <SelectTrigger id="cliente">
                                        <SelectValue placeholder="Selecciona un cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockClients.map(client => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="fecha">Fecha</Label>
                                <Input id="fecha" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="oferta-nro">N° Oferta</Label>
                                <Input id="oferta-nro" defaultValue="COT-005" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Códigos de Trabajo y Materiales */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Detalles de la Oferta</CardTitle>
                            <CardDescription>Agrega códigos de trabajo y materiales.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Códigos de Trabajo</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Añadir código de trabajo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockWorkCodes.map(code => (
                                                <SelectItem key={code.id} value={code.id}>{code.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="w-[100px]">Cantidad</TableHead>
                                            <TableHead className="w-[150px] text-right">Valor Unit.</TableHead>
                                            <TableHead className="w-[150px] text-right">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="font-bold bg-secondary/20">
                                            <TableCell colSpan={5}>Punto de red certificado</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Mano de Obra</TableCell>
                                            <TableCell><Input type="number" defaultValue="1" className="w-full text-center" /></TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(80000)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(80000)}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Cable UTP Cat 6A</TableCell>
                                            <TableCell><Input type="number" defaultValue="25" className="w-full text-center" /></TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(3000)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(75000)}</TableCell>
                                             <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                                        </TableRow>
                                        <TableRow className="font-bold bg-secondary/20">
                                            <TableCell colSpan={5}>Instalación de tablero de distribución</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Mano de Obra</TableCell>
                                            <TableCell><Input type="number" defaultValue="1" className="w-full text-center" /></TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(250000)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(250000)}</TableCell>
                                             <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                                 <Button variant="outline" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir Material Manualmente
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Resumen y Acciones */}
                <div className="space-y-8">
                    <Card className="border-border/50 sticky top-8">
                        <CardHeader>
                            <CardTitle>Resumen y Opciones</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show-materials" />
                                <label
                                    htmlFor="show-materials"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Mostrar materiales en PDF
                                </label>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="iva">IVA</Label>
                                        <Input id="iva" type="number" defaultValue="19" className="w-16 h-8 text-center" />
                                        <span>%</span>
                                    </div>
                                    <span className="font-mono">{formatCurrency(iva)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="discount">Descuento</Label>
                                        <Input id="discount" type="number" defaultValue="0" className="w-24 h-8 text-center" />
                                    </div>
                                    <span className="font-mono text-red-400">- {formatCurrency(0)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold text-primary">
                                    <span>TOTAL</span>
                                    <span className="font-mono">{formatCurrency(total)}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button size="lg" className="w-full electric-button">
                                <Save />
                                Guardar Cotización
                            </Button>
                            <Button size="lg" variant="outline" className="w-full">
                                <FileDown />
                                Exportar a PDF
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}

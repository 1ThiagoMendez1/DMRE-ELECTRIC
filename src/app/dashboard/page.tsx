import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockQuotes } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FilePlus, FileSearch, MoreVertical, ClipboardEdit } from "lucide-react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Vista General de Ofertas</h1>
                    <p className="text-muted-foreground">Un resumen de todas las cotizaciones y sus estados.</p>
                </div>
                <Button asChild size="lg" className="electric-button font-bold text-lg px-8 py-6">
                    <Link href="/dashboard/quotes/new">
                        <FilePlus />
                        <span>Crear Cotización</span>
                    </Link>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Cotizaciones Recientes</CardTitle>
                    <CardDescription>Mostrando las últimas 10 cotizaciones generadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">N° Oferta</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Precio Final (con IVA)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockQuotes.map((quote, index) => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium">#{index + 1}</TableCell>
                                    <TableCell>{new Date(quote.date).toLocaleDateString('es-CO')}</TableCell>
                                    <TableCell>{quote.client}</TableCell>
                                    <TableCell>
                                        <Badge
                                            className={cn({
                                                "bg-green-500/20 text-green-400 border-green-500/30": quote.status === 'Aprobado',
                                                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30": quote.status === 'Pendiente',
                                                "bg-red-500/20 text-red-400 border-red-500/30": quote.status === 'No aprobado',
                                            })}
                                        >
                                            {quote.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(quote.total)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/quotes/${quote.id}`}>
                                                        <FileSearch className="mr-2"/>
                                                        Ver Oferta
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <ClipboardEdit className="mr-2" />
                                                        Cambiar Estado
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem>Aprobado</DropdownMenuItem>
                                                            <DropdownMenuItem>Pendiente</DropdownMenuItem>
                                                            <DropdownMenuItem>No aprobado</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
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

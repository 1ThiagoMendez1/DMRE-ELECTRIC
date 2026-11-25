"use client";

import { useState, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Search, 
    FileText, 
    MoreHorizontal, 
    Eye, 
    Download, 
    Trash2, 
    AlertCircle,
    Calendar as CalendarIcon,
    ArrowUpDown
} from "lucide-react";
import { useErp } from "@/components/providers/erp-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateCompraDialog } from "./create-compra-dialog";

export function ComprasModule() {
    const { comprasFinanciera, deleteCompraFinanciera } = useErp();
    const { toast } = useToast();
    const [filterProveedor, setFilterProveedor] = useState("TODOS");
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const proveedoresLista = useMemo(() => Array.from(new Map(comprasFinanciera
        .map(c=>[c.cotizacionProveedor?.proveedorId || "SIN_PROVEEDOR", c.cotizacionProveedor?.proveedor?.nombre || "Sin proveedor"] as const))
        .entries()).sort((a,b)=>a[1].localeCompare(b[1],"es")), [comprasFinanciera]);
    const filteredCompras = comprasFinanciera.filter(c => {
        const proveedorId = c.cotizacionProveedor?.proveedorId || "SIN_PROVEEDOR";
        const query = searchTerm.trim().toLowerCase();
        return (filterProveedor === "TODOS" || proveedorId === filterProveedor) && (
            (c.numeroFactura || "").toLowerCase().includes(query) ||
            (c.cotizacion?.numero || "").toLowerCase().includes(query) ||
            (c.cotizacion?.cliente?.nombre || "").toLowerCase().includes(query) ||
            (c.cotizacionProveedor?.proveedor?.nombre || "").toLowerCase().includes(query) ||
            (c.cotizacionProveedor?.proveedor?.nit || "").toLowerCase().includes(query)
        );
    });

    const totalFacturado = filteredCompras.reduce((acc, curr) => acc + curr.valorFactura, 0);
    const totalPagado = filteredCompras.reduce((acc, curr) => acc + curr.valorPago, 0);
    const totalPendiente = totalFacturado - totalPagado;

    const exportExcel = async () => {
        setIsExporting(true);
        try {
            const book = new ExcelJS.Workbook();
            book.creator = "DMRE Electric";
            const sheet = book.addWorksheet("Compras");
            sheet.columns = [
                {header:"Fecha",key:"fecha",width:16},{header:"Factura",key:"factura",width:20},
                {header:"Proveedor",key:"proveedor",width:32},{header:"NIT",key:"nit",width:20},
                {header:"Referencia CM",key:"cm",width:18},{header:"Oferta",key:"oferta",width:18},
                {header:"Cliente",key:"cliente",width:30},{header:"IVA",key:"iva",width:18},
                {header:"Valor factura",key:"valor",width:22},{header:"Pagado",key:"pagado",width:22},
                {header:"Saldo",key:"saldo",width:22},{header:"Método pago",key:"metodo",width:20},
                {header:"Estado",key:"estado",width:16}
            ];
            sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
            sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1E293B"}};
            for (const compra of filteredCompras) {
                const saldo=Number(compra.valorFactura)-Number(compra.valorPago);
                const row=sheet.addRow({
                    fecha:format(new Date(compra.fecha),"dd/MM/yyyy"),
                    factura:compra.numeroFactura,
                    proveedor:compra.cotizacionProveedor?.proveedor?.nombre||"Sin proveedor",
                    nit:compra.cotizacionProveedor?.proveedor?.nit||"",
                    cm:compra.cotizacionProveedor?.numero||"",
                    oferta:compra.cotizacion?.numero||"",
                    cliente:compra.cotizacion?.cliente?.nombre||"",
                    iva:compra.iva||0, valor:compra.valorFactura, pagado:compra.valorPago,
                    saldo, metodo:compra.metodoPago||"",
                    estado:saldo<=0?"PAGADA":compra.valorPago>0?"PARCIAL":"PENDIENTE",
                });
                for(let col=8;col<=11;col++) row.getCell(col).numFmt='"$"#,##0.00';
            }
            if(filteredCompras.length)sheet.autoFilter={from:"A1",to:"M"+(filteredCompras.length+1)};
            sheet.views=[{state:"frozen",ySplit:1}];
            const bytes=await book.xlsx.writeBuffer();
            saveAs(new Blob([bytes as BlobPart], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), "Compras_DMRE_"+format(new Date(),"yyyyMMdd")+".xlsx");
            toast({title:"Compras exportadas",description:"Excel generado con el filtro de proveedor aplicado."});
        } catch (error) {
            toast({variant:"destructive",title:"No se pudo exportar",description:error instanceof Error?error.message:"Comprueba los registros."});
        } finally {setIsExporting(false);}
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Facturado</CardDescription>
                        <CardTitle className="text-2xl font-bold text-primary">
                            {formatCurrency(totalFacturado)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Pagado</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalPagado)}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription>Saldo Pendiente</CardDescription>
                        <CardTitle className="text-2xl font-bold text-orange-600">
                            {formatCurrency(totalPendiente)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por factura, oferta o cliente..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <select aria-label="Filtrar compras por proveedor" className="h-10 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm" value={filterProveedor} onChange={e=>setFilterProveedor(e.target.value)}>
                        <option value="TODOS">Todos los proveedores</option>
                        {proveedoresLista.map(([id, nombre])=><option key={id} value={id}>{nombre}</option>)}
                    </select>
                    <Button variant="outline" className="gap-2" disabled={isExporting} onClick={exportExcel}><Download className="h-4 w-4"/>{isExporting?"Exportando...":"Exportar Excel"}</Button>
                    <CreateCompraDialog />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="w-full overflow-x-auto">
                    <Table className="min-w-[1260px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Factura No.</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>NIT Proveedor</TableHead>
                                <TableHead>Compra Ref. (CM)</TableHead>
                                <TableHead>Oferta Ref.</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">IVA</TableHead>
                                <TableHead className="text-right">Valor Factura</TableHead>
                                <TableHead className="text-right">Pagado</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCompras.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                                        No se encontraron compras registradas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompras.map((compra) => {
                                    const saldo = compra.valorFactura - compra.valorPago;
                                    const isPaid = saldo <= 0;
                                    const isPartial = saldo > 0 && compra.valorPago > 0;
                                    
                                    const d = new Date(compra.fecha);
                                    const localD = new Date(d.getTime() + d.getTimezoneOffset() * 60000);

                                    return (
                                        <TableRow key={compra.id}>
                                            <TableCell className="font-medium">
                                                {format(localD, "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>{compra.numeroFactura}</TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={compra.cotizacionProveedor?.proveedor?.nombre || "Sin Proveedor"}>
                                                {compra.cotizacionProveedor?.proveedor?.nombre || <span className="text-muted-foreground italic">N/A</span>}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {compra.cotizacionProveedor?.proveedor?.nit || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {compra.cotizacionProveedor ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {compra.cotizacionProveedor.numero}
                                                    </Badge>
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {compra.cotizacion?.numero || "N/A"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate">
                                                {compra.cotizacion?.cliente?.nombre || "Sin Vincular"}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-muted-foreground">
                                                {formatCurrency(compra.iva || 0)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(compra.valorFactura)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {formatCurrency(compra.valorPago)}
                                            </TableCell>
                                            <TableCell className="text-right text-orange-600 font-bold">
                                                {formatCurrency(saldo)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    isPaid ? "bg-green-100 text-green-800" : 
                                                    isPartial ? "bg-blue-100 text-blue-800" : 
                                                    "bg-orange-100 text-orange-800"
                                                )}>
                                                    {isPaid ? "PAGADA" : isPartial ? "PARCIAL" : "PENDIENTE"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <CreateCompraDialog compra={compra} />
                                                        </DropdownMenuItem>
                                                        {compra.soporteUrl && (
                                                            <DropdownMenuItem asChild>
                                                                <a href={compra.soporteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Ver Soporte
                                                                </a>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                if (confirm("¿Está seguro de eliminar esta compra?")) {
                                                                    deleteCompraFinanciera(compra.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Eliminar
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
        </div>
    );
}

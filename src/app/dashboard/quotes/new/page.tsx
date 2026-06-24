"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClients, mockWorkCodes, mockInventory } from "@/lib/data";
import { ArrowLeft, FileDown, PlusCircle, Save, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);

export default function NewQuotePage() {
    const [isMounted, setIsMounted] = useState(false);
    const [draft, setDraft] = useState({
        cliente: "",
        fecha: new Date().toISOString().split('T')[0],
        ofertaNro: "COT-005",
        iva: 19,
        discount: 0,
        showMaterials: false,
        items: [
            { id: 1, type: "Mano de Obra", qty: 1, price: 80000, category: "Punto de red certificado" },
            { id: 2, type: "Cable UTP Cat 6A", qty: 25, price: 3000, category: "Punto de red certificado" },
            { id: 3, type: "Mano de Obra", qty: 1, price: 250000, category: "Instalación de tablero de distribución" },
        ]
    });

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("quote_draft");
        if (saved) {
            try {
                setDraft(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse quote draft");
            }
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("quote_draft", JSON.stringify(draft));
        }
    }, [draft, isMounted]);

    const updateDraft = (key: string, value: any) => {
        setDraft(prev => ({ ...prev, [key]: value }));
    };

    const updateItemQty = (id: number, qty: number) => {
        setDraft(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, qty } : item)
        }));
    };

    const deleteItem = (id: number) => {
        setDraft(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const subtotal = draft.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const ivaValue = subtotal * (draft.iva / 100);
    const total = subtotal + ivaValue - draft.discount;

    // Group items by category for display
    const itemsByCategory = draft.items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof draft.items>);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
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
                <Button variant="ghost" onClick={() => {
                    if (confirm("¿Estás seguro de que deseas limpiar el borrador?")) {
                        localStorage.removeItem("quote_draft");
                        window.location.reload();
                    }
                }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpiar Borrador
                </Button>
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
                                <Select value={draft.cliente} onValueChange={(val) => updateDraft('cliente', val)}>
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
                                <Input id="fecha" type="date" value={draft.fecha} onChange={(e) => updateDraft('fecha', e.target.value)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="oferta-nro">N° Oferta</Label>
                                <Input id="oferta-nro" value={draft.ofertaNro} onChange={(e) => updateDraft('ofertaNro', e.target.value)} />
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
                                        {Object.entries(itemsByCategory).map(([category, items]) => (
                                            <React.Fragment key={category}>
                                                <TableRow className="font-bold bg-secondary/20">
                                                    <TableCell colSpan={5}>{category}</TableCell>
                                                </TableRow>
                                                {items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.type}</TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                type="number" 
                                                                value={item.qty} 
                                                                onChange={(e) => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                                                                className="w-full text-center" 
                                                                min="0"
                                                                step="0.01"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                                                        <TableCell className="text-right font-mono">{formatCurrency(item.qty * item.price)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-8 w-8 text-destructive">
                                                                <Trash2 className="h-4 w-4"/>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        ))}
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
                                <Checkbox 
                                    id="show-materials" 
                                    checked={draft.showMaterials}
                                    onCheckedChange={(checked) => updateDraft('showMaterials', checked === true)}
                                />
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
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="iva">IVA</Label>
                                        <Input 
                                            id="iva" 
                                            type="number" 
                                            value={draft.iva} 
                                            onChange={(e) => updateDraft('iva', parseFloat(e.target.value) || 0)}
                                            className="w-20 h-8 text-center" 
                                        />
                                        <span>%</span>
                                    </div>
                                    <span className="font-mono">{formatCurrency(ivaValue)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="discount">Descuento ($)</Label>
                                        <Input 
                                            id="discount" 
                                            type="number" 
                                            value={draft.discount} 
                                            onChange={(e) => updateDraft('discount', parseFloat(e.target.value) || 0)}
                                            className="w-28 h-8 text-center" 
                                        />
                                    </div>
                                    <span className="font-mono text-red-400">- {formatCurrency(draft.discount)}</span>
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
                                <Save className="mr-2 h-5 w-5" />
                                Guardar Cotización
                            </Button>
                            <Button size="lg" variant="outline" className="w-full electric-button">
                                <FileDown className="mr-2 h-5 w-5" />
                                Exportar a PDF
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

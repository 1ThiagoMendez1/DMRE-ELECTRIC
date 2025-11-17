
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockClients } from "@/lib/data";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ClientForm({ onSave, client, onCancel }: { onSave: (data: any) => void; client?: any, onCancel: () => void }) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{client ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</DialogTitle>
                    <DialogDescription>
                        Completa la información del cliente.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nombre</Label>
                        <Input id="name" name="name" defaultValue={client?.name} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="document" className="text-right">Documento</Label>
                        <Input id="document" name="document" defaultValue={client?.document} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Dirección</Label>
                        <Input id="address" name="address" defaultValue={client?.address} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Correo</Label>
                        <Input id="email" name="email" type="email" defaultValue={client?.email} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Teléfono</Label>
                        <Input id="phone" name="phone" defaultValue={client?.phone} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit">Guardar Cliente</Button>
                </DialogFooter>
            </DialogContent>
        </form>
    );
}

export default function ClientsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | undefined>(undefined);

    const handleSave = (data: any) => {
        console.log("Saving client:", data);
        // Aquí iría la lógica para guardar en la base de datos
        setIsDialogOpen(false);
        setEditingClient(undefined);
    };

    const openDialog = (client?: any) => {
        setEditingClient(client);
        setIsDialogOpen(true);
    };
    
    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingClient(undefined);
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Gestión de Clientes</h1>
                    <p className="text-muted-foreground">Añade, edita y elimina clientes de tu base de datos.</p>
                </div>
                <Button className="electric-button" onClick={() => openDialog()}>
                    <Plus />
                    <span>Registrar Cliente</span>
                </Button>
            </div>
            
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>Listado de Clientes</CardTitle>
                    <CardDescription>Estos son todos los clientes registrados en el sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Documento</TableHead>
                                <TableHead>Dirección</TableHead>
                                <TableHead>Correo</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.document}</TableCell>
                                    <TableCell>{client.address}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => openDialog(client)}>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {isDialogOpen && <ClientForm onSave={handleSave} client={editingClient} onCancel={closeDialog} />}
            </Dialog>
        </div>
    )
}

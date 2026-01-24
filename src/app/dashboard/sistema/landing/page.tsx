"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Globe, Mail, Image as ImageIcon, Briefcase, CheckCircle2, XCircle, Clock } from "lucide-react";

// Mock Data for Proposals
const initialProposals = [
    { id: 'PROP-001', name: 'Constructora Bolivar', email: 'proyectos@bolivar.com', phone: '3001234567', message: 'Interesados en cotización para conjunto residencial de 5 torres.', date: '2024-05-15', status: 'PENDIENTE' },
    { id: 'PROP-002', name: 'Juan Perez', email: 'juan.perez@gmail.com', phone: '3109876543', message: 'Necesito instalación eléctrica para local comercial.', date: '2024-05-14', status: 'CONTACTADO' },
    { id: 'PROP-003', name: 'Hotel Estelar', email: 'mantenimiento@estelar.com', phone: '3205551234', message: 'Requerimos mantenimiento preventivo de subestación.', date: '2024-05-12', status: 'CERRADO' },
];

export default function LandingPageManagement() {
    const { toast } = useToast();
    const [proposals, setProposals] = useState(initialProposals);
    const [activeTab, setActiveTab] = useState("propuestas");

    const handleStatusChange = (id: string, newStatus: string) => {
        setProposals(proposals.map(p => p.id === id ? { ...p, status: newStatus } : p));
        toast({
            title: "Estado Actualizado",
            description: `La propuesta ha sido marcada como ${newStatus}.`
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDIENTE': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>;
            case 'CONTACTADO': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Contactado</Badge>;
            case 'CERRADO': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Cerrado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión Landing Page</h1>
                <p className="text-muted-foreground">Administra el contenido de la web y visualiza las solicitudes de contacto.</p>
            </div>

            <Tabs defaultValue="propuestas" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="propuestas">Solicitudes Web</TabsTrigger>
                    <TabsTrigger value="contenido">Gestión de Contenido</TabsTrigger>
                </TabsList>

                {/* Proposals Tab */}
                <TabsContent value="propuestas" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" /> Solicitudes de Contacto
                            </CardTitle>
                            <CardDescription>
                                Mensajes recibidos a través del formulario "Conecta con Nosotros".
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Remitente</TableHead>
                                        <TableHead>Contacto</TableHead>
                                        <TableHead>Mensaje</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {proposals.map((proposal) => (
                                        <TableRow key={proposal.id}>
                                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                {proposal.date}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{proposal.name}</div>
                                                <div className="text-xs text-muted-foreground">{proposal.email}</div>
                                            </TableCell>
                                            <TableCell>{proposal.phone}</TableCell>
                                            <TableCell className="max-w-[300px] truncate" title={proposal.message}>
                                                {proposal.message}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {proposal.status === 'PENDIENTE' && (
                                                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proposal.id, 'CONTACTADO')} title="Marcar como Contactado">
                                                        <Clock className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                                {proposal.status !== 'CERRADO' && (
                                                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(proposal.id, 'CERRADO')} title="Cerrar Solicitud">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Content Management Tab */}
                <TabsContent value="contenido" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Projects/Gallery Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" /> Galería de Proyectos
                                </CardTitle>
                                <CardDescription>Gestiona las imágenes que aparecen en el carrusel y portafolio.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="relative aspect-video bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer group">
                                        <div className="text-center space-y-2">
                                            <div className="bg-background rounded-full p-2 inline-flex group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">Subir Nueva Imagen</p>
                                        </div>
                                    </div>
                                    {/* Mock Existing Images */}
                                    <div className="relative aspect-video bg-muted rounded-md overflow-hidden group">
                                        <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=300&h=200" className="object-cover w-full h-full" alt="Project 1" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="destructive" size="sm">Eliminar</Button>
                                        </div>
                                    </div>
                                </div>
                                <Button className="w-full" variant="outline">Ver toda la galería</Button>
                            </CardContent>
                        </Card>

                        {/* Projects in Mind / Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" /> Proyectos Destacados
                                </CardTitle>
                                <CardDescription>Configura los proyectos que se resaltan en la página principal.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Centro de Datos Cuántico</p>
                                            <p className="text-xs text-muted-foreground">Industrial • Visible en Home</p>
                                        </div>
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Red Inteligente Metrópolis</p>
                                            <p className="text-xs text-muted-foreground">Grids • Visible en Home</p>
                                        </div>
                                        <Button variant="ghost" size="sm">Editar</Button>
                                    </div>
                                </div>
                                <Button className="w-full"> <PlusIcon className="mr-2 h-4 w-4" /> Agregar Proyecto Destacado</Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}

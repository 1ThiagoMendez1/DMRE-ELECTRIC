'use client';

import { useState, useEffect } from "react";
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
import { Globe, Mail, Image as ImageIcon, Briefcase, CheckCircle2, XCircle, Clock, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { getProjects, createProject, updateProject, deleteProject, getContactRequests, updateContactRequestStatus } from "@/actions/landing-actions";
import { ProjectImageUpload } from "@/components/project-image-upload";

export default function LandingPageManagement() {
    const { toast } = useToast();
    const [proposals, setProposals] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any | null>(null);

    useEffect(() => {
        fetchProjects();
        fetchProposals();
    }, []);

    async function fetchProjects() {
        setIsLoadingProjects(true);
        const data = await getProjects();
        setProjects(data || []);
        setIsLoadingProjects(false);
    }

    async function fetchProposals() {
        const data = await getContactRequests();
        setProposals(data || []);
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        const result = await updateContactRequestStatus(id, newStatus);
        if (result?.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            setProposals(proposals.map(p => p.id === id ? { ...p, status: newStatus } : p));
            toast({
                title: "Estado Actualizado",
                description: `La propuesta ha sido marcada como ${newStatus}.`
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDIENTE': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendiente</Badge>;
            case 'CONTACTADO': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Contactado</Badge>;
            case 'CERRADO': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Cerrado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const result = await createProject(null, formData);

        if (result?.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Proyecto creado correctamente." });
            setIsProjectDialogOpen(false);
            fetchProjects();
        }
    };

    const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingProject) return;
        const formData = new FormData(e.currentTarget);
        const result = await updateProject(editingProject.id, null, formData);

        if (result?.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Proyecto actualizado correctamente." });
            setEditingProject(null);
            setIsProjectDialogOpen(false);
            fetchProjects();
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este proyecto?")) return;
        const result = await deleteProject(id);
        if (result?.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Éxito", description: "Proyecto eliminado correctamente." });
            fetchProjects();
        }
    };

    const openCreateDialog = () => {
        setEditingProject(null);
        setIsProjectDialogOpen(true);
    }

    const openEditDialog = (project: any) => {
        setEditingProject(project);
        setIsProjectDialogOpen(true);
    }

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión Landing Page</h1>
                <p className="text-muted-foreground">Administra el contenido de la web y visualiza las solicitudes de contacto.</p>
            </div>

            <Tabs defaultValue="contenido" className="w-full">
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
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" /> Vitrina de Proyectos
                                </CardTitle>
                                <CardDescription>Gestiona los proyectos que aparecen en la landing page.</CardDescription>
                            </div>
                            <Button onClick={openCreateDialog}>
                                <Plus className="w-4 h-4 mr-2" /> Agregar Proyecto
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
                                    <div key={project.id} className="group relative border rounded-lg overflow-hidden bg-card">
                                        <div className="relative h-48 w-full bg-muted">
                                            {project.image_url ? (
                                                <img src={project.image_url} alt={project.title} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full text-muted-foreground">Sin Imagen</div>
                                            )}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEditDialog(project)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeleteProject(project.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline">{project.category}</Badge>
                                                {project.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight mb-1">{project.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {projects.length === 0 && !isLoadingProjects && (
                                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border-dashed border-2">
                                        No hay proyectos registrados.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
                        <DialogDescription>
                            {editingProject ? 'Modifica los detalles del proyecto.' : 'Agrega un nuevo proyecto a la vitrina.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={editingProject ? handleUpdateProject : handleCreateProject} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Imagen del Proyecto</Label>
                            <ProjectImageUpload
                                currentImageUrl={editingProject?.image_url}
                                onImageUploaded={(url) => {
                                    const input = document.getElementById('image_url_input') as HTMLInputElement;
                                    if (input) input.value = url;
                                }}
                            />
                            <input type="hidden" name="image_url" id="image_url_input" defaultValue={editingProject?.image_url || ''} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input id="title" name="title" required defaultValue={editingProject?.title} placeholder="Ej: Red Inteligente" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría</Label>
                                <Input id="category" name="category" required defaultValue={editingProject?.category} placeholder="Ej: Industrial" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea id="description" name="description" required defaultValue={editingProject?.description} placeholder="Breve descripción del proyecto..." />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="is_active" name="is_active" defaultChecked={editingProject?.is_active ?? true} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <Label htmlFor="is_active">Visible en la Landing</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

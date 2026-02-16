'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Folder, Plus, Search, Calendar, MoreVertical, Edit, Trash2, FileText, Loader2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePlans } from '@/components/providers/plans-provider';
import { useToast } from '@/hooks/use-toast';
import {
    getProyectosPlanos,
    createProyectoPlano,
    deleteProyectoPlano,
    getProyectoPlano,
    type ProyectoPlano
} from '../actions';

interface ProjectsListProps {
    onSelectProject: () => void;
}

export function ProjectsList({ onSelectProject }: ProjectsListProps) {
    const { setCurrentPlan } = usePlans();
    const { toast } = useToast();
    const [projects, setProjects] = useState<ProyectoPlano[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        client: '',
        scale: '1:100',
    });

    // Load projects from Supabase
    const loadProjects = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await getProyectosPlanos();
        if (error) {
            toast({
                title: 'Error',
                description: `No se pudieron cargar los proyectos: ${error}`,
                variant: 'destructive',
            });
        } else {
            setProjects(data || []);
        }
        setIsLoading(false);
    }, [toast]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.client?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    const handleCreateProject = async () => {
        if (!newProject.name.trim()) return;

        setIsCreating(true);
        const { data, error } = await createProyectoPlano({
            name: newProject.name,
            description: newProject.description || undefined,
            client: newProject.client || undefined,
            scale: newProject.scale,
        });

        if (error) {
            toast({
                title: 'Error',
                description: `No se pudo crear el proyecto: ${error}`,
                variant: 'destructive',
            });
            setIsCreating(false);
            return;
        }

        if (data) {
            toast({
                title: 'Proyecto creado',
                description: `${data.name} ha sido creado exitosamente`,
            });
            setCurrentPlan({
                id: data.id,
                name: data.name,
                description: data.description || '',
                scale: data.scale,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                elements: [],
                layers: [],
            });
            setNewProject({ name: '', description: '', client: '', scale: '1:100' });
            setIsCreateOpen(false);
            onSelectProject();
        }
        setIsCreating(false);
    };

    const handleSelectProject = async (project: ProyectoPlano) => {
        // Load full project data including canvas_state
        const { data, error } = await getProyectoPlano(project.id);

        if (error) {
            toast({
                title: 'Error',
                description: `No se pudo cargar el proyecto: ${error}`,
                variant: 'destructive',
            });
            return;
        }

        if (data) {
            setCurrentPlan({
                id: data.id,
                name: data.name,
                description: data.description || '',
                scale: data.scale,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                elements: [],
                layers: [],
                canvasState: data.canvas_state ? JSON.stringify(data.canvas_state) : undefined,
            });
            onSelectProject();
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();

        const { success, error } = await deleteProyectoPlano(projectId);

        if (error || !success) {
            toast({
                title: 'Error',
                description: `No se pudo eliminar el proyecto: ${error}`,
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Proyecto eliminado',
            description: 'El proyecto ha sido eliminado exitosamente',
        });
        setProjects(projects.filter(p => p.id !== projectId));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Proyectos de Diseño</h2>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tus proyectos de infraestructura eléctrica
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Proyecto
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                            <DialogDescription>
                                Ingresa la información del proyecto de diseño eléctrico.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Proyecto *</Label>
                                <Input
                                    id="name"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="Ej: Urbanización Los Pinos"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="client">Cliente</Label>
                                <Input
                                    id="client"
                                    value={newProject.client}
                                    onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                                    placeholder="Nombre del cliente"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Descripción breve del proyecto..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="scale">Escala</Label>
                                <select
                                    id="scale"
                                    value={newProject.scale}
                                    onChange={(e) => setNewProject({ ...newProject, scale: e.target.value })}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="1:50">1:50</option>
                                    <option value="1:100">1:100</option>
                                    <option value="1:200">1:200</option>
                                    <option value="1:500">1:500</option>
                                    <option value="1:1000">1:1000</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateProject}
                                disabled={!newProject.name.trim() || isCreating}
                            >
                                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Crear Proyecto
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar proyectos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Projects Grid */}
            {!isLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Card
                            key={project.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleSelectProject(project)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Folder className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{project.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {project.client || 'Sin cliente'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSelectProject(project); }}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Exportar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {project.description || 'Sin descripción'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(project.updated_at)}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {project.scale}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }

            {
                !isLoading && filteredProjects.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron proyectos</p>
                        <Button variant="link" onClick={() => setIsCreateOpen(true)}>
                            Crear nuevo proyecto
                        </Button>
                    </div>
                )
            }
        </div >
    );
}

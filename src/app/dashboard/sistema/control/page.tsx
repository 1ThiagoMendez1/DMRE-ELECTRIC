"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Users,
    Shield,
    Calendar,
    LayoutDashboard,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { initialUsers, initialRoles, initialAgenda } from "@/lib/mock-data";
import { CreateUserDialog } from "@/components/erp/create-user-dialog";

export default function ControlPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("resumen");
    const [users, setUsers] = useState(initialUsers);
    const [roles, setRoles] = useState(initialRoles);
    const [agenda, setAgenda] = useState(initialAgenda);

    const handleUserCreated = (newUser: any) => {
        setUsers([newUser, ...users]);
    };

    // KPIs
    const totalUsers = users.length;
    const totalRoles = roles.length;
    const pendingTasks = agenda.filter(t => t.estado === 'PENDIENTE').length;
    const completedTasks = agenda.filter(t => t.estado === 'COMPLETADA').length;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'ALTA': return 'bg-red-100 text-red-800 border-red-300';
            case 'MEDIA': return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'BAJA': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETADA': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'EN_PROGRESO': return <Clock className="h-4 w-4 text-blue-600" />;
            case 'PENDIENTE': return <AlertCircle className="h-4 w-4 text-amber-600" />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Control y Sistema</h1>
                <p className="text-muted-foreground">Administración de usuarios, roles y configuración del sistema.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Roles</TabsTrigger>
                    <TabsTrigger value="agenda" className="gap-2"><Calendar className="h-4 w-4" /> Agenda</TabsTrigger>
                </TabsList>

                {/* RESUMEN TAB */}
                <TabsContent value="resumen" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Roles Definidos</CardTitle>
                                <Shield className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalRoles}</div>
                                <p className="text-xs text-muted-foreground">Perfiles de acceso</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                                <Calendar className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{pendingTasks}</div>
                                <p className="text-xs text-muted-foreground">{completedTasks} completadas</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <button onClick={() => setActiveTab("usuarios")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary" />
                                    <span>Gestionar Usuarios</span>
                                </button>
                                <button onClick={() => setActiveTab("roles")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-purple-500" />
                                    <span>Configurar Roles</span>
                                </button>
                                <button onClick={() => setActiveTab("agenda")} className="w-full text-left p-3 rounded-lg hover:bg-muted flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-amber-500" />
                                    <span>Ver Agenda</span>
                                </button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Estado del Sistema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Autenticación</span>
                                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Base de Datos</span>
                                        <Badge className="bg-green-100 text-green-800">Conectada</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Backups</span>
                                        <Badge className="bg-green-100 text-green-800">Al día</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* USUARIOS TAB - EMBEDDED CONTENT */}
                <TabsContent value="usuarios" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Usuarios del Sistema</CardTitle>
                                <CreateUserDialog onUserCreated={handleUserCreated} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                                            <TableCell>
                                                <Badge className="bg-green-100 text-green-800">
                                                    Activo
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => toast({ title: "Editar Usuario", description: `Editando ${user.name}` })}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ROLES TAB - EMBEDDED CONTENT */}
                <TabsContent value="roles" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Roles y Permisos</CardTitle>
                                <Button onClick={() => toast({ title: "Nuevo Rol", description: "Formulario de creación en desarrollo" })}>
                                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Permisos</TableHead>
                                        <TableHead>Sistema</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roles.map((role) => (
                                        <TableRow key={role.id}>
                                            <TableCell className="font-medium">{role.nombre}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{role.descripcion}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{role.permisos?.length || 0} permisos</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {role.isSystemRole ? (
                                                    <Badge className="bg-blue-100 text-blue-800">Sistema</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Personalizado</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" disabled={role.isSystemRole} onClick={() => toast({ title: "Editar Rol", description: `Editando ${role.nombre}` })}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AGENDA TAB - EMBEDDED CONTENT */}
                <TabsContent value="agenda" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Agenda de Tareas</CardTitle>
                                <Button onClick={() => toast({ title: "Nueva Tarea", description: "Formulario de tarea en desarrollo" })}>
                                    <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agenda.map((tarea) => (
                                        <TableRow key={tarea.id}>
                                            <TableCell className="font-medium">{tarea.titulo}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{tarea.descripcion}</TableCell>
                                            <TableCell>{format(tarea.fechaVencimiento, "dd MMM yyyy", { locale: es })}</TableCell>
                                            <TableCell>
                                                <Badge className={getPriorityColor(tarea.prioridad)}>{tarea.prioridad}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(tarea.estado)}
                                                    <span className="text-sm">{tarea.estado.replace('_', ' ')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" onClick={() => toast({ title: "Editar Tarea", description: `Editando ${tarea.titulo}` })}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

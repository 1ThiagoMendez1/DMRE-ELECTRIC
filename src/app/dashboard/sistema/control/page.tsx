"use client";

import { useState } from "react";
import {
    Users,
    Shield,
    Calendar,
    LayoutDashboard,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useErp } from "@/components/providers/erp-provider";

import { UsuariosView } from "@/components/erp/views/usuarios-view";
import { AgendaView } from "@/components/erp/views/agenda-view";
import { RolesView } from "@/components/erp/views/roles-view";

export default function ControlPage() {
    const { users, roles, agenda, isLoading } = useErp();
    const [activeTab, setActiveTab] = useState("resumen");

    // KPIs
    const totalUsers = users ? users.length : 0;
    const pendingTasks = agenda ? agenda.filter(t => t.estado === 'PENDIENTE').length : 0;
    const completedTasks = agenda ? agenda.filter(t => t.estado === 'COMPLETADA').length : 0;

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando sistema de control...</div>;
    }

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Control y Sistema</h1>
                <p className="text-muted-foreground">Administración centralizada de usuarios, agenda y seguridad.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="resumen" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Resumen</TabsTrigger>
                    <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
                    <TabsTrigger value="agenda" className="gap-2"><Calendar className="h-4 w-4" /> Agenda</TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2"><Shield className="h-4 w-4" /> Roles</TabsTrigger>
                </TabsList>

                {/* RESUMEN TAB */}
                <TabsContent value="resumen" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="border-l-4 border-l-primary cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('usuarios')}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalUsers}</div>
                                <p className="text-xs text-muted-foreground">Ir a gestión de usuarios</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('agenda')}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                                <Calendar className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{pendingTasks}</div>
                                <p className="text-xs text-muted-foreground">{completedTasks} completadas</p>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-indigo-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab('roles')}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Roles Definidos</CardTitle>
                                <Shield className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-600">{roles.length}</div>
                                <p className="text-xs text-muted-foreground">Tipos de acceso configurados</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Estado del Sistema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Conexión a Base de Datos</span>
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Sistema de Autenticación</span>
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Servicios de Notificación</span>
                                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* MODULE TABS */}
                <TabsContent value="usuarios" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <UsuariosView />
                </TabsContent>

                <TabsContent value="agenda" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <AgendaView />
                </TabsContent>

                <TabsContent value="roles" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <RolesView />
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { useState } from "react";
import {
    Users,
    Search,
    Shield,
    MoreHorizontal,
    LayoutDashboard as LayoutDashboardIcon,
    UserCircle,
    CheckCircle2,
    XCircle
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PermissionDialog } from "@/components/erp/permission-dialog";
import { CreateUserDialog } from "@/components/erp/create-user-dialog";
import { useErp } from "@/components/providers/erp-provider";
import { systemNavItems } from "@/lib/data";

export default function UsuariosPage() {
    const { toast } = useToast();
    const { users, updateUserPermissions, setCurrentUser, currentUser } = useErp();
    const [searchTerm, setSearchTerm] = useState("");

    // No longer needing local state for users as it comes from context
    // const [usuarios, setUsuarios] = useState(initialUsers); 

    const handleCreateUser = (newUser: any) => {
        // Implement add user in provider if needed, for now just a toast demo or we should add 'addUser' to context
        // For this task, we focus on permissions of existing users.
        toast({ title: "Información", description: "Creación de usuarios simulada (falta implementar en provider addUser)" });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Badge variant="default" className="bg-primary">Administrador</Badge>;
            case 'ENGINEER': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Ingeniero</Badge>;
            case 'CLIENT': return <Badge variant="outline" className="border-green-500 text-green-600">Cliente</Badge>;
            default: return <Badge variant="outline">Visualizador</Badge>;
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Administración de roles y accesos al sistema.</p>
                </div>
                <CreateUserDialog onUserCreated={handleCreateUser} />
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Directorio de Usuarios
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuario..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Permisos Sidebar</TableHead> {/* New Column */}
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.avatar ? <img src={user.avatar} className="rounded-full" /> : <UserCircle className="h-5 w-5" />}
                                            </div>
                                            {user.name}
                                            {currentUser?.id === user.id && <Badge variant="outline" className="ml-2 text-[10px]">Tú</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                                            {user.sidebarAccess && user.sidebarAccess.length > 0 ? (
                                                user.sidebarAccess.map((accessId) => {
                                                    const item = systemNavItems.find(i => i.id === accessId);
                                                    return (
                                                        <Badge key={accessId} variant="outline" className="text-[10px] px-2 py-0.5 h-auto font-normal bg-secondary/20 border-secondary/30">
                                                            {item ? item.label : accessId}
                                                        </Badge>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Sin permisos específicos</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1 pl-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                                            <CheckCircle2 className="h-3 w-3" /> Activo
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Permission Editor Integration */}
                                            <PermissionDialog
                                                user={user}
                                                onSave={updateUserPermissions}
                                                trigger={
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar Permisos">
                                                        <Shield className="h-4 w-4" />
                                                    </Button>
                                                }
                                            />

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setCurrentUser(user)}>
                                                        Simular Sesión (Demo)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => toast({ title: "Desactivar", description: "Usuario desactivado temporalmente" })}>
                                                        Desactivar Acceso
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

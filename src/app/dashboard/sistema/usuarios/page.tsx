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

import { initialUsers } from "@/lib/mock-data";
import { CreateUserDialog } from "@/components/erp/create-user-dialog";

export default function UsuariosPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [usuarios, setUsuarios] = useState(initialUsers);

    const handleCreateUser = (newUser: any) => {
        setUsuarios([newUser, ...usuarios]);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Badge variant="default" className="bg-primary">Administrador</Badge>;
            case 'ENGINEER': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Ingeniero</Badge>;
            case 'CLIENT': return <Badge variant="outline" className="border-green-500 text-green-600">Cliente</Badge>;
            default: return <Badge variant="outline">Visualizador</Badge>;
        }
    };

    const filteredUsers = usuarios.filter(u =>
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
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="gap-1 pl-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                                            <CheckCircle2 className="h-3 w-3" /> Activo
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => toast({ title: "Editar", description: "Edición de usuario habilitada pronto" })}>
                                                    Editar Roles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => toast({ title: "Desactivar", description: "Usuario desactivado temporalmente" })}>
                                                    Desactivar Acceso
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
        </div>
    );
}

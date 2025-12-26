"use client";

import { useState } from "react";
import { Shield, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Role, Permission } from "@/types/sistema";

// Mock initial roles
const systemRoles: Role[] = [
    {
        id: "ROLE-ADMIN",
        nombre: "Administrador",
        descripcion: "Acceso total al sistema",
        permisos: [
            { id: "P1", modulo: "comercial", accion: "ver" },
            { id: "P2", modulo: "comercial", accion: "crear" },
            { id: "P3", modulo: "comercial", accion: "editar" },
            { id: "P4", modulo: "comercial", accion: "eliminar" },
            { id: "P5", modulo: "financiera", accion: "ver" },
            { id: "P6", modulo: "financiera", accion: "crear" },
            { id: "P7", modulo: "operaciones", accion: "ver" },
            { id: "P8", modulo: "operaciones", accion: "crear" },
        ],
        color: "bg-red-500",
        isSystemRole: true
    },
    {
        id: "ROLE-ENGINEER",
        nombre: "Ingeniero",
        descripcion: "Gestión de operaciones y proyectos",
        permisos: [
            { id: "P9", modulo: "operaciones", accion: "ver" },
            { id: "P10", modulo: "operaciones", accion: "crear" },
            { id: "P11", modulo: "operaciones", accion: "editar" },
            { id: "P12", modulo: "comercial", accion: "ver" },
        ],
        color: "bg-blue-500",
        isSystemRole: true
    },
    {
        id: "ROLE-VIEWER",
        nombre: "Visualizador",
        descripcion: "Solo lectura en todos los módulos",
        permisos: [
            { id: "P13", modulo: "comercial", accion: "ver" },
            { id: "P14", modulo: "financiera", accion: "ver" },
            { id: "P15", modulo: "operaciones", accion: "ver" },
        ],
        color: "bg-gray-500",
        isSystemRole: true
    }
];

const allModules = ["comercial", "financiera", "operaciones", "suministro", "activos", "talento", "usuarios"];
const allActions: Permission["accion"][] = ["ver", "crear", "editar", "eliminar", "exportar"];

export default function RolesPage() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>(systemRoles);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    // Form State
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formColor, setFormColor] = useState("bg-purple-500");
    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

    const openCreateDialog = () => {
        setEditingRole(null);
        setFormName("");
        setFormDesc("");
        setFormColor("bg-purple-500");
        setSelectedPermissions(new Set());
        setIsDialogOpen(true);
    };

    const openEditDialog = (role: Role) => {
        setEditingRole(role);
        setFormName(role.nombre);
        setFormDesc(role.descripcion);
        setFormColor(role.color);
        setSelectedPermissions(new Set(role.permisos.map(p => `${p.modulo}-${p.accion}`)));
        setIsDialogOpen(true);
    };

    const togglePermission = (key: string) => {
        const newSet = new Set(selectedPermissions);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        setSelectedPermissions(newSet);
    };

    const handleSave = () => {
        if (!formName.trim()) {
            toast({ title: "Error", description: "El nombre del rol es requerido", variant: "destructive" });
            return;
        }

        const permisos: Permission[] = Array.from(selectedPermissions).map((key, i) => {
            const [modulo, accion] = key.split("-");
            return { id: `P-${Date.now()}-${i}`, modulo, accion: accion as Permission["accion"] };
        });

        if (editingRole) {
            setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, nombre: formName, descripcion: formDesc, color: formColor, permisos } : r));
            toast({ title: "Rol Actualizado", description: `El rol "${formName}" ha sido modificado.` });
        } else {
            const newRole: Role = {
                id: `ROLE-${Date.now()}`,
                nombre: formName,
                descripcion: formDesc,
                permisos,
                color: formColor,
                isSystemRole: false
            };
            setRoles([...roles, newRole]);
            toast({ title: "Rol Creado", description: `El rol "${formName}" ha sido agregado.` });
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        if (role?.isSystemRole) {
            toast({ title: "Acción no permitida", description: "Los roles de sistema no pueden eliminarse.", variant: "destructive" });
            return;
        }
        if (confirm(`¿Estás seguro de eliminar el rol "${role?.nombre}"?`)) {
            setRoles(roles.filter(r => r.id !== roleId));
            toast({ title: "Rol Eliminado", description: `El rol ha sido eliminado.` });
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Gestión de Roles</h1>
                    <p className="text-muted-foreground">Define roles personalizados y asigna permisos por módulo.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreateDialog}>
                            <Plus className="mr-2 h-4 w-4" /> Crear Rol
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRole ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
                            <DialogDescription>
                                {editingRole ? "Modifica los permisos de este rol." : "Define un nombre y selecciona los permisos."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} className="col-span-3" placeholder="Ej: Contador" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="desc" className="text-right">Descripción</Label>
                                <Input id="desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="col-span-3" placeholder="Breve descripción del rol" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Color</Label>
                                <div className="col-span-3 flex gap-2">
                                    {["bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"].map(c => (
                                        <button key={c} onClick={() => setFormColor(c)} className={`h-6 w-6 rounded-full ${c} ${formColor === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`} />
                                    ))}
                                </div>
                            </div>
                            {/* Permissions Grid */}
                            <div className="mt-4">
                                <Label className="font-semibold">Permisos por Módulo</Label>
                                <div className="mt-2 border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px]">Módulo</TableHead>
                                                {allActions.map(a => <TableHead key={a} className="text-center text-xs">{a.charAt(0).toUpperCase() + a.slice(1)}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allModules.map(m => (
                                                <TableRow key={m}>
                                                    <TableCell className="font-medium capitalize">{m}</TableCell>
                                                    {allActions.map(a => {
                                                        const key = `${m}-${a}`;
                                                        return (
                                                            <TableCell key={key} className="text-center">
                                                                <Checkbox
                                                                    checked={selectedPermissions.has(key)}
                                                                    onCheckedChange={() => togglePermission(key)}
                                                                />
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>{editingRole ? "Guardar Cambios" : "Crear Rol"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Roles Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Roles del Sistema</CardTitle>
                    <CardDescription>Los roles de sistema están marcados y no pueden eliminarse.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Permisos</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`h-3 w-3 rounded-full ${role.color}`}></span>
                                            <span className="font-medium">{role.nombre}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{role.descripcion}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{role.permisos.length} permisos</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {role.isSystemRole ? (
                                            <Badge variant="outline" className="border-amber-500 text-amber-600">Sistema</Badge>
                                        ) : (
                                            <Badge variant="outline">Personalizado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(role.id)} disabled={role.isSystemRole}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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

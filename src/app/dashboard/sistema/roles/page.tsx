"use client";

import { useState, useMemo } from "react";
import { Plus, Shield, Check, X, Lock } from "lucide-react";

import { useErp } from "@/components/providers/erp-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CreateRoleDialog } from "@/components/erp/create-role-dialog";
import { cn } from "@/lib/utils";
import { Role, Permission, RolePermission } from "@/types/sistema";

export default function RolesPage() {
    const { roles, permissions, updateRolePermission, isLoading } = useErp();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Group permissions by module
    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        permissions.forEach(p => {
            if (!groups[p.module]) groups[p.module] = [];
            groups[p.module].push(p);
        });
        return groups;
    }, [permissions]);

    // Handle toggle
    const handleToggle = async (permissionId: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete', currentValue: boolean) => {
        if (!selectedRole) return;

        await updateRolePermission(selectedRole.id, permissionId, {
            [action]: !currentValue
        });

        // Optimistic update locally for smoother UI if needed, usually provider handles it
    };

    const getPermissionForRole = (permId: string): RolePermission | undefined => {
        return selectedRole?.permissions.find(p => p.permissionId === permId);
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando roles...</div>;

    return (
        <div className="flex flex-col space-y-6 h-[calc(100vh-100px)]">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Roles y Permisos</h1>
                    <p className="text-muted-foreground">Define perfiles de acceso y seguridad granular.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                </Button>
            </div>

            <div className="grid grid-cols-12 gap-6 h-full min-h-0">
                {/* Left: Roles List */}
                <Card className="col-span-3 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Roles</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 min-h-0">
                        <ScrollArea className="h-full">
                            <div className="space-y-1">
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-md text-sm transition-colors flex items-center justify-between",
                                            selectedRole?.id === role.id
                                                ? "bg-primary text-primary-foreground font-medium"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span>{role.name}</span>
                                            {role.description && (
                                                <span className={cn("text-xs truncate max-w-[180px]", selectedRole?.id === role.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                    {role.description}
                                                </span>
                                            )}
                                        </div>
                                        {selectedRole?.id === role.id && <Check className="h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Permissions Matrix */}
                <Card className="col-span-9 h-full flex flex-col">
                    {selectedRole ? (
                        <>
                            <CardHeader className="pb-4 shrink-0">
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Permisos: {selectedRole.name}
                                </CardTitle>
                                <CardDescription>Configura el acceso para este rol por módulo.</CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="p-6 space-y-8">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => (
                                            <div key={module} className="space-y-3">
                                                <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                                                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                                                        {module}
                                                    </Badge>
                                                </h3>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-muted/50 text-left">
                                                            <tr>
                                                                <th className="p-3 font-medium">Recurso</th>
                                                                <th className="p-3 font-medium text-center w-24">Ver</th>
                                                                <th className="p-3 font-medium text-center w-24">Crear</th>
                                                                <th className="p-3 font-medium text-center w-24">Editar</th>
                                                                <th className="p-3 font-medium text-center w-24">Eliminar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {perms.map((perm) => {
                                                                const rolePerm = getPermissionForRole(perm.id);
                                                                return (
                                                                    <tr key={perm.id} className="hover:bg-muted/30">
                                                                        <td className="p-3">
                                                                            <div className="font-medium">{perm.name}</div>
                                                                            <div className="text-xs text-muted-foreground">{perm.description}</div>
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <Switch
                                                                                checked={rolePerm?.canView || false}
                                                                                onCheckedChange={(checked) => handleToggle(perm.id, 'canView', !checked)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <Switch
                                                                                checked={rolePerm?.canCreate || false}
                                                                                onCheckedChange={(checked) => handleToggle(perm.id, 'canCreate', !checked)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <Switch
                                                                                checked={rolePerm?.canEdit || false}
                                                                                onCheckedChange={(checked) => handleToggle(perm.id, 'canEdit', !checked)}
                                                                            />
                                                                        </td>
                                                                        <td className="p-3 text-center">
                                                                            <Switch
                                                                                checked={rolePerm?.canDelete || false}
                                                                                onCheckedChange={(checked) => handleToggle(perm.id, 'canDelete', !checked)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <Lock className="h-12 w-12 mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">Selecciona un rol</h3>
                            <p>Elige un rol de la lista para gestionar sus permisos.</p>
                        </div>
                    )}
                </Card>
            </div>

            <CreateRoleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    );
}

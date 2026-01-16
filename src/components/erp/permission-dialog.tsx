"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { systemNavItems } from "@/lib/data";
import { User } from "@/types/sistema";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PermissionDialogProps {
    user: User;
    onSave: (userId: string, access: string[]) => void;
    trigger?: React.ReactNode;
}

export function PermissionDialog({ user, onSave, trigger }: PermissionDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    // Initialize state with user's current access or empty array
    const [selectedItems, setSelectedItems] = useState<string[]>(user.sidebarAccess || []);

    const handleToggle = (itemId: string, checked: boolean) => {
        if (checked) {
            setSelectedItems([...selectedItems, itemId]);
        } else {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        }
    };

    const handleSave = () => {
        onSave(user.id, selectedItems);
        setOpen(false);
        toast({
            title: "Permisos Actualizados",
            description: `Se han actualizado los accesos para ${user.name}.`
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="h-4 w-4" /> Gestión de Permisos
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Gestionar Accesos: {user.name}</DialogTitle>
                    <DialogDescription>
                        Selecciona los módulos del "Sistema Simplificado" que este usuario puede ver en el menú lateral.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-3">
                        {systemNavItems.map((item) => (
                            <div key={item.id} className="flex items-center space-x-3 p-2 rounded-md border hover:bg-accent/50 transition-colors">
                                <Checkbox
                                    id={`perm-${item.id}`}
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                                />
                                <Label
                                    htmlFor={`perm-${item.id}`}
                                    className="flex items-center gap-2 cursor-pointer w-full font-medium"
                                >
                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                    {item.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/sistema";

const formSchema = z.object({
    name: z.string().min(3, "El nombre es requerido"),
    email: z.string().email("Correo inválido"),
    role: z.enum(["ADMIN", "ENGINEER", "CLIENT", "VIEWER"] as [string, ...string[]]),
});

interface CreateUserDialogProps {
    onUserCreated: (user: any) => void;
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "VIEWER",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const newUser = {
            id: `USR-${Math.floor(Math.random() * 1000)}`,
            ...values,
            avatar: "",
        };

        onUserCreated(newUser);
        setOpen(false);
        form.reset();
        toast({
            title: "Usuario Creado",
            description: `Se ha registrado a ${values.name} correctamente.`
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <UserPlus className="h-4 w-4" /> Registrar Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo acceso al sistema ERP.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Pepito Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correo Electrónico</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="usuario@empresa.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol de Usuario</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Administrador</SelectItem>
                                            <SelectItem value="ENGINEER">Ingeniero</SelectItem>
                                            <SelectItem value="CLIENT">Cliente</SelectItem>
                                            <SelectItem value="VIEWER">Visualizador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit">Crear Usuario</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

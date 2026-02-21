'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Save, RotateCcw, Trash2, Clock } from 'lucide-react';
import { usePlans } from '@/components/providers/plans-provider';
import {
    createPlanVersion,
    getPlanVersions,
    restorePlanVersion,
    deletePlanVersion,
    PlanVersion
} from '@/app/dashboard/sistema/plans/actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function PlanVersionsDialog() {
    const { currentPlan, savePlan, loadPlan } = usePlans();
    const { toast } = useToast();
    const [versions, setVersions] = useState<PlanVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newVersionName, setNewVersionName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const fetchVersions = async () => {
        if (!currentPlan?.id) return;
        setIsLoading(true);
        const { data, error } = await getPlanVersions(currentPlan.id);
        if (data) setVersions(data);
        if (error) toast({ variant: 'destructive', title: 'Error', description: 'Error al cargar versiones' });
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchVersions();
    }, [isOpen, currentPlan?.id]);

    const handleCreateVersion = async () => {
        if (!currentPlan?.id || !newVersionName.trim()) return;

        setIsLoading(true);
        // savePlan now automatically creates the version as well
        await savePlan(newVersionName);

        toast({ title: 'Éxito', description: 'Versión guardada correctamente' });
        setNewVersionName('');
        fetchVersions();
        setIsLoading(false);
    };

    const handleRestore = async (version: PlanVersion) => {
        if (!confirm(`¿Estás seguro de restaurar la versión "${version.name}"? Se perderán los cambios no guardados en la versión actual.`)) return;

        setIsLoading(true);
        const { success, error } = await restorePlanVersion(version.id);

        if (success) {
            toast({ title: 'Éxito', description: 'Versión restaurada correctamente' });
            await loadPlan(version.project_id); // Reload canvas state from DB without page refresh
        } else {
            toast({ variant: 'destructive', title: 'Error', description: error || 'Error al restaurar versión' });
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta versión definitivamente?')) return;

        const { success, error } = await deletePlanVersion(id);
        if (success) {
            toast({ title: 'Éxito', description: 'Versión eliminada' });
            fetchVersions();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: error || 'Error al eliminar' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <History className="h-4 w-4" />
                    Historial
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Versiones del Proyecto
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="version-name">Guardar Instante Actual</Label>
                        <div className="flex gap-2">
                            <Input
                                id="version-name"
                                placeholder="Ej: Antes de modificar BT"
                                value={newVersionName}
                                onChange={(e) => setNewVersionName(e.target.value)}
                            />
                            <Button
                                onClick={handleCreateVersion}
                                disabled={isLoading || !newVersionName.trim()}
                                className="shrink-0"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Versiones Anteriores</Label>
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                            {versions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                                    <Clock className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs">No hay versiones guardadas todavía.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {versions.map((v) => (
                                        <div
                                            key={v.id}
                                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold leading-none">{v.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                    {format(new Date(v.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                    onClick={() => handleRestore(v)}
                                                    title="Restaurar esta versión"
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(v.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter>
                    <p className="text-[10px] text-muted-foreground text-center w-full">
                        Las versiones guardan el estado completo de nodos, conexiones y dibujos.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

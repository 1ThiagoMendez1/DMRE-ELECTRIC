'use client';

import React, { useState, Suspense, lazy } from 'react';
import { usePlans } from '@/components/providers/plans-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, FolderOpen, PenTool, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

// Dynamic imports for heavy components - prevents blocking on initial load
const PlanCanvas = lazy(() => import('./components/plan-canvas').then(m => ({ default: m.PlanCanvas })));
const Toolbar = lazy(() => import('./components/toolbar').then(m => ({ default: m.Toolbar })));
const ElementsSidebar = lazy(() => import('./components/elements-sidebar').then(m => ({ default: m.ElementsSidebar })));
const PropertiesPanel = lazy(() => import('./components/properties-panel').then(m => ({ default: m.PropertiesPanel })));
const ProjectsList = lazy(() => import('./components/projects-list').then(m => ({ default: m.ProjectsList })));

// Loading fallback component
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

type TabValue = 'projects' | 'canvas';

export default function PlansPage() {
    const { selectedElementIds, elements, currentPlan, isSaving, hasUnsavedChanges, savePlan } = usePlans();
    const [activeTab, setActiveTab] = useState<TabValue>('projects');

    const selectedElement = selectedElementIds.length === 1
        ? elements.find(el => el.id === selectedElementIds[0])
        : null;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">DMRE-PLANS</h1>
                        <span className="text-sm text-muted-foreground">
                            Diseño de Infraestructura Eléctrica
                        </span>
                    </div>

                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                        <TabsList className="h-9">
                            <TabsTrigger value="projects" className="gap-2">
                                <FolderOpen className="h-4 w-4" />
                                Proyectos
                            </TabsTrigger>
                            <TabsTrigger value="canvas" className="gap-2">
                                <PenTool className="h-4 w-4" />
                                Lienzo
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Current Project Name */}
                    {activeTab === 'canvas' && currentPlan && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{currentPlan.name}</span>
                            {currentPlan.scale && (
                                <span className="text-xs text-muted-foreground ml-1">({currentPlan.scale})</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === 'canvas' && (
                        <Suspense fallback={<LoadingSpinner />}>
                            {/* Save status indicator */}
                            <div className="flex items-center gap-2 mr-2">
                                {isSaving ? (
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Guardando...</span>
                                    </div>
                                ) : hasUnsavedChanges ? (
                                    <div className="flex items-center gap-1.5 text-amber-600 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Sin guardar</span>
                                    </div>
                                ) : currentPlan?.id ? (
                                    <div className="flex items-center gap-1.5 text-green-600 text-sm">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Guardado</span>
                                    </div>
                                ) : null}

                                {currentPlan?.id && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => savePlan()}
                                        disabled={isSaving || !hasUnsavedChanges}
                                        className="gap-1.5"
                                    >
                                        <Save className="h-4 w-4" />
                                        Guardar
                                    </Button>
                                )}
                            </div>

                            <Toolbar />
                            {/* Help Button */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>📖 Guía de Uso - DMRE-PLANS</DialogTitle>
                                        <DialogDescription>
                                            Instrucciones para usar el módulo de diseño de infraestructura eléctrica.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 text-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-base">🎨 Capas</h4>
                                                <ul className="space-y-1 text-muted-foreground">
                                                    <li>• <span className="text-yellow-500">■</span> <strong>Redes Existentes:</strong> Infraestructura actual</li>
                                                    <li>• <span className="text-blue-500">■</span> <strong>Redes Proyectadas:</strong> Nueva infraestructura</li>
                                                </ul>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-base">⚡ Herramientas</h4>
                                                <ul className="space-y-1 text-muted-foreground">
                                                    <li>• <strong>Conectar (🔗):</strong> Une postes/cajas</li>
                                                    <li>• <strong>Dibujar (✏️/D):</strong> Dibujo libre</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold text-base mb-2">⌨️ Atajos</h4>
                                            <div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
                                                <span><kbd className="px-1 bg-muted rounded">Ctrl+Z</kbd> Deshacer</span>
                                                <span><kbd className="px-1 bg-muted rounded">Ctrl+Y</kbd> Rehacer</span>
                                                <span><kbd className="px-1 bg-muted rounded">Delete</kbd> Borrar</span>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </Suspense>
                    )}
                </div>
            </div>

            {/* Main Content - Conditional based on tab */}
            {activeTab === 'projects' ? (
                <div className="flex-1 overflow-auto p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                        <ProjectsList onSelectProject={() => setActiveTab('canvas')} />
                    </Suspense>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar - Element Library */}
                    <Suspense fallback={<LoadingSpinner />}>
                        <ElementsSidebar />
                    </Suspense>

                    {/* Canvas Area */}
                    <div className="flex-1 relative bg-muted/30">
                        <Suspense fallback={<LoadingSpinner />}>
                            <PlanCanvas />
                        </Suspense>
                    </div>

                    {/* Right Sidebar - Properties Panel */}
                    {selectedElement && (
                        <Suspense fallback={<LoadingSpinner />}>
                            <PropertiesPanel element={selectedElement} />
                        </Suspense>
                    )}
                </div>
            )}
        </div>
    );
}

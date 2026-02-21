'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { usePlans } from '@/components/providers/plans-provider';
import {
    MousePointer2,
    Hand,
    ZoomIn,
    ZoomOut,
    Grid3X3,
    Undo2,
    Redo2,
    Save,
    Download,
    FileImage,
    FileText,
    Link,
    Pencil,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { PlanVersionsDialog } from './plan-versions-dialog';

export function Toolbar() {
    const {
        toolState,
        setActiveTool,
        toggleGrid,
        setZoomLevel,
        undo,
        redo,
        canUndo,
        canRedo,
        savePlan,
        exportPlan,
    } = usePlans();

    return (
        <TooltipProvider delayDuration={300}>
            <div className="flex items-center gap-1">
                {/* Selection Tools */}
                <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={toolState.activeTool === 'select' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveTool('select')}
                            >
                                <MousePointer2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Seleccionar (V)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={toolState.activeTool === 'pan' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveTool('pan')}
                            >
                                <Hand className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mover (Space+Drag)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={toolState.activeTool === 'connect' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveTool('connect')}
                            >
                                <Link className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Conectar (C)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={toolState.activeTool === 'pencil' ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setActiveTool('pencil')}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Lápiz (P)</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setZoomLevel(toolState.zoomLevel * 1.25)}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Acercar (Ctrl++)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setZoomLevel(toolState.zoomLevel * 0.8)}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Alejar (Ctrl+-)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-medium"
                                onClick={() => setZoomLevel(100)}
                            >
                                {toolState.zoomLevel}%
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Restablecer zoom</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Grid Controls */}
                <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={toolState.gridEnabled ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={toggleGrid}
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mostrar rejilla</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 bg-secondary/50 rounded-md p-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={undo}
                                disabled={!canUndo}
                            >
                                <Undo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Deshacer (Ctrl+Z)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={redo}
                                disabled={!canRedo}
                            >
                                <Redo2 className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rehacer (Ctrl+Y)</TooltipContent>
                    </Tooltip>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Save & Export */}
                <div className="flex items-center gap-0.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => savePlan()}
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Guardar (Ctrl+S)</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Exportar</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Exportar como</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => exportPlan('pdf')}>
                                <FileText className="h-4 w-4 mr-2" />
                                PDF (Vectorial)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportPlan('svg')}>
                                <FileImage className="h-4 w-4 mr-2" />
                                SVG (Vectorial)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportPlan('png')}>
                                <FileImage className="h-4 w-4 mr-2" />
                                PNG (Alta resolución)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportPlan('jpg')}>
                                <FileImage className="h-4 w-4 mr-2" />
                                JPG (Alta resolución)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Separator orientation="vertical" className="h-6 mx-1" />

                {/* Versions History */}
                <PlanVersionsDialog />
            </div>
        </TooltipProvider>
    );
}

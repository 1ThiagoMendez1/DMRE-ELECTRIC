'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePlans } from '@/components/providers/plans-provider';
import {
    PoleElement,
    NetworkLine,
    BoxElement,
    DuctElement,
    CustomElement,
} from '@/types/plans';
import { Trash2, Copy, RotateCcw } from 'lucide-react';

interface PropertiesPanelProps {
    element: PoleElement | NetworkLine | BoxElement | DuctElement | CustomElement;
}

export function PropertiesPanel({ element }: PropertiesPanelProps) {
    const { updateElement, deleteElement, layers, setActiveLayerId } = usePlans();

    const handleUpdate = (field: string, value: unknown) => {
        updateElement(element.id, { [field]: value });
    };

    return (
        <div className="w-72 border-l bg-background flex flex-col">
            {/* Header */}
            <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Propiedades</h3>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteElement(element.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {element.type === 'pole' && 'Poste'}
                    {element.type === 'network' && 'Red'}
                    {element.type === 'box' && 'Caja de Inspección'}
                    {element.type === 'duct' && 'Ducto'}
                    {element.type === 'custom' && 'Personalizado'}
                </p>
            </div>

            {/* Properties */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                    {/* Common Properties */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            General
                        </h4>

                        <div className="space-y-2">
                            <Label className="text-xs">Nombre</Label>
                            <Input
                                className="h-8 text-sm"
                                value={element.name}
                                onChange={(e) => handleUpdate('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Capa</Label>
                            <Select
                                value={element.layerId}
                                onValueChange={(value) => handleUpdate('layerId', value)}
                            >
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {layers.map(layer => (
                                        <SelectItem key={layer.id} value={layer.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: layer.color }}
                                                />
                                                {layer.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Separator />

                    {/* Position */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Posición
                        </h4>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">X</Label>
                                <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={Math.round(element.x)}
                                    onChange={(e) => handleUpdate('x', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Y</Label>
                                <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={Math.round(element.y)}
                                    onChange={(e) => handleUpdate('y', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs">Rotación</Label>
                                <Input
                                    type="number"
                                    className="h-8 text-sm"
                                    value={Math.round(element.rotation)}
                                    onChange={(e) => handleUpdate('rotation', parseFloat(e.target.value))}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 mt-5"
                                onClick={() => handleUpdate('rotation', 0)}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    {/* Type-specific Properties */}
                    {element.type === 'pole' && (
                        <PoleProperties element={element as PoleElement} onUpdate={handleUpdate} />
                    )}

                    {element.type === 'network' && (
                        <NetworkProperties element={element as NetworkLine} onUpdate={handleUpdate} />
                    )}

                    {element.type === 'box' && (
                        <BoxProperties element={element as BoxElement} onUpdate={handleUpdate} />
                    )}

                    <Separator />

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-xs">Notas</Label>
                        <Textarea
                            className="text-sm resize-none"
                            rows={3}
                            placeholder="Agregar notas..."
                            value={element.notes || ''}
                            onChange={(e) => handleUpdate('notes', e.target.value)}
                        />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

// Pole-specific properties
function PoleProperties({
    element,
    onUpdate
}: {
    element: PoleElement;
    onUpdate: (field: string, value: unknown) => void;
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Poste
            </h4>

            <div className="space-y-2">
                <Label className="text-xs">Altura</Label>
                <Select
                    value={element.height}
                    onValueChange={(value) => onUpdate('height', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="8m">8 metros</SelectItem>
                        <SelectItem value="10m">10 metros</SelectItem>
                        <SelectItem value="12m">12 metros</SelectItem>
                        <SelectItem value="14m">14 metros</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Capacidad de Carga</Label>
                <Select
                    value={element.loadCapacity}
                    onValueChange={(value) => onUpdate('loadCapacity', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="510kg">510 kg</SelectItem>
                        <SelectItem value="750kg">750 kg</SelectItem>
                        <SelectItem value="1050kg">1,050 kg</SelectItem>
                        <SelectItem value="1350kg">1,350 kg</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Tipo</Label>
                <Select
                    value={element.poleType}
                    onValueChange={(value) => onUpdate('poleType', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="concrete">Concreto</SelectItem>
                        <SelectItem value="metal">Metálico</SelectItem>
                        <SelectItem value="ap">Alumbrado Público</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// Network-specific properties
function NetworkProperties({
    element,
    onUpdate
}: {
    element: NetworkLine;
    onUpdate: (field: string, value: unknown) => void;
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Red
            </h4>

            <div className="space-y-2">
                <Label className="text-xs">Tipo de Red</Label>
                <Select
                    value={element.networkType}
                    onValueChange={(value) => onUpdate('networkType', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bt">Baja Tensión</SelectItem>
                        <SelectItem value="mt-11">Media Tensión 11.4kV</SelectItem>
                        <SelectItem value="mt-13">Media Tensión 13.2kV</SelectItem>
                        <SelectItem value="at-34">Alta Tensión 34.5kV</SelectItem>
                        <SelectItem value="ground">Puesta a Tierra</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Variante</Label>
                <Select
                    value={element.variant}
                    onValueChange={(value) => onUpdate('variant', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="aerial">Aérea</SelectItem>
                        <SelectItem value="underground">Subterránea</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Calibre del Conductor</Label>
                <Input
                    className="h-8 text-sm"
                    placeholder="ej: 2/0 AWG"
                    value={element.conductorGauge || ''}
                    onChange={(e) => onUpdate('conductorGauge', e.target.value)}
                />
            </div>

            {element.length !== undefined && (
                <div className="space-y-1">
                    <Label className="text-xs">Longitud (calculada)</Label>
                    <div className="text-sm font-medium">
                        {element.length.toFixed(2)} m
                    </div>
                </div>
            )}
        </div>
    );
}

// Box-specific properties
function BoxProperties({
    element,
    onUpdate
}: {
    element: BoxElement;
    onUpdate: (field: string, value: unknown) => void;
}) {
    return (
        <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Caja
            </h4>

            <div className="space-y-2">
                <Label className="text-xs">Tipo de Caja</Label>
                <Select
                    value={element.boxType}
                    onValueChange={(value) => onUpdate('boxType', value)}
                >
                    <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CS274">CS274 - A.P./Acometidas</SelectItem>
                        <SelectItem value="CS275">CS275 - Sencilla B.T./M.T.</SelectItem>
                        <SelectItem value="CS276">CS276 - Doble B.T./M.T.</SelectItem>
                        <SelectItem value="CS277">CS277 - Triple B.T./M.T.</SelectItem>
                        <SelectItem value="CS280">CS280 - Vehicular</SelectItem>
                        <SelectItem value="CS281">CS281 - Metálica</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label className="text-xs">Ancho</Label>
                    <Input
                        type="number"
                        className="h-8 text-sm"
                        value={element.width}
                        onChange={(e) => onUpdate('width', parseFloat(e.target.value))}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Alto</Label>
                    <Input
                        type="number"
                        className="h-8 text-sm"
                        value={element.height}
                        onChange={(e) => onUpdate('height', parseFloat(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
}

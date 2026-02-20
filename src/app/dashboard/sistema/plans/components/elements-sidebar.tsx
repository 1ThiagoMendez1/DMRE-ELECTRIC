'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    POLE_CATALOG,
    NETWORK_CATALOG,
    DUCT_CATALOG,
    BOX_CATALOG,
    NetworkType,
    NetworkVariant,
} from '@/types/plans';
import { ChevronDown, Search, Circle, Cable, Square, Box, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlans } from '@/components/providers/plans-provider';
import { getNetworkStyle } from '@/lib/plans/network-styles';

export function ElementsSidebar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        poles: true,
        networks: false,
        ducts: false,
        boxes: false,
    });

    const {
        selectedNetworkType,
        selectedNetworkVariant,
        setSelectedNetwork,
        setActiveTool,
        toolState,
    } = usePlans();

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleDragStart = (e: React.DragEvent, data: Record<string, unknown>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Click a network to select it and activate connection mode
    const handleNetworkClick = (networkType: NetworkType, variant: NetworkVariant) => {
        if (selectedNetworkType === networkType && selectedNetworkVariant === variant) {
            // Deselect if clicking the same
            setSelectedNetwork(null, null);
            if (toolState.activeTool === 'connect') {
                setActiveTool('select');
            }
        } else {
            setSelectedNetwork(networkType, variant);
            setActiveTool('connect');
        }
    };

    const filterItems = <T extends { name: string }>(items: T[]): T[] => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Check if a network is currently selected
    const isNetworkSelected = (networkType: NetworkType, variant: NetworkVariant) => {
        return selectedNetworkType === networkType && selectedNetworkVariant === variant;
    };

    return (
        <div className="w-64 border-r bg-background flex flex-col">
            {/* Header */}
            <div className="p-3 border-b">
                <h3 className="font-semibold text-sm mb-2">Biblioteca de Elementos</h3>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        className="pl-8 h-8 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Selected Network Indicator */}
            {selectedNetworkType && selectedNetworkVariant && (
                <div className="px-3 py-2 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-[11px] font-medium text-muted-foreground">Red activa:</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span
                            className="w-4 h-[3px] rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: getNetworkStyle(selectedNetworkType, selectedNetworkVariant).color,
                                borderBottom: getNetworkStyle(selectedNetworkType, selectedNetworkVariant).dashArray
                                    ? '2px dashed ' + getNetworkStyle(selectedNetworkType, selectedNetworkVariant).color
                                    : undefined,
                            }}
                        />
                        <span className="text-xs font-semibold truncate">
                            {getNetworkStyle(selectedNetworkType, selectedNetworkVariant).label}
                        </span>
                        <button
                            onClick={() => {
                                setSelectedNetwork(null, null);
                                if (toolState.activeTool === 'connect') setActiveTool('select');
                            }}
                            className="ml-auto text-muted-foreground hover:text-foreground text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Elements List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {/* Poles Section */}
                    <Collapsible open={openSections.poles} onOpenChange={() => toggleSection('poles')}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between h-9 px-2 font-medium text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Circle className="h-4 w-4 text-blue-500" />
                                    <span>Postes</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    openSections.poles && "rotate-180"
                                )} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 pt-1">
                            {filterItems(POLE_CATALOG).map((pole, idx) => {
                                const { type: _type, ...poleData } = pole as { type?: string;[key: string]: unknown };
                                return (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, { type: 'pole', ...poleData })}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab hover:bg-accent active:cursor-grabbing transition-colors"
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold",
                                            pole.poleType === 'ap' ? "border-amber-500 bg-amber-100" : "border-blue-500 bg-blue-100"
                                        )}>
                                            {pole.height.replace('m', '')}
                                        </div>
                                        <span className="truncate text-xs">{pole.name}</span>
                                    </div>
                                );
                            })}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Networks Section */}
                    <Collapsible open={openSections.networks} onOpenChange={() => toggleSection('networks')}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between h-9 px-2 font-medium text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Cable className="h-4 w-4 text-green-500" />
                                    <span>Redes</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    openSections.networks && "rotate-180"
                                )} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 pt-1">
                            {filterItems(NETWORK_CATALOG).map((network, idx) => {
                                const nType = network.networkType as NetworkType;
                                const nVariant = network.variant as NetworkVariant;
                                const style = getNetworkStyle(nType, nVariant);
                                const selected = isNetworkSelected(nType, nVariant);

                                return (
                                    <div
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, { type: 'network', networkType: nType, variant: nVariant, name: network.name, color: network.color })}
                                        onClick={() => handleNetworkClick(nType, nVariant)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-accent transition-colors",
                                            selected && "bg-accent ring-2 ring-primary/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {/* Color dot */}
                                            <div
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: style.color }}
                                            />
                                            {/* Line preview */}
                                            <div
                                                className="w-5 h-0 flex-shrink-0"
                                                style={{
                                                    borderBottom: `${Math.min(style.strokeWidth, 3)}px ${style.dashArray ? 'dashed' : 'solid'} ${style.color}`,
                                                }}
                                            />
                                        </div>
                                        <span className="truncate text-xs">{network.name}</span>
                                        {selected && (
                                            <span className="ml-auto text-[10px] text-primary font-bold">✓</span>
                                        )}
                                    </div>
                                );
                            })}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Ducts Section */}
                    <Collapsible open={openSections.ducts} onOpenChange={() => toggleSection('ducts')}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between h-9 px-2 font-medium text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Square className="h-4 w-4 text-orange-500" />
                                    <span>Canalizaciones</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    openSections.ducts && "rotate-180"
                                )} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 pt-1">
                            {filterItems(DUCT_CATALOG).map((duct, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, { type: 'duct', ...duct })}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab hover:bg-accent active:cursor-grabbing transition-colors"
                                >
                                    <div className="w-5 h-3 border-2 border-orange-500 bg-orange-100 rounded-sm" />
                                    <span className="truncate text-xs">{duct.name}</span>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Boxes Section */}
                    <Collapsible open={openSections.boxes} onOpenChange={() => toggleSection('boxes')}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between h-9 px-2 font-medium text-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <Box className="h-4 w-4 text-gray-500" />
                                    <span>Cajas de Inspección</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    openSections.boxes && "rotate-180"
                                )} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-0.5 pt-1">
                            {filterItems(BOX_CATALOG).map((box, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, { type: 'box', ...box })}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab hover:bg-accent active:cursor-grabbing transition-colors"
                                >
                                    <div
                                        className="border-2 border-gray-400 bg-gray-100 rounded-sm flex items-center justify-center text-[8px] font-bold"
                                        style={{
                                            width: Math.min(box.width / 5, 20),
                                            height: Math.min(box.height / 5, 16)
                                        }}
                                    >
                                        {box.boxType.replace('CS', '')}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium">{box.boxType}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">
                                            {box.description}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                </div>
            </ScrollArea>

            {/* Footer - Quick Info */}
            <div className="p-2 border-t text-[10px] text-muted-foreground space-y-0.5">
                <p>🖱️ Arrastra elementos al lienzo</p>
                <p>🔌 Clic en una red para activar modo conexión</p>
            </div>
        </div>
    );
}

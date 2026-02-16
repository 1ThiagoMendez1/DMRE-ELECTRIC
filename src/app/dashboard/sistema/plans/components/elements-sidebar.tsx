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
} from '@/types/plans';
import { ChevronDown, Search, Circle, Cable, Square, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ElementsSidebar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        poles: true,
        networks: false,
        ducts: false,
        boxes: false,
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleDragStart = (e: React.DragEvent, data: Record<string, unknown>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const filterItems = <T extends { name: string }>(items: T[]): T[] => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
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
                            {filterItems(NETWORK_CATALOG).map((network, idx) => (
                                <div
                                    key={idx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, { type: 'network', ...network })}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-grab hover:bg-accent active:cursor-grabbing transition-colors"
                                >
                                    <div
                                        className="w-5 h-1 rounded-full"
                                        style={{ backgroundColor: network.color }}
                                    />
                                    <span className="truncate text-xs">{network.name}</span>
                                </div>
                            ))}
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
            <div className="p-2 border-t text-[10px] text-muted-foreground">
                <p>Arrastra elementos al lienzo para agregarlos</p>
            </div>
        </div>
    );
}

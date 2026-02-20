// DMRE-PLANS TypeScript Definitions
// Electrical Infrastructure Drawing Module Types

// ============================================
// LAYER TYPES
// ============================================

export type LayerType = 'existing' | 'projected';

export interface Layer {
    id: string;
    name: string;
    type: LayerType;
    visible: boolean;
    locked: boolean;
    color: string; // Primary color for elements in this layer
}

// Default layers following specification
export const DEFAULT_LAYERS: Layer[] = [
    {
        id: 'layer-existing',
        name: 'Redes Existentes',
        type: 'existing',
        visible: true,
        locked: false,
        color: '#FFC107', // Yellow/Amber
    },
    {
        id: 'layer-projected',
        name: 'Redes Proyectadas',
        type: 'projected',
        visible: true,
        locked: false,
        color: '#2196F3', // Blue
    },
];

// ============================================
// ELEMENT TYPES
// ============================================

export type ElementCategory = 'pole' | 'network' | 'duct' | 'box' | 'custom';

// Base element interface
export interface PlanElement {
    id: string;
    type: ElementCategory;
    name: string;
    layerId: string;
    x: number;
    y: number;
    rotation: number;
    locked: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// POLE ELEMENTS
// ============================================

export type PoleType = 'concrete' | 'metal' | 'ap';
export type PoleHeight = '8m' | '10m' | '12m' | '14m';
export type LoadCapacity = '510kg' | '750kg' | '1050kg' | '1350kg';

export interface PoleElement extends PlanElement {
    type: 'pole';
    poleType: PoleType;
    height: PoleHeight;
    loadCapacity: LoadCapacity;
    isStreetLight: boolean;
    anchorPoints: AnchorPoint[];
}

export interface AnchorPoint {
    id: string;
    position: 'top' | 'north' | 'south' | 'east' | 'west';
    connectedTo?: string; // ID of connected network line
    offsetX: number;
    offsetY: number;
}

// Pole catalog for sidebar
export const POLE_CATALOG: Omit<PoleElement, 'id' | 'x' | 'y' | 'rotation' | 'locked' | 'notes' | 'layerId' | 'createdAt' | 'updatedAt' | 'anchorPoints'>[] = [
    { type: 'pole', name: 'Poste Concreto 10m - 510kg', poleType: 'concrete', height: '10m', loadCapacity: '510kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 10m - 750kg', poleType: 'concrete', height: '10m', loadCapacity: '750kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 10m - 1050kg', poleType: 'concrete', height: '10m', loadCapacity: '1050kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 10m - 1350kg', poleType: 'concrete', height: '10m', loadCapacity: '1350kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 12m - 510kg', poleType: 'concrete', height: '12m', loadCapacity: '510kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 12m - 750kg', poleType: 'concrete', height: '12m', loadCapacity: '750kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 12m - 1050kg', poleType: 'concrete', height: '12m', loadCapacity: '1050kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 12m - 1350kg', poleType: 'concrete', height: '12m', loadCapacity: '1350kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 14m - 510kg', poleType: 'concrete', height: '14m', loadCapacity: '510kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 14m - 750kg', poleType: 'concrete', height: '14m', loadCapacity: '750kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 14m - 1050kg', poleType: 'concrete', height: '14m', loadCapacity: '1050kg', isStreetLight: false },
    { type: 'pole', name: 'Poste Concreto 14m - 1350kg', poleType: 'concrete', height: '14m', loadCapacity: '1350kg', isStreetLight: false },
    { type: 'pole', name: 'Poste A.P. Recto', poleType: 'ap', height: '10m', loadCapacity: '510kg', isStreetLight: true },
];

// ============================================
// NETWORK ELEMENTS (Cables/Lines)
// ============================================

export type NetworkType = 'bt' | 'mt-11' | 'mt-13' | 'at-34' | 'ground';
export type NetworkVariant = 'aerial' | 'underground';

export interface NetworkLine extends PlanElement {
    type: 'network';
    networkType: NetworkType;
    variant: NetworkVariant;
    conductorGauge?: string;
    startAnchorId?: string;
    endAnchorId?: string;
    points: { x: number; y: number }[]; // Path points for the line
    length?: number; // Calculated length in meters
}

// Network catalog for sidebar
export const NETWORK_CATALOG: { networkType: NetworkType; variant: NetworkVariant; name: string; color: string }[] = [
    { networkType: 'bt', variant: 'aerial', name: 'Red B.T. Aérea', color: '#4CAF50' },
    { networkType: 'bt', variant: 'underground', name: 'Red B.T. Subterránea', color: '#388E3C' },
    { networkType: 'mt-11', variant: 'aerial', name: 'Red M.T. 11.4kV Aérea', color: '#FF9800' },
    { networkType: 'mt-11', variant: 'underground', name: 'Red M.T. 11.4kV Subterránea', color: '#F57C00' },
    { networkType: 'mt-13', variant: 'aerial', name: 'Red M.T. 13.2kV Aérea', color: '#FF5722' },
    { networkType: 'mt-13', variant: 'underground', name: 'Red M.T. 13.2kV Subterránea', color: '#E64A19' },
    { networkType: 'at-34', variant: 'aerial', name: 'Red 34.5kV Aérea', color: '#F44336' },
    { networkType: 'at-34', variant: 'underground', name: 'Red 34.5kV Subterránea', color: '#D32F2F' },
    { networkType: 'ground', variant: 'underground', name: 'Conductor Puesta a Tierra', color: '#795548' },
];

// ============================================
// DUCT/CONDUIT ELEMENTS
// ============================================

export type DuctSize = '2x3' | '4x4' | '6x4';

export interface DuctElement extends PlanElement {
    type: 'duct';
    size: DuctSize;
    points: { x: number; y: number }[];
    length?: number;
}

export const DUCT_CATALOG: { size: DuctSize; name: string }[] = [
    { size: '2x3', name: 'Ducto 2x3"' },
    { size: '4x4', name: 'Ducto 4x4"' },
    { size: '6x4', name: 'Ducto 6x4"' },
];

// ============================================
// INSPECTION BOX ELEMENTS
// ============================================

export type BoxType = 'CS274' | 'CS275' | 'CS276' | 'CS277' | 'CS280' | 'CS281';

export interface BoxElement extends PlanElement {
    type: 'box';
    boxType: BoxType;
    width: number;
    height: number;
}

export const BOX_CATALOG: { boxType: BoxType; name: string; description: string; width: number; height: number }[] = [
    { boxType: 'CS274', name: 'CS274', description: 'Caja A.P. / Acometidas', width: 40, height: 40 },
    { boxType: 'CS275', name: 'CS275', description: 'Caja Sencilla B.T./M.T.', width: 50, height: 50 },
    { boxType: 'CS276', name: 'CS276', description: 'Caja Doble B.T./M.T.', width: 80, height: 50 },
    { boxType: 'CS277', name: 'CS277', description: 'Caja Triple B.T./M.T.', width: 110, height: 50 },
    { boxType: 'CS280', name: 'CS280', description: 'Caja Vehicular', width: 100, height: 100 },
    { boxType: 'CS281', name: 'CS281', description: 'Caja Metálica', width: 60, height: 60 },
];

// ============================================
// CUSTOM SHAPE ELEMENTS
// ============================================

export interface CustomElement extends PlanElement {
    type: 'custom';
    svgPath?: string;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
}

// ============================================
// PLAN DOCUMENT
// ============================================

export interface Plan {
    id: string;
    name: string;
    description?: string;
    scale: string; // e.g., "1:100"
    layers: Layer[];
    elements: (PoleElement | NetworkLine | DuctElement | BoxElement | CustomElement)[];
    canvasState?: string; // Serialized Fabric.js canvas state
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    projectId?: string;
}

// ============================================
// TOOL TYPES
// ============================================

export type ToolType =
    | 'select'
    | 'pan'
    | 'zoom-in'
    | 'zoom-out'
    | 'ruler'
    | 'line-draw'
    | 'polygon-draw'
    | 'eraser'
    | 'connect'
    | 'pencil';

export interface ToolState {
    activeTool: ToolType;
    gridEnabled: boolean;
    snapToGrid: boolean;
    gridSize: number; // in pixels
    zoomLevel: number; // percentage
    measurementScale: string;
}

// ============================================
// CANVAS STATE
// ============================================

export interface CanvasState {
    zoom: number;
    panX: number;
    panY: number;
    selectedElementIds: string[];
    clipboard?: PlanElement[];
}

// ============================================
// SIDEBAR LIBRARY
// ============================================

export interface LibraryCategory {
    id: string;
    name: string;
    icon: string;
    items: LibraryItem[];
    expanded: boolean;
}

export interface LibraryItem {
    id: string;
    name: string;
    category: ElementCategory;
    thumbnail?: string;
    data: Partial<PoleElement | NetworkLine | DuctElement | BoxElement>;
}

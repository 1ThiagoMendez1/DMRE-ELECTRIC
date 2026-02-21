// ============================================
// DMRE-PLANS Graph Model Types
// Nodes (physical elements) and Edges (network connections)
// ============================================

import { NetworkType, NetworkVariant, PoleType, PoleHeight, LoadCapacity, BoxType } from './plans';

// ============================================
// TENSION LEVELS
// ============================================

export type TensionLevel = 'bt' | 'mt' | 'at';

/**
 * Determine the tension level of a network type.
 */
export function getTensionLevel(networkType: NetworkType): TensionLevel {
    switch (networkType) {
        case 'bt':
        case 'ground':
            return 'bt';
        case 'mt-11':
        case 'mt-13':
            return 'mt';
        case 'at-34':
            return 'at';
        default:
            return 'bt';
    }
}

// ============================================
// GRAPH NODE
// ============================================

/**
 * Metadata specific to each element type.
 */
export interface NodeMetadata {
    // Pole-specific
    poleType?: PoleType;
    height?: PoleHeight;
    loadCapacity?: LoadCapacity;
    isStreetLight?: boolean;
    // Box-specific
    boxType?: BoxType;
    boxWidth?: number;
    boxHeight?: number;
    // Duct-specific
    ductSize?: string;
    // Common
    layerId: string;
    name?: string;
}

/**
 * Represents a physical element on the canvas — a pole, box, duct, etc.
 * Each GraphNode maps 1:1 to a Fabric.js object on the canvas.
 */
export interface GraphNode {
    id: string;
    elementType: 'pole' | 'box' | 'duct' | 'custom';
    fabricObjectId: string;
    x: number;
    y: number;
    metadata: NodeMetadata;
    /** Maximum tension level this node supports (derived from element type + properties) */
    supportedTension: TensionLevel[];
    createdAt: string;
}

/**
 * Determine supported tension levels for a node based on its type and properties.
 */
export function getNodeSupportedTension(
    elementType: GraphNode['elementType'],
    metadata: NodeMetadata
): TensionLevel[] {
    switch (elementType) {
        case 'pole': {
            // High-capacity poles or generic poles support all
            return ['bt', 'mt', 'at'];
        }
        case 'box': {
            // All modern boxes support all tensions for flexibility
            return ['bt', 'mt', 'at'];
        }
        case 'duct':
            return ['bt', 'mt', 'at'];
        case 'custom':
            return ['bt', 'mt', 'at'];
        default:
            return ['bt', 'mt', 'at'];
    }
}

// ============================================
// GRAPH EDGE
// ============================================

/**
 * Represents a network connection (cable/line) between two nodes.
 * Each GraphEdge maps 1:1 to a Fabric.js Line object on the canvas.
 */
export interface GraphEdge {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    networkType: NetworkType;
    variant: NetworkVariant;
    fabricObjectId: string;
    /** Auto-calculated length in pixels */
    length: number;
    /** Layer this edge belongs to */
    layerId: string;
    createdAt: string;
}

// ============================================
// GRAPH STATE (central data structure)
// ============================================

export interface SerializedGraphState {
    nodes: [string, GraphNode][];
    edges: [string, GraphEdge][];
}

/**
 * Serialize the graph state for persistence (Maps → arrays).
 */
export function serializeGraphState(
    nodes: Map<string, GraphNode>,
    edges: Map<string, GraphEdge>
): SerializedGraphState {
    return {
        nodes: Array.from(nodes.entries()),
        edges: Array.from(edges.entries()),
    };
}

/**
 * Deserialize graph state from persistence (arrays → Maps).
 */
export function deserializeGraphState(
    data: SerializedGraphState
): { nodes: Map<string, GraphNode>; edges: Map<string, GraphEdge> } {
    return {
        nodes: new Map(data.nodes || []),
        edges: new Map(data.edges || []),
    };
}

// ============================================
// UTILITY
// ============================================

/**
 * Calculate Euclidean distance between two points.
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Get all edges connected to a specific node.
 */
export function getEdgesForNode(nodeId: string, edges: Map<string, GraphEdge>): GraphEdge[] {
    const result: GraphEdge[] = [];
    edges.forEach(edge => {
        if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) {
            result.push(edge);
        }
    });
    return result;
}

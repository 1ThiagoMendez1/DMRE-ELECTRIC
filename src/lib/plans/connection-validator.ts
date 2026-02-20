// ============================================
// DMRE-PLANS Connection Validator (Middleware)
// Business rules for edge creation
// ============================================

import { NetworkType, NetworkVariant } from '@/types/plans';
import {
    GraphNode,
    GraphEdge,
    getTensionLevel,
    TensionLevel,
} from '@/types/graph-types';

// ============================================
// VALIDATION RESULT
// ============================================

export interface ValidationResult {
    /** Whether the connection is allowed */
    valid: boolean;
    /** Human-readable reason if invalid */
    reason?: string;
    /** Warning message (connection allowed but flagged) */
    warning?: string;
}

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================

/**
 * Validates whether a connection (edge) can be created between two nodes.
 * This is the middleware called BEFORE creating an edge.
 *
 * @param sourceNode - The originating node
 * @param targetNode - The destination node
 * @param networkType - Type of network being connected
 * @param variant - Aerial or underground
 * @param existingEdges - All current edges for duplicate checking
 * @returns ValidationResult with valid/invalid status and reason
 */
export function validarConexion(
    sourceNode: GraphNode,
    targetNode: GraphNode,
    networkType: NetworkType,
    variant: NetworkVariant,
    existingEdges: Map<string, GraphEdge>
): ValidationResult {
    // -----------------------------------------------
    // Rule 1: No self-connections
    // -----------------------------------------------
    if (sourceNode.id === targetNode.id) {
        return {
            valid: false,
            reason: 'No se puede conectar un elemento consigo mismo.',
        };
    }

    // -----------------------------------------------
    // Rule 2: No duplicate edges between same pair
    // -----------------------------------------------
    const isDuplicate = Array.from(existingEdges.values()).some(edge =>
        edge.networkType === networkType &&
        edge.variant === variant &&
        ((edge.sourceNodeId === sourceNode.id && edge.targetNodeId === targetNode.id) ||
            (edge.sourceNodeId === targetNode.id && edge.targetNodeId === sourceNode.id))
    );

    if (isDuplicate) {
        return {
            valid: false,
            reason: `Ya existe una conexión ${getNetworkLabel(networkType, variant)} entre estos elementos.`,
        };
    }

    // -----------------------------------------------
    // Rule 3: Tension compatibility
    // -----------------------------------------------
    const tensionLevel = getTensionLevel(networkType);
    let warning: string | undefined;

    if (!sourceNode.supportedTension.includes(tensionLevel)) {
        warning = `Aviso: El elemento origen "${sourceNode.metadata.name || sourceNode.elementType}" no está certificado para tensión ${getTensionLabel(tensionLevel)}, pero se permite la conexión.`;
    }

    if (!targetNode.supportedTension.includes(tensionLevel)) {
        const targetWarning = `Aviso: El elemento destino "${targetNode.metadata.name || targetNode.elementType}" no está certificado para tensión ${getTensionLabel(tensionLevel)}, pero se permite la conexión.`;
        warning = warning ? `${warning} | ${targetWarning}` : targetWarning;
    }

    // -----------------------------------------------
    // Rule 4: Underground networks prefer boxes
    // -----------------------------------------------
    if (variant === 'underground') {
        const sourceIsBox = sourceNode.elementType === 'box';
        const targetIsBox = targetNode.elementType === 'box';

        if (!sourceIsBox && !targetIsBox) {
            warning = 'Las redes subterráneas deben preferentemente conectarse a cajas de inspección. Se permite, pero revise el diseño.';
        } else if (!sourceIsBox || !targetIsBox) {
            warning = 'Se recomienda que ambos extremos de una red subterránea sean cajas de inspección.';
        }
    }

    // -----------------------------------------------
    // Rule 5: Box-type compatibility
    // -----------------------------------------------
    if (sourceNode.metadata.boxType === 'CS274' && tensionLevel !== 'bt') {
        const boxWarning = 'Aviso: La caja CS274 (A.P./Acometidas) está diseñada solo para Baja Tensión.';
        warning = warning ? `${warning} | ${boxWarning}` : boxWarning;
    }

    if (targetNode.metadata.boxType === 'CS274' && tensionLevel !== 'bt') {
        const boxWarning = 'Aviso: La caja CS274 (A.P./Acometidas) está diseñada solo para Baja Tensión.';
        warning = warning ? `${warning} | ${boxWarning}` : boxWarning;
    }

    // -----------------------------------------------
    // All rules passed
    // -----------------------------------------------
    return { valid: true, warning };
}

// ============================================
// VALID TARGETS FUNCTION (for hover highlight)
// ============================================

/**
 * Returns a Set of node IDs that are valid connection targets for the
 * given source node, network type, and variant.
 * Used to highlight valid targets on hover during connection mode.
 */
export function getValidTargets(
    sourceNodeId: string,
    networkType: NetworkType,
    variant: NetworkVariant,
    allNodes: Map<string, GraphNode>,
    existingEdges: Map<string, GraphEdge>
): Set<string> {
    const validIds = new Set<string>();
    const sourceNode = allNodes.get(sourceNodeId);

    if (!sourceNode) return validIds;

    allNodes.forEach((targetNode, targetId) => {
        if (targetId === sourceNodeId) return; // Skip self

        const result = validarConexion(sourceNode, targetNode, networkType, variant, existingEdges);
        if (result.valid) {
            validIds.add(targetId);
        }
    });

    return validIds;
}

// ============================================
// HELPERS
// ============================================

function getNetworkLabel(networkType: NetworkType, variant: NetworkVariant): string {
    const typeLabels: Record<NetworkType, string> = {
        'bt': 'B.T.',
        'mt-11': 'M.T. 11.4kV',
        'mt-13': 'M.T. 13.2kV',
        'at-34': '34.5kV',
        'ground': 'Tierra',
    };
    const variantLabels: Record<NetworkVariant, string> = {
        'aerial': 'Aérea',
        'underground': 'Subterránea',
    };
    return `${typeLabels[networkType]} ${variantLabels[variant]}`;
}

function getTensionLabel(tension: TensionLevel): string {
    switch (tension) {
        case 'bt': return 'Baja Tensión';
        case 'mt': return 'Media Tensión';
        case 'at': return 'Alta Tensión';
    }
}

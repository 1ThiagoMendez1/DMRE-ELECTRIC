// ============================================
// DMRE-PLANS Network Style Dictionary
// Dynamic styles for network edge rendering
// ============================================

import { NetworkType, NetworkVariant } from '@/types/plans';

// ============================================
// STYLE INTERFACE
// ============================================

export interface NetworkStyle {
    /** Stroke color (hex) */
    color: string;
    /** Stroke width in pixels */
    strokeWidth: number;
    /** Dash pattern [dash, gap] — null = solid line */
    dashArray: number[] | null;
    /** Human-readable label */
    label: string;
    /** Glow color for ghost line preview (slightly transparent) */
    glowColor: string;
}

// ============================================
// STYLE DICTIONARY
// ============================================

/**
 * Master style dictionary for all network types.
 * Keyed by `${networkType}_${variant}`.
 * The canvas reads this dictionary dynamically when rendering edges.
 */
export const NETWORK_STYLE_DICTIONARY: Record<string, NetworkStyle> = {
    // Baja Tensión
    'bt_aerial': {
        color: '#EF4444',      // Red (Coincide con círculo rojo)
        strokeWidth: 2,
        dashArray: null,       // Sólida (Coincide con línea roja continua)
        label: 'B.T. Aérea',
        glowColor: 'rgba(239, 68, 68, 0.3)',
    },
    'bt_underground': {
        color: '#22C55E',      // Green (Coincide con círculo verde)
        strokeWidth: 2,
        dashArray: [6, 4],     // Discontinua (Coincide con línea verde con espacios)
        label: 'B.T. Subterránea',
        glowColor: 'rgba(34, 197, 94, 0.3)',
    },

    // Media Tensión 11.4kV
    'mt-11_aerial': {
        color: '#3B82F6',      // Blue (Coincide con círculo azul claro)
        strokeWidth: 3,
        dashArray: null,       // Sólida (Coincide con línea azul continua)
        label: 'M.T. 11.4kV Aérea',
        glowColor: 'rgba(59, 130, 246, 0.3)',
    },
    'mt-11_underground': {
        color: '#2563EB',      // Blue (Coincide con círculo azul oscuro)
        strokeWidth: 3,
        dashArray: [8, 4],     // Discontinua (Coincide con línea azul oscuro con espacios)
        label: 'M.T. 11.4kV Subterránea',
        glowColor: 'rgba(37, 99, 235, 0.3)',
    },

    // Media Tensión 13.2kV
    'mt-13_aerial': {
        color: '#F97316',      // Orange (Coincide con círculo naranja claro)
        strokeWidth: 4,
        dashArray: null,       // Sólida (Coincide con línea naranja continua)
        label: 'M.T. 13.2kV Aérea',
        glowColor: 'rgba(249, 115, 22, 0.3)',
    },
    'mt-13_underground': {
        color: '#EA580C',      // Orange (Coincide con círculo naranja oscuro)
        strokeWidth: 4,
        dashArray: [8, 4],     // Discontinua (Coincide con línea naranja oscuro con espacios)
        label: 'M.T. 13.2kV Subterránea',
        glowColor: 'rgba(234, 88, 12, 0.3)',
    },

    // Alta Tensión 34.5kV
    'at-34_aerial': {
        color: '#A855F7',      // Purple (Coincide con círculo violeta claro)
        strokeWidth: 5,
        dashArray: null,       // Sólida (Coincide con línea violeta continua)
        label: '34.5kV Aérea',
        glowColor: 'rgba(168, 85, 247, 0.3)',
    },
    'at-34_underground': {
        color: '#7C3AED',      // Purple (Coincide con círculo violeta oscuro)
        strokeWidth: 5,
        dashArray: [10, 5],    // Discontinua (Coincide con línea violeta oscuro con espacios)
        label: '34.5kV Subterránea',
        glowColor: 'rgba(124, 58, 237, 0.3)',
    },

    // Puesta a Tierra
    'ground_underground': {
        color: '#78716C',      // Stone (Coincide con círculo gris oscuro)
        strokeWidth: 2,
        dashArray: [4, 4],     // Discontinua (Coincide con línea gris con espacios)
        label: 'Puesta a Tierra',
        glowColor: 'rgba(120, 113, 108, 0.3)',
    },
};

// ============================================
// HELPERS
// ============================================

/**
 * Build the dictionary key for a network type + variant combo.
 */
export function getStyleKey(networkType: NetworkType, variant: NetworkVariant): string {
    return `${networkType}_${variant}`;
}

/**
 * Retrieve the style for a specific network type and variant.
 * Falls back to a default style if the combination is not found.
 */
export function getNetworkStyle(networkType: NetworkType, variant: NetworkVariant): NetworkStyle {
    const key = getStyleKey(networkType, variant);
    return NETWORK_STYLE_DICTIONARY[key] ?? DEFAULT_STYLE;
}

/**
 * Default fallback style used when a network type combination is not found.
 */
const DEFAULT_STYLE: NetworkStyle = {
    color: '#6B7280',
    strokeWidth: 2,
    dashArray: null,
    label: 'Red Desconocida',
    glowColor: 'rgba(107, 114, 128, 0.3)',
};

/**
 * Get all available style keys (for UI iteration).
 */
export function getAllStyleKeys(): string[] {
    return Object.keys(NETWORK_STYLE_DICTIONARY);
}

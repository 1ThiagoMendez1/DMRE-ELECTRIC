
export interface PDFColorPalette {
    primary: [number, number, number];
    secondary: [number, number, number];
    text: [number, number, number];
    background: [number, number, number];
    accent: [number, number, number];
}

export type PDFLayoutType = 'standard' | 'modern' | 'centered' | 'sidebar' | 'technical' | 'minimal' | 'elegant' | 'bold';

export interface PDFStyleConfig {
    id: string;
    name: string;
    description: string;
    layout: PDFLayoutType;
    colors: PDFColorPalette;
    fonts: {
        header: string; // 'helvetica' | 'times' | 'courier'
        body: string;
    };
    components: {
        clientBoxStyle: 'box' | 'line' | 'clean' | 'filled';
        tableTheme: 'striped' | 'grid' | 'plain';
        headerStyle: 'bar' | 'clean' | 'logo-only' | 'full-color';
        footerStyle: 'simple' | 'branded' | 'minimal';
    };
}

// Default Presets
export const PDF_STYLES: PDFStyleConfig[] = [
    {
        id: 'corporate_classic',
        name: 'Corporativo Clásico',
        description: 'Elegante y tradicional. Encabezado limpio con línea divisoria.',
        layout: 'standard',
        colors: {
            // Navy Blue & Gold/Orange
            primary: [10, 50, 90],
            secondary: [255, 140, 0],
            text: [30, 30, 30],
            background: [255, 255, 255],
            accent: [245, 245, 245]
        },
        fonts: { header: 'helvetica', body: 'helvetica' },
        components: {
            clientBoxStyle: 'line',
            tableTheme: 'striped',
            headerStyle: 'logo-only', // Minimal header, logo + text next to it
            footerStyle: 'simple'
        }
    },
    {
        id: 'modern_banner',
        name: 'Banner Moderno',
        description: 'Encabezado de color completo para un impacto visual fuerte.',
        layout: 'bold', // Full width header background
        colors: {
            // Bright Blue & White
            primary: [0, 80, 200],
            secondary: [255, 255, 255],
            text: [40, 40, 40],
            background: [255, 255, 255],
            accent: [240, 248, 255]
        },
        fonts: { header: 'helvetica', body: 'helvetica' },
        components: {
            clientBoxStyle: 'filled',
            tableTheme: 'striped',
            headerStyle: 'full-color',
            footerStyle: 'branded'
        }
    },
    {
        id: 'executive_centered',
        name: 'Ejecutivo Centrado',
        description: 'Diseño simétrico con logo central, ideal para marcas de lujo.',
        layout: 'centered',
        colors: {
            // Slate & Red/Burgundy
            primary: [40, 40, 40],
            secondary: [180, 50, 50],
            text: [20, 20, 20],
            background: [255, 255, 255],
            accent: [250, 250, 250]
        },
        fonts: { header: 'times', body: 'times' }, // Serif
        components: {
            clientBoxStyle: 'clean',
            tableTheme: 'plain',
            headerStyle: 'clean',
            footerStyle: 'minimal'
        }
    },
    {
        id: 'technical_boxed',
        name: 'Técnico Estructurado',
        description: 'Información organizada en cajas delineadas. Alta densidad de datos.',
        layout: 'technical',
        colors: {
            // Dark Gray & Cyan
            primary: [30, 30, 30],
            secondary: [0, 150, 136],
            text: [0, 0, 0],
            background: [255, 255, 255],
            accent: [235, 235, 235]
        },
        fonts: { header: 'courier', body: 'courier' }, // Monospace
        components: {
            clientBoxStyle: 'box',
            tableTheme: 'grid',
            headerStyle: 'bar',
            footerStyle: 'simple'
        }
    },
    {
        id: 'sidebar_brand',
        name: 'Lateral Creativo',
        description: 'Barra lateral de color con información de contacto.',
        layout: 'sidebar',
        colors: {
            // Purple & Teal (or user brand)
            primary: [80, 40, 120],
            secondary: [0, 0, 0],
            text: [50, 50, 50],
            background: [255, 255, 255],
            accent: [245, 240, 255]
        },
        fonts: { header: 'helvetica', body: 'helvetica' },
        components: {
            clientBoxStyle: 'line',
            tableTheme: 'plain',
            headerStyle: 'clean',
            footerStyle: 'minimal'
        }
    },
    {
        id: 'minimal_pure',
        name: 'Minimalista Puro',
        description: 'Sin distracciones. Blanco y negro. Máxima claridad.',
        layout: 'minimal',
        colors: {
            primary: [0, 0, 0],
            secondary: [0, 0, 0],
            text: [0, 0, 0],
            background: [255, 255, 255],
            accent: [255, 255, 255]
        },
        fonts: { header: 'helvetica', body: 'helvetica' },
        components: {
            clientBoxStyle: 'clean',
            tableTheme: 'plain',
            headerStyle: 'clean',
            footerStyle: 'minimal'
        }
    },
    {
        id: 'boxed_pro',
        name: 'Bloques Pro',
        description: 'Áreas de información separadas por bloques de fondo suave.',
        layout: 'standard', // But uses specific component overrides
        colors: {
            // Blue-Grey
            primary: [55, 71, 79],
            secondary: [0, 120, 215],
            text: [60, 60, 60],
            background: [255, 255, 255],
            accent: [236, 239, 241] // Blue Grey Light
        },
        fonts: { header: 'helvetica', body: 'helvetica' },
        components: {
            clientBoxStyle: 'filled',
            tableTheme: 'striped',
            headerStyle: 'bar',
            footerStyle: 'branded'
        }
    },
    {
        id: 'elegant_border',
        name: 'Borde Elegante',
        description: 'Marco perimetral y detalles finos.',
        layout: 'standard',
        colors: {
            // Forest Green
            primary: [20, 80, 40],
            secondary: [200, 160, 50], // Gold
            text: [20, 20, 20],
            background: [255, 255, 255],
            accent: [250, 250, 240]
        },
        fonts: { header: 'times', body: 'times' },
        components: {
            clientBoxStyle: 'clean',
            tableTheme: 'plain',
            headerStyle: 'bar',
            footerStyle: 'branded'
        }
    }
];

export const getStyleById = (id: string): PDFStyleConfig => {
    return PDF_STYLES.find(s => s.id === id) || PDF_STYLES[0];
};

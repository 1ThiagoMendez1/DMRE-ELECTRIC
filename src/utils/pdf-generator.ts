
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cotizacion } from '@/types/sistema';
import { MaterialVisibilityMode } from '@/components/erp/trabajo-history-dialog';
import { PDFStyleConfig, PDF_STYLES } from './pdf-styles';

export interface CompanyInfo {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    email: string;
    descripcion: string;
}

export const COMPANY_INFO: CompanyInfo = {
    nombre: "DMRE",
    nit: "1075652553-9",
    direccion: "CARRERA 4 N° 5 -122 INT 2 BARANDILLAS, Zipaquirá, Cundinamarca",
    telefono: "CEL: 3115368577 - 3124074257 | TEL: 8816064",
    email: "info@dmre.com.co",
    descripcion: "Diseño y Montajes de Redes Eléctricas"
};

export interface PrivadoOptions {
    suministros: string;
    instalacion: string;
    servicios: string;
}

export const generateQuotePDF = (
    cotizacion: Cotizacion,
    materialVisibilityMode: MaterialVisibilityMode = 'MOSTRAR_TODO',
    companyInfo: CompanyInfo = COMPANY_INFO,
    selectedStyle?: PDFStyleConfig,
    action: 'save' | 'bloburl' | 'dataurlstring' = 'save',
    preparedBy?: string,
    watermarkText?: string,
    privadoOptions?: PrivadoOptions
) => {
    // 1. Setup Style & Document
    const style = selectedStyle || PDF_STYLES[0];
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Force white background for the entire page to avoid transparency or dark mode issues
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Default formatting
    const currencyFmt = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // Unpack Colors
    const { primary, secondary, text, background, accent } = style.colors;

    // Set Base Font
    doc.setFont(style.fonts.body);

    // Default company info
    const company = companyInfo;

    // --- LAYOUT LOGIC ---
    // We define coordinate baselines based on layout type

    let contentStartX = 14;
    let contentWidth = pageWidth - 28;
    let currentY = 0;

    // --- 1. HEADER & BACKGROUNDS ---

    // A. SIDEBAR LAYOUT
    if (style.layout === 'sidebar') {
        // Draw Sidebar
        doc.setFillColor(...primary);
        doc.rect(0, 0, 65, pageHeight, 'F');

        contentStartX = 75; // Shift content right
        contentWidth = pageWidth - 75 - 14;

        // Valid for "Creativo" / "Lateral"
        // Logo in sidebar
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            doc.addImage(logoImg, 'PNG', 10, 8, 55, 55);
        } catch (e) { }

        // Company Details in sidebar (White text)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(style.fonts.header, 'bold');

        // Split name if long
        const nameLines = doc.splitTextToSize(company.nombre, 55);
        doc.text(nameLines, 32, 65, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(`NIT: ${company.nit}`, 32, 80, { align: 'center' });

        doc.setFontSize(8);
        const addressLines = doc.splitTextToSize(company.direccion, 50);
        doc.text(addressLines, 32, 90, { align: 'center' });
        doc.text(company.telefono, 32, 105, { align: 'center' });
        doc.text(company.email, 32, 110, { align: 'center' });

        currentY = 20; // Top of main content area
    }

    // B. BOLD LAYOUT (Full Banner)
    else if (style.layout === 'bold') {
        // Full width header
        doc.setFillColor(...primary);
        doc.rect(0, 0, pageWidth, 55, 'F');

        // Logo Left
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            doc.addImage(logoImg, 'PNG', 12, 5, 50, 50);
        } catch (e) { }

        // Company Text White
        doc.setTextColor(255, 255, 255);
        doc.setFont(style.fonts.header, 'bold');
        doc.setFontSize(24);
        doc.text(company.nombre, 50, 25);

        doc.setFontSize(10);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(company.descripcion, 50, 32);

        // Right Side Info (White)
        doc.setFontSize(9);
        doc.text(`NIT: ${company.nit}`, pageWidth - 14, 20, { align: 'right' });
        doc.text(company.direccion, pageWidth - 14, 25, { align: 'right' });
        doc.text(`${company.telefono} | ${company.email}`, pageWidth - 14, 30, { align: 'right' });

        currentY = 70;
    }

    // C. CENTERED LAYOUT
    else if (style.layout === 'centered') {
        // Logo Center
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            const logoX = (pageWidth - 55) / 2;
            doc.addImage(logoImg, 'PNG', logoX, 5, 55, 55);
        } catch (e) { }

        doc.setTextColor(...primary);
        doc.setFont(style.fonts.header, 'bold');
        doc.setFontSize(22);
        doc.text(company.nombre, pageWidth / 2, 55, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text);
        doc.text(company.nit, pageWidth / 2, 62, { align: 'center' });
        doc.text(`${company.direccion} • ${company.telefono}`, pageWidth / 2, 67, { align: 'center' }); // Bullet separator

        currentY = 80;
    }
    // E. MINIMAL (Structured Order of Purchase Style)
    else if (style.layout === 'minimal') {
        const primaryColor = [0, 0, 0] as [number, number, number]; // Black for this strict style

        // 1. Top Left Box (Document Type & Number)
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);

        // Outer Box
        doc.roundedRect(14, 15, 60, 16, 1, 1);
        // Header fill inside the box
        doc.setFillColor(220, 220, 220); // Light gray
        doc.roundedRect(14, 15, 60, 8, 1, 1, 'F');
        // Redraw top border over fill
        doc.roundedRect(14, 15, 60, 16, 1, 1, 'S');
        // Separator line
        doc.line(14, 23, 74, 23);

        doc.setTextColor(...primaryColor);
        doc.setFontSize(10);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("COTIZACIÓN", 44, 20.5, { align: 'center' });

        doc.setFontSize(11);
        doc.text(`No. ${cotizacion.numero}`, 44, 29, { align: 'center' });

        // 2. Top Center (Company Info)
        doc.setFontSize(10);
        doc.text(company.nombre, pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(`NIT: ${company.nit}`, pageWidth / 2, 23, { align: 'center' });
        doc.text(company.direccion, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Tel: ${company.telefono}`, pageWidth / 2, 33, { align: 'center' });
        doc.text(company.email, pageWidth / 2, 38, { align: 'center' });

        // 3. Top Right (Logo)
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            doc.addImage(logoImg, 'PNG', pageWidth - 50, 8, 40, 40);
        } catch (e) { }

        // Below the logo text
        doc.setFontSize(8);
        doc.setFont(style.fonts.header, 'bold');
        doc.text(company.descripcion, pageWidth - 35, 34, { align: 'center' });

        currentY = 48; // Ready for boxes
    }

    // F. OFFICIAL GRID LAYOUT (Technical Header with Metadata)
    else if (style.layout === 'official_grid') {
        const primaryColor = style.colors.primary;

        // Draw Outer Frame for Header
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(14, 12, pageWidth - 28, 28); // Header box

        // 1. Logo Left
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            doc.addImage(logoImg, 'PNG', 13, 10, 32, 32);
        } catch (e) { }

        // 2. Company Name Center
        doc.setTextColor(...primaryColor);
        doc.setFontSize(18);
        doc.setFont('times', 'bold');
        doc.text("DISEÑO Y MONTAJE DE REDES", pageWidth / 2 + 5, 18.5, { align: 'center' });
        doc.text("ELÉCTRICAS D.M.R.E", pageWidth / 2 + 5, 24.5, { align: 'center' });

        doc.setFontSize(9);
        doc.text("NIT: 1075652753", pageWidth / 2 + 5, 28.5, { align: 'center' });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text("gramirez.dmre@gmail.com", pageWidth / 2 + 5, 31.5, { align: 'center' });
        doc.text("Tel: (1)8816064  Cel: 311 536 8577", pageWidth / 2 + 5, 34.5, { align: 'center' });
        doc.text("www.dmreingenieria.com", pageWidth / 2 + 5, 37.5, { align: 'center' });

        // 3. Metadata Right
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("SGI-DMRE-0818", pageWidth - 16, 18, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("2/02/2020", pageWidth - 16, 27, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text("Versión 2.1", pageWidth - 16, 36, { align: 'right' });

        currentY = 40;
    }

    // D. STANDARD & TECHNICAL (Left Align)
    else {
        // Optional top bar
        if (style.components.headerStyle === 'bar') {
            doc.setFillColor(...primary);
            doc.rect(0, 0, pageWidth, 5, 'F');
        }

        // Logo
        try {
            const logoImg = new Image();
            logoImg.src = '/logo.png';
            doc.addImage(logoImg, 'PNG', 10, 8, 45, 45);
        } catch (e) { }

        doc.setTextColor(...primary);
        doc.setFont(style.fonts.header, 'bold');
        doc.setFontSize(20);
        doc.text(company.nombre, 45, 22);

        doc.setFontSize(10);
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text);
        doc.text(company.descripcion, 45, 28);

        // Contact Block
        doc.setFontSize(9);
        doc.setTextColor(...text); // Use black text
        doc.text(`NIT: ${company.nit}`, 45, 34);
        doc.text(`${company.direccion}`, 45, 39);
        doc.text(`${company.telefono} | ${company.email}`, 45, 44);

        currentY = 55;
    }


    // --- 2. QUOTE TITLE BOX ---

    // We calculate position based on layout
    let titleY = currentY;

    // In Standard layout, title is often top right
    if (style.layout === 'standard' || style.layout === 'technical') {
        // Floating box top right
        const boxX = pageWidth - 80;
        const boxY = 15;

        // Boxed Standard
        doc.setDrawColor(...accent);
        doc.setFillColor(255, 255, 255);
        if (style.components.clientBoxStyle === 'box') {
            doc.roundedRect(boxX, boxY, 66, 30, 2, 2, 'FD');
        } else {
            // Just fill
            // doc.rect(...)
        }

        doc.setFontSize(14);
        doc.setFont(style.fonts.header, 'bold');
        doc.setTextColor(...primary);
        doc.text("COTIZACIÓN", boxX + 33, boxY + 8, { align: 'center' });

        doc.setTextColor(...secondary); // Use selected secondary color instead of hardcoded red
        doc.text(`${cotizacion.numero}`, boxX + 33, boxY + 16, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text); // Use black text
        doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd/MM/yyyy")}`, boxX + 33, boxY + 22, { align: 'center' });
        doc.text(`Vence: ${format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")}`, boxX + 33, boxY + 27, { align: 'center' });
    }
    // Minimal layout does not need this secondary title box
    else if (style.layout === 'minimal') {
        // Title was already drawn in the header
    }
    // In Bold layout, title box overlaps header
    else if (style.layout === 'bold') {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...accent);
        doc.rect(pageWidth - 85, 40, 70, 25, 'FD'); // Overlapping banner

        doc.setFontSize(14);
        doc.setFont(style.fonts.header, 'bold');
        doc.setTextColor(...primary);
        doc.text(`# ${cotizacion.numero}`, pageWidth - 50, 60, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text);
        doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd/MM/yyyy")}`, pageWidth - 50, 66, { align: 'center' });
        doc.text(`Vence: ${format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd/MM/yyyy")}`, pageWidth - 50, 71, { align: 'center' });
    }
    // Centered layout
    else if (style.layout === 'centered') {
        doc.setDrawColor(...secondary);
        doc.line(70, currentY, pageWidth - 70, currentY); // Divider
        currentY += 10;
        doc.setFontSize(14);
        doc.setTextColor(...secondary);
        doc.text(`COTIZACIÓN # ${cotizacion.numero}`, pageWidth / 2, currentY, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(...text);
        doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd MMMM yyyy", { locale: es })} | Vence: ${format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd MMMM yyyy", { locale: es })}`, pageWidth / 2, currentY + 6, { align: 'center' });
        currentY += 15;
    }
    // Sidebar layout - COTIZACIÓN title on the right side of main content
    else if (style.layout === 'sidebar') {
        doc.setFontSize(16);
        doc.setFont(style.fonts.header, 'bold');
        doc.setTextColor(...primary);
        doc.text("COTIZACIÓN", contentStartX + contentWidth, 25, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(...secondary);
        doc.text(cotizacion.numero, contentStartX + contentWidth, 33, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text);
        doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd MMMM yyyy", { locale: es })}`, contentStartX + contentWidth, 39, { align: 'right' });
        doc.text(`Vence: ${format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd MMMM yyyy", { locale: es })}`, contentStartX + contentWidth, 44, { align: 'right' });
    }


    // --- 3. CLIENT INFO SECTION ---

    // Sidebar layout: Client info is main content top
    // Standard layout: Client info is below header

    const clientBoxY = currentY > 0 ? currentY + 5 : 60; // fallback

    // Override specifically for the Official Grid layout: Skip standard boxes as it has its own grid later
    if (style.layout === 'official_grid') {
        // Do nothing here, the grid handles it
    }
    // Override specifically for the minimal "Order of Purchase" layout
    else if (style.layout === 'minimal') {
        const leftBoxWidth = 85;
        const rightBoxWidth = 85;
        const boxHeight = 28;
        const gap = 12;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        // LEFT BOX (Dates & Roles)
        doc.roundedRect(14, currentY, leftBoxWidth, boxHeight, 2, 2);

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Fecha:", 16, currentY + 6);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(format(new Date(cotizacion.fecha), "dd/MM/yyyy"), 35, currentY + 6);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Vence:", 16, currentY + 11);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd/MM/yyyy"), 35, currentY + 11);

        if (cotizacion.estado) {
            doc.setFont(style.fonts.header, 'bold');
            doc.text("Estado:", 16, currentY + 16);
            doc.setFont(style.fonts.body, 'normal');
            doc.text(cotizacion.estado, 35, currentY + 16);
        }

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Oferta:", 16, currentY + 21);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(cotizacion.tipo === 'NORMAL' ? 'Normal' : 'Simplificada', 35, currentY + 21);



        // RIGHT BOX (Client Info)
        const rightBoxX = 14 + leftBoxWidth + gap;
        doc.roundedRect(rightBoxX, currentY, rightBoxWidth, boxHeight, 2, 2);

        // Overlapping Title
        doc.setFillColor(255, 255, 255);
        doc.rect(rightBoxX + 10, currentY - 2, 35, 4, 'F'); // Mask line
        doc.setFont(style.fonts.header, 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 50, 100); // Brand color for title
        doc.text("COTIZACIÓN DE SERVICIO", rightBoxX + 12, currentY + 1);

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text("Cliente", rightBoxX + 2, currentY + 6);

        // Split data inside right box
        doc.setFontSize(7.5);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Cliente:", rightBoxX + 2, currentY + 11);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(cotizacion.cliente.nombre, rightBoxX + 20, currentY + 11);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("NIT/CC:", rightBoxX + 2, currentY + 15);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(cotizacion.cliente.documento, rightBoxX + 20, currentY + 15);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Dirección:", rightBoxX + 2, currentY + 19);
        doc.setFont(style.fonts.body, 'normal');
        // Truncate address if too long
        let addr = cotizacion.cliente.direccion || "";
        if (addr.length > 40) addr = addr.substring(0, 40) + "...";
        doc.text(addr, rightBoxX + 20, currentY + 19);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Teléfono:", rightBoxX + 2, currentY + 23);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(cotizacion.cliente.telefono || "", rightBoxX + 20, currentY + 23);

        doc.setFont(style.fonts.header, 'bold');
        doc.text("Email:", rightBoxX + 2, currentY + 27);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(cotizacion.cliente.correo || "", rightBoxX + 20, currentY + 27);

        currentY += boxHeight;
    }
    // Existing Client Box Styles for other layouts
    else if (style.components.clientBoxStyle === 'filled') {
        // Gray background block - increased height for all info
        doc.setFillColor(...accent);
        doc.rect(contentStartX, clientBoxY, contentWidth, 35, 'F');

        // Label block with better contrast
        doc.setTextColor(...secondary);
        doc.setFontSize(10);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("CLIENTE:", contentStartX + 5, clientBoxY + 8);

        doc.setTextColor(...text);
        doc.setFontSize(10);
        doc.setFont(style.fonts.body, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX + 5, clientBoxY + 15);

        doc.setFont(style.fonts.body, 'normal');
        doc.setFontSize(9);
        doc.text(`NIT/CC: ${cotizacion.cliente.documento}`, contentStartX + 5, clientBoxY + 21);
        doc.text(`Dirección: ${cotizacion.cliente.direccion}`, contentStartX + 5, clientBoxY + 27);

        // Right side of box
        doc.text(`Contacto: ${cotizacion.cliente.telefono || ''}`, contentStartX + contentWidth / 2, clientBoxY + 15);

        currentY = clientBoxY + 42;
    }
    else if (style.components.clientBoxStyle === 'box') {
        // Outlined box - increased height
        doc.setDrawColor(...secondary);
        doc.roundedRect(contentStartX, clientBoxY, contentWidth, 35, 1, 1);

        doc.setTextColor(...secondary);
        doc.setFontSize(8);
        doc.text("CLIENTE:", contentStartX + 4, clientBoxY + 6);

        doc.setTextColor(...text);
        doc.setFontSize(11);
        doc.setFont(style.fonts.header, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX + 4, clientBoxY + 13);

        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(`NIT/CC: ${cotizacion.cliente.documento}`, contentStartX + 4, clientBoxY + 19);
        doc.text(`Dirección: ${cotizacion.cliente.direccion}`, contentStartX + 4, clientBoxY + 25);

        // Right side info
        doc.text(`Contacto: ${cotizacion.cliente.telefono || ''}`, contentStartX + contentWidth / 2, clientBoxY + 19);

        currentY = clientBoxY + 42;
    }
    else {
        // Clean / Line style
        if (style.components.clientBoxStyle === 'line') {
            doc.setDrawColor(...primary);
            doc.line(contentStartX, clientBoxY, contentStartX + contentWidth, clientBoxY);
            currentY = clientBoxY + 5;
        } else {
            currentY = clientBoxY;
        }

        doc.setFontSize(9);
        doc.setTextColor(...secondary);
        doc.text("CLIENTE:", contentStartX, currentY + 5);

        doc.setFontSize(11);
        doc.setTextColor(...text);
        doc.setFont(style.fonts.body, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX, currentY + 11);

        doc.setFont(style.fonts.body, 'normal');
        doc.setFontSize(9);
        doc.text(`NIT/CC: ${cotizacion.cliente.documento}`, contentStartX, currentY + 17);
        doc.text(`Dirección: ${cotizacion.cliente.direccion}`, contentStartX, currentY + 22);

        // Contact info on the right
        doc.text(`Contacto: ${cotizacion.cliente.telefono || ''}`, contentStartX + contentWidth / 2, currentY + 17);

        currentY += 30;
    }

    // Override specifically for the Official Grid layout (Detailed metadata table)
    if (style.layout === 'official_grid') {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);

        const gridStartX = 14;
        const gridWidth = pageWidth - 28;
        const leftColW = gridWidth * 0.55; // Left column for client info
        const rightColW = gridWidth - leftColW; // Right column for meta info
        const labelW = 30; // Increased label width to avoid overlap

        const startY = currentY;

        // Calculate dynamic heights for left rows
        doc.setFontSize(8);
        const getRequiredHeight = (text: string) => {
            const lines = doc.splitTextToSize(text || "", leftColW - labelW - 4).length;
            return Math.max(6, lines * 3.5 + 2.5);
        };

        const h1 = getRequiredHeight(cotizacion.cliente.nombre);
        const h2 = getRequiredHeight(cotizacion.cliente.documento);
        const h3 = getRequiredHeight(cotizacion.cliente.direccion);
        const h4 = getRequiredHeight(cotizacion.cliente.correo);
        const h5 = getRequiredHeight(cotizacion.cliente.telefono);

        const rowY1 = startY;
        const rowY2 = startY + h1;
        const rowY3 = startY + h1 + h2;
        const rowY4 = startY + h1 + h2 + h3;
        const rowY5 = startY + h1 + h2 + h3 + h4;
        const bottomY = startY + h1 + h2 + h3 + h4 + h5;

        // Helper to draw a cell
        const drawCell = (x: number, y: number, w: number, h: number, label: string, value: string, fontStyle: 'bold' | 'normal' | 'italic' | 'bolditalic' = 'normal', fontSize: number = 8, textColor: [number, number, number] = [0, 0, 0], valXOffset: number = labelW) => {
            doc.setDrawColor(0, 0, 0);
            doc.rect(x, y, w, h);

            // Vertical separator line
            doc.line(x + valXOffset, y, x + valXOffset, y + h);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(label, x + 2, y + h/2 + 1.2);

            doc.setFont('helvetica', fontStyle);
            doc.setFontSize(fontSize);
            doc.setTextColor(...textColor);

            // Draw value
            const valX = x + valXOffset;
            const valText = doc.splitTextToSize(value || "", w - valXOffset - 4);
            const textY = y + (h - (valText.length * 3.5)) / 2 + 2.8;
            doc.text(valText, valX + 2, textY);
        };

        // --- LEFT SIDE: CLIENT INFO (5 Rows) ---
        drawCell(gridStartX, rowY1, leftColW, h1, "Cliente", cotizacion.cliente.nombre);
        drawCell(gridStartX, rowY2, leftColW, h2, "C.C / NIT", cotizacion.cliente.documento);
        drawCell(gridStartX, rowY3, leftColW, h3, "Dirección", cotizacion.cliente.direccion);
        drawCell(gridStartX, rowY4, leftColW, h4, "E-mail", cotizacion.cliente.correo);
        drawCell(gridStartX, rowY5, leftColW, h5, "Teléfono", cotizacion.cliente.telefono);

        // --- RIGHT SIDE: META INFO (3 Rows + Offer Number) ---
        const rightX = gridStartX + leftColW;
        // Row 1: Elaborado por
        drawCell(rightX, rowY1, rightColW, h1, "Elaborado por", preparedBy || "José Gabriel Ramirez Bernal", 'italic', 8, [0, 0, 0], 30);

        // Row 2: Fecha de cotización
        drawCell(rightX, rowY2, rightColW, h2, "Fecha Cotización", format(new Date(cotizacion.fecha), "dd/MM/yyyy"));

        // Row 3: Fecha de vencimiento
        drawCell(rightX, rowY3, rightColW, h3, "Fecha Vencimiento", format(cotizacion.fechaValidez ? new Date(cotizacion.fechaValidez) : new Date(new Date(cotizacion.fecha).getTime() + 15 * 24 * 60 * 60 * 1000), "dd/MM/yyyy"));

        // Row 4-5: NÚMERO DE OFERTA (Large Box)
        const offerBoxH = h4 + h5;
        doc.rect(rightX, rowY4, rightColW, offerBoxH);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text("NÚMERO DE OFERTA", rightX + rightColW / 2, rowY4 + offerBoxH/2 - 2, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bolditalic');
        doc.setTextColor(200, 40, 40); // Red
        doc.text(cotizacion.numero, rightX + rightColW / 2, rowY4 + offerBoxH/2 + 4, { align: 'center' });

        // --- BOTTOM: TRABAJO A REALIZAR (Spanning Full Width) ---
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const workLines = doc.splitTextToSize((cotizacion.descripcionTrabajo || "").toUpperCase(), gridWidth - 30);
        const trabajoH = Math.max(12, workLines.length * 3.5 + 4); // standard 2 rows or dynamic
        
        doc.rect(gridStartX, bottomY, 25, trabajoH); // Label box
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("Trabajo a", gridStartX + 12.5, bottomY + trabajoH/2 - 2, { align: 'center' });
        doc.text("realizar", gridStartX + 12.5, bottomY + trabajoH/2 + 2, { align: 'center' });

        doc.rect(gridStartX + 25, bottomY, gridWidth - 25, trabajoH); // Value box
        doc.setFont('helvetica', 'normal');
        const workY = bottomY + (trabajoH - (workLines.length * 3.5)) / 2 + 2.8;
        doc.text(workLines, gridStartX + 27, workY);

        currentY = bottomY + trabajoH + 10;
    }


    // --- 4. DESCRIPTION ---
    if (style.layout !== 'official_grid') {
        currentY += 3; // Extra spacing before description

        doc.setFontSize(10);
        doc.setFont(style.fonts.header, 'bold');
        doc.setTextColor(...primary);
        doc.text("DESCRIPCIÓN TRABAJO:", contentStartX, currentY);

        // Place description text BELOW the label (not beside it)
        currentY += 6;
        doc.setFont(style.fonts.body, 'normal');
        doc.setTextColor(...text);
        doc.setFontSize(10);
        const splitDesc = doc.splitTextToSize(cotizacion.descripcionTrabajo || "", contentWidth);
        doc.text(splitDesc, contentStartX + 1, currentY);

        currentY += (splitDesc.length * 5) + 8;
    }


    // --- 5. ITEMS TABLE ---

    // Prepare Data
    const tableBody: any[] = [];
    
    // Calculate category sums for Private Mode
    let sumSuministros = 0;
    let sumInstalaciones = 0;
    let sumServicios = 0;
    
    const setS = new Set<string>();
    const setI = new Set<string>();
    const setServ = new Set<string>();

    cotizacion.items.forEach(item => {
        const desc = item.descripcion.toUpperCase();
        const base = item.valorUnitario + (item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0);
        const total = item.cantidad * base;
        
        const code = item.codigoItem || item.notas;
        
        const isInstalacion = desc.includes('INSTALACIÓN') || desc.includes('INSTALACION') || desc.includes('IN-');
        const isServicio = item.tipo === 'SERVICIO' && !isInstalacion && !item.codigoTrabajoId;

        if (isInstalacion) {
            sumInstalaciones += total;
            if (code) setI.add(code);
        } else if (isServicio) {
            sumServicios += total;
            if (code) setServ.add(code);
        } else {
            // Suministros, productos sueltos, materiales y APUs
            sumSuministros += total;
            if (code) setS.add(code);
        }
    });
    
    const codesS = Array.from(setS).join(', ') || '1';
    const codesI = Array.from(setI).join(', ') || '2';
    const codesServ = Array.from(setServ).join(', ') || '3';
    
    if (materialVisibilityMode === 'MODO_PRIVADO') {
        // En Modo Privado reemplazamos la tabla de ítems por las 3 filas customizadas, siempre visibles
        tableBody.push([
            1,
            `Suministros: ${privadoOptions?.suministros || ''}`,
            sumSuministros > 0 ? "1" : "-",
            "GLB",
            sumSuministros > 0 ? currencyFmt.format(sumSuministros) : "-",
            sumSuministros > 0 ? currencyFmt.format(sumSuministros) : "-"
        ]);
        tableBody.push([
            2,
            `Instalación: ${privadoOptions?.instalacion || ''}`,
            sumInstalaciones > 0 ? "1" : "-",
            "GLB",
            sumInstalaciones > 0 ? currencyFmt.format(sumInstalaciones) : "-",
            sumInstalaciones > 0 ? currencyFmt.format(sumInstalaciones) : "-"
        ]);
        tableBody.push([
            3,
            `Servicios: ${privadoOptions?.servicios || ''}`,
            sumServicios > 0 ? "1" : "-",
            "GLB",
            sumServicios > 0 ? currencyFmt.format(sumServicios) : "-",
            sumServicios > 0 ? currencyFmt.format(sumServicios) : "-"
        ]);
    } else if (materialVisibilityMode === 'OCULTAR_TODO') {
        // En Ocultar Todo solo mostramos un total globalizado
        tableBody.push([
            1,
            cotizacion.descripcionTrabajo,
            "1",
            "GLB",
            currencyFmt.format(cotizacion.subtotal),
            currencyFmt.format(cotizacion.subtotal)
        ]);
    } else {
        // MOSTRAR_TODO normal behavior
        cotizacion.items.forEach((item, index) => {
            const isProduct = item.tipo === 'PRODUCTO';
            const isService = item.tipo === 'SERVICIO';
            
            // Calculate unit value including the specific item percentage (margin)
            const unitValue = item.valorUnitario + (item.porcentaje ? item.valorUnitario * (item.porcentaje / 100) : 0);
            const itemCode = item.codigoItem || item.notas || (index + 1).toString();

            tableBody.push([
                itemCode,
                item.descripcion.replace(/INSTALACIONES:/gi, 'Instalación:'),
                item.cantidad.toString(),
                "UND",
                currencyFmt.format(unitValue),
                currencyFmt.format(item.valorTotal)
            ]);

            // Add sub-items for Work Codes (APUs)
            if (isService && item.subItems && item.subItems.length > 0 && !item.ocultarDetalles) {
                item.subItems.forEach((sub) => {
                    const totalSubQty = (sub.cantidad || 0) * item.cantidad;
                    tableBody.push([
                        "", // Empty index for sub-items
                        `      ↳ ${(sub as any).nombre || (sub as any).descripcion}`, // Indented with arrow
                        totalSubQty,
                        "UND",
                        "", // Don't show individual costs for sub-items
                        ""  // Total is included in parent item
                    ]);
                });
            }
        });
    }

    // Minimal Style Table Config override
    const isMinimal = style.layout === 'minimal';

    // Add additional headers config based on minimal layout
    let headHeaders = ["Descripción", "U.M.", "Cantidad", "Precio unitario", "Descuentos", "Impuestos", "Valor total"];
    if (!isMinimal) {
        headHeaders = ["#", "DESCRIPCIÓN", "CANT", "UNIDAD", "VALOR UNIT.", "TOTAL"];
    }

    const customTableBody = tableBody.map((row) => {
        if (isMinimal) {
            // Re-order and pad with 0s for missing features
            const desc = row[1];
            const qty = row[2];
            const unit = row[3];
            const unitPrice = row[4];
            const total = row[5];
            return [desc, unit, qty, unitPrice, "$0", "$0", total];
        }
        return row;
    });

    autoTable(doc, {
        startY: currentY,
        head: [headHeaders],
        body: customTableBody,
        theme: isMinimal ? 'grid' : (style.components.tableTheme === 'plain' ? 'plain' : (style.components.tableTheme === 'grid' ? 'grid' : 'striped')),
        styles: {
            font: style.fonts.body,
            fontSize: isMinimal ? 7 : 9,
            cellPadding: 4,
            textColor: [40, 40, 40],
            lineColor: [40, 40, 40],
            lineWidth: isMinimal ? 0.3 : 0.1
        },
        headStyles: {
            fillColor: isMinimal ? [230, 230, 230] : (style.components.tableTheme === 'plain' ? [255, 255, 255] : primary),
            textColor: isMinimal ? [0, 0, 0] : (style.components.tableTheme === 'plain' ? primary : [255, 255, 255]),
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: isMinimal ? 0.3 : (style.components.tableTheme === 'plain' ? 0 : 0.1),
            lineColor: [40, 40, 40]
        },
        columnStyles: isMinimal ? {
            0: { cellWidth: 70, halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right', fontStyle: 'bold' }
        } : {
            0: { cellWidth: 22, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: contentStartX, right: pageWidth - (contentStartX + contentWidth) },
        alternateRowStyles: {
            fillColor: style.components.tableTheme === 'striped' ? accent : [255, 255, 255]
        },
        // Ensure black text in table even in dark mode (though we forced white bg)
        bodyStyles: {
            textColor: [0, 0, 0]
        }
    });

    // --- 6. TOTALS & FOOTER ---

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Validate if there's enough space for totals block before rendering
    if (finalY > pageHeight - 65) {
        doc.addPage();
        finalY = 20;
    }

    const totalsX = contentStartX + contentWidth - 60; // Right aligned in content area

    // Divider
    doc.setDrawColor(200);
    doc.line(totalsX, finalY - 2, contentStartX + contentWidth, finalY - 2);

    doc.setFontSize(10);

    // Subtotal
    doc.setTextColor(...text);

    // Check if AIU is present
    const hasAiu = (cotizacion.aiuAdmin || 0) > 0 || (cotizacion.aiuImprevistos || 0) > 0 || (cotizacion.aiuUtilidad || 0) > 0;

    let currentTotalsY = finalY + 4;
    const lineSpacing = 5;

    // IF MINIMAL: Draw Notes Bottom Box & Totals Bottom Box side by side
    if (isMinimal) {
        currentTotalsY = finalY + 5;

        // Notes Box
        const notesWidth = contentWidth - 85;
        doc.roundedRect(contentStartX, currentTotalsY, notesWidth, 34, 1, 1);
        doc.setFillColor(255, 255, 255);
        doc.rect(contentStartX + 8, currentTotalsY - 2, 12, 4, 'F');
        doc.setFontSize(9);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("Notas", contentStartX + 10, currentTotalsY + 1);

        doc.setFontSize(7.5);
        doc.setFont(style.fonts.body, 'normal');
        const notesLines = doc.splitTextToSize(cotizacion.descripcionTrabajo || "Sin notas adicionales", notesWidth - 4);
        doc.text(notesLines, contentStartX + 2, currentTotalsY + 6);


        // Totals Box
        const totalsBoxX = contentStartX + notesWidth + 5;
        const tbWidth = 80;
        doc.roundedRect(totalsBoxX, currentTotalsY, tbWidth, 34, 1, 1);
        doc.setFillColor(255, 255, 255);
        doc.rect(totalsBoxX + 6, currentTotalsY - 2, 15, 4, 'F');
        doc.setFontSize(9);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("Totales", totalsBoxX + 8, currentTotalsY + 1);

        doc.setFontSize(8);
        doc.setFont(style.fonts.body, 'normal');
        let tY = currentTotalsY + 6;

        doc.text("Total bruto", totalsBoxX + 2, tY);
        doc.text(currencyFmt.format(cotizacion.subtotal), totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        tY += 4.5;
        doc.text("Dscto por línea", totalsBoxX + 2, tY);
        doc.text("$0", totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        tY += 4.5;
        doc.text("Dscto global", totalsBoxX + 2, tY);
        doc.text(cotizacion.descuentoGlobal ? currencyFmt.format(cotizacion.descuentoGlobal) : "$0", totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        tY += 4.5;
        doc.text("Subtotal", totalsBoxX + 2, tY);
        doc.text(currencyFmt.format(cotizacion.subtotal - (cotizacion.descuentoGlobal || 0)), totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        tY += 4.5;
        doc.text("Vlr. Impuestos", totalsBoxX + 2, tY);
        doc.text(currencyFmt.format(cotizacion.iva), totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        tY += 6;
        doc.setFontSize(9);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("Total", totalsBoxX + 2, tY);
        doc.text(currencyFmt.format(cotizacion.total), totalsBoxX + tbWidth - 2, tY, { align: 'right' });

        currentTotalsY += 45; // Move down for footer

    } else {
        // STANDARD TOTALS RENDERER
        // Synchronized with UI: Subtotal -> Discount -> Subtotal w/ Discount -> Taxes/AIU -> Total

        doc.setFont(style.fonts.body, 'normal');
        doc.text("Subtotal:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.subtotal), contentStartX + contentWidth, currentTotalsY, { align: "right" });

        if (cotizacion.descuentoGlobal && cotizacion.descuentoGlobal > 0) {
            currentTotalsY += lineSpacing;
            doc.setTextColor(220, 38, 38);
            doc.text(`Descuento (${cotizacion.descuentoGlobalPorcentaje}%):`, totalsX, currentTotalsY);
            doc.text("-" + currencyFmt.format(cotizacion.descuentoGlobal), contentStartX + contentWidth, currentTotalsY, { align: "right" });
            doc.setTextColor(...text);

            currentTotalsY += lineSpacing;
            doc.setFont(style.fonts.body, 'bold');
            doc.text("Subt. c/ descuento:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.subtotal - cotizacion.descuentoGlobal), contentStartX + contentWidth, currentTotalsY, { align: "right" });
            doc.setFont(style.fonts.body, 'normal');
        }

        if (hasAiu) {
            currentTotalsY += lineSpacing;
            doc.text("Administración:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.aiuAdmin || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

            currentTotalsY += lineSpacing;
            doc.text("Imprevistos:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.aiuImprevistos || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

            currentTotalsY += lineSpacing;
            doc.text("Utilidad:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.aiuUtilidad || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

            currentTotalsY += lineSpacing;
            doc.text("IVA s/ Utilidad:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.iva || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });
        } else {
            currentTotalsY += lineSpacing;
            // Normal IVA
            doc.text("IVA (19%):", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.iva), contentStartX + contentWidth, currentTotalsY, { align: "right" });
        }

        // GRAND TOTAL
        doc.setFontSize(12);
        doc.setFont(style.fonts.header, 'bold');

        currentTotalsY += lineSpacing + 2;

        // Colored Box for Total if Bold style
        if (style.layout === 'bold') {
            doc.setFillColor(...secondary);
            doc.rect(totalsX - 5, currentTotalsY - 8, contentStartX + contentWidth - (totalsX - 5), 11, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text("TOTAL:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, currentTotalsY, { align: "right" });
        } else {
            doc.setTextColor(...primary);
            doc.text("TOTAL:", totalsX, currentTotalsY);
            doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, currentTotalsY, { align: "right" });
        }
        doc.setTextColor(...text);
        currentTotalsY += 12;
    }

    // --- 7. EXTERNAL COMMERCIAL TERMS BLOCK ---
    // Drawn at the bottom of the document, calculating remaining space or adding a new page if necessary

    // We need approx 40 units of height for the commercial terms block
    if (currentTotalsY > pageHeight - 60) {
        doc.addPage();
        currentTotalsY = 20;
    } else {
        currentTotalsY += 5; // Little gap after totals
    }

    // Determine values to print
    const alcanceText = cotizacion.alcance || 'Todos los ítems consignados en esta oferta se ciñen a los criterios y parámetros técnicos vigentes.';
    const formaPagoText = cotizacion.formaPago || 'A convenir.';
    const notaFinalText = cotizacion.notaFinal || 'Documento generado automáticamente. Válido por 30 días.';

    // Left Column (Alcance)
    const termsLeftWidth = contentWidth * 0.65;
    const termsRightWidth = contentWidth * 0.35;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    const titleWidth = 20; // Width for the bold labels 'ALCANCE:'

    // Split texts to calculate heights
    doc.setFontSize(8);
    doc.setFont(style.fonts.body, 'normal');
    // We leave space for the 'ALCANCE:' label on the left
    const alcanceLines = doc.splitTextToSize(alcanceText, termsLeftWidth - titleWidth - 5);
    const formaPagoLines = doc.splitTextToSize(formaPagoText, termsRightWidth - 4);

    // Calculate required height for top section
    const topSectionHeight = Math.max(
        (alcanceLines.length * 4) + 10,
        (formaPagoLines.length * 4) + 15,
        25 // minimum height
    );

    // Notas Finales text span full width
    const notaLines = doc.splitTextToSize(`NOTA: ${notaFinalText}`, contentWidth - 4);
    const bottomSectionHeight = (notaLines.length * 4) + 6;

    const blockTotalHeight = topSectionHeight + bottomSectionHeight;

    // Outer Box for Terms Block
    doc.rect(contentStartX, currentTotalsY, contentWidth, blockTotalHeight);

    // Inner lines
    // Vertical line separating Alcance and Forma de Pago
    doc.line(
        contentStartX + termsLeftWidth,
        currentTotalsY,
        contentStartX + termsLeftWidth,
        currentTotalsY + topSectionHeight
    );
    // Vertical line separating ALCANCE title and text
    doc.line(
        contentStartX + titleWidth,
        currentTotalsY,
        contentStartX + titleWidth,
        currentTotalsY + topSectionHeight
    );
    // Horizontal line separating top section from notes
    doc.line(
        contentStartX,
        currentTotalsY + topSectionHeight,
        contentStartX + contentWidth,
        currentTotalsY + topSectionHeight
    );
    // Horizontal line separating "FORMA DE PAGO" title and its content
    doc.line(
        contentStartX + termsLeftWidth,
        currentTotalsY + 8,
        contentStartX + contentWidth,
        currentTotalsY + 8
    );

    // Render Texts
    doc.setTextColor(0, 0, 0);

    // 'ALCANCE:' Label
    doc.setFontSize(8);
    doc.setFont(style.fonts.header, 'bold');
    doc.text("ALCANCE:", contentStartX + (titleWidth / 2), currentTotalsY + (topSectionHeight / 2), { align: 'center', baseline: 'middle' });

    // Alcance Content
    doc.setFont(style.fonts.body, 'normal');
    // Render lines slightly down
    doc.text(alcanceLines, contentStartX + titleWidth + 2, currentTotalsY + 6);

    // 'FORMA DE PAGO' Label
    doc.setFont(style.fonts.header, 'bold');
    doc.text("FORMA DE PAGO PARA ESTA OFERTA:", contentStartX + termsLeftWidth + (termsRightWidth / 2), currentTotalsY + 5.5, { align: 'center' });

    // Forma de Pago Content
    doc.setFont(style.fonts.body, 'normal');
    doc.text(formaPagoLines, contentStartX + termsLeftWidth + (termsRightWidth / 2), currentTotalsY + 14 + ((topSectionHeight - 8 - (formaPagoLines.length * 4)) / 2), { align: 'center' });

    // 'NOTA:' Content (bottom section)
    doc.setFont(style.fonts.header, 'bold');
    const notaLabel = "NOTA: ";
    const notaLabelWidth = doc.getTextWidth(notaLabel);
    doc.text(notaLabel, contentStartX + 2, currentTotalsY + topSectionHeight + 5);

    doc.setFont(style.fonts.body, 'normal');
    doc.text(notaFinalText, contentStartX + 2 + notaLabelWidth, currentTotalsY + topSectionHeight + 5, { maxWidth: contentWidth - 4 - notaLabelWidth });

    // Adjust bottom padding
    currentTotalsY += blockTotalHeight + 10;

    // FOOTERS
    // Branded footer bar?
    if (style.components.footerStyle === 'branded') {
        doc.setFillColor(...primary);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(`${company.nombre} - ${company.telefono} - ${company.email}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    } else {
        // Minimal footer
        doc.setFontSize(8);
        doc.setTextColor(...text);
        doc.text("Gracias por su confianza.", pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // --- 9. FINALIZE ---
    if (watermarkText) {
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.saveGraphicsState();
            doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
            doc.setFontSize(80);
            doc.setTextColor(150, 150, 150);
            doc.setFont(style.fonts.header, 'bold');
            doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
                align: 'center',
                angle: 45
            });
            doc.restoreGraphicsState();
        }
    }

    if (action === 'bloburl') {
        return doc.output('bloburl');
    } else if (action === 'dataurlstring') {
        return doc.output('dataurlstring');
    }

    doc.save(`Cotizacion_${cotizacion.numero}_${style.name}.pdf`);
    return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTA DE EJECUCIÓN PDF
// ─────────────────────────────────────────────────────────────────────────────

export interface ActaItem {
    descripcion: string;
    tipo: string;
    cantOferta: number;
    cantFinal: number;
    valorUnitario: number;
    esExtra: boolean;
}

export interface ActaData {
    numero: string;
    descripcionTrabajo: string;
    direccionProyecto?: string;
    fechaInicio?: string;
    fechaFinReal?: string;
    progreso?: number;
    cliente: {
        nombre: string;
        documento?: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
    };
    items: ActaItem[];
}

export const generateActaPDF = (
    acta: ActaData,
    companyInfo: CompanyInfo = COMPANY_INFO,
    observaciones?: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const primary: [number, number, number] = [30, 58, 138];
    const primaryLight: [number, number, number] = [219, 234, 254];
    const accent: [number, number, number] = [180, 83, 9];
    const red: [number, number, number] = [220, 38, 38];
    const green: [number, number, number] = [22, 163, 74];
    const textDark: [number, number, number] = [31, 41, 55];
    const textMuted: [number, number, number] = [107, 114, 128];
    const white: [number, number, number] = [255, 255, 255];

    const currencyFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    // White background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 1. HEADER BAND
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 22, 'F');

    doc.setTextColor(...white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(companyInfo.nombre, 14, 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.descripcion, 14, 16);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA DE EJECUCION', pageWidth - 14, 9, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`N\u00b0 ${acta.numero}`, pageWidth - 14, 15, { align: 'right' });

    // 2. INFO SUBBAND
    doc.setFillColor(...primaryLight);
    doc.rect(0, 22, pageWidth, 7, 'F');
    doc.setTextColor(...textMuted);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const infoLine = [companyInfo.direccion, companyInfo.telefono, companyInfo.email, `NIT: ${companyInfo.nit}`].join('   |   ');
    doc.text(infoLine, 14, 27);

    // 3. TWO-COLUMN INFO BLOCK
    const blockY = 32;
    const blockH = 32;
    const colW = (pageWidth - 28) / 2;

    // Left: CLIENT
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(14, blockY, colW - 2, blockH, 2, 2, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primary);
    doc.text('DATOS DEL CLIENTE', 17, blockY + 6);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(acta.cliente.nombre, 17, blockY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    let cy = blockY + 19;
    if (acta.cliente.documento) { doc.text(`NIT / CC: ${acta.cliente.documento}`, 17, cy); cy += 4.5; }
    if (acta.cliente.telefono) { doc.text(`Tel: ${acta.cliente.telefono}`, 17, cy); cy += 4.5; }
    if (acta.cliente.correo) { doc.text(`Email: ${acta.cliente.correo}`, 17, cy); }

    // Right: PROJECT
    const rx = 14 + colW + 2;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(rx, blockY, colW - 2, blockH, 2, 2, 'FD');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primary);
    doc.text('DATOS DEL PROYECTO', rx + 3, blockY + 6);
    doc.setTextColor(...textDark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const projDesc = doc.splitTextToSize(acta.descripcionTrabajo || '', colW - 8);
    doc.text(projDesc, rx + 3, blockY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    let py = blockY + 19;
    if (acta.direccionProyecto) { doc.text(`Dir: ${acta.direccionProyecto}`, rx + 3, py); py += 4.5; }
    const dateStr = [
        acta.fechaInicio ? `Inicio: ${new Date(acta.fechaInicio).toLocaleDateString('es-CO')}` : '',
        acta.fechaFinReal ? `Fin: ${new Date(acta.fechaFinReal).toLocaleDateString('es-CO')}` : '',
        acta.progreso !== undefined ? `Avance: ${acta.progreso}%` : ''
    ].filter(Boolean).join('   |   ');
    if (dateStr) doc.text(dateStr, rx + 3, py);

    let currentY = blockY + blockH + 8;

    // 4. QUANTITY ANALYSIS TABLE
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text('ANALISIS DE CANTIDADES - OFERTA VS. EJECUTADO', 14, currentY);
    currentY += 4;

    const origItems = acta.items.filter(i => !i.esExtra);
    const qtyBody = origItems.map(item => {
        const diff = item.cantFinal - item.cantOferta;
        const deltaVal = diff * item.valorUnitario;
        return [
            item.descripcion,
            item.tipo === 'SERVICIO' ? 'Serv.' : 'Mat.',
            item.cantOferta.toString(),
            item.cantFinal.toString(),
            diff === 0 ? '-' : (diff > 0 ? `+${diff}` : `${diff}`),
            currencyFmt.format(item.valorUnitario),
            diff === 0 ? '-' : ((diff > 0 ? '+' : '') + currencyFmt.format(deltaVal))
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Tipo', 'Cant. Oferta', 'Cant. Final', 'Delta', 'V. Unit.', 'Delta Valor']],
        body: qtyBody,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2, textColor: textDark, lineColor: [220, 220, 220] },
        headStyles: { fillColor: primary, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 15, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' },
            4: { cellWidth: 14, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 28, halign: 'right' }
        },
        didParseCell: (data) => {
            if (data.section !== 'body') return;
            if (data.column.index === 4 || data.column.index === 6) {
                const v = String(data.cell.raw);
                if (v.startsWith('+')) data.cell.styles.textColor = red;
                else if (v !== '-') data.cell.styles.textColor = green;
            }
        },
        margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 5. EXTRAS TABLE
    const extraItems = acta.items.filter(i => i.esExtra);
    if (extraItems.length > 0) {
        if (currentY > pageHeight - 60) { doc.addPage(); currentY = 16; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...accent);
        doc.text('ITEMS ADICIONALES / EXTRAS', 14, currentY);
        currentY += 4;

        autoTable(doc, {
            startY: currentY,
            head: [['Descripcion', 'Cantidad', 'V. Unit.', 'Total Extra']],
            body: extraItems.map(item => [
                item.descripcion,
                item.cantFinal.toString(),
                currencyFmt.format(item.valorUnitario),
                `+${currencyFmt.format(item.valorUnitario * item.cantFinal)}`
            ]),
            theme: 'grid',
            styles: { fontSize: 7.5, cellPadding: 2, textColor: textDark, lineColor: [220, 220, 220] },
            headStyles: { fillColor: [180, 83, 9], textColor: white, fontStyle: 'bold', fontSize: 7.5 },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right', textColor: accent }
            },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // 6. FINANCIAL SUMMARY
    if (currentY > pageHeight - 55) { doc.addPage(); currentY = 16; }
    const totalOriginal = origItems.reduce((acc, i) => acc + i.valorUnitario * i.cantOferta, 0);
    const totalVariacion = origItems.reduce((acc, i) => acc + (i.cantFinal - i.cantOferta) * i.valorUnitario, 0);
    const totalExtras = extraItems.reduce((acc, i) => acc + i.valorUnitario * i.cantFinal, 0);
    const totalFinal = totalOriginal + totalVariacion + totalExtras;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text('RESUMEN FINANCIERO', 14, currentY);
    currentY += 4;

    const summaryRows: [string, string][] = [['Valor Oferta Original:', currencyFmt.format(totalOriginal)]];
    if (totalVariacion !== 0) summaryRows.push([`Ajuste por Cantidades:`, (totalVariacion > 0 ? '+' : '') + currencyFmt.format(totalVariacion)]);
    if (totalExtras > 0) summaryRows.push(['Items Extras:', `+${currencyFmt.format(totalExtras)}`]);
    summaryRows.push(['TOTAL A COBRAR:', currencyFmt.format(totalFinal)]);

    autoTable(doc, {
        startY: currentY,
        body: summaryRows,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 2, textColor: textDark },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (data) => {
            const isLast = data.row.index === summaryRows.length - 1;
            if (isLast) {
                data.cell.styles.fontSize = 10;
                data.cell.styles.textColor = primary;
                data.cell.styles.fillColor = primaryLight;
                data.cell.styles.fontStyle = 'bold';
            }
        },
        margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 7. OBSERVATIONS
    if (observaciones) {
        if (currentY > pageHeight - 40) { doc.addPage(); currentY = 16; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...primary);
        doc.text('OBSERVACIONES', 14, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...textDark);
        const obsLines = doc.splitTextToSize(observaciones, pageWidth - 28);
        doc.text(obsLines, 14, currentY);
        currentY += obsLines.length * 4.5 + 8;
    }

    // 8. SIGNATURE AREA
    if (currentY > pageHeight - 45) { doc.addPage(); currentY = 16; }
    currentY = Math.max(currentY, pageHeight - 45);

    doc.setDrawColor(...textMuted);
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 25, 80, currentY + 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(companyInfo.nombre, 47, currentY + 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('Firma y Sello Empresa', 47, currentY + 35, { align: 'center' });

    doc.line(pageWidth - 80, currentY + 25, pageWidth - 14, currentY + 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textDark);
    doc.text(acta.cliente.nombre, pageWidth - 47, currentY + 30, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('Firma y Sello Cliente', pageWidth - 47, currentY + 35, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text(`Generado el ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    doc.save(`Acta_Ejecucion_${acta.numero}.pdf`);
};

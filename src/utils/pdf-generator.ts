
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

export const generateQuotePDF = (
    cotizacion: Cotizacion,
    materialVisibilityMode: MaterialVisibilityMode = 'MOSTRAR_TODO',
    companyInfo?: CompanyInfo,
    selectedStyle?: PDFStyleConfig
) => {
    // 1. Setup Style & Document
    const style = selectedStyle || PDF_STYLES[0];
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

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
    const company = companyInfo || {
        nombre: "D.M.R.E. S.A.S.",
        nit: "900.123.456-7",
        direccion: "Calle 123 #45-67, Bogotá D.C.",
        telefono: "(601) 123 4567",
        email: "info@dmre.com.co",
        descripcion: "Diseño y Montajes de Redes Eléctricas"
    };

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
            doc.addImage(logoImg, 'PNG', 12, 15, 40, 40);
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
            doc.addImage(logoImg, 'PNG', 14, 12, 30, 30);
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
            const logoX = (pageWidth - 30) / 2;
            doc.addImage(logoImg, 'PNG', logoX, 15, 30, 30);
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
            doc.addImage(logoImg, 'PNG', 14, 15, 25, 25);
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
        doc.setTextColor(80, 80, 80);
        doc.text(`NIT: ${company.nit}`, 45, 34);
        doc.text(`${company.direccion}`, 45, 39);
        doc.text(`${company.telefono} | ${company.email}`, 45, 44);

        currentY = 55;
    }


    // --- 2. QUOTE TITLE BOX ---

    // We calculate position based on layout
    let titleY = currentY;

    // In Standard layout, title is often top right
    if (style.layout === 'standard' || style.layout === 'technical' || style.layout === 'minimal') {
        // Floating box top right
        const boxX = pageWidth - 80;
        const boxY = 15;

        // Minimalist: Just text
        if (style.components.clientBoxStyle === 'clean') {
            doc.setFontSize(16);
            doc.setFont(style.fonts.header, 'bold');
            doc.setTextColor(...secondary);
            doc.text("COTIZACIÓN", pageWidth - 14, 25, { align: 'right' });
            doc.setFontSize(12);
            doc.setTextColor(...text);
            doc.text(`# ${cotizacion.numero}`, pageWidth - 14, 32, { align: 'right' });
            doc.setFontSize(10);
            doc.text(format(new Date(cotizacion.fecha), "dd MMM yyyy", { locale: es }), pageWidth - 14, 38, { align: 'right' });
        }
        // Boxed Standard
        else {
            doc.setDrawColor(...accent);
            doc.setFillColor(250, 250, 250);
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

            doc.setTextColor(200, 50, 50); // Red highlight
            doc.text(`${cotizacion.numero}`, boxX + 33, boxY + 16, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont(style.fonts.body, 'normal');
            doc.setTextColor(60, 60, 60);
            doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd/MM/yyyy")}`, boxX + 33, boxY + 24, { align: 'center' });
        }
    }
    // In Bold layout, title box overlaps header
    else if (style.layout === 'bold') {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...accent);
        doc.rect(pageWidth - 85, 40, 70, 25, 'FD'); // Overlapping banner

        doc.setFontSize(14);
        doc.setFont(style.fonts.header, 'bold');
        doc.setTextColor(...primary);
        doc.text("COTIZACIÓN", pageWidth - 50, 50, { align: 'center' });
        doc.text(`# ${cotizacion.numero}`, pageWidth - 50, 60, { align: 'center' });
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
        doc.text(`Fecha: ${format(new Date(cotizacion.fecha), "dd MMMM yyyy", { locale: es })}`, pageWidth / 2, currentY + 6, { align: 'center' });
        currentY += 15;
    }


    // --- 3. CLIENT INFO SECTION ---

    // Sidebar layout: Client info is main content top
    // Standard layout: Client info is below header

    const clientBoxY = currentY > 0 ? currentY + 5 : 60; // fallback

    if (style.components.clientBoxStyle === 'filled') {
        // Gray background block
        doc.setFillColor(...accent);
        doc.rect(contentStartX, clientBoxY, contentWidth, 30, 'F');

        doc.setTextColor(...primary);
        doc.setFontSize(10);
        doc.setFont(style.fonts.header, 'bold');
        doc.text("CLIENTE", contentStartX + 5, clientBoxY + 8);

        doc.setTextColor(...text);
        doc.setFontSize(10);
        doc.setFont(style.fonts.body, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX + 5, clientBoxY + 15);

        doc.setFont('normal');
        doc.setFontSize(9);
        doc.text(`NIT: ${cotizacion.cliente.documento}`, contentStartX + 5, clientBoxY + 20);
        doc.text(`Dir: ${cotizacion.cliente.direccion}`, contentStartX + 5, clientBoxY + 25);

        // Right side of box
        doc.text(`Contacto: ${cotizacion.cliente.contactoPrincipal}`, contentStartX + contentWidth / 2, clientBoxY + 15);
        doc.text(`Tel: ${cotizacion.cliente.telefono}`, contentStartX + contentWidth / 2, clientBoxY + 20);

        currentY = clientBoxY + 35;
    }
    else if (style.components.clientBoxStyle === 'box') {
        // Oultined box
        doc.setDrawColor(...secondary);
        doc.roundedRect(contentStartX, clientBoxY, contentWidth, 30, 1, 1);

        // Label on border mechanism? No, simpler: inside
        doc.setTextColor(...secondary);
        doc.setFontSize(8);
        doc.text("FACTURAR A:", contentStartX + 4, clientBoxY + 6);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont(style.fonts.header, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX + 4, clientBoxY + 13);

        doc.setFontSize(9);
        doc.setFont(style.fonts.body, 'normal');
        doc.text(`${cotizacion.cliente.documento} | ${cotizacion.cliente.telefono}`, contentStartX + 4, clientBoxY + 19);
        doc.text(cotizacion.cliente.direccion, contentStartX + 4, clientBoxY + 24);

        currentY = clientBoxY + 35;
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
        doc.text("PREPARADO PARA:", contentStartX, currentY + 5);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont(style.fonts.body, 'bold');
        doc.text(cotizacion.cliente.nombre, contentStartX, currentY + 11);

        doc.setFont('normal');
        doc.setFontSize(9);
        doc.text(`${cotizacion.cliente.documento}`, contentStartX, currentY + 16);
        doc.text(`${cotizacion.cliente.direccion}`, contentStartX, currentY + 21);

        currentY += 28;
    }


    // --- 4. DESCRIPTION ---
    doc.setFontSize(10);
    doc.setFont(style.fonts.header, 'bold');
    doc.setTextColor(...primary);
    doc.text("PROYECTO:", contentStartX, currentY);

    doc.setFont(style.fonts.body, 'normal');
    doc.setTextColor(0);
    const splitDesc = doc.splitTextToSize(cotizacion.descripcionTrabajo || "", contentWidth - 25);
    doc.text(splitDesc, contentStartX + 22, currentY);

    currentY += (splitDesc.length * 5) + 8;


    // --- 5. ITEMS TABLE ---

    // Prepare Data
    const tableBody = cotizacion.items
        .filter(item => {
            if (item.tipo === 'SERVICIO') return true;
            if (item.tipo === 'PRODUCTO') return materialVisibilityMode !== 'OCULTAR_TODO';
            return true;
        })
        .map((item, index) => {
            const isProduct = item.tipo === 'PRODUCTO';
            const showDetails = !isProduct || materialVisibilityMode === 'MOSTRAR_TODO';
            return [
                index + 1,
                item.descripcion,
                showDetails ? item.cantidad : '-',
                "UND",
                showDetails ? currencyFmt.format(item.valorUnitario) : '-',
                showDetails ? currencyFmt.format(item.valorTotal) : '-'
            ];
        });

    autoTable(doc, {
        startY: currentY,
        head: [["#", "DESCRIPCIÓN", "CANT", "UNIDAD", "VALOR UNIT.", "TOTAL"]],
        body: tableBody,
        theme: style.components.tableTheme === 'plain' ? 'plain' : (style.components.tableTheme === 'grid' ? 'grid' : 'striped'),
        styles: {
            font: style.fonts.body,
            fontSize: 9,
            cellPadding: 4,
            textColor: [40, 40, 40]
        },
        headStyles: {
            fillColor: style.components.tableTheme === 'plain' ? [255, 255, 255] : primary,
            textColor: style.components.tableTheme === 'plain' ? primary : [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            lineWidth: style.components.tableTheme === 'plain' ? 0 : 0
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: contentStartX, right: pageWidth - (contentStartX + contentWidth) },
        alternateRowStyles: {
            fillColor: style.components.tableTheme === 'striped' ? accent : [255, 255, 255]
        }
    });

    // --- 6. TOTALS & FOOTER ---

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsX = contentStartX + contentWidth - 60; // Right aligned in content area

    // Divider
    doc.setDrawColor(200);
    doc.line(totalsX, finalY - 2, contentStartX + contentWidth, finalY - 2);

    doc.setFontSize(10);

    // Subtotal
    doc.setTextColor(80);
    doc.text("Subtotal:", totalsX, finalY + 4);
    doc.setTextColor(0);
    doc.text(currencyFmt.format(cotizacion.subtotal), contentStartX + contentWidth, finalY + 4, { align: "right" });

    // IVA
    doc.setTextColor(80);
    doc.text(`IVA (${Math.round((cotizacion.iva / (cotizacion.subtotal || 1)) * 100)}%):`, totalsX, finalY + 9);
    doc.setTextColor(0);
    doc.text(currencyFmt.format(cotizacion.iva), contentStartX + contentWidth, finalY + 9, { align: "right" });

    // GRAND TOTAL
    doc.setFontSize(12);
    doc.setFont(style.fonts.header, 'bold');

    // Colored Box for Total if Bold style
    if (style.layout === 'bold') {
        doc.setFillColor(...secondary);
        doc.rect(totalsX - 5, finalY + 14, 70, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("TOTAL:", totalsX, finalY + 21);
        doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, finalY + 21, { align: "right" });
    } else {
        doc.setTextColor(...primary);
        doc.text("TOTAL NETO:", totalsX, finalY + 18);
        doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, finalY + 18, { align: "right" });
    }

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
        doc.setTextColor(150);
        doc.text("Gracias por su confianza.", pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Cotizacion_${cotizacion.numero}_${style.name}.pdf`);
};

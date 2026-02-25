
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
    selectedStyle?: PDFStyleConfig,
    action: 'save' | 'bloburl' | 'dataurlstring' = 'save'
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
    const company = companyInfo || {
        nombre: "DMRE",
        nit: "1075652553-9",
        direccion: "CARRERA 4 N° 5 -122 INT 2 BARANDILLAS, Zipaquirá, Cundinamarca",
        telefono: "CEL: 3115368577 - 3124074257 | TEL: 8816064",
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
        doc.text(format(new Date(cotizacion.fecha), "dd MMMM yyyy", { locale: es }), contentStartX + contentWidth, 39, { align: 'right' });
    }


    // --- 3. CLIENT INFO SECTION ---

    // Sidebar layout: Client info is main content top
    // Standard layout: Client info is below header

    const clientBoxY = currentY > 0 ? currentY + 5 : 60; // fallback

    if (style.components.clientBoxStyle === 'filled') {
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


    // --- 4. DESCRIPTION ---
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


    // --- 5. ITEMS TABLE ---

    // Prepare Data
    const tableBody: any[] = [];
    cotizacion.items.forEach((item, index) => {
        const isProduct = item.tipo === 'PRODUCTO';
        const isService = item.tipo === 'SERVICIO';
        const showItem = !isProduct || materialVisibilityMode !== 'OCULTAR_TODO';

        if (showItem) {
            const showDetails = !isProduct || materialVisibilityMode === 'MOSTRAR_TODO';
            tableBody.push([
                index + 1,
                item.descripcion,
                showDetails ? item.cantidad : '-',
                "UND",
                showDetails ? currencyFmt.format(item.valorUnitario) : '-',
                showDetails ? currencyFmt.format(item.valorTotal) : '-'
            ]);

            // Add sub-items for Work Codes (APUs) if they exist and we're not hiding everything
            if (isService && item.subItems && item.subItems.length > 0 && materialVisibilityMode !== 'OCULTAR_TODO') {
                item.subItems.forEach((sub) => {
                    const totalSubQty = (sub.cantidad || 0) * item.cantidad;
                    tableBody.push([
                        "", // Empty index for sub-items
                        `      ↳ ${sub.nombre}`, // Indented with arrow
                        totalSubQty,
                        "UND",
                        "", // Don't show individual costs for sub-items by default
                        ""  // Total is included in parent item
                    ]);
                });
            }
        }
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
        },
        // Ensure black text in table even in dark mode (though we forced white bg)
        bodyStyles: {
            textColor: [0, 0, 0]
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
    doc.setTextColor(...text);

    // Check if AIU is present
    const hasAiu = (cotizacion.aiuAdmin || 0) > 0 || (cotizacion.aiuImprevistos || 0) > 0 || (cotizacion.aiuUtilidad || 0) > 0;

    let currentTotalsY = finalY + 4;
    const lineSpacing = 5;

    doc.text("Subtotal:", totalsX, currentTotalsY);
    doc.text(currencyFmt.format(cotizacion.subtotal), contentStartX + contentWidth, currentTotalsY, { align: "right" });

    if (hasAiu) {
        currentTotalsY += lineSpacing;
        doc.text("Admin:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.aiuAdmin || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

        currentTotalsY += lineSpacing;
        doc.text("Imprevistos:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.aiuImprevistos || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

        currentTotalsY += lineSpacing;
        doc.text("Utilidad:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.aiuUtilidad || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });

        currentTotalsY += lineSpacing;
        doc.text("IVA s/ Util.:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.iva || 0), contentStartX + contentWidth, currentTotalsY, { align: "right" });
    } else {
        currentTotalsY += lineSpacing;
        // Normal IVA
        doc.text("IVA:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.iva), contentStartX + contentWidth, currentTotalsY, { align: "right" });
    }

    // GRAND TOTAL
    doc.setFontSize(12);
    doc.setFont(style.fonts.header, 'bold');

    currentTotalsY += lineSpacing;

    // Colored Box for Total if Bold style
    if (style.layout === 'bold') {
        doc.setFillColor(...secondary);
        doc.rect(totalsX - 5, currentTotalsY - 7, 70, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("TOTAL:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, currentTotalsY, { align: "right" });
    } else {
        doc.setTextColor(...primary);
        doc.text("TOTAL:", totalsX, currentTotalsY);
        doc.text(currencyFmt.format(cotizacion.total), contentStartX + contentWidth, currentTotalsY, { align: "right" });
    }

    currentTotalsY += 10; // Give some space before footer

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

    if (action === 'bloburl') {
        return doc.output('bloburl');
    } else if (action === 'dataurlstring') {
        return doc.output('datauristring');
    }

    doc.save(`Cotizacion_${cotizacion.numero}_${style.name}.pdf`);
    return null;
};

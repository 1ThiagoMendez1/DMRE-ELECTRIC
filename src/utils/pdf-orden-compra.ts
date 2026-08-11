import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrdenCompra, Cotizacion } from "@/types/sistema";
import { COMPANY_INFO } from "./pdf-generator";
import { LOGO_BASE64 } from "./logo-base64";

export const generateOrdenCompraPDF = (
    oc: OrdenCompra, 
    ofertaOriginal?: Cotizacion,
    action: 'save' | 'bloburl' | 'dataurlstring' = 'save'
) => {
    const doc = new jsPDF();
    const company = COMPANY_INFO;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const currencyFmt = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // Fondo blanco
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // 1. Encabezado Oficial DMRE
    const primaryColor = [0, 50, 100] as [number, number, number];

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, 12, pageWidth - 28, 28); // Header box

    try {
        doc.addImage(LOGO_BASE64, 'PNG', 13, 10, 32, 32);
    } catch (e) { }

    doc.setTextColor(...primaryColor);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text("DISEÑO Y MONTAJE DE REDES", pageWidth / 2 + 5, 18.5, { align: 'center' });
    doc.text("ELÉCTRICAS D.M.R.E", pageWidth / 2 + 5, 24.5, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`NIT: ${company.nit.replace('-9', '')}`, pageWidth / 2 + 5, 28.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(company.email, pageWidth / 2 + 5, 31.5, { align: 'center' });
    doc.text(company.telefono, pageWidth / 2 + 5, 34.5, { align: 'center' });
    doc.text("www.dmreingenieria.com", pageWidth / 2 + 5, 37.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("SGI-DMRE-0818", pageWidth - 16, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("2/02/2020", pageWidth - 16, 27, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text("Versión 2.1", pageWidth - 16, 36, { align: 'right' });

    // 2. Info Grid (Estilo "Cliente")
    let currentY = 40;
    
    const proveedorNombre = oc.proveedor ? oc.proveedor.nombre : "PROVEEDOR DESCONOCIDO";
    const proveedorDoc = oc.proveedor ? oc.proveedor.nit : "N/A";
    const proveedorDir = oc.proveedor ? (oc.proveedor.direccion || "N/A") : "N/A";
    const proveedorEmail = oc.proveedor ? (oc.proveedor.correo || "N/A") : "N/A";
    const proveedorTel = oc.proveedor ? (oc.proveedor.telefono || "N/A") : "N/A";
    
    const numOferta = oc.numero;
    const proyDesc = ofertaOriginal ? (ofertaOriginal.descripcionTrabajo || `Proyecto ${ofertaOriginal.numero}`) : `Orden de Compra ${oc.numero}`;

    autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        body: [
            [{ content: 'Proveedor', styles: { fontStyle: 'bold' } }, proveedorNombre, { content: 'Elaborado por', styles: { fontStyle: 'bold' } }, company.nombre],
            [{ content: 'NIT', styles: { fontStyle: 'bold' } }, proveedorDoc, { content: 'Fecha Emisión', styles: { fontStyle: 'bold' } }, format(new Date(oc.fechaEmision), "dd/MM/yyyy")],
            [{ content: 'Dirección', styles: { fontStyle: 'bold' } }, proveedorDir, { content: 'Fecha Entrega', styles: { fontStyle: 'bold' } }, oc.fechaEntregaEstimada ? format(new Date(oc.fechaEntregaEstimada), "dd/MM/yyyy") : "N/A"],
            [{ content: 'E-mail', styles: { fontStyle: 'bold' } }, proveedorEmail, { content: 'NÚMERO DE ORDEN', rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 8 } }, { content: numOferta, rowSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle', textColor: [200, 0, 0], fontSize: 12 } }],
            [{ content: 'Teléfono', styles: { fontStyle: 'bold' } }, proveedorTel],
            [{ content: 'Ref. Proyecto', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } }, { content: proyDesc.toUpperCase(), colSpan: 3, styles: { cellPadding: 3, valign: 'middle' } }]
        ],
        styles: {
            fontSize: 9,
            textColor: 0,
            lineColor: 0,
            lineWidth: 0.2,
            cellPadding: 1.5,
        },
        columnStyles: {
            0: { cellWidth: 22, fillColor: [240, 240, 240] },
            1: { cellWidth: 69 },
            2: { cellWidth: 25, fillColor: [240, 240, 240] },
            3: { cellWidth: 66 }
        },
        margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // 3. Tabla de Materiales
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    doc.text("ORDEN DE COMPRA", 14, currentY);
    currentY += 4;

    const tableData = oc.items.map((item, index) => {
        return [
            (index + 1).toString(),
            item.descripcion,
            item.cantidad.toString(),
            "UND",
            currencyFmt.format(item.valorUnitario),
            currencyFmt.format(item.subtotal)
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: [['#', 'DESCRIPCIÓN', 'CANT', 'UNIDAD', 'VALOR\nUNIT.', 'TOTAL']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 9,
            halign: 'center',
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 90 },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 15, halign: 'center' },
            4: { cellWidth: 26, halign: 'right' },
            5: { cellWidth: 26, halign: 'right' }
        },
        styles: { fontSize: 9, cellPadding: 3, lineColor: 0, lineWidth: 0.2, textColor: 0 },
        margin: { left: 14, right: 14 }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // Resumen de Totales
    doc.setFontSize(10);
    const totalsX = pageWidth - 60;
    
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", totalsX, finalY);
    doc.text(currencyFmt.format(oc.subtotal), pageWidth - 14, finalY, { align: 'right' });
    
    finalY += 6;
    doc.text("IVA (19%):", totalsX, finalY);
    doc.text(currencyFmt.format(oc.impuestos), pageWidth - 14, finalY, { align: 'right' });

    finalY += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("TOTAL:", totalsX, finalY);
    doc.text(currencyFmt.format(oc.total), pageWidth - 14, finalY, { align: 'right' });

    finalY += 15;

    // Alcance / Notas si es necesario
    if (oc.observaciones || ofertaOriginal?.descripcionTrabajo) {
        autoTable(doc, {
            startY: finalY,
            theme: 'grid',
            body: [
                [{ content: 'ALCANCE:', styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } }, { content: oc.observaciones || ofertaOriginal?.descripcionTrabajo || "" }]
            ],
            styles: { fontSize: 9, textColor: 0, lineColor: 0, lineWidth: 0.2, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25, fillColor: [240, 240, 240] },
                1: { cellWidth: 157 }
            },
            margin: { left: 14, right: 14 }
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;
    }
    
    // Nota Fija
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("NOTA:", 14, finalY);
    doc.setFont("helvetica", "normal");
    const fixedNote = "Todos los ítems consignados en esta orden se ciñen a los criterios, parámetros técnicos y normatividad vigente.";
    doc.text(fixedNote, 24, finalY);

    finalY += 20;

    // Firmas
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(14, finalY, 70, finalY); // Linea de firma
    doc.text("Aprobado por / Autorizado", 14, finalY + 5);

    // Pie de pagina
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(
            `${company.nombre} - ${company.telefono} - ${company.email}`,
            pageWidth / 2,
            pageHeight - 4,
            { align: 'center' }
        );
    }

    if (action === 'save') {
        doc.save(`Orden_Compra_${oc.numero}.pdf`);
    } else if (action === 'bloburl') {
        return doc.output('bloburl');
    } else if (action === 'dataurlstring') {
        return doc.output('datauristring');
    }
};

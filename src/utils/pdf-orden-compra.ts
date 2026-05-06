import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrdenCompra, Cotizacion } from "@/types/sistema";
import { COMPANY_INFO } from "./pdf-generator";

export const generateOrdenCompraPDF = (oc: OrdenCompra, ofertaOriginal?: Cotizacion) => {
    const doc = new jsPDF();
    const company = COMPANY_INFO;

    // Default formatting
    const currencyFmt = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // 1. Encabezado
    doc.setFontSize(22);
    doc.setTextColor(33, 33, 33);
    doc.text("ORDEN DE COMPRA", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`N°: ${oc.numero}`, 14, 30);
    doc.text(`Fecha de Emisión: ${format(new Date(oc.fechaEmision), "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 36);
    if (oc.estado) {
        doc.text(`Estado: ${oc.estado}`, 14, 42);
    }

    // Detalles de la Empresa (Izquierda) - COMPRADOR
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("Comprador:", 14, 54);
    doc.setFont("helvetica", "bold");
    doc.text(company.nombre, 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${company.nit}`, 14, 66);
    doc.text(`Dirección: ${company.direccion}`, 14, 72);
    doc.text(`Tel: ${company.telefono}`, 14, 78);

    // Detalles del Proveedor (Derecha) - VENDEDOR
    doc.text("Proveedor (Vendedor):", 120, 54);
    doc.setFont("helvetica", "bold");
    doc.text(oc.proveedor ? oc.proveedor.nombre : "PROVEEDOR DESCONOCIDO", 120, 60);
    doc.setFont("helvetica", "normal");
    if (oc.proveedor) {
        doc.text(`NIT: ${oc.proveedor.nit}`, 120, 66);
        doc.text(`Tel: ${oc.proveedor.telefono || ''}`, 120, 72);
        doc.text(`Email: ${oc.proveedor.correo || ''}`, 120, 78);
    }

    // 2. Información del Proyecto
    let currentY = 88;
    if (ofertaOriginal) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 182, 16, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Referencia Proyecto:", 18, currentY + 6);
        doc.setFont("helvetica", "normal");
        doc.text(ofertaOriginal.descripcionTrabajo || `Proyecto ${ofertaOriginal.numero}`, 18, currentY + 12);
        currentY += 25;
    }

    doc.text("Se autoriza la compra de los siguientes ítems de acuerdo a los valores acordados:", 14, currentY);
    currentY += 8;

    // 3. Tabla de Materiales con Precios
    const tableData = oc.items.map((item, index) => [
        (index + 1).toString(),
        item.descripcion,
        item.cantidad.toString(),
        currencyFmt.format(item.valorUnitario),
        currencyFmt.format(item.subtotal)
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Descripción', 'Cantidad', 'V. Unitario', 'V. Total']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185], // Un azul profesional
            textColor: 255,
            fontSize: 9,
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        },
        styles: {
            fontSize: 8,
            cellPadding: 4
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 10;

    // 4. Totales
    // Align totals to the right
    const rightAlignX = 150;
    const valueAlignX = 196;

    doc.setFontSize(10);
    
    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", rightAlignX, finalY, { align: "right" });
    doc.text(currencyFmt.format(oc.subtotal), valueAlignX, finalY, { align: "right" });
    finalY += 6;

    // IVA
    doc.text("IVA (19%):", rightAlignX, finalY, { align: "right" });
    doc.text(currencyFmt.format(oc.impuestos), valueAlignX, finalY, { align: "right" });
    finalY += 6;

    // Total
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", rightAlignX, finalY, { align: "right" });
    doc.text(currencyFmt.format(oc.total), valueAlignX, finalY, { align: "right" });

    finalY += 20;

    // 5. Firmas o notas finales
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(14, finalY, 70, finalY); // Linea de firma
    doc.text("Aprobado por / Autorizado", 14, finalY + 5);

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Página ${i} de ${pageCount} - ${company.nombre} - Orden de Compra ${oc.numero}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    // Descargar
    doc.save(`Orden_Compra_${oc.numero}.pdf`);
};

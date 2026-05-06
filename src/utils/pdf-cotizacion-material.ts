import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CotizacionProveedor, Cotizacion } from "@/types/sistema";
import { COMPANY_INFO } from "./pdf-generator";

export const generateMaterialQuotePDF = (cotizacion: CotizacionProveedor, ofertaOriginal?: Cotizacion) => {
    const doc = new jsPDF();
    const company = COMPANY_INFO;
    const isApproved = cotizacion.estado === 'APROBADA';

    const currencyFmt = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    });

    // 1. Encabezado
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 33, 33);

    if (isApproved) {
        doc.text("CONFIRMACION DE COTIZACION", 14, 22);
        doc.setFontSize(12);
        doc.setTextColor(22, 163, 74);
        doc.text("APROBADA", 155, 22);
        doc.setTextColor(33, 33, 33);
    } else {
        doc.text("SOLICITUD DE COTIZACION", 14, 22);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`N: ${cotizacion.numero}`, 14, 30);
    doc.text(`Fecha: ${format(cotizacion.fecha, "dd 'de' MMMM, yyyy", { locale: es })}`, 14, 36);

    // Detalles de la Empresa (Izquierda)
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text("Solicitado por:", 14, 50);
    doc.setFont("helvetica", "bold");
    doc.text(company.nombre, 14, 56);
    doc.setFont("helvetica", "normal");
    doc.text(`NIT: ${company.nit}`, 14, 62);
    doc.text(`Tel: ${company.telefono}`, 14, 68);
    doc.text(`Email: ${company.email}`, 14, 74);

    // Detalles del Proveedor (Derecha)
    doc.text("Para:", 120, 50);
    doc.setFont("helvetica", "bold");
    doc.text(cotizacion.proveedor ? cotizacion.proveedor.nombre : "PROVEEDOR", 120, 56);
    doc.setFont("helvetica", "normal");
    if (cotizacion.proveedor) {
        doc.text(`NIT: ${cotizacion.proveedor.nit}`, 120, 62);
        doc.text(`Tel: ${cotizacion.proveedor.telefono || ''}`, 120, 68);
        doc.text(`Email: ${cotizacion.proveedor.correo || ''}`, 120, 74);
    } else {
        doc.text("A quien corresponda", 120, 62);
    }

    // 2. Informacion del Proyecto
    let currentY = 86;
    if (ofertaOriginal) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 182, 16, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Referencia Proyecto:", 18, currentY + 6);
        doc.setFont("helvetica", "normal");
        const proyDesc = ofertaOriginal.descripcionTrabajo || `Proyecto ${ofertaOriginal.numero}`;
        doc.text(proyDesc.substring(0, 80), 18, currentY + 12);
        currentY += 25;
    }

    // Mensaje
    doc.setFontSize(9);
    if (isApproved) {
        doc.setTextColor(22, 163, 74);
        doc.text("Se confirman los valores acordados para los siguientes materiales/servicios:", 14, currentY);
    } else {
        doc.setTextColor(50, 50, 50);
        doc.text("Por medio de la presente solicitamos cotizacion formal de los siguientes materiales/servicios:", 14, currentY);
    }
    doc.setTextColor(50, 50, 50);
    currentY += 8;

    // 3. Tabla de Materiales
    if (isApproved) {
        // Tabla CON precios reales ingresados al aprobar
        const tableData = cotizacion.items.map((item, index) => {
            const valorUnit = item.valorUnitarioOfrecido || 0;
            const valorTotal = valorUnit * item.cantidad;
            return [
                (index + 1).toString(),
                item.descripcion,
                item.unidad || "UND",
                item.cantidad.toString(),
                currencyFmt.format(valorUnit),
                currencyFmt.format(valorTotal)
            ];
        });

        const subtotal = cotizacion.items.reduce((acc, item) => {
            return acc + (item.valorUnitarioOfrecido || 0) * item.cantidad;
        }, 0);

        autoTable(doc, {
            startY: currentY,
            head: [['Item', 'Descripcion / Referencia', 'Unidad', 'Cant.', 'V. Unitario', 'V. Total']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [22, 163, 74],
                textColor: 255,
                fontSize: 9,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 13, halign: 'center' },
                1: { cellWidth: 68 },
                2: { cellWidth: 18, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 34, halign: 'right' },
                5: { cellWidth: 34, halign: 'right' }
            },
            styles: { fontSize: 9, cellPadding: 3 },
            foot: [['', '', '', 'SUBTOTAL', '', currencyFmt.format(subtotal)]],
            footStyles: {
                fontStyle: 'bold',
                halign: 'right',
                fillColor: [220, 252, 231],
                textColor: [22, 101, 52]
            }
        });
    } else {
        // Tabla en BLANCO para que el proveedor la llene
        const tableData = cotizacion.items.map((item, index) => [
            (index + 1).toString(),
            item.descripcion,
            item.unidad || "UND",
            item.cantidad.toString(),
            "",
            ""
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Item', 'Descripcion / Referencia', 'Unidad', 'Cant.', 'V. Unitario (Llenar)', 'V. Total (Llenar)']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontSize: 9,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 13, halign: 'center' },
                1: { cellWidth: 68 },
                2: { cellWidth: 18, halign: 'center' },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 34 },
                5: { cellWidth: 34 }
            },
            styles: { fontSize: 9, cellPadding: 3 }
        });
    }

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    if (cotizacion.observaciones) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Observaciones:", 14, finalY);
        doc.setFont("helvetica", "normal");
        const splitNotas = doc.splitTextToSize(cotizacion.observaciones, 182);
        doc.text(splitNotas, 14, finalY + 5);
    }

    // Pie de pagina
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Pagina ${i} de ${pageCount} - ${company.nombre}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    const fileLabel = isApproved ? 'Cotizacion_Aprobada' : 'Solicitud_Cotizacion';
    doc.save(`${fileLabel}_${cotizacion.numero}.pdf`);
};

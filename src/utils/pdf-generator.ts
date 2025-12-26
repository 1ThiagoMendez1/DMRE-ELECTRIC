import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Cotizacion } from "@/types/sistema";

export const generateQuotePDF = (cotizacion: Cotizacion, showMaterials: boolean = true) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- HEADER ---
    // Logo (Simulated with text/shape for now, assuming external image might be blocked)
    doc.setFillColor(255, 140, 0); // Primary Orange
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Company Info
    doc.setFontSize(22);
    doc.setTextColor(0, 50, 100);
    doc.text("D.M.R.E. S.A.S.", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Diseño y Montajes de Redes Eléctricas", 14, 26);
    doc.text("NIT: 900.123.456-7", 14, 31);
    doc.text("Calle 123 # 45-67, Bogotá D.C.", 14, 36);
    doc.text("Tel: (601) 123 4567 | info@dmre.com.co", 14, 41);

    // Quote Info Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(pageWidth - 80, 15, 65, 30, 2, 2, "F");

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("COTIZACIÓN", pageWidth - 70, 25);

    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0); // Red for number
    doc.text(`${cotizacion.numero}`, pageWidth - 70, 32);

    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(`Fecha: ${format(cotizacion.fecha, "dd MMMM yyyy", { locale: es })}`, pageWidth - 75, 40);

    // --- CLIENT INFO ---
    const startY = 55;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CLIENTE:", 14, startY);

    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.cliente.nombre, 40, startY);
    doc.text(`NIT/CC: ${cotizacion.cliente.documento}`, 40, startY + 5);
    doc.text(`Dirección: ${cotizacion.cliente.direccion}`, 40, startY + 10);
    doc.text(`Contacto: ${cotizacion.cliente.contactoPrincipal}`, 40, startY + 15);

    doc.line(14, startY + 20, pageWidth - 14, startY + 20);

    // --- BODY ---
    doc.setFont("helvetica", "bold");
    doc.text("Objeto:", 14, startY + 28);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(cotizacion.descripcionTrabajo, pageWidth - 30);
    doc.text(splitDesc, 30, startY + 28);

    // Table
    const tableStartY = startY + 35 + (splitDesc.length * 5);

    const tableHead = [["Item", "Descripción", "Cant", "Unidad", "V. Unitario", "Total"]];
    const tableBody = cotizacion.items.map((item, index) => [
        index + 1,
        item.descripcion,
        item.cantidad,
        "UND", // Assumption, add unity to item if exists
        `$ ${new Intl.NumberFormat('es-CO').format(item.valorUnitario)}`,
        `$ ${new Intl.NumberFormat('es-CO').format(item.valorTotal)}`
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: tableHead,
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [0, 50, 100] },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 15 },
            2: { cellWidth: 15 },
            4: { halign: 'right' },
            5: { halign: 'right' }
        }
    });

    // --- TOTALS ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const xPos = pageWidth - 60;

    doc.setFontSize(10);
    doc.text("Subtotal:", xPos, finalY);
    doc.text(`$ ${new Intl.NumberFormat('es-CO').format(cotizacion.subtotal)}`, pageWidth - 14, finalY, { align: "right" });

    doc.text("IVA (19%):", xPos, finalY + 5);
    doc.text(`$ ${new Intl.NumberFormat('es-CO').format(cotizacion.iva)}`, pageWidth - 14, finalY + 5, { align: "right" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", xPos, finalY + 12);
    doc.text(`$ ${new Intl.NumberFormat('es-CO').format(cotizacion.total)}`, pageWidth - 14, finalY + 12, { align: "right" });

    // --- FOOTER ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Esta cotización tiene una validez de 15 días calendario.", 14, finalY + 25);
    doc.text("Gracias por confiar en D.M.R.E.", 14, finalY + 30);

    // --- MATERIALS (OPTIONAL) ---
    if (showMaterials) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Anexo: Listado de Materiales", 14, 20);

        // Mock data for materials since cotizacion.items doesn't have deep material list details in type yet
        // using the description as a base
        const matBody = cotizacion.items.map((item, i) => [
            i + 1,
            `Materiales para ${item.descripcion}`,
            "Global",
            item.cantidad,
            "Disponibilidad Inmediata"
        ]);

        autoTable(doc, {
            startY: 30,
            head: [["#", "Material / Insumo", "Unidad", "Cant", "Obs"]],
            body: matBody,
            theme: 'grid'
        });
    }

    doc.save(`Cotizacion_${cotizacion.numero}.pdf`);
};

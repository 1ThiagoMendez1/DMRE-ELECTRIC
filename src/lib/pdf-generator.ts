import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./utils";

export const generateReceipt = async (data: any, preview: boolean = false) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Load Logo
    let logoData: string | null = null;
    try {
        const response = await fetch('/logo.png');
        if (response.ok) {
            const blob = await response.blob();
            logoData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error("Error loading logo for PDF", e);
    }

    if (logoData) {
        doc.addImage(logoData, 'PNG', 12, 10, 22, 22);
    }

    // Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Diseño y Montaje de Redes Electricas", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("D.M.R.E.", pageWidth / 2, 22, { align: "center" });
    
    doc.setFontSize(12);
    const tipoLabel = data.tipo === "INGRESO" ? "Registro de Ingresos" : "Registro de Egresos";
    doc.text(tipoLabel, pageWidth / 2, 29, { align: "center" });

    // Right header box
    doc.setFontSize(10);
    doc.rect(pageWidth - 60, 10, 50, 22);
    doc.text("SGI-DMRE-0818", pageWidth - 35, 15, { align: "center" });
    doc.text(new Date().toLocaleDateString(), pageWidth - 35, 21, { align: "center" });
    doc.text("Versión 2.0", pageWidth - 35, 28, { align: "center" });

    // Transaction Details
    autoTable(doc, {
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 9, halign: 'center' },
        headStyles: { fillColor: [220, 220, 220], textColor: 20 },
        body: [
            ['Fecha', data.fecha, 'Comprobante No.', data.id || 'Borrador'],
            ['Tercero', data.tercero || '-', 'Categoría', data.categoria || '-'],
            ['Identificación', data.identificacion || '-', 'Cuenta', data.cuentaNombre || '-']
        ]
    });

    // Concept & Value
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    autoTable(doc, {
        startY: finalY,
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: 20 },
        head: [['CONCEPTO', 'VALOR']],
        body: [
            [data.concepto || '-', formatCurrency(data.valor || 0)],
            ['', ''],
            ['', ''],
            ['', '']
        ],
        footStyles: { fillColor: [240, 240, 240], textColor: 20 },
        foot: [
            ['SUBTOTAL', formatCurrency(data.valor || 0)],
            ['RETENCIÓN', formatCurrency(0)],
            ['TOTAL', formatCurrency(data.valor || 0)],
            ['Metodo de Pago', data.cuentaNombre || '-']
        ]
    });

    // Signatures
    const sigY = (doc as any).lastAutoTable.finalY + 20;
    const sigWidth = 45;
    
    doc.line(15, sigY, 15 + sigWidth, sigY);
    doc.text("Nombre quien recibe", 15 + sigWidth/2, sigY + 5, { align: "center" });
    doc.text("CC", 15 + sigWidth/2, sigY + 10, { align: "center" });

    doc.line(70, sigY, 70 + sigWidth, sigY);
    doc.text("Elaborado por", 70 + sigWidth/2, sigY + 5, { align: "center" });
    doc.text("CC", 70 + sigWidth/2, sigY + 10, { align: "center" });

    doc.line(125, sigY, 125 + sigWidth, sigY);
    doc.text("Contabilizado por", 125 + sigWidth/2, sigY + 5, { align: "center" });
    doc.text("CC", 125 + sigWidth/2, sigY + 10, { align: "center" });

    if (preview) {
        return doc.output("bloburl");
    } else {
        doc.save(`Comprobante_${data.id || 'Borrador'}.pdf`);
        return null;
    }
};

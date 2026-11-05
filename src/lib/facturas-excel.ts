"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import type { Factura } from "@/types/sistema";

/** Exporta únicamente las facturas visibles con los filtros aplicados. */
export async function exportFacturasExcel(facturas: Factura[], monthFilter = "") {
    const book = new ExcelJS.Workbook();
    book.creator = "DMRE Electric";
    const sheet = book.addWorksheet("Facturación");
    sheet.columns = [
        { header: "Factura", key: "factura", width: 22 },
        { header: "Emisión", key: "fecha", width: 17 },
        { header: "Cliente", key: "cliente", width: 32 },
        { header: "NIT / Documento", key: "nit", width: 20 },
        { header: "Oferta", key: "oferta", width: 18 },
        { header: "Subtotal", key: "subtotal", width: 23 },
        { header: "Descuento", key: "descuento", width: 19 },
        { header: "Administración", key: "admin", width: 21 },
        { header: "Imprevistos", key: "imprevistos", width: 20 },
        { header: "Utilidad", key: "utilidad", width: 20 },
        { header: "IVA", key: "iva", width: 18 },
        { header: "Facturado", key: "facturado", width: 22 },
        { header: "ReteFuente", key: "retefuente", width: 19 },
        { header: "ReteICA", key: "reteica", width: 18 },
        { header: "ReteIVA", key: "reteiva", width: 18 },
        { header: "Retenciones", key: "retenciones", width: 19 },
        { header: "Pagado", key: "pagado", width: 20 },
        { header: "Saldo pendiente", key: "saldo", width: 22 },
        { header: "Estado", key: "estado", width: 16 },
    ];

    sheet.getRow(1).height = 30;
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };

    let totalFactura = 0, totalRetenciones = 0, totalPagado = 0, totalPendiente = 0;
    for (const f of facturas) {
        const subtotal = f.subtotal ?? Math.max(0, f.valorFacturado - (f.iva || 0));
        const desc = f.cotizacion?.descuentoGlobal;
        const adminPct = f.cotizacion?.aiuAdminGlobalPorcentaje;
        const imprePct = f.cotizacion?.aiuImprevistoGlobalPorcentaje;
        const utilPct = f.cotizacion?.aiuUtilidadGlobalPorcentaje;
        const ret = (f.retencionRenta || 0) + (f.retencionIca || 0) + (f.retencionIva || 0);
        const row = sheet.addRow({
            factura: f.numero || f.id,
            fecha: format(new Date(f.fechaEmision), "dd/MM/yyyy"),
            cliente: f.cliente?.nombre || f.cotizacion?.cliente?.nombre || "",
            nit: f.cliente?.documento || f.cotizacion?.cliente?.documento || "",
            oferta: f.cotizacion?.numero === "SIN-REF" ? "" : f.cotizacion?.numero || "",
            subtotal,
            descuento: desc ?? null,
            admin: adminPct == null ? null : Math.round(subtotal * adminPct) / 100,
            imprevistos: imprePct == null ? null : Math.round(subtotal * imprePct) / 100,
            utilidad: utilPct == null ? null : Math.round(subtotal * utilPct) / 100,
            iva: f.iva || 0,
            facturado: f.valorFacturado,
            retefuente: f.retencionRenta || 0,
            reteica: f.retencionIca || 0,
            reteiva: f.retencionIva || 0,
            retenciones: ret,
            pagado: f.valorPagado || 0,
            saldo: f.saldoPendiente,
            estado: f.estado,
        });
        for (let i = 6; i <= 18; i++) row.getCell(i).numFmt = '"$"#,##0.00';
        totalFactura += f.valorFacturado;
        totalRetenciones += ret;
        totalPagado += f.valorPagado || 0;
        totalPendiente += f.saldoPendiente;
    }
    const totalRow = sheet.addRow({
        factura: "TOTAL FILTRADO",
        facturado: totalFactura,
        retenciones: totalRetenciones,
        pagado: totalPagado,
        saldo: totalPendiente,
    });
    totalRow.font = { bold: true };
    for (let i = 12; i <= 18; i++) totalRow.getCell(i).numFmt = '"$"#,##0.00';
    if (facturas.length) sheet.autoFilter = { from: "A1", to: "S" + (facturas.length + 1) };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const buffer = await book.xlsx.writeBuffer();
    saveAs(
        new Blob([buffer as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Facturas_${monthFilter || "Todas"}_${format(new Date(), "yyyyMMdd")}.xlsx`,
    );
}

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { MovimientoFinanciero } from '@/types/sistema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExcelFilterState {
    mes?: string;
    ano?: string;
}

export const generateExcelReport = async (movimientos: MovimientoFinanciero[], filters?: ExcelFilterState) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DMRE';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Reporte Financiero');

    // --- Definir Columnas ---
    worksheet.columns = [
        { header: '', key: 'descripcion', width: 45 },
        { header: '', key: 'nit', width: 15 },
        { header: '', key: 'fecha', width: 15 },
        { header: '', key: 'ingresos', width: 20 },
        { header: '', key: 'egresos', width: 20 },
        { header: '', key: 'total', width: 20 }
    ];

    // --- Cargar Logo ---
    try {
        const response = await fetch('/logo.png');
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const logoImageId = workbook.addImage({
                buffer: arrayBuffer,
                extension: 'png',
            });
            // Añadir logo en A1:A6
            worksheet.addImage(logoImageId, {
                tl: { col: 0, row: 0 },
                br: { col: 1, row: 6 },
                editAs: 'oneCell'
            });
        }
    } catch (error) {
        console.error("Error al cargar el logo para Excel:", error);
    }

    // --- Cabeceras de Empresa ---
    
    // Título Principal
    worksheet.mergeCells('B1:F2');
    const titleCell = worksheet.getCell('B1');
    titleCell.value = 'DISEÑO Y MONTAJE DE REDES ELÉCTRICAS D.M.R.E';
    titleCell.font = { name: 'Arial', size: 16, italic: true, color: { argb: 'FF87CEEB' }, bold: true }; // Light blue cursive-like
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Nombre
    worksheet.mergeCells('B3:F3');
    const nameCell = worksheet.getCell('B3');
    nameCell.value = 'JENNY PAOLA ARDILA RUIZ';
    nameCell.font = { name: 'Arial', size: 11, italic: true, bold: true };
    nameCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // NIT
    worksheet.mergeCells('B4:F4');
    const nitCell = worksheet.getCell('B4');
    nitCell.value = 'NIT: 1075652753-9';
    nitCell.font = { name: 'Arial', size: 12, bold: true };
    nitCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dirección / Contacto
    worksheet.mergeCells('B5:F5');
    const contactCell = worksheet.getCell('B5');
    contactCell.value = 'CARRERA 4N° 5A - 36 INTERIOR 3 BARANDILLAS ZIPAQUIRÁ CEL: 3124074257 - 3115368577 TL 8816064';
    contactCell.font = { name: 'Arial', size: 10, italic: true, bold: true };
    contactCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Dejar fila 6 en blanco
    
    // --- Subcabecera (MES / AÑO) ---
    const mesActual = filters?.mes || format(new Date(), 'MMMM', { locale: es }).toUpperCase();
    const anoActual = filters?.ano || format(new Date(), 'yyyy');
    
    worksheet.getCell('B7').value = 'MES';
    worksheet.getCell('B7').font = { bold: true };
    worksheet.getCell('B7').alignment = { horizontal: 'center' };
    
    worksheet.getCell('C7').value = mesActual.toUpperCase();
    worksheet.getCell('C7').alignment = { horizontal: 'center' };
    
    worksheet.getCell('E7').value = 'AÑO';
    worksheet.getCell('E7').font = { bold: true };
    worksheet.getCell('E7').alignment = { horizontal: 'center' };
    
    worksheet.getCell('F7').value = anoActual;
    worksheet.getCell('F7').alignment = { horizontal: 'center' };

    // --- Cabeceras de Tabla ---
    const headers = ['DESCRIPCION INGRESOS Y GASTOS', 'NIT', 'FECHA', 'INGRESOS', 'EGRESOS', 'TOTAL'];
    const headerRow = worksheet.getRow(8);
    headerRow.values = headers;
    
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD3D3D3' } // Gris claro
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // --- Fila de Saldo Inicial (Opcional, se establece a 0 si no hay histórico previo al filtro) ---
    // Según la imagen hay un saldo inicial, por ahora lo omitiremos si no hay data de saldo inicial
    let runningTotal = 0;
    
    // Ordenar movimientos por fecha ascendente
    const sortedMovimientos = [...movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // --- Llenar Datos ---
    sortedMovimientos.forEach((mov) => {
        const row = worksheet.addRow({});
        
        const isIngreso = mov.tipo === 'INGRESO';
        const valor = Number(mov.valor) || 0;
        
        if (isIngreso) {
            runningTotal += valor;
        } else {
            runningTotal -= valor;
        }

        row.getCell('A').value = `${mov.concepto || ''} ${mov.tercero ? ` - ${mov.tercero}` : ''}`;
        row.getCell('B').value = mov.identificacion || '';
        row.getCell('C').value = format(new Date(mov.fecha), 'd/MM/yyyy');
        row.getCell('D').value = isIngreso ? valor : null;
        row.getCell('E').value = !isIngreso ? valor : null;
        row.getCell('F').value = runningTotal;

        // Estilos para la fila
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            
            // Formato de moneda para columnas numéricas
            if (colNumber >= 4) { // D, E, F
                cell.numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
            }
        });
    });

    // Ajustar alto de las primeras filas para el logo
    for (let i = 1; i <= 6; i++) {
        worksheet.getRow(i).height = 20; // Aproximado para dar espacio al logo
    }

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `Reporte_Financiero_${mesActual}_${anoActual}.xlsx`);
};

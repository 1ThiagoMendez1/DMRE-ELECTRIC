import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { CuentaBancaria, MovimientoFinanciero } from '@/types/sistema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ExcelFilterState {
    mes?: string;
    ano?: string;
    cuentaId?: string;
}

export interface ExcelReportOptions {
    cuentas?: CuentaBancaria[];
    allMovimientos?: MovimientoFinanciero[];
}

export const generateExcelReport = async (
    movimientos: MovimientoFinanciero[],
    filters?: ExcelFilterState,
    options?: ExcelReportOptions
) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'DMRE';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Reporte Financiero');

    // --- Definir Columnas ---
    worksheet.columns = [
        { header: '', key: 'descripcion', width: 48 },
        { header: '', key: 'nit', width: 16 },
        { header: '', key: 'fecha', width: 14 },
        { header: '', key: 'ingresos', width: 20 },
        { header: '', key: 'egresos', width: 20 },
        { header: '', key: 'total', width: 22 }
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
                tl: { col: 0, row: 0 } as any,
                br: { col: 1, row: 6 } as any,
                editAs: 'oneCell'
            });
        }
    } catch (error) {
        console.error("Error al cargar el logo para Excel:", error);
    }

    // --- Identificar Cuenta y Saldo Inicial ---
    const cuentas = options?.cuentas || [];
    const allMovimientos = options?.allMovimientos || movimientos;

    // Detectar si el reporte es para una cuenta específica o si todos los movimientos pertenecen a una misma cuenta
    let selectedCuenta: CuentaBancaria | undefined;
    if (filters?.cuentaId && filters.cuentaId !== 'TODOS') {
        selectedCuenta = cuentas.find(c => c.id === filters.cuentaId);
    }

    // Si no vino especificado en filtros, verificar si todos los movimientos pertenecen a la misma cuenta
    if (!selectedCuenta && movimientos.length > 0) {
        const uniqueCuentaIds = Array.from(new Set(
            movimientos.map(m => m.cuentaId || (m.cuenta && m.cuenta.id)).filter(Boolean)
        ));
        if (uniqueCuentaIds.length === 1) {
            selectedCuenta = cuentas.find(c => c.id === uniqueCuentaIds[0]) || (movimientos[0].cuenta as CuentaBancaria);
        }
    }

    // --- Cabeceras de Empresa ---
    
    // Título Principal
    worksheet.mergeCells('B1:F2');
    const titleCell = worksheet.getCell('B1');
    titleCell.value = 'DISEÑO Y MONTAJE DE REDES ELÉCTRICAS D.M.R.E';
    titleCell.font = { name: 'Arial', size: 16, italic: true, color: { argb: 'FF87CEEB' }, bold: true };
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

    // Fila 6: Detalle de Cuenta si está seleccionada
    if (selectedCuenta) {
        worksheet.mergeCells('B6:F6');
        const cuentaHeaderCell = worksheet.getCell('B6');
        cuentaHeaderCell.value = `CUENTA: ${selectedCuenta.nombre.toUpperCase()}${selectedCuenta.numeroCuenta ? ` - N° ${selectedCuenta.numeroCuenta}` : ''}${selectedCuenta.banco ? ` (${selectedCuenta.banco})` : ''}`;
        cuentaHeaderCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1F4E79' } };
        cuentaHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    
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

    // --- Cabeceras de Tabla (Fila 8) ---
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

    // Ordenar movimientos por fecha ascendente
    const sortedMovimientos = [...movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // --- Cálculo del Saldo Inicial / Anterior ---
    let saldoInicialPeriodo = 0;

    if (selectedCuenta) {
        const accountId = selectedCuenta.id;
        const firstMovTime = sortedMovimientos.length > 0 ? new Date(sortedMovimientos[0].fecha).getTime() : Date.now();
        
        // Movimientos históricos de esta cuenta
        const accountMovs = allMovimientos.filter(m => 
            (m.cuentaId === accountId || (m.cuenta && m.cuenta.id === accountId)) && !m.esSimple
        );
        
        // Movimientos anteriores al inicio del reporte
        const priorMovs = accountMovs.filter(m => new Date(m.fecha).getTime() < firstMovTime);
        const priorNet = priorMovs.reduce((sum, m) => sum + (m.tipo === 'INGRESO' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0);

        // Si la cuenta tiene saldoInicial explícito > 0
        if (selectedCuenta.saldoInicial !== undefined && selectedCuenta.saldoInicial !== null && Number(selectedCuenta.saldoInicial) > 0) {
            saldoInicialPeriodo = Number(selectedCuenta.saldoInicial) + priorNet;
        } else {
            // Reconstruir a partir del saldoActual actual
            const allNet = accountMovs.reduce((sum, m) => sum + (m.tipo === 'INGRESO' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0);
            const saldoAlInicio = Number(selectedCuenta.saldoActual || 0) - allNet;
            saldoInicialPeriodo = saldoAlInicio + priorNet;
        }
    } else if (sortedMovimientos.length > 0) {
        // Reporte consolidado de múltiples cuentas
        const uniqueCuentaIds = Array.from(new Set(
            sortedMovimientos.map(m => m.cuentaId || (m.cuenta && m.cuenta.id)).filter(Boolean)
        ));
        
        const firstMovTime = new Date(sortedMovimientos[0].fecha).getTime();

        uniqueCuentaIds.forEach(accId => {
            const cuentaObj = cuentas.find(c => c.id === accId);
            if (!cuentaObj) return;

            const accountMovs = allMovimientos.filter(m => 
                (m.cuentaId === accId || (m.cuenta && m.cuenta.id === accId)) && !m.esSimple
            );
            const priorMovs = accountMovs.filter(m => new Date(m.fecha).getTime() < firstMovTime);
            const priorNet = priorMovs.reduce((sum, m) => sum + (m.tipo === 'INGRESO' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0);

            if (cuentaObj.saldoInicial !== undefined && cuentaObj.saldoInicial !== null && Number(cuentaObj.saldoInicial) > 0) {
                saldoInicialPeriodo += Number(cuentaObj.saldoInicial) + priorNet;
            } else {
                const allNet = accountMovs.reduce((sum, m) => sum + (m.tipo === 'INGRESO' ? Number(m.valor || 0) : -Number(m.valor || 0)), 0);
                const saldoAlInicio = Number(cuentaObj.saldoActual || 0) - allNet;
                saldoInicialPeriodo += saldoAlInicio + priorNet;
            }
        });
    }

    let runningTotal = saldoInicialPeriodo;
    let currentRowIdx = 8;

    // Fila de SALDO INICIAL / ANTERIOR (Fila 9)
    if (sortedMovimientos.length > 0) {
        currentRowIdx++;
        const initialRow = worksheet.addRow({});
        const firstFechaStr = format(new Date(sortedMovimientos[0].fecha), 'd/MM/yyyy');

        initialRow.getCell('A').value = selectedCuenta 
            ? `SALDO ANTERIOR / INICIAL (${selectedCuenta.nombre})`
            : 'SALDO ANTERIOR / INICIAL';
        initialRow.getCell('A').font = { bold: true };
        initialRow.getCell('B').value = '';
        initialRow.getCell('C').value = firstFechaStr;
        initialRow.getCell('C').alignment = { horizontal: 'center' };
        initialRow.getCell('D').value = null;
        initialRow.getCell('E').value = null;
        initialRow.getCell('F').value = saldoInicialPeriodo;
        initialRow.getCell('F').font = { bold: true };

        initialRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            if (colNumber >= 4) {
                cell.numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
            }
        });
    }

    // --- Llenar Datos de Movimientos (Fila 10 en adelante) ---
    sortedMovimientos.forEach((mov) => {
        currentRowIdx++;
        const row = worksheet.addRow({});
        
        const isIngreso = mov.tipo === 'INGRESO';
        const valor = Number(mov.valor) || 0;
        
        if (isIngreso) {
            runningTotal += valor;
        } else {
            runningTotal -= valor;
        }

        let concepto = mov.concepto || '';
        let nit = mov.identificacion || '';
        const idMatch = concepto.match(/\(ID:\s*([^)]+)\)/i) || concepto.match(/\(NIT:\s*([^)]+)\)/i);
        if (idMatch) {
            if (!nit) nit = idMatch[1].trim();
            concepto = concepto.replace(idMatch[0], '').trim();
        }
        concepto = concepto.replace(/\(IVA:\s*[^)]+\)/gi, '').replace(/\s+/g, ' ').trim();

        const terceroText = mov.tercero && mov.tercero !== 'Sin tercero' ? ` - ${mov.tercero}` : '';
        const cuentaBadge = (!selectedCuenta && mov.cuenta?.nombre) ? ` [${mov.cuenta.nombre}]` : '';

        row.getCell('A').value = `${concepto}${terceroText}${cuentaBadge}`;
        row.getCell('B').value = nit;
        row.getCell('C').value = format(new Date(mov.fecha), 'd/MM/yyyy');
        row.getCell('C').alignment = { horizontal: 'center' };
        row.getCell('D').value = isIngreso ? valor : null;
        row.getCell('E').value = !isIngreso ? valor : null;

        // Fórmula dinámica en Excel: Total anterior + Ingresos - Egresos
        const prevRowIdx = currentRowIdx - 1;
        row.getCell('F').value = {
            formula: `F${prevRowIdx}+D${currentRowIdx}-E${currentRowIdx}`,
            result: runningTotal
        };

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
        worksheet.getRow(i).height = 20;
    }

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const cuentaSuffix = selectedCuenta ? `_${selectedCuenta.nombre.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    saveAs(blob, `Reporte_Financiero${cuentaSuffix}_${mesActual}_${anoActual}.xlsx`);
};

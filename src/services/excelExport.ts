import * as XLSX from 'xlsx';
import { MesFinanciero } from '../types';

function sanitizeExcelCell(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^[=+\-@]/.test(trimmed)) {
      return "'" + trimmed;
    }
    return trimmed;
  }
  return val;
}

export function generateExcelWorkbook(month: MesFinanciero): string {
  const wb = XLSX.utils.book_new();

  // 1. Pestaña del Mes en Curso (idéntica a la original de Google Sheets)
  const rows: any[][] = [];
  rows.push([sanitizeExcelCell(month.titulo || month.nombre)]); // Fila 1 (A1)
  
  // Metas en columnas G (col 6) e I (col 8)
  const meta1 = month.metas[0] || { nombre: 'Fondo de Emergencia', acumulado: 0 };
  const meta2 = month.metas[1] || { nombre: 'Meta Principal (Auto / Viaje)', acumulado: 0 };
  const meta3 = month.metas[2] || { nombre: 'Inversiones / Cuentas', acumulado: 0 };

  const r2 = new Array(9).fill('');
  r2[6] = meta1.nombre;
  r2[8] = meta1.acumulado;
  rows.push(r2);

  const r3 = new Array(9).fill('');
  r3[6] = meta2.nombre;
  r3[8] = meta2.acumulado;
  rows.push(r3);

  const r4 = new Array(9).fill('');
  r4[6] = meta3.nombre;
  r4[8] = meta3.acumulado;
  rows.push(r4);

  rows.push([]); // Fila 5
  rows.push([]); // Fila 6

  // Fila 7: Encabezados
  rows.push(['Tipo', 'Categoría', 'Descripción', 'Monto', 'Pagado']);

  // Filas 8+: Movimientos
  month.movimientos.forEach(m => {
    rows.push([
      sanitizeExcelCell(m.tipo),
      sanitizeExcelCell(m.categoria),
      sanitizeExcelCell(m.descripcion),
      typeof m.monto === 'number' ? m.monto : Number(m.monto) || 0,
      m.pagado ? 'VERDADERO' : 'FALSO'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Mes en curso');

  // 2. Pestaña Resumen
  const summaryRows = [
    ['✨ Finanzas Fáciles — Reporte Exportado'],
    ['Mes:', month.nombre],
    ['Sueldo Base:', month.sueldoBase],
    ['Total Fondos de Ahorro:', month.metas.reduce((acc, m) => acc + m.acumulado, 0)],
    ['Fecha de Exportación:', new Date().toLocaleString('es-CO')]
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

  // Generar base64
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  return wbout;
}

export function downloadExcelWeb(base64Data: string, fileName: string = 'Finanzas_Faciles.xlsx'): void {
  try {
    const link = document.createElement('a');
    link.href = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.warn('Descarga no compatible en este entorno');
  }
}

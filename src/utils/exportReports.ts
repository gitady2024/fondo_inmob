import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { fmtMoneda, formatFecha } from './calculations';

// ============================================================================
// 1. EXPORTACIÓN PDF: FICHA DE CUENTA CORRIENTE INDIVIDUAL
// ============================================================================
export const exportarFichaSocioPDF = (
  socio: FlujoSocioCalculado,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string,
  mesSimulado: number = 0
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const mPos = socio.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
  const fechaFin = formatFecha(fechaInicio, socio.mesesTotales);
  const fechaEmision = new Date().toLocaleDateString('es-AR');

  // Encabezado institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Ficha Oficial de Cuenta Corriente Individual e Historial de Cuotas', 14, 22);
  doc.text(`Fecha de Emisión: ${fechaEmision} | Sistema FONDO INMOBIL`, 14, 28);

  // Cuadro informativo del Socio
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 42, 182, 34, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TITULAR: SOCIO D${socio.socioId} (UNIDAD / DEPTO ${socio.socioId})`, 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  // Columna 1
  doc.text(`Valor Inmueble Base: ${fmtMoneda(params.costoDepto)}`, 20, 58);
  doc.text(`Anticipo Mes 0 Integrado: ${fmtMoneda(socio.anticipoMes0)}`, 20, 64);
  doc.text(`Forma Pago Gastos: ${gastos.formaPagoGastos === 'final' ? 'Contado al adjudicar' : 'Prorrateado mes a mes'}`, 20, 70);

  // Columna 2
  doc.text(`Posesión Programada: Cuota ${mPos} (${fechaPos.fechaLarga})`, 110, 58);
  doc.text(`Cancelación Total: Cuota ${socio.mesesTotales} (${fechaFin.fechaLarga})`, 110, 64);
  doc.text(`Costo Total Final Plan: ${fmtMoneda(socio.totalAbonado)}`, 110, 70);

  // Calcular acumulado
  let abonadoActual = socio.anticipoMes0;
  for (const m of socio.flujo) {
    if (m.mes <= mesSimulado) abonadoActual += m.abonadoMes;
  }
  const saldoPendiente = Math.max(0, socio.totalAbonado - abonadoActual);

  // Resumen de estado actual
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(14, 80, 182, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text(
    `ESTADO A CUOTA ${mesSimulado}: Integrado: ${fmtMoneda(abonadoActual)} (${((abonadoActual / socio.totalAbonado) * 100).toFixed(1)}%) | Saldo Remanente: ${fmtMoneda(saldoPendiente)}`,
    20,
    89
  );

  // Tabla de cuotas
  const rows: any[] = [];

  // Fila Mes 0
  rows.push([
    'Mes 0',
    '-',
    'Anticipo de Suscripción / Entrega Inicial',
    fmtMoneda(socio.anticipoMes0),
    fmtMoneda(socio.anticipoMes0),
    fmtMoneda(params.costoDepto - socio.anticipoMes0),
    'Integrado'
  ]);

  socio.flujo.forEach((f) => {
    const fecha = formatFecha(fechaInicio, f.mes);
    let strConcepto = 'Cuota Mensual Inmueble';
    if (f.porcentajeAjuste) strConcepto += ` (+${f.porcentajeAjuste}% Ajuste)`;
    if (f.adelanto > 0) strConcepto += ` + Adelanto (${fmtMoneda(f.adelanto)})`;
    if (f.mes === mPos && socio.pagoFinalGastos > 0) strConcepto += ` + Gastos Adjudicación (${fmtMoneda(socio.pagoFinalGastos)})`;
    else if (socio.recargoGastosPorCuota > 0) strConcepto += ` + Gastos Prorrateados (${fmtMoneda(socio.recargoGastosPorCuota)})`;

    let hito = 'Devengado';
    if (f.mes === socio.mesesTotales) hito = 'Cancelado 100%';
    else if (f.mes === mPos) hito = 'Posesión / Llaves';
    else if (f.mes === mesSimulado && mesSimulado > 0) hito = 'Cuota Actual';

    rows.push([
      `Cuota ${f.mes}`,
      fecha.fechaCorta,
      strConcepto,
      fmtMoneda(f.abonadoMes),
      fmtMoneda(f.totalAcumulado),
      fmtMoneda(f.saldoRemanente),
      hito
    ]);
  });

  autoTable(doc, {
    startY: 98,
    head: [['Cuota', 'Fecha', 'Concepto Liquidado', 'Abonado Mes', 'Total Acum.', 'Saldo Rem.', 'Hito / Estado']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'left', cellWidth: 62 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 24 }
    },
    didDrawPage: () => {
      // Pie de página
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Fondo Inmobiliario de Ahorro Previo Mutuo - Documento Válido como Estado de Cuenta - Página ${doc.getNumberOfPages()}`,
        14,
        290
      );
    }

  });

  doc.save(`Ficha_Cuenta_Corriente_Socio_D${socio.socioId}.pdf`);
};

// ============================================================================
// 2. EXPORTACIÓN EXCEL: FICHA DE SIMULACIÓN Y ESTADO DE CUENTA INDIVIDUAL
// ============================================================================
export const exportarFichaSocioExcel = (
  socio: FlujoSocioCalculado,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string
) => {
  const mPos = socio.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
  const fechaFin = formatFecha(fechaInicio, socio.mesesTotales);

  const headerInfo = [
    ['FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO'],
    ['ESTADO DE CUENTA CORRIENTE Y SIMULACIÓN INDIVIDUAL'],
    ['Fecha de Emisión:', new Date().toLocaleDateString('es-AR')],
    ['Titular:', `Socio D${socio.socioId} (Depto ${socio.socioId})`],
    ['Valor Departamento ($):', params.costoDepto],
    ['Anticipo Mes 0 ($):', socio.anticipoMes0],
    ['Posesión Programada:', `Cuota ${mPos} (${fechaPos.fechaLarga})`],
    ['Cancelación Plan:', `Cuota ${socio.mesesTotales} (${fechaFin.fechaLarga})`],
    ['Costo Total Final ($):', socio.totalAbonado],
    ['Forma de Pago de Gastos:', gastos.formaPagoGastos === 'final' ? 'Contado al adjudicar' : 'Prorrateado mes a mes'],
    [] // línea en blanco
  ];

  const tableHead = [
    'Cuota / Mes',
    'Fecha (MM/AA)',
    'Concepto Liquidado',
    'Capital Inmueble ($)',
    'Gastos ($)',
    'Adelanto ($)',
    'Abonado en el Mes ($)',
    'Total Acumulado ($)',
    'Saldo Remanente ($)',
    'Hito / Estado'
  ];

  const tableRows: any[] = [
    [
      'Mes 0',
      '-',
      'Anticipo de Suscripción / Entrega Inicial',
      socio.anticipoMes0,
      0,
      0,
      socio.anticipoMes0,
      socio.anticipoMes0,
      params.costoDepto - socio.anticipoMes0,
      'Integrado'
    ]
  ];

  socio.flujo.forEach((f) => {
    const fecha = formatFecha(fechaInicio, f.mes);
    let strConcepto = 'Cuota Mensual Inmueble';
    if (f.porcentajeAjuste) strConcepto += ` (+${f.porcentajeAjuste}% Ajuste)`;
    if (f.adelanto > 0) strConcepto += ` + Adelanto (${fmtMoneda(f.adelanto)})`;
    if (f.mes === mPos && socio.pagoFinalGastos > 0) strConcepto += ` + Gastos Adjudicación (${fmtMoneda(socio.pagoFinalGastos)})`;
    else if (socio.recargoGastosPorCuota > 0) strConcepto += ` + Gastos Prorrateados (${fmtMoneda(socio.recargoGastosPorCuota)})`;

    let hito = 'Devengado';
    if (f.mes === socio.mesesTotales) hito = 'Cancelado 100%';
    else if (f.mes === mPos) hito = 'Posesión / Llaves';

    tableRows.push([
      `Cuota ${f.mes}`,
      fecha.fechaCorta,
      strConcepto,
      f.capital,
      f.gastos,
      f.adelanto,
      f.abonadoMes,
      f.totalAcumulado,
      f.saldoRemanente,
      hito
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, tableHead, ...tableRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Socio D${socio.socioId}`);
  XLSX.writeFile(wb, `Simulacion_Socio_D${socio.socioId}.xlsx`);
};

// ============================================================================
// 3. EXPORTACIÓN EXCEL: RESUMEN CONSOLIDADO DE TODO EL CÍRCULO
// ============================================================================
export const exportarConsolidadoExcel = (
  flujosSocios: FlujoSocioCalculado[],
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string,
  adjudicacionFijada: Record<number, number>
) => {
  const headerInfo = [
    ['FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO'],
    ['RESUMEN CONSOLIDADO DEL CÍRCULO INMOBILIARIO'],
    ['Fecha de Emisión:', new Date().toLocaleDateString('es-AR')],
    ['Cantidad de Socios/Unidades:', params.cantidadDeptos],
    ['Valor por Departamento ($):', params.costoDepto],
    ['Plazo Máximo en Cuotas:', params.cantidadCuotas],
    ['Comisión Gestión (%):', `${gastos.comisionGestion}%`],
    ['Comisión Escribanía (%):', `${gastos.comisionEscribania}%`],
    []
  ];

  const tableHead = [
    'Socio / Unidad',
    'Anticipo Mes 0 ($)',
    'Cuota Inmueble Inicial ($)',
    'Recargo Gastos ($)',
    'Cuota Final / Mes ($)',
    'Cuota Posesión',
    'Fecha Posesión',
    'Extra al Adjudicar ($)',
    'Total Abonado en el Plan ($)',
    'Estado Titular'
  ];

  let tAnt = 0;
  let tInm = 0;
  let tGastos = 0;
  let tFin = 0;
  let tExtra = 0;
  let tAbon = 0;

  const tableRows = flujosSocios.map((p) => {
    tAnt += p.anticipoMes0;
    tInm += p.cuotaInmInicial;
    tGastos += p.recargoGastosPorCuota;
    tFin += p.cuotaFinInicial;
    tExtra += p.pagoFinalGastos;
    tAbon += p.totalAbonado;

    const fechaPos = formatFecha(fechaInicio, p.cuotaPosesion);
    const estado = adjudicacionFijada[p.socioId] !== undefined ? 'Posesión Fija' : 'Plan Regular';

    return [
      `Socio D${p.socioId}`,
      p.anticipoMes0,
      p.cuotaInmInicial,
      p.recargoGastosPorCuota,
      p.cuotaFinInicial,
      `Cuota ${p.cuotaPosesion}`,
      fechaPos.fechaCorta,
      p.pagoFinalGastos,
      p.totalAbonado,
      estado
    ];
  });

  const totalsRow = [
    'TOTALES:',
    tAnt,
    tInm,
    tGastos,
    tFin,
    '-',
    '-',
    tExtra,
    tAbon,
    '100% Financiado'
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headerInfo, tableHead, ...tableRows, totalsRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidado Círculo');
  XLSX.writeFile(wb, 'Consolidado_Circulo_Inmobiliario.xlsx');
};

// ============================================================================
// 4. EXPORTACIÓN PDF: RESUMEN CONSOLIDADO EN FORMATO APAISADO (LANDSCAPE)
// ============================================================================
export const exportarConsolidadoPDF = (
  flujosSocios: FlujoSocioCalculado[],
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string,
  adjudicacionFijada: Record<number, number>
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Encabezado
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Informe Maestro Consolidado | ${params.cantidadDeptos} Deptos | Valor: ${fmtMoneda(params.costoDepto)} | Plazo: ${params.cantidadCuotas} cuotas | Gestión: ${gastos.comisionGestion}% | Escribanía: ${gastos.comisionEscribania}%`,
    14,
    22
  );
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')} | FONDO INMOBIL`, 14, 27);


  let tAnt = 0;
  let tInm = 0;
  let tGastos = 0;
  let tFin = 0;
  let tExtra = 0;
  let tAbon = 0;

  const rows = flujosSocios.map((p) => {
    tAnt += p.anticipoMes0;
    tInm += p.cuotaInmInicial;
    tGastos += p.recargoGastosPorCuota;
    tFin += p.cuotaFinInicial;
    tExtra += p.pagoFinalGastos;
    tAbon += p.totalAbonado;

    const fechaPos = formatFecha(fechaInicio, p.cuotaPosesion);
    const estado = adjudicacionFijada[p.socioId] !== undefined ? 'Posesión Fija' : 'Plan Regular';

    return [
      `Socio D${p.socioId}`,
      fmtMoneda(p.anticipoMes0),
      fmtMoneda(p.cuotaInmInicial),
      fmtMoneda(p.recargoGastosPorCuota),
      `${fmtMoneda(p.cuotaFinInicial)}/m`,
      `Cuota ${p.cuotaPosesion}`,
      fechaPos.fechaCorta,
      fmtMoneda(p.pagoFinalGastos),
      fmtMoneda(p.totalAbonado),
      estado
    ];
  });

  const footRow = [
    'Totales:',
    fmtMoneda(tAnt),
    `${fmtMoneda(tInm)}/m`,
    `${fmtMoneda(tGastos)}/m`,
    `${fmtMoneda(tFin)}/m`,
    '-',
    '-',
    fmtMoneda(tExtra),
    fmtMoneda(tAbon),
    '100% Financiado'
  ];

  autoTable(doc, {
    startY: 38,
    head: [[
      'Socio / Unidad',
      'Anticipo Mes 0',
      'Cuota Inmueble',
      'Recargo Gastos',
      'Cuota Final / Mes',
      'Posesión',
      'Fecha Pos.',
      'Extra Adjudicar',
      'Total Abonado',
      'Estado'
    ]],
    body: rows,
    foot: [footRow],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    footStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
      9: { halign: 'center' }
    }
  });

  doc.save('Consolidado_Circulo_Inmobiliario.pdf');
};

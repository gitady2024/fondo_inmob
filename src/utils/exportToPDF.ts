import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { fmtMoneda, formatFecha } from './calculations';

export const exportarReporteEjecutivoPDF = async (
  socio: FlujoSocioCalculado,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string,
  nombreFondo: string = 'Fondo Inmobiliario'
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

  // Header Banner institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Reporte Ejecutivo y Cuadro de Marcha Financiero • ${nombreFondo}`, 14, 21);
  doc.text(`Emisión: ${fechaEmision} | Marco Regulatorio Ley 24.441 & CCCN`, 14, 27);

  // Tarjeta de Datos del Socio & Parámetros
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 42, 182, 34, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`TITULAR ASIGNADO: SOCIO D${socio.socioId} (UNIDAD FUNCIONAL ${socio.socioId})`, 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600

  // Columnas de Datos Clave
  doc.text(`Valor de la Unidad: ${fmtMoneda(params.costoDepto)}`, 20, 57);
  doc.text(`Anticipo Mes 0: ${fmtMoneda(socio.anticipoMes0)}`, 20, 63);
  doc.text(`Forma Pago Gastos: ${gastos.formaPagoGastos === 'final' ? 'Contado al adjudicar' : 'Prorrateado en cuotas'}`, 20, 69);

  doc.text(`Posesión: Cuota ${mPos} (${fechaPos.fechaLarga})`, 110, 57);
  doc.text(`Cancelación Total: Cuota ${socio.mesesTotales} (${fechaFin.fechaLarga})`, 110, 63);
  doc.text(`Costo Total Estimado: ${fmtMoneda(socio.totalAbonado)}`, 110, 69);

  // Tabla con autoTable
  const bodyRows: any[] = [
    [
      'Mes 0',
      '-',
      'Anticipo de Suscripción / Entrega Inicial',
      fmtMoneda(socio.anticipoMes0),
      fmtMoneda(socio.anticipoMes0),
      fmtMoneda(params.costoDepto - socio.anticipoMes0),
      'Aporte Inicial'
    ]
  ];

  for (const f of socio.flujo) {
    const { fechaCorta } = formatFecha(fechaInicio, f.mes);
    let strConcepto = 'Cuota Mensual Inmueble';
    if (f.porcentajeAjuste) strConcepto += ` (+${f.porcentajeAjuste}% CAC)`;
    if (f.adelanto > 0) strConcepto += ` + Adelanto (${fmtMoneda(f.adelanto)})`;
    if (f.mes === mPos && socio.pagoFinalGastos > 0) {
      strConcepto += ` + Gastos Adjudicación (${fmtMoneda(socio.pagoFinalGastos)})`;
    } else if (socio.recargoGastosPorCuota > 0) {
      strConcepto += ` + Gastos Prorrateados (${fmtMoneda(socio.recargoGastosPorCuota)})`;
    }

    let hito = 'Devengado';
    if (f.mes === socio.mesesTotales) hito = 'Cancelado 100%';
    else if (f.mes === mPos) hito = 'Posesión Llaves';

    bodyRows.push([
      `Cuota ${f.mes}`,
      fechaCorta,
      strConcepto,
      fmtMoneda(f.abonadoMes),
      fmtMoneda(f.totalAcumulado),
      fmtMoneda(f.saldoRemanente),
      hito
    ]);
  }

  autoTable(doc, {
    startY: 82,
    head: [
      ['Cuota', 'Fecha', 'Concepto Liquidado', 'Abonado Mes', 'Total Acum.', 'Saldo Restante', 'Hito / Estado']
    ],
    body: bodyRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
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
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Documento de Carácter Orientativo • Sujeto a contrato de fiducia y normativa IGJ/CNV • Página ${doc.getNumberOfPages()}`,
        14,
        290
      );
    }
  });

  doc.save(`Reporte_Ejecutivo_Socio_D${socio.socioId}_${nombreFondo.replace(/\s+/g, '_')}.pdf`);
};

export default exportarReporteEjecutivoPDF;

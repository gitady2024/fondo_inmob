import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { formatFecha } from './calculations';

export const exportarCuadroMarchaCSV = (
  socio: FlujoSocioCalculado,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  fechaInicio: string,
  nombreFondo: string = 'Fondo Inmobiliario'
) => {
  const mPos = socio.cuotaPosesion;
  const mesesTotales = socio.mesesTotales;

  // Cabecera institucional
  const rows: string[][] = [
    ['FONDO INMOBILIARIO DE AHORRO PREVIO MUTUO - CUADRO DE MARCHA OFICIAL'],
    [`Plan / Fondo: ${nombreFondo}`],
    [`Titular: Socio D${socio.socioId}`],
    [`Valor Inmueble Base: ${params.costoDepto}`, `Cuotas Totales: ${params.cantidadCuotas}`, `Anticipo Mes 0: ${socio.anticipoMes0}`],
    [`Gastos: ${gastos.formaPagoGastos === 'final' ? 'Al Adjudicar' : 'Prorrateados'}`, `Fecha Inicio: ${fechaInicio}`],
    [], // fila vacía separadora
    ['Cuota', 'Fecha', 'Concepto Liquidado', 'Abonado en Mes ($)', 'Total Acumulado ($)', 'Saldo Remanente ($)', 'Hito / Estado']
  ];

  // Mes 0
  rows.push([
    'Mes 0',
    '-',
    'Anticipo de Suscripción / Entrega Inicial',
    socio.anticipoMes0.toString(),
    socio.anticipoMes0.toString(),
    Math.max(0, params.costoDepto - socio.anticipoMes0).toString(),
    'Integrado Inicial'
  ]);

  // Cuotas 1 a N
  for (const f of socio.flujo) {
    const { fechaCorta } = formatFecha(fechaInicio, f.mes);
    
    let concepto = 'Cuota Mensual Inmueble';
    if (f.porcentajeAjuste) concepto += ` (+${f.porcentajeAjuste}% CAC)`;
    if (f.adelanto > 0) concepto += ` + Adelanto (${f.adelanto})`;
    if (f.mes === mPos && socio.pagoFinalGastos > 0) {
      concepto += ` + Gastos Adjudicación (${socio.pagoFinalGastos})`;
    } else if (socio.recargoGastosPorCuota > 0) {
      concepto += ` + Gastos Prorrateados (${Math.round(socio.recargoGastosPorCuota)})`;
    }

    let hito = 'Devengado';
    if (f.mes === mesesTotales) hito = 'Cancelado 100%';
    else if (f.mes === mPos) hito = 'Posesión / Llaves';

    rows.push([
      `Cuota ${f.mes}`,
      fechaCorta,
      `"${concepto.replace(/"/g, '""')}"`,
      Math.round(f.abonadoMes).toString(),
      Math.round(f.totalAcumulado).toString(),
      Math.round(f.saldoRemanente).toString(),
      `"${hito}"`
    ]);
  }

  // Generar contenido CSV con BOM UTF-8
  const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Cuadro_Marcha_Socio_D${socio.socioId}_${fechaInicio}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportarResumenConsolidadoCSV = (
  flujosSocios: FlujoSocioCalculado[],
  params: ParametrosFondoState,
  fechaInicio: string,
  nombreFondo: string = 'Fondo Inmobiliario'
) => {
  const rows: string[][] = [
    ['FONDO INMOBILIARIO - RESUMEN CONSOLIDADO DE SOCIOS'],
    [`Plan: ${nombreFondo}`, `Fecha Inicio: ${fechaInicio}`, `Unidades: ${params.cantidadDeptos}`],
    [],
    ['Socio', 'Anticipo Mes 0 ($)', 'Cuota Inicial ($)', 'Cuota Actual ($)', 'Cuota Posesión', 'Fecha Posesión', 'Cuotas Totales', 'Total Plan ($)']
  ];

  for (const s of flujosSocios) {
    const { fechaCorta } = formatFecha(fechaInicio, s.cuotaPosesion);
    rows.push([
      `Socio D${s.socioId}`,
      Math.round(s.anticipoMes0).toString(),
      Math.round(s.cuotaInmInicial).toString(),
      Math.round(s.cuotaInmActual || s.cuotaInmInicial).toString(),
      `Mes ${s.cuotaPosesion}`,
      fechaCorta,
      s.mesesTotales.toString(),
      Math.round(s.totalAbonado).toString()
    ]);
  }

  const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Resumen_Consolidado_${nombreFondo.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default exportarCuadroMarchaCSV;

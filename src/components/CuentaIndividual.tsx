import React, { useState, useMemo } from 'react';
import type { FlujoSocioCalculado, FormaPagoGastos, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { fmtMoneda, formatFecha } from '../utils/calculations';
import { exportarFichaSocioPDF, exportarFichaSocioExcel } from '../utils/exportReports';
import { SmartFilters } from './common/SmartFilters';
import type { FilterMode } from './common/SmartFilters';
import { MobileCardsList } from './common/MobileCardsList';
import type { ResumenMesCardItem } from './common/MobileCardsList';
import {
  User,
  Printer,
  KeyRound,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';

interface CuentaIndividualProps {
  cantidadSocios: number;
  socioSeleccionado: number;
  flujoSocio: FlujoSocioCalculado;
  fechaInicio: string;
  costoDepto: number;
  formaPagoGastos: FormaPagoGastos;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  onSelectSocio: (socioId: number) => void;
  onAdjudicacionChange: (socioId: number, cuota: number) => void;
  userIsGuest?: boolean;
  cesionInfo?: {
    activo: boolean;
    mes: number;
    porcentajePrima: number;
    costoUnidad: number;
  };
}

export const CuentaIndividual: React.FC<CuentaIndividualProps> = ({
  cantidadSocios,
  socioSeleccionado,
  flujoSocio,
  fechaInicio,
  costoDepto,
  formaPagoGastos,
  params,
  gastos,
  onSelectSocio,
  onAdjudicacionChange,
  userIsGuest,
  cesionInfo
}) => {
  const [mesSimulado, setMesSimulado] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('hitos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const mPos = flujoSocio.cuotaPosesion;
  const mesesTotales = flujoSocio.mesesTotales;
  const fechaPosesion = formatFecha(fechaInicio, mPos);
  const fechaCancelacion = formatFecha(fechaInicio, mesesTotales);

  // Calcular acumulado a la cuota simulada
  let abonadoSimulado = flujoSocio.anticipoMes0;
  for (const m of flujoSocio.flujo) {
    if (m.mes <= mesSimulado) {
      abonadoSimulado += m.abonadoMes;
    }
  }

  const saldoPendiente = Math.max(0, flujoSocio.totalAbonado - abonadoSimulado);
  const porcentajePagado =
    flujoSocio.totalAbonado > 0
      ? Math.min(100, (abonadoSimulado / flujoSocio.totalAbonado) * 100).toFixed(1)
      : '0';

  const estadoUnidad = () => {
    if (mesSimulado >= mesesTotales) {
      return { texto: '✅ Cancelado 100% (Escriturado)', color: 'text-emerald-400 font-bold' };
    }
    if (mesSimulado >= mPos) {
      return { texto: '🔑 Posesión Otorgada (En Habitación)', color: 'text-amber-300 font-bold' };
    }
    return { texto: '⏳ En Ahorro y Construcción', color: 'text-slate-300' };
  };

  const estadoActual = estadoUnidad();

  // Helper para generar el texto descriptivo del concepto liquidado
  const getConceptoLiquidado = (f: any) => {
    if (cesionInfo?.activo && f.mes === cesionInfo.mes) {
      const montoPrima = (cesionInfo.costoUnidad * (cesionInfo.porcentajePrima || 0)) / 100;
      return `Cesión / Venta de Participación (Prima ${cesionInfo.porcentajePrima}%: -${fmtMoneda(montoPrima)} incl. Gestión, Escribanía y Gastos Menores)`;
    }
    let str = 'Cuota Mensual Inmueble';
    if (f.porcentajeAjuste) {
      str += ` (+${f.porcentajeAjuste}% CAC)`;
    }
    if (f.adelanto > 0) {
      str += ` + Adelanto (${fmtMoneda(f.adelanto)})`;
    }
    if (f.mes === mPos && flujoSocio.pagoFinalGastos > 0) {
      str += ` + Gastos Adjudicación (${fmtMoneda(flujoSocio.pagoFinalGastos)})`;
    } else if (flujoSocio.recargoGastosPorCuota > 0) {
      str += ` + Gastos Prorrateados (${fmtMoneda(flujoSocio.recargoGastosPorCuota)})`;
    }
    return str;
  };

  // Cuotas filtradas según el modo (Hitos vs Todo)
  const cuotasFiltradas = useMemo(() => {
    if (filterMode === 'hitos') {
      const hitosSet = new Set([1, mPos, mesesTotales, mesSimulado]);
      if (cesionInfo?.activo && cesionInfo.mes) {
        hitosSet.add(cesionInfo.mes);
      }
      return flujoSocio.flujo.filter(
        (f) => hitosSet.has(f.mes) || (f.porcentajeAjuste && f.porcentajeAjuste > 0) || f.adelanto > 0
      );
    }
    return flujoSocio.flujo;
  }, [filterMode, flujoSocio.flujo, mPos, mesesTotales, mesSimulado, cesionInfo]);

  // Paginación para modo 'todo'
  const totalPages = Math.ceil(cuotasFiltradas.length / itemsPerPage);
  const cuotasPaginadas = useMemo(() => {
    if (filterMode === 'hitos') return cuotasFiltradas;
    const start = (currentPage - 1) * itemsPerPage;
    return cuotasFiltradas.slice(start, start + itemsPerPage);
  }, [filterMode, cuotasFiltradas, currentPage, itemsPerPage]);

  // Transformar datos para Cards en Mobile
  const mobileCardsItems = useMemo<ResumenMesCardItem[]>(() => {
    const list: ResumenMesCardItem[] = [];

    // Incluir Mes 0 si estamos en modo hitos o en la página 1
    if (filterMode === 'hitos' || currentPage === 1) {
      list.push({
        mes: 0,
        esMesCero: true,
        fechaCorta: '-',
        concepto: 'Anticipo de Suscripción / Entrega Inicial Mes 0',
        abonadoMes: flujoSocio.anticipoMes0,
        totalAcumulado: flujoSocio.anticipoMes0,
        saldoRemanente: Math.max(0, costoDepto - flujoSocio.anticipoMes0)
      });
    }

    for (const f of cuotasPaginadas) {
      const { fechaCorta } = formatFecha(fechaInicio, f.mes);
      list.push({
        mes: f.mes,
        fechaCorta,
        concepto: getConceptoLiquidado(f),
        abonadoMes: f.abonadoMes,
        totalAcumulado: f.totalAcumulado,
        saldoRemanente: f.saldoRemanente,
        isPosesion: f.mes === mPos,
        isCancelado: f.mes === mesesTotales,
        isMesActual: f.mes === mesSimulado,
        porcentajeAjuste: f.porcentajeAjuste,
        motivoAjuste: f.motivoAjuste
      });
    }

    return list;
  }, [cuotasPaginadas, filterMode, currentPage, flujoSocio, costoDepto, fechaInicio, mPos, mesesTotales, mesSimulado]);

  return (
    <section
      id="seccionCuentaIndividual"
      className="bg-slate-800/95 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-7 shadow-2xl space-y-6 transition-all"
    >
      {/* Cabecera de la ficha */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              Estado de Cuenta Corriente Individual
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Cartola financiera, evolución del capital integrado y amortización de saldo
            </p>
          </div>
        </div>

        {/* Acciones de exportación y cambio de socio */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Selector de Socio o Identificador de Simulación */}
          {userIsGuest ? (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/40 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="text-xs font-bold text-indigo-300">🎯 Simulación en Vivo</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-inner">
              <span className="text-xs font-semibold text-slate-400 pl-2">Socio:</span>
              <select
                value={socioSeleccionado}
                onChange={(e) => onSelectSocio(parseInt(e.target.value, 10))}
                className="bg-slate-800 border-none rounded-lg px-2.5 py-1 text-xs font-bold text-amber-300 outline-none cursor-pointer"
              >
                {Array.from({ length: cantidadSocios }, (_, i) => i + 1).map((id) => (
                  <option key={id} value={id}>
                    Socio D{id} {id === socioSeleccionado ? '(Seleccionado)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Adjudicación Mes */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/30 rounded-xl px-2.5 py-1 text-xs">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Adjudica Cuota:</span>
            <input
              type="number"
              min="1"
              max={mesesTotales}
              value={mPos}
              onChange={(e) => onAdjudicacionChange(socioSeleccionado, parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 font-mono text-center font-bold text-amber-300 outline-none"
            />
          </div>

          {/* Botones de Descarga e Impresión */}
          <button
            onClick={() => exportarFichaSocioPDF(flujoSocio, params, gastos, fechaInicio, mesSimulado)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Descargar Ficha en PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar PDF</span>
          </button>

          <button
            onClick={() => exportarFichaSocioExcel(flujoSocio, params, gastos, fechaInicio)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Exportar Cartola a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Imprimir Cartola"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400">Costo Total del Plan</span>
          <div className="text-lg sm:text-xl font-bold text-white mt-1 font-mono">
            {fmtMoneda(flujoSocio.totalAbonado)}
          </div>
          <span className="text-[10px] text-slate-500">
            {formaPagoGastos === 'final' ? 'Depto + Gastos al Adjudicar' : 'Depto + Gastos Prorrateados'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400">Anticipo Mes 0 Integrado</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono">
            {fmtMoneda(flujoSocio.anticipoMes0)}
          </div>
          <span className="text-[10px] text-slate-500">
            {flujoSocio.anticipoMes0 > 0 ? 'Aporte previo integrado' : 'Sin aporte inicial'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400">Posesión Programada</span>
          <div className="text-lg sm:text-xl font-bold text-amber-300 mt-1 font-mono">
            Cuota {mPos}
          </div>
          <span className="text-[10px] text-amber-400/90 font-medium">
            Fecha: {fechaPosesion.fechaLarga}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl shadow-sm">
          <span className="text-[11px] font-medium text-slate-400">
            {cesionInfo?.activo ? 'Salida por Cesión / Venta' : 'Fin del Plan del Socio'}
          </span>
          <div className="text-lg sm:text-xl font-bold text-indigo-300 mt-1 font-mono">
            Cuota {cesionInfo?.activo ? cesionInfo.mes : mesesTotales}
          </div>
          <span className="text-[10px] text-indigo-400/90 font-medium">
            Fecha: {cesionInfo?.activo ? formatFecha(fechaInicio, cesionInfo.mes).fechaLarga : fechaCancelacion.fechaLarga}
          </span>
        </div>
      </div>

      {/* Barra de progreso y simulación interactiva */}
      <div className="bg-slate-900/80 border border-slate-700/80 p-4 sm:p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-200">
              Avance de Integración a la Cuota Actual:
            </span>
            <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full">
              {porcentajePagado}% Integrado
            </span>
          </div>

          <div className="flex items-center gap-2.5 no-print">
            <label className="text-xs text-slate-400">Simular Cuota Actual:</label>
            <input
              type="range"
              min="0"
              max={mesesTotales}
              value={mesSimulado}
              onChange={(e) => setMesSimulado(parseInt(e.target.value, 10) || 0)}
              className="accent-indigo-500 cursor-pointer w-32 sm:w-40"
            />
            <span className="text-xs font-bold text-indigo-300 font-mono w-8 text-right">
              M{mesSimulado}
            </span>
          </div>
        </div>

        {/* Barra Visual */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${porcentajePagado}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
          <div className="flex justify-between sm:justify-start gap-1.5">
            <span className="text-slate-400">Total integrado acumulado:</span>
            <strong className="font-mono text-emerald-400">{fmtMoneda(abonadoSimulado)}</strong>
          </div>
          <div className="flex justify-between sm:justify-start gap-1.5">
            <span className="text-slate-400">Saldo remanente de pago:</span>
            <strong className="font-mono text-rose-300">{fmtMoneda(saldoPendiente)}</strong>
          </div>
          <div className="flex justify-between sm:justify-start gap-1.5">
            <span className="text-slate-400">Estado de la unidad:</span>
            <strong className={estadoActual.color}>{estadoActual.texto}</strong>
          </div>
        </div>
      </div>

      {/* Controles de Filtros Inteligentes de Hitos y Paginación */}
      <SmartFilters
        filterMode={filterMode}
        onFilterModeChange={(mode) => {
          setFilterMode(mode);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        totalItems={flujoSocio.flujo.length}
        showingCount={cuotasPaginadas.length}
      />

      {/* Vista 1: Tarjetas Responsivas en Mobile (<MobileCardsList />) */}
      <MobileCardsList items={mobileCardsItems} />

      {/* Vista 2: Tabla Desktop Tradicional con Sticky Header */}
      <div className="hidden lg:block overflow-x-auto border border-slate-700/80 rounded-2xl max-h-[580px] overflow-y-auto shadow-inner bg-slate-900/50 relative">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-md border-b border-slate-700">
            <tr>
              <th className="py-3 px-4 font-semibold">Cuota / Mes</th>
              <th className="py-3 px-4 font-semibold">Fecha (MM/AA)</th>
              <th className="py-3 px-4 font-semibold">Concepto Liquidado</th>
              <th className="py-3 px-4 text-right font-semibold">Abonado en el Mes</th>
              <th className="py-3 px-4 text-right text-emerald-300 font-bold">Total Acumulado</th>
              <th className="py-3 px-4 text-right text-slate-400 font-semibold">Saldo Remanente</th>
              <th className="py-3 px-4 text-center font-semibold">Hito / Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {/* Mes 0 */}
            {(filterMode === 'hitos' || currentPage === 1) && (
              <tr className="bg-slate-900/80 hover:bg-slate-800/50 transition-colors">
                <td className="py-2.5 px-4 font-bold text-emerald-400">Mes 0</td>
                <td className="py-2.5 px-4 text-slate-400">-</td>
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                  Anticipo de Suscripción / Entrega Inicial
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-emerald-300">
                  {fmtMoneda(flujoSocio.anticipoMes0)}
                </td>
                <td className="py-2.5 px-4 text-right font-bold text-white">
                  {fmtMoneda(flujoSocio.anticipoMes0)}
                </td>
                <td className="py-2.5 px-4 text-right text-slate-400">
                  {fmtMoneda(costoDepto - flujoSocio.anticipoMes0)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-sans font-semibold">
                    Integrado
                  </span>
                </td>
              </tr>
            )}

            {/* Cuotas filtradas / paginadas */}
            {cuotasPaginadas.map((f) => {
              let rClass = 'hover:bg-slate-800/40 transition-colors';
              let hitoHtml = (
                <span className="text-slate-500 text-[10px] font-sans">Devengado</span>
              );

              if (cesionInfo?.activo && f.mes === cesionInfo.mes) {
                hitoHtml = (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold font-sans flex justify-center items-center gap-1 w-max mx-auto">
                    🤝 Cesión / Salida
                  </span>
                );
                rClass = 'bg-rose-950/20 border-l-4 border-rose-500';
              } else if (f.mes === mesesTotales) {
                hitoHtml = (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-sans flex justify-center items-center gap-1 w-max mx-auto">
                    🏁 Cancelado 100%
                  </span>
                );
                rClass = 'bg-emerald-950/20 border-l-4 border-emerald-500';
              } else if (f.mes === mPos) {
                hitoHtml = (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-sans flex justify-center items-center gap-1 w-max mx-auto">
                    🔑 Posesión / Llaves
                  </span>
                );
                rClass = 'bg-amber-950/20 border-l-4 border-amber-500';
              } else if (f.mes === mesSimulado) {
                hitoHtml = (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold font-sans flex justify-center items-center gap-1 w-max mx-auto">
                    📍 Cuota Actual
                  </span>
                );
                rClass = 'bg-indigo-950/20 border-l-4 border-indigo-500';
              }

              const fecha = formatFecha(fechaInicio, f.mes);

              return (
                <tr key={f.mes} className={rClass}>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span>Cuota {f.mes}</span>
                      {f.porcentajeAjuste && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans font-bold"
                          title={f.motivoAjuste || 'Ajuste de costos'}
                        >
                          +{f.porcentajeAjuste}%
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                    {fecha.fechaCorta}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 text-[11px] font-sans">
                    {getConceptoLiquidado(f)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-300">
                    {fmtMoneda(f.abonadoMes)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-white font-bold">
                    {fmtMoneda(f.totalAcumulado)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                    {fmtMoneda(f.saldoRemanente)}
                  </td>
                  <td className="py-2 px-4 text-center">{hitoHtml}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CuentaIndividual;

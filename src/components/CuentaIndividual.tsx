import React, { useState } from 'react';
import type { FlujoSocioCalculado, FormaPagoGastos, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { fmtMoneda, formatFecha } from '../utils/calculations';
import { exportarFichaSocioPDF, exportarFichaSocioExcel } from '../utils/exportReports';
import {
  User,
  Printer,
  KeyRound,
  Eye,
  EyeOff,
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
  onAdjudicacionChange
}) => {
  const [mesSimulado, setMesSimulado] = useState<number>(0);
  const [mostrarTodasLasCuotas, setMostrarTodasLasCuotas] = useState<boolean>(true);

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

  return (
    <section
      id="seccionCuentaIndividual"
      className="bg-slate-800/95 border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 transition-all"
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
              Ficha contable del suscriptor, cartola de movimientos y asignación de posesión
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl shadow-sm">
            <label className="text-xs text-slate-300 font-bold">Ver Socio:</label>
            <select
              value={socioSeleccionado}
              onChange={(e) => onSelectSocio(parseInt(e.target.value) || 1)}
              className="bg-slate-800 text-amber-300 font-bold text-xs rounded-lg px-2.5 py-1 outline-none border border-slate-600 focus:border-amber-400"
            >
              {Array.from({ length: cantidadSocios }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Socio D{i + 1} (Depto {i + 1})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => exportarFichaSocioPDF(flujoSocio, params, gastos, fechaInicio, mesSimulado)}
            title="Descargar Ficha en formato PDF oficial"
            className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>

          <button
            onClick={() => exportarFichaSocioExcel(flujoSocio, params, gastos, fechaInicio)}
            title="Exportar Cartola en Excel (.xlsx)"
            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimir cartola o guardar con diálogo del navegador"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>


      {/* Selector de cuota de adjudicación */}
      <div className="bg-slate-900/90 border border-amber-500/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print shadow-sm">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              Elección de Cuota de Adjudicación / Posesión:
            </span>
            <p className="text-[11px] text-slate-400">
              Fija el mes en que este socio recibe la llave de su departamento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/90 border border-amber-500/50 px-3.5 py-2 rounded-xl">
          <label className="text-xs font-bold text-slate-200">Adjudicar en Cuota:</label>
          <input
            type="number"
            min="1"
            max="240"
            value={mPos}
            onChange={(e) => onAdjudicacionChange(socioSeleccionado, parseInt(e.target.value) || 1)}
            className="w-20 bg-slate-900 text-amber-300 text-sm px-2 py-1 rounded-lg border border-amber-500/60 font-mono font-bold text-center outline-none focus:ring-1 focus:ring-amber-400"
          />
          <span className="text-xs text-emerald-400 font-mono font-bold">
            ({fechaPosesion.fechaCorta})
          </span>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <span className="text-[11px] font-medium text-slate-400">Fin del Plan del Socio</span>
          <div className="text-lg sm:text-xl font-bold text-indigo-300 mt-1 font-mono">
            Cuota {mesesTotales}
          </div>
          <span className="text-[10px] text-indigo-400/90 font-medium">
            Fecha: {fechaCancelacion.fechaLarga}
          </span>
        </div>
      </div>

      {/* Banner de Ajuste por Mayores Costos si aplica */}
      {(flujoSocio.totalAjustesPorcentaje || 0) > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <span className="text-base">📈</span>
            <span>
              Plan con Redeterminación de Precios / CAC: <strong>+{flujoSocio.totalAjustesPorcentaje}% acumulado</strong>
            </span>
          </div>
          <div className="text-slate-300 font-mono text-[11px]">
            Cuota Inicial: <strong className="text-slate-200">{fmtMoneda(flujoSocio.cuotaInmInicial)}</strong> ➔ Cuota Actual: <strong className="text-emerald-400">{fmtMoneda(flujoSocio.cuotaInmActual || flujoSocio.cuotaInmInicial)}</strong>
          </div>
        </div>
      )}

      {/* Barra de progreso y simulación interactiva */}
      <div className="bg-slate-900/80 border border-slate-700/80 p-5 rounded-2xl space-y-4">
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
              onChange={(e) => setMesSimulado(parseInt(e.target.value) || 0)}
              className="accent-indigo-500 cursor-pointer w-32 sm:w-40"
            />
            <span className="text-xs font-mono font-bold text-amber-300 w-16 text-right">
              {mesSimulado === 0 ? 'Mes 0' : `Cuota ${mesSimulado}`}
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
          <div
            className="bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-300 h-full rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${porcentajePagado}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-800">
          <div className="flex justify-between sm:justify-start gap-1.5">
            <span className="text-slate-400">Abonado al mes seleccionado:</span>
            <strong className="font-mono text-emerald-300">{fmtMoneda(abonadoSimulado)}</strong>
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

      {/* Controles de tabla */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 no-print">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          <span>
            {mostrarTodasLasCuotas
              ? 'Mostrando todas las cuotas completas del plan'
              : 'Mostrando únicamente hitos clave (resumido)'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMostrarTodasLasCuotas(!mostrarTodasLasCuotas)}
          className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          {mostrarTodasLasCuotas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{mostrarTodasLasCuotas ? 'Colapsar a hitos clave' : 'Desplegar todas las cuotas'}</span>
        </button>
      </div>

      {/* Tabla Cartola */}
      <div className="overflow-x-auto border border-slate-700/80 rounded-2xl max-h-[580px] overflow-y-auto shadow-inner bg-slate-900/50 relative">
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

            {/* Cuotas 1 a N */}
            {flujoSocio.flujo.map((f, idx, arr) => {
              const hitosRelevantes = [1, mPos, mesesTotales, mesSimulado];
              const mostrarEstaFila = mostrarTodasLasCuotas || hitosRelevantes.includes(f.mes);

              if (!mostrarEstaFila) {
                // Si la cuota previa se mostró y la siguiente también, mostrar separador de cuotas intermedias
                const prev = arr[idx - 1];
                const prevShown = prev && (mostrarTodasLasCuotas || hitosRelevantes.includes(prev.mes));
                if (prevShown) {
                  return (
                    <tr key={`sep-${f.mes}`} className="bg-slate-900/40 text-slate-500 text-center">
                      <td colSpan={7} className="py-1.5 px-4 text-[11px] italic font-sans">
                        ••• Cuotas intermedias resumidas •••
                      </td>
                    </tr>
                  );
                }
                return null;
              }

              let rClass = 'hover:bg-slate-800/40 transition-colors';
              let hitoHtml = (
                <span className="text-slate-500 text-[10px] font-sans">Devengado</span>
              );

              if (f.mes === mesesTotales) {
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

              let strConcepto = 'Cuota Mensual Inmueble';
              if (f.porcentajeAjuste) {
                strConcepto += ` (+${f.porcentajeAjuste}% Ajuste Costos)`;
              }
              if (f.adelanto > 0) {
                strConcepto += ` + Adelanto (${fmtMoneda(f.adelanto)})`;
              }
              if (f.mes === mPos && flujoSocio.pagoFinalGastos > 0) {
                strConcepto += ` + Gastos al Adjudicar (${fmtMoneda(flujoSocio.pagoFinalGastos)})`;
              } else if (flujoSocio.recargoGastosPorCuota > 0) {
                strConcepto += ` + Gastos Prorrateados (${fmtMoneda(flujoSocio.recargoGastosPorCuota)})`;
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
                    {strConcepto}
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

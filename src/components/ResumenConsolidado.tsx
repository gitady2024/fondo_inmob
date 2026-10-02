import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { fmtMoneda, formatFecha } from '../utils/calculations';
import { exportarConsolidadoExcel, exportarConsolidadoPDF } from '../utils/exportReports';
import { TableProperties, Zap, ScrollText, FileDown, FileSpreadsheet } from 'lucide-react';

interface ResumenConsolidadoProps {
  flujosSocios: FlujoSocioCalculado[];
  fechaInicio: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  adjudicacionFijada: Record<number, number>;
  cesionActiva: boolean;
  socioCedente: number;
  cuotaSalidaCesion: number;
  adelantoActivo: boolean;
  socioAdelanta: number;
  cuotaAdelanto: number;
  onSelectSocio: (socioId: number) => void;
}

export const ResumenConsolidado: React.FC<ResumenConsolidadoProps> = ({
  flujosSocios,
  fechaInicio,
  params,
  gastos,
  adjudicacionFijada,
  cesionActiva,
  socioCedente,
  cuotaSalidaCesion,
  adelantoActivo,
  socioAdelanta,
  cuotaAdelanto,
  onSelectSocio
}) => {
  let tAnt = 0;
  let tInm = 0;
  let tGastos = 0;
  let tFin = 0;
  let tExtra = 0;
  let tAbon = 0;

  flujosSocios.forEach((p) => {
    tAnt += p.anticipoMes0;
    tInm += p.cuotaInmInicial;
    tGastos += p.recargoGastosPorCuota;
    tFin += p.cuotaFinInicial;
    tExtra += p.pagoFinalGastos;
    tAbon += p.totalAbonado;
  });

  return (
    <section className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl no-print transition-all">
      <div className="p-5 border-b border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <TableProperties className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">
              Resumen Consolidado del Círculo Inmobiliario
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {flujosSocios.length} Unidades en Administración Mutua
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportarConsolidadoPDF(flujosSocios, params, gastos, fechaInicio, adjudicacionFijada)}
            title="Descargar informe consolidado en PDF apaisado"
            className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF Consolidado</span>
          </button>

          <button
            onClick={() => exportarConsolidadoExcel(flujosSocios, params, gastos, fechaInicio, adjudicacionFijada)}
            title="Exportar matriz completa a Excel (.xlsx)"
            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Matriz</span>
          </button>
        </div>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Socio / Unidad</th>
              <th className="py-3.5 px-4 text-right text-emerald-300 font-semibold">Anticipo Mes 0</th>
              <th className="py-3.5 px-4 text-right text-slate-300 font-semibold">Cuota Inmueble</th>
              <th className="py-3.5 px-4 text-right text-amber-300 font-semibold">Recargo Gastos</th>
              <th className="py-3.5 px-4 text-right text-indigo-300 font-semibold">Cuota Final / Mes</th>
              <th className="py-3.5 px-4 text-center text-amber-300 font-semibold">Cuota Posesión</th>
              <th className="py-3.5 px-4 text-center text-amber-300 font-semibold">Fecha Posesión</th>
              <th className="py-3.5 px-4 text-right text-rose-300 font-semibold">Extra al Adjudicar</th>
              <th className="py-3.5 px-4 text-right text-white font-semibold">Total Abonado</th>
              <th className="py-3.5 px-4 text-center font-semibold">Estado Titular</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
            {flujosSocios.map((p) => {
              const i = p.socioId;
              const mPos = p.cuotaPosesion;
              const fechaPos = formatFecha(fechaInicio, mPos);

              let badge = (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-700/80 text-slate-300 font-sans font-medium">
                  Plan Regular
                </span>
              );

              if (cesionActiva && i === socioCedente) {
                badge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans font-semibold flex items-center justify-center gap-1">
                    <ScrollText className="w-3 h-3" /> Cedido cuota {cuotaSalidaCesion}
                  </span>
                );
              } else if (adjudicacionFijada[i] !== undefined) {
                badge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-sans font-semibold flex items-center justify-center gap-1">
                    🔑 Posesión fija (Cuota {mPos})
                  </span>
                );
              } else if (adelantoActivo && i === socioAdelanta) {
                badge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-sans font-semibold flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" /> Licitó cuota {cuotaAdelanto}
                  </span>
                );
              }

              return (
                <tr
                  key={i}
                  onClick={() => onSelectSocio(i)}
                  className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-indigo-300 font-sans flex items-center gap-1.5">
                    <span>Socio D{i}</span>
                    {p.anticipoMes0 > 0 && <span title="Con anticipo">⭐</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-300">
                    {fmtMoneda(p.anticipoMes0)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    <div>{fmtMoneda(p.cuotaInmInicial)}</div>
                    {p.cuotaInmActual && Math.round(p.cuotaInmActual) !== Math.round(p.cuotaInmInicial) && (
                      <div className="text-[10px] text-amber-400 font-bold" title="Cuota ajustada por mayores costos">
                        ➔ {fmtMoneda(p.cuotaInmActual)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {fmtMoneda(p.recargoGastosPorCuota)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-200">
                    <div>{fmtMoneda(p.cuotaFinInicial)}/m</div>
                    {p.cuotaFinActual && Math.round(p.cuotaFinActual) !== Math.round(p.cuotaFinInicial) && (
                      <div className="text-[10px] text-amber-300 font-bold" title="Cuota final mensual ajustada">
                        ➔ {fmtMoneda(p.cuotaFinActual)}/m
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-amber-300">
                    Cuota {mPos}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">
                    {fechaPos.fechaCorta}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-300">
                    {p.pagoFinalGastos > 0 ? fmtMoneda(p.pagoFinalGastos) : '$0'}
                  </td>
                  <td className="py-3 px-4 text-right text-white font-bold">
                    {fmtMoneda(p.totalAbonado)}
                  </td>
                  <td className="py-3 px-4 text-center">{badge}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 font-mono text-xs border-t-2 border-slate-700">
            <tr className="text-slate-200 font-bold">
              <td className="py-3.5 px-4 uppercase text-right text-slate-400 font-sans">
                Totales:
              </td>
              <td className="py-3.5 px-4 text-right text-emerald-400">{fmtMoneda(tAnt)}</td>
              <td className="py-3.5 px-4 text-right text-slate-300">{fmtMoneda(tInm)}/m</td>
              <td className="py-3.5 px-4 text-right text-amber-300">{fmtMoneda(tGastos)}/m</td>
              <td className="py-3.5 px-4 text-right text-indigo-300">{fmtMoneda(tFin)}/m</td>
              <td colSpan={2} className="text-center text-slate-400 text-[11px] font-sans">
                Planes 100% financiados
              </td>
              <td className="py-3.5 px-4 text-right text-rose-300">{fmtMoneda(tExtra)}</td>
              <td className="py-3.5 px-4 text-right text-white font-bold">{fmtMoneda(tAbon)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

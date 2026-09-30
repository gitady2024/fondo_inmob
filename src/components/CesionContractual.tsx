import React from 'react';
import type { CesionConfigState, FlujoSocioCalculado } from '../types/fondo';

import { fmtMoneda, formatFecha, calcularLiquidacionCesion } from '../utils/calculations';
import { ScrollText, ArrowRightLeft, FileCheck, Info } from 'lucide-react';

interface CesionContractualProps {
  cantidadSocios: number;
  cesion: CesionConfigState;
  flujosSocios: FlujoSocioCalculado[];
  fechaInicio: string;
  pagoFinalGastos: number;
  onChange: (newCesion: Partial<CesionConfigState>) => void;
}

export const CesionContractual: React.FC<CesionContractualProps> = ({
  cantidadSocios,
  cesion,
  flujosSocios,
  fechaInicio,
  pagoFinalGastos,
  onChange
}) => {
  const socioCedenteFlujo = flujosSocios[cesion.socioCedente - 1] || flujosSocios[0];
  const maxCuotasSocio = socioCedenteFlujo?.mesesTotales || 48;

  const liquidacion = socioCedenteFlujo
    ? calcularLiquidacionCesion(
        socioCedenteFlujo,
        cesion.cuotaSalida,
        cesion.primaCesion,
        pagoFinalGastos
      )
    : null;

  const fechaSalida = formatFecha(fechaInicio, cesion.cuotaSalida);

  const getExplicacion = () => {
    switch (cesion.mecanismoSalida) {
      case 'tercero':
        return 'Cesión a Tercero (Art. 1636 CCCN): Un tercero sustituye íntegramente la posición del socio saliente. El fondo no sufre descapitalización y continúa su curso programado sin alterar los flujos de los restantes copropietarios.';
      case 'preferencia':
        return 'Rescate Interno (Art. 1637 CCCN): Los demás socios tienen derecho de preferencia proporcional para adquirir la cuota parte o integrarla como cuota social común, consolidando mayor participación patrimonial.';
      case 'diferido':
        return 'Renuncia Diferida: El socio suspende pagos y su crédito queda supeditado a liquidación al cierre del círculo o tras la colocación de la unidad a un nuevo aportante.';
      default:
        return '';
    }
  };

  return (
    <section className="bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Cesión de Posición Contractual y Salida de Socios</h2>
            <p className="text-xs text-amber-300/80">Regulación legal según arts. 1636 a 1640 CCCN</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all">
          <input
            type="checkbox"
            checked={cesion.activo}
            onChange={(e) => onChange({ activo: e.target.checked })}
            className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
          />
          <span className="text-xs text-slate-300 font-semibold">Activar Simulación de Salida</span>
        </label>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 transition-all duration-300 ${
          cesion.activo ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Socio que transfiere</label>
          <select
            value={cesion.socioCedente}
            onChange={(e) => onChange({ socioCedente: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-medium"
          >
            {Array.from({ length: cantidadSocios }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Socio D{i + 1} (Depto {i + 1})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <label className="text-slate-300">¿En qué cuota transfiere?</label>
            <span className="text-amber-400 font-bold font-mono">
              Cuota {cesion.cuotaSalida} ({fechaSalida.fechaCorta})
            </span>
          </div>
          <input
            type="number"
            min="1"
            max={maxCuotasSocio}
            value={cesion.cuotaSalida}
            onChange={(e) => onChange({ cuotaSalida: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-mono font-semibold"
          />
          {liquidacion && (
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Integrado: {fmtMoneda(liquidacion.capitalAportado)} ({liquidacion.cuotasPagas} cuotas + ant.)
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <label className="text-slate-300">Prima pactada</label>
            <span className="text-emerald-400 font-bold font-mono">
              +{fmtMoneda(liquidacion?.montoPrima || 0)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="1"
              value={cesion.primaCesion}
              onChange={(e) => onChange({ primaCesion: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-mono font-semibold"
            />
            <span className="text-xs text-slate-400 font-bold">%</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Mecanismo de Salida</label>
          <select
            value={cesion.mecanismoSalida}
            onChange={(e) => onChange({ mecanismoSalida: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-medium"
          >
            <option value="tercero">Opción A: Cesión a Tercero Entrante</option>
            <option value="preferencia">Opción B: Rescate Interno</option>
            <option value="diferido">Opción C: Renuncia Diferida</option>
          </select>
        </div>
      </div>

      {liquidacion && (
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 transition-all duration-300 ${
            cesion.activo ? 'opacity-100' : 'opacity-40 pointer-events-none'
          }`}
        >
          {/* Liquidación Cedente */}
          <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-amber-300 text-sm flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-400" />
                Liquidación Socio Cedente
              </span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1">
              <span>Capital abonado:</span>
              <strong className="font-mono text-white">{fmtMoneda(liquidacion.capitalAportado)}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Prima ({cesion.primaCesion}%):</span>
              <strong className="font-mono text-emerald-400">+{fmtMoneda(liquidacion.montoPrima)}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Arancel cesión (2%):</span>
              <strong className="font-mono text-rose-400">-{fmtMoneda(liquidacion.gastoCesion)}</strong>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700 text-white">
              <span>Neto a cobrar:</span>
              <span className="text-amber-300 font-mono text-base">{fmtMoneda(liquidacion.netoACobrar)}</span>
            </div>
          </div>

          {/* Desembolso Adquirente */}
          <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-indigo-300 text-sm flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
                Desembolso Nuevo Adquirente
              </span>
            </div>
            <div className="flex justify-between text-slate-300 pt-1">
              <span>Entrada / Traspaso:</span>
              <strong className="font-mono text-white">{fmtMoneda(liquidacion.desembolsoEntradaAdquirente)}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Deuda restante:</span>
              <strong className="font-mono text-slate-300">
                {liquidacion.cuotasRestantesAdquirente} cuotas ({fmtMoneda(liquidacion.deudaRestanteAdquirente)})
              </strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Desembolso al adjudicar:</span>
              <strong className="font-mono text-amber-300">{fmtMoneda(liquidacion.gastosAdjudicacionAdquirente)}</strong>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700 text-white">
              <span>Costo total final:</span>
              <span className="text-indigo-300 font-mono text-base">{fmtMoneda(liquidacion.costoTotalAdquirente)}</span>
            </div>
          </div>

          {/* Explicación Legal */}
          <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col justify-between text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Marco Legal y Dinámica Financiera</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">{getExplicacion()}</p>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
              Inmunidad de quiebra e indivisión del patrimonio fiduciario
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

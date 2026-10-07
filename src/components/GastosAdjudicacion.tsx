import React from 'react';
import type { GastosConfigState } from '../types/fondo';

import { fmtMoneda, calcularGastos } from '../utils/calculations';
import { Scale, Briefcase, Percent } from 'lucide-react';
import { CurrencyInput } from './common/CurrencyInput';

interface GastosAdjudicacionProps {
  costoDepto: number;
  cantidadDeptos: number;
  cantidadCuotas: number;
  gastos: GastosConfigState;
  onChange: (newGastos: Partial<GastosConfigState>) => void;
}

export const GastosAdjudicacion: React.FC<GastosAdjudicacionProps> = ({
  costoDepto,
  cantidadDeptos,
  cantidadCuotas,
  gastos,
  onChange
}) => {
  const { montoGestion, montoEscribania, gastosTotales, recargoGastosPorCuota, pagoFinalGastos } =
    calcularGastos(costoDepto, gastos, cantidadCuotas);

  const pctTotal = costoDepto > 0 ? ((gastosTotales / costoDepto) * 100).toFixed(1) : '0';

  return (
    <section className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-3">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Gastos de Adjudicación</span>
          </h2>
          <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {pctTotal}% total
          </span>
        </div>

        {/* Modalidad de pago de gastos */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl mb-4">
          <label className="block text-[11px] font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            ¿Cómo abona los gastos el socio?
          </label>
          <select
            value={gastos.formaPagoGastos}
            onChange={(e) => onChange({ formaPagoGastos: e.target.value as any })}
            className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-400 outline-none font-medium"
          >
            <option value="final">Opción A: Al final (100% de contado al adjudicar)</option>
            <option value="prorrateado">Opción B: Prorrateado en cuotas (Mes a mes)</option>
          </select>
          <p className="text-[11px] text-slate-300 mt-2">
            {gastos.formaPagoGastos === 'final' ? (
              <>
                El adjudicatario abonará <strong className="text-amber-300 font-mono">{fmtMoneda(pagoFinalGastos)}</strong> de contado al tomar posesión.
              </>
            ) : (
              <>
                Prorrateado: <strong className="text-indigo-300 font-mono">{fmtMoneda(recargoGastosPorCuota)} / mes</strong>. $0 extra al adjudicar.
              </>
            )}
          </p>
        </div>

        {/* Inputs de comisiones */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 font-medium">Gestión de Fondo (%)</span>
              <span className="text-amber-300 font-bold font-mono">{fmtMoneda(montoGestion)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={gastos.comisionGestion}
                onChange={(e) => onChange({ comisionGestion: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono focus:border-amber-400"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 font-medium">Escribanía (%)</span>
              <span className="text-slate-300 font-bold font-mono">{fmtMoneda(montoEscribania)}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={gastos.comisionEscribania}
                onChange={(e) => onChange({ comisionEscribania: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono focus:border-slate-500"
              />
              <span className="text-slate-400 font-bold">%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300 font-medium">Otros Gastos Fijos ($)</span>
              <span className="text-slate-400 font-mono font-medium">{fmtMoneda(gastos.otrosGastos)}</span>
            </div>
            <CurrencyInput
              value={gastos.otrosGastos}
              onChange={(val) => onChange({ otrosGastos: val })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono focus:border-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Total cobrado en el plan */}
      <div className="mt-4 pt-3 border-t border-slate-700/60 bg-slate-900/80 p-3.5 rounded-xl border border-amber-500/20 space-y-2 text-xs">
        <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Total Cobrado en el Plan ({cantidadDeptos} Socios)</span>
        </div>
        <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
          <span className="text-slate-300">
            Honorarios <strong className="text-white">Gestor</strong>:
          </span>
          <strong className="text-amber-400 font-mono">{fmtMoneda(montoGestion * cantidadDeptos)}</strong>
        </div>
        <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
          <span className="text-slate-300">
            Honorarios <strong className="text-white">Escribanía</strong>:
          </span>
          <strong className="text-indigo-300 font-mono">{fmtMoneda(montoEscribania * cantidadDeptos)}</strong>
        </div>
        <div className="flex justify-between items-center pt-0.5 text-slate-400 text-[11px]">
          <span>Otros gastos acumulados:</span>
          <span className="font-mono text-slate-300">{fmtMoneda(gastos.otrosGastos * cantidadDeptos)}</span>
        </div>
      </div>
    </section>
  );
};

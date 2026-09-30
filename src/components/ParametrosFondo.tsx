import React from 'react';
import type { ParametrosFondoState } from '../types/fondo';

import { Sliders, Calendar, DollarSign, Users, Layers, ShieldCheck } from 'lucide-react';

interface ParametrosFondoProps {
  params: ParametrosFondoState;
  onChange: (newParams: Partial<ParametrosFondoState>) => void;
}

export const ParametrosFondo: React.FC<ParametrosFondoProps> = ({ params, onChange }) => {
  const handleCuotasChange = (val: number) => {
    if (val > 0) {
      const cuotaBase = Math.round(params.costoDepto / val);
      onChange({ cantidadCuotas: val, valorCuotaBase: cuotaBase });
    } else {
      onChange({ cantidadCuotas: val });
    }
  };

  const handleCuotaBaseChange = (val: number) => {
    if (val > 0) {
      const cuotas = Math.round(params.costoDepto / val);
      onChange({ valorCuotaBase: val, cantidadCuotas: cuotas });
    } else {
      onChange({ valorCuotaBase: val });
    }
  };

  const handleCostoDeptoChange = (val: number) => {
    if (params.cantidadCuotas > 0) {
      const cuotaBase = Math.round(val / params.cantidadCuotas);
      onChange({ costoDepto: val, valorCuotaBase: cuotaBase });
    } else {
      onChange({ costoDepto: val });
    }
  };

  const plazoAnios = (params.cantidadCuotas / 12).toFixed(2);

  return (
    <section className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Parámetros del Fondo</span>
        </h2>
        <span className="text-[11px] text-slate-400 font-mono">Modelo Mutuo Directo</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Costo por Depto */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Valor por Departamento ($)
          </label>
          <input
            type="number"
            step="1000"
            value={params.costoDepto}
            onChange={(e) => handleCostoDeptoChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono transition-all font-semibold"
          />
        </div>

        {/* Cantidad Deptos / Socios */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Cantidad de Deptos / Socios
          </label>
          <input
            type="number"
            min="2"
            max="30"
            value={params.cantidadDeptos}
            onChange={(e) => onChange({ cantidadDeptos: parseInt(e.target.value) || 2 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono transition-all font-semibold"
          />
        </div>

        {/* Plazo Máximo en Cuotas */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Plazo Máximo en Cuotas
            </label>
            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              ~ {plazoAnios} Años
            </span>
          </div>
          <input
            type="number"
            min="5"
            max="240"
            step="1"
            value={params.cantidadCuotas}
            onChange={(e) => handleCuotasChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-amber-500/20 outline-none font-mono transition-all"
          />
        </div>

        {/* Valor Cuota Base */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              Valor Cuota Pura Inmueble ($)
            </label>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/40">
              Sin gastos
            </span>
          </div>
          <input
            type="number"
            step="1"
            value={params.valorCuotaBase}
            onChange={(e) => handleCuotaBaseChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-indigo-500/60 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono transition-all"
          />
        </div>

        {/* Fecha Inicio */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Fecha de Inicio (Mes 1)
          </label>
          <input
            type="month"
            value={params.fechaInicio}
            onChange={(e) => onChange({ fechaInicio: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
          />
        </div>

        {/* Modalidad Anticipo */}
        <div className="sm:col-span-2 bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Tratamiento del Anticipo Mes 0:
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compensación del anticipo inicial frente al cuadro de marcha
            </p>
          </div>
          <select
            value={params.modalidadAnticipo}
            onChange={(e) => onChange({ modalidadAnticipo: e.target.value as any })}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-400 outline-none font-medium transition-all"
          >
            <option value="reducir_cuota">Opción 1: Aliviar cuota mensual (Paga menos por mes)</option>
            <option value="reducir_plazo">Opción 2: Extinción anticipada (Misma cuota, termina antes)</option>
          </select>
        </div>
      </div>
    </section>
  );
};

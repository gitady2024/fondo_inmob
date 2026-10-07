import React from 'react';
import type { ParametrosFondoState } from '../types/fondo';
import { Sliders, Calendar, DollarSign, Users, Layers, ShieldCheck } from 'lucide-react';
import { CurrencyInput } from './common/CurrencyInput';
import { HybridRangeInput } from './common/HybridRangeInput';

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

  const plazoAnios = (params.cantidadCuotas / 12).toFixed(1);

  return (
    <section id="simulador-parametros" className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Parámetros del Fondo</span>
        </h2>
        <span className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/60">
          Modelo Mutuo Directo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Costo por Depto (Input + Slider Híbrido) */}
        <div>
          <HybridRangeInput
            id="param-costo-depto"
            label={
              <>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valor por Departamento / Inmueble</span>
              </>
            }
            value={params.costoDepto}
            onChange={handleCostoDeptoChange}
            min={10000}
            max={Math.max(300000, Math.ceil(params.costoDepto * 1.5 / 10000) * 10000)}
            step={1000}
            isCurrency={true}
            badge={
              <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                Valor Total
              </span>
            }
            helperText="Ajuste fino o arrastre rápido de cotización de la unidad"
          />
        </div>

        {/* Plazo Máximo en Cuotas (Input + Slider Híbrido) */}
        <div>
          <HybridRangeInput
            id="param-cantidad-cuotas"
            label={
              <>
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Plazo en Meses / Cuotas</span>
              </>
            }
            value={params.cantidadCuotas}
            onChange={handleCuotasChange}
            min={6}
            max={240}
            step={6}
            isCurrency={false}
            badge={
              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                ~ {plazoAnios} Años
              </span>
            }
            sliderMarks={[
              { label: '1a (12m)', value: 12 },
              { label: '3a (36m)', value: 36 },
              { label: '5a (60m)', value: 60 },
              { label: '10a (120m)', value: 120 },
              { label: '20a (240m)', value: 240 }
            ]}
            helperText="Duración estimada del círculo de aportes e inversión"
          />
        </div>

        {/* Cantidad Deptos / Socios */}
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="param-cantidad-deptos" className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cantidad de Deptos / Socios</span>
            </label>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-mono">
              Círculo cerrado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="param-cantidad-deptos"
              type="number"
              min="2"
              max="50"
              value={params.cantidadDeptos}
              onChange={(e) => onChange({ cantidadDeptos: parseInt(e.target.value, 10) || 2 })}
              className="w-full bg-slate-950/90 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono transition-all font-bold"
            />
          </div>
          <p className="text-[11px] text-slate-400">Total de unidades funcionales adjudicables</p>
        </div>

        {/* Valor Cuota Base (Con Máscara de Moneda en Tiempo Real) */}
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="param-cuota-pura" className="block text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              <span>Valor Cuota Pura Inmueble</span>
            </label>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/40">
              Sin gastos
            </span>
          </div>
          <CurrencyInput
            id="param-cuota-pura"
            value={params.valorCuotaBase}
            onChange={handleCuotaBaseChange}
            className="w-full bg-slate-950/90 border border-indigo-500/60 focus:border-indigo-400 rounded-lg px-3.5 py-2 text-sm text-white font-bold focus:ring-2 focus:ring-indigo-500/30"
          />
          <p className="text-[11px] text-slate-400">Calculada automáticamente o ajustable manualmente</p>
        </div>

        {/* Fecha Inicio */}
        <div className="sm:col-span-2 bg-slate-900/60 border border-slate-700/60 rounded-xl p-3.5">
          <label htmlFor="param-fecha-inicio" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fecha de Inicio (Mes 1)</span>
          </label>
          <input
            id="param-fecha-inicio"
            type="month"
            value={params.fechaInicio}
            onChange={(e) => onChange({ fechaInicio: e.target.value })}
            className="w-full bg-slate-950/90 border border-slate-700 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
          />
        </div>

        {/* Modalidad Anticipo */}
        <div className="sm:col-span-2 bg-slate-900/70 border border-slate-700/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tratamiento del Anticipo Mes 0:</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compensación del anticipo inicial frente al cuadro de marcha
            </p>
          </div>
          <select
            value={params.modalidadAnticipo}
            onChange={(e) => onChange({ modalidadAnticipo: e.target.value as any })}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-indigo-400 outline-none font-medium transition-all cursor-pointer"
          >
            <option value="reducir_cuota">Opción 1: Aliviar cuota mensual (Paga menos por mes)</option>
            <option value="reducir_plazo">Opción 2: Extinción anticipada (Misma cuota, termina antes)</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default ParametrosFondo;

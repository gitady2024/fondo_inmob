import React from 'react';
import { fmtMoneda } from '../utils/calculations';
import { DollarSign, KeyRound, PieChart, ShieldCheck, Loader2, ArrowDown, TrendingUp } from 'lucide-react';

interface StickyKPIsProps {
  cuotaPura: number;
  cuotaPostPosesion: number;
  costoTotalPlan: number;
  porcentajeIntegrado: number;
  mesPosesion?: number;
  socioLabel?: string;
  isCalculating?: boolean;
  onScrollToChart?: () => void;
  onScrollToTable?: () => void;
}

export const StickyKPIs: React.FC<StickyKPIsProps> = ({
  cuotaPura,
  cuotaPostPosesion,
  costoTotalPlan,
  porcentajeIntegrado,
  mesPosesion,
  socioLabel = 'Socio Actual',
  isCalculating = false,
  onScrollToChart,
  onScrollToTable
}) => {
  return (
    <aside
      aria-label="Panel de Métricas Clave (KPIs)"
      className="sticky top-3 z-30 w-full mb-6 transition-all duration-300"
    >
      <div className={`backdrop-blur-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl rounded-2xl p-3 sm:p-4 transition-all duration-300 ${
        isCalculating ? 'opacity-70 blur-[0.6px] ring-2 ring-indigo-500/40' : 'opacity-100 hover:border-slate-600'
      }`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Header Tag / Context Indicator */}
          <div className="flex items-center justify-between lg:justify-start gap-2.5 pb-2 lg:pb-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Métricas en Vivo</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  {socioLabel}
                </span>
              </div>
            </div>

            {isCalculating ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-semibold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Calculando...</span>
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono hidden sm:inline">
                Sincronizado
              </span>
            )}
          </div>

          {/* 4 Core KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
            
            {/* KPI 1: Cuota Pura Mensual */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold">Cuota Pura</span>
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono tracking-tight">
                {fmtMoneda(cuotaPura)}
              </div>
              <span className="text-[10px] text-indigo-300/80 font-mono">Base mensual</span>
            </div>

            {/* KPI 2: Cuota Post-Posesión */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold">Post-Posesión</span>
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-amber-300 font-mono tracking-tight">
                {fmtMoneda(cuotaPostPosesion)}
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {mesPosesion ? `Desde Mes ${mesPosesion}` : 'Con tenencia'}
              </span>
            </div>

            {/* KPI 3: Costo Total del Plan */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold">Costo Total Plan</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-300 font-mono tracking-tight">
                {fmtMoneda(costoTotalPlan)}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">100% Inmueble + Gastos</span>
            </div>

            {/* KPI 4: Porcentaje Integrado */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-semibold">% Integrado</span>
                <PieChart className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-sky-300 font-mono">
                  {porcentajeIntegrado.toFixed(1)}%
                </span>
              </div>
              {/* Micro Progress Bar */}
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(porcentajeIntegrado, 0), 100)}%` }}
                />
              </div>
            </div>

          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0 lg:pl-3 border-t lg:border-t-0 lg:border-l border-slate-800">
            {onScrollToChart && (
              <button
                onClick={onScrollToChart}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Ver Gráfico de Flujo de Capital"
              >
                <ArrowDown className="w-3 h-3 text-indigo-400" />
                <span>Gráfico</span>
              </button>
            )}
            {onScrollToTable && (
              <button
                onClick={onScrollToTable}
                className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Ver Tabla Detallada"
              >
                <ArrowDown className="w-3 h-3 text-emerald-400" />
                <span>Tabla</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </aside>
  );
};

export default StickyKPIs;

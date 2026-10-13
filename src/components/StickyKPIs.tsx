import React, { useState } from 'react';
import { fmtMoneda } from '../utils/calculations';
import {
  DollarSign,
  KeyRound,
  PieChart,
  ShieldCheck,
  Loader2,
  ArrowDown,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

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
  const [isExpandedMobile, setIsExpandedMobile] = useState(false);

  return (
    <aside
      id="panel-sticky-kpis"
      aria-label="Panel de Métricas Clave (KPIs)"
      className="sticky top-2 sm:top-3 z-30 w-full mb-4 sm:mb-6 transition-all duration-300"
    >
      <div
        className={`backdrop-blur-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-2xl p-2.5 sm:p-4 transition-all duration-300 ${
          isCalculating ? 'opacity-75 blur-[0.5px] ring-2 ring-indigo-500/40' : 'opacity-100 hover:border-slate-600'
        }`}
      >
        {/* ==================================================================== */}
        {/* VISTA MÓVIL (< 640px): FRANJA COMPACTA (< 15% ALTO DE PANTALLA)      */}
        {/* ==================================================================== */}
        <div className="block sm:hidden">
          {/* Fila principal compacta */}
          <div className="flex items-center justify-between gap-2">
            {/* Métrica Principal: Cuota inicial mensual */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Cuota inicial:</span>
                  <span className="text-[11px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800/60 truncate max-w-[90px]">
                    {socioLabel}
                  </span>
                </div>
                <div className="text-base font-extrabold text-emerald-400 font-mono tabular-nums leading-tight tracking-tight">
                  {fmtMoneda(cuotaPura)}
                </div>
              </div>
            </div>

            {/* Acciones y Toggle de Expansión */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isCalculating ? (
                <span className="p-1 text-indigo-400" aria-label="Calculando">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </span>
              ) : null}

              <button
                type="button"
                id="btn-toggle-kpis-mobile"
                onClick={() => setIsExpandedMobile((prev) => !prev)}
                aria-expanded={isExpandedMobile}
                aria-controls="kpis-mobile-details"
                aria-label={isExpandedMobile ? 'Ocultar detalles de KPIs' : 'Ver detalle de KPIs'}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>{isExpandedMobile ? 'Cerrar' : 'Detalles'}</span>
                {isExpandedMobile ? (
                  <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* Panel Desplegable Móvil con Métricas Secundarias */}
          {isExpandedMobile && (
            <div
              id="kpis-mobile-details"
              className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fade-in"
            >
              <div className="grid grid-cols-3 gap-2 text-left">
                {/* Post-Posesión */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2">
                  <span className="text-xs font-medium text-slate-400 block truncate">Post-Posesión</span>
                  <span className="text-xs font-extrabold text-amber-300 font-mono tabular-nums block truncate">
                    {fmtMoneda(cuotaPostPosesion)}
                  </span>
                  <span className="text-[11px] text-amber-400/80 font-mono block truncate">
                    {mesPosesion ? `Mes #${mesPosesion}` : 'Tenencia'}
                  </span>
                </div>

                {/* Total Plan */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2">
                  <span className="text-xs font-medium text-slate-400 block truncate">Costo Total</span>
                  <span className="text-xs font-extrabold text-slate-200 font-mono tabular-nums block truncate">
                    {fmtMoneda(costoTotalPlan)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">Al costo</span>
                </div>

                {/* % Integrado */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2">
                  <span className="text-xs font-medium text-slate-400 block truncate">% Integrado</span>
                  <span className="text-xs font-extrabold text-sky-300 font-mono tabular-nums block truncate">
                    {porcentajeIntegrado.toFixed(1)}%
                  </span>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-sky-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(porcentajeIntegrado, 0), 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Navegación Rápida */}
              {(onScrollToChart || onScrollToTable) && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                  {onScrollToChart && (
                    <button
                      type="button"
                      onClick={() => {
                        onScrollToChart();
                        setIsExpandedMobile(false);
                      }}
                      className="text-xs text-indigo-300 hover:text-white bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3 text-indigo-400" />
                      <span>Ir a Gráfico</span>
                    </button>
                  )}
                  {onScrollToTable && (
                    <button
                      type="button"
                      onClick={() => {
                        onScrollToTable();
                        setIsExpandedMobile(false);
                      }}
                      className="text-xs text-emerald-300 hover:text-white bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3 text-emerald-400" />
                      <span>Ir a Tabla</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* VISTA DESKTOP / TABLET (>= 640px): TABLERO HORIZONTAL COMPLETO       */}
        {/* ==================================================================== */}
        <div className="hidden sm:flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Header Tag / Context Indicator */}
          <div className="flex items-center justify-between lg:justify-start gap-2.5 pb-2 lg:pb-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-left">
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">
                  Métricas en Vivo
                </span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  {socioLabel}
                </span>
              </div>
            </div>

            {isCalculating ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                <span>Calculando...</span>
              </span>
            ) : (
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                Sincronizado
              </span>
            )}
          </div>

          {/* 4 Core KPI Cards Grid con tabular-nums */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
            
            {/* KPI 1: Cuota inicial mensual */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Cuota inicial</span>
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white font-mono tabular-nums tracking-tight">
                {fmtMoneda(cuotaPura)}
              </div>
              <span className="text-xs text-indigo-300/80 font-mono">Base mensual</span>
            </div>

            {/* KPI 2: Cuota Post-Posesión */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Post-Posesión</span>
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-amber-300 font-mono tabular-nums tracking-tight">
                {fmtMoneda(cuotaPostPosesion)}
              </div>
              <span className="text-xs text-amber-400/80 font-mono">
                {mesPosesion ? `Desde Mes #${mesPosesion}` : 'Con tenencia'}
              </span>
            </div>

            {/* KPI 3: Costo Total del Plan */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Costo Total Plan</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-emerald-300 font-mono tabular-nums tracking-tight">
                {fmtMoneda(costoTotalPlan)}
              </div>
              <span className="text-xs text-emerald-400/80 font-mono">100% Inmueble + Gastos</span>
            </div>

            {/* KPI 4: Porcentaje Integrado */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between hover:border-sky-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">% Integrado</span>
                <PieChart className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-sky-300 font-mono tabular-nums">
                  {porcentajeIntegrado.toFixed(1)}%
                </span>
              </div>
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
                type="button"
                id="btn-scroll-chart"
                onClick={onScrollToChart}
                aria-label="Ver Gráfico de Flujo de Capital"
                className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Ver Gráfico de Flujo de Capital"
              >
                <ArrowDown className="w-3 h-3 text-indigo-400" />
                <span>Gráfico</span>
              </button>
            )}
            {onScrollToTable && (
              <button
                type="button"
                id="btn-scroll-table"
                onClick={onScrollToTable}
                aria-label="Ver Tabla Detallada de Cuotas"
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

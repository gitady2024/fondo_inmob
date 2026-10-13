import React from 'react';

/**
 * Componente base de skeleton: pulso animado que imita la forma del contenido real.
 * Se usa como placeholder durante el breve instante de recálculo del motor financiero.
 */

interface SkeletonBlockProps {
  className?: string;
  /** Si true, aplica un borde redondeado pleno (círculo/pill) */
  rounded?: boolean;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  className = '',
  rounded = false
}) => (
  <div
    className={`animate-pulse bg-slate-700/60 ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
    aria-hidden="true"
  />
);

/* ──────────────────────────────────────────────────
   KPI Card Skeleton — replica las 4 tarjetas del StickyKPIs
   ────────────────────────────────────────────────── */
export const SkeletonKPICard: React.FC = () => (
  <div className="flex flex-col gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
    {/* Icono */}
    <SkeletonBlock className="w-8 h-8" />
    {/* Label */}
    <SkeletonBlock className="h-2.5 w-20" />
    {/* Valor principal */}
    <SkeletonBlock className="h-5 w-28" />
    {/* Sublabel */}
    <SkeletonBlock className="h-2 w-16" />
  </div>
);

/* ──────────────────────────────────────────────────
   Row Skeleton — replica una fila de la tabla CuentaIndividual
   ────────────────────────────────────────────────── */
export const SkeletonTableRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-slate-700/40">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-2.5 px-3">
        <SkeletonBlock className={`h-3 ${i === 0 ? 'w-10' : i === cols - 1 ? 'w-20' : 'w-16'}`} />
      </td>
    ))}
  </tr>
);

/* ──────────────────────────────────────────────────
   Chart Skeleton — placeholder para el CapitalFlowChart
   ────────────────────────────────────────────────── */
export const SkeletonChart: React.FC = () => (
  <div
    className="animate-pulse bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 space-y-4"
    aria-hidden="true"
  >
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-40" />
        <SkeletonBlock className="h-2.5 w-56" />
      </div>
      <SkeletonBlock className="h-7 w-24 rounded-full" rounded />
    </div>
    {/* Barra de eje Y simulada */}
    <div className="flex gap-3 items-end h-36 pt-4">
      {[60, 80, 50, 95, 70, 85, 45, 90, 65, 75, 55, 88].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-700/50 rounded-t-sm"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    {/* Eje X simulado */}
    <div className="flex gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="flex-1 h-2" />
      ))}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────
   Summary Card Skeleton — para las tarjetas del ResumenConsolidado
   ────────────────────────────────────────────────── */
export const SkeletonSummaryCard: React.FC = () => (
  <div className="animate-pulse space-y-3 p-4 bg-slate-800/70 rounded-xl border border-slate-700/50">
    <div className="flex justify-between items-center">
      <SkeletonBlock className="h-3.5 w-32" />
      <SkeletonBlock className="h-5 w-20 rounded-full" rounded />
    </div>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex justify-between items-center py-1 border-b border-slate-700/30">
        <SkeletonBlock className="h-2.5 w-28" />
        <SkeletonBlock className="h-2.5 w-20" />
      </div>
    ))}
  </div>
);

/* ──────────────────────────────────────────────────
   Timeline Skeleton — para PossessionTimeline
   ────────────────────────────────────────────────── */
export const SkeletonTimeline: React.FC = () => (
  <div className="animate-pulse flex gap-3 items-center overflow-hidden py-2">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-1.5 min-w-[52px]">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <SkeletonBlock className="h-2 w-8" />
        <SkeletonBlock className="h-1.5 w-12" />
      </div>
    ))}
  </div>
);

export default SkeletonBlock;

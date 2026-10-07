import React, { useState, useMemo } from 'react';
import type { FlujoSocioCalculado } from '../types/fondo';
import { formatFecha } from '../utils/calculations';
import { KeyRound, Home, Calendar, ChevronRight, User, ArrowDownUp, Info } from 'lucide-react';

export interface PossessionNode {
  socioId: number;
  cuotaPosesion: number;
  fechaProyectada: string;
  fechaCorta: string;
  ordenEntrega: number;
  isSelected?: boolean;
}

interface PossessionTimelineProps {
  flujosSocios: FlujoSocioCalculado[];
  fechaInicio: string;
  socioSeleccionado: number;
  onSelectSocio: (socioId: number) => void;
}

export const PossessionTimeline: React.FC<PossessionTimelineProps> = ({
  flujosSocios,
  fechaInicio,
  socioSeleccionado,
  onSelectSocio
}) => {
  const [criterioOrden, setCriterioOrden] = useState<'cronologico' | 'socio'>('cronologico');

  // Procesar y ordenar nodos
  const timelineNodes = useMemo(() => {
    if (!flujosSocios || flujosSocios.length === 0) return [];

    // Primero calculamos el ranking cronológico de cada socio
    const rankingCronologico = [...flujosSocios]
      .sort((a, b) => a.cuotaPosesion - b.cuotaPosesion)
      .reduce((acc, fs, idx) => {
        acc[fs.socioId] = idx + 1;
        return acc;
      }, {} as Record<number, number>);

    // Luego ordenamos según el criterio seleccionado
    const lista = [...flujosSocios].sort((a, b) => {
      if (criterioOrden === 'cronologico') {
        return a.cuotaPosesion - b.cuotaPosesion;
      }
      return a.socioId - b.socioId;
    });

    return lista.map((fs) => {
      const { fechaCorta, fechaLarga } = formatFecha(fechaInicio, fs.cuotaPosesion);
      return {
        socioId: fs.socioId,
        cuotaPosesion: fs.cuotaPosesion,
        fechaProyectada: fechaLarga,
        fechaCorta,
        ordenEntrega: rankingCronologico[fs.socioId] || 1,
        isSelected: fs.socioId === socioSeleccionado
      };
    });
  }, [flujosSocios, fechaInicio, socioSeleccionado, criterioOrden]);

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Línea de Tiempo de Posesiones y Adjudicación</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cronograma secuencial de entrega de unidades (haz clic en un socio para auditar su cuenta)
          </p>
        </div>

        {/* Controles de orden */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-semibold flex items-center gap-1">
              <ArrowDownUp className="w-3 h-3 text-indigo-400" /> Ordenar:
            </span>
            <button
              onClick={() => setCriterioOrden('cronologico')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                criterioOrden === 'cronologico'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ordenado por fecha de entrega de llaves"
            >
              Cronológico (Fecha)
            </button>
            <button
              onClick={() => setCriterioOrden('socio')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                criterioOrden === 'socio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ordenado por número de unidad (D1, D2, D3...)"
            >
              Por Socio (D1 a DN)
            </button>
          </div>
        </div>
      </div>

      {/* Nota explicativa de orden de entrega */}
      <div className="bg-slate-950/60 border border-slate-800/80 px-3.5 py-2 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span>
          El orden de entrega refleja el mes en que cada socio recibe la posesión. Podés modificar el mes de adjudicación de cualquier socio desde su campo <strong className="text-amber-300 font-mono">"Adjudica Cuota"</strong>.
        </span>
      </div>

      {/* Horizontal Stepped Progress Bar (Scrollable en desktop y tablet) */}
      <div className="relative pt-2 pb-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center min-w-max gap-3 sm:gap-4 px-1">
          {timelineNodes.map((node, index) => {
            const isLast = index === timelineNodes.length - 1;

            return (
              <React.Fragment key={node.socioId}>
                {/* Node Card */}
                <button
                  type="button"
                  onClick={() => onSelectSocio(node.socioId)}
                  className={`group relative text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between w-44 sm:w-48 ${
                    node.isSelected
                      ? 'bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Badge de Orden & Hito */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                      Entrega #{node.ordenEntrega}
                    </span>
                    <div className={`p-1.5 rounded-lg ${
                      node.isSelected ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20'
                    }`}>
                      <Home className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Socio Title */}
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      Socio D{node.socioId}
                    </span>
                  </div>

                  {/* Cuota & Fecha */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono space-y-0.5">
                    <div className="text-amber-300 font-bold">
                      Mes {node.cuotaPosesion}
                    </div>
                    <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{node.fechaProyectada}</span>
                    </div>
                  </div>

                  {/* Active Indicator Pin */}
                  {node.isSelected && (
                    <div className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-extrabold shadow-sm animate-pulse">
                      Activo
                    </div>
                  )}
                </button>

                {/* Connector Arrow */}
                {!isLast && (
                  <div className="flex items-center text-slate-700 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PossessionTimeline;

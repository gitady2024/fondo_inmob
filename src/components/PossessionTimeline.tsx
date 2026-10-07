import React from 'react';
import type { FlujoSocioCalculado } from '../types/fondo';
import { formatFecha } from '../utils/calculations';
import { KeyRound, Home, Calendar, ChevronRight, User } from 'lucide-react';

export interface PossessionNode {
  socioId: number;
  cuotaPosesion: number;
  fechaProyectada: string;
  fechaCorta: string;
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
  // Ordenar socios cronológicamente por su cuota de posesión
  const timelineNodes = React.useMemo(() => {
    if (!flujosSocios || flujosSocios.length === 0) return [];

    return [...flujosSocios]
      .sort((a, b) => a.cuotaPosesion - b.cuotaPosesion)
      .map((fs, index) => {
        const { fechaCorta, fechaLarga } = formatFecha(fechaInicio, fs.cuotaPosesion);
        return {
          socioId: fs.socioId,
          cuotaPosesion: fs.cuotaPosesion,
          fechaProyectada: fechaLarga,
          fechaCorta,
          ordenEntrega: index + 1,
          isSelected: fs.socioId === socioSeleccionado
        };
      });
  }, [flujosSocios, fechaInicio, socioSeleccionado]);

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <span>Línea de Tiempo de Posesiones y Adjudicación</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cronograma secuencial de entrega de unidades (haz clic en un socio para ver su cuenta)
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          {timelineNodes.length} Unidades Funcionales
        </span>
      </div>

      {/* Horizontal Stepped Progress Bar (Scrollable en desktop y tablet) */}
      <div className="relative pt-4 pb-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center min-w-max gap-3 sm:gap-4 px-2">
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

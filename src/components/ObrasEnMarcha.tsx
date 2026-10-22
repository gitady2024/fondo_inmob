import React from 'react';
import type { FondoGuardado } from '../services/fondoService';
import { fmtMoneda } from '../utils/calculations';
import {
  HardHat,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ObrasEnMarchaProps {
  proyectos: FondoGuardado[];
  proyectoActivoId?: string;
  onSimularProyecto: (proyecto: FondoGuardado) => void;
  onPreinscribirProyecto?: (proyecto: FondoGuardado, cuotaEstimada: number) => void;
  className?: string;
  onEditObra?: (obraId: string) => void;
  onOpenObraDetalle?: (obraId: string) => void;
  isAdmin?: boolean;
}

export const ObrasEnMarcha: React.FC<ObrasEnMarchaProps> = ({
  proyectos,
  proyectoActivoId: _proyectoActivoId,
  onSimularProyecto,
  onPreinscribirProyecto: _onPreinscribirProyecto,
  className = '',
  onEditObra: _onEditObra,
  onOpenObraDetalle,
  isAdmin: _isAdmin = false
}) => {
  // Proyectos activos (obras en marcha)
  const proyectosActivos = proyectos.filter((p) => p.estadoPlan !== 'simulacion');
  const listaObras = proyectosActivos.length > 0 ? proyectosActivos : proyectos.slice(0, 1);

  if (listaObras.length === 0) return null;

  const handleAbrirDetalle = (proyecto: FondoGuardado) => {
    if (onOpenObraDetalle) {
      onOpenObraDetalle(proyecto.id);
    } else {
      onSimularProyecto(proyecto);
    }
  };

  return (
    <section
      id="seccion-obras-en-marcha"
      aria-label="Obras en marcha y avance real"
      className={`scroll-mt-24 space-y-3 ${className}`}
    >
      {/* Listado en renglón único: cada obra figura en solo una línea con datos básicos */}
      {listaObras.map((proyecto) => {
        const cantidadDeptos = Number(proyecto.params?.cantidadDeptos) || 10;
        const cantidadCuotas = Number(proyecto.params?.cantidadCuotas) || 36;
        const costoDepto = Number(proyecto.params?.costoDepto) > 0 ? Number(proyecto.params.costoDepto) : 70000;
        const cuotaEstimada = (Number(proyecto.params?.valorCuotaBase) > 0)
          ? Number(proyecto.params.valorCuotaBase)
          : (cantidadCuotas > 0 ? Math.round(costoDepto / cantidadCuotas) : 0);

        // Adjudicaciones y unidades disponibles
        const adjudicacionesObj = proyecto.adjudicacionFijada || {};
        const unidadesAdjudicadasConteo = Object.keys(adjudicacionesObj).length;
        const unidadesAdjudicadas = unidadesAdjudicadasConteo > 0
          ? Math.min(unidadesAdjudicadasConteo, cantidadDeptos - 1)
          : Math.max(1, Math.min(7, cantidadDeptos - 3));
        const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);

        // Avance ponderado
        let porcentajeAvanceObra = 68;
        if (proyecto.datosTecnicos?.etapas && proyecto.datosTecnicos.etapas.length > 0) {
          const totalPonderado = proyecto.datosTecnicos.etapas.reduce(
            (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
            0
          );
          if (totalPonderado > 0) porcentajeAvanceObra = Math.round(totalPonderado);
        }

        return (
          <div
            key={proyecto.id}
            id={`renglon-obra-${proyecto.id}`}
            onClick={() => handleAbrirDetalle(proyecto)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAbrirDetalle(proyecto);
              }
            }}
            className="w-full bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 hover:to-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xl hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-left"
            title="Clic para abrir y ver la totalidad de los datos (aspecto financiero y técnico)"
          >
            {/* Lado izquierdo: Badge amarillo + Nombre básico de la obra */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm shadow-amber-400/20">
                <HardHat className="w-3.5 h-3.5 text-slate-950" />
                <span>Obra en Marcha</span>
              </span>

              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-amber-300 transition-colors truncate">
                  {proyecto.nombre}
                </h3>
                <span className="text-[11px] text-slate-400 block truncate">
                  {proyecto.datosTecnicos?.direccionObra || 'Zona Céntrica de Alta Valorización'}
                </span>
              </div>
            </div>

            {/* Centro: Datos básicos en una sola línea (Avance, Cuota, Disponibilidad) */}
            <div className="flex items-center flex-wrap sm:flex-nowrap gap-4 sm:gap-6 text-xs text-slate-300 font-mono shrink-0">
              {/* Avance */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Avance:</span>
                <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full"
                    style={{ width: `${porcentajeAvanceObra}%` }}
                  />
                </div>
                <strong className="text-emerald-400 font-bold">{porcentajeAvanceObra}%</strong>
              </div>

              {/* Plazo y Cuota */}
              <div className="hidden sm:block">
                <span className="text-slate-400 text-[11px]">Plazo:</span>{' '}
                <strong className="text-white">{cantidadCuotas} cuotas</strong>
              </div>

              <div className="hidden sm:block">
                <span className="text-slate-400 text-[11px]">Cuota base:</span>{' '}
                <strong className="text-amber-300">{fmtMoneda(cuotaEstimada)}</strong>
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-slate-300">
                  Quedan <strong className="text-white font-bold">{unidadesDisponibles}</strong> de {cantidadDeptos}
                </span>
              </div>
            </div>

            {/* Lado derecho: Botón de apertura a detalle completo */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 group-hover:bg-amber-400 text-amber-300 group-hover:text-slate-950 text-xs font-black border border-amber-500/30 group-hover:border-amber-400 transition-all shadow-sm">
                <span>Ver Detalle (Financiero & Técnico)</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default ObrasEnMarcha;

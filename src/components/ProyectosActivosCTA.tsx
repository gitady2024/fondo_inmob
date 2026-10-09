import React, { useState } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import { fmtMoneda } from '../utils/calculations';
import {
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { generarEnlaceWhatsApp, GOOGLE_CALENDAR_MEETING_URL } from '../types/preinscripcion';

interface ProyectosActivosCTAProps {
  proyectos: FondoGuardado[];
  proyectoActivoId?: string;
  onAdoptarProyecto: (proyecto: FondoGuardado) => void;
  onPreinscribirProyecto?: (proyecto: FondoGuardado, cuotaEstimada: number) => void;
  onContactarProyecto?: (proyectoNombre: string) => void;
}

export const ProyectosActivosCTA: React.FC<ProyectosActivosCTAProps> = ({
  proyectos,
  proyectoActivoId,
  onAdoptarProyecto,
  onPreinscribirProyecto,
  onContactarProyecto
}) => {
  const [desplegado, setDesplegado] = useState<boolean>(true);

  // Filtrar solo proyectos en marcha / activos
  const proyectosActivos = proyectos.filter(
    (p) => p.estadoPlan !== 'simulacion'
  );

  if (proyectosActivos.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl transition-all space-y-4">
      
      {/* Cabecera del Módulo con Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Oportunidades Fiduciarias Reales
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                • {proyectosActivos.length} obras con cupos
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              ¿Deseas invertir en una obra activa en marcha?
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDesplegado(!desplegado)}
          className="self-end sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span>{desplegado ? 'Ocultar Obras' : 'Ver Obras Disponibles'}</span>
          {desplegado ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenido desplegable con las tarjetas de proyectos */}
      {desplegado && (
        <div className="space-y-3 pt-1 animate-in fade-in duration-200">
          <p className="text-xs text-slate-300">
            Selecciona una obra para simularla en 1-clic con parámetros reales, o preinscríbete directamente para asegurar tu cupo:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {proyectosActivos.map((p) => {
              const esSeleccionado = proyectoActivoId === p.id;
              const cuotaEstimada = Math.round(
                p.params.costoDepto / (p.params.cantidadCuotas || 48)
              );
              const enlaceWa = generarEnlaceWhatsApp(p.nombre, cuotaEstimada);

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-4 relative ${
                    esSeleccionado
                      ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Círculo Activo</span>
                      </span>

                      {esSeleccionado && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono">
                          Simulando
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1" title={p.nombre}>
                        {p.nombre}
                      </h4>
                      {p.descripcion && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {p.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Fila de Parámetros Clave */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 text-xs font-mono">
                      <div>
                        <span className="text-[10px] font-sans text-slate-400 block">Valor Depto:</span>
                        <strong className="text-white text-xs">
                          {fmtMoneda(p.params.costoDepto)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-sans text-slate-400 block">Cuota pura est.:</span>
                        <strong className="text-emerald-400 text-xs">
                          {fmtMoneda(cuotaEstimada)}/mes
                        </strong>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 font-sans">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{p.params.cantidadCuotas} cuotas</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-300 font-sans">
                        <Layers className="w-3 h-3 text-slate-500" />
                        <span>{p.params.cantidadDeptos} unidades</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones para el Proyecto de Alto Impacto */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onAdoptarProyecto(p)}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        esSeleccionado
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{esSeleccionado ? 'Parámetros Cargados' : 'Simular este Proyecto'}</span>
                      {!esSeleccionado && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>

                    {/* Botón de Preinscripción Oficial Llamativo */}
                    {onPreinscribirProyecto ? (
                      <button
                        type="button"
                        onClick={() => onPreinscribirProyecto(p, cuotaEstimada)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Quiero Preinscribirme en este Proyecto</span>
                      </button>
                    ) : onContactarProyecto ? (
                      <button
                        type="button"
                        onClick={() => onContactarProyecto(p.nombre)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Consultar / Preinscribirme</span>
                      </button>
                    ) : null}

                    {/* Enlaces de contacto directo para cada proyecto */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <a
                        href={enlaceWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-[10px] font-semibold border border-emerald-500/20 flex items-center justify-center gap-1 text-center transition-colors"
                        title="Consultar por WhatsApp con este proyecto"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={GOOGLE_CALENDAR_MEETING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-[10px] font-semibold border border-indigo-500/20 flex items-center justify-center gap-1 text-center transition-colors"
                        title="Agendar entrevista online"
                      >
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>Entrevista 1 a 1</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

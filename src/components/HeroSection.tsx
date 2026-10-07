import React from 'react';
import { ArrowDown, Building2, ShieldCheck, Sparkles, TrendingUp, FileText, ChevronRight } from 'lucide-react';

interface HeroSectionProps {
  onStartSimulation: () => void;
  onOpenContrato?: () => void;
  nombreFondoActivo?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartSimulation,
  onOpenContrato,
  nombreFondoActivo
}) => {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-10 md:p-12 mb-8 transition-all">
      {/* Background Glows & Architectural Grid FX */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
        {/* Compliance / Value Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm animate-fade-in shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Fideicomisos al Costo & Círculos de Ahorro Mutuo</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Marco Legal CCCN / IGJ</span>
        </div>

        {/* H1 Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Simulador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Fondos Inmobiliarios</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Planificá, simulá y gestioná el flujo de capital de tu círculo inmobiliario en segundos. Motor financiero adaptado a la normativa argentina.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <button
            onClick={onStartSimulation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Crear mi simulación</span>
            <ArrowDown className="w-4 h-4 animate-bounce text-indigo-200" />
          </button>

          {onOpenContrato && (
            <button
              onClick={onOpenContrato}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-semibold transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Ver Modelo de Contrato</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Quick Highlights / Trust Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 text-left border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Cuadro de Marcha Preciso</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Cuota pura, gastos prorrateados y compensación de anticipos.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Cálculo Auditado</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Ajustes CAC y cesiones de posición contractual sin asimetrías.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Portal & Documentación</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Visor para socios, licitaciones y exportación en PDF / Excel.</p>
            </div>
          </div>
        </div>

        {nombreFondoActivo && (
          <div className="text-xs text-slate-400 font-mono">
            Plan en edición activa: <span className="text-indigo-300 font-semibold">{nombreFondoActivo}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeroSection;

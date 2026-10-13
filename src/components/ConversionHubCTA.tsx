import React from 'react';
import {
  MessageSquare,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  PhoneCall,
  Clock
} from 'lucide-react';
import {
  WHATSAPP_CONTACT_NUMBER,
  GOOGLE_CALENDAR_MEETING_URL,
  generarEnlaceWhatsApp
} from '../types/preinscripcion';
import { trackClicAgendarEntrevista } from '../services/analyticsService';

interface ConversionHubCTAProps {
  proyectoNombre: string;
  cuotaEstimada?: number;
  anticipoEstimado?: number;
  onAbrirPreinscripcion: () => void;
  className?: string;
}

export const ConversionHubCTA: React.FC<ConversionHubCTAProps> = ({
  proyectoNombre,
  cuotaEstimada,
  anticipoEstimado,
  onAbrirPreinscripcion,
  className = ''
}) => {
  const enlaceWhatsApp = generarEnlaceWhatsApp(
    proyectoNombre,
    cuotaEstimada
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 transition-all hover:border-amber-400/60 ${className}`}
    >
      {/* Resplandor de fondo decorativo */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Cabecera del Módulo de Conversión */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Atención Personalizada & Suscripción Inmediata</span>
          </div>

          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            ¿Listo para dar el siguiente paso en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200">
              {proyectoNombre}
            </span>
            ?
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Elige el canal que mejor se adapte a tu comodidad. Nuestro equipo fiduciario te acompañará para asegurar tu unidad y resolver todas tus consultas técnicas y financieras.
          </p>
        </div>

        {/* Resumen flotante de la simulación */}
        {cuotaEstimada && cuotaEstimada > 0 && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 text-right space-y-1 shadow-inner">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              Cuota Simulada Seleccionada
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              USD ${Math.round(cuotaEstimada).toLocaleString('es-AR')}/mes
            </div>
            {anticipoEstimado && anticipoEstimado > 0 && (
              <span className="text-[11px] text-amber-400 block font-medium">
                Anticipo base: USD ${Math.round(anticipoEstimado).toLocaleString('es-AR')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 3 Canales de Conversión de Alto Impacto */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
        
        {/* CANAL 1: WhatsApp Directo */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 via-slate-900/60 to-slate-950 p-5 transition-all duration-300 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Respuesta Rápida</span>
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                Quiero consultar por WhatsApp
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Chatea directamente con nuestro asesor al número oficial. Te enviamos la memoria técnica y opciones de cuotas.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{WHATSAPP_CONTACT_NUMBER}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <a
              href={enlaceWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClicAgendarEntrevista('whatsapp', cuotaEstimada, cuotaEstimada, proyectoNombre)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <span>Abrir Chat de WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CANAL 2: Entrevista Personal Online (Google Calendar) */}
        <div className="group relative flex flex-col justify-between rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/60 to-slate-950 p-5 transition-all duration-300 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                <Zap className="w-3 h-3 text-indigo-400" />
                <span>Reunión 1 a 1</span>
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                Entrevista Personal Online
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Agenda una videollamada personalizada para revisar números, plazos de obra y contratos fiduciarios en tiempo real.
              </p>
              <div className="mt-2.5 text-[11px] text-slate-400 flex items-center gap-1">
                <span>Vía Google Meet • Horario a tu elección</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <a
              href={GOOGLE_CALENDAR_MEETING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClicAgendarEntrevista('calendar', cuotaEstimada, cuotaEstimada, proyectoNombre)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <span>Agendar en Google Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* CANAL 3: Preinscripción Oficial (Formulario con 5 campos obligatorios) */}
        <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/50 via-slate-900/80 to-slate-950 p-5 transition-all duration-300 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20">
          
          {/* Badge VIP flotante */}
          <div className="absolute -top-3 right-4">
            <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
              Recomendado
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center transition-transform group-hover:scale-110">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>Reserva Formal</span>
              </span>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white group-hover:text-amber-300 transition-colors">
                Quiero Preinscribirme
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Completa tus datos obligatorios (DNI, contacto e importe disponible) para asegurar tu prioridad de suscripción.
              </p>
              <div className="mt-2.5 text-[11px] text-amber-300/80 font-medium">
                ✓ Registro fiduciario directo sin intermediarios
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2">
            <button
              type="button"
              onClick={onAbrirPreinscripcion}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer"
            >
              <span>Completar Formulario de Preinscripción</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Pie con nota de seguridad fiduciaria */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Fondo de Inversión Inmobiliaria bajo régimen fiduciario auditado por administración colegiada.</span>
        </div>
        <span className="text-slate-400 font-mono">San Juan, Argentina</span>
      </div>
    </div>
  );
};

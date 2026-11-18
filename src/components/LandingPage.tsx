import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  MoreVertical,
  ScrollText,
  Printer,
  RefreshCw,
  Calculator,
  HardHat,
  User,
  Pencil,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  Layers,
  DollarSign,
  FileText,
  AlertCircle,
  Ban,
  Home,
  Key
} from 'lucide-react';
import type { FondoGuardado } from '../services/fondoService';
import { PLANTILLAS_PREDEFINIDAS } from '../services/fondoService';
import type { UserProfile } from '../types/auth';
import { ObrasEnMarcha } from './ObrasEnMarcha';
import { PreinscripcionModal } from './PreinscripcionModal';
import { trackSimuladorInicio, trackClicAgendarEntrevista } from '../services/analyticsService';

interface LandingPageProps {
  onStartSimulation: (proyecto?: FondoGuardado) => void;
  onOpenContrato?: () => void;
  onPrint?: () => void;
  onReset?: () => void;
  proyectos?: FondoGuardado[];
  proyectoActivoId?: string;
  onAdoptarProyecto?: (proyecto: FondoGuardado) => void;
  /** Solo visible si el usuario activo es admin o técnico */
  onOpenObrasAdmin?: () => void;
  /** Usuario actualmente autenticado (o null) */
  user?: UserProfile | null;
  /** Callback para abrir el modal de login / ingresar a mi cuenta */
  onOpenLogin?: () => void;
  /** Callback para seleccionar portal específico: 'admin' | 'socio' | 'tecnico' */
  onSelectPortal?: (portal: 'admin' | 'socio' | 'tecnico') => void;
  /** Callback para editar directamente la obra activa */
  onEditObra?: (obraId?: string) => void;
  /** Callback para ver los detalles completos del plan fiduciario */
  onVerDetallesPlan?: (obraId: string) => void;
  /** Callback para abrir la página completa de detalle de la obra */
  onOpenObraDetalle?: (obraId?: string) => void;
  /** Callback para cerrar sesión y salir de la cuenta */
  onSignOut?: () => void;
  /** Callback para eliminar una obra en marcha (Perfil Admin) */
  onDeleteObra?: (obraId: string, nombre: string) => void;
  /** Callback para navegar a la página completa de Obras en Marcha (/obras) */
  onNavigateObras?: () => void;
  /** Callback para navegar a la plataforma / backoffice (/app) */
  onNavigateApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSimulation,
  onOpenContrato,
  onPrint,
  onReset,
  proyectos,
  proyectoActivoId,
  onAdoptarProyecto,
  onOpenObrasAdmin,
  user,
  onOpenLogin,
  onSelectPortal,
  onEditObra,
  onVerDetallesPlan,
  onOpenObraDetalle,
  onSignOut,
  onDeleteObra,
  onNavigateObras,
  onNavigateApp
}) => {
  const [modalPreinscripcionOpen, setModalPreinscripcionOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlanesOpen, setIsPlanesOpen] = useState(false);
  const [isIngresarOpen, setIsIngresarOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const planesMenuRef = useRef<HTMLDivElement>(null);
  const ingresarMenuRef = useRef<HTMLDivElement>(null);

  // Al montar la portada de Inicio, garantizar que siempre inicie en el header superior (0, 0)
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Mostrar el FAB solo cuando el usuario haya hecho scroll más del 50% de la altura de la página
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setShowFab(scrolled / docHeight >= 0.5);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [preinscripcionTarget, setPreinscripcionTarget] = useState<{
    nombre: string;
    id?: string;
    cuota?: number;
    anticipo?: number;
  }>({ nombre: '' });

  // Lista de proyectos con fallback a las plantillas predefinidas
  const proyectosDisponibles: FondoGuardado[] =
    proyectos && proyectos.length > 0
      ? proyectos
      : (PLANTILLAS_PREDEFINIDAS.map((p, idx) => ({
          ...p,
          id: `tpl-${idx}`,
          updated_at: new Date().toISOString()
        })) as FondoGuardado[]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInvertiAhora = () => {
    if (onNavigateObras) {
      onNavigateObras();
    } else {
      scrollToSection('obras-activas');
    }
  };

  return (
    <div className="w-full text-slate-100 relative pb-28 sm:pb-16">
      {/* FAB Flotante: Agendar Entrevista (ubicado a la izquierda para no solaparse jamás con el Asesor IA) */}
      <a
        id="btn-flotante-calendar"
        href="https://calendar.app.google/aacxfmLJk73KnyB39"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Agendar entrevista de ingreso"
        title="Agendar Entrevista para Ingresar"
        onClick={() => trackClicAgendarEntrevista('fab')}
        className={`fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_4px_24px_rgba(79,70,229,0.55)] flex items-center justify-center transition-all duration-300 ${
          showFab
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
      </a>

      {/* ==================================================================== */}
      {/* HERO SECTION: ENFOQUE 100% COMERCIAL (SIN PUERTAS DE ENTRADA DOBLES)  */}
      {/* ==================================================================== */}
      <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800/80 mb-10 px-4 sm:px-8 text-center space-y-7">
        <div className="inline-block bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300">
          🚀 Fideicomiso al Costo Real (Art. 1666 CCCN)
        </div>
        
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Dejá de alquilar plata al banco. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Comprá Ladrillos.
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
          Ingresá al mercado inmobiliario al costo con un anticipo desde <strong className="text-white font-semibold">USD 10.000</strong>. Sin la trampa de la inflación UVA, sin intereses usureros y con la libertad de vender tu contrato cuando quieras.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            type="button"
            id="hero-cta-simular"
            onClick={() => {
              trackSimuladorInicio({ label: 'hero' });
              onStartSimulation();
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm sm:text-base font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Simular Plan a Medida</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* BOTÓN: INVERTÍ AHORA */}
          <button
            type="button"
            onClick={handleInvertiAhora}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm sm:text-base font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-amber-500/25 transition transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-slate-950" />
            <span>Invertí Ahora</span>
          </button>
          
          <a
            href="https://calendar.app.google/aacxfmLJk73KnyB39"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClicAgendarEntrevista('calendar')}
            className="w-full sm:w-auto bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white text-sm sm:text-base font-bold px-6 py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Agendar Videollamada</span>
          </a>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECCIÓN: OBRAS EN MARCHA (RENGLÓN ÚNICO Y APERTURA A DETALLE COMPLETO) */}
      {/* ==================================================================== */}
      <section id="obras-activas" className="mb-14 scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase">
              Obras en Marcha Activas
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Clic en el renglón para abrir la totalidad de datos financieros y técnicos
            </span>
            {onNavigateObras && (
              <button
                type="button"
                id="btn-ver-todas-obras-landing"
                onClick={onNavigateObras}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer bg-slate-900 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1 rounded-lg"
              >
                <span>Ver página de Obras</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <ObrasEnMarcha
          proyectos={proyectosDisponibles}
          proyectoActivoId={proyectoActivoId}
          onOpenObraDetalle={onOpenObraDetalle || onVerDetallesPlan}
          onSimularProyecto={(p) => {
            if (onAdoptarProyecto) {
              onAdoptarProyecto(p);
            } else {
              onStartSimulation(p);
            }
          }}
          onPreinscribirProyecto={(p, cuota) => {
            setPreinscripcionTarget({
              nombre: p.nombre,
              id: p.id,
              cuota: cuota,
              anticipo: p.params.costoDepto * 0.2
            });
            setModalPreinscripcionOpen(true);
          }}
          onEditObra={onEditObra}
          isAdmin={user?.role === 'admin'}
          onDeleteObra={onDeleteObra}
        />
      </section>

      {/* ==================================================================== */}
      {/* TABLA COMPARATIVA: FONDO MUTUO vs CRÉDITO HIPOTECARIO UVA           */}
      {/* ==================================================================== */}
      <section id="comparativa" className="mb-16 scroll-mt-24">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Por qué el Fideicomiso al Costo vence al Crédito UVA?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Comparativa real entre un crédito bancario indexado y nuestro sistema de ahorro previo mutuo entre pares.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-emerald-400 font-bold bg-emerald-950/20 rounded-t-xl">
                    Inverfondo (Inversión Fiduciaria Inmobiliaria)
                  </th>
                  <th className="py-3 px-4 text-rose-400 font-bold">Crédito Hipotecario UVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Tasa de Interés</td>
                  <td className="py-3.5 px-4 text-emerald-300 bg-emerald-950/20 font-semibold">
                    0% Tasa de Interés (Sin Usura)
                  </td>
                  <td className="py-3.5 px-4 text-rose-300">UVA + 5.5% a 8.5% anual en dólares</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Ajuste de Capital</td>
                  <td className="py-3.5 px-4 text-emerald-300 bg-emerald-950/20">
                    Costo real de obra (CAC)
                  </td>
                  <td className="py-3.5 px-4 text-rose-300">Inflación IPC + Dólar bancario</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Adjudicación & Posesión</td>
                  <td className="py-3.5 px-4 text-emerald-300 bg-emerald-950/20">
                    Por orden de cuota y sorteo/licitación
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">Inmediata pero hipotecada a 20-30 años</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Salida Anticipada</td>
                  <td className="py-3.5 px-4 text-emerald-300 bg-emerald-950/20 font-semibold">
                    Cesión de boleto CCCN sin penalización
                  </td>
                  <td className="py-3.5 px-4 text-rose-300">Cancelación forzosa con altas comisiones</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Requisitos de Ingreso</td>
                  <td className="py-3.5 px-4 text-emerald-300 bg-emerald-950/20">
                    DNI y justificación de fondos
                  </td>
                  <td className="py-3.5 px-4 text-rose-300">Demostrar ingresos exorbitantes en blanco</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CÓMO FUNCIONA                                                        */}
      {/* ==================================================================== */}
      <section id="como-funciona" className="mb-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            ¿Cómo Funciona el Círculo de Ahorro Mutuo?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Un esquema colaborativo transparente donde cada cuota se convierte inmediatamente en metros cuadrados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Suscríbete a un Círculo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Elige el proyecto activo, define tu anticipo y abona tu cuota pura mensual al costo de construcción.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Avance y Adjudicación</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La obra avanza con el aporte colectivo. Las unidades se adjudican por orden preestablecido o licitación anticipada.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Posesión o Cesión</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Toma posesión para habitar o alquilar tu departamento terminado, o vende tu posición en el mercado con plusvalía.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* CONDICIONES CLARAS Y OPERATORIA DEL FONDO                            */}
      {/* ==================================================================== */}
      <section id="condiciones-fondo" className="mb-16 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transparencia y Reglas Claras</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Condiciones de Adhesión y Operatoria
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Todo lo que necesitás saber antes de suscribirte, respaldado en el contrato marco de fideicomiso al costo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Moneda de Pago */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Moneda de Pago</span>
              <span className="text-[10px] uppercase font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">USD</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              La integración de anticipos y cuotas se realiza en <strong>dólares estadounidenses (USD)</strong>, brindando máxima estabilidad y resguardo del poder de compra de los materiales de obra.
            </p>
          </div>

          {/* 2. Documentación */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Documentación Requerida
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para ingresar al fideicomiso solo se solicita: <strong>DNI del titular</strong>, <strong>constancia de domicilio</strong> actualizada y <strong>garantía</strong> para perfeccionar el contrato marco.
            </p>
          </div>

          {/* 3. Mora o Retraso */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Mora o Retraso
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ante cualquier atraso en las cuotas se aplica estrictamente la <strong>prima de retraso prevista en el contrato</strong>, protegiendo el ritmo de avance de la obra colectiva.
            </p>
          </div>

          {/* 4. Permutas */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">
              <Ban className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Permutas de Vehículos
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Por el momento <strong>no se aceptan permutas</strong> (vehículos, rodados ni otros bienes) como medio de pago. Todos los aportes se integran en dólares para flujo directo de obra.
            </p>
          </div>

          {/* 5. Terminaciones y Entrega */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Terminaciones de Obra
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Las terminaciones, artefactos y especificaciones constructivas son las <strong>previstas en la memoria técnica del contrato</strong>, garantizando el estándar comprometido.
            </p>
          </div>

          {/* 6. Gastos de Posesión y Escrituración */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 rounded-3xl p-6 space-y-3 transition group">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Posesión y Escrituración
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              A elección del fondo, pueden <strong>incluirse al momento de la entrega o prorratearse entre las cuotas</strong>. La modalidad siempre se establece formalmente en el contrato inicial.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SEGURIDAD LEGAL Y CTA                                                */}
      {/* ==================================================================== */}
      <section id="seguridad" className="py-16 border-t border-slate-800 scroll-mt-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Seguridad Jurídica Absoluta
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Nuestro modelo está estructurado bajo las normativas de <strong>Fideicomiso (Art. 1666 CCCN)</strong> y <strong>Cesión de Posición Contractual (Art. 1614 CCCN)</strong>. Tu capital está blindado legalmente y separado del patrimonio de la desarrolladora.
          </p>

          <div className="pt-4">
            <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl max-w-2xl mx-auto space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-400">
                ¿Te cierran los números?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                No pierdas la oportunidad de ingresar en la fase inicial del pozo. Simulá tu plan y conversemos 15 minutos por Google Meet para revisar los detalles técnicos y contractuales.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <a
                  href="https://calendar.app.google/aacxfmLJk73KnyB39"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackClicAgendarEntrevista('calendar')}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg text-xs sm:text-sm text-center flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Entrevista Virtual</span>
                </a>
                
                <button
                  type="button"
                  id="bottom-cta-simular"
                  onClick={() => {
                    trackSimuladorInicio({ label: 'footer-cta' });
                    onStartSimulation();
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3.5 px-6 rounded-xl transition text-xs sm:text-sm text-center cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Simular Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Preinscripción a Obra Activa */}
      <PreinscripcionModal
        isOpen={modalPreinscripcionOpen}
        onClose={() => setModalPreinscripcionOpen(false)}
        proyectoNombre={preinscripcionTarget.nombre}
        proyectoId={preinscripcionTarget.id}
        cuotaEstimada={preinscripcionTarget.cuota}
        anticipoEstimado={preinscripcionTarget.anticipo}
      />
    </div>
  );
};

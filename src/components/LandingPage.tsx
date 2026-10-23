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
  LogOut
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
  onEditObra,
  onVerDetallesPlan,
  onOpenObraDetalle,
  onSignOut,
  onDeleteObra,
  onNavigateApp
}) => {
  const [modalPreinscripcionOpen, setModalPreinscripcionOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Cerrar menú ⋮ al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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
    scrollToSection('obras-activas');
  };

  return (
    <div className="w-full text-slate-100 relative">
      {/* FAB Flotante: solo ícono circular, visible tras scroll del 50% */}
      <a
        id="btn-flotante-calendar"
        href="https://calendar.app.google/aacxfmLJk73KnyB39"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Agendar entrevista de ingreso"
        title="Agendar Entrevista para Ingresar"
        onClick={() => trackClicAgendarEntrevista('fab')}
        className={`fixed bottom-6 right-5 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_4px_24px_rgba(79,70,229,0.55)] flex items-center justify-center transition-all duration-300 ${
          showFab
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <Calendar className="w-6 h-6" />
      </a>

      {/* ==================================================================== */}
      {/* CABECERA DE LA LANDING: UN SOLO CTA ("Simular mi plan") + MENÚ (⋮)   */}
      {/* ==================================================================== */}
      <nav className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md mb-8 px-4 sm:px-6 py-3.5 transition-all sticky top-2 z-30 shadow-lg shadow-black/20">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Fondo Inmobiliario <span className="text-indigo-400">1</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">Inversión Fiduciaria al Costo</span>
            </div>
          </div>

          {/* Enlaces Desktop */}
          <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('comparativa')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Fondo vs UVA
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('como-funciona')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Cómo Funciona
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('seguridad')}
              className="text-slate-300 hover:text-white transition cursor-pointer"
            >
              Seguridad Legal
            </button>
          </div>

          {/* Zona de Acción Simplificada y Sin Sobrecarga */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Obras en Marcha: Estilo sutil y armónico */}
            <button
              type="button"
              id="btn-obras-en-marcha-nav"
              onClick={() => {
                if (onOpenObraDetalle) {
                  onOpenObraDetalle(proyectoActivoId);
                } else if (onVerDetallesPlan) {
                  onVerDetallesPlan(proyectoActivoId || '');
                } else {
                  scrollToSection('obras-activas');
                }
              }}
              className="bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Ver Obras en Marcha con detalles financieros y técnicos completos"
            >
              <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Obras en Marcha</span>
            </button>

            {/* Acceso a Cuenta / BackOffice del Administrador */}
            {user ? (
              <div className="flex items-center gap-1.5">
                {/* Botón Claro y Directo al BackOffice o Portal */}
                <button
                  type="button"
                  id="landing-btn-mi-cuenta"
                  onClick={() => {
                    if (onNavigateApp) {
                      onNavigateApp();
                    } else if (onOpenLogin) {
                      onOpenLogin();
                    }
                  }}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition transform hover:scale-[1.02] cursor-pointer shadow-md ${
                    user.role === 'admin'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                      : user.role === 'tecnico'
                      ? 'bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-300'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                  }`}
                  title={
                    user.role === 'admin'
                      ? 'Ir al BackOffice del Administrador'
                      : `Conectado como ${user.nombre}. Ir a mi panel.`
                  }
                >
                  {user.role === 'admin' ? (
                    <>
                      <Shield className="w-4 h-4 text-indigo-200 shrink-0" />
                      <span>BackOffice Admin</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-200 shrink-0 hidden sm:inline" />
                    </>
                  ) : user.role === 'tecnico' ? (
                    <>
                      <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Panel Técnico</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0 hidden sm:inline" />
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Mi Cuenta</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:inline" />
                    </>
                  )}
                </button>

                {/* Salir de la cuenta: Botón de ícono compacto */}
                {onSignOut && (
                  <button
                    type="button"
                    id="landing-btn-logout"
                    onClick={onSignOut}
                    className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 transition flex items-center justify-center cursor-pointer shadow-sm"
                    title="Cerrar sesión de la cuenta actual"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                  </button>
                )}
              </div>
            ) : (
              onOpenLogin && (
                <button
                  type="button"
                  id="landing-btn-iniciar-sesion"
                  onClick={onOpenLogin}
                  className="px-3 sm:px-3.5 py-2 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-600"
                  title="Iniciar sesión en tu cuenta"
                >
                  <User className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Ingresar</span>
                </button>
              )
            )}

            {/* Único CTA Comercial Principal: Simular Plan */}
            <button
              type="button"
              id="landing-cta-simular"
              onClick={() => {
                trackSimuladorInicio({ label: 'navbar' });
                onStartSimulation();
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs sm:text-sm font-extrabold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition transform hover:scale-[1.02] cursor-pointer flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4 text-emerald-100" />
              <span className="hidden sm:inline">Simular Plan</span>
              <span className="sm:hidden">Simular</span>
            </button>

            {/* MENÚ DESPLEGABLE (⋮) PARA ACCIONES SECUNDARIAS */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                id="landing-menu-trigger"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Más opciones"
                title="Más opciones (Contrato, Imprimir, Restablecer)"
                className={`p-2.5 rounded-xl border text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center ${
                  isMenuOpen
                    ? 'bg-slate-800 border-indigo-500/50 text-white shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div
                  id="landing-dropdown-menu"
                  className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-fade-in backdrop-blur-xl"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Herramientas de Consulta
                  </div>

                  {onOpenContrato && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenContrato();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <ScrollText className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Contrato Tripartito</span>
                        <span className="text-[10px] text-slate-400">Modelo marco y descarga</span>
                      </div>
                    </button>
                  )}

                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onPrint();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Imprimir Ficha</span>
                        <span className="text-[10px] text-slate-400">Resumen de la propuesta</span>
                      </div>
                    </button>
                  )}

                  {onReset && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onReset();
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Restablecer Valores</span>
                        <span className="text-[10px] text-slate-400">Reiniciar parámetros base</span>
                      </div>
                    </button>
                  )}

                  {/* Opción de Editar Obra en el Menú (Solo Administrador) */}
                  {onEditObra && user?.role === 'admin' && (
                    <button
                      type="button"
                      id="btn-menu-editar-obra"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEditObra(proyectoActivoId);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-amber-200">
                          Editar esta obra
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Modificar parámetros constructivos y gastos
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Sección Admin — solo visible si el usuario es administrador */}
                  {onOpenObrasAdmin && user?.role === 'admin' && (
                    <>
                      <div className="mx-3 my-1.5 border-t border-slate-800" />
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Administración
                      </div>
                      <button
                        type="button"
                        id="btn-gestionar-obras"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenObrasAdmin();
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/10 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-semibold text-amber-200">Gestionar Obras</span>
                          <span className="text-[10px] text-slate-400">Crear, editar y eliminar proyectos</span>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Acceso a cuenta / Iniciar sesión en el menú */}
                  {onOpenLogin && (
                    <>
                      <div className="mx-3 my-1.5 border-t border-slate-800" />
                      <button
                        type="button"
                        id="btn-menu-cuenta"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (user && onNavigateApp) {
                            onNavigateApp();
                          } else if (onOpenLogin) {
                            onOpenLogin();
                          }
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition cursor-pointer"
                      >
                        {user?.role === 'admin' ? (
                          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-indigo-200">
                            {user?.role === 'admin'
                              ? 'Ir al BackOffice Administrador'
                              : user
                              ? 'Mi Portal de Usuario'
                              : 'Ingresar a mi cuenta'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {user ? `${user.nombre} (${user.role})` : 'Acceso para socios y administradores'}
                          </span>
                        </div>
                      </button>

                      {user && onSignOut && (
                        <button
                          type="button"
                          id="btn-menu-logout"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onSignOut();
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-rose-300 hover:text-white hover:bg-rose-500/20 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="font-semibold">Cerrar sesión</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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
          <span className="text-xs text-slate-400 hidden sm:inline">
            Clic en el renglón para abrir la totalidad de datos financieros y técnicos
          </span>
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
                    Fondo Inmobiliario (Al Costo)
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

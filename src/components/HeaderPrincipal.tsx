import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import {
  Layers,
  ChevronDown,
  User,
  Shield,
  HardHat,
  ArrowRight,
  MoreVertical,
  ScrollText,
  Printer,
  RefreshCw,
  LogOut,
  Calculator,
  Pencil,
  Sparkles,
  MessageSquare,
  Database
} from 'lucide-react';
import { trackSimuladorInicio } from '../services/analyticsService';

export interface HeaderPrincipalProps {
  user: UserProfile | null;
  currentRoute?: 'landing' | 'obras' | 'obra-detalle' | 'app';
  proyectoActivoId?: string;
  unreadCount?: number;
  onNavigateLanding: () => void;
  onNavigateObras: () => void;
  onNavigateSection: (sectionId: string) => void;
  onStartSimulation: (proyecto?: any) => void;
  onOpenLogin: (role?: UserRole) => void;
  onSelectPortal?: (role: UserRole) => void;
  onNavigateApp?: () => void;
  onSignOut?: () => void;
  onOpenContrato?: () => void;
  onPrint?: () => void;
  onReset?: () => void;
  onOpenObrasAdmin?: () => void;
  onEditObra?: (obraId?: string) => void;
  onOpenMensajes?: () => void;
  onOpenPersistencia?: () => void;
}

export const HeaderPrincipal: React.FC<HeaderPrincipalProps> = ({
  user,
  currentRoute = 'landing',
  proyectoActivoId,
  unreadCount = 0,
  onNavigateLanding,
  onNavigateObras,
  onNavigateSection,
  onStartSimulation,
  onOpenLogin,
  onSelectPortal,
  onNavigateApp,
  onSignOut,
  onOpenContrato,
  onPrint,
  onReset,
  onOpenObrasAdmin,
  onEditObra,
  onOpenMensajes,
  onOpenPersistencia
}) => {
  const [isPlanesOpen, setIsPlanesOpen] = useState(false);
  const [isIngresarOpen, setIsIngresarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const planesMenuRef = useRef<HTMLDivElement>(null);
  const ingresarMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (planesMenuRef.current && !planesMenuRef.current.contains(target)) {
        setIsPlanesOpen(false);
      }
      if (ingresarMenuRef.current && !ingresarMenuRef.current.contains(target)) {
        setIsIngresarOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePlanes = () => {
    setIsPlanesOpen((prev) => !prev);
    setIsIngresarOpen(false);
    setIsMenuOpen(false);
  };

  const toggleIngresar = () => {
    setIsIngresarOpen((prev) => !prev);
    setIsPlanesOpen(false);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    setIsPlanesOpen(false);
    setIsIngresarOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/90 shadow-xl shadow-black/50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex justify-between items-center gap-2">
        
        {/* ================================================================== */}
        {/* LADO IZQUIERDO: ISOLOGO + NOMBRE + ESLOGAN                         */}
        {/* ================================================================== */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 group"
          onClick={onNavigateLanding}
          title="Inverfondo - Inversión Fiduciaria Inmobiliaria"
        >
          <img
            src="/isologo-fondin.png"
            alt="Inverfondo"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
            loading="eager"
          />
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">
              Inverfondo
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-slate-300 tracking-tight leading-tight mt-0.5 truncate">
              Inversión Fiduciaria Inmobiliaria
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* CENTRO: ENLACES DESKTOP PERMANENTES EN TODAS LAS PÁGINAS           */}
        {/* ================================================================== */}
        <div className="hidden lg:flex items-center space-x-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => onNavigateSection('comparativa')}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            Inverfondo vs UVA
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('como-funciona')}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            Cómo Funciona
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('seguridad')}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            Seguridad Legal
          </button>
        </div>

        {/* ================================================================== */}
        {/* LADO DERECHO: PLANES + INGRESAR/PERFIL + MENÚ ⋮                    */}
        {/* ================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* 1. BOTÓN Y MENÚ DESPLEGABLE: PLANES */}
          <div className="relative" ref={planesMenuRef}>
            <button
              type="button"
              id="btn-planes-dropdown"
              onClick={togglePlanes}
              aria-expanded={isPlanesOpen}
              aria-label="Planes y Obras"
              className={`text-xs sm:text-sm font-bold px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-sm border ${
                isPlanesOpen || currentRoute === 'obras'
                  ? 'bg-slate-800 border-amber-500/60 text-amber-200'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 hover:text-amber-200 border-amber-500/40'
              }`}
              title="Planes de inversión y obras en marcha"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>Planes</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-amber-400 shrink-0 transition-transform duration-200 ${
                  isPlanesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPlanesOpen && (
              <div
                id="dropdown-planes-menu"
                className="absolute right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-fade-in backdrop-blur-xl"
              >
                <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Planes y Proyectos</span>
                  <span className="text-amber-400 font-mono text-[9px]">Inverfondo</span>
                </div>

                {/* Opción 1: Obras en Marcha */}
                <button
                  type="button"
                  id="btn-opt-obras-en-marcha"
                  onClick={() => {
                    setIsPlanesOpen(false);
                    onNavigateObras();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/10 active:bg-amber-500/20 flex items-start gap-3 transition cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 shrink-0 mt-0.5">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                      Obras en Marcha
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Proyectos en curso, avances y detalles técnicos
                    </span>
                  </div>
                </button>

                {/* Opción 2: Simular tu plan */}
                <button
                  type="button"
                  id="btn-opt-simular-plan"
                  onClick={() => {
                    setIsPlanesOpen(false);
                    trackSimuladorInicio({ label: 'navbar_dropdown_planes' });
                    onStartSimulation();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-emerald-500/10 active:bg-emerald-500/20 flex items-start gap-3 transition cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 shrink-0 mt-0.5">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                      Simular tu plan
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Calculá tus cuotas, anticipo y adjudicación
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 2. BOTÓN Y MENÚ DESPLEGABLE: INGRESAR / USUARIO */}
          <div className="relative" ref={ingresarMenuRef}>
            <button
              type="button"
              id="btn-ingresar-dropdown"
              onClick={toggleIngresar}
              aria-expanded={isIngresarOpen}
              aria-label="Ingresar a los Portales"
              className={`text-xs sm:text-sm font-extrabold px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-sm border ${
                user
                  ? user.role === 'admin'
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/40 border-indigo-500/60 text-indigo-200'
                    : user.role === 'tecnico'
                    ? 'bg-amber-600/30 hover:bg-amber-600/40 border-amber-500/60 text-amber-200'
                    : 'bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500/60 text-emerald-200'
                  : isIngresarOpen
                  ? 'bg-slate-800 border-indigo-500/60 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/30'
              }`}
              title={user ? `Conectado como ${user.nombre}` : 'Ingresar a los portales del sistema'}
            >
              {user ? (
                user.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300 shrink-0" />
                ) : user.role === 'tecnico' ? (
                  <HardHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                )
              ) : (
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-200 shrink-0" />
              )}
              {user ? (
                <span className="truncate max-w-[85px] sm:max-w-[120px] md:max-w-[150px]">
                  {user.nombre}
                </span>
              ) : (
                <span>Ingresar</span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  isIngresarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isIngresarOpen && (
              <div
                id="dropdown-ingresar-menu"
                className="absolute right-0 mt-2 w-64 sm:w-72 max-w-[calc(100vw-2rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-fade-in backdrop-blur-xl"
              >
                {/* Tarjeta de sesión activa si está autenticado */}
                {user && (
                  <div className="px-3 py-2.5 mx-2 mb-2 rounded-xl bg-slate-800/90 border border-slate-700">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Sesión activa</span>
                      <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {user.role}
                      </span>
                    </div>
                    <div className="font-bold text-white text-xs truncate">{user.nombre}</div>
                    {onNavigateApp && (
                      <button
                        type="button"
                        id="btn-dropdown-ir-a-panel"
                        onClick={() => {
                          setIsIngresarOpen(false);
                          onNavigateApp();
                        }}
                        className="mt-2 w-full py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>Ir a mi Panel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Portales del Sistema
                </div>

                {/* Portal 1: Admin */}
                <button
                  type="button"
                  id="btn-portal-admin"
                  onClick={() => {
                    setIsIngresarOpen(false);
                    if (onSelectPortal) {
                      onSelectPortal('admin');
                    } else if (user?.role === 'admin' && onNavigateApp) {
                      onNavigateApp();
                    } else if (onOpenLogin) {
                      onOpenLogin('admin');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/15 active:bg-indigo-600/25 flex items-start gap-3 transition cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                        Admin
                      </span>
                      {user?.role === 'admin' && (
                        <span className="text-[10px] text-emerald-400 font-semibold">Activo</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      BackOffice y Gestión del Negocio
                    </span>
                  </div>
                </button>

                {/* Portal 2: Socios */}
                <button
                  type="button"
                  id="btn-portal-socios"
                  onClick={() => {
                    setIsIngresarOpen(false);
                    if (onSelectPortal) {
                      onSelectPortal('socio');
                    } else if (user?.role === 'socio' && onNavigateApp) {
                      onNavigateApp();
                    } else if (onOpenLogin) {
                      onOpenLogin('socio');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-emerald-500/15 active:bg-emerald-500/25 flex items-start gap-3 transition cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                        Socios
                      </span>
                      {user?.role === 'socio' && (
                        <span className="text-[10px] text-emerald-400 font-semibold">Activo</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Portal de Adherentes, Cuotas y Aportes
                    </span>
                  </div>
                </button>

                {/* Portal 3: Técnico */}
                <button
                  type="button"
                  id="btn-portal-tecnico"
                  onClick={() => {
                    setIsIngresarOpen(false);
                    if (onSelectPortal) {
                      onSelectPortal('tecnico');
                    } else if (user?.role === 'tecnico' && onNavigateApp) {
                      onNavigateApp();
                    } else if (onOpenLogin) {
                      onOpenLogin('tecnico');
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/15 active:bg-amber-500/25 flex items-start gap-3 transition cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 shrink-0 mt-0.5">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                        Técnico
                      </span>
                      {user?.role === 'tecnico' && (
                        <span className="text-[10px] text-amber-400 font-semibold">Activo</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Módulo Técnico y Certificaciones de Obra
                    </span>
                  </div>
                </button>

                {/* Salir de la cuenta si está logueado */}
                {user && onSignOut && (
                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      type="button"
                      id="btn-portal-signout"
                      onClick={() => {
                        setIsIngresarOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 active:bg-rose-500/20 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-semibold">Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. MENÚ DESPLEGABLE (⋮) PARA ACCIONES SECUNDARIAS */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="landing-menu-trigger"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label="Más opciones"
              title="Más opciones (Contrato, Imprimir, Restablecer)"
              className={`p-1.5 sm:p-2.5 rounded-xl border text-slate-300 hover:text-white transition cursor-pointer flex items-center justify-center ${
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

                {/* Opción: Centro de Mensajes */}
                {user && onOpenMensajes && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenMensajes();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Centro de Mensajes</span>
                        <span className="text-[10px] text-slate-400">Canal directo fiduciario</span>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-rose-500 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Opción: Nube / Persistencia Supabase */}
                {onOpenPersistencia && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenPersistencia();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold">Conectar Nube / Supabase</span>
                      <span className="text-[10px] text-slate-400">Estado de sincronización</span>
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
    </header>
  );
};

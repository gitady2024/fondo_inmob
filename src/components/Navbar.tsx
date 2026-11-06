import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../types/auth';
import {
  Sparkles,
  RefreshCw,
  Printer,
  Database,
  User,
  Shield,
  HardHat,
  ScrollText,
  MessageSquare,
  LogOut,
  MoreVertical,
  Calculator,
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  user: UserProfile | null;
  unreadCount?: number;
  onReset: () => void;
  onPrint: () => void;
  onOpenPersistencia: () => void;
  onOpenLogin: () => void;
  onOpenContrato: () => void;
  onOpenMensajes: () => void;
  onSignOut?: () => void;
  onSimularPlan?: () => void;
  onNavigateLanding?: () => void;
  onOpenObrasAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadCount = 0,
  onReset,
  onPrint,
  onOpenPersistencia,
  onOpenLogin,
  onOpenContrato,
  onOpenMensajes,
  onSignOut,
  onSimularPlan,
  onNavigateLanding,
  onOpenObrasAdmin
}) => {
  const isCloud = isSupabaseConfigured();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú desplegable al hacer clic fuera
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

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 py-3.5 px-4 sm:px-6 rounded-2xl mb-6 shadow-lg shadow-black/20 no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Identidad de Marca Fondin */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onNavigateLanding}
            className="cursor-pointer hover:scale-[1.02] transition-transform flex items-center gap-2.5 shrink-0"
            title="Ir a la portada de Fondin"
          >
            <img
              src="/isologo-fondin.png"
              alt="Fondin"
              className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
              loading="eager"
            />
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-none">
                Fondin
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-tight leading-tight mt-0.5 truncate max-w-[155px] sm:max-w-none">
                Inversión Fiduciaria Inmobiliaria
              </span>
            </div>
          </div>
          <span className="hidden md:inline-flex text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Ahorro Mutuo
          </span>
        </div>

        {/* Zona de Acciones: Único CTA Principal + Menú Desplegable (⋮) */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          
          {/* Volver a Inicio si estamos en el entorno app */}
          {onNavigateLanding && (
            <button
              type="button"
              onClick={onNavigateLanding}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Volver a Inicio"
            >
              <ArrowLeft className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Volver a Inicio</span>
              <span className="sm:hidden">Inicio</span>
            </button>
          )}

          {/* Perfil autenticado (Badge + Salir) o Botón Ingresar al Perfil si no hay sesión */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLogin}
                title="Perfil activo (Clic para cambiar perfil)"
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  user.role === 'admin'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30'
                    : user.role === 'tecnico'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-300 hover:bg-amber-600/30'
                    : 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30'
                }`}
              >
                {user.role === 'admin' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Admin</span>
                  </>
                ) : user.role === 'tecnico' ? (
                  <>
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipo Técnico</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Socio D{user.socioId || 1}</span>
                  </>
                )}
              </button>

              {/* Botón Explícito: Salir de la cuenta */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  id="btn-navbar-logout"
                  className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/40 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Cerrar sesión y salir de la cuenta actual"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Salir de la cuenta</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              id="btn-navbar-login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/25 cursor-pointer"
              title="Ingresar con tu cuenta o perfil"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar al Perfil</span>
            </button>
          )}

          {/* ========================================================= */}
          {/* ÚNICO CALL TO ACTION PRINCIPAL: "SIMULAR PLAN"             */}
          {/* Solo visible para admin y socio, no para técnico           */}
          {/* ========================================================= */}
          {user?.role !== 'tecnico' && (
            <button
              type="button"
              id="nav-cta-simular"
              onClick={onSimularPlan}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-emerald-100" />
              <span>Simular Plan</span>
            </button>
          )}

          {/* ========================================================= */}
          {/* MENÚ DESPLEGABLE DE ACCIONES SECUNDARIAS (⋮)               */}
          {/* ========================================================= */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="nav-dropdown-trigger"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Más opciones"
              title="Más opciones (Contrato, Imprimir, Restablecer)"
              className={`p-2.5 rounded-xl border text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center ${
                isMenuOpen
                  ? 'bg-slate-800 border-indigo-500/50 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </button>

            {/* Panel flotante del Menú ⋮ */}
            {isMenuOpen && (
              <div 
                id="nav-dropdown-menu"
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl shadow-black/80 py-2 z-50 animate-fade-in backdrop-blur-xl"
              >
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Herramientas & Documentación
                </div>

                {/* Opción 1: Contrato Tripartito Oficial */}
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
                    <span className="text-[10px] text-slate-400">Descargar Word / PDF oficial</span>
                  </div>
                </button>

                {/* Opción 2: Imprimir Ficha */}
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
                    <span className="text-[10px] text-slate-400">Reporte ejecutivo de la unidad</span>
                  </div>
                </button>

                {/* Opción 3: Restablecer Valores */}
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
                    <span className="text-[10px] text-slate-400">Volver a los parámetros iniciales</span>
                  </div>
                </button>

                {/* Opción 4: Centro de Mensajes (si hay usuario) */}
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenMensajes();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-indigo-600/20 flex items-center justify-between transition cursor-pointer border-t border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Centro de Mensajes</span>
                        <span className="text-[10px] text-slate-400">Canal directo fiduciario</span>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Opción 5: Supabase Nube (para administradores) */}
                {user && user.role === 'admin' && (
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
                      <span className="font-semibold">Base de Datos / Supabase</span>
                      <span className="text-[10px] text-slate-400">
                        {isCloud ? 'Nube Conectada' : 'Guardar y gestionar planes'}
                      </span>
                    </div>
                  </button>
                )}

                {/* Opción 6: Gestionar / Editar Obras Activas (Solo Administrador) */}
                {user && user.role === 'admin' && onOpenObrasAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenObrasAdmin();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-amber-500/10 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <HardHat className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-amber-200">Gestionar / Editar Obras</span>
                      <span className="text-[10px] text-slate-400">Modificar parámetros y proyectos activos</span>
                    </div>
                  </button>
                )}

                {/* Opción 6: Salir / Cambiar Perfil */}
                {user && onSignOut && (
                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Cerrar Sesión / Salir</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

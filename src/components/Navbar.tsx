import React from 'react';
import type { UserProfile } from '../types/auth';
import { Building2, Sparkles, RefreshCw, Printer, Database, User, Shield, HardHat, ScrollText, MessageSquare, LogIn, LogOut } from 'lucide-react';
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
  onSignOut
}) => {
  const isCloud = isSupabaseConfigured();

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 py-4 px-4 sm:px-6 rounded-2xl mb-6 shadow-sm no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                FONDO INMOBIL
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Ahorro Previo Mutuo
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Simulador financiero integral, Cuenta Corriente individual, licitaciones y cesión CCCN
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
          {/* Badge y botón de perfil de usuario o botón de login si no está autenticado */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenLogin}
                title="Cambiar perfil / rol de usuario"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm ${
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
                    <span>Admin Fiduciario</span>
                  </>
                ) : user.role === 'tecnico' ? (
                  <>
                    <HardHat className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equipo Técnico & Obra</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Socio D{user.socioId || 1}</span>
                  </>
                )}
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  title="Cerrar sesión"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-lg transition-colors text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acceder al Sistema</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={onOpenPersistencia}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isCloud
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isCloud ? 'Supabase Nube' : 'Guardar / Proyectos'}</span>
            </button>
          )}

          {user && user.role === 'admin' && (
            <button
              onClick={onReset}
              title="Restablecer valores originales"
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          )}

          {user && (
            <button
              onClick={onOpenMensajes}
              title="Centro de Comunicaciones Fiduciarias"
              className="relative bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Mensajes</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenContrato}
            title="Ver y descargar Contrato Tripartito Oficial"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <ScrollText className="w-4 h-4 text-amber-400" />
            <span>Contrato Tripartito</span>
          </button>

          <button
            onClick={onPrint}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ficha</span>
          </button>
        </div>
      </div>
    </header>
  );
};

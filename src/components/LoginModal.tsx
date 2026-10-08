import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { ADMIN_USER, TECNICO_USER } from '../types/auth';
import { Shield, User, X, Building, ArrowRight, HardHat, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantidadSocios: number;
  currentFondoNombre: string;
  onLogin: (user: UserProfile) => void;
  onSupabaseSignIn?: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onSupabaseSignUp?: (email: string, pass: string, name?: string, role?: UserRole, especialidad?: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  cantidadSocios,
  currentFondoNombre,
  onLogin,
  onSupabaseSignIn,
  onSupabaseSignUp
}) => {
  const [authMode, setAuthMode] = useState<'demo' | 'supabase'>('supabase');
  const [supabaseAction, setSupabaseAction] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedSocioId, setSelectedSocioId] = useState<number>(1);
  
  // Estados para formulario Supabase Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('Dirección de Obra y Planos');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setLoadingAuth(true);

    try {
      if (supabaseAction === 'signin') {
        if (!onSupabaseSignIn) throw new Error('Servicio de inicio de sesión no disponible');
        const res = await onSupabaseSignIn(email, password);
        if (res.success) {
          onClose();
        } else {
          setAuthError(res.error || 'Error al iniciar sesión en Supabase');
        }
      } else {
        if (!onSupabaseSignUp) throw new Error('Servicio de registro no disponible');
        const res = await onSupabaseSignUp(
          email,
          password,
          nombre,
          selectedRole,
          selectedRole === 'tecnico' ? especialidad : undefined
        );
        if (res.success) {
          setAuthSuccessMsg('¡Usuario registrado con éxito! Verifica tu email si está habilitada la confirmación.');
          setTimeout(() => onClose(), 1500);
        } else {
          setAuthError(res.error || 'Error al registrar usuario en Supabase');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Error inesperado durante la autenticación');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleDemoAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(ADMIN_USER);
    onClose();
  };

  const handleDemoTecnicoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(TECNICO_USER);
    onClose();
  };

  const handleDemoSocioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socioUser: UserProfile = {
      id: `socio-${selectedSocioId}`,
      role: 'socio',
      socioId: selectedSocioId,
      nombre: `Socio D${selectedSocioId}`,
      email: `socio${selectedSocioId}@fondoinmobil.com`
    };
    onLogin(socioUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Acceso al Sistema Fiduciario</h3>
              <p className="text-xs text-slate-400">Proyecto activo: <strong className="text-indigo-300">{currentFondoNombre}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Modo: Supabase Auth vs Demo */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800/80 bg-slate-950/40">
          <button
            onClick={() => setAuthMode('supabase')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              authMode === 'supabase'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Supabase Auth (Cloud)</span>
          </button>
          <button
            onClick={() => setAuthMode('demo')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              authMode === 'demo'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Acceso Demo / Simulador Rápido</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* MODO 1: SUPABASE AUTH */}
          {authMode === 'supabase' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setSupabaseAction('signin'); setAuthError(null); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    supabaseAction === 'signin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => { setSupabaseAction('signup'); setAuthError(null); }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    supabaseAction === 'signup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crear Cuenta (Sign Up)
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  {authSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
                {supabaseAction === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Lic. Marcelo Pérez"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@dominio.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                {supabaseAction === 'signup' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Rol Inicial Deseado</label>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="socio">Socio Aportante (Inversor)</option>
                        <option value="admin">Administrador Fiduciario</option>
                        <option value="tecnico">Equipo Técnico y Obra</option>
                      </select>
                    </div>

                    {selectedRole === 'tecnico' && (
                      <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-1.5 animate-in fade-in">
                        <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          <HardHat className="w-3.5 h-3.5" />
                          <span>Especialidad Técnica / Función</span>
                        </label>
                        <select
                          value={especialidad}
                          onChange={(e) => setEspecialidad(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                        >
                          <option value="Dirección de Obra y Certificaciones">Dirección de Obra y Certificaciones</option>
                          <option value="Arquitectura y Proyecto Ejecutivo">Arquitectura y Proyecto Ejecutivo</option>
                          <option value="Cálculo Estructural H°A°">Cálculo Estructural H°A°</option>
                          <option value="Gestoría Municipal y Trámites">Gestoría Municipal y Trámites</option>
                          <option value="Empresa Constructora Principal">Empresa Constructora Principal</option>
                        </select>
                        <p className="text-[10px] text-slate-400">
                          Acceso a carga de planos, seguimiento de trámites municipales y memorias técnicas.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingAuth}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loadingAuth ? 'Procesando en Supabase...' : supabaseAction === 'signin' ? 'Ingresar con Supabase Auth' : 'Registrar en Supabase'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* MODO 2: DEMO RÁPIDO */}
          {authMode === 'demo' && (
            <div className="space-y-4">
              {/* Selector de perfiles demo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  onClick={() => setSelectedRole('admin')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                    selectedRole === 'admin'
                      ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-md shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedRole === 'admin' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs block text-white">Admin Fiduciario</strong>
                    <span className="text-[10px] text-slate-400">Control Total</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRole('tecnico')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                    selectedRole === 'tecnico'
                      ? 'border-amber-500 bg-amber-950/30 text-white shadow-md shadow-amber-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedRole === 'tecnico' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs block text-white">Equipo Técnico</strong>
                    <span className="text-[10px] text-slate-400">Obras y Planos</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedRole('socio')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                    selectedRole === 'socio'
                      ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedRole === 'socio' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs block text-white">Socio Aportante</strong>
                    <span className="text-[10px] text-slate-400">Portal Individual</span>
                  </div>
                </div>
              </div>

              {selectedRole === 'admin' && (
                <form onSubmit={handleDemoAdminSubmit} className="space-y-3">
                  <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 rounded-xl text-[11px] text-indigo-300">
                    👑 Acceso instantáneo con rol de Administrador Fiduciario para simulación y parametrización completa.
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Entrar como Administrador</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {selectedRole === 'tecnico' && (
                <form onSubmit={handleDemoTecnicoSubmit} className="space-y-3">
                  <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300">
                    🏗️ Acceso directo para equipo de arquitectura, trámites municipales y certificaciones de obra.
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Entrar como Equipo Técnico</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {selectedRole === 'socio' && (
                <form onSubmit={handleDemoSocioSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      Unidad / Departamento
                    </label>
                    <select
                      value={selectedSocioId}
                      onChange={(e) => setSelectedSocioId(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-white font-semibold outline-none"
                    >
                      {Array.from({ length: cantidadSocios }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Socio D{i + 1} • Unidad Funcional {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Ingresar como Socio D{selectedSocioId}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

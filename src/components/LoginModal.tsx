import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { ADMIN_USER, TECNICO_USER } from '../types/auth';
import {
  Shield,
  User,
  X,
  Building,
  ArrowRight,
  HardHat,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantidadSocios: number;
  currentFondoNombre: string;
  onLogin: (user: UserProfile) => void;
  onSupabaseSignIn?: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onSupabaseSignUp?: (
    email: string,
    pass: string,
    name?: string,
    role?: UserRole,
    especialidad?: string
  ) => Promise<{ success: boolean; error?: string }>;
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
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedSocioId, setSelectedSocioId] = useState<number>(1);
  const [especialidad, setEspecialidad] = useState('Dirección de Obra y Planos');

  // Supabase Auth Email/Password
  const [showCloudAuth, setShowCloudAuth] = useState(false);
  const [supabaseAction, setSupabaseAction] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Acceso Rápido Directo
  const handleDirectAccess = () => {
    if (selectedRole === 'admin') {
      onLogin(ADMIN_USER);
    } else if (selectedRole === 'tecnico') {
      onLogin({
        ...TECNICO_USER,
        especialidad
      });
    } else {
      const socioUser: UserProfile = {
        id: `socio-${selectedSocioId}`,
        role: 'socio',
        socioId: selectedSocioId,
        nombre: `Socio D${selectedSocioId}`,
        email: `socio${selectedSocioId}@fondoinmobil.com`
      };
      onLogin(socioUser);
    }
    onClose();
  };

  // Acceso Supabase Cloud
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
          setAuthError(res.error || 'Credenciales inválidas o correo no registrado.');
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
          setAuthSuccessMsg('¡Usuario registrado con éxito! Verifica tu email si la confirmación está activa.');
          setTimeout(() => onClose(), 1500);
        } else {
          setAuthError(res.error || 'Error al registrar usuario en Supabase.');
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Error inesperado durante la autenticación');
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Acceso al Sistema Fiduciario
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona cómo deseas ingresar a <strong className="text-indigo-300">{currentFondoNombre}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          
          {/* ================================================================= */}
          {/* PASO 1: SELECTOR VISUAL DE LOS 3 ROLES PRINCIPALES                */}
          {/* ================================================================= */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Selecciona tu Rol / Perfil de Acceso
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* ROL: ADMIN */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  selectedRole === 'admin'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedRole === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  {selectedRole === 'admin' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div>
                  <strong className="text-xs block text-white font-bold">Administrador</strong>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Fiduciario general, balances y cobranzas
                  </span>
                </div>
              </button>

              {/* ROL: TÉCNICO */}
              <button
                type="button"
                onClick={() => setSelectedRole('tecnico')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  selectedRole === 'tecnico'
                    ? 'border-amber-500 bg-amber-950/40 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedRole === 'tecnico' ? 'bg-amber-500 text-slate-950 font-bold shadow-md' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <HardHat className="w-4 h-4" />
                  </div>
                  {selectedRole === 'tecnico' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div>
                  <strong className="text-xs block text-white font-bold">Equipo Técnico</strong>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Arquitectura, obras y trámites municipales
                  </span>
                </div>
              </button>

              {/* ROL: SOCIO */}
              <button
                type="button"
                onClick={() => setSelectedRole('socio')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  selectedRole === 'socio'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedRole === 'socio' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  {selectedRole === 'socio' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div>
                  <strong className="text-xs block text-white font-bold">Socio Inversor</strong>
                  <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                    Unidad asignada, cuotas y adjudicación
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* ================================================================= */}
          {/* PASO 2: PARÁMETROS DEL ROL Y BOTÓN DE ENTRADA DIRECTA (1-CLIC)    */}
          {/* ================================================================= */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            
            {/* Opciones extras según el rol elegido */}
            {selectedRole === 'tecnico' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Especialidad / Función del Técnico:</span>
                </label>
                <select
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white font-medium outline-none"
                >
                  <option value="Dirección de Obra y Certificaciones">Dirección de Obra y Certificaciones</option>
                  <option value="Arquitectura y Proyecto Ejecutivo">Arquitectura y Proyecto Ejecutivo</option>
                  <option value="Cálculo Estructural H°A°">Cálculo Estructural H°A°</option>
                  <option value="Gestoría Municipal y Permisos">Gestoría Municipal y Permisos</option>
                  <option value="Empresa Constructora Principal">Empresa Constructora Principal</option>
                </select>
              </div>
            )}

            {selectedRole === 'socio' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>Selecciona tu Unidad Funcional / Departamento:</span>
                </label>
                <select
                  value={selectedSocioId}
                  onChange={(e) => setSelectedSocioId(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-white font-bold outline-none cursor-pointer"
                >
                  {Array.from({ length: cantidadSocios }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Socio D{i + 1} • Departamento / Unidad Funcional {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón Principal de Acceso Inmediato */}
            <button
              type="button"
              onClick={handleDirectAccess}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  : selectedRole === 'tecnico'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              <span>
                {selectedRole === 'admin'
                  ? '👑 Entrar como Administrador Fiduciario'
                  : selectedRole === 'tecnico'
                  ? `🏗️ Entrar como Equipo Técnico (${especialidad.split(' ')[0]})`
                  : `👤 Entrar como Socio Unidad #${selectedSocioId}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className="text-[11px] text-center text-slate-400">
              ⚡ Acceso directo instantáneo configurado con todos los permisos del rol.
            </p>
          </div>

          {/* ================================================================= */}
          {/* PASO 3: ACCESO OPCIONAL CON CUENTA EN SUPABASE CLOUD              */}
          {/* ================================================================= */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowCloudAuth(!showCloudAuth)}
              className="w-full p-3.5 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-between transition-colors cursor-pointer bg-slate-900/50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>¿Deseas ingresar o registrarte con correo en la Nube (Supabase)?</span>
              </div>
              {showCloudAuth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCloudAuth && (
              <div className="p-4 sm:p-5 border-t border-slate-800 space-y-4 animate-in fade-in">
                
                {/* Switch Login vs Registro */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setSupabaseAction('signin'); setAuthError(null); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      supabaseAction === 'signup'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Crear Cuenta con rol {selectedRole.toUpperCase()}
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
                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Correo Electrónico</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@dominio.com"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Contraseña</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loadingAuth}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {loadingAuth
                        ? 'Conectando con Supabase...'
                        : supabaseAction === 'signin'
                        ? 'Iniciar Sesión en la Nube'
                        : `Registrar Cuenta (${selectedRole.toUpperCase()})`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginModal;

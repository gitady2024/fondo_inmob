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
  AlertCircle,
  CheckCircle2,
  Zap,
  UserPlus,
  LogIn
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
  initialRole?: UserRole;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  cantidadSocios,
  currentFondoNombre,
  onLogin,
  onSupabaseSignIn,
  onSupabaseSignUp,
  initialRole = 'admin'
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  React.useEffect(() => {
    if (isOpen && initialRole) {
      setSelectedRole(initialRole);
    }
  }, [isOpen, initialRole]);
  const [selectedSocioId, setSelectedSocioId] = useState<number>(1);
  const [especialidad, setEspecialidad] = useState('Dirección de Obra y Certificaciones');

  // Modo de ingreso: Iniciar Sesión vs Crear Cuenta
  const [modoAcceso, setModoAcceso] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Ingreso Directo en Modo Rápido (1-Clic)
  const handleQuickAccess = () => {
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

  // 2. Ingreso Formal con Correo y Contraseña
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const normEmail = email.trim().toLowerCase();

    try {
      if (modoAcceso === 'signin') {
        if (!onSupabaseSignIn) throw new Error('Servicio de autenticación no disponible');
        const res = await onSupabaseSignIn(normEmail, password);
        if (res.success) {
          onLogin({
            id: `user-${Date.now()}`,
            role: selectedRole,
            nombre: nombre || normEmail.split('@')[0],
            email: normEmail,
            socioId: selectedRole === 'socio' ? selectedSocioId : undefined,
            especialidad: selectedRole === 'tecnico' ? especialidad : undefined
          });
          onClose();
        } else {
          const rawErr = res.error || '';
          if (rawErr.toLowerCase().includes('invalid login credentials')) {
            setErrorMsg('Correo o contraseña incorrectos. Si acabás de registrarte o aún no creaste la cuenta, podés crearla en la pestaña "Crear Cuenta" o usar el botón de Acceso Rápido.');
          } else {
            setErrorMsg(rawErr || 'Correo o contraseña incorrectos. Verifica tus datos.');
          }
        }
      } else {
        if (!onSupabaseSignUp) throw new Error('Servicio de registro no disponible');
        const res = await onSupabaseSignUp(
          normEmail,
          password,
          nombre,
          selectedRole,
          selectedRole === 'tecnico' ? especialidad : undefined
        );
        if (res.success) {
          onLogin({
            id: `user-${Date.now()}`,
            role: selectedRole,
            nombre: nombre || normEmail.split('@')[0],
            email: normEmail,
            socioId: selectedRole === 'socio' ? selectedSocioId : undefined,
            especialidad: selectedRole === 'tecnico' ? especialidad : undefined
          });
          const roleLabel = selectedRole === 'tecnico' ? 'Equipo Técnico' : selectedRole === 'admin' ? 'Administrador' : 'Socio Inversor';
          setSuccessMsg(`¡Cuenta de ${roleLabel} creada y activada con éxito! Ingresando al sistema...`);
          setTimeout(() => onClose(), 800);
        } else {
          setErrorMsg(res.error || 'No se pudo completar el registro. Intenta nuevamente.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col">
        
        {/* Cabecera Institucional */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Acceso al Sistema Fiduciario
              </h3>
              <p className="text-xs text-slate-400">
                Fondo activo: <strong className="text-indigo-300">{currentFondoNombre}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-login-modal"
            onClick={onClose}
            aria-label="Cerrar ventana de inicio de sesión"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          
          {/* ================================================================= */}
          {/* PASO 1: SELECCIÓN DEL ROL / PERFIL DE USUARIO                     */}
          {/* ================================================================= */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Selecciona tu Perfil de Usuario
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* ROL: ADMINISTRADOR */}
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  selectedRole === 'admin'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Fiduciario general, balances y cobranzas
                  </span>
                </div>
              </button>

              {/* ROL: EQUIPO TÉCNICO */}
              <button
                type="button"
                onClick={() => setSelectedRole('tecnico')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  selectedRole === 'tecnico'
                    ? 'border-amber-500 bg-amber-950/40 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Arquitectura, obras y expedientes
                  </span>
                </div>
              </button>

              {/* ROL: SOCIO INVERSOR */}
              <button
                type="button"
                onClick={() => setSelectedRole('socio')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  selectedRole === 'socio'
                    ? 'border-emerald-500 bg-emerald-950/40 text-white shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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
                  <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                    Unidad asignada, cuotas y adjudicación
                  </span>
                </div>
              </button>

            </div>
          </div>

          {/* Opciones contextuales según el rol */}
          {selectedRole === 'tecnico' && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl space-y-1 animate-in fade-in">
              <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                <span>Especialidad / Función en Obra:</span>
              </label>
              <select
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-white font-medium outline-none"
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
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl space-y-1 animate-in fade-in">
              <label className="block text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>Unidad Funcional / Departamento:</span>
              </label>
              <select
                value={selectedSocioId}
                onChange={(e) => setSelectedSocioId(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none cursor-pointer"
              >
                {Array.from({ length: cantidadSocios }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Socio D{i + 1} • Departamento / Unidad Funcional {i + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASO 2: FORMULARIO PERMANENTE DE ACCESO CON EMAIL Y CONTRASEÑA    */}
          {/* ================================================================= */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            
            {/* Toggle: Iniciar Sesión vs Crear Cuenta */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Ingreso con Email
                </span>
              </div>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setModoAcceso('signin'); setErrorMsg(null); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    modoAcceso === 'signin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3 h-3" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setModoAcceso('signup'); setErrorMsg(null); }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    modoAcceso === 'signup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Crear Cuenta</span>
                </button>
              </div>
            </div>

            {/* Mensajes de Alerta y Éxito */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
              
              {modoAcceso === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Marcelo Pérez"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
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
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium"
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
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-medium"
                />
              </div>

              {/* Botón Principal de Ingreso */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>
                  {loading
                    ? 'Verificando credenciales...'
                    : modoAcceso === 'signin'
                    ? 'Ingresar al Sistema'
                    : `Registrar Cuenta (${selectedRole.toUpperCase()})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          </div>

          {/* ================================================================= */}
          {/* PASO 3: BOTÓN DE ACCESO DIRECTO RÁPIDO (MODO DEMO)                */}
          {/* ================================================================= */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>O ingresa en 1-clic con acceso rápido:</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickAccess}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border active:scale-95 ${
                selectedRole === 'admin'
                  ? 'bg-slate-800 hover:bg-indigo-950/60 text-indigo-300 border-indigo-500/40 hover:border-indigo-500'
                  : selectedRole === 'tecnico'
                  ? 'bg-slate-800 hover:bg-amber-950/60 text-amber-300 border-amber-500/40 hover:border-amber-500'
                  : 'bg-slate-800 hover:bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-500'
              }`}
            >
              <span>
                {selectedRole === 'admin'
                  ? '👑 Acceso Rápido: Administrador Fiduciario'
                  : selectedRole === 'tecnico'
                  ? `🏗️ Acceso Rápido: Equipo Técnico (${especialidad.split(' ')[0]})`
                  : `👤 Acceso Rápido: Socio Unidad #${selectedSocioId}`}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginModal;

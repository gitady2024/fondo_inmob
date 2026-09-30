import React, { useState } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { ADMIN_USER, TECNICO_USER } from '../types/auth';
import { Shield, User, Key, X, Building, ArrowRight, HardHat } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  cantidadSocios: number;
  currentFondoNombre: string;
  onLogin: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  cantidadSocios,
  currentFondoNombre,
  onLogin
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [selectedSocioId, setSelectedSocioId] = useState<number>(1);
  const [password, setPassword] = useState('');
  const [socioDni, setSocioDni] = useState('');

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(ADMIN_USER);
    onClose();
  };

  const handleTecnicoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(TECNICO_USER);
    onClose();
  };

  const handleSocioSubmit = (e: React.FormEvent) => {
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

        <div className="p-6 space-y-5">
          {/* Selector de tipo de perfil: 3 Perfiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* 1. Administrador */}
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
                <strong className="text-xs block text-white">Administrador</strong>
                <span className="text-[10px] text-slate-400">Control Total</span>
              </div>
            </div>

            {/* 2. Equipo Técnico */}
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
                <span className="text-[10px] text-slate-400">Obras y Permisos</span>
              </div>
            </div>

            {/* 3. Socio */}
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
                <strong className="text-xs block text-white">Socio / Inversor</strong>
                <span className="text-[10px] text-slate-400">Portal Individual</span>
              </div>
            </div>
          </div>

          {/* Formulario según rol */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Usuario Administrador
                </label>
                <input
                  type="text"
                  disabled
                  value="admin@fondoinmobil.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Contraseña (Opcional en demo)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none font-mono"
                />
              </div>

              <div className="bg-indigo-950/20 border border-indigo-500/30 p-3 rounded-xl text-[11px] text-indigo-300">
                👑 Perfil Administrador: Control integral del fideicomiso, configuración de cuotas, gastos fiduciarios, balance consolidado y base de datos.
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Acceder como Administrador Fiduciario</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {selectedRole === 'tecnico' && (
            <form onSubmit={handleTecnicoSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-amber-400" />
                  Usuario del Equipo Técnico
                </label>
                <input
                  type="text"
                  disabled
                  value="tecnico@fondoinmobil.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Clave Técnica de Acceso
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none font-mono"
                />
              </div>

              <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300">
                🏗️ Perfil Equipo Técnico: Carga y seguimiento de trámites municipales, factibilidades de servicios públicos, planos de arquitectura/estructura y certificación de avance físico de obra.
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Acceder al Panel del Equipo Técnico</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {selectedRole === 'socio' && (
            <form onSubmit={handleSocioSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-400" />
                  Selecciona tu Departamento / Unidad
                </label>
                <select
                  value={selectedSocioId}
                  onChange={(e) => setSelectedSocioId(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white font-semibold outline-none"
                >
                  {Array.from({ length: cantidadSocios }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Socio D{i + 1} • Departamento / Unidad {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  DNI / Clave de Acceso
                </label>
                <input
                  type="password"
                  value={socioDni}
                  onChange={(e) => setSocioDni(e.target.value)}
                  placeholder="Ingresa tu DNI o PIN..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none font-mono"
                />
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl text-[11px] text-emerald-300">
                👤 Portal del Suscriptor: Vista restringida exclusivamente a tu ficha individual, cuotas y solicitud de gestiones.
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
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Shield,
  User,
  HardHat,
  Lock,
  ArrowRight,
  Building2,
  FileText,
  KeyRound,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

interface PortalAccesoPerfilesProps {
  currentFondoNombre: string;
  cantidadSocios: number;
  onSelectSocio: (socioId: number) => void;
  onSelectTecnico: () => void;
  onSelectAdmin: () => void;
  onOpenLoginModal: (preferredRole?: 'admin' | 'socio' | 'tecnico') => void;
  onOpenContrato?: () => void;
}

export const PortalAccesoPerfiles: React.FC<PortalAccesoPerfilesProps> = ({
  currentFondoNombre,
  cantidadSocios,
  onSelectSocio,
  onSelectTecnico,
  onSelectAdmin,
  onOpenLoginModal,
  onOpenContrato
}) => {
  const [socioUnit, setSocioUnit] = useState<number>(1);

  return (
    <div className="space-y-10 animate-fade-in py-4 max-w-6xl mx-auto">
      
      {/* ==================================================================== */}
      {/* 1. CABECERA PRINCIPAL: IDENTIDAD Y PREGUNTA DE INGRESO               */}
      {/* ==================================================================== */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm shadow-inner">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fondo: {currentFondoNombre}</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Aislamiento Seguro por Perfil
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          ¿En qué perfil deseas <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">ingresar</span>?
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Para garantizar la confidencialidad de los datos contables y el aislamiento fiduciario, selecciona tu rol para acceder a las herramientas correspondientes.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 2. LAS 3 TARJETAS PRINCIPALES DE SELECCIÓN DE PERFIL                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ------------------------------------------------------------------ */}
        {/* TARJETA 1: SOCIO APORTANTE / INVERSOR                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative group bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Inversor / Suscriptor
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Socio Aportante
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Portal exclusivo del inversor para consultar tu departamento, cronograma de cuotas y proyecciones.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Estado de cuenta de tu unidad</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Simulador interactivo de inversión</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Proyección de adelantos y cuotas</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            {/* Selector de departamento en modo demostración/consulta */}
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400 font-medium">Unidad asignada:</span>
              <select
                value={socioUnit}
                onChange={(e) => setSocioUnit(Number(e.target.value))}
                className="bg-transparent font-bold text-emerald-400 outline-none cursor-pointer"
              >
                {Array.from({ length: cantidadSocios }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num} className="bg-slate-900 text-white">
                    Depto {num} (Socio D{num})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onSelectSocio(socioUnit)}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-emerald-600/30"
            >
              <span>Ingresar como Socio D{socioUnit}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onOpenLoginModal('socio')}
              className="w-full text-center text-[11px] text-slate-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              Iniciar sesión con correo de socio →
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TARJETA 2: EQUIPO TÉCNICO & OBRAS                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative group bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <HardHat className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Obras & Gestoría
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                Equipo Técnico
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Gestión técnica y de obras. Aislado de información financiera y balances contables del fideicomiso.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Certificación de avance físico de obra</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Carga de planos y resoluciones técnicas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Seguimiento de trámites municipales</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onSelectTecnico}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-amber-500/30"
            >
              <HardHat className="w-4 h-4" />
              <span>Ingresar como Equipo Técnico</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onOpenLoginModal('tecnico')}
              className="w-full text-center text-[11px] text-slate-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer"
            >
              Iniciar sesión con cuenta técnica →
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TARJETA 3: ADMINISTRADOR FIDUCIARIO (PROTEGIDO)                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="relative group bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-400" />
                <span>Acceso Restringido</span>
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                Administrador Fiduciario
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Control contable, cobranzas, morosidad, emisión de contratos y administración general del fideicomiso.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-300 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Panel de cobranzas y morosidad en 1-clic</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Generador de contratos y balances</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Gestión de fondos y parámetros fiduciarios</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onSelectAdmin}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-indigo-600/30"
            >
              <KeyRound className="w-4 h-4 text-indigo-200" />
              <span>Ingresar como Administrador</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onOpenLoginModal('admin')}
              className="w-full text-center text-[11px] text-slate-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              Iniciar sesión formal con contraseña →
            </button>
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. FOOTER INFORMATIVO Y MARCO LEGAL                                  */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Fideicomiso al Costo • Arts. 1666-1707 Código Civil y Comercial de la Nación (CCCN)</span>
        </div>

        {onOpenContrato && (
          <button
            type="button"
            onClick={onOpenContrato}
            className="text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Consultar Modelo de Contrato Marco</span>
          </button>
        )}
      </div>

    </div>
  );
};

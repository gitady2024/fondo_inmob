import React, { useState } from 'react';
import type { UserProfile } from '../types/auth';
import type {
  FlujoSocioCalculado,
  ParametrosFondoState,
  GastosConfigState
} from '../types/fondo';
import type { FondoGuardado } from '../services/fondoService';
import { fmtMoneda, formatFecha } from '../utils/calculations';
import { CuentaIndividual } from './CuentaIndividual';
import { ModuloTecnico } from './ModuloTecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import { Building2, Zap, ScrollText, HardHat } from 'lucide-react';

interface PortalSocioProps {
  user: UserProfile;
  currentFondo: FondoGuardado;
  flujoSocio: FlujoSocioCalculado;
  fechaInicio: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  onOpenContrato?: () => void;
}

export const PortalSocio: React.FC<PortalSocioProps> = ({
  user,
  currentFondo,
  flujoSocio,
  fechaInicio,
  params,
  gastos,
  onOpenContrato
}) => {
  const socioId = user.socioId || 1;
  const [activeTab, setActiveTab] = useState<'cartola' | 'adelanto' | 'cesion' | 'obra'>('cartola');
  
  // Estados para simulación propia del socio
  const [simMontoAdelanto, setSimMontoAdelanto] = useState<number>(5000);
  const [simCuotaAdelanto, setSimCuotaAdelanto] = useState<number>(10);
  const [simPrimaCesion, setSimPrimaCesion] = useState<number>(10);

  const mPos = flujoSocio.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
  const fechaFin = formatFecha(fechaInicio, flujoSocio.mesesTotales);


  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida del Socio */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
              D{socioId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Hola, {user.nombre}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Suscriptor Activo
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                Proyecto: <strong className="text-indigo-300">{currentFondo.nombre}</strong> • Unidad: <strong className="text-white">Departamento {socioId}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenContrato && (
              <button
                onClick={onOpenContrato}
                className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ScrollText className="w-4 h-4 text-amber-400" />
                <span>Ver y Descargar mi Contrato</span>
              </button>
            )}
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">Posesión Programada:</span>
              <strong className="text-amber-300">Cuota {mPos} ({fechaPos.fechaCorta})</strong>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">Cancelación Total:</span>
              <strong className="text-emerald-400">Cuota {flujoSocio.mesesTotales} ({fechaFin.fechaCorta})</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Socio */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-2xl p-1 gap-1 max-w-xl no-print">
        <button
          onClick={() => setActiveTab('cartola')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cartola'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Mi Estado de Cuenta</span>
        </button>

        <button
          onClick={() => setActiveTab('adelanto')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'adelanto'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Simular Adelanto</span>
        </button>

        <button
          onClick={() => setActiveTab('cesion')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cesion'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Simular Cesión</span>
        </button>

        <button
          onClick={() => setActiveTab('obra')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'obra'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Avance y Permisos</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {activeTab === 'obra' && (
        <ModuloTecnico
          datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
          fondoNombre={currentFondo.nombre}
          isReadOnly={true}
          onUpdateDatosTecnicos={() => {}}
        />
      )}
      {activeTab === 'cartola' && (
        <CuentaIndividual
          cantidadSocios={params.cantidadDeptos}
          socioSeleccionado={socioId}
          flujoSocio={flujoSocio}
          fechaInicio={fechaInicio}
          costoDepto={params.costoDepto}
          formaPagoGastos={gastos.formaPagoGastos}
          params={params}
          gastos={gastos}
          onSelectSocio={() => {}} // Bloqueado para el socio
          onAdjudicacionChange={() => {}} // Bloqueado para el socio
        />
      )}

      {activeTab === 'adelanto' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulador de Adelanto Voluntario de Capital</h3>
              <p className="text-xs text-slate-400">Prueba cómo una inyección anticipada reduce el valor de tus cuotas restantes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Monto que deseas adelantar ($)</label>
              <input
                type="number"
                step="500"
                value={simMontoAdelanto}
                onChange={(e) => setSimMontoAdelanto(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">¿En qué cuota ingresarías el aporte?</label>
              <input
                type="number"
                min="1"
                max={flujoSocio.mesesTotales}
                value={simCuotaAdelanto}
                onChange={(e) => setSimCuotaAdelanto(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl space-y-2 text-xs">
            <strong className="text-indigo-300 block text-xs">Resultado Estimado del Adelanto:</strong>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Al aportar <strong className="text-emerald-400 font-mono">{fmtMoneda(simMontoAdelanto)}</strong> en la cuota {simCuotaAdelanto}, tu saldo deudor restante se reduce inmediatamente, aliviando el monto de las cuotas futuras de manera proporcional hasta la finalización del plan.
            </p>
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <span className="text-[11px] text-amber-300 font-semibold">
                Para solicitar formalmente esta inyección, contacta a la administración fiduciaria.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cesion' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Simulador de Cesión Contractual (Arts. 1636-1640 CCCN)</h3>
              <p className="text-xs text-slate-400">Consulta tu valor neto de rescate o transferencia a un tercero adquirente</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Prima pactada sobre el capital integrado (%)</label>
            <input
              type="number"
              step="1"
              value={simPrimaCesion}
              onChange={(e) => setSimPrimaCesion(parseFloat(e.target.value) || 0)}
              className="w-full max-w-xs bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
            <strong className="text-amber-300 block text-xs">Marco Legal de Transferencia:</strong>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Tienes derecho a transferir tu posición fiduciaria a un tercero entrante o solicitar rescate interno según el Código Civil y Comercial. El nuevo adquirente toma a su cargo el saldo deudor remanente y los gastos de adjudicación pendientes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

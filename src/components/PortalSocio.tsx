import React, { useState, useMemo } from 'react';
import type { UserProfile } from '../types/auth';
import type {
  FlujoSocioCalculado,
  ParametrosFondoState,
  GastosConfigState,
  EstrategiaImpactoAdelanto,
  MecanismoSalida
} from '../types/fondo';
import type { FondoGuardado } from '../services/fondoService';
import {
  fmtMoneda,
  formatFecha,
  calcularFlujoIndividual,
  calcularLiquidacionCesion
} from '../utils/calculations';
import { CuentaIndividual } from './CuentaIndividual';
import { ModuloTecnico } from './ModuloTecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import {
  Building2,
  Zap,
  ScrollText,
  HardHat,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Home,
  DollarSign,
  ChevronRight
} from 'lucide-react';

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

  // ==========================================
  // ESTADOS PARA SIMULACIÓN DE ADELANTO
  // ==========================================
  const [simMontoAdelanto, setSimMontoAdelanto] = useState<number>(5000);
  const [simCuotaAdelanto, setSimCuotaAdelanto] = useState<number>(Math.min(10, flujoSocio.mesesTotales));
  const [simEstrategiaAdelanto, setSimEstrategiaAdelanto] = useState<EstrategiaImpactoAdelanto>('reducir_cuota');
  const [adelantoSolicitado, setAdelantoSolicitado] = useState<boolean>(false);

  // ==========================================
  // ESTADOS PARA SIMULACIÓN DE CESIÓN
  // ==========================================
  const [simCuotaSalida, setSimCuotaSalida] = useState<number>(
    Math.min(12, Math.max(1, Math.round(flujoSocio.mesesTotales / 2)))
  );
  const [simPrimaCesion, setSimPrimaCesion] = useState<number>(10);
  const [simMecanismoCesion, setSimMecanismoCesion] = useState<MecanismoSalida>('tercero');

  // Datos base del socio
  const mPos = flujoSocio.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
  const fechaFin = formatFecha(fechaInicio, flujoSocio.mesesTotales);
  const dt = currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT;

  // ==========================================
  // CÁLCULO EN VIVO: SIMULACIÓN DE ADELANTO
  // ==========================================
  const flujoSimuladoAdelanto = useMemo(() => {
    return calcularFlujoIndividual(
      socioId,
      params.costoDepto,
      flujoSocio.anticipoMes0,
      params.cantidadCuotas,
      params.modalidadAnticipo,
      flujoSocio.recargoGastosPorCuota,
      {
        activo: simMontoAdelanto > 0,
        mes: simCuotaAdelanto,
        monto: simMontoAdelanto,
        estrategia: simEstrategiaAdelanto
      },
      flujoSocio.cuotaPosesion,
      flujoSocio.pagoFinalGastos
    );
  }, [
    socioId,
    params.costoDepto,
    params.cantidadCuotas,
    params.modalidadAnticipo,
    flujoSocio.anticipoMes0,
    flujoSocio.recargoGastosPorCuota,
    flujoSocio.cuotaPosesion,
    flujoSocio.pagoFinalGastos,
    simMontoAdelanto,
    simCuotaAdelanto,
    simEstrategiaAdelanto
  ]);

  // Cuotas mensuales comparativas post-adelanto
  const cuotaHabitualMesAdelanto = flujoSocio.flujo[simCuotaAdelanto - 1]?.capital || flujoSocio.cuotaInmInicial;
  const cuotaNuevaMesAdelanto =
    flujoSimuladoAdelanto.flujo[simCuotaAdelanto]?.capital ||
    flujoSimuladoAdelanto.flujo[simCuotaAdelanto - 1]?.capital ||
    0;
  const alivioMensualCapital = Math.max(0, cuotaHabitualMesAdelanto - cuotaNuevaMesAdelanto);
  const mesesAhorrados = Math.max(0, flujoSocio.mesesTotales - flujoSimuladoAdelanto.mesesTotales);

  // ==========================================
  // CÁLCULO EN VIVO: SIMULACIÓN DE CESIÓN
  // ==========================================
  const liquidacionCesion = useMemo(() => {
    return calcularLiquidacionCesion(
      flujoSocio,
      simCuotaSalida,
      simPrimaCesion,
      flujoSocio.pagoFinalGastos
    );
  }, [flujoSocio, simCuotaSalida, simPrimaCesion]);

  const fechaCesion = formatFecha(fechaInicio, simCuotaSalida);

  // ==========================================
  // DATOS PARTICULARES DE LA UNIDAD DEL SOCIO
  // ==========================================
  const totalUnidades = params.cantidadDeptos || 10;
  const pisosTotales = dt.cantidadPisos || 5;
  const pisoAsignado = ((socioId - 1) % pisosTotales) + 1;
  const letraUnidad = String.fromCharCode(65 + ((socioId - 1) % Math.max(1, Math.ceil(totalUnidades / pisosTotales))));
  const supCubiertaUnidad = Math.round((dt.superficieCubiertaM2 || 1100) / totalUnidades);
  const supSemicubiertaUnidad = Math.round((dt.superficieSemicubiertaM2 || 150) / totalUnidades);
  const supTotalUnidad = supCubiertaUnidad + supSemicubiertaUnidad;
  const esTresAmbientes = socioId % 2 === 0;

  // Porcentaje de avance físico general de la obra
  const avanceObraGlobal = useMemo(() => {
    if (!dt.etapas || dt.etapas.length === 0) return 30;
    const totalPonderado = dt.etapas.reduce(
      (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
      0
    );
    return Math.round(totalPonderado);
  }, [dt.etapas]);

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
                Proyecto: <strong className="text-indigo-300">{currentFondo.nombre}</strong> • Unidad:{' '}
                <strong className="text-white">Departamento {socioId}</strong> (Piso {pisoAsignado} "{letraUnidad}")
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
              <strong className="text-amber-300">
                Cuota {mPos} ({fechaPos.fechaCorta})
              </strong>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono">
              <span className="text-slate-400 block text-[10px]">Cancelación Total:</span>
              <strong className="text-emerald-400">
                Cuota {flujoSocio.mesesTotales} ({fechaFin.fechaCorta})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Socio */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-2xl p-1 gap-1 max-w-2xl no-print">
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

      {/* ============================================================== */}
      {/* PESTAÑA 1: MI ESTADO DE CUENTA (CARTOLA)                       */}
      {/* ============================================================== */}
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

      {/* ============================================================== */}
      {/* PESTAÑA 2: SIMULADOR DE ADELANTO DE CAPITAL                     */}
      {/* ============================================================== */}
      {activeTab === 'adelanto' && (
        <div className="space-y-6">
          {/* Tarjeta de Configuración de la Simulación */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulador de Adelanto Voluntario de Capital</h3>
                  <p className="text-xs text-slate-400">
                    Proyecta cómo una inyección anticipada reduce el valor de tus cuotas o acorta los meses para cancelar tu unidad
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium px-3 py-1 rounded-lg">
                Unidad D{socioId} • Depto {socioId}
              </span>
            </div>

            {/* Inputs de Configuración */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monto que deseas inyectar ($)
                </label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={simMontoAdelanto}
                  onChange={(e) => setSimMontoAdelanto(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    ¿En qué cuota ingresarías el aporte?
                  </label>
                  <span className="text-xs text-indigo-400 font-mono font-bold">
                    {formatFecha(fechaInicio, simCuotaAdelanto).fechaCorta}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={flujoSocio.mesesTotales}
                  value={simCuotaAdelanto}
                  onChange={(e) =>
                    setSimCuotaAdelanto(
                      Math.max(1, Math.min(flujoSocio.mesesTotales, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estrategia de Impacto Financiero
                </label>
                <select
                  value={simEstrategiaAdelanto}
                  onChange={(e) => setSimEstrategiaAdelanto(e.target.value as EstrategiaImpactoAdelanto)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium"
                >
                  <option value="reducir_cuota">Aliviar Cuota (Menor pago mensual, mismo plazo)</option>
                  <option value="acelerar">Acelerar Cancelación (Misma cuota, finaliza antes)</option>
                </select>
              </div>
            </div>

            {/* SITUACIÓN ANTE EL FONDO: TARJETAS MÉTRICAS DE IMPACTO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 pt-2">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Aporte Extraordinario
                </span>
                <div className="text-lg font-black text-indigo-300 font-mono mt-1">
                  {fmtMoneda(simMontoAdelanto)}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  En Cuota {simCuotaAdelanto} ({formatFecha(fechaInicio, simCuotaAdelanto).fechaCorta})
                </span>
              </div>

              {simEstrategiaAdelanto === 'reducir_cuota' ? (
                <>
                  <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4">
                    <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">
                      Alivio de Cuota Futura
                    </span>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                      -{fmtMoneda(alivioMensualCapital)}/mes
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Ahorro directo en cada cuota restante
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Nueva Cuota de Capital
                    </span>
                    <div className="text-lg font-black text-white font-mono mt-1">
                      {fmtMoneda(cuotaNuevaMesAdelanto)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Antes abonabas: {fmtMoneda(cuotaHabitualMesAdelanto)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4">
                    <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">
                      Cancelación Anticipada
                    </span>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                      {mesesAhorrados} meses antes
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Finaliza en cuota {flujoSimuladoAdelanto.mesesTotales} de {flujoSocio.mesesTotales}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                      Nueva Fecha Finalización
                    </span>
                    <div className="text-lg font-black text-white font-mono mt-1">
                      {formatFecha(fechaInicio, flujoSimuladoAdelanto.mesesTotales).fechaCorta}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Anticipo del calendario financiero
                    </span>
                  </div>
                </>
              )}

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Situación Deuda Restante
                </span>
                <div className="text-lg font-black text-indigo-400 font-mono mt-1">
                  Amortizado
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Inyección 100% computable a tu unidad
                </span>
              </div>
            </div>

            {/* Aviso y Acción de Solicitud */}
            <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validación Fiduciaria Automática de Simulación</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Esta simulación no altera tu plan real hasta que transfieras los fondos a la cuenta recaudadora fiduciaria y la administración emita el recibo oficial.
                </p>
              </div>
              <button
                onClick={() => setAdelantoSolicitado(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Solicitar Aplicación Formal</span>
              </button>
            </div>

            {adelantoSolicitado && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-3.5 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
                <span>
                  ✓ Solicitud registrada preliminarmente para la Cuota {simCuotaAdelanto} por {fmtMoneda(simMontoAdelanto)}. La Administración Fiduciaria te contactará con los datos de cuenta y comprobante de imputación.
                </span>
                <button
                  onClick={() => setAdelantoSolicitado(false)}
                  className="text-slate-400 hover:text-white font-bold px-2 py-0.5 text-xs"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>

          {/* TABLA DE PAGOS RESTANTES Y CRONOGRAMA PROYECTADO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Proyección de Pagos Restantes con el Adelanto
                </h4>
                <p className="text-xs text-slate-400">
                  Detalle cuota a cuota a partir de la inyección en Cuota {simCuotaAdelanto}
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Cuotas del Plan: <strong className="text-white">{flujoSimuladoAdelanto.mesesTotales}</strong>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/90 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Cuota</th>
                    <th className="py-2.5 px-3">Período</th>
                    <th className="py-2.5 px-3 text-right">Cuota Habitual Base</th>
                    <th className="py-2.5 px-3 text-right text-indigo-300">Capital Proyectado</th>
                    <th className="py-2.5 px-3 text-right text-amber-300">Adelanto Extra</th>
                    <th className="py-2.5 px-3 text-right text-slate-300">Gastos / Adm.</th>
                    <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Total a Pagar</th>
                    <th className="py-2.5 px-3 text-right text-slate-400">Saldo Remanente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {flujoSimuladoAdelanto.flujo
                    .filter((m) => m.mes >= simCuotaAdelanto)
                    .map((m) => {
                      const cuotaOriginal = flujoSocio.flujo[m.mes - 1];
                      const esMesAdelanto = m.mes === simCuotaAdelanto;
                      const fFecha = formatFecha(fechaInicio, m.mes);

                      return (
                        <tr
                          key={m.mes}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            esMesAdelanto ? 'bg-indigo-950/40 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-white font-bold">
                            #{m.mes} {esMesAdelanto && <span className="text-[10px] text-amber-400 ml-1">★ Inyección</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{fFecha.fechaCorta}</td>
                          <td className="py-2.5 px-3 text-right text-slate-500 line-through">
                            {cuotaOriginal ? fmtMoneda(cuotaOriginal.capital) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-indigo-300 font-bold">
                            {fmtMoneda(m.capital)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-300">
                            {m.adelanto > 0 ? `+${fmtMoneda(m.adelanto)}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {fmtMoneda(m.gastos)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                            {fmtMoneda(m.abonadoMes)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-300">
                            {fmtMoneda(m.saldoRemanente)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 3: SIMULADOR DE CESIÓN CONTRACTUAL (ARTS 1636-1640)    */}
      {/* ============================================================== */}
      {activeTab === 'cesion' && (
        <div className="space-y-6">
          {/* Tarjeta de Parámetros de Cesión */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulador de Cesión de Posición Contractual</h3>
                  <p className="text-xs text-slate-400">
                    Regulación legal según Arts. 1614 y 1636 a 1640 del Código Civil y Comercial de la Nación
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium px-3 py-1 rounded-lg">
                Socio D{socioId} • Depto {socioId}
              </span>
            </div>

            {/* Parámetros de Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    ¿En qué cuota programarías la cesión?
                  </label>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {fechaCesion.fechaCorta}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={flujoSocio.mesesTotales}
                  value={simCuotaSalida}
                  onChange={(e) =>
                    setSimCuotaSalida(
                      Math.max(1, Math.min(flujoSocio.mesesTotales, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Prima pactada sobre capital integrado (%)
                  </label>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    +{fmtMoneda(liquidacionCesion.montoPrima)}
                  </span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={simPrimaCesion}
                  onChange={(e) => setSimPrimaCesion(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mecanismo de Salida Previsto
                </label>
                <select
                  value={simMecanismoCesion}
                  onChange={(e) => setSimMecanismoCesion(e.target.value as MecanismoSalida)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none font-medium"
                >
                  <option value="tercero">Opción A: Cesión a Tercero Adquirente (Art. 1636 CCCN)</option>
                  <option value="preferencia">Opción B: Rescate Interno / Preferencia de Socios (Art. 1637 CCCN)</option>
                  <option value="diferido">Opción C: Renuncia Diferida al Cierre del Círculo</option>
                </select>
              </div>
            </div>

            {/* SECCIÓN 1: CÓMO QUEDA TU SITUACIÓN ECONÓMICA ANTE EL FONDO */}
            <div className="pt-2 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                1. Liquidación Económica del Socio Cedente (Tu situación neta)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Capital Integrado a la Fecha
                  </span>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {fmtMoneda(liquidacionCesion.capitalAportado)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {liquidacionCesion.cuotasPagas} cuotas pagadas + anticipo
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-emerald-500/30 p-4 rounded-xl">
                  <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">
                    Prima por Revalorización ({simPrimaCesion}%)
                  </span>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                    +{fmtMoneda(liquidacionCesion.montoPrima)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Plusvalía sobre el capital aportado
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-rose-500/30 p-4 rounded-xl">
                  <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider block">
                    Arancel Cesión y Gastos (2%)
                  </span>
                  <div className="text-lg font-black text-rose-400 font-mono mt-1">
                    -{fmtMoneda(liquidacionCesion.gastoCesion)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gestión fiduciaria de transferencia
                  </span>
                </div>

                <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-950/20 border-2 border-amber-500/50 p-4 rounded-xl shadow-lg">
                  <span className="text-amber-300 text-[10px] uppercase font-black tracking-wider block">
                    Neto Total a Percibir en Mano
                  </span>
                  <div className="text-xl font-black text-amber-300 font-mono mt-1">
                    {fmtMoneda(liquidacionCesion.netoACobrar)}
                  </div>
                  <span className="text-[11px] text-amber-200/80 mt-1 block font-medium">
                    Liquidación efectiva para el socio
                  </span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: CÓMO QUEDA EL RESTO DE TUS CUOTAS (LIBERACIÓN TOTAL) */}
            <div className="pt-2 space-y-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2. Situación de tus Cuotas Restantes y Compromisos Futuros
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/80 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Liberación Absoluta de Pago para el Socio Cedente</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Al suscribir el instrumento tripartito de cesión, quedas <strong className="text-white">totalmente desvinculado</strong> y eximido de abonar las <strong className="text-emerald-400">{liquidacionCesion.cuotasRestantesAdquirente} cuotas restantes</strong> del plan.
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Cuotas a las que renuncias:</span>
                      <strong className="text-white font-mono">{liquidacionCesion.cuotasRestantesAdquirente} cuotas</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Deuda futura que se te condona/transfiere:</span>
                      <strong className="text-emerald-400 font-mono">{fmtMoneda(liquidacionCesion.deudaRestanteAdquirente)}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <ArrowRight className="w-4 h-4" />
                    <span>Compromisos que Asume el Nuevo Adquirente</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    El tercero adquirente o cesionario sustituye íntegramente tu posición contractual y toma a su cargo el saldo pendiente:
                  </p>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Desembolso inicial de entrada (traspaso):</span>
                      <strong className="text-white font-mono">{fmtMoneda(liquidacionCesion.desembolsoEntradaAdquirente)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Deuda que continuará pagando mes a mes:</span>
                      <strong className="text-indigo-300 font-mono">{fmtMoneda(liquidacionCesion.deudaRestanteAdquirente)}</strong>
                    </div>
                    {liquidacionCesion.gastosAdjudicacionAdquirente > 0 && (
                      <div className="flex justify-between">
                        <span>Gastos de posesión y adjudicación final:</span>
                        <strong className="text-amber-300 font-mono">{fmtMoneda(liquidacionCesion.gastosAdjudicacionAdquirente)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: REQUISITOS CONTRACTUALES SEGÚN CONTRATO FIRMADO */}
            <div className="pt-2 space-y-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                3. Requisitos Contractuales que Debes Cumplimentar (Cláusulas 6ª y 7ª)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1. Cuotas al Día (Sin Mora)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    No registrar atrasos ni cuotas impagas hasta la cuota {simCuotaSalida}. El fideicomiso exige certificado de libre deuda emitido por la administración.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>2. Notificación Feha­ciente</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Conforme al Art. 1614 CCCN y Cláusula Sexta, remitir comunicación por escrito con al menos 15 días corridos de anticipación a la Fiduciaria.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>3. Legajo del Cesionario</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Presentar DNI, constancia de CUIT y justificación de solvencia del adquirente para garantizar la continuidad financiera de los aportes.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>4. Pago del Arancel (2%)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Abonar el arancel del 2% pactado ({fmtMoneda(liquidacionCesion.gastoCesion)}) correspondiente a los costos de gestión administrativa.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>5. Firma Escribanía Fiduciaria</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Suscripción de las 3 partes (Cedente, Cesionario y Fiduciaria) ante la escribanía oficial del fondo con certificación de firmas.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>6. Registro en el Padrón</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Inscripción en el Libro de Beneficiarios y Fideicomisarios del Fondo Inmobiliario para asignarle la unidad al nuevo titular.
                  </p>
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: PASOS A SEGUIR PARA HACERLO */}
            <div className="pt-2 space-y-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                4. Pasos a Seguir para Concretar la Cesión (Paso a Paso)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                      PASO 1
                    </span>
                    <strong className="text-xs text-white block">Libre Deuda</strong>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Solicitar el informe de estado de cuenta y certificado de no mora a la Administración.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-2 self-end hidden md:block" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                      PASO 2
                    </span>
                    <strong className="text-xs text-white block">Postular Adquirente</strong>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Presentar los datos del cesionario comprador o activar la opción de preferencia entre consorcistas.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-2 self-end hidden md:block" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                      PASO 3
                    </span>
                    <strong className="text-xs text-white block">Redacción Notarial</strong>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      La escribanía del fideicomiso confecciona el Contrato de Cesión de Posición Contractual.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-2 self-end hidden md:block" />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                      PASO 4
                    </span>
                    <strong className="text-xs text-white block">Firma Tripartita</strong>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Suscripción de firmas ante escribano público e inscripción en el padrón fiduciario.
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 mt-2 self-end hidden md:block" />
                </div>

                <div className="bg-slate-950/80 border border-emerald-500/40 p-3.5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md inline-block">
                      PASO 5
                    </span>
                    <strong className="text-xs text-emerald-300 block">Cobro y Desvinculación</strong>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Percepción del importe neto ({fmtMoneda(liquidacionCesion.netoACobrar)}) y emisión del finiquito.
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-2 self-end hidden md:block" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 4: AVANCE Y PERMISOS (DATOS DE LA UNIDAD PREADJUDICADA) */}
      {/* ============================================================== */}
      {activeTab === 'obra' && (
        <div className="space-y-6">
          {/* FICHA TÉCNICA EXCLUSIVA DE LA UNIDAD INMUEBLE PREADJUDICADA */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">
                      Mi Unidad Inmueble Preadjudicada
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      Preadjudicación en Contrato
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unidad Funcional asignada con derechos reales fiduciarios exclusivos
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-900/90 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Unidad / Designación</span>
                  <strong className="text-indigo-300 font-bold text-sm">
                    Departamento {socioId}
                  </strong>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Ubicación</span>
                  <strong className="text-amber-300 font-bold text-sm">
                    Piso {pisoAsignado}° • "{letraUnidad}"
                  </strong>
                </div>
              </div>
            </div>

            {/* Cuadrícula de especificaciones de la unidad */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Tipología Asignada
                </span>
                <strong className="text-white text-sm block mt-1">
                  {esTresAmbientes ? '3 Ambientes' : '2 Ambientes'}
                </strong>
                <span className="text-[11px] text-slate-400">Balcón al frente con DVH</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Superficie Propia
                </span>
                <strong className="text-indigo-300 text-sm font-mono block mt-1">
                  {supTotalUnidad} m² Totales
                </strong>
                <span className="text-[11px] text-slate-400">
                  {supCubiertaUnidad} m² cub. + {supSemicubiertaUnidad} m² balcón
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Posesión Programada
                </span>
                <strong className="text-amber-300 text-sm font-mono block mt-1">
                  Cuota {mPos}
                </strong>
                <span className="text-[11px] text-slate-400">{fechaPos.fechaLarga}</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Avance de Obra Global
                </span>
                <strong className="text-emerald-400 text-sm font-mono block mt-1">
                  {avanceObraGlobal}% Ejecutado
                </strong>
                <span className="text-[11px] text-slate-400">Estructura y cerramientos</span>
              </div>
            </div>

            {/* Aviso de Privacidad Estricta */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Aislamiento de Privacidad:</strong> Estás visualizando exclusivamente los datos técnicos de tu unidad. Por política fiduciaria y secreto patrimonial, la información y estados de cuenta de los restantes socios no se encuentra visible.
                </span>
              </span>
            </div>
          </div>

          {/* MÓDULO TÉCNICO GENERAL DEL EDIFICIO (TRÁMITES MUNICIPALES, PLANOS, CRONOGRAMA) */}
          <ModuloTecnico
            datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
            fondoNombre={currentFondo.nombre}
            isReadOnly={true}
            onUpdateDatosTecnicos={() => {}}
          />
        </div>
      )}
    </div>
  );
};


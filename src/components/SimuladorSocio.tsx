import React, { useState, useMemo } from 'react';
import type { UserProfile } from '../types/auth';
import type {
  ParametrosFondoState,
  GastosConfigState,
  ModalidadAnticipo,
  FormaPagoGastos,
  EstrategiaImpactoAdelanto
} from '../types/fondo';
import type { FondoGuardado } from '../services/fondoService';
import { ProyectosActivosCTA } from './ProyectosActivosCTA';
import { calcularGastos, calcularFlujoIndividual, fmtMoneda, formatFecha } from '../utils/calculations';
import {
  Sliders,
  DollarSign,
  Key,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  FileText
} from 'lucide-react';

interface SimuladorSocioProps {
  user: UserProfile;
  fondoNombre: string;
  initialParams: ParametrosFondoState;
  initialGastos: GastosConfigState;
  fondosList?: FondoGuardado[];
  currentFondoId?: string;
  onSelectFondo?: (fondoId: string) => void;
  onOpenContrato?: () => void;
  onOpenMensajes?: () => void;
}

export const SimuladorSocio: React.FC<SimuladorSocioProps> = ({
  user,
  fondoNombre,
  initialParams,
  initialGastos,
  fondosList = [],
  currentFondoId,
  onSelectFondo,
  onOpenContrato,
  onOpenMensajes
}) => {
  // Variables 100% editables para que el socio juegue y experimente
  const [costoDepto, setCostoDepto] = useState<number>(initialParams.costoDepto || 65000);
  const [cantidadCuotas, setCantidadCuotas] = useState<number>(initialParams.cantidadCuotas || 48);
  const [cantidadDeptos, setCantidadDeptos] = useState<number>(initialParams.cantidadDeptos || 10);
  const [proyectoAdoptado, setProyectoAdoptado] = useState<FondoGuardado | null>(null);
  const [notificacionAdopcion, setNotificacionAdopcion] = useState<string | null>(null);

  const handleAdoptarProyecto = (proyecto: FondoGuardado) => {
    setCostoDepto(proyecto.params.costoDepto);
    setCantidadCuotas(proyecto.params.cantidadCuotas);
    setCantidadDeptos(proyecto.params.cantidadDeptos);
    setFechaInicio(proyecto.params.fechaInicio);
    setModalidadAnticipo(proyecto.params.modalidadAnticipo);
    setFormaPagoGastos(proyecto.gastos.formaPagoGastos);
    setComisionGestion(proyecto.gastos.comisionGestion);
    setComisionEscribania(proyecto.gastos.comisionEscribania);
    setOtrosGastos(proyecto.gastos.otrosGastos);
    setAnticipoMes0(Math.round(proyecto.params.costoDepto * 0.1));
    setCuotaPosesionObjetivo(Math.round(proyecto.params.cantidadCuotas / 3));
    setProyectoAdoptado(proyecto);
    setNotificacionAdopcion(`Parámetros oficiales cargados desde "${proyecto.nombre}"`);
    if (onSelectFondo) {
      onSelectFondo(proyecto.id);
    }
    setTimeout(() => setNotificacionAdopcion(null), 5000);
  };
  const [fechaInicio, setFechaInicio] = useState<string>(initialParams.fechaInicio || '2027-01');
  const [modalidadAnticipo, setModalidadAnticipo] = useState<ModalidadAnticipo>(
    initialParams.modalidadAnticipo || 'reducir_cuota'
  );
  const [anticipoMes0, setAnticipoMes0] = useState<number>(Math.round(costoDepto * 0.1));

  // Variables de gastos fiduciarios
  const [formaPagoGastos, setFormaPagoGastos] = useState<FormaPagoGastos>(
    initialGastos.formaPagoGastos || 'final'
  );
  const [comisionGestion, setComisionGestion] = useState<number>(initialGastos.comisionGestion || 7);
  const [comisionEscribania, setComisionEscribania] = useState<number>(initialGastos.comisionEscribania || 3);
  const [otrosGastos, setOtrosGastos] = useState<number>(initialGastos.otrosGastos || 500);

  // Hito de posesión deseado
  const [cuotaPosesionObjetivo, setCuotaPosesionObjetivo] = useState<number>(
    Math.round(cantidadCuotas / 3) || 16
  );

  // Simulación de adelanto extraordinario / licitación
  const [adelantoActivo, setAdelantoActivo] = useState<boolean>(false);
  const [adelantoMonto, setAdelantoMonto] = useState<number>(10000);
  const [adelantoCuota, setAdelantoCuota] = useState<number>(12);
  const [adelantoEstrategia, setAdelantoEstrategia] = useState<EstrategiaImpactoAdelanto>('reducir_cuota');

  // Cálculo de gastos simulados
  const gastosSimulados = useMemo(() => {
    return calcularGastos(
      costoDepto,
      {
        formaPagoGastos,
        comisionGestion,
        comisionEscribania,
        otrosGastos
      },
      cantidadCuotas
    );
  }, [costoDepto, formaPagoGastos, comisionGestion, comisionEscribania, otrosGastos, cantidadCuotas]);

  // Cálculo del flujo simulado personalizado
  const flujoSimulado = useMemo(() => {
    return calcularFlujoIndividual(
      user.socioId || 1,
      costoDepto,
      anticipoMes0,
      cantidadCuotas,
      modalidadAnticipo,
      gastosSimulados.recargoGastosPorCuota,
      {
        activo: adelantoActivo,
        mes: adelantoCuota,
        monto: adelantoMonto,
        estrategia: adelantoEstrategia
      },
      cuotaPosesionObjetivo,
      gastosSimulados.pagoFinalGastos,
      []
    );
  }, [
    user.socioId,
    costoDepto,
    anticipoMes0,
    cantidadCuotas,
    modalidadAnticipo,
    gastosSimulados,
    adelantoActivo,
    adelantoCuota,
    adelantoMonto,
    adelantoEstrategia,
    cuotaPosesionObjetivo
  ]);

  // Cálculo comparativo: Plan Estándar Base (Sin anticipo ni adelanto)
  const flujoBaseSinAnticipo = useMemo(() => {
    return calcularFlujoIndividual(
      user.socioId || 1,
      costoDepto,
      0, // Sin anticipo
      cantidadCuotas,
      'reducir_cuota',
      gastosSimulados.recargoGastosPorCuota,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      cuotaPosesionObjetivo,
      gastosSimulados.pagoFinalGastos,
      []
    );
  }, [user.socioId, costoDepto, cantidadCuotas, gastosSimulados, cuotaPosesionObjetivo]);

  // Restablecer a valores iniciales
  const handleReset = () => {
    setCostoDepto(initialParams.costoDepto);
    setCantidadCuotas(initialParams.cantidadCuotas);
    setCantidadDeptos(initialParams.cantidadDeptos);
    setFechaInicio(initialParams.fechaInicio);
    setModalidadAnticipo(initialParams.modalidadAnticipo);
    setAnticipoMes0(Math.round(initialParams.costoDepto * 0.1));
    setFormaPagoGastos(initialGastos.formaPagoGastos);
    setComisionGestion(initialGastos.comisionGestion);
    setComisionEscribania(initialGastos.comisionEscribania);
    setOtrosGastos(initialGastos.otrosGastos);
    setCuotaPosesionObjetivo(Math.round(initialParams.cantidadCuotas / 3));
    setAdelantoActivo(false);
  };

  const porcentajeAnticipo = Math.round((anticipoMes0 / (costoDepto || 1)) * 100);
  const ahorroCuotaMensual = Math.max(0, flujoBaseSinAnticipo.cuotaInmInicial - flujoSimulado.cuotaInmInicial);
  const ahorroMesesPlazo = Math.max(0, cantidadCuotas - flujoSimulado.mesesTotales);

  return (
    <div className="space-y-6">
      
      {/* 1. Header con Badge de Modo Simulación Abierta */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {user.isGuest || user.id === 'invitado' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modo Inversor Invitado • Simulación 100% Libre (Sin Registro)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Simulación Dinámica • Todas las variables desbloqueadas</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Diseña Tu Plan de Ahorro a Medida
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Fondo base: <strong className="text-white">{fondoNombre}</strong>. Juega libremente con los parámetros fiduciarios (costo de la unidad, anticipo, modalidad y adelantos) para proyectar cómo impactan en tus cuotas mensuales y fecha de posesión antes de firmar el contrato.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {onOpenContrato && (
              <button
                onClick={onOpenContrato}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Modelo Contrato</span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Restablecer valores de prueba"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            {onOpenMensajes && (
              <button
                onClick={onOpenMensajes}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Proponer al Fideicomiso</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK DE PROYECTO ADOPTADO */}
      {notificacionAdopcion && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✅ {notificacionAdopcion}</span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono hidden sm:inline">
            Valores recalculados al 100%
          </span>
        </div>
      )}

      {/* 2. CATÁLOGO DE PROYECTOS ACTIVOS DISPONIBLES (CTA EN 1-CLIC) */}
      {fondosList && fondosList.length > 0 && (
        <ProyectosActivosCTA
          proyectos={fondosList}
          proyectoActivoId={proyectoAdoptado?.id || currentFondoId}
          onAdoptarProyecto={handleAdoptarProyecto}
          onContactarProyecto={(_nombre) => {
            if (onOpenMensajes) onOpenMensajes();
          }}
        />
      )}

      {/* 3. KPIs Comparativos Inmediatos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Cuota Mensual Simulada */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Cuota Mensual Resultante</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {fmtMoneda(flujoSimulado.cuotaInmInicial)}
          </div>
          <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>
              {modalidadAnticipo === 'reducir_cuota' && anticipoMes0 > 0
                ? `Ahorras ${fmtMoneda(ahorroCuotaMensual)}/mes vs plan base`
                : 'Cuota pura amortizada'}
            </span>
          </p>
        </div>

        {/* KPI 2: Total Abonado del Plan */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Desembolso Total al Costo</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-200">
            {fmtMoneda(flujoSimulado.totalAbonado)}
          </div>
          <p className="text-xs text-slate-400">
            Inmueble + Gastos Notariales fiduciarios
          </p>
        </div>

        {/* KPI 3: Plazo y Meses Totales */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Plazo Efectivo del Plan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
            {flujoSimulado.mesesTotales} <span className="text-base text-slate-400 font-normal">meses</span>
          </div>
          <p className="text-xs text-slate-400">
            {modalidadAnticipo === 'reducir_plazo' && ahorroMesesPlazo > 0 ? (
              <span className="text-emerald-400 font-semibold">
                🎉 Cancelas {ahorroMesesPlazo} meses antes
              </span>
            ) : (
              <span>Plazo estándar financiado al costo</span>
            )}
          </p>
        </div>

        {/* KPI 4: Entrega de Posesión */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Mes de Entrega de Llaves</span>
            <Key className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">
            Cuota #{flujoSimulado.cuotaPosesion}
          </div>
          <p className="text-xs text-slate-400">
            Estimado: {formatFecha(fechaInicio, flujoSimulado.cuotaPosesion).fechaLarga}
          </p>
        </div>

      </div>

      {/* 3. Panel de Controles Interactivos (Laboratorio) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA 1: Parámetros del Inmueble y Anticipo */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">1. Inmueble y Anticipo Inicial</h3>
          </div>

          {/* Valor del Inmueble */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Valor / Costo Objetivo de la Unidad</label>
              <span className="text-emerald-400 font-extrabold font-mono text-sm">{fmtMoneda(costoDepto)}</span>
            </div>
            <input
              type="range"
              min={35000}
              max={150000}
              step={2500}
              value={costoDepto}
              onChange={(e) => setCostoDepto(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>USD 35.000</span>
              <span>USD 90.000</span>
              <span>USD 150.000</span>
            </div>
          </div>

          {/* Plazo en Cuotas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Plazo Total en Cuotas</label>
              <span className="text-indigo-300 font-extrabold font-mono text-sm">{cantidadCuotas} Meses</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[24, 36, 48, 60].map((meses) => (
                <button
                  key={meses}
                  type="button"
                  onClick={() => setCantidadCuotas(meses)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    cantidadCuotas === meses
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {meses} Meses
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad de Departamentos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Unidades en el Círculo</label>
              <span className="text-indigo-300 font-extrabold font-mono text-sm">{cantidadDeptos} Departamentos</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[6, 8, 10, 12].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setCantidadDeptos(u)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    cantidadDeptos === u
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {u} Deptos
                </button>
              ))}
            </div>
          </div>

          {/* Anticipo Mes 0 */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                Anticipo Inicial (Mes 0)
              </label>
              <span className="text-amber-400 font-extrabold font-mono text-sm">
                {fmtMoneda(anticipoMes0)} ({porcentajeAnticipo}%)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={costoDepto * 0.5}
              step={1000}
              value={anticipoMes0}
              onChange={(e) => setAnticipoMes0(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>$0 (Sin anticipo)</span>
              <span>25% ({fmtMoneda(costoDepto * 0.25)})</span>
              <span>50% ({fmtMoneda(costoDepto * 0.5)})</span>
            </div>
          </div>

          {/* Modalidad de Aplicación del Anticipo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              ¿Cómo deseas que impacte tu anticipo?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setModalidadAnticipo('reducir_cuota')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  modalidadAnticipo === 'reducir_cuota'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5 text-indigo-300">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Reducir Cuota Mensual</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mantiene el plazo pero baja significativamente cada mensualidad.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModalidadAnticipo('reducir_plazo')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  modalidadAnticipo === 'reducir_plazo'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Reducir Plazo en Meses</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mantiene la cuota mensual pura y cancelas tu inmueble antes de tiempo.
                </p>
              </button>
            </div>
          </div>

        </div>

        {/* COLUMNA 2: Posesión, Gastos y Adelantos de Capital */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Key className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">2. Posesión, Gastos y Adelantos</h3>
          </div>

          {/* Mes de Posesión Objetivo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">
                Turno de Adjudicación / Posesión Deseado
              </label>
              <span className="text-sky-400 font-extrabold font-mono text-sm">
                Cuota #{cuotaPosesionObjetivo} ({formatFecha(fechaInicio, cuotaPosesionObjetivo).fechaLarga})
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={cantidadCuotas}
              step={1}
              value={cuotaPosesionObjetivo}
              onChange={(e) => setCuotaPosesionObjetivo(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Cuota #1</span>
              <span>Cuota #{Math.round(cantidadCuotas / 2)}</span>
              <span>Cuota #{cantidadCuotas}</span>
            </div>
          </div>

          {/* Esquema de Gastos de Adjudicación */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-300">Forma de Pago de Gastos Notariales y Gestión</label>
              <span className="text-xs text-indigo-300 font-bold font-mono">
                Total: {fmtMoneda(gastosSimulados.gastosTotales)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormaPagoGastos('final')}
                className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  formaPagoGastos === 'final'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Al Adjudicar / Posesión
              </button>
              <button
                type="button"
                onClick={() => setFormaPagoGastos('prorrateado')}
                className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                  formaPagoGastos === 'prorrateado'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Prorrateado en Cuotas
              </button>
            </div>
          </div>

          {/* Simulación de Adelanto Extraordinario */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="adelantoCheck"
                  checked={adelantoActivo}
                  onChange={(e) => setAdelantoActivo(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="adelantoCheck" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                  <span>Simular Inyección Extraordinaria de Capital (Licitación / Aguinaldo)</span>
                </label>
              </div>
            </div>

            {adelantoActivo && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Monto a Adelantar</label>
                    <input
                      type="number"
                      step={500}
                      value={adelantoMonto}
                      onChange={(e) => setAdelantoMonto(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">En Cuota Número</label>
                    <input
                      type="number"
                      min={1}
                      max={cantidadCuotas}
                      value={adelantoCuota}
                      onChange={(e) => setAdelantoCuota(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Estrategia del Adelanto</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdelantoEstrategia('reducir_cuota')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        adelantoEstrategia === 'reducir_cuota'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Reducir Cuotas Restantes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdelantoEstrategia('acelerar')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        adelantoEstrategia === 'acelerar'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      Acelerar Posesión
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. Tabla Detallada del Plan Simulado */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Cartola Simulada Mes a Mes</h3>
            <p className="text-xs text-slate-400">Proyección de amortización y saldo remanente al costo</p>
          </div>
          <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {flujoSimulado.flujo.length} Cuotas Calculadas
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Mes</th>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Cuota Pura</th>
                <th className="py-2.5 px-4">Gastos</th>
                <th className="py-2.5 px-4">Total Mes</th>
                <th className="py-2.5 px-4">Saldo Remanente</th>
                <th className="py-2.5 px-4 text-center">Estado / Hito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {flujoSimulado.flujo.slice(0, 24).map((f) => {
                const esPosesion = f.mes === flujoSimulado.cuotaPosesion;
                const esAdelanto = adelantoActivo && f.mes === adelantoCuota;

                return (
                  <tr
                    key={f.mes}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      esPosesion ? 'bg-sky-950/20 font-bold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 text-slate-300">#{f.mes}</td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {formatFecha(fechaInicio, f.mes).fechaCorta}
                    </td>
                    <td className="py-2.5 px-4 text-white font-semibold">
                      {fmtMoneda(f.capital)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {fmtMoneda(f.gastos)}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-300 font-extrabold">
                      {fmtMoneda(f.abonadoMes)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {fmtMoneda(f.saldoRemanente)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {esPosesion && (
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          🔑 Posesión
                        </span>
                      )}
                      {esAdelanto && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">
                          ⚡ Adelanto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {flujoSimulado.flujo.length > 24 && (
          <div className="p-3 bg-slate-950/60 text-center text-[11px] text-slate-500 border-t border-slate-800/80">
            Mostrando primeros 24 meses de {flujoSimulado.flujo.length} totales calculados.
          </div>
        )}
      </div>

      {/* BANNER DE ACCIÓN PARA INVERSOR INVITADO */}
      {(user.isGuest || user.id === 'invitado') && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>¿Te interesa este esquema financiero?</span>
            </h4>
            <p className="text-xs text-slate-300 max-w-xl">
              Puedes imprimir tu simulación en PDF para conservarla o consultar con la administración para solicitar la reserva de tu unidad funcional.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>🖨️ Imprimir / Guardar Ficha</span>
            </button>
            {onOpenMensajes && (
              <button
                type="button"
                onClick={onOpenMensajes}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Solicitar Reserva / Contactar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

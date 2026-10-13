import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { ConversionHubCTA } from './ConversionHubCTA';
import { PreinscripcionModal } from './PreinscripcionModal';
import { InfoTooltip } from './common/InfoTooltip';
import { calcularGastos, calcularFlujoIndividual, fmtMoneda, formatFecha } from '../utils/calculations';
import {
  DollarSign,
  Key,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  FileText,
  Home,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Check,
  X
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
  // Estado del Wizard de 3 Pasos
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1);

  // Progressive Disclosure: Ajustes Avanzados cerrado por defecto
  const [mostrarAjustesAvanzados, setMostrarAjustesAvanzados] = useState<boolean>(false);

  // Variables editables del simulador
  const [costoDepto, setCostoDepto] = useState<number>(initialParams.costoDepto || 65000);
  const [cantidadCuotas, setCantidadCuotas] = useState<number>(initialParams.cantidadCuotas || 48);
  const [cantidadDeptos, setCantidadDeptos] = useState<number>(initialParams.cantidadDeptos || 10);
  const [proyectoAdoptado, setProyectoAdoptado] = useState<FondoGuardado | null>(null);
  const [notificacionAdopcion, setNotificacionAdopcion] = useState<string | null>(null);

  // Estado para el modal de preinscripción fiduciaria oficial
  const [modalPreinscripcionOpen, setModalPreinscripcionOpen] = useState(false);
  const [preinscripcionTarget, setPreinscripcionTarget] = useState<{
    nombre: string;
    id?: string;
    cuota?: number;
    anticipo?: number;
  }>({
    nombre: fondoNombre || 'Fideicomiso Inmobiliario',
    id: currentFondoId,
    cuota: undefined,
    anticipo: undefined
  });

  const [fechaInicio, setFechaInicio] = useState<string>(initialParams.fechaInicio || '2027-01');
  const [modalidadAnticipo, setModalidadAnticipo] = useState<ModalidadAnticipo>(
    initialParams.modalidadAnticipo || 'reducir_cuota'
  );
  const [anticipoMes0, setAnticipoMes0] = useState<number>(Math.round(costoDepto * 0.1));

  // Variables de gastos fiduciarios (Opciones avanzadas)
  const [formaPagoGastos, setFormaPagoGastos] = useState<FormaPagoGastos>(
    initialGastos.formaPagoGastos || 'final'
  );
  const [comisionGestion, setComisionGestion] = useState<number>(initialGastos.comisionGestion || 7);
  const [comisionEscribania, setComisionEscribania] = useState<number>(initialGastos.comisionEscribania || 3);
  const [otrosGastos, setOtrosGastos] = useState<number>(initialGastos.otrosGastos || 500);

  // Hito de posesión deseado (Opciones avanzadas)
  const [cuotaPosesionObjetivo, setCuotaPosesionObjetivo] = useState<number>(
    Math.round(cantidadCuotas / 3) || 16
  );

  // Simulación de inyección extraordinaria / licitación (Opciones avanzadas)
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
      0,
      cantidadCuotas,
      'reducir_cuota',
      gastosSimulados.recargoGastosPorCuota,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      cuotaPosesionObjetivo,
      gastosSimulados.pagoFinalGastos,
      []
    );
  }, [user.socioId, costoDepto, cantidadCuotas, gastosSimulados, cuotaPosesionObjetivo]);

  // Percepción de Carga: Skeleton loaders activos por una fracción de segundo al cambiar parámetros
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const debounceRecalcRef = useRef<any>(null);

  useEffect(() => {
    setIsRecalculating(true);
    if (debounceRecalcRef.current) clearTimeout(debounceRecalcRef.current);
    debounceRecalcRef.current = setTimeout(() => {
      setIsRecalculating(false);
    }, 280);

    return () => {
      if (debounceRecalcRef.current) clearTimeout(debounceRecalcRef.current);
    };
  }, [
    costoDepto,
    anticipoMes0,
    cantidadCuotas,
    cantidadDeptos,
    modalidadAnticipo,
    cuotaPosesionObjetivo,
    adelantoActivo,
    adelantoMonto,
    adelantoCuota,
    adelantoEstrategia,
    formaPagoGastos,
    comisionGestion,
    comisionEscribania,
    otrosGastos
  ]);

  const handleAbrirPreinscripcion = (
    nombreProyecto?: string,
    idProyecto?: string,
    cuotaEst?: number,
    anticipoEst?: number
  ) => {
    setPreinscripcionTarget({
      nombre: nombreProyecto || proyectoAdoptado?.nombre || fondoNombre || 'Fideicomiso Inmobiliario',
      id: idProyecto || proyectoAdoptado?.id || currentFondoId,
      cuota: cuotaEst !== undefined ? cuotaEst : flujoSimulado.cuotaInmInicial,
      anticipo: anticipoEst !== undefined ? anticipoEst : anticipoMes0
    });
    setModalPreinscripcionOpen(true);
  };

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
  };

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
    setPasoActual(1);
    setMostrarAjustesAvanzados(false);
  };

  const porcentajeAnticipo = Math.round((anticipoMes0 / (costoDepto || 1)) * 100);
  const ahorroCuotaMensual = Math.max(0, flujoBaseSinAnticipo.cuotaInmInicial - flujoSimulado.cuotaInmInicial);
  const ahorroMesesPlazo = Math.max(0, cantidadCuotas - flujoSimulado.mesesTotales);

  // Presets para selección rápida en Paso 1
  const presetCostos = [45000, 65000, 85000, 110000, 140000];
  const presetAnticipos = [
    { label: '$0 (Sin anticipo)', valor: 0 },
    { label: '10%', valor: Math.round(costoDepto * 0.1) },
    { label: '20%', valor: Math.round(costoDepto * 0.2) },
    { label: '30%', valor: Math.round(costoDepto * 0.3) },
    { label: '50%', valor: Math.round(costoDepto * 0.5) }
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header con Badge y Acciones Rápidas */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulador Paso a Paso • Fideicomiso al Costo</span>
              <InfoTooltip
                title="Fideicomiso al Costo"
                text="Figura regulada por el Art. 1666 del CCCN donde los socios integran aportes directos para construir al costo estricto de obra, sin margen de ganancia bancaria ni indexación UVA."
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Diseña tu Plan de Inversión a Medida
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Fondo activo: <strong className="text-white">{fondoNombre}</strong>. Configura tu departamento en 3 simples pasos para conocer tu cuota mensual estimada y condiciones de adjudicación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            {onOpenContrato && (
              <button
                type="button"
                onClick={onOpenContrato}
                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Modelo Contrato</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Restablecer valores predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            {onOpenMensajes && (
              <button
                type="button"
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

      {/* FEEDBACK DE PROYECTO ADOPTADO (PERSISTENTE HASTA CIERRE MANUAL) */}
      {notificacionAdopcion && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-lg animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✅ {notificacionAdopcion}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-emerald-400/80 font-mono tabular-nums hidden sm:inline">
              Valores recalculados al 100%
            </span>
            <button
              type="button"
              id="btn-cerrar-notificacion-adopcion"
              onClick={() => setNotificacionAdopcion(null)}
              aria-label="Cerrar notificación de proyecto adoptado"
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition cursor-pointer"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CATÁLOGO DE PROYECTOS ACTIVOS DISPONIBLES (CTA EN 1-CLIC) */}
      {fondosList && fondosList.length > 0 && (
        <ProyectosActivosCTA
          proyectos={fondosList}
          proyectoActivoId={proyectoAdoptado?.id || currentFondoId}
          onAdoptarProyecto={handleAdoptarProyecto}
          onPreinscribirProyecto={(p, cuota) => {
            handleAbrirPreinscripcion(p.nombre, p.id, cuota, Math.round(p.params.costoDepto * 0.1));
          }}
          onContactarProyecto={(nombre) => {
            handleAbrirPreinscripcion(nombre);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* 2. WIZARD STEPPER NAVIGATION: 3 PASOS SECUENCIALES                   */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          
          {/* PASO 1 TAB */}
          <button
            type="button"
            onClick={() => setPasoActual(1)}
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              pasoActual === 1
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : pasoActual > 1
                ? 'bg-slate-950/70 border-emerald-500/40 text-slate-300 hover:border-emerald-400'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                pasoActual === 1
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                  : pasoActual > 1
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {pasoActual > 1 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : '1'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Paso 1
              </span>
              <span className="text-xs sm:text-sm font-extrabold truncate block text-white">
                Mi Unidad
              </span>
              <span className="text-[11px] text-slate-400 hidden md:block truncate">
                Valor y Anticipo
              </span>
            </div>
          </button>

          {/* PASO 2 TAB */}
          <button
            type="button"
            onClick={() => setPasoActual(2)}
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              pasoActual === 2
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : pasoActual > 2
                ? 'bg-slate-950/70 border-emerald-500/40 text-slate-300 hover:border-emerald-400'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                pasoActual === 2
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                  : pasoActual > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {pasoActual > 2 ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : '2'}
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Paso 2
              </span>
              <span className="text-xs sm:text-sm font-extrabold truncate block text-white">
                Mi Plan
              </span>
              <span className="text-[11px] text-slate-400 hidden md:block truncate">
                Plazos y Modalidad
              </span>
            </div>
          </button>

          {/* PASO 3 TAB */}
          <button
            type="button"
            onClick={() => setPasoActual(3)}
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all text-left cursor-pointer ${
              pasoActual === 3
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-slate-300'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                pasoActual === 3
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <div className="overflow-hidden">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Paso 3
              </span>
              <span className="text-xs sm:text-sm font-extrabold truncate block text-white">
                Mi Resultado
              </span>
              <span className="text-[11px] text-slate-400 hidden md:block truncate">
                Resumen Económico
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* CONTENIDO DEL WIZARD SEGÚN EL PASO ACTIVO                            */}
      {/* ==================================================================== */}

      {/* ------------------------------------------------------------------ */}
      {/* PASO 1: MI UNIDAD (VALOR OBJETIVO Y ANTICIPO INICIAL)              */}
      {/* ------------------------------------------------------------------ */}
      {pasoActual === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <span>1. Elige tu Unidad y Anticipo Inicial</span>
                    <InfoTooltip
                      title="Mi Unidad"
                      text="Configura el costo de construcción de la tipología de departamento que deseas adquirir y el anticipo que dispones al momento de ingreso."
                    />
                  </h3>
                  <p className="text-xs text-slate-400">
                    Precios transparentes al costo directo de obra
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Cuota inicial proyectada</span>
                <span className="text-emerald-400 font-extrabold text-lg font-mono">
                  {fmtMoneda(flujoSimulado.cuotaInmInicial)}/mes
                </span>
              </div>
            </div>

            {/* Variable 1: Valor Objetivo del Inmueble */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200 flex items-center">
                  <span>Valor objetivo de la unidad</span>
                  <InfoTooltip
                    title="Valor Objetivo del Inmueble"
                    text="Corresponde al costo total presupuestado de los metros cuadrados del departamento según el plan de obra del fideicomiso, sin sobreprecios bancarios ni comisiones de intermediarios inmobiliarios."
                  />
                </label>
                <span className="text-emerald-400 font-extrabold font-mono text-base sm:text-lg">
                  {fmtMoneda(costoDepto)}
                </span>
              </div>

              {/* Botones de selección rápida */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {presetCostos.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setCostoDepto(val);
                      // Ajustar anticipo proporcional si supera el 50%
                      if (anticipoMes0 > val * 0.5) {
                        setAnticipoMes0(Math.round(val * 0.1));
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      costoDepto === val
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {fmtMoneda(val)}
                  </button>
                ))}
              </div>

              {/* Control deslizante */}
              <input
                type="range"
                min={35000}
                max={150000}
                step={2500}
                value={costoDepto}
                onChange={(e) => {
                  const nuevo = Number(e.target.value);
                  setCostoDepto(nuevo);
                  if (anticipoMes0 > nuevo * 0.5) {
                    setAnticipoMes0(Math.round(nuevo * 0.1));
                  }
                }}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>USD 35.000</span>
                <span>USD 90.000</span>
                <span>USD 150.000</span>
              </div>
            </div>

            {/* Variable 2: Anticipo Inicial (Mes 0) */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200 flex items-center">
                  <span>Anticipo inicial disponible (Mes 0)</span>
                  <InfoTooltip
                    title="Anticipo Inicial (Mes 0)"
                    text="Capital inicial aportado al suscribir el contrato. Puedes comenzar con $0 (100% financiado en cuotas) o aportar un porcentaje para abaratar tus cuotas mensuales o acortar la cantidad total de meses."
                  />
                </label>
                <span className="text-amber-400 font-extrabold font-mono text-base sm:text-lg">
                  {fmtMoneda(anticipoMes0)} <span className="text-xs text-amber-300 font-normal">({porcentajeAnticipo}%)</span>
                </span>
              </div>

              {/* Presets de Anticipo */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {presetAnticipos.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAnticipoMes0(preset.valor)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      anticipoMes0 === preset.valor
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Slider de Anticipo */}
              <input
                type="range"
                min={0}
                max={costoDepto * 0.5}
                step={1000}
                value={anticipoMes0}
                onChange={(e) => setAnticipoMes0(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>$0 (Sin anticipo)</span>
                <span>25% ({fmtMoneda(costoDepto * 0.25)})</span>
                <span>50% ({fmtMoneda(costoDepto * 0.5)})</span>
              </div>
            </div>

            {/* Resumen del Paso 1 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[11px] text-slate-400 block font-semibold">
                  Saldo neto a financiar en cuotas mensuales:
                </span>
                <span className="text-white font-mono font-extrabold text-base sm:text-lg">
                  {fmtMoneda(costoDepto - anticipoMes0)}
                </span>
              </div>

              <button
                type="button"
                id="wizard-step1-next"
                onClick={() => setPasoActual(2)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continuar a Mi Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PASO 2: MI PLAN (PLAZOS, MODALIDAD Y CÍRCULO)                      */}
      {/* ------------------------------------------------------------------ */}
      {pasoActual === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <span>2. Plazos y Modalidad de Ahorro</span>
                    <InfoTooltip
                      title="Mi Plan"
                      text="Elige el plazo de amortización en cuotas y cómo prefieres que tu anticipo alivie tu presupuesto mensual."
                    />
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adaptado a tus posibilidades y capacidad de ahorro
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <span className="text-[11px] text-slate-400 block font-medium">Cuota inicial mensual</span>
                <span className="text-emerald-400 font-extrabold text-lg font-mono">
                  {fmtMoneda(flujoSimulado.cuotaInmInicial)}/mes
                </span>
              </div>
            </div>

            {/* Plazo en Cuotas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200 flex items-center">
                  <span>Plazo total del plan en cuotas</span>
                  <InfoTooltip
                    title="Plazo Total en Cuotas"
                    text="Duración en meses del cronograma de obra. Durante este período se construyen las unidades al costo y se aportan las cuotas mensuales."
                  />
                </label>
                <span className="text-indigo-300 font-extrabold font-mono text-base">
                  {cantidadCuotas} Meses ({Math.round(cantidadCuotas / 12)} Años)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[24, 36, 48, 60].map((meses) => (
                  <button
                    key={meses}
                    type="button"
                    onClick={() => {
                      setCantidadCuotas(meses);
                      setCuotaPosesionObjetivo(Math.round(meses / 3));
                    }}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex flex-col items-center gap-1 ${
                      cantidadCuotas === meses
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{meses} Meses</span>
                    <span className="text-[10px] text-slate-300 font-normal">({meses / 12} años)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modalidad de Aplicación del Anticipo */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <label className="text-xs font-bold text-slate-200 flex items-center">
                <span>¿Cómo deseas que impacte tu anticipo?</span>
                <InfoTooltip
                  title="Estrategia del Anticipo"
                  text="Define si el monto del anticipo amortiza cuotas mensuales (haciéndolas más accesibles mes a mes) o si mantiene la cuota pura y cancela el plan meses antes de lo pactado."
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalidadAnticipo('reducir_cuota')}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    modalidadAnticipo === 'reducir_cuota'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-2 ring-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="text-xs font-bold flex items-center gap-2 text-indigo-300">
                      <TrendingDown className="w-4 h-4 text-indigo-400" />
                      <span>Reducir Cuota Mensual</span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Mantiene el plazo pactado en <strong className="text-white">{cantidadCuotas} meses</strong> y rebaja tu desembolso a{' '}
                    <strong className="text-emerald-400 font-mono">{fmtMoneda(flujoSimulado.cuotaInmInicial)}/mes</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModalidadAnticipo('reducir_plazo')}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    modalidadAnticipo === 'reducir_plazo'
                      ? 'bg-amber-600/20 border-amber-500 text-white ring-2 ring-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1">
                    <div className="text-xs font-bold flex items-center gap-2 text-amber-300">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Reducir Plazo en Meses</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      Cancelación Rápida
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Mantiene la cuota mensual base y finalizas tu departamento en{' '}
                    <strong className="text-amber-300 font-mono">{flujoSimulado.mesesTotales} meses</strong>{' '}
                    {ahorroMesesPlazo > 0 && `(te ahorras ${ahorroMesesPlazo} meses de cuotas)`}.
                  </p>
                </button>
              </div>
            </div>

            {/* Unidades en el Círculo */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200 flex items-center">
                  <span>Unidades en el Círculo de Adjudicación</span>
                  <InfoTooltip
                    title="Círculo de Adjudicación"
                    text="Cantidad de socios o inversores que integran el fideicomiso. Cuantas más unidades, mayor escala tiene el edificio."
                  />
                </label>
                <span className="text-indigo-300 font-extrabold font-mono text-sm">
                  {cantidadDeptos} Departamentos
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[6, 8, 10, 12].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setCantidadDeptos(u)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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

            {/* Botones de navegación del Paso 2 */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Mi Unidad</span>
              </button>

              <button
                type="button"
                id="wizard-step2-next"
                onClick={() => setPasoActual(3)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver Mi Resultado Económico</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PASO 3: MI RESULTADO (RESUMEN ECONÓMICO Y CTA DE CONVERSIÓN)       */}
      {/* ------------------------------------------------------------------ */}
      {pasoActual === 3 && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Tarjeta Destacada de Conversión y Resumen del Plan */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tu Simulación Personalizada está Lista</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  3. Resumen Económico del Plan
                </h3>
                <p className="text-xs text-slate-300">
                  Sin UVA • Sin intereses bancarios • Construcción al costo real
                </p>
              </div>

              {/* BOTÓN PRINCIPAL DE CONVERSIÓN EN CABECERA DE RESULTADO */}
              <button
                type="button"
                id="cta-resultado-principal"
                onClick={() => handleAbrirPreinscripcion()}
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Quiero este plan • Preinscribirme</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            {/* 4 KPIS RESULTANTES DE ALTO IMPACTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* KPI 1: Cuota inicial mensual */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center">
                    <span>Cuota inicial mensual</span>
                    <InfoTooltip
                      title="Cuota inicial mensual"
                      text="Importe mensual proyectado al inicio del plan. Al tratarse de un fideicomiso al costo, esta cuota no contiene intereses usurarios de bancos ni indexación UVA."
                    />
                  </span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {fmtMoneda(flujoSimulado.cuotaInmInicial)}
                </div>
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>
                    {modalidadAnticipo === 'reducir_cuota' && anticipoMes0 > 0
                      ? `Ahorras ${fmtMoneda(ahorroCuotaMensual)}/mes con tu anticipo`
                      : 'Cuota mensual al costo'}
                  </span>
                </p>
              </div>

              {/* KPI 2: Desembolso Total al Costo */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center">
                    <span>Desembolso total al costo</span>
                    <InfoTooltip
                      title="Desembolso Total al Costo"
                      text="Suma total proyectada del departamento terminado más los gastos notariales y de administración fiduciaria."
                    />
                  </span>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-200">
                  {fmtMoneda(flujoSimulado.totalAbonado)}
                </div>
                <p className="text-xs text-slate-400">
                  Inmueble ({fmtMoneda(costoDepto)}) + Gastos Notariales
                </p>
              </div>

              {/* KPI 3: Plazo Efectivo */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center">
                    <span>Plazo efectivo del plan</span>
                    <InfoTooltip
                      title="Plazo Efectivo"
                      text="Cantidad de meses requeridos para cancelar la totalidad del inmueble según la modalidad elegida."
                    />
                  </span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                  {flujoSimulado.mesesTotales} <span className="text-base text-slate-400 font-normal">meses</span>
                </div>
                <p className="text-xs text-slate-400">
                  {modalidadAnticipo === 'reducir_plazo' && ahorroMesesPlazo > 0 ? (
                    <span className="text-emerald-400 font-semibold">
                      🎉 Cancelas {ahorroMesesPlazo} meses antes de lo pactado
                    </span>
                  ) : (
                    <span>Cronograma regular de aportes</span>
                  )}
                </p>
              </div>

              {/* KPI 4: Entrega de Posesión */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span className="flex items-center">
                    <span>Mes de entrega de llaves</span>
                    <InfoTooltip
                      title="Posesión / Entrega de Llaves"
                      text="Momento programado para la entrega formal de la unidad lista para habitar o alquilar."
                    />
                  </span>
                  <Key className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-sky-300">
                  Cuota #{flujoSimulado.cuotaPosesion}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  Estimado: {formatFecha(fechaInicio, flujoSimulado.cuotaPosesion).fechaLarga}
                </p>
              </div>

            </div>

            {/* BOTÓN PARA NAVEGAR ENTRE PASOS */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modificar Parámetros (Paso 2)</span>
              </button>
            </div>
          </div>

          {/* Cartola Simulada Mes a Mes con Lenguaje Claro */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center">
                  <span>Cronograma Proyectado de Cuotas</span>
                  <InfoTooltip
                    title="Cronograma de Cuotas"
                    text="Detalle mensual estimado de amortización de capital y gastos fiduciarios mes a mes hasta la entrega de la unidad."
                  />
                </h4>
                <p className="text-xs text-slate-400">Proyección sin intereses ni comisiones ocultas</p>
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
                    <th className="py-2.5 px-4">Fecha Proyectada</th>
                    <th className="py-2.5 px-4">Cuota Mensual Base</th>
                    <th className="py-2.5 px-4">Gastos Fiduciarios</th>
                    <th className="py-2.5 px-4">Total a Abonar</th>
                    <th className="py-2.5 px-4">Saldo Restante</th>
                    <th className="py-2.5 px-4 text-center">Hito de Obra</th>
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
                            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              🔑 Llaves en mano
                            </span>
                          )}
                          {esAdelanto && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold ml-1 inline-flex items-center gap-1">
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

        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. PROGRESSIVE DISCLOSURE: OPCIONES AVANZADAS (POR DEFECTO CERRADO)  */}
      {/* ==================================================================== */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl overflow-hidden shadow-sm transition-all">
        <button
          type="button"
          id="toggle-ajustes-avanzados"
          onClick={() => setMostrarAjustesAvanzados((prev) => !prev)}
          className="w-full p-5 sm:p-6 text-left flex items-center justify-between hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white">
                  Optimizar mi plan (Ajustes Avanzados)
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {mostrarAjustesAvanzados ? 'Visible' : 'Opcional'}
                </span>
                {(adelantoActivo || formaPagoGastos !== 'final' || comisionGestion !== 7) && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Configuraciones avanzadas aplicadas" />
                )}
              </div>
              <p className="text-xs text-slate-400">
                Licitaciones, gastos de escrituración y fechas de adjudicación específicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            <span className="hidden sm:inline">
              {mostrarAjustesAvanzados ? 'Ocultar ajustes' : 'Desplegar ajustes'}
            </span>
            {mostrarAjustesAvanzados ? (
              <ChevronUp className="w-5 h-5 text-indigo-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {mostrarAjustesAvanzados && (
          <div className="p-6 sm:p-7 border-t border-slate-800/80 bg-slate-950/40 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Ajuste 1: Turno de Adjudicación / Posesión Deseado */}
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-200 flex items-center">
                    <span>Turno de adjudicación / posesión deseado</span>
                    <InfoTooltip
                      title="Turno de Adjudicación"
                      text="Momento en el que se te hace entrega de la unidad terminada. Puedes simular recibirla en etapas tempranas o hacia el cierre de la obra."
                    />
                  </label>
                  <span className="text-sky-400 font-extrabold font-mono text-sm">
                    Cuota #{cuotaPosesionObjetivo}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={cantidadCuotas}
                  step={1}
                  value={cuotaPosesionObjetivo}
                  onChange={(e) => setCuotaPosesionObjetivo(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Cuota #1 (Inicio)</span>
                  <span>Cuota #{Math.round(cantidadCuotas / 2)}</span>
                  <span>Cuota #{cantidadCuotas} (Cierre)</span>
                </div>
              </div>

              {/* Ajuste 2: Forma de Pago de Gastos Fiduciarios y Notariales */}
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-200 flex items-center">
                    <span>Forma de pago de gastos notariales</span>
                    <InfoTooltip
                      title="Gastos Notariales y de Gestión"
                      text="Puedes elegir si abonar los honorarios notariales y de administración al recibir la posesión de la unidad o prorratearlos mensualmente junto a cada cuota."
                    />
                  </label>
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

              {/* Ajuste 3: Comisiones Fiduciarias Específicas */}
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <label className="font-bold text-slate-200 text-xs flex items-center">
                  <span>Comisiones de estructura fiduciaria</span>
                  <InfoTooltip
                    title="Estructura Fiduciaria"
                    text="Parámetros formales de honorarios de la fiduciaria y escribanía interviniente en la escrituración."
                  />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Gestión (%)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={comisionGestion}
                      onChange={(e) => setComisionGestion(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Escribanía (%)</label>
                    <input
                      type="number"
                      step={0.5}
                      value={comisionEscribania}
                      onChange={(e) => setComisionEscribania(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Sellados (USD)</label>
                    <input
                      type="number"
                      step={100}
                      value={otrosGastos}
                      onChange={(e) => setOtrosGastos(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Ajuste 4: Inyección Extraordinaria / Licitación */}
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="adelantoCheck"
                      checked={adelantoActivo}
                      onChange={(e) => setAdelantoActivo(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="adelantoCheck" className="text-xs font-bold text-white cursor-pointer flex items-center">
                      <span>Simular Inyección Extraordinaria (Licitación / Aguinaldo)</span>
                      <InfoTooltip
                        title="Inyección Extraordinaria"
                        text="Simula un aporte no programado de capital (por cobro de un bono, indemnización o ahorros) para achicar tus cuotas restantes o adelantar la entrega."
                      />
                    </label>
                  </div>
                </div>

                {adelantoActivo && (
                  <div className="space-y-3 pt-2 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Monto a Adelantar (USD)</label>
                        <input
                          type="number"
                          step={500}
                          value={adelantoMonto}
                          onChange={(e) => setAdelantoMonto(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">En Cuota Número</label>
                        <input
                          type="number"
                          min={1}
                          max={cantidadCuotas}
                          value={adelantoCuota}
                          onChange={(e) => setAdelantoCuota(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Estrategia del Adelanto</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAdelantoEstrategia('reducir_cuota')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            adelantoEstrategia === 'reducir_cuota'
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
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
                              : 'bg-slate-950 text-slate-400 border-slate-800'
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
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. CONVERSION HUB CTA (WHATSAPP, CALENDAR, ASESORÍA)                 */}
      {/* ==================================================================== */}
      <ConversionHubCTA
        proyectoNombre={proyectoAdoptado?.nombre || fondoNombre || 'Fideicomiso Inmobiliario'}
        cuotaEstimada={flujoSimulado.cuotaInmInicial}
        anticipoEstimado={anticipoMes0}
        onAbrirPreinscripcion={() => handleAbrirPreinscripcion()}
      />

      {/* 5. BANNER COMPLEMENTARIO DE ACCIONES / IMPRESIÓN */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>¿Deseas conservar los cálculos de esta simulación?</span>
          </h4>
          <p className="text-xs text-slate-400 max-w-xl">
            Descarga una copia impresa o digital en PDF con el cronograma y parámetros proyectados.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🖨️ Imprimir / Guardar en PDF</span>
          </button>
          <button
            type="button"
            id="banner-btn-preinscripcion"
            onClick={() => handleAbrirPreinscripcion()}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Preinscribirme en este Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MODAL DE PREINSCRIPCIÓN OBLIGATORIA (CON VALORES PRECARGADOS) */}
      <PreinscripcionModal
        isOpen={modalPreinscripcionOpen}
        onClose={() => setModalPreinscripcionOpen(false)}
        proyectoNombre={preinscripcionTarget.nombre}
        proyectoId={preinscripcionTarget.id}
        cuotaEstimada={preinscripcionTarget.cuota}
        anticipoEstimado={preinscripcionTarget.anticipo}
      />

    </div>
  );
};

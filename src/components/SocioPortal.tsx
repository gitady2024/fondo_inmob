import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile } from '../types/auth';
import type { FondoGuardado } from '../services/fondoService';
import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState } from '../types/fondo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calcularGastos } from '../utils/calculations';
import { SimuladorSocio } from './SimuladorSocio';
import { AdelantoSocioActivo } from './AdelantoSocioActivo';
import {
  Wallet,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Key,
  ShieldCheck,
  Building2,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronRight,
  Sliders,
  Lock,
  Zap,
  Sparkles
} from 'lucide-react';

export interface CuotaItem {
  id: string;
  participacion_id?: string;
  nro_mes: number;
  monto: number;
  pagado: boolean;
  fecha_pago?: string | null;
  fecha_vencimiento?: string;
}

export interface ParticipacionData {
  id: string;
  fondo_id: string;
  socio_id: string;
  estado: string;
  porcentaje_pozo?: number;
  mes_posesion?: number;
}

interface SocioPortalProps {
  user: UserProfile;
  currentFondo?: FondoGuardado;
  flujoSocio?: FlujoSocioCalculado;
  fechaInicio?: string;
  params?: ParametrosFondoState;
  gastos?: GastosConfigState;
  onOpenContrato?: () => void;
  onOpenMensajes?: () => void;
}

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatMonedaARS = (monto: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(Math.round(monto));
};

export const formatFechaLegible = (fechaInicioStr: string, nroMes: number, diaVencimiento: number = 10): string => {
  const [startYear, startMonth] = (fechaInicioStr || '2027-01').split('-').map(Number);
  const targetMonthIndex = (startMonth || 1) - 1 + (nroMes - 1);
  const anio = (startYear || 2027) + Math.floor(targetMonthIndex / 12);
  const mesIndex = targetMonthIndex % 12;
  return `${diaVencimiento} de ${MESES_NOMBRES[mesIndex]}, ${anio}`;
};

export const SocioPortal: React.FC<SocioPortalProps> = ({
  user,
  currentFondo,
  flujoSocio,
  fechaInicio = '2027-01',
  params,
  gastos,
  onOpenContrato,
  onOpenMensajes
}) => {
  const esInvitado = user.id === 'invitado' || user.isGuest;
  const esPlanSimulacion = currentFondo?.estadoPlan === 'simulacion' || esInvitado;
  const [modoVista, setModoVista] = useState<'cuenta' | 'simulador' | 'adelantos'>(
    esPlanSimulacion ? 'simulador' : 'cuenta'
  );

  useEffect(() => {
    if (esInvitado || currentFondo?.estadoPlan === 'simulacion') {
      setModoVista('simulador');
    } else {
      setModoVista('cuenta');
    }
  }, [currentFondo?.id, currentFondo?.estadoPlan, esInvitado]);

  const [activeTab, setActiveTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarTodasPendientes, setMostrarTodasPendientes] = useState<boolean>(false);
  
  // Datos locales de Supabase
  const [participacion, setParticipacion] = useState<ParticipacionData | null>(null);
  const [cuotas, setCuotas] = useState<CuotaItem[]>([]);
  const [origenDatos, setOrigenDatos] = useState<'supabase' | 'simulado'>('simulado');

  const socioId = user.socioId || 1;
  const fechaBase = currentFondo?.params.fechaInicio || fechaInicio || '2027-01';
  const totalCuotasPlan = currentFondo?.params.cantidadCuotas || params?.cantidadCuotas || 48;
  const cantidadDeptos = currentFondo?.params.cantidadDeptos || params?.cantidadDeptos || 10;
  const valorCuotaBase = currentFondo?.params.valorCuotaBase || params?.valorCuotaBase || 1354;

  const gastosCalculados = useMemo(() => {
    return calcularGastos(
      currentFondo?.params.costoDepto || params?.costoDepto || 65000,
      currentFondo?.gastos || gastos || {
        formaPagoGastos: 'final',
        comisionGestion: 7,
        comisionEscribania: 3,
        otrosGastos: 500
      },
      totalCuotasPlan
    );
  }, [currentFondo, params, gastos, totalCuotasPlan]);

  // Mes de posesión asignado al socio
  const mesPosesionEstimada = useMemo(() => {
    if (participacion?.mes_posesion) return participacion.mes_posesion;
    if (currentFondo?.adjudicacionFijada && currentFondo.adjudicacionFijada[socioId]) {
      return currentFondo.adjudicacionFijada[socioId];
    }
    return Math.round((totalCuotasPlan / cantidadDeptos) * socioId) || 15;
  }, [participacion, currentFondo, socioId, totalCuotasPlan, cantidadDeptos]);

  // Porcentaje del pozo que representa su departamento
  const porcentajePozo = useMemo(() => {
    if (participacion?.porcentaje_pozo) return participacion.porcentaje_pozo;
    return cantidadDeptos > 0 ? Number((100 / cantidadDeptos).toFixed(2)) : 10.0;
  }, [participacion, cantidadDeptos]);

  // Función de obtención de datos desde Supabase
  const fetchSupabaseData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    const isCloud = isSupabaseConfigured();

    if (isCloud && supabase) {
      try {
        // 1. Obtener la participación del socio actual
        // Las políticas RLS de Supabase garantizan que solo recibimos la del usuario autenticado
        const { data: partData, error: partError } = await supabase
          .from('participaciones')
          .select('*')
          .limit(1);

        if (partError) {
          console.warn('RLS participaciones query info:', partError.message);
        }

        // 2. Obtener las cuotas del socio actual
        // Las políticas RLS de Supabase garantizan que solo recibimos sus cuotas
        const { data: cuotasData, error: cuotasError } = await supabase
          .from('cuotas')
          .select('*')
          .order('nro_mes', { ascending: true });

        if (cuotasError) {
          console.warn('RLS cuotas query info:', cuotasError.message);
        }

        // Si existen cuotas reales en la base de datos de Supabase, las utilizamos
        if (cuotasData && cuotasData.length > 0) {
          const parsedCuotas: CuotaItem[] = cuotasData.map((c: any) => ({
            id: c.id,
            participacion_id: c.participacion_id,
            nro_mes: Number(c.nro_mes),
            monto: Number(c.monto),
            pagado: Boolean(c.pagado),
            fecha_pago: c.fecha_pago,
            fecha_vencimiento: formatFechaLegible(fechaBase, Number(c.nro_mes))
          }));

          setCuotas(parsedCuotas);
          if (partData && partData.length > 0) {
            setParticipacion({
              id: partData[0].id,
              fondo_id: partData[0].fondo_id,
              socio_id: partData[0].socio_id,
              estado: partData[0].estado || 'activo',
              porcentaje_pozo: porcentajePozo,
              mes_posesion: mesPosesionEstimada
            });
          }
          setOrigenDatos('supabase');
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      } catch (err: any) {
        console.warn('Error al consultar datos en Supabase:', err);
      }
    }

    // FALLBACK DE ALTA FIDELIDAD: Si el socio es de demostración o aún no se generaron
    // filas en Supabase, construimos la proyección financiera real de su unidad
    const cuotasSimuladas: CuotaItem[] = [];
    const cuotasAbonadasSimuladas = Math.min(5, Math.floor(totalCuotasPlan * 0.12)); // Ej: 5 cuotas pagadas en demo

    for (let mes = 1; mes <= totalCuotasPlan; mes++) {
      const estaPagado = mes <= cuotasAbonadasSimuladas;
      const montoMes = flujoSocio?.flujo?.[mes - 1]?.abonadoMes || valorCuotaBase;
      const fechaVenc = formatFechaLegible(fechaBase, mes);

      cuotasSimuladas.push({
        id: `sim-cuota-${mes}`,
        nro_mes: mes,
        monto: montoMes,
        pagado: estaPagado,
        fecha_pago: estaPagado ? formatFechaLegible(fechaBase, mes, 5) : null,
        fecha_vencimiento: fechaVenc
      });
    }

    setCuotas(cuotasSimuladas);
    setParticipacion({
      id: `part-${user.id || socioId}`,
      fondo_id: currentFondo?.id || 'fondo-demo',
      socio_id: user.id || `socio-${socioId}`,
      estado: 'activo',
      porcentaje_pozo: porcentajePozo,
      mes_posesion: mesPosesionEstimada
    });
    setOrigenDatos('simulado');
    setIsLoading(false);
    setIsRefreshing(false);
  }, [user.id, socioId, fechaBase, totalCuotasPlan, porcentajePozo, mesPosesionEstimada, flujoSocio, valorCuotaBase, currentFondo?.id]);

  useEffect(() => {
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  // Cálculos de Top KPIs
  const cuotasPagadas = useMemo(() => cuotas.filter((c) => c.pagado), [cuotas]);
  const cuotasPendientes = useMemo(() => cuotas.filter((c) => !c.pagado), [cuotas]);

  const capitalIntegrado = useMemo(() => {
    return cuotasPagadas.reduce((sum, c) => sum + c.monto, 0);
  }, [cuotasPagadas]);

  const proximaCuota = useMemo(() => {
    return cuotasPendientes[0] || null;
  }, [cuotasPendientes]);

  const porcentajeProgreso = useMemo(() => {
    if (cuotas.length === 0) return 0;
    return Math.round((cuotasPagadas.length / cuotas.length) * 100);
  }, [cuotas.length, cuotasPagadas.length]);

  // Estado de Posesión
  const posesionEntregada = useMemo(() => {
    return cuotasPagadas.length >= mesPosesionEstimada || participacion?.estado === 'adjudicado';
  }, [cuotasPagadas.length, mesPosesionEstimada, participacion?.estado]);

  const mesesRestantesPosesion = useMemo(() => {
    return Math.max(0, mesPosesionEstimada - cuotasPagadas.length);
  }, [mesPosesionEstimada, cuotasPagadas.length]);

  const fechaEstimadaPosesion = useMemo(() => {
    return formatFechaLegible(fechaBase, mesPosesionEstimada);
  }, [fechaBase, mesPosesionEstimada]);

  // Listado recortado para cuotas pendientes
  const cuotasPendientesVisibles = useMemo(() => {
    if (mostrarTodasPendientes) return cuotasPendientes;
    return cuotasPendientes.slice(0, 5);
  }, [cuotasPendientes, mostrarTodasPendientes]);

  // SKELETON LOADER
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Top Greeting */}
        <div className="h-24 bg-slate-900/60 rounded-3xl border border-slate-800" />
        
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>

        {/* Skeleton Possession Card */}
        <div className="h-36 bg-slate-900/60 rounded-2xl border border-slate-800" />

        {/* Skeleton Table */}
        <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    );
  }

  // EMPTY STATE (Si el socio no tiene cuotas generadas)
  if (!isLoading && cuotas.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Clock className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-white">Tu suscripción está en proceso de alta</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Hola <strong className="text-white">{user.nombre}</strong>. El Administrador Fiduciario aún no ha generado el cronograma de cuotas para tu participación en la base de datos de Supabase.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={fetchSupabaseData}
            disabled={isRefreshing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Reintentar Sincronización</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* ==================================================================== */}
      {/* 1. HERO DEL DASHBOARD (SALUDO Y METADATA FINTECH)                   */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/30 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Socio Aportante Activo
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {origenDatos === 'supabase' ? '🔒 Sincronizado vía Supabase RLS' : '⚡ Simulación Activa'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-emerald-300">{user.nombre}</span> 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
              <span>{currentFondo?.nombre || 'Círculo Inmobiliario Mutuo'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-300 font-semibold">Unidad Funcional: Depto {socioId}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-300 font-semibold">{porcentajePozo}% del pozo</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={fetchSupabaseData}
              disabled={isRefreshing}
              title="Refrescar estado de cuotas"
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all text-xs flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {onOpenContrato && (
              <button
                onClick={onOpenContrato}
                className="px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Contrato</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SELECTOR DE MODO: SIMULACIÓN ABIERTA VS GESTIÓN DE PLAN ACTIVO      */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          {esInvitado ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Modo Invitado: Simula libremente sin crear cuenta ni compromiso</span>
            </span>
          ) : esPlanSimulacion ? (
            <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Modo Simulación: Totalidad de variables disponibles para diseñar tu plan</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Plan Activo: Condiciones contractuales fijas. Puedes modificar aportes y adelantos</span>
            </span>
          )}
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          {esPlanSimulacion ? (
            <>
              <button
                type="button"
                onClick={() => setModoVista('simulador')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVista === 'simulador'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Simulador Integral</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVista('cuenta')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVista === 'cuenta'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Vista Previa Cuotas</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setModoVista('cuenta')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVista === 'cuenta'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Cronograma y Pagos</span>
              </button>
              <button
                type="button"
                onClick={() => setModoVista('adelantos')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoVista === 'adelantos'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Proyectar Adelantos</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDERIZADO SEGÚN MODO SELECCIONADO */}
      {modoVista === 'simulador' ? (
        <SimuladorSocio
          user={user}
          fondoNombre={currentFondo?.nombre || 'Fondo Inmobiliario'}
          initialParams={currentFondo?.params || params || {
            costoDepto: 65000,
            cantidadDeptos: 10,
            cantidadCuotas: 48,
            valorCuotaBase: 1354,
            fechaInicio: '2027-01',
            modalidadAnticipo: 'reducir_cuota'
          }}
          initialGastos={currentFondo?.gastos || gastos || {
            formaPagoGastos: 'final',
            comisionGestion: 7,
            comisionEscribania: 3,
            otrosGastos: 500
          }}
          onOpenContrato={onOpenContrato}
          onOpenMensajes={onOpenMensajes}
        />
      ) : modoVista === 'adelantos' ? (
        <AdelantoSocioActivo
          socioId={socioId}
          socioNombre={user.nombre}
          flujoActual={flujoSocio || {
            socioId,
            anticipoMes0: 0,
            cuotaPosesion: mesPosesionEstimada,
            cuotaInmInicial: valorCuotaBase,
            cuotaFinInicial: valorCuotaBase,
            pagoFinalGastos: gastosCalculados.pagoFinalGastos,
            recargoGastosPorCuota: gastosCalculados.recargoGastosPorCuota,
            mesesTotales: totalCuotasPlan,
            totalAbonado: (params?.costoDepto || 65000),
            flujo: []
          }}
          params={currentFondo?.params || params || {
            costoDepto: 65000,
            cantidadDeptos: 10,
            cantidadCuotas: 48,
            valorCuotaBase: 1354,
            fechaInicio: '2027-01',
            modalidadAnticipo: 'reducir_cuota'
          }}
          gastos={currentFondo?.gastos || gastos || {
            formaPagoGastos: 'final',
            comisionGestion: 7,
            comisionEscribania: 3,
            otrosGastos: 500
          }}
          pagoFinalGastos={gastosCalculados.pagoFinalGastos}
          recargoGastosPorCuota={gastosCalculados.recargoGastosPorCuota}
          onOpenMensajes={onOpenMensajes}
        />
      ) : (
        <>
          {/* ==================================================================== */}
          {/* 2. PANEL DE RESUMEN (TOP 3 KPIS FINTECH)                             */}
          {/* ==================================================================== */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* CARD 1: CAPITAL INTEGRADO */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Capital Integrado</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatMonedaARS(capitalIntegrado)}
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{cuotasPagadas.length} cuotas abonadas al costo</span>
            </p>
          </div>
        </div>

        {/* CARD 2: PRÓXIMO VENCIMIENTO */}
        <div className="bg-slate-900/60 border border-amber-500/30 bg-gradient-to-br from-slate-900/70 to-amber-950/10 rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Próximo Vencimiento</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
              {proximaCuota ? formatMonedaARS(proximaCuota.monto) : 'Al Día 🎉'}
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5">
              {proximaCuota ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vence: <strong className="text-white">{proximaCuota.fecha_vencimiento}</strong></span>
                </>
              ) : (
                <span>No tienes cuotas pendientes de pago</span>
              )}
            </p>
          </div>
        </div>

        {/* CARD 3: PROGRESO DEL PLAN CON PROGRESS BAR */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 sm:p-6 transition-all shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Progreso del Plan</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {porcentajeProgreso}%
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">
                {cuotasPagadas.length} / {cuotas.length} cuotas
              </span>
            </div>

            {/* Barra de Progreso Lineal */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500 shadow-sm shadow-emerald-500/20"
                style={{ width: `${Math.min(100, Math.max(3, porcentajeProgreso))}%` }}
              />
            </div>
          </div>
        </div>

      </section>

      {/* ==================================================================== */}
      {/* 3. ESTADO DE POSESIÓN (TIMELINE / HITO PRINCIPAL)                     */}
      {/* ==================================================================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Hito Clave • Adjudicación y Entrega</span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white">
              ¿Cuándo recibo mi inmueble / capital?
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tu turno de posesión técnica y entrega de llaves está estipulado para la <strong className="text-white">Cuota #{mesPosesionEstimada}</strong> ({fechaEstimadaPosesion}).
            </p>
          </div>

          {/* Banner de Estado de Posesión Condicional */}
          <div className="shrink-0">
            {posesionEntregada ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                  ✅
                </div>
                <div>
                  <strong className="text-sm block text-white font-bold">Posesión Entregada</strong>
                  <span className="text-xs text-emerald-400">Unidad adjudicada conforme al contrato fiduciario</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Faltan <span className="text-indigo-400 text-base">{mesesRestantesPosesion}</span> meses para tu posesión
                  </div>
                  <span className="text-xs text-slate-400">Fecha estimada: {fechaEstimadaPosesion}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mini Línea de Tiempo de Hitos */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Hito 1: Inicio de Obras</span>
            <strong className="text-white font-semibold">Mes 1 • {formatFechaLegible(fechaBase, 1, 1)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
            <span className="text-indigo-300 block text-[11px]">Hito 2: Turno de Posesión</span>
            <strong className="text-white font-semibold">Mes {mesPosesionEstimada} • {fechaEstimadaPosesion}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 block text-[11px]">Hito 3: Financiación Total</span>
            <strong className="text-white font-semibold">Mes {totalCuotasPlan} • {formatFechaLegible(fechaBase, totalCuotasPlan, 1)}</strong>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. HISTORIAL Y CALENDARIO DE PAGOS (TABS: PENDIENTES / HISTORIAL)    */}
      {/* ==================================================================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Cabecera de Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div>
            <h3 className="text-base font-bold text-white">Cronograma y Pagos de Cuotas</h3>
            <p className="text-xs text-slate-400">Consulta tus vencimientos y comprobantes al costo fiduciario</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pendientes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes ({cuotasPendientes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Historial ({cuotasPagadas.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PENDIENTES */}
        {activeTab === 'pendientes' && (
          <div className="p-4 sm:p-6 space-y-4">
            {cuotasPendientes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                🎉 No tienes cuotas pendientes. Estás completamente al día con tu plan de ahorro.
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Próximas cuotas programadas a pagar:</span>
                  <span className="text-slate-500 hidden sm:inline">Valores al costo sin intereses usurarios</span>
                </div>

                {/* Vista Lista / Tabla Responsive */}
                <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                  {cuotasPendientesVisibles.map((cuota, index) => {
                    const esLaMasProxima = index === 0;

                    return (
                      <div
                        key={cuota.id || cuota.nro_mes}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          esLaMasProxima ? 'bg-amber-950/15 border-l-4 border-l-amber-500' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            esLaMasProxima ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            #{cuota.nro_mes}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Cuota Mensual #{cuota.nro_mes}</span>
                              {esLaMasProxima && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">
                                  Próximo Vencimiento
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              Vence el {cuota.fecha_vencimiento}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-right">
                            <span className="text-sm sm:text-base font-extrabold text-white">
                              {formatMonedaARS(cuota.monto)}
                            </span>
                            <span className="text-[11px] block text-slate-500">
                              Base + aportes fiduciarios
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pendiente
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botón para Ver Todas / Menos */}
                {cuotasPendientes.length > 5 && (
                  <div className="text-center pt-1">
                    <button
                      onClick={() => setMostrarTodasPendientes(!mostrarTodasPendientes)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{mostrarTodasPendientes ? 'Mostrar solo próximas 5 cuotas' : `Ver todas las cuotas pendientes (${cuotasPendientes.length})`}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${mostrarTodasPendientes ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: HISTORIAL */}
        {activeTab === 'historial' && (
          <div className="p-4 sm:p-6 space-y-4">
            {cuotasPagadas.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aún no tienes pagos registrados en el historial.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40">
                {cuotasPagadas.map((cuota) => (
                  <div
                    key={cuota.id || cuota.nro_mes}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Cuota #{cuota.nro_mes}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
                            Acreditado
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Fecha de acreditación: {cuota.fecha_pago || cuota.fecha_vencimiento}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                          {formatMonedaARS(cuota.monto)}
                        </span>
                        <span className="text-[11px] block text-slate-500">
                          Imputado a capital
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pagado ✅
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </section>

      {/* ==================================================================== */}
      {/* 5. FOOTER DE SEGURIDAD Y TRANSPARENCIA FIDUCIARIA                     */}
      {/* ==================================================================== */}
      <footer className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Vista de Solo Lectura protegida por Row Level Security (RLS) en Supabase</span>
        </div>
      </footer>
    </>
  )}

</div>
  );
};

export default SocioPortal;

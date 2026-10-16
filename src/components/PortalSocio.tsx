import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types/auth';
import type {
  FlujoSocioCalculado,
  ParametrosFondoState,
  GastosConfigState,
  EstrategiaImpactoAdelanto,
  MecanismoSalida
} from '../types/fondo';
import type { FondoGuardado } from '../services/fondoService';
import { FOTOS_OBRA_PREDETERMINADAS, type FotoAvance } from '../services/fondoService';
import {
  fmtMoneda,
  formatFecha,
  calcularFlujoIndividual,
  calcularLiquidacionCesion
} from '../utils/calculations';
import { exportarFichaSocioPDF } from '../utils/exportReports';
import { enviarMensaje } from '../services/mensajeService';
import { CuentaIndividual } from './CuentaIndividual';
import { ModuloTecnico } from './ModuloTecnico';
import { CentroMensajes } from './CentroMensajes';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import {
  Building2,
  Zap,
  ScrollText,
  HardHat,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  Calendar,
  Home,
  DollarSign,
  Copy,
  Check,
  Download,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Send,
  AlertCircle,
  LogOut,
  LogIn,
  Calculator
} from 'lucide-react';

interface PortalSocioProps {
  user: UserProfile;
  currentFondo: FondoGuardado;
  flujoSocio: FlujoSocioCalculado;
  fechaInicio: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  onOpenContrato?: () => void;
  onSignOut?: () => void;
  onLogin?: () => void;
  /** Tab inicial para abrir directamente (ej. 'adelanto' para simulación de plan) */
  initialTab?: 'cartola' | 'adelanto' | 'cesion' | 'obra' | 'mensajes';
}

export const PortalSocio: React.FC<PortalSocioProps> = ({
  user,
  currentFondo,
  flujoSocio,
  fechaInicio,
  params,
  gastos,
  onOpenContrato,
  onSignOut,
  onLogin,
  initialTab = 'cartola'
}) => {
  const socioId = user.socioId || 1;
  const [activeTab, setActiveTab] = useState<'cartola' | 'adelanto' | 'cesion' | 'obra' | 'mensajes'>(initialTab);

  // Cuando el padre pide ir al simulador (ej. botón "Simular Plan"), actualizar la pestaña activa
  useEffect(() => {
    if (initialTab && initialTab !== 'cartola') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Estados UI y Modales
  const [showModalPago, setShowModalPago] = useState<boolean>(false);
  const [copiadoCbu, setCopiadoCbu] = useState<boolean>(false);
  const [copiadoAlias, setCopiadoAlias] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estados Formulario Notificación de Pago
  const [pagoBanco, setPagoBanco] = useState<string>('');
  const [pagoComprobante, setPagoComprobante] = useState<string>('');
  const [pagoNotas, setPagoNotas] = useState<string>('');
  const [enviandoPago, setEnviandoPago] = useState<boolean>(false);

  // Estados Acordeones
  const [mostrarCronogramaAdelanto, setMostrarCronogramaAdelanto] = useState<boolean>(false);
  const [mostrarMarcoLegalCesion, setMostrarMarcoLegalCesion] = useState<boolean>(false);

  // ==========================================
  // CÁLCULO ESTIMADO DE CUOTA ACTUAL / PRÓXIMA
  // ==========================================
  const mesesTotales = flujoSocio.mesesTotales;
  const mPos = flujoSocio.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
  const fechaFin = formatFecha(fechaInicio, mesesTotales);
  const dt = currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT;

  const proximaCuotaNum = useMemo(() => {
    try {
      const [startYear, startMonth] = (fechaInicio || '2026-01').split('-').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const diff = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
      return Math.max(1, Math.min(mesesTotales, diff));
    } catch {
      return 1;
    }
  }, [fechaInicio, mesesTotales]);

  const [pagoCuotaSeleccionada, setPagoCuotaSeleccionada] = useState<number>(proximaCuotaNum);

  const proximaCuotaObj = flujoSocio.flujo[proximaCuotaNum - 1] || flujoSocio.flujo[0];
  const fechaProximaCuota = formatFecha(fechaInicio, proximaCuotaNum);

  // Monto acumulado y porcentaje de progreso
  const cuotasAbonadasEstimadas = Math.max(0, proximaCuotaNum - 1);
  const montoAbonadoEstimado = useMemo(() => {
    let sum = flujoSocio.anticipoMes0;
    for (let i = 0; i < cuotasAbonadasEstimadas && i < flujoSocio.flujo.length; i++) {
      sum += flujoSocio.flujo[i].abonadoMes;
    }
    return sum;
  }, [flujoSocio, cuotasAbonadasEstimadas]);

  const porcentajeCancelado = Math.min(
    100,
    Math.round((montoAbonadoEstimado / (flujoSocio.totalAbonado || 1)) * 100)
  );

  // ==========================================
  // DATOS DE LA UNIDAD
  // ==========================================
  const totalUnidades = params.cantidadDeptos || 10;
  const pisosTotales = dt.cantidadPisos || 5;
  const pisoAsignado = ((socioId - 1) % pisosTotales) + 1;
  const letraUnidad = String.fromCharCode(65 + ((socioId - 1) % Math.max(1, Math.ceil(totalUnidades / pisosTotales))));
  const supCubiertaUnidad = Math.round((dt.superficieCubiertaM2 || 1100) / totalUnidades);
  const supSemicubiertaUnidad = Math.round((dt.superficieSemicubiertaM2 || 150) / totalUnidades);
  const supTotalUnidad = supCubiertaUnidad + supSemicubiertaUnidad;
  const esTresAmbientes = socioId % 2 === 0;

  // Fotos de la obra
  const fotosDeLaObra: FotoAvance[] = (currentFondo.fotos && currentFondo.fotos.length > 0)
    ? currentFondo.fotos
    : FOTOS_OBRA_PREDETERMINADAS;

  // Avance global ponderado
  const avanceObraGlobal = useMemo(() => {
    if (!dt.etapas || dt.etapas.length === 0) return 32;
    const totalPonderado = dt.etapas.reduce(
      (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
      0
    );
    return Math.round(totalPonderado);
  }, [dt.etapas]);

  // ==========================================
  // ESTADOS Y CÁLCULOS: SIMULACIÓN DE ADELANTO
  // ==========================================
  const [simMontoAdelanto, setSimMontoAdelanto] = useState<number>(5000);
  const [simCuotaAdelanto, setSimCuotaAdelanto] = useState<number>(
    Math.min(proximaCuotaNum + 2, mesesTotales)
  );
  const [simEstrategiaAdelanto, setSimEstrategiaAdelanto] = useState<EstrategiaImpactoAdelanto>('reducir_cuota');
  const [enviandoSolicitudAdelanto, setEnviandoSolicitudAdelanto] = useState<boolean>(false);

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
      flujoSocio.pagoFinalGastos,
      currentFondo.ajustes || []
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
    currentFondo.ajustes,
    simMontoAdelanto,
    simCuotaAdelanto,
    simEstrategiaAdelanto
  ]);

  const cuotaHabitualMesAdelanto = flujoSocio.flujo[simCuotaAdelanto - 1]?.capital || flujoSocio.cuotaInmInicial;
  const cuotaNuevaMesAdelanto =
    flujoSimuladoAdelanto.flujo[simCuotaAdelanto]?.capital ||
    flujoSimuladoAdelanto.flujo[simCuotaAdelanto - 1]?.capital ||
    0;
  const alivioMensualCapital = Math.max(0, cuotaHabitualMesAdelanto - cuotaNuevaMesAdelanto);
  const mesesAhorrados = Math.max(0, mesesTotales - flujoSimuladoAdelanto.mesesTotales);

  // ==========================================
  // ESTADOS Y CÁLCULOS: SIMULACIÓN DE CESIÓN
  // ==========================================
  const [simCuotaSalida, setSimCuotaSalida] = useState<number>(
    Math.min(18, Math.max(1, Math.round(mesesTotales / 2)))
  );
  const [simPrimaCesion, setSimPrimaCesion] = useState<number>(10);
  const [simMecanismoCesion, setSimMecanismoCesion] = useState<MecanismoSalida>('tercero');
  const [enviandoSolicitudCesion, setEnviandoSolicitudCesion] = useState<boolean>(false);

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
  // COORDENADAS BANCARIAS FIDUCIARIAS
  // ==========================================
  const nombreLimpioFondo = currentFondo.nombre.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'INMOBIL';
  const cbuOficial = '0720019200000001928345';
  const aliasOficial = `FONDO.${nombreLimpioFondo}.D${socioId}`;

  const copiarTexto = async (texto: string, tipo: 'cbu' | 'alias') => {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo === 'cbu') {
        setCopiadoCbu(true);
        setTimeout(() => setCopiadoCbu(false), 2500);
      } else {
        setCopiadoAlias(true);
        setTimeout(() => setCopiadoAlias(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Enviar notificación formal de pago a Administración
  const handleEnviarAvisoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoComprobante.trim()) {
      alert('Por favor ingresá el número de comprobante o referencia bancaria.');
      return;
    }

    setEnviandoPago(true);
    try {
      const cuotaElegidaObj = flujoSocio.flujo[pagoCuotaSeleccionada - 1] || proximaCuotaObj;
      const montoTotalPagar = cuotaElegidaObj?.abonadoMes || 0;

      await enviarMensaje(
        {
          fondoId: currentFondo.id,
          receiverRole: 'admin',
          categoria: 'pago_cuota',
          asunto: `Aviso de Transferencia - Cuota #${pagoCuotaSeleccionada} (Unidad D${socioId})`,
          contenido: `Estimada Administración Fiduciaria:\n\nNotifico la realización de transferencia bancaria:\n- Unidad: Departamento ${socioId} (Piso ${pisoAsignado} "${letraUnidad}")\n- Cuota Imputada: #${pagoCuotaSeleccionada} (${formatFecha(fechaInicio, pagoCuotaSeleccionada).fechaCorta})\n- Monto Transferido: ${fmtMoneda(montoTotalPagar)}\n- Banco Emisor: ${pagoBanco || 'No especificado'}\n- N° de Comprobante / Transacción: ${pagoComprobante.trim()}\n${pagoNotas ? `- Observaciones: ${pagoNotas.trim()}\n` : ''}\nSolicito verificación de acreditación e imputación en la Cartola Individual Oficial.`
        },
        user
      );

      setShowModalPago(false);
      setPagoComprobante('');
      setPagoBanco('');
      setPagoNotas('');
      showToast(`✓ Aviso de pago de Cuota #${pagoCuotaSeleccionada} enviado con éxito a la Administración.`);
    } catch (err: any) {
      alert(`Error al enviar el aviso: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setEnviandoPago(false);
    }
  };

  // Enviar solicitud de adelanto de capital
  const handleSolicitarAdelanto = async () => {
    setEnviandoSolicitudAdelanto(true);
    try {
      await enviarMensaje(
        {
          fondoId: currentFondo.id,
          receiverRole: 'admin',
          categoria: 'adelanto_licitacion',
          asunto: `Solicitud Formal de Adelanto de Capital - Unidad D${socioId}`,
          contenido: `Estimada Administración Fiduciaria:\n\nSolicito formalmente la aplicación de un Adelanto Voluntario de Capital bajo las siguientes condiciones proyectadas:\n- Monto de inyección: ${fmtMoneda(simMontoAdelanto)}\n- Cuota de imputación: #${simCuotaAdelanto} (${formatFecha(fechaInicio, simCuotaAdelanto).fechaCorta})\n- Estrategia elegida: ${
            simEstrategiaAdelanto === 'reducir_cuota'
              ? 'Aliviar cuota mensual (ahorro mensual proyectado: -' + fmtMoneda(alivioMensualCapital) + '/mes)'
              : 'Acortar plazo (adelanto de ' + mesesAhorrados + ' meses)'
          }\n\nSolicito los datos de imputación fiduciaria para coordinar la transferencia.\n\nSocio D${socioId} - ${user.nombre}`
        },
        user
      );
      showToast('✓ Solicitud de adelanto remitida a la Administración. Podés seguir la respuesta en la pestaña Mensajes.');
    } catch (err: any) {
      alert(`Error al enviar la solicitud: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setEnviandoSolicitudAdelanto(false);
    }
  };

  // Enviar consulta formal de cesión
  const handleSolicitarCesion = async () => {
    setEnviandoSolicitudCesion(true);
    try {
      await enviarMensaje(
        {
          fondoId: currentFondo.id,
          receiverRole: 'admin',
          categoria: 'cesion_contrato',
          asunto: `Consulta y Pautas de Cesión Contractual - Unidad D${socioId}`,
          contenido: `Estimada Administración Fiduciaria:\n\nConsulto el inicio del procedimiento de Cesión de Posición Contractual para la Unidad D${socioId} conforme Arts. 1614 y 1636 del CCCN:\n- Cuota proyectada de salida: #${simCuotaSalida} (${fechaCesion.fechaCorta})\n- Mecanismo previsto: ${simMecanismoCesion === 'tercero' ? 'Cesión a Tercero' : simMecanismoCesion === 'preferencia' ? 'Preferencia de Consorcistas' : 'Renuncia diferida'}\n- Prima acordada: ${simPrimaCesion}%\n- Neto a percibir proyectado: ${fmtMoneda(liquidacionCesion.netoACobrar)}\n\nSolicito el certificado de Libre Deuda previo y las pautas para la postulación del cesionario.\n\nSocio D${socioId} - ${user.nombre}`
        },
        user
      );
      showToast('✓ Consulta de cesión remitida a la Administración. Nos contactaremos a la brevedad.');
    } catch (err: any) {
      alert(`Error al enviar la consulta: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setEnviandoSolicitudCesion(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* TOAST FLOTANTE */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* ── 1. CABECERA EJECUTIVA DEL SOCIO (DASHBOARD MINIMALISTA) ──────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-5">
          {/* Fila Superior: Saludo y Datos de la Unidad */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-600/30">
                {user.isGuest ? <Calculator className="w-6 h-6 text-white" /> : `D${socioId}`}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {user.isGuest ? 'Simulador de Plan de Inversión' : `Hola, ${user.nombre}`}
                  </h2>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    user.isGuest
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}>
                    {user.isGuest ? 'Simulación Abierta' : 'Suscripción Activa'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proyecto: <strong className="text-indigo-300">{currentFondo.nombre}</strong> • {user.isGuest ? 'Unidad de referencia:' : 'Unidad:'}{' '}
                  <strong className="text-white">Departamento {socioId}</strong> (Piso {pisoAsignado}° "{letraUnidad}")
                </p>
              </div>
            </div>

            {/* Quick Actions en Cabecera */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModalPago(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pagar / Informar Transferencia</span>
              </button>

              <button
                type="button"
                onClick={() => exportarFichaSocioPDF(flujoSocio, params, gastos, fechaInicio, proximaCuotaNum)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Descargar Ficha Oficial en PDF"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Descargar Cartola</span>
              </button>

              {onOpenContrato && (
                <button
                  type="button"
                  onClick={onOpenContrato}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Ver Contrato Fiduciario de Adhesión"
                >
                  <ScrollText className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Mi Contrato</span>
                </button>
              )}

              {/* Botón: Ingresar al Perfil (modo invitado) o Salir de la cuenta (sesión real) */}
              {user.isGuest ? (
                onLogin && (
                  <button
                    type="button"
                    onClick={onLogin}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/25"
                    title="Ingresar con tu cuenta de socio"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Ingresar al Perfil</span>
                  </button>
                )
              ) : (
                onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    title="Cerrar sesión y salir de la cuenta de socio"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Salir de la cuenta</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* 3 KPIs Esenciales a Golpe de Vista */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* KPI 1: Próxima Cuota */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Próxima Cuota #{proximaCuotaNum}
                </span>
                <span className="text-[11px] font-mono text-indigo-300 font-bold">
                  {fechaProximaCuota.fechaCorta}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-white font-mono">
                  {fmtMoneda(proximaCuotaObj?.abonadoMes || 0)}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>Capital puro: {fmtMoneda(proximaCuotaObj?.capital || 0)}</span>
                  <span className="text-emerald-400 font-medium">Al Día</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Progreso de Cancelación */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Progreso del Plan
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {porcentajeCancelado}%
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-white font-bold">{fmtMoneda(montoAbonadoEstimado)}</span>
                  <span className="text-slate-500">de {fmtMoneda(flujoSocio.totalAbonado)}</span>
                </div>
                {/* Barra de progreso elegante */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${porcentajeCancelado}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {cuotasAbonadasEstimadas} de {mesesTotales} cuotas computadas + anticipo
                </p>
              </div>
            </div>

            {/* KPI 3: Tu Unidad Inmueble & Posesión */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  Posesión Programada
                </span>
                <span className="text-amber-300 font-mono font-bold text-xs">
                  Cuota {mPos}
                </span>
              </div>
              <div className="mt-2">
                <div className="text-lg font-black text-amber-300 font-mono">
                  {fechaPos.fechaLarga}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tipología: <strong className="text-slate-200">{esTresAmbientes ? '3 Amb.' : '2 Amb.'}</strong> ({supTotalUnidad} m²) • Llaves en mano
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. NAVEGACIÓN POR PESTAÑAS DEL PORTAL ─────────────────────────── */}
      <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl p-1 gap-1 max-w-4xl no-print">
        <button
          type="button"
          onClick={() => setActiveTab('cartola')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cartola'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Mi Estado de Cuenta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adelanto')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'adelanto'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Simular Adelanto</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cesion')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cesion'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Simular Cesión</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('obra')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'obra'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Avance y Mi Unidad</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mensajes')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'mensajes'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Mensajes & Consultas</span>
        </button>
      </div>

      {/* ── 3. PESTAÑA 1: MI ESTADO DE CUENTA (CARTOLA DETALLADA) ──────────── */}
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

      {/* ── 4. PESTAÑA 2: SIMULADOR DE ADELANTO (MINIMALISTA + COMPARADOR) ──── */}
      {activeTab === 'adelanto' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">

            {/* Cabecera del Simulador */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Simulador de Adelanto Voluntario</h3>
                  <p className="text-xs text-slate-400">
                    Proyectá el impacto financiero directo de una inyección de capital en tus cuotas
                  </p>
                </div>
              </div>
              <span className="text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono font-medium px-3 py-1 rounded-xl">
                Unidad D{socioId} • Depto {socioId}
              </span>
            </div>

            {/* Selector Visual de Estrategia */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                1. ¿Qué objetivo financiero buscás con este aporte?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSimEstrategiaAdelanto('reducir_cuota')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    simEstrategiaAdelanto === 'reducir_cuota'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-600/15'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      Aliviar Cuota Mensual
                    </span>
                    {simEstrategiaAdelanto === 'reducir_cuota' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Pagás menos dinero todos los meses manteniendo el mismo plazo total de posesión.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSimEstrategiaAdelanto('acelerar')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    simEstrategiaAdelanto === 'acelerar'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-600/15'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      Acortar Plazo de Cancelación
                    </span>
                    {simEstrategiaAdelanto === 'acelerar' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Mantenés el valor habitual de cuota y finalizás tu plan financiero meses antes.
                  </p>
                </button>
              </div>
            </div>

            {/* Inputs de Configuración del Adelanto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  2. Monto a Inyectar (USD)
                </label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={simMontoAdelanto}
                  onChange={(e) => setSimMontoAdelanto(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-base text-white font-mono font-bold outline-none"
                />
                {/* Botones rápidos de importe */}
                <div className="flex gap-1.5 mt-2">
                  {[1000, 2500, 5000, 10000].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSimMontoAdelanto(m)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg font-mono transition cursor-pointer"
                    >
                      +${m.toLocaleString('es-AR')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    3. Cuota de Inyección
                  </label>
                  <span className="text-xs text-indigo-400 font-mono font-bold">
                    {formatFecha(fechaInicio, simCuotaAdelanto).fechaCorta}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={mesesTotales}
                  value={simCuotaAdelanto}
                  onChange={(e) =>
                    setSimCuotaAdelanto(
                      Math.max(1, Math.min(mesesTotales, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-base text-white font-mono font-bold outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  El aporte se computará en la cuota #{simCuotaAdelanto} del cronograma fiduciario.
                </p>
              </div>
            </div>

            {/* COMPARADOR VISUAL ANTES VS DESPUÉS */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Resultado Comparativo: Plan Actual vs. Con Adelanto
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna 1: Plan Actual */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
                    <span>Plan Actual (Sin inyección)</span>
                    <span className="text-slate-500">Cronograma base</span>
                  </div>

                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Cuota capital estimada:</span>
                      <strong className="text-white">{fmtMoneda(cuotaHabitualMesAdelanto)}/mes</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Plazo total del plan:</span>
                      <strong className="text-white">{mesesTotales} cuotas</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mes final proyectado:</span>
                      <strong className="text-slate-300">{fechaFin.fechaCorta}</strong>
                    </div>
                  </div>
                </div>

                {/* Columna 2: Con Adelanto (Resaltado en Verde/Índigo) */}
                <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border-2 border-indigo-500/50 rounded-2xl p-4 space-y-3 shadow-lg shadow-indigo-500/10">
                  <div className="text-xs font-extrabold text-indigo-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      Con tu Inyección de {fmtMoneda(simMontoAdelanto)}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Impacto Directo
                    </span>
                  </div>

                  <div className="space-y-2 pt-1 font-mono text-xs">
                    {simEstrategiaAdelanto === 'reducir_cuota' ? (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">Nueva cuota de capital:</span>
                          <strong className="text-emerald-400 font-bold text-sm">
                            {fmtMoneda(cuotaNuevaMesAdelanto)}/mes
                          </strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">Alivio mensual exacto:</span>
                          <strong className="text-emerald-300 font-bold">
                            -{fmtMoneda(alivioMensualCapital)} cada mes
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Plazo de posesión:</span>
                          <strong className="text-white">Mismo plazo (Cuota {mPos})</strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">Meses ahorrados:</span>
                          <strong className="text-emerald-400 font-bold text-sm">
                            -{mesesAhorrados} meses antes
                          </strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-slate-300">Nueva cuota de finalización:</span>
                          <strong className="text-emerald-300 font-bold">
                            Cuota #{flujoSimuladoAdelanto.mesesTotales} de {mesesTotales}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Nueva fecha estimada:</span>
                          <strong className="text-white">
                            {formatFecha(fechaInicio, flujoSimuladoAdelanto.mesesTotales).fechaCorta}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Acción de Solicitud Directa a la Administración */}
            <div className="bg-slate-950/80 border border-indigo-500/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validación Fiduciaria Directa</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Podés solicitar a la Administración la aprobación formal y los datos para transferir tu aporte.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSolicitarAdelanto}
                disabled={enviandoSolicitudAdelanto}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{enviandoSolicitudAdelanto ? 'Enviando...' : 'Solicitar Aplicación Formal'}</span>
              </button>
            </div>

            {/* Acordeón opcional de Cronograma Detallado */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarCronogramaAdelanto((prev) => !prev)}
                className="w-full bg-slate-950/90 hover:bg-slate-900/90 p-4 text-left flex items-center justify-between text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Ver detalle cuota a cuota post-adelanto ({flujoSimuladoAdelanto.flujo.filter((m) => m.mes >= simCuotaAdelanto).length} cuotas)
                </span>
                {mostrarCronogramaAdelanto ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {mostrarCronogramaAdelanto && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5">Cuota</th>
                        <th className="py-2 px-2.5">Período</th>
                        <th className="py-2 px-2.5 text-right">Capital Proyectado</th>
                        <th className="py-2 px-2.5 text-right">Adelanto</th>
                        <th className="py-2 px-2.5 text-right text-emerald-400">Total Mes</th>
                        <th className="py-2 px-2.5 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {flujoSimuladoAdelanto.flujo
                        .filter((m) => m.mes >= simCuotaAdelanto)
                        .map((m) => (
                          <tr
                            key={m.mes}
                            className={`hover:bg-slate-800/30 ${
                              m.mes === simCuotaAdelanto ? 'bg-indigo-950/40 font-bold' : ''
                            }`}
                          >
                            <td className="py-2 px-2.5 text-white">#{m.mes}</td>
                            <td className="py-2 px-2.5 text-slate-400">
                              {formatFecha(fechaInicio, m.mes).fechaCorta}
                            </td>
                            <td className="py-2 px-2.5 text-right text-indigo-300">
                              {fmtMoneda(m.capital)}
                            </td>
                            <td className="py-2 px-2.5 text-right text-amber-300">
                              {m.adelanto > 0 ? `+${fmtMoneda(m.adelanto)}` : '-'}
                            </td>
                            <td className="py-2 px-2.5 text-right text-emerald-400 font-bold">
                              {fmtMoneda(m.abonadoMes)}
                            </td>
                            <td className="py-2 px-2.5 text-right text-slate-400">
                              {fmtMoneda(m.saldoRemanente)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── 5. PESTAÑA 3: SIMULADOR DE CESIÓN (MINIMALISTA + LIQUIDACIÓN) ────── */}
      {activeTab === 'cesion' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">

            {/* Cabecera de Cesión */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Simulador de Cesión & Recupero de Capital</h3>
                  <p className="text-xs text-slate-400">
                    Calculá tu liquidación neta y la transferencia de tus cuotas restantes (Arts. 1614 y 1636 CCCN)
                  </p>
                </div>
              </div>
              <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-medium px-3 py-1 rounded-xl">
                Socio D{socioId} • Depto {socioId}
              </span>
            </div>

            {/* Controles de Configuración de la Cesión */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    ¿En qué cuota cederías?
                  </label>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {fechaCesion.fechaCorta}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={mesesTotales}
                  value={simCuotaSalida}
                  onChange={(e) =>
                    setSimCuotaSalida(
                      Math.max(1, Math.min(mesesTotales, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Plusvalía / Prima acordada (%)
                  </label>
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    +{fmtMoneda(liquidacionCesion.montoPrima)}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simPrimaCesion}
                  onChange={(e) => setSimPrimaCesion(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mecanismo de Salida
                </label>
                <select
                  value={simMecanismoCesion}
                  onChange={(e) => setSimMecanismoCesion(e.target.value as MecanismoSalida)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-medium cursor-pointer"
                >
                  <option value="tercero">Cesión a Tercero Comprador</option>
                  <option value="preferencia">Preferencia de Consorcistas del Fondo</option>
                  <option value="diferido">Renuncia Diferida al Cierre</option>
                </select>
              </div>
            </div>

            {/* TARJETA HERO: NETO A PERCIBIR EN MANO */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-500/20 pb-4">
                <div>
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider block">
                    Liquidación Neta para el Socio Cedente
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono mt-1">
                    {fmtMoneda(liquidacionCesion.netoACobrar)}
                  </div>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Importe total neto que cobrás en mano al firmar la cesión notarial tripartita.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSolicitarCesion}
                  disabled={enviandoSolicitudCesion}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{enviandoSolicitudCesion ? 'Enviando...' : 'Iniciar Trámite de Cesión'}</span>
                </button>
              </div>

              {/* Desglose de Liquidación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Capital Integrado
                  </span>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    {fmtMoneda(liquidacionCesion.capitalAportado)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {liquidacionCesion.cuotasPagas} cuotas pagadas + anticipo
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-emerald-500/30 p-3.5 rounded-xl">
                  <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider block">
                    Plusvalía ({simPrimaCesion}%)
                  </span>
                  <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    +{fmtMoneda(liquidacionCesion.montoPrima)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Revalorización sobre capital
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-rose-500/30 p-3.5 rounded-xl">
                  <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider block">
                    Arancel Fiduciario (2%)
                  </span>
                  <div className="text-base font-black text-rose-400 font-mono mt-0.5">
                    -{fmtMoneda(liquidacionCesion.gastoCesion)}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Gestión e inscripción notarial
                  </span>
                </div>
              </div>
            </div>

            {/* LIBERACIÓN TOTAL DE CUOTAS FUTURAS */}
            <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Liberación Absoluta de Obligaciones Futuras
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Quedás 100% desvinculado de abonar las <strong className="text-emerald-400">{liquidacionCesion.cuotasRestantesAdquirente} cuotas restantes</strong> ({fmtMoneda(liquidacionCesion.deudaRestanteAdquirente)}), que son asumidas por el nuevo adquirente.
                  </p>
                </div>
              </div>
            </div>

            {/* HOJA DE RUTA EN 4 PASOS SIMPLES */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Procedimiento Notarial en 4 Pasos Simples
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                    Paso 1
                  </span>
                  <strong className="text-white block">Libre Deuda</strong>
                  <p className="text-[11px] text-slate-400">
                    Emisión del certificado de cuotas al día por la Administración.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                    Paso 2
                  </span>
                  <strong className="text-white block">Postular Adquirente</strong>
                  <p className="text-[11px] text-slate-400">
                    Presentación del comprador o activación del derecho de preferencia.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md inline-block">
                    Paso 3
                  </span>
                  <strong className="text-white block">Redacción Notarial</strong>
                  <p className="text-[11px] text-slate-400">
                    Escribanía del fideicomiso confecciona el instrumento tripartito.
                  </p>
                </div>

                <div className="bg-slate-950/70 border border-emerald-500/30 p-3.5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md inline-block">
                    Paso 4
                  </span>
                  <strong className="text-emerald-300 block">Firma y Cobro</strong>
                  <p className="text-[11px] text-slate-400">
                    Cobro del importe neto ({fmtMoneda(liquidacionCesion.netoACobrar)}) y finiquito.
                  </p>
                </div>
              </div>
            </div>

            {/* Acordeón opcional de Requisitos Legales y Marco CCCN */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setMostrarMarcoLegalCesion((prev) => !prev)}
                className="w-full bg-slate-950/90 hover:bg-slate-900/90 p-4 text-left flex items-center justify-between text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  Marco Jurídico: Arts. 1614 y 1636 a 1640 del Código Civil y Comercial de la Nación
                </span>
                {mostrarMarcoLegalCesion ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {mostrarMarcoLegalCesion && (
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    • <strong>Art. 1636 (Transmisión Integral):</strong> En los contratos con prestaciones recíprocas, cualquiera de las partes puede ceder a un tercero su posición contractual si las demás partes lo consienten antes, simultáneamente o después de la cesión.
                  </p>
                  <p>
                    • <strong>Art. 1637 (Efectos):</strong> Desde la cesión o notificación fehaciente a la Fiduciaria, el cedente queda desvinculado de sus obligaciones y no responde por el incumplimiento del cesionario.
                  </p>
                  <p>
                    • <strong>Cláusula Sexta del Fideicomiso:</strong> Requiere comunicación escrita con 15 días de antelación, arancel del 2% y certificación de firmas en escribanía para la inscripción registral en el Padrón de Fideicomisarios.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── 6. PESTAÑA 4: AVANCE Y MI UNIDAD ──────────────────────────────── */}
      {activeTab === 'obra' && (
        <div className="space-y-6">
          {/* Ficha de la Unidad Inmueble */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
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
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
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
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Unidad</span>
                  <strong className="text-indigo-300 font-bold text-sm">
                    Departamento {socioId}
                  </strong>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Piso & Letra</span>
                  <strong className="text-amber-300 font-bold text-sm">
                    Piso {pisoAsignado}° "{letraUnidad}"
                  </strong>
                </div>
              </div>
            </div>

            {/* Especificaciones Técnicas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Tipología
                </span>
                <strong className="text-white text-sm block mt-1">
                  {esTresAmbientes ? '3 Ambientes' : '2 Ambientes'}
                </strong>
                <span className="text-[11px] text-slate-400">Balcón terraza con DVH</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                  Superficie Total
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
                  Avance Físico Global
                </span>
                <strong className="text-emerald-400 text-sm font-mono block mt-1">
                  {avanceObraGlobal}% Certificado
                </strong>
                <span className="text-[11px] text-slate-400">Estructura y cerramientos</span>
              </div>
            </div>
          </div>

          {/* Galería de Fotos del Avance de Obra */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-400" />
                  Registro Fotográfico de Avance de Obra
                </h4>
                <p className="text-xs text-slate-400">
                  Imágenes certificadas de las últimas etapas constructivas en ejecución
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {fotosDeLaObra.length} registros
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {fotosDeLaObra.map((foto, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition flex flex-col"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={foto.url}
                      alt={foto.etapa}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-200">
                      {foto.fecha}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <strong className="text-xs text-white block font-bold leading-tight">
                        {foto.etapa}
                      </strong>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {foto.descripcion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Módulo Técnico en Acordeón */}
          <ModuloTecnico
            datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
            fondoNombre={currentFondo.nombre}
            isReadOnly={true}
            onUpdateDatosTecnicos={() => {}}
          />
        </div>
      )}

      {/* ── 7. PESTAÑA 5: MENSAJES Y COMUNICACIONES DIRECTAS ──────────────── */}
      {activeTab === 'mensajes' && (
        <div className="space-y-4">
          <CentroMensajes
            user={user}
            fondoId={currentFondo.id}
            fondoNombre={currentFondo.nombre}
            cantidadSocios={params.cantidadDeptos}
            isEmbedded={true}
          />
        </div>
      )}

      {/* ── 8. MODAL DE PAGO FIDUCIARIO & NOTIFICACIÓN DE TRANSFERENCIA ─────── */}
      {showModalPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/70 my-auto overflow-hidden animate-fadeIn">

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Pago de Cuota & Datos Bancarios
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fideicomiso Inmobiliario {currentFondo.nombre} • Unidad D{socioId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModalPago(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* Bloque 1: Coordenadas Bancarias Fiduciarias con Copiado */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Cuenta Corriente Especial Fiduciaria
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Razón Social:</span>
                    <strong className="text-white text-xs block truncate">
                      Fideicomiso Inmob. {currentFondo.nombre}
                    </strong>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">CUIT Fiduciario:</span>
                    <strong className="text-white text-xs font-mono block">30-71649281-9</strong>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Banco / Entidad:</span>
                    <strong className="text-white text-xs block">Banco Santander Argentina</strong>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Moneda de Pago:</span>
                    <strong className="text-emerald-400 text-xs block">Dólares USD / Pesos al tipo fiduciario</strong>
                  </div>
                </div>

                {/* CBU Copiable */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">CBU Fiduciario</span>
                    <span className="text-xs sm:text-sm font-mono text-white font-bold select-all">
                      {cbuOficial}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarTexto(cbuOficial, 'cbu')}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiadoCbu ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoCbu ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Alias Copiable */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Alias CBU</span>
                    <span className="text-xs sm:text-sm font-mono text-indigo-300 font-black select-all">
                      {aliasOficial}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copiarTexto(aliasOficial, 'alias')}
                    className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiadoAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoAlias ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Bloque 2: Formulario de Notificación de Transferencia Realizada */}
              <form onSubmit={handleEnviarAvisoPago} className="space-y-3.5">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Informar Transferencia Realizada a la Administración
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Cuota a Imputar
                    </label>
                    <select
                      value={pagoCuotaSeleccionada}
                      onChange={(e) => setPagoCuotaSeleccionada(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold outline-none cursor-pointer"
                    >
                      {flujoSocio.flujo.map((c) => (
                        <option key={c.mes} value={c.mes}>
                          Cuota #{c.mes} ({formatFecha(fechaInicio, c.mes).fechaCorta}) - {fmtMoneda(c.abonadoMes)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Banco / Billetera Emisora
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Banco Galicia, Santander..."
                      value={pagoBanco}
                      onChange={(e) => setPagoBanco(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Número de Comprobante / Referencia de Transferencia <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 981240184 o TR-20261014-998"
                    value={pagoComprobante}
                    onChange={(e) => setPagoComprobante(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Observaciones adicionales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Transferencia enviada desde cuenta cotitular..."
                    value={pagoNotas}
                    onChange={(e) => setPagoNotas(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                  />
                </div>

                <div className="bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl flex items-start gap-2 text-[11px] text-slate-400">
                  <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Al confirmar, se enviará una notificación oficial con tu aviso al Centro de Mensajes de la Administración Fiduciaria para validar e imputar tu pago en la Cartola.
                  </span>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModalPago(false)}
                    className="text-slate-400 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviandoPago}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enviandoPago ? 'Enviando...' : 'Enviar Notificación a Administración'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

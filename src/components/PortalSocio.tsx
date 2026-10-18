import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile } from '../types/auth';
import type {
  FlujoSocioCalculado,
  ParametrosFondoState,
  GastosConfigState,
  EstrategiaImpactoAdelanto
} from '../types/fondo';
import type { FondoGuardado } from '../services/fondoService';
import { FOTOS_OBRA_PREDETERMINADAS, type FotoAvance } from '../services/fondoService';
import {
  fmtMoneda,
  formatFecha,
  calcularFlujoIndividual
} from '../utils/calculations';
import { exportarFichaSocioPDF } from '../utils/exportReports';
import { enviarMensaje } from '../services/mensajeService';
import { CuentaIndividual } from './CuentaIndividual';
import { PanelSimuladorPlan } from './PanelSimuladorPlan';
import { ModuloTecnico } from './ModuloTecnico';
import { CentroMensajes } from './CentroMensajes';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import {
  Building2,
  ScrollText,
  HardHat,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Home,
  DollarSign,
  Copy,
  Check,
  Download,
  CreditCard,
  X,
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
  /** Tab inicial para abrir directamente (por defecto 'simulacion') */
  initialTab?: 'simulacion' | 'obra' | 'mensajes';
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
  initialTab = 'simulacion'
}) => {
  const socioId = user.socioId || 1;
  const [activeTab, setActiveTab] = useState<'simulacion' | 'obra' | 'mensajes'>(initialTab);

  // Cuando el padre pide actualizar la pestaña activa
  useEffect(() => {
    if (initialTab) {
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


  // =========================================================
  // 5 PARÁMETROS DEL SIMULADOR DE PLAN (ORDEN DE IMPORTANCIA)
  // =========================================================
  // 1ero: Importe de la unidad
  const [simImporteUnidad, setSimImporteUnidad] = useState<number>(params.costoDepto || 72000);
  // 2do: Anticipo mes 0 integrado
  const [simAnticipo, setSimAnticipo] = useState<number>(flujoSocio.anticipoMes0 || 6500);
  // 3ero: Adelanto específico en un mes a elegir
  const [simTieneAdelanto, setSimTieneAdelanto] = useState<boolean>(true);
  const [simMontoAdelanto, setSimMontoAdelanto] = useState<number>(10000);
  const [simCuotaAdelanto, setSimCuotaAdelanto] = useState<number>(10);
  const [simEstrategiaAdelanto, setSimEstrategiaAdelanto] = useState<EstrategiaImpactoAdelanto>('reducir_cuota');
  // 4to: Entrega/adjudicación de la unidad
  const [simCuotaPosesion, setSimCuotaPosesion] = useState<number>(flujoSocio.cuotaPosesion || 15);
  // 5to: Cesión/venta de la unidad o participación
  const [simActivarCesion, setSimActivarCesion] = useState<boolean>(false);
  const [simCuotaCesion, setSimCuotaCesion] = useState<number>(24);
  const [simPorcentajePrimaCesion, setSimPorcentajePrimaCesion] = useState<number>(4);

  // Sincronizar si cambian los parámetros iniciales
  useEffect(() => {
    if (params.costoDepto) setSimImporteUnidad(params.costoDepto);
    if (flujoSocio.anticipoMes0) setSimAnticipo(flujoSocio.anticipoMes0);
    if (flujoSocio.cuotaPosesion) setSimCuotaPosesion(flujoSocio.cuotaPosesion);
  }, [params.costoDepto, flujoSocio.anticipoMes0, flujoSocio.cuotaPosesion]);

  // Recálculo reactivo y dinámico del plan de inversión
  const flujoActivo = useMemo(() => {
    const costoSeguro = simImporteUnidad > 0 ? simImporteUnidad : (params.costoDepto || 72000);
    const anticipoSeguro = Math.min(simAnticipo, costoSeguro);
    const ratioCosto = params.costoDepto > 0 ? costoSeguro / params.costoDepto : 1;
    const recargoGastos = flujoSocio.recargoGastosPorCuota * ratioCosto;
    const pagoFinalGastos = flujoSocio.pagoFinalGastos * ratioCosto;

    return calcularFlujoIndividual(
      socioId,
      costoSeguro,
      anticipoSeguro,
      params.cantidadCuotas,
      params.modalidadAnticipo,
      recargoGastos,
      {
        activo: simTieneAdelanto && simMontoAdelanto > 0,
        mes: simCuotaAdelanto,
        monto: simMontoAdelanto,
        estrategia: simEstrategiaAdelanto
      },
      simCuotaPosesion,
      pagoFinalGastos,
      currentFondo.ajustes || []
    );
  }, [
    socioId,
    simImporteUnidad,
    simAnticipo,
    params.cantidadCuotas,
    params.modalidadAnticipo,
    params.costoDepto,
    flujoSocio.recargoGastosPorCuota,
    flujoSocio.pagoFinalGastos,
    simTieneAdelanto,
    simMontoAdelanto,
    simCuotaAdelanto,
    simEstrategiaAdelanto,
    simCuotaPosesion,
    currentFondo.ajustes
  ]);

  const capitalAportadoHastaCesion = useMemo(() => {
    let sum = flujoActivo.anticipoMes0;
    for (const m of flujoActivo.flujo) {
      if (m.mes <= simCuotaCesion) {
        sum += m.abonadoMes;
      }
    }
    return sum;
  }, [flujoActivo, simCuotaCesion]);

  // ==========================================
  // CÁLCULO ESTIMADO DE CUOTA ACTUAL / PRÓXIMA
  // ==========================================
  const mesesTotales = flujoActivo.mesesTotales;
  const mPos = flujoActivo.cuotaPosesion;
  const fechaPos = formatFecha(fechaInicio, mPos);
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

  const proximaCuotaObj = flujoActivo.flujo[proximaCuotaNum - 1] || flujoActivo.flujo[0];
  const fechaProximaCuota = formatFecha(fechaInicio, proximaCuotaNum);

  // Monto acumulado y porcentaje de progreso
  const cuotasAbonadasEstimadas = Math.max(0, proximaCuotaNum - 1);
  const montoAbonadoEstimado = useMemo(() => {
    let sum = flujoActivo.anticipoMes0;
    for (let i = 0; i < cuotasAbonadasEstimadas && i < flujoActivo.flujo.length; i++) {
      sum += flujoActivo.flujo[i].abonadoMes;
    }
    return sum;
  }, [flujoActivo, cuotasAbonadasEstimadas]);

  const porcentajeCancelado = Math.min(
    100,
    Math.round((montoAbonadoEstimado / (flujoActivo.totalAbonado || 1)) * 100)
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
          contenido: `Estimada Administración Fiduciaria:\n\nNotifico la realización de transferencia bancaria:\n- Unidad: Departamento ${socioId} (Piso ${pisoAsignado} "${letraUnidad}")\n- Cuota Imputada: #${pagoCuotaSeleccionada} (${formatFecha(fechaInicio, pagoCuotaSeleccionada).fechaCorta})\n- Monto Transferido: ${fmtMoneda(montoTotalPagar)}\n- Banco Emisor: ${pagoBanco || 'No especificado'}\n- N° de Comprobante / Transacción: ${pagoComprobante.trim()}\n${pagoNotas ? `- Observaciones: ${pagoNotas.trim()}\n` : ''}\nSolicito verificación de acreditación e imputación en el Estado de Cuenta Individual Oficial.`
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
              {!user.isGuest && (
                <button
                  type="button"
                  onClick={() => setShowModalPago(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pagar / Informar Transferencia</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => exportarFichaSocioPDF(flujoActivo, params, gastos, fechaInicio, proximaCuotaNum)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                title="Descargar Simulación en PDF"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Descargar Simulación</span>
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
                  <span className="text-slate-500">de {fmtMoneda(flujoActivo.totalAbonado)}</span>
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
      <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl p-1 gap-1 max-w-2xl no-print">
        <button
          type="button"
          onClick={() => setActiveTab('simulacion')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'simulacion'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{user.isGuest ? 'Simulación de Plan' : 'Mi Estado de Cuenta'}</span>
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

        {!user.isGuest && (
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
        )}
      </div>

      {/* ── 3. PESTAÑA PRINCIPAL: SIMULACIÓN DE PLAN Y ESTADO DE CUENTA ───── */}
      {activeTab === 'simulacion' && (
        <div className="space-y-6">
          {/* Panel de Simulación con los 5 ítems en estricto orden de importancia */}
          <PanelSimuladorPlan
            importeUnidad={simImporteUnidad}
            onImporteChange={setSimImporteUnidad}
            anticipo={simAnticipo}
            onAnticipoChange={setSimAnticipo}
            tieneAdelanto={simTieneAdelanto}
            onTieneAdelantoChange={setSimTieneAdelanto}
            montoAdelanto={simMontoAdelanto}
            onMontoAdelantoChange={setSimMontoAdelanto}
            cuotaAdelanto={simCuotaAdelanto}
            onCuotaAdelantoChange={setSimCuotaAdelanto}
            estrategiaAdelanto={simEstrategiaAdelanto}
            onEstrategiaAdelantoChange={setSimEstrategiaAdelanto}
            cuotaPosesion={simCuotaPosesion}
            onCuotaPosesionChange={setSimCuotaPosesion}
            gastosAdjudicacion={flujoActivo.pagoFinalGastos}
            activarCesion={simActivarCesion}
            onActivarCesionChange={setSimActivarCesion}
            cuotaCesion={simCuotaCesion}
            onCuotaCesionChange={setSimCuotaCesion}
            porcentajePrimaCesion={simPorcentajePrimaCesion}
            onPorcentajePrimaCesionChange={setSimPorcentajePrimaCesion}
            cantidadCuotasTotal={params.cantidadCuotas}
            fechaInicio={fechaInicio}
            capitalAportadoHastaCesion={capitalAportadoHastaCesion}
          />

          {/* Cuadro de Simulación de Plan de Inversión (Refleja en vivo la elección) */}
          <CuentaIndividual
            cantidadSocios={params.cantidadDeptos}
            socioSeleccionado={socioId}
            flujoSocio={flujoActivo}
            fechaInicio={fechaInicio}
            costoDepto={simImporteUnidad}
            formaPagoGastos={gastos.formaPagoGastos}
            params={params}
            gastos={gastos}
            onSelectSocio={() => {}} // Bloqueado para el socio
            onAdjudicacionChange={(_, cuota) => setSimCuotaPosesion(cuota)}
            userIsGuest={user.isGuest}
            cesionInfo={{
              activo: simActivarCesion,
              mes: simCuotaCesion,
              porcentajePrima: simPorcentajePrimaCesion,
              costoUnidad: simImporteUnidad
            }}
          />
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
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/70 my-auto overflow-hidden animate-fadeIn max-h-[90vh] flex flex-col">

            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
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
            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 overscroll-contain">

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
                    Al confirmar, se enviará una notificación oficial con tu aviso al Centro de Mensajes de la Administración Fiduciaria para validar e imputar tu pago en el Estado de Cuenta Oficial.
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

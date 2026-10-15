import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  ParametrosFondoState,
  GastosConfigState,
  CesionConfigState,
  AdelantoConfigState,
  AjusteCuota,
  FlujoSocioCalculado,
  EstadoPlanFondo
} from './types/fondo';
import type { UserProfile, UserRole } from './types/auth';
import { ADMIN_USER, TECNICO_USER, GUEST_SOCIO_USER } from './types/auth';
import { calcularGastos, calcularFlujoIndividual } from './utils/calculations';
import {
  getAllFondos,
  saveFondo,
  createFondoFromTemplate,
  duplicateFondo,
  deleteFondo,
  getStoredCurrentFondoId,
  setStoredCurrentFondoId,
  PLANTILLAS_PREDEFINIDAS
} from './services/fondoService';
import type { FondoGuardado } from './services/fondoService';
import { Navbar } from './components/Navbar';
import { FundSwitcher } from './components/FundSwitcher';
import { NewFundModal } from './components/NewFundModal';
import { LoginModal } from './components/LoginModal';
import { PortalSocio } from './components/PortalSocio';
import { AdminDashboard } from './components/AdminDashboard';
import { PortalAccesoPerfiles } from './components/PortalAccesoPerfiles';
import { ParametrosFondo } from './components/ParametrosFondo';
import { GastosAdjudicacion } from './components/GastosAdjudicacion';
import { MatrizAnticipos } from './components/MatrizAnticipos';
import { CesionContractual } from './components/CesionContractual';
import { AdelantoCapital } from './components/AdelantoCapital';
import { AjustesMayoresCostos } from './components/AjustesMayoresCostos';
import { CuentaIndividual } from './components/CuentaIndividual';
import { ResumenConsolidado } from './components/ResumenConsolidado';
import { SupabaseModal } from './components/SupabaseModal';
import { ModuloTecnico } from './components/ModuloTecnico';
import { ContratoModal } from './components/ContratoModal';
import { CentroMensajes } from './components/CentroMensajes';
import { Footer } from './components/Footer';
import { StickyKPIs } from './components/StickyKPIs';
import { CapitalFlowChart } from './components/CapitalFlowChart';
import { PossessionTimeline } from './components/PossessionTimeline';
import { ScenarioToolbar } from './components/common/ScenarioToolbar';
import { Toast } from './components/common/Toast';
import { SkeletonChart, SkeletonTimeline, SkeletonSummaryCard, SkeletonTableRow } from './components/common/SkeletonLoader';
import { useUrlState, type UrlScenarioParams } from './hooks/useUrlState';
import { exportarReporteEjecutivoPDF } from './utils/exportToPDF';
import { exportarCuadroMarchaCSV } from './utils/exportToCSV';
import { getUnreadCount } from './services/mensajeService';
import type { DatosTecnicosProyecto } from './types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from './types/tecnico';
import { HardHat, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/LandingPage';
import { trackSimuladorInicio, trackSimulacionCompartida } from './services/analyticsService';
import { ObrasAdminModal } from './components/ObrasAdminModal';

export const App: React.FC = () => {
  const {
    userProfile: authProfile,
    signIn: handleSupabaseSignIn,
    signUp: handleSupabaseSignUp,
    signOut: handleSupabaseSignOut,
    setDevUser
  } = useAuth();

  const [devUser, setDevUserOverride] = useState<UserProfile | null>(null);
  const currentUser: UserProfile | null = authProfile || devUser;
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>('admin');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  // Manejador centralizado para salir de la cuenta en cualquier perfil
  const handleSignOutAll = useCallback(async () => {
    await handleSupabaseSignOut();
    setDevUserOverride(null);
    setDevUser(null);
    setToastMessage('👋 Sesión cerrada correctamente.');
  }, [handleSupabaseSignOut, setDevUser]);

  // Detección de ruta inicial: Separación de entornos (/ vs /app o /acceso)
  const getInitialRoute = (): 'landing' | 'app' => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (
      path.includes('/app') ||
      path.includes('/acceso') ||
      hash.includes('/app') ||
      hash.includes('/acceso')
    ) {
      return 'app';
    }
    return 'landing';
  };

  const [currentRoute, setCurrentRoute] = useState<'landing' | 'app'>(getInitialRoute);

  // Navegación fluida entre la landing pública (/) y el entorno de gestión (/app)
  const navigateTo = useCallback(
    (route: 'landing' | 'app', options?: { openLoginRole?: UserRole; guestSim?: boolean }) => {
      setCurrentRoute(route);
      const targetPath = route === 'landing' ? '/' : '/app';
      try {
        if (window.location.protocol === 'file:') {
          window.location.hash = route === 'landing' ? '#/' : '#/app';
        } else {
          window.history.pushState({ route }, '', targetPath);
        }
      } catch {
        window.location.hash = route === 'landing' ? '#/' : '#/app';
      }

      if (route === 'landing') {
        if (devUser?.isGuest || devUser?.id === 'invitado') {
          setDevUserOverride(null);
          setDevUser(null);
        }
      } else if (route === 'app') {
        if (options?.guestSim) {
          setDevUserOverride(GUEST_SOCIO_USER);
          setDevUser(GUEST_SOCIO_USER);
        }
        if (options?.openLoginRole) {
          setLoginInitialRole(options.openLoginRole);
          setIsLoginOpen(true);
        }
      }
    },
    [devUser, setDevUser]
  );

  // Sincronizar navegación atrás/adelante del navegador
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);
  const [isContratoOpen, setIsContratoOpen] = useState<boolean>(false);
  const [isMensajesOpen, setIsMensajesOpen] = useState<boolean>(false);
  const [fondosList, setFondosList] = useState<FondoGuardado[]>([]);
  const [currentFondoId, setCurrentFondoId] = useState<string>('');
  const [socioSeleccionado, setSocioSeleccionado] = useState<number>(1);
  const [isPersistenciaOpen, setIsPersistenciaOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isObrasAdminOpen, setIsObrasAdminOpen] = useState<boolean>(false);
  const [editObraId, setEditObraId] = useState<string | undefined>(undefined);

  // Inicializar fondos al montar
  useEffect(() => {
    const initFondos = async () => {
      const list = await getAllFondos();
      setFondosList(list);
      const storedId = getStoredCurrentFondoId();
      const initial = list.find((f) => f.id === storedId) || list[0];
      if (initial) {
        setCurrentFondoId(initial.id);
        setStoredCurrentFondoId(initial.id);
      }
    };
    initFondos();
  }, []);

  // Recarga la lista de fondos (usada por ObrasAdminModal tras crear/editar/borrar)
  const recargarFondos = async () => {
    const list = await getAllFondos();
    setFondosList(list);
  };

  // Si el usuario cambia a rol 'socio', asegurar que socioSeleccionado sea su socioId
  useEffect(() => {
    if (currentUser?.role === 'socio' && currentUser.socioId) {
      setSocioSeleccionado(currentUser.socioId);
    }
  }, [currentUser]);

  // Fondo actual activo
  const currentFondo: FondoGuardado = useMemo(() => {
    return (
      fondosList.find((f) => f.id === currentFondoId) ||
      fondosList[0] || {
        id: 'default',
        updated_at: new Date().toISOString(),
        ...PLANTILLAS_PREDEFINIDAS[0]
      }
    );
  }, [fondosList, currentFondoId]);

  // Contador de mensajes no leídos
  const refreshUnreadCount = useCallback(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    setUnreadCount(getUnreadCount(currentFondo.id, currentUser));
  }, [currentFondo.id, currentUser]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Feedback visual de recálculo (microinteracción con debounce)
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setIsCalculating(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [
    currentFondo.params,
    currentFondo.gastos,
    currentFondo.anticipos,
    currentFondo.ajustes,
    currentFondo.adelanto,
    currentFondo.cesion,
    currentFondo.adjudicacionFijada
  ]);

  // Sincronizar actualización de campos en el fondo activo (Admin y Técnico)
  const updateCurrentFondo = (updater: (prev: FondoGuardado) => FondoGuardado) => {
    if (!currentUser || currentUser.role === 'socio') return; // Bloqueo estricto para inversores socios o no autenticados
    setFondosList((prevList) => {
      const index = prevList.findIndex((f) => f.id === currentFondo.id);
      if (index === -1) return prevList;
      const updated = updater(prevList[index]);
      const newList = [...prevList];
      newList[index] = updated;

      saveFondo(
        updated.nombre,
        updated.params,
        updated.gastos,
        updated.anticipos,
        updated.adjudicacionFijada,
        updated.cesion,
        updated.adelanto,
        updated.id,
        updated.descripcion,
        updated.datosTecnicos,
        updated.contratoPersonalizado,
        updated.ajustes,
        updated.estadoPlan
      );

      return newList;
    });
  };

  const handleContratoChange = (nuevoTexto: string) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      contratoPersonalizado: nuevoTexto,
      updated_at: new Date().toISOString()
    }));
  };

  // Handlers para cambios individuales
  const handleParamsChange = (newParams: Partial<ParametrosFondoState>) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      params: { ...prev.params, ...newParams },
      updated_at: new Date().toISOString()
    }));
  };

  const handleGastosChange = (newGastos: Partial<GastosConfigState>) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      gastos: { ...prev.gastos, ...newGastos },
      updated_at: new Date().toISOString()
    }));
  };

  const handleAnticipoChange = (index: number, monto: number) => {
    updateCurrentFondo((prev) => {
      const copy = [...prev.anticipos];
      while (copy.length <= index) copy.push(0);
      copy[index] = monto;
      return {
        ...prev,
        anticipos: copy,
        updated_at: new Date().toISOString()
      };
    });
  };

  const handleSetAllAnticipos = (monto: number) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      anticipos: new Array(prev.params.cantidadDeptos).fill(monto),
      updated_at: new Date().toISOString()
    }));
  };

  const handleAdjudicacionChange = (socioId: number, cuota: number) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      adjudicacionFijada: {
        ...prev.adjudicacionFijada,
        [socioId]: cuota
      },
      updated_at: new Date().toISOString()
    }));
  };

  const handleCesionChange = (newCesion: Partial<CesionConfigState>) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      cesion: { ...prev.cesion, ...newCesion },
      updated_at: new Date().toISOString()
    }));
  };

  const handleAdelantoChange = (newAdelanto: Partial<AdelantoConfigState>) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      adelanto: { ...prev.adelanto, ...newAdelanto },
      updated_at: new Date().toISOString()
    }));
  };

  const handleDatosTecnicosChange = (newDatos: DatosTecnicosProyecto) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      datosTecnicos: newDatos,
      updated_at: new Date().toISOString()
    }));
  };

  const handleAjustesChange = (nuevosAjustes: AjusteCuota[]) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      ajustes: nuevosAjustes,
      updated_at: new Date().toISOString()
    }));
  };

  const handleToggleEstadoPlan = (_id: string, nuevoEstado: EstadoPlanFondo) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      estadoPlan: nuevoEstado,
      updated_at: new Date().toISOString()
    }));
    setToastMessage(
      nuevoEstado === 'activo'
        ? '✅ Plan perfeccionado y marcado como ACTIVO (Condiciones cerradas para socios).'
        : '🧪 Plan configurado en modo SIMULACIÓN (Variables desbloqueadas para socios).'
    );
  };

  // Acciones de Gestión de Planes
  const handleSelectFondo = (id: string) => {
    setCurrentFondoId(id);
    setStoredCurrentFondoId(id);
    setSocioSeleccionado(1);
  };

  const handleCreateFromTemplate = async (templateIndex: number, customName: string) => {
    const nuevo = await createFondoFromTemplate(templateIndex, customName);
    setFondosList((prev) => [nuevo, ...prev]);
    setCurrentFondoId(nuevo.id);
    setStoredCurrentFondoId(nuevo.id);
    setSocioSeleccionado(1);
  };

  const handleCreateBlank = async (name: string) => {
    const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now());
    const tpl = PLANTILLAS_PREDEFINIDAS[0];
    const res = await saveFondo(
      name,
      tpl.params,
      tpl.gastos,
      new Array(tpl.params.cantidadDeptos).fill(0),
      {},
      tpl.cesion,
      tpl.adelanto,
      id,
      '',
      DATOS_TECNICOS_DEFAULT
    );
    const all = await getAllFondos();
    setFondosList(all);
    setCurrentFondoId(res.id);
    setStoredCurrentFondoId(res.id);
    setSocioSeleccionado(1);
  };

  const handleDuplicate = async (id: string) => {
    const duplicado = await duplicateFondo(id);
    if (duplicado) {
      setFondosList((prev) => [duplicado, ...prev]);
      setCurrentFondoId(duplicado.id);
      setStoredCurrentFondoId(duplicado.id);
      setSocioSeleccionado(1);
    }
  };

  const handleRename = (_id: string, newName: string) => {
    updateCurrentFondo((prev) => ({
      ...prev,
      nombre: newName,
      updated_at: new Date().toISOString()
    }));
  };

  const handleDelete = async (id: string) => {
    if (fondosList.length <= 1) return;
    await deleteFondo(id);
    const remaining = fondosList.filter((f) => f.id !== id);
    setFondosList(remaining);
    setCurrentFondoId(remaining[0].id);
    setStoredCurrentFondoId(remaining[0].id);
    setSocioSeleccionado(1);
  };

  const handleResetCurrent = () => {
    updateCurrentFondo((prev) => ({
      ...prev,
      ...PLANTILLAS_PREDEFINIDAS[0],
      nombre: prev.nombre,
      id: prev.id,
      updated_at: new Date().toISOString()
    }));
  };

  // Asegurar que anticipos tenga el tamaño correcto si cambia cantidadDeptos
  const anticiposNormalizados = useMemo(() => {
    const arr = [...(currentFondo.anticipos || [])];
    while (arr.length < currentFondo.params.cantidadDeptos) arr.push(0);
    return arr.slice(0, currentFondo.params.cantidadDeptos);
  }, [currentFondo.anticipos, currentFondo.params.cantidadDeptos]);

  // Cálculos de gastos
  const gastosCalculados = useMemo(() => {
    return calcularGastos(
      currentFondo.params.costoDepto,
      currentFondo.gastos,
      currentFondo.params.cantidadCuotas
    );
  }, [currentFondo.params.costoDepto, currentFondo.gastos, currentFondo.params.cantidadCuotas]);

  // Cálculo de flujos de todos los socios
  const flujosSocios = useMemo((): FlujoSocioCalculado[] => {
    const list: FlujoSocioCalculado[] = [];
    const cicloPorDefecto =
      currentFondo.params.cantidadDeptos > 0
        ? Math.round(currentFondo.params.cantidadCuotas / currentFondo.params.cantidadDeptos)
        : 10;

    for (let i = 1; i <= currentFondo.params.cantidadDeptos; i++) {
      const ant = anticiposNormalizados[i - 1] || 0;
      const mPosesion =
        currentFondo.adjudicacionFijada[i] !== undefined
          ? currentFondo.adjudicacionFijada[i]
          : Math.max(1, Math.min(Math.round(i * cicloPorDefecto), currentFondo.params.cantidadCuotas));

      const configAdelantoSocio = {
        activo: currentFondo.adelanto.activo && i === currentFondo.adelanto.socioAdelanta,
        mes: currentFondo.adelanto.cuota,
        monto: currentFondo.adelanto.monto,
        estrategia: currentFondo.adelanto.estrategia
      };

      const flujoCalculado = calcularFlujoIndividual(
        i,
        currentFondo.params.costoDepto,
        ant,
        currentFondo.params.cantidadCuotas,
        currentFondo.params.modalidadAnticipo,
        gastosCalculados.recargoGastosPorCuota,
        configAdelantoSocio,
        mPosesion,
        gastosCalculados.pagoFinalGastos,
        currentFondo.ajustes || []
      );

      list.push(flujoCalculado);
    }
    return list;
  }, [
    currentFondo.params,
    currentFondo.adjudicacionFijada,
    currentFondo.adelanto,
    currentFondo.ajustes,
    anticiposNormalizados,
    gastosCalculados
  ]);

  const activeSocioIndex = (currentUser?.role === 'socio' && currentUser.socioId ? currentUser.socioId : socioSeleccionado) - 1;
  const socioActual = flujosSocios[activeSocioIndex] || flujosSocios[0];

  // Métricas reactivas para el Sticky KPI Dashboard
  const kpiCuotaPura = socioActual?.cuotaInmInicial || currentFondo.params.valorCuotaBase;
  const kpiCuotaPostPosesion = useMemo(() => {
    if (!socioActual || !socioActual.flujo) return 0;
    const post = socioActual.flujo.find((m) => m.mes > socioActual.cuotaPosesion);
    return post ? post.abonadoMes : (socioActual.cuotaFinInicial || 0);
  }, [socioActual]);
  const kpiCostoTotalPlan = socioActual?.totalAbonado || (currentFondo.params.costoDepto + gastosCalculados.gastosTotales);
  const kpiPorcentajeIntegrado = useMemo(() => {
    if (!socioActual || socioActual.totalAbonado <= 0) return 0;
    return (socioActual.anticipoMes0 / socioActual.totalAbonado) * 100;
  }, [socioActual]);

  // Notificación Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sincronización del estado vía URL (Fase 4: Shareable Links)
  const handleApplyInitialUrlParams = useCallback((urlParams: UrlScenarioParams) => {
    if (urlParams.socioId) {
      setSocioSeleccionado(urlParams.socioId);
    }
    if (urlParams.fondoId) {
      setCurrentFondoId(urlParams.fondoId);
    }
    if (urlParams.role) {
      if (urlParams.role === 'tecnico') {
        setDevUserOverride(TECNICO_USER);
        setDevUser(TECNICO_USER);
      } else if (urlParams.role === 'admin') {
        setDevUserOverride(ADMIN_USER);
        setDevUser(ADMIN_USER);
      }
    }
    updateCurrentFondo((prev) => ({
      ...prev,
      params: {
        ...prev.params,
        ...(urlParams.costoDepto ? { costoDepto: urlParams.costoDepto } : {}),
        ...(urlParams.cantidadCuotas ? { cantidadCuotas: urlParams.cantidadCuotas } : {}),
        ...(urlParams.cantidadDeptos ? { cantidadDeptos: urlParams.cantidadDeptos } : {}),
        ...(urlParams.fechaInicio ? { fechaInicio: urlParams.fechaInicio } : {}),
        ...(urlParams.modalidadAnticipo ? { modalidadAnticipo: urlParams.modalidadAnticipo } : {})
      }
    }));
  }, []);

  const { getShareableUrl } = useUrlState(
    currentFondo.params,
    socioSeleccionado,
    currentFondo.id,
    handleApplyInitialUrlParams
  );

  const handleShareScenario = async () => {
    const url = await getShareableUrl();
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
    // Track: simulación compartida con parámetros de valor
    trackSimulacionCompartida(
      currentFondo.params.costoDepto,
      socioActual?.cuotaInmInicial ?? 0,
      currentFondo.nombre
    );
    setToastMessage(`✅ Link corto generado (${url}). Copiado al portapapeles.`);
  };

  const handleExportPDF = async () => {
    if (!socioActual) return;
    await exportarReporteEjecutivoPDF(
      socioActual,
      currentFondo.params,
      currentFondo.gastos,
      currentFondo.params.fechaInicio,
      currentFondo.nombre
    );
    setToastMessage('📄 Reporte Ejecutivo en PDF generado y descargado.');
  };

  const handleExportCSV = () => {
    if (!socioActual) return;
    exportarCuadroMarchaCSV(
      socioActual,
      currentFondo.params,
      currentFondo.gastos,
      currentFondo.params.fechaInicio,
      currentFondo.nombre
    );
    setToastMessage('📊 Cuadro de marcha exportado en formato Excel / CSV.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ------------------------------------------------------------------ */}
        {/* ENTORNO 1: LANDING COMERCIAL AISLADA EN LA RUTA RAÍZ (/)           */}
        {/* ------------------------------------------------------------------ */}
        {currentRoute === 'landing' ? (
          <LandingPage
            proyectos={fondosList}
            proyectoActivoId={currentFondoId}
            user={currentUser}
            onOpenLogin={() => {
              setLoginInitialRole('socio');
              setIsLoginOpen(true);
            }}
            onEditObra={(obraId) => {
              if (currentUser?.role === 'admin') {
                const targetId = obraId || currentFondoId;
                setEditObraId(targetId);
                setIsObrasAdminOpen(true);
              } else {
                setLoginInitialRole('admin');
                setIsLoginOpen(true);
                setToastMessage('🔒 Solo el Administrador puede editar la obra. Iniciá sesión con tu cuenta de Administrador.');
              }
            }}
            onAdoptarProyecto={(p) => {
              handleSelectFondo(p.id);
              navigateTo('app', { guestSim: true });
              setToastMessage(`🏗️ Proyecto ${p.nombre} cargado en el simulador.`);
            }}
            onStartSimulation={(proyecto) => {
              if (proyecto) {
                handleSelectFondo(proyecto.id);
              }
              navigateTo('app', { guestSim: true });
              setToastMessage('📊 Bienvenido al Simulador de Inversión');
            }}
            onOpenContrato={() => setIsContratoOpen(true)}
            onPrint={() => window.print()}
            onReset={handleResetCurrent}
            onOpenObrasAdmin={
              currentUser?.role === 'admin'
                ? () => {
                    setEditObraId(undefined);
                    setIsObrasAdminOpen(true);
                  }
                : undefined
            }
            onSignOut={currentUser ? handleSignOutAll : undefined}
          />
        ) : (
          /* ------------------------------------------------------------------ */
          /* ENTORNO 2: SISTEMA PRIVADO Y GESTIÓN EN LA RUTA (/app o /acceso)   */
          /* ------------------------------------------------------------------ */
          <>
            {/* Barra de Navegación del Sistema de Gestión */}
            <Navbar
              user={currentUser}
              unreadCount={unreadCount}
              onReset={handleResetCurrent}
              onPrint={() => window.print()}
              onOpenPersistencia={() => setIsPersistenciaOpen(true)}
              onOpenLogin={() => setIsLoginOpen(true)}
              onOpenContrato={() => setIsContratoOpen(true)}
              onOpenMensajes={() => setIsMensajesOpen(true)}
              onSignOut={handleSignOutAll}
              onSimularPlan={() => {
                trackSimuladorInicio({ label: 'navbar-app' });
                setDevUserOverride(GUEST_SOCIO_USER);
                setDevUser(GUEST_SOCIO_USER);
                setToastMessage('⚡ Simulador Activo');
              }}
              onNavigateLanding={() => navigateTo('landing')}
              onOpenObrasAdmin={
                currentUser?.role === 'admin' || currentUser?.role === 'tecnico'
                  ? () => {
                      setEditObraId(currentFondoId);
                      setIsObrasAdminOpen(true);
                    }
                  : undefined
              }
            />

            {/* Banner cuando se navega en modo simulador invitado */}
            {currentUser && (currentUser.isGuest || currentUser.id === 'invitado') && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl no-print mb-4">
                <span className="text-xs text-slate-300">
                  Estás en el <strong className="text-emerald-400">Simulador de Inversión</strong> (Modo Abierto).
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('landing')}
                  className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  ← Volver a la Portada Comercial
                </button>
              </div>
            )}

            {!currentUser ? (
              /* SELECTOR DE PERFILES PRIVADO EN /app o /acceso */
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => navigateTo('landing')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
                >
                  ← Volver a la Portada Comercial
                </button>
                <PortalAccesoPerfiles
                  currentFondoNombre={currentFondo.nombre}
                  cantidadSocios={currentFondo.params.cantidadDeptos}
                  onSimularLibre={() => {
                    setDevUserOverride(GUEST_SOCIO_USER);
                    setDevUser(GUEST_SOCIO_USER);
                    setToastMessage('🧪 Acceso libre al Simulador Inmobiliario');
                  }}
                  onSelectSocio={(socioId) => {
                    const socioUser: UserProfile = {
                      id: `socio-${socioId}`,
                      role: 'socio',
                      socioId: socioId,
                      nombre: `Socio Unidad ${socioId}`,
                      email: `socio${socioId}@fondoinmobil.com`
                    };
                    setDevUserOverride(socioUser);
                    setDevUser(socioUser);
                    setSocioSeleccionado(socioId);
                    setToastMessage(`👋 Bienvenido al Portal del Socio (Unidad D${socioId})`);
                  }}
                  onSelectTecnico={() => {
                    setDevUserOverride(TECNICO_USER);
                    setDevUser(TECNICO_USER);
                    setToastMessage('👷 Bienvenido al Módulo Técnico y de Obras');
                  }}
                  onSelectAdmin={() => {
                    setLoginInitialRole('admin');
                    setIsLoginOpen(true);
                  }}
                  onOpenLoginModal={(role) => {
                    setLoginInitialRole(role || 'socio');
                    setIsLoginOpen(true);
                  }}
                  onOpenContrato={() => setIsContratoOpen(true)}
                />
              </div>
            ) : currentUser.role === 'admin' ? (
          /* CASO 2: USUARIO LOGUEADO Y ES ADMIN -> ADMIN DASHBOARD */
          <AdminDashboard
            currentUser={currentUser}
            currentFondo={currentFondo}
            fondosList={fondosList}
            onSelectFondo={handleSelectFondo}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onShowToast={(msg) => setToastMessage(msg)}
            onSignOut={handleSignOutAll}
            unreadCount={unreadCount}
            childrenSimulador={
              <>
                {/* Selector y Gestor de Múltiples Fondos / Planes */}
                <FundSwitcher
                  currentFondo={currentFondo}
                  fondosList={fondosList}
                  onSelectFondo={handleSelectFondo}
                  onOpenNewModal={() => setIsNewModalOpen(true)}
                  onDuplicate={handleDuplicate}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  onToggleEstadoPlan={handleToggleEstadoPlan}
                />

                {/* Barra de Herramientas del Escenario (Compartir Link, PDF, CSV, Imprimir) */}
                <ScenarioToolbar
                  onShare={handleShareScenario}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onPrint={() => window.print()}
                />

                {/* Fila 1: Parámetros del Fondo y Gastos de Adjudicación */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 no-print">
                  <div className="lg:col-span-2">
                    <ParametrosFondo
                      params={currentFondo.params}
                      onChange={handleParamsChange}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <GastosAdjudicacion
                      costoDepto={currentFondo.params.costoDepto}
                      cantidadDeptos={currentFondo.params.cantidadDeptos}
                      cantidadCuotas={currentFondo.params.cantidadCuotas}
                      gastos={currentFondo.gastos}
                      onChange={handleGastosChange}
                    />
                  </div>
                </div>

                {/* Matriz Anticipos */}
                <MatrizAnticipos
                  cantidadSocios={currentFondo.params.cantidadDeptos}
                  anticipos={anticiposNormalizados}
                  onChangeAnticipo={handleAnticipoChange}
                  onSetAll={handleSetAllAnticipos}
                />

                {/* Cesión de Posición Contractual */}
                <CesionContractual
                  cantidadSocios={currentFondo.params.cantidadDeptos}
                  cesion={currentFondo.cesion}
                  flujosSocios={flujosSocios}
                  fechaInicio={currentFondo.params.fechaInicio}
                  pagoFinalGastos={gastosCalculados.pagoFinalGastos}
                  onChange={handleCesionChange}
                />

                {/* Adelanto de Capital / Licitación */}
                <AdelantoCapital
                  cantidadSocios={currentFondo.params.cantidadDeptos}
                  adelanto={currentFondo.adelanto}
                  fechaInicio={currentFondo.params.fechaInicio}
                  maxCuotas={currentFondo.params.cantidadCuotas}
                  onChange={handleAdelantoChange}
                />

                {/* Ajuste por Mayores Costos e Inflación Técnica */}
                <AjustesMayoresCostos
                  ajustes={currentFondo.ajustes || []}
                  cantidadCuotas={currentFondo.params.cantidadCuotas}
                  fechaInicio={currentFondo.params.fechaInicio}
                  costoDepto={currentFondo.params.costoDepto}
                  onChangeAjustes={handleAjustesChange}
                />

                {/* 2. Sticky KPI Dashboard (Siempre visible en el scroll) */}
                <StickyKPIs
                  cuotaPura={kpiCuotaPura}
                  cuotaPostPosesion={kpiCuotaPostPosesion}
                  costoTotalPlan={kpiCostoTotalPlan}
                  porcentajeIntegrado={kpiPorcentajeIntegrado}
                  mesPosesion={socioActual?.cuotaPosesion}
                  socioLabel={`Socio D${socioSeleccionado}`}
                  isCalculating={isCalculating}
                  onScrollToChart={() => {
                    document.getElementById('grafico-flujo-capital')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  onScrollToTable={() => {
                    document.getElementById('seccionCuentaIndividual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />

                {/* 3. Gráfico de Flujo de Capital */}
                {isCalculating ? (
                  <SkeletonChart />
                ) : socioActual ? (
                  <CapitalFlowChart
                    flujoSocio={socioActual}
                    fechaInicio={currentFondo.params.fechaInicio}
                    isCalculating={false}
                    costoDepto={currentFondo.params.costoDepto}
                  />
                ) : null}

                {/* 4. Línea de Tiempo de Posesiones y Adjudicación */}
                {isCalculating ? (
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
                    <SkeletonTimeline />
                  </div>
                ) : (
                  <PossessionTimeline
                    flujosSocios={flujosSocios}
                    fechaInicio={currentFondo.params.fechaInicio}
                    socioSeleccionado={socioSeleccionado}
                    onSelectSocio={(id) => setSocioSeleccionado(id)}
                  />
                )}

                {/* 5. Tablas Detalladas */}
                <div className="space-y-6">
                  {/* Estado de Cuenta Individual (Vista Admin) */}
                  {isCalculating ? (
                    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
                      <div className="p-5 border-b border-slate-700/80">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 w-48 bg-slate-700/60 rounded-lg" />
                          <div className="h-3 w-72 bg-slate-700/40 rounded-lg" />
                        </div>
                      </div>
                      <table className="w-full">
                        <tbody>
                          {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonTableRow key={i} cols={6} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : socioActual ? (
                    <CuentaIndividual
                      cantidadSocios={currentFondo.params.cantidadDeptos}
                      socioSeleccionado={socioSeleccionado}
                      flujoSocio={socioActual}
                      fechaInicio={currentFondo.params.fechaInicio}
                      costoDepto={currentFondo.params.costoDepto}
                      formaPagoGastos={currentFondo.gastos.formaPagoGastos}
                      params={currentFondo.params}
                      gastos={currentFondo.gastos}
                      onSelectSocio={(id) => setSocioSeleccionado(id)}
                      onAdjudicacionChange={handleAdjudicacionChange}
                    />
                  ) : null}

                  {/* Resumen Consolidado */}
                  {isCalculating ? (
                    <SkeletonSummaryCard />
                  ) : (
                    <ResumenConsolidado
                      flujosSocios={flujosSocios}
                      fechaInicio={currentFondo.params.fechaInicio}
                      params={currentFondo.params}
                      gastos={currentFondo.gastos}
                      adjudicacionFijada={currentFondo.adjudicacionFijada}
                      cesionActiva={currentFondo.cesion.activo}
                      socioCedente={currentFondo.cesion.socioCedente}
                      cuotaSalidaCesion={currentFondo.cesion.cuotaSalida}
                      adelantoActivo={currentFondo.adelanto.activo}
                      socioAdelanta={currentFondo.adelanto.socioAdelanta}
                      cuotaAdelanto={currentFondo.adelanto.cuota}
                      onSelectSocio={(id) => setSocioSeleccionado(id)}
                    />
                  )}
                </div>
              </>
            }
            childrenTecnico={
              <ModuloTecnico
                datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
                fondoNombre={currentFondo.nombre}
                fondoId={currentFondo.id}
                currentUser={currentUser}
                isReadOnly={false}
                onUpdateDatosTecnicos={handleDatosTecnicosChange}
              />
            }
            childrenMensajeria={
              <div className="space-y-4">
                <CentroMensajes
                  user={currentUser}
                  fondoId={currentFondo.id}
                  fondoNombre={currentFondo.nombre}
                  cantidadSocios={currentFondo.params.cantidadDeptos}
                  isEmbedded={true}
                  initialContactRole="socio"
                  initialSocioId={socioSeleccionado}
                  onRefreshBadges={refreshUnreadCount}
                />
              </div>
            }
          />
        ) : currentUser.role === 'socio' ? (
          /* CASO 3: USUARIO LOGUEADO Y ES SOCIO -> PORTAL DEL SOCIO */
          <div className="space-y-6 animate-fade-in">
            <PortalSocio
              user={currentUser}
              currentFondo={currentFondo}
              flujoSocio={socioActual}
              fechaInicio={currentFondo.params.fechaInicio}
              params={currentFondo.params}
              gastos={currentFondo.gastos}
              onOpenContrato={() => setIsContratoOpen(true)}
              onSignOut={handleSignOutAll}
            />
          </div>
        ) : (
          /* Rol Técnico: Herramientas Técnicas Completas (Trámites, Cronograma, Planos, Memoria y Mensajes) */
          <div className="space-y-6 animate-fade-in">
            {/* Cabecera y Selector de Obra / Proyecto */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    {currentFondo.estadoPlan === 'simulacion'
                      ? 'Obra en Estructuración Técnica y Proyecto Ejecutivo'
                      : 'Proyecto Fiduciario Perfeccionado y Activo'}
                  </span>
                  <strong className="text-sm sm:text-base text-white">{currentFondo.nombre}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {fondosList.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Cambiar Obra:</span>
                    <select
                      value={currentFondo.id}
                      onChange={(e) => handleSelectFondo(e.target.value)}
                      className="bg-slate-950 border border-slate-700 hover:border-amber-500/50 text-xs text-white rounded-xl px-3 py-2 outline-none font-bold cursor-pointer"
                    >
                      {fondosList.map((f) => (
                        <option key={f.id} value={f.id}>
                          🏗️ {f.nombre} {f.estadoPlan === 'simulacion' ? '(Estructuración)' : '(Activo)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignOutAll}
                  className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/40 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  title="Cerrar sesión de Equipo Técnico"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Salir de la cuenta</span>
                </button>
              </div>
            </div>

            {/* Módulo Técnico Integral con todas las herramientas */}
            <ModuloTecnico
              datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
              fondoNombre={currentFondo.nombre}
              fondoId={currentFondo.id}
              currentUser={currentUser}
              isReadOnly={false}
              onUpdateDatosTecnicos={handleDatosTecnicosChange}
              onSignOut={handleSignOutAll}
            />
          </div>
        )}
      </>
    )}

        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          cantidadSocios={currentFondo.params.cantidadDeptos}
          currentFondoNombre={currentFondo.nombre}
          initialRole={loginInitialRole}
          onLogin={(user) => {
            setDevUserOverride(user);
            setDevUser(user);
          }}
          onSupabaseSignIn={handleSupabaseSignIn}
          onSupabaseSignUp={handleSupabaseSignUp}
        />

        {/* Modal de Creación de Nuevo Plan */}
        <NewFundModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onCreateFromTemplate={handleCreateFromTemplate}
          onCreateBlank={handleCreateBlank}
        />

        {/* Modal de Persistencia y Supabase */}
        <SupabaseModal
          isOpen={isPersistenciaOpen}
          onClose={() => setIsPersistenciaOpen(false)}
          params={currentFondo.params}
          gastos={currentFondo.gastos}
          anticipos={anticiposNormalizados}
          adjudicacionFijada={currentFondo.adjudicacionFijada}
          cesion={currentFondo.cesion}
          adelanto={currentFondo.adelanto}
          onLoadFondo={(f) => {
            handleSelectFondo(f.id);
          }}
        />

        {/* Modal de Contrato Tripartito Oficial */}
        <ContratoModal
          isOpen={isContratoOpen}
          onClose={() => setIsContratoOpen(false)}
          user={currentUser || ADMIN_USER}
          fondoNombre={currentFondo.nombre}
          params={currentFondo.params}
          gastos={currentFondo.gastos}
          anticipos={anticiposNormalizados}
          datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
          contratoPersonalizado={currentFondo.contratoPersonalizado}
          onSaveContrato={handleContratoChange}
        />

        {/* Modal del Centro de Mensajes Fiduciarios */}
        <CentroMensajes
          isOpen={isMensajesOpen}
          onClose={() => {
            setIsMensajesOpen(false);
            refreshUnreadCount();
          }}
          onRefreshBadges={refreshUnreadCount}
          user={currentUser || ADMIN_USER}
          fondoId={currentFondo.id}
          fondoNombre={currentFondo.nombre}
          cantidadSocios={currentFondo.params.cantidadDeptos}
          initialContactRole={currentUser?.role === 'tecnico' ? 'tecnico' : 'socio'}
          initialSocioId={socioSeleccionado}
        />

        {/* Footer Institucional y Disclaimer Legal Argentino */}
        <Footer
          onOpenContrato={() => setIsContratoOpen(true)}
          onOpenPersistencia={() => setIsPersistenciaOpen(true)}
          onOpenAccesoPrivado={() => navigateTo('app', { openLoginRole: 'admin' })}
        />

        {/* Notificación Toast para Copiar Link y Feedback de Exportación */}
        <Toast
          message={toastMessage || ''}
          isVisible={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />
      </div>

      {/* ── MODAL ADMIN: GESTIÓN DE OBRAS ACTIVAS (solo admin) ── */}
      <ObrasAdminModal
        isOpen={isObrasAdminOpen}
        isAdmin={currentUser?.role === 'admin'}
        activeFondoId={currentFondoId}
        onSelectActiveFondo={(id) => {
          handleSelectFondo(id);
          const target = fondosList.find((f) => f.id === id);
          setToastMessage(`⭐ "${target?.nombre || 'Obra'}" ha sido establecida como la Obra Activa principal.`);
        }}
        onSimularFondo={(proyecto) => {
          handleSelectFondo(proyecto.id);
          setIsObrasAdminOpen(false);
          setEditObraId(undefined);
          navigateTo('app');
          setToastMessage(`🔬 Modo Simulación: ${proyecto.nombre} cargado en el simulador.`);
        }}
        onClose={() => {
          setIsObrasAdminOpen(false);
          setEditObraId(undefined);
        }}
        proyectos={fondosList}
        onProyectosChange={recargarFondos}
        initialEditId={editObraId}
      />

    </div>
  );
};

export default App;

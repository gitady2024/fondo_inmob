import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  ParametrosFondoState,
  GastosConfigState,
  CesionConfigState,
  AdelantoConfigState,
  AjusteCuota,
  FlujoSocioCalculado
} from './types/fondo';
import type { UserProfile } from './types/auth';
import { ADMIN_USER, TECNICO_USER } from './types/auth';
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
import { SocioPortal } from './components/SocioPortal';
import { AdminDashboard } from './components/AdminDashboard';
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
import { HeroSection } from './components/HeroSection';
import { Footer } from './components/Footer';
import { StickyKPIs } from './components/StickyKPIs';
import { CapitalFlowChart } from './components/CapitalFlowChart';
import { PossessionTimeline } from './components/PossessionTimeline';
import { ScenarioToolbar } from './components/common/ScenarioToolbar';
import { Toast } from './components/common/Toast';
import { useUrlState, type UrlScenarioParams } from './hooks/useUrlState';
import { exportarReporteEjecutivoPDF } from './utils/exportToPDF';
import { exportarCuadroMarchaCSV } from './utils/exportToCSV';
import { getUnreadCount } from './services/mensajeService';
import type { DatosTecnicosProyecto } from './types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from './types/tecnico';
import { Shield, User, Sparkles, HardHat } from 'lucide-react';
import { useAuth } from './hooks/useAuth';

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
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isContratoOpen, setIsContratoOpen] = useState<boolean>(false);
  const [isMensajesOpen, setIsMensajesOpen] = useState<boolean>(false);
  const [fondosList, setFondosList] = useState<FondoGuardado[]>([]);
  const [currentFondoId, setCurrentFondoId] = useState<string>('');
  const [socioSeleccionado, setSocioSeleccionado] = useState<number>(1);
  const [isPersistenciaOpen, setIsPersistenciaOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

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
        updated.ajustes
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

  const handleShareScenario = () => {
    const url = getShareableUrl();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setToastMessage('✅ Link copiado al portapapeles. Listo para compartir por WhatsApp o email.');
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
        
        {/* Barra de Navegación Principal */}
        <Navbar
          user={currentUser}
          unreadCount={unreadCount}
          onReset={handleResetCurrent}
          onPrint={() => window.print()}
          onOpenPersistencia={() => setIsPersistenciaOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenContrato={() => setIsContratoOpen(true)}
          onOpenMensajes={() => setIsMensajesOpen(true)}
          onSignOut={async () => {
            await handleSupabaseSignOut();
            setDevUserOverride(null);
            setDevUser(null);
          }}
        />

        {/* ------------------------------------------------------------------ */}
        {/* ESQUEMA CONDICIONAL: LANDING vs ADMIN DASHBOARD vs PORTAL SOCIO    */}
        {/* ------------------------------------------------------------------ */}
        {!currentUser ? (
          /* CASO 1: USUARIO NO LOGUEADO -> LANDING ACTUAL */
          <div className="space-y-8 animate-fade-in">
            <HeroSection
              nombreFondoActivo={currentFondo.nombre}
              onStartSimulation={() => setIsLoginOpen(true)}
              onOpenContrato={() => setIsContratoOpen(true)}
            />

            {/* Tarjeta de bienvenida y acceso para visitante */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SaaS Fiduciario • Supabase Auth & RLS Activo</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Plataforma de Ahorro Previo Mutuo
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Inicia sesión con tu cuenta de Supabase o accede al entorno de demostración para gestionar tu fondo o consultar tu departamento como socio inversor.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3.5 pt-2">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>Iniciar Sesión / Registrarse</span>
                </button>
                <button
                  onClick={() => {
                    setDevUserOverride(ADMIN_USER);
                    setDevUser(ADMIN_USER);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Explorar como Admin (Demo)</span>
                </button>
                <button
                  onClick={() => {
                    setDevUserOverride(TECNICO_USER);
                    setDevUser(TECNICO_USER);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 hover:border-amber-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>Equipo Técnico (Demo)</span>
                </button>
                <button
                  onClick={() => {
                    const socioDemo: UserProfile = {
                      id: 'socio-1',
                      role: 'socio',
                      socioId: 1,
                      nombre: 'Socio Demo Unidad 1',
                      email: 'socio1@fondoinmobil.com'
                    };
                    setDevUserOverride(socioDemo);
                    setDevUser(socioDemo);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Ver como Socio (Demo)</span>
                </button>
              </div>
            </div>
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

                {/* 3. Gráfico de Flujo de Capital (Visualización Inmediata) */}
                {socioActual && (
                  <CapitalFlowChart
                    flujoSocio={socioActual}
                    fechaInicio={currentFondo.params.fechaInicio}
                    isCalculating={isCalculating}
                    costoDepto={currentFondo.params.costoDepto}
                  />
                )}

                {/* 4. Línea de Tiempo de Posesiones y Adjudicación */}
                <PossessionTimeline
                  flujosSocios={flujosSocios}
                  fechaInicio={currentFondo.params.fechaInicio}
                  socioSeleccionado={socioSeleccionado}
                  onSelectSocio={(id) => setSocioSeleccionado(id)}
                />

                {/* 5. Tablas Detalladas (Con transición suave durante recálculo) */}
                <div className={`space-y-6 transition-all duration-300 ${isCalculating ? 'opacity-60 blur-[0.5px]' : 'opacity-100'}`}>
                  {/* Estado de Cuenta Individual (Vista Admin) */}
                  {socioActual && (
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
                  )}

                  {/* Resumen Consolidado */}
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
          /* CASO 3: USUARIO LOGUEADO Y ES SOCIO -> PORTAL DEL SOCIO (FINTECH READ-ONLY) */
          <div className="space-y-6 animate-fade-in">
            <SocioPortal
              user={currentUser}
              currentFondo={currentFondo}
              flujoSocio={socioActual}
              fechaInicio={currentFondo.params.fechaInicio}
              params={currentFondo.params}
              gastos={currentFondo.gastos}
              onOpenContrato={() => setIsContratoOpen(true)}
            />
          </div>
        ) : (
          /* Rol Técnico */
          <div className="space-y-6 animate-fade-in">
            <FundSwitcher
              currentFondo={currentFondo}
              fondosList={fondosList}
              onSelectFondo={handleSelectFondo}
              onOpenNewModal={() => setIsNewModalOpen(true)}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
              onDelete={handleDelete}
            />

            <ModuloTecnico
              datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
              fondoNombre={currentFondo.nombre}
              fondoId={currentFondo.id}
              currentUser={currentUser}
              isReadOnly={false}
              onUpdateDatosTecnicos={handleDatosTecnicosChange}
            />
          </div>
        )}

        {/* Modal de Login / Cambio de Perfil */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          cantidadSocios={currentFondo.params.cantidadDeptos}
          currentFondoNombre={currentFondo.nombre}
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
        />

        {/* Notificación Toast para Copiar Link y Feedback de Exportación */}
        <Toast
          message={toastMessage || ''}
          isVisible={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />
      </div>
    </div>
  );
};

export default App;

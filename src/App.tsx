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
import { ADMIN_USER } from './types/auth';
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
import { getUnreadCount } from './services/mensajeService';
import type { DatosTecnicosProyecto } from './types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from './types/tecnico';
import { Calculator, HardHat, MessageSquare } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(ADMIN_USER);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isContratoOpen, setIsContratoOpen] = useState<boolean>(false);
  const [isMensajesOpen, setIsMensajesOpen] = useState<boolean>(false);
  const [fondosList, setFondosList] = useState<FondoGuardado[]>([]);
  const [currentFondoId, setCurrentFondoId] = useState<string>('');
  const [socioSeleccionado, setSocioSeleccionado] = useState<number>(1);
  const [isPersistenciaOpen, setIsPersistenciaOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<'financiero' | 'tecnico' | 'mensajeria'>('financiero');
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
    if (currentUser.role === 'socio' && currentUser.socioId) {
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
    setUnreadCount(getUnreadCount(currentFondo.id, currentUser));
  }, [currentFondo.id, currentUser]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Sincronizar actualización de campos en el fondo activo (Admin y Técnico)
  const updateCurrentFondo = (updater: (prev: FondoGuardado) => FondoGuardado) => {
    if (currentUser.role === 'socio') return; // Bloqueo estricto para inversores socios
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

  const activeSocioIndex = (currentUser.role === 'socio' && currentUser.socioId ? currentUser.socioId : socioSeleccionado) - 1;
  const socioActual = flujosSocios[activeSocioIndex] || flujosSocios[0];

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
        />

        {/* ------------------------------------------------------------------ */}
        {/* VISTA 1: PORTAL DEL SOCIO (ACCESO RESTRINGIDO A SU UNIDAD)          */}
        {/* ------------------------------------------------------------------ */}
        {currentUser.role === 'socio' ? (
          <PortalSocio
            user={currentUser}
            currentFondo={currentFondo}
            flujoSocio={socioActual}
            fechaInicio={currentFondo.params.fechaInicio}
            params={currentFondo.params}
            gastos={currentFondo.gastos}
            onOpenContrato={() => setIsContratoOpen(true)}
          />
        ) : currentUser.role === 'tecnico' ? (
          /* ------------------------------------------------------------------ */
          /* VISTA 2: PANEL DEL EQUIPO TÉCNICO (TRÁMITES, PLANOS, OBRA)        */
          /* ------------------------------------------------------------------ */
          <div className="space-y-6">
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
        ) : (
          /* ------------------------------------------------------------------ */
          /* VISTA 3: PANEL DEL ADMINISTRADOR FIDUCIARIO (CONTROL COMPLETO)     */
          /* ------------------------------------------------------------------ */
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

            {/* Barra de alternancia de módulo para el Administrador */}
            <div className="flex flex-wrap sm:flex-nowrap bg-slate-900 border border-slate-800 p-1.5 rounded-2xl max-w-2xl gap-2 shadow-lg no-print">
              <button
                onClick={() => setAdminTab('financiero')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  adminTab === 'financiero'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Gestión Financiera</span>
              </button>
              <button
                onClick={() => setAdminTab('tecnico')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  adminTab === 'tecnico'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Gestión Técnica</span>
              </button>
              <button
                onClick={() => setAdminTab('mensajeria')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  adminTab === 'mensajeria'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mensajería Fiduciaria</span>
                {unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {adminTab === 'tecnico' ? (
              <ModuloTecnico
                datosTecnicos={currentFondo.datosTecnicos || DATOS_TECNICOS_DEFAULT}
                fondoNombre={currentFondo.nombre}
                fondoId={currentFondo.id}
                currentUser={currentUser}
                isReadOnly={false}
                onUpdateDatosTecnicos={handleDatosTecnicosChange}
              />
            ) : adminTab === 'mensajeria' ? (
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
            ) : (
              <>
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
              </>
            )}
          </>
        )}

        {/* Modal de Login / Cambio de Perfil */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          cantidadSocios={currentFondo.params.cantidadDeptos}
          currentFondoNombre={currentFondo.nombre}
          onLogin={(user) => setCurrentUser(user)}
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
          user={currentUser}
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
          user={currentUser}
          fondoId={currentFondo.id}
          fondoNombre={currentFondo.nombre}
          cantidadSocios={currentFondo.params.cantidadDeptos}
          initialContactRole={adminTab === 'tecnico' ? 'tecnico' : 'socio'}
          initialSocioId={socioSeleccionado}
        />
      </div>
    </div>
  );
};

export default App;

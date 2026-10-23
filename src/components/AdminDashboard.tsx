import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { UserProfile } from '../types/auth';
import { saveFondo, type FondoGuardado } from '../services/fondoService';
import {
  fetchFondoParticipacionesYCuotas,
  togglePagoCuotaEnSupabase,
  crearYGuardarFondoEnSupabase,
  type AdminCuotaRow,
  type AdminFondoHealth
} from '../services/adminService';
import { formatMonedaARS } from './SocioPortal';
import { GestionNegocioProyecto } from './GestionNegocioProyecto';
import type { DatosNegocioProyecto } from '../types/fondo';
import {
  Shield,
  Building2,
  Wallet,
  AlertTriangle,
  Key,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Check,
  RefreshCw,
  CloudUpload,
  Plus,
  Calculator,
  HardHat,
  MessageSquare,
  LogOut,
  Pencil,
  Sparkles,
  Rocket,
  TrendingUp
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  currentFondo: FondoGuardado;
  fondosList: FondoGuardado[];
  onSelectFondo: (fondoId: string) => void;
  onOpenNewModal: () => void;
  onSaveCurrentFondo?: () => void;
  onFondoCreated?: (nuevoFondo: FondoGuardado) => void;
  onUpdateDatosNegocio?: (datos: DatosNegocioProyecto) => void;
  onShowToast: (msg: string) => void;
  onSignOut?: () => void;
  onEditCurrentObra?: () => void;
  onTransformarEnObraActiva?: () => void;
  childrenSimulador?: React.ReactNode;
  childrenTecnico?: React.ReactNode;
  childrenMensajeria?: React.ReactNode;
  unreadCount?: number;
  /** Módulo inicial al montar (para ir directo al simulador sin cambiar sesión) */
  initialModule?: 'cobranzas' | 'simulador' | 'tecnico' | 'mensajeria' | 'negocio';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  currentFondo,
  fondosList,
  onSelectFondo,
  onOpenNewModal,
  onFondoCreated,
  onUpdateDatosNegocio,
  onShowToast,
  onSignOut,
  onEditCurrentObra,
  onTransformarEnObraActiva,
  childrenSimulador,
  childrenTecnico,
  childrenMensajeria,
  unreadCount = 0,
  initialModule = 'cobranzas'
}) => {
  const [activeModule, setActiveModule] = useState<'cobranzas' | 'simulador' | 'tecnico' | 'mensajeria' | 'negocio'>(initialModule);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'mes_actual' | 'morosos' | 'pagados'>('mes_actual');
  const [busquedaSocio, setBusquedaSocio] = useState<string>('');
  const [isLoadingCuotas, setIsLoadingCuotas] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [updatingCuotaId, setUpdatingCuotaId] = useState<string | null>(null);

  // Cuando el padre pide ir al simulador (ej. botón "Simular Plan"), actualizar el módulo activo
  useEffect(() => {
    if (initialModule && initialModule !== 'cobranzas') {
      setActiveModule(initialModule);
    }
  }, [initialModule]);


  const [cuotasList, setCuotasList] = useState<AdminCuotaRow[]>([]);
  const [healthData, setHealthData] = useState<AdminFondoHealth>({
    capitalRecaudado: 0,
    capitalPendiente: 0,
    tasaMorosidadPorcentaje: 0,
    montoMorosidad: 0,
    cantidadMorosos: 0,
    proximasPosesiones: []
  });

  // 1. Cargar datos del fondo seleccionado desde Supabase
  const loadFondoData = useCallback(async () => {
    setIsLoadingCuotas(true);
    try {
      const res = await fetchFondoParticipacionesYCuotas(currentFondo.id, currentFondo.params.fechaInicio);
      setCuotasList(res.cuotas);
      setHealthData(res.health);
    } catch (err) {
      console.warn('Error al cargar datos del fondo en AdminDashboard:', err);
    } finally {
      setIsLoadingCuotas(false);
    }
  }, [currentFondo.id, currentFondo.params.fechaInicio]);

  useEffect(() => {
    loadFondoData();
  }, [loadFondoData]);

  // 2. Acción Rápida: Mutation optimista para marcar cuota como Pagado / Pendiente
  const handleTogglePago = async (cuota: AdminCuotaRow) => {
    const nuevoEstado = !cuota.pagado;
    setUpdatingCuotaId(cuota.id);

    // Optimistic UI Update inmediato
    const prevCuotas = [...cuotasList];
    const updatedCuotas: AdminCuotaRow[] = cuotasList.map((c) => {
      if (c.id === cuota.id) {
        return {
          ...c,
          pagado: nuevoEstado,
          estado_calculado: (nuevoEstado ? 'pagado' : 'pendiente') as 'pagado' | 'pendiente',
          fecha_pago: nuevoEstado ? new Date().toISOString() : null
        };
      }
      return c;
    });

    setCuotasList(updatedCuotas);

    // Recalcular métricas de salud localmente para feedback en tiempo real
    let capitalRecaudado = 0;
    let montoMorosidad = 0;
    const morososSet = new Set<string>();

    updatedCuotas.forEach((c) => {
      if (c.pagado) {
        capitalRecaudado += c.monto;
      } else if (c.estado_calculado === 'vencido') {
        montoMorosidad += c.monto;
        morososSet.add(c.socio_nombre);
      }
    });

    setHealthData((prev) => ({
      ...prev,
      capitalRecaudado,
      montoMorosidad,
      cantidadMorosos: morososSet.size
    }));

    // Persistir mutación en Supabase
    const res = await togglePagoCuotaEnSupabase(cuota.id, nuevoEstado);
    setUpdatingCuotaId(null);

    if (res.success) {
      onShowToast(
        nuevoEstado
          ? `✅ Cuota #${cuota.nro_mes} de ${cuota.socio_nombre} marcada como cobrada.`
          : `↩️ Cuota #${cuota.nro_mes} de ${cuota.socio_nombre} marcada como pendiente.`
      );
    } else {
      // Revertir estado si falló
      setCuotasList(prevCuotas);
      onShowToast(`❌ Error al actualizar en Supabase: ${res.error}`);
    }
  };

  // 3. Guardar y Crear Nueva Obra en Marcha activa (Local + Supabase)
  const handleCrearYGuardarFondoReal = async () => {
    setIsPublishing(true);
    try {
      // 1. Guardar y registrar como Obra en Marcha Activa (estadoPlan: 'activo')
      await saveFondo(
        currentFondo.nombre,
        currentFondo.params,
        currentFondo.gastos,
        currentFondo.anticipos,
        currentFondo.adjudicacionFijada,
        currentFondo.cesion,
        currentFondo.adelanto,
        currentFondo.id,
        currentFondo.descripcion,
        currentFondo.datosTecnicos,
        currentFondo.contratoPersonalizado,
        currentFondo.ajustes,
        'activo', // Asegurar que sea una Obra en Marcha Activa
        currentFondo.fotos
      );

      // 2. Crear las cuotas y estructura en Supabase (si está configurado)
      const res = await crearYGuardarFondoEnSupabase(
        currentFondo.nombre,
        currentFondo.params,
        currentFondo.gastos,
        currentFondo.anticipos,
        currentFondo.adjudicacionFijada,
        currentFondo.cesion,
        currentFondo.adelanto,
        currentFondo.ajustes || [],
        currentUser.id
      );

      // 3. Notificar al sistema para actualizar listas de fondos y obras en marcha
      if (onFondoCreated) {
        onFondoCreated({
          ...currentFondo,
          estadoPlan: 'activo',
          updated_at: new Date().toISOString()
        });
      } else if (onTransformarEnObraActiva) {
        onTransformarEnObraActiva();
      }

      if (res.success) {
        onShowToast(`🎉 ¡Nueva Obra en Marcha "${currentFondo.nombre}" guardada y activada con éxito!`);
      } else {
        onShowToast(`🎉 ¡Obra en Marcha "${currentFondo.nombre}" activada con éxito! (${res.error || 'Guardado local completado'})`);
      }

      // Recargar datos
      loadFondoData();
    } catch (err: any) {
      onShowToast(`❌ Error al guardar obra en marcha: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyTecnicoInviteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?role=tecnico&fondo=${currentFondo.id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    onShowToast('👷 Enlace de acceso al Equipo Técnico copiado. ¡Listo para compartir por WhatsApp o Email!');
  };

  // Filtrado de cuotas en la tabla interactiva
  const mesActualReferencia = 4; // Mes de ejercicio actual

  const cuotasFiltradas = useMemo(() => {
    return cuotasList.filter((c) => {
      // Filtro por texto de socio
      if (busquedaSocio) {
        const query = busquedaSocio.toLowerCase();
        const coincideSocio =
          c.socio_nombre.toLowerCase().includes(query) ||
          c.socio_unidad.toLowerCase().includes(query) ||
          c.nro_mes.toString().includes(query);
        if (!coincideSocio) return false;
      }

      // Filtro por estado
      if (filtroEstado === 'mes_actual') {
        return c.nro_mes === mesActualReferencia;
      }
      if (filtroEstado === 'morosos') {
        return c.estado_calculado === 'vencido';
      }
      if (filtroEstado === 'pagados') {
        return c.pagado;
      }
      return true; // 'todos'
    });
  }, [cuotasList, busquedaSocio, filtroEstado, mesActualReferencia]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & FUND SELECTOR                                        */}
      {/* ==================================================================== */}
      <header className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Admin Backoffice
                </h1>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SaaS Fiduciario
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Control de morosidad, cobranzas en 1-clic y administración de cuotas al costo
              </p>
            </div>
          </div>

          {/* Selector de Fondo y Botón de Publicación a Supabase */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Select Dropdown de Fondos */}
            <div className="flex-1 sm:flex-initial min-w-[220px]">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Fondo Seleccionado
              </label>
              <div className="relative">
                <select
                  value={currentFondo.id}
                  onChange={(e) => onSelectFondo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 hover:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none cursor-pointer pr-8"
                >
                  {fondosList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nombre}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Botón: Guardar y Crear nueva Obra en Marcha */}
            <div className="self-end">
              <button
                onClick={handleCrearYGuardarFondoReal}
                disabled={isPublishing}
                title="Guardar este plan y crear una nueva Obra en Marcha activa en el sistema"
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <CloudUpload className={`w-4 h-4 ${isPublishing ? 'animate-bounce' : ''}`} />
                <span>{isPublishing ? 'Guardando Obra en Marcha...' : 'Guardar y crear nueva Obra en Marcha'}</span>
              </button>
            </div>

            {/* Botón: Editar Obra Activa / Parámetros */}
            {onEditCurrentObra && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={onEditCurrentObra}
                  title="Editar todos los parámetros y ficha de esta obra"
                  className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white rounded-xl border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <Pencil className="w-4 h-4 text-amber-400" />
                  <span>Editar Obra</span>
                </button>
              </div>
            )}

            {/* Nuevo Fondo */}
            <div className="self-end">
              <button
                onClick={onOpenNewModal}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                title="Crear nuevo fondo o plantilla"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Salir de la cuenta */}
            {onSignOut && (
              <div className="self-end">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Cerrar sesión de Administrador"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Salir de la cuenta</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. DASHBOARD GENERAL (HEALTH KPIS DEL ADMINISTRADOR)                 */}
      {/* ==================================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* KPI 1: CAPITAL TOTAL RECAUDADO */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Capital Total Recaudado
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatMonedaARS(healthData.capitalRecaudado)}
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acreditado e imputado a costo de obra</span>
            </p>
          </div>
        </div>

        {/* KPI 2: TASA DE MOROSIDAD */}
        <div className={`rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm border transition-all ${
          healthData.cantidadMorosos > 0
            ? 'bg-gradient-to-br from-slate-900/90 to-rose-950/20 border-rose-500/30'
            : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Morosidad y Cuotas Vencidas
            </span>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              healthData.cantidadMorosos > 0
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-300 tracking-tight">
              {formatMonedaARS(healthData.montoMorosidad)}
            </div>
            <p className="text-xs text-rose-400 font-medium mt-1 flex items-center gap-1.5">
              <span>{healthData.cantidadMorosos} socios con cuotas en mora ({healthData.tasaMorosidadPorcentaje}% del devengado)</span>
            </p>
          </div>
        </div>

        {/* KPI 3: PRÓXIMAS POSESIONES */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Próximas Posesiones (Próx. Meses)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="space-y-1.5">
              {healthData.proximasPosesiones.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-white">{p.socio_nombre}</span>
                  <span className="text-indigo-300 font-mono">Mes #{p.mes_posesion} ({p.fecha_posesion})</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              🔔 Alerta fiduciaria de entrega técnica de llaves
            </p>
          </div>
        </div>

      </section>

      {/* ==================================================================== */}
      {/* 3. BARRA DE NAVEGACIÓN DE MÓDULOS DEL ADMINISTRADOR                  */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap sm:flex-nowrap bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-2 shadow-lg no-print">
        <button
          onClick={() => setActiveModule('cobranzas')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeModule === 'cobranzas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Gestión de Cobranzas</span>
          {healthData.cantidadMorosos > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-extrabold animate-pulse">
              {healthData.cantidadMorosos}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveModule('simulador')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeModule === 'simulador'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulador Financiero</span>
        </button>

        <button
          onClick={() => setActiveModule('negocio')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeModule === 'negocio'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Gestión del Negocio (P&L)</span>
        </button>

        <button
          onClick={() => setActiveModule('tecnico')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeModule === 'tecnico'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Gestión Técnica</span>
        </button>

        <button
          onClick={() => setActiveModule('mensajeria')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeModule === 'mensajeria'
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

      {/* ==================================================================== */}
      {/* 4. MÓDULO ACTIVO: COBRANZAS (DATA GRID INTERACTIVA)                  */}
      {/* ==================================================================== */}
      {activeModule === 'cobranzas' && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
          
          {/* Barra de Filtros Rápidos y Buscador */}
          <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Filtros Rápidos tipo Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar:</span>
              </span>

              <button
                onClick={() => setFiltroEstado('mes_actual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === 'mes_actual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Mes Actual (#{mesActualReferencia})
              </button>

              <button
                onClick={() => setFiltroEstado('morosos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filtroEstado === 'morosos'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vencidas ({healthData.cantidadMorosos})</span>
              </button>

              <button
                onClick={() => setFiltroEstado('pagados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === 'pagados'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                }`}
              >
                Abonadas ✅
              </button>

              <button
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === 'todos'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todas las Cuotas
              </button>
            </div>

            {/* Input de Búsqueda de Socio */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busquedaSocio}
                onChange={(e) => setBusquedaSocio(e.target.value)}
                placeholder="Buscar socio, depto o cuota..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

          </div>

          {/* Tabla / Data Grid Interactiva de Cobranzas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Socio / Unidad</th>
                  <th className="py-3.5 px-4">Nro. Cuota</th>
                  <th className="py-3.5 px-4">Monto a Pagar</th>
                  <th className="py-3.5 px-4">Vencimiento</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Acción Rápida (1-Clic)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 font-medium">
                {isLoadingCuotas ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                      <span>Cargando datos de cobranzas en Supabase...</span>
                    </td>
                  </tr>
                ) : cuotasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No se encontraron cuotas para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  cuotasFiltradas.map((cuota) => {
                    const isUpdatingThis = updatingCuotaId === cuota.id;

                    return (
                      <tr
                        key={cuota.id}
                        className={`transition-colors ${
                          cuota.estado_calculado === 'vencido'
                            ? 'bg-rose-950/10 hover:bg-rose-950/20'
                            : cuota.pagado
                            ? 'bg-emerald-950/5 hover:bg-emerald-950/15'
                            : 'hover:bg-slate-850/50'
                        }`}
                      >
                        {/* Socio / Unidad */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-white text-sm">
                            {cuota.socio_nombre}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {cuota.socio_unidad}
                          </span>
                        </td>

                        {/* Nro Cuota */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                          Cuota #{cuota.nro_mes}
                        </td>

                        {/* Monto */}
                        <td className="py-3.5 px-4 font-extrabold text-white text-sm">
                          {formatMonedaARS(cuota.monto)}
                        </td>

                        {/* Vencimiento */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {cuota.fecha_vencimiento}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          {cuota.pagado ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Pagado</span>
                            </span>
                          ) : cuota.estado_calculado === 'vencido' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Vencida</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </td>

                        {/* Acción Rápida (1-Clic Mutation) */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => handleTogglePago(cuota)}
                            disabled={isUpdatingThis}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm disabled:opacity-50 ${
                              cuota.pagado
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                            }`}
                          >
                            {isUpdatingThis ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : cuota.pagado ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Cobrado</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Marcar Pagado</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>
              Mostrando <strong>{cuotasFiltradas.length}</strong> de {cuotasList.length} cuotas registradas
            </span>
            <span className="text-[11px]">
              💡 Las mutaciones de cobranza se aplican instantáneamente (Optimistic UI) y se sincronizan con Supabase.
            </span>
          </div>

        </section>
      )}

      {/* ==================================================================== */}
      {/* 5. MÓDULO: SIMULADOR FINANCIERO COMPLETO (INYECCIÓN DE HIJOS)        */}
      {/* ==================================================================== */}
      {activeModule === 'simulador' && (
        <div className="space-y-6 animate-fade-in">
          {currentFondo.estadoPlan === 'simulacion' && onTransformarEnObraActiva && (
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      Modo Simulación / Estructuración
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                      Laboratorio Abierto
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    ¿Este plan está listo para lanzarse al mercado?
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Podés transformar esta simulación en una <strong>Obra Activa</strong> para fijar las condiciones del fideicomiso, habilitar la recaudación del Mes 0 y publicarla en la sección de Obras en Marcha.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onTransformarEnObraActiva}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                <span>Transformar en Obra Activa</span>
              </button>
            </div>
          )}
          {childrenSimulador}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. MÓDULO: GESTIÓN TÉCNICA                                           */}
      {/* ==================================================================== */}
      {activeModule === 'tecnico' && childrenTecnico && (
        <div className="space-y-6 animate-fade-in">
          {/* Banner de gestión y enlaces de invitación para profesionales de obra */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Portal del Equipo Técnico & Dirección de Obra</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Acceso Colaborativo
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Permite a arquitectos, agrimensores y constructores actualizar certificados de avance y expedientes sin acceso a finanzas.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyTecnicoInviteLink}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
              title="Copiar enlace directo para enviar al arquitecto o jefe de obra"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Copiar Enlace de Acceso Técnico</span>
            </button>
          </div>

          {childrenTecnico}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. MÓDULO: MENSAJERÍA FIDUCIARIA                                     */}
      {/* ==================================================================== */}
      {activeModule === 'mensajeria' && childrenMensajeria && (
        <div className="space-y-6 animate-fade-in">
          {childrenMensajeria}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MÓDULO: GESTIÓN DEL NEGOCIO TOTAL (ESTADO DE RESULTADOS & P&L)   */}
      {/* ==================================================================== */}
      {activeModule === 'negocio' && (
        <GestionNegocioProyecto
          currentFondo={currentFondo}
          cuotasList={cuotasList}
          healthData={healthData}
          onUpdateDatosNegocio={onUpdateDatosNegocio || (() => {})}
          onShowToast={onShowToast}
        />
      )}

    </div>
  );
};

export default AdminDashboard;

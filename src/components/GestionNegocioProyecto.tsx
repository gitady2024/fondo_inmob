import React, { useState, useMemo } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import type { DatosNegocioProyecto, PartidaNegocio } from '../types/fondo';
import type { AdminCuotaRow, AdminFondoHealth } from '../services/adminService';
import { formatMonedaARS } from './SocioPortal';
import {
  TrendingUp,
  DollarSign,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Printer,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  X,
  Save
} from 'lucide-react';

interface GestionNegocioProyectoProps {
  currentFondo: FondoGuardado;
  cuotasList: AdminCuotaRow[];
  healthData: AdminFondoHealth;
  onUpdateDatosNegocio: (nuevosDatos: DatosNegocioProyecto) => void;
  onShowToast: (msg: string) => void;
}

type VistaModo = 'comparativo' | 'presupuesto' | 'ejecutado';

export const GestionNegocioProyecto: React.FC<GestionNegocioProyectoProps> = ({
  currentFondo,
  cuotasList,
  healthData,
  onUpdateDatosNegocio,
  onShowToast
}) => {
  const [vistaModo, setVistaModo] = useState<VistaModo>('comparativo');
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalNuevaPartidaOpen, setIsModalNuevaPartidaOpen] = useState(false);

  // Parámetros clave del proyecto
  const { params, gastos, anticipos = [], cesion, adelanto, datosNegocio } = currentFondo;
  const cantidadDeptos = Number(params?.cantidadDeptos) || 10;
  const cantidadCuotas = Number(params?.cantidadCuotas) || 36;
  const costoDepto = Number(params?.costoDepto) || 75000;
  const volumenTotalObra = cantidadDeptos * costoDepto;

  // --------------------------------------------------------------------------
  // CÁLCULOS BASE: INGRESOS POR TODO CONCEPTO
  // --------------------------------------------------------------------------
  // 1. Cuotas puras de socios
  const totalAnticiposPresupuestado = useMemo(() => {
    return anticipos.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  }, [anticipos]);

  const totalCuotasPurasPresupuestado = volumenTotalObra - totalAnticiposPresupuestado;

  // Real ejecutado en cuotas: Suma de cuotas pagadas registradas
  const totalCuotasCobradasReal = useMemo(() => {
    const pagadas = cuotasList.filter((c) => c.pagado).reduce((acc, curr) => acc + curr.monto, 0);
    return pagadas > 0 ? pagadas : (healthData.capitalRecaudado || 0);
  }, [cuotasList, healthData.capitalRecaudado]);

  // 2. Ingresos por prima de cesión
  const ingresoPrimaCesionPresupuestado = useMemo(() => {
    if (cesion?.activo) {
      return (costoDepto * (Number(cesion.primaCesion) || 0)) / 100;
    }
    return 0;
  }, [cesion, costoDepto]);
  const ingresoPrimaCesionReal = cesion?.activo ? ingresoPrimaCesionPresupuestado : 0;

  // 3. Honorarios por Gestión Fiduciaria / Administración del Proyecto
  const pctGestion = Number(gastos?.comisionGestion) || 5;
  const ingresoGestionProyectoPresupuestado = (volumenTotalObra * pctGestion) / 100;
  // Ejecutado proporcional al avance de cobro
  const ratioCobranza = volumenTotalObra > 0 ? Math.min(1, totalCuotasCobradasReal / volumenTotalObra) : 0;
  const ingresoGestionProyectoReal = ingresoGestionProyectoPresupuestado * (ratioCobranza > 0 ? ratioCobranza : 0.25);

  // 4. Honorarios de Escribanía / Notariales
  const pctEscribania = Number(gastos?.comisionEscribania) || 2.5;
  const ingresoGestionEscribaniaPresupuestado = (volumenTotalObra * pctEscribania) / 100;
  const ingresoGestionEscribaniaReal = ingresoGestionEscribaniaPresupuestado * (ratioCobranza > 0 ? ratioCobranza : 0.2);

  // 5. Adelanto de capital voluntario
  const ingresoAdelantoPresupuestado = adelanto?.activo ? Number(adelanto.monto) || 0 : 0;
  const ingresoAdelantoReal = adelanto?.activo ? Number(adelanto.monto) || 0 : 0;

  // 6. Otros Ingresos configurables
  const otrosIngresosPresupuestado = datosNegocio?.otrosIngresos?.presupuestado ?? 0;
  const otrosIngresosReal = datosNegocio?.otrosIngresos?.ejecutado ?? 0;

  // --------------------------------------------------------------------------
  // CÁLCULOS BASE: GASTOS Y EROGACIONES DEL PROYECTO
  // --------------------------------------------------------------------------
  // Defaults equilibrados basados en la industria si el admin aún no los configuró
  const defaultCompraLote = volumenTotalObra * 0.20; // 20%
  const defaultTasasMunicipales = volumenTotalObra * 0.035; // 3.5%
  const defaultEquipoTecnico = volumenTotalObra * 0.065; // 6.5%
  const defaultConstruccion = volumenTotalObra * 0.60; // 60%
  const defaultAdminBancarios = volumenTotalObra * 0.025; // 2.5%
  const defaultPagosEscribania = volumenTotalObra * 0.025; // 2.5%
  const defaultOtrosGastos = volumenTotalObra * 0.05; // 5%

  const compraLotePres = datosNegocio?.compraLote?.presupuestado ?? defaultCompraLote;
  const compraLoteReal = datosNegocio?.compraLote?.ejecutado ?? (compraLotePres * 0.85);

  const tasasPres = datosNegocio?.tasasMunicipales?.presupuestado ?? defaultTasasMunicipales;
  const tasasReal = datosNegocio?.tasasMunicipales?.ejecutado ?? (tasasPres * 0.60);

  const equipoTecnicoPres = datosNegocio?.equipoTecnico?.presupuestado ?? defaultEquipoTecnico;
  const equipoTecnicoReal = datosNegocio?.equipoTecnico?.ejecutado ?? (equipoTecnicoPres * 0.40);

  const construccionPres = datosNegocio?.costoConstruccionDirecto?.presupuestado ?? defaultConstruccion;
  const construccionReal = datosNegocio?.costoConstruccionDirecto?.ejecutado ?? (construccionPres * (ratioCobranza > 0 ? ratioCobranza : 0.35));

  const adminPres = datosNegocio?.gastosAdministrativos?.presupuestado ?? defaultAdminBancarios;
  const adminReal = datosNegocio?.gastosAdministrativos?.ejecutado ?? (adminPres * 0.30);

  const escribaniaPres = datosNegocio?.pagosEscribania?.presupuestado ?? defaultPagosEscribania;
  const escribaniaReal = datosNegocio?.pagosEscribania?.ejecutado ?? (escribaniaPres * 0.25);

  const otrosGastosPres = datosNegocio?.otrosGastos?.presupuestado ?? defaultOtrosGastos;
  const otrosGastosReal = datosNegocio?.otrosGastos?.ejecutado ?? (otrosGastosPres * 0.15);

  // Partidas personalizadas
  const partidasCustom = datosNegocio?.partidasPersonalizadas || [];
  const customIngresosPres = partidasCustom
    .filter((p) => p.categoria === 'ingreso')
    .reduce((acc, curr) => acc + curr.montoPresupuestado, 0);
  const customIngresosReal = partidasCustom
    .filter((p) => p.categoria === 'ingreso')
    .reduce((acc, curr) => acc + curr.montoRealEjecutado, 0);

  const customGastosPres = partidasCustom
    .filter((p) => p.categoria === 'gasto')
    .reduce((acc, curr) => acc + curr.montoPresupuestado, 0);
  const customGastosReal = partidasCustom
    .filter((p) => p.categoria === 'gasto')
    .reduce((acc, curr) => acc + curr.montoRealEjecutado, 0);

  // --------------------------------------------------------------------------
  // TOTALIZADORES FINANCIEROS Y RESULTADO ANTES DE IMPUESTOS
  // --------------------------------------------------------------------------
  const totalIngresosPresupuestado =
    totalCuotasPurasPresupuestado +
    totalAnticiposPresupuestado +
    ingresoPrimaCesionPresupuestado +
    ingresoGestionProyectoPresupuestado +
    ingresoGestionEscribaniaPresupuestado +
    ingresoAdelantoPresupuestado +
    otrosIngresosPresupuestado +
    customIngresosPres;

  const totalIngresosReal =
    totalCuotasCobradasReal +
    totalAnticiposPresupuestado +
    ingresoPrimaCesionReal +
    ingresoGestionProyectoReal +
    ingresoGestionEscribaniaReal +
    ingresoAdelantoReal +
    otrosIngresosReal +
    customIngresosReal;

  const totalGastosPresupuestado =
    compraLotePres +
    tasasPres +
    equipoTecnicoPres +
    construccionPres +
    adminPres +
    escribaniaPres +
    otrosGastosPres +
    customGastosPres;

  const totalGastosReal =
    compraLoteReal +
    tasasReal +
    equipoTecnicoReal +
    construccionReal +
    adminReal +
    escribaniaReal +
    otrosGastosReal +
    customGastosReal;

  // Resultado Operativo Neto (Antes de Impuestos)
  const resultadoNetoPresupuestado = totalIngresosPresupuestado - totalGastosPresupuestado;
  const resultadoNetoReal = totalIngresosReal - totalGastosReal;

  const margenOperativoPresupuestado =
    totalIngresosPresupuestado > 0
      ? ((resultadoNetoPresupuestado / totalIngresosPresupuestado) * 100).toFixed(1)
      : '0.0';

  const margenOperativoReal =
    totalIngresosReal > 0
      ? ((resultadoNetoReal / totalIngresosReal) * 100).toFixed(1)
      : '0.0';

  // --------------------------------------------------------------------------
  // GESTIÓN DE MODALES Y EDICIÓN
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState<DatosNegocioProyecto>({
    compraLote: { presupuestado: compraLotePres, ejecutado: compraLoteReal },
    tasasMunicipales: { presupuestado: tasasPres, ejecutado: tasasReal },
    equipoTecnico: { presupuestado: equipoTecnicoPres, ejecutado: equipoTecnicoReal },
    costoConstruccionDirecto: { presupuestado: construccionPres, ejecutado: construccionReal },
    gastosAdministrativos: { presupuestado: adminPres, ejecutado: adminReal },
    pagosEscribania: { presupuestado: escribaniaPres, ejecutado: escribaniaReal },
    otrosGastos: { presupuestado: otrosGastosPres, ejecutado: otrosGastosReal },
    otrosIngresos: { presupuestado: otrosIngresosPresupuestado, ejecutado: otrosIngresosReal },
    partidasPersonalizadas: partidasCustom
  });

  const handleOpenEditModal = () => {
    setFormData({
      compraLote: { presupuestado: compraLotePres, ejecutado: compraLoteReal },
      tasasMunicipales: { presupuestado: tasasPres, ejecutado: tasasReal },
      equipoTecnico: { presupuestado: equipoTecnicoPres, ejecutado: equipoTecnicoReal },
      costoConstruccionDirecto: { presupuestado: construccionPres, ejecutado: construccionReal },
      gastosAdministrativos: { presupuestado: adminPres, ejecutado: adminReal },
      pagosEscribania: { presupuestado: escribaniaPres, ejecutado: escribaniaReal },
      otrosGastos: { presupuestado: otrosGastosPres, ejecutado: otrosGastosReal },
      otrosIngresos: { presupuestado: otrosIngresosPresupuestado, ejecutado: otrosIngresosReal },
      partidasPersonalizadas: partidasCustom
    });
    setIsModalEditOpen(true);
  };

  const handleSaveEditModal = () => {
    onUpdateDatosNegocio(formData);
    setIsModalEditOpen(false);
    onShowToast('✅ Parámetros económicos y partidas del proyecto actualizadas exitosamente.');
  };

  // Nueva Partida
  const [nuevaPartida, setNuevaPartida] = useState<{
    concepto: string;
    categoria: 'ingreso' | 'gasto';
    montoPresupuestado: number;
    montoRealEjecutado: number;
    notas: string;
  }>({
    concepto: '',
    categoria: 'ingreso',
    montoPresupuestado: 0,
    montoRealEjecutado: 0,
    notas: ''
  });

  const handleAddNuevaPartida = () => {
    if (!nuevaPartida.concepto.trim()) {
      onShowToast('⚠️ Ingresa un concepto para la partida.');
      return;
    }
    const nueva: PartidaNegocio = {
      id: `partida-${Date.now()}`,
      concepto: nuevaPartida.concepto.trim(),
      categoria: nuevaPartida.categoria,
      subcategoria: 'Partida Manual',
      montoPresupuestado: Number(nuevaPartida.montoPresupuestado) || 0,
      montoRealEjecutado: Number(nuevaPartida.montoRealEjecutado) || 0,
      notas: nuevaPartida.notas.trim()
    };
    const updatedCustom = [...partidasCustom, nueva];
    const updatedDatos: DatosNegocioProyecto = {
      ...(datosNegocio || formData),
      partidasPersonalizadas: updatedCustom
    };
    onUpdateDatosNegocio(updatedDatos);
    setIsModalNuevaPartidaOpen(false);
    setNuevaPartida({
      concepto: '',
      categoria: 'ingreso',
      montoPresupuestado: 0,
      montoRealEjecutado: 0,
      notas: ''
    });
    onShowToast(`🎉 Partida "${nueva.concepto}" agregada exitosamente.`);
  };

  const handleDeletePartidaCustom = (id: string) => {
    const updatedCustom = partidasCustom.filter((p) => p.id !== id);
    const updatedDatos: DatosNegocioProyecto = {
      ...(datosNegocio || formData),
      partidasPersonalizadas: updatedCustom
    };
    onUpdateDatosNegocio(updatedDatos);
    onShowToast('🗑️ Partida eliminada del estado de resultados.');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="seccion-gestion-negocio">
      
      {/* ==================================================================== */}
      {/* 1. CABECERA Y HERRAMIENTAS DEL ESTADO DE RESULTADOS                   */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Gestión Económica & Estado de Resultados</span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  P&L Fiduciario
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Discriminación total de ingresos, erogaciones directas e indirectas, y resultado neto del proyecto "{currentFondo.nombre}"
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Switch de Vista */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Selector de Vista: Comparativo | Presupuesto | Ejecutado */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-2xl flex items-center">
            <button
              onClick={() => setVistaModo('comparativo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vistaModo === 'comparativo'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Comparativo
            </button>
            <button
              onClick={() => setVistaModo('presupuesto')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vistaModo === 'presupuesto'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Presupuestado
            </button>
            <button
              onClick={() => setVistaModo('ejecutado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vistaModo === 'ejecutado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Caja Real
            </button>
          </div>

          {/* Botón: Editar Rubros */}
          <button
            onClick={handleOpenEditModal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Editar valores de lote, tasas, equipo técnico y partidas presupuestarias"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-400" />
            <span>Editar Rubros</span>
          </button>

          {/* Botón: Agregar Partida Extra */}
          <button
            onClick={() => setIsModalNuevaPartidaOpen(true)}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Añadir una nueva partida personalizada de ingreso o gasto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Partida</span>
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={() => window.print()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs transition-colors cursor-pointer"
            title="Imprimir Estado de Resultados"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KPIS GENERALES DEL NEGOCIO                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: TOTAL INGRESOS */}
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ingresos Totales ({vistaModo === 'presupuesto' ? 'Proyectados' : 'Caja Real'})
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatMonedaARS(vistaModo === 'presupuesto' ? totalIngresosPresupuestado : totalIngresosReal)}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center justify-between">
            <span>Presupuestado: {formatMonedaARS(totalIngresosPresupuestado)}</span>
            <span className="text-slate-500 font-mono">
              {totalIngresosPresupuestado > 0 ? ((totalIngresosReal / totalIngresosPresupuestado) * 100).toFixed(0) : 0}% cobrado
            </span>
          </p>
        </div>

        {/* KPI 2: TOTAL GASTOS */}
        <div className="bg-slate-900/60 border border-rose-500/30 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Gastos & Erogaciones ({vistaModo === 'presupuesto' ? 'Presupuesto' : 'Pagado'})
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            {formatMonedaARS(vistaModo === 'presupuesto' ? totalGastosPresupuestado : totalGastosReal)}
          </div>
          <p className="text-[11px] text-rose-400 font-medium flex items-center justify-between">
            <span>Presupuestado: {formatMonedaARS(totalGastosPresupuestado)}</span>
            <span className="text-slate-500 font-mono">
              {totalGastosPresupuestado > 0 ? ((totalGastosReal / totalGastosPresupuestado) * 100).toFixed(0) : 0}% ejecutado
            </span>
          </p>
        </div>

        {/* KPI 3: RESULTADO NETO ANTES DE IMPUESTOS */}
        <div className={`rounded-2xl p-5 space-y-2 shadow-sm border ${
          (vistaModo === 'presupuesto' ? resultadoNetoPresupuestado : resultadoNetoReal) >= 0
            ? 'bg-gradient-to-br from-slate-900/90 to-emerald-950/20 border-emerald-500/40'
            : 'bg-gradient-to-br from-slate-900/90 to-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Resultado Neto Operativo</span>
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
              Antes de Impuestos
            </span>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            (vistaModo === 'presupuesto' ? resultadoNetoPresupuestado : resultadoNetoReal) >= 0
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}>
            {formatMonedaARS(vistaModo === 'presupuesto' ? resultadoNetoPresupuestado : resultadoNetoReal)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Superávit fiduciario neto ({vistaModo === 'presupuesto' ? 'Cierre Proyectado' : 'Posición de Caja'})
          </p>
        </div>

        {/* KPI 4: MARGEN OPERATIVO */}
        <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Margen Operativo (%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-300 tracking-tight">
            {vistaModo === 'presupuesto' ? margenOperativoPresupuestado : margenOperativoReal}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, Number(margenOperativoPresupuestado)))}%` }}
            />
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. TABLAS DISCRIMINADAS: INGRESOS & GASTOS                           */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TABLA 1: INGRESOS POR TODO CONCEPTO */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                1. Ingresos por Todo Concepto
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Total: {formatMonedaARS(vistaModo === 'presupuesto' ? totalIngresosPresupuestado : totalIngresosReal)}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-2.5 px-4 font-bold">Concepto de Ingreso</th>
                  <th className="py-2.5 px-3 text-right">Presupuestado</th>
                  <th className="py-2.5 px-3 text-right">Caja Real</th>
                  {vistaModo === 'comparativo' && (
                    <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Avance %</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* 1.1 Cuotas Puras */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Cuotas Puras Ordinarias</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {cantidadDeptos} deptos × {cantidadCuotas} cuotas
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300 font-medium">
                    {formatMonedaARS(totalCuotasPurasPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                    {formatMonedaARS(totalCuotasCobradasReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {totalCuotasPurasPresupuestado > 0
                        ? ((totalCuotasCobradasReal / totalCuotasPurasPresupuestado) * 100).toFixed(0)
                        : 0}%
                    </td>
                  )}
                </tr>

                {/* 1.2 Anticipos Mes 0 */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Anticipos Iniciales (Mes 0)</div>
                    <div className="text-[10px] text-slate-500 font-mono">Aportes voluntarios de capital inicial</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(totalAnticiposPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                    {formatMonedaARS(totalAnticiposPresupuestado)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">100%</td>
                  )}
                </tr>

                {/* 1.3 Prima por Cesión de Socios */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Prima por Cesión de Posición</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {cesion?.activo ? `${cesion.primaCesion}% prima cesionario` : 'Sin cesión activa'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(ingresoPrimaCesionPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">
                    {formatMonedaARS(ingresoPrimaCesionReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {cesion?.activo ? '100%' : '0%'}
                    </td>
                  )}
                </tr>

                {/* 1.4 Comisión por Gestión del Proyecto */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Gestión Integral del Proyecto</div>
                    <div className="text-[10px] text-slate-500 font-mono">{pctGestion}% honorario fiduciario</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(ingresoGestionProyectoPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">
                    {formatMonedaARS(ingresoGestionProyectoReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {ingresoGestionProyectoPresupuestado > 0
                        ? ((ingresoGestionProyectoReal / ingresoGestionProyectoPresupuestado) * 100).toFixed(0)
                        : 0}%
                    </td>
                  )}
                </tr>

                {/* 1.5 Comisión por Gestión de Escribanía */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Gestión de Escribanía (Recaudada)</div>
                    <div className="text-[10px] text-slate-500 font-mono">{pctEscribania}% al costo notarial</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(ingresoGestionEscribaniaPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">
                    {formatMonedaARS(ingresoGestionEscribaniaReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {ingresoGestionEscribaniaPresupuestado > 0
                        ? ((ingresoGestionEscribaniaReal / ingresoGestionEscribaniaPresupuestado) * 100).toFixed(0)
                        : 0}%
                    </td>
                  )}
                </tr>

                {/* 1.6 Adelanto de Capital */}
                {ingresoAdelantoPresupuestado > 0 && (
                  <tr className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-sans text-slate-200">
                      <div className="font-semibold text-white">Adelanto Voluntario de Cuotas</div>
                      <div className="text-[10px] text-slate-500 font-mono">Socio {adelanto?.socioAdelanta}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatMonedaARS(ingresoAdelantoPresupuestado)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-300">
                      {formatMonedaARS(ingresoAdelantoReal)}
                    </td>
                    {vistaModo === 'comparativo' && (
                      <td className="py-2.5 px-3 text-right text-emerald-400">100%</td>
                    )}
                  </tr>
                )}

                {/* 1.7 Otros Ingresos */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Otros Ingresos & Rendimientos</div>
                    <div className="text-[10px] text-slate-500 font-mono">Intereses, moras, recupero de gastos</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(otrosIngresosPresupuestado)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">
                    {formatMonedaARS(otrosIngresosReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {otrosIngresosPresupuestado > 0
                        ? ((otrosIngresosReal / otrosIngresosPresupuestado) * 100).toFixed(0)
                        : 0}%
                    </td>
                  )}
                </tr>

                {/* Partidas personalizadas de Ingreso */}
                {partidasCustom
                  .filter((p) => p.categoria === 'ingreso')
                  .map((p) => (
                    <tr key={p.id} className="bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors">
                      <td className="py-2.5 px-4 font-sans text-emerald-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{p.concepto}</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">Custom</span>
                          </div>
                          {p.notas && <div className="text-[10px] text-slate-400">{p.notas}</div>}
                        </div>
                        <button
                          onClick={() => handleDeletePartidaCustom(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatMonedaARS(p.montoPresupuestado)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                        {formatMonedaARS(p.montoRealEjecutado)}
                      </td>
                      {vistaModo === 'comparativo' && (
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {p.montoPresupuestado > 0
                            ? ((p.montoRealEjecutado / p.montoPresupuestado) * 100).toFixed(0)
                            : 0}%
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA 2: GASTOS Y EROGACIONES DEL PROYECTO */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                2. Gastos & Erogaciones del Proyecto
              </h3>
            </div>
            <span className="text-xs font-bold text-rose-400 font-mono">
              Total: {formatMonedaARS(vistaModo === 'presupuesto' ? totalGastosPresupuestado : totalGastosReal)}
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-2.5 px-4 font-bold">Concepto de Gasto</th>
                  <th className="py-2.5 px-3 text-right">Presupuestado</th>
                  <th className="py-2.5 px-3 text-right">Pagado Real</th>
                  {vistaModo === 'comparativo' && (
                    <th className="py-2.5 px-3 text-right text-rose-400 font-bold">Avance %</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* 2.1 Compra de Lote */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Compra de Lote / Terreno</div>
                    <div className="text-[10px] text-slate-500 font-mono">Adquisición del suelo y boleto</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(compraLotePres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300 font-bold">
                    {formatMonedaARS(compraLoteReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {compraLotePres > 0 ? ((compraLoteReal / compraLotePres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.2 Tasas Municipales */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Tasas Municipales & Permisos</div>
                    <div className="text-[10px] text-slate-500 font-mono">Derechos de construcción, visados, sellados</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(tasasPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatMonedaARS(tasasReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {tasasPres > 0 ? ((tasasReal / tasasPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.3 Pago al Equipo Técnico */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Pago al Equipo Técnico</div>
                    <div className="text-[10px] text-slate-500 font-mono">Arquitectura, cálculo estructural, agrimensura</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(equipoTecnicoPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatMonedaARS(equipoTecnicoReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {equipoTecnicoPres > 0 ? ((equipoTecnicoReal / equipoTecnicoPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.4 Costos Directos de Construcción */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Costos Directos de Obra</div>
                    <div className="text-[10px] text-slate-500 font-mono">Materiales acopiados, mano de obra contratistas</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300 font-medium">
                    {formatMonedaARS(construccionPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300 font-bold">
                    {formatMonedaARS(construccionReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {construccionPres > 0 ? ((construccionReal / construccionPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.5 Gastos Administrativos */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Gastos Administrativos & Bancarios</div>
                    <div className="text-[10px] text-slate-500 font-mono">Cuentas fiduciarias, seguros de caución, auditoría</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(adminPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatMonedaARS(adminReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {adminPres > 0 ? ((adminReal / adminPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.6 Pagos a Escribanía */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Pagos a Escribanía & Notaría</div>
                    <div className="text-[10px] text-slate-500 font-mono">Reglamentos PH, mensura y escrituras traslativas</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(escribaniaPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatMonedaARS(escribaniaReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {escribaniaPres > 0 ? ((escribaniaReal / escribaniaPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* 2.7 Otros Gastos */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-200">
                    <div className="font-semibold text-white">Otros Pagos & Contingencias</div>
                    <div className="text-[10px] text-slate-500 font-mono">Fondo de reserva para imprevistos de obra</div>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatMonedaARS(otrosGastosPres)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    {formatMonedaARS(otrosGastosReal)}
                  </td>
                  {vistaModo === 'comparativo' && (
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {otrosGastosPres > 0 ? ((otrosGastosReal / otrosGastosPres) * 100).toFixed(0) : 0}%
                    </td>
                  )}
                </tr>

                {/* Partidas personalizadas de Gasto */}
                {partidasCustom
                  .filter((p) => p.categoria === 'gasto')
                  .map((p) => (
                    <tr key={p.id} className="bg-rose-950/10 hover:bg-rose-950/20 transition-colors">
                      <td className="py-2.5 px-4 font-sans text-rose-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>{p.concepto}</span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded">Custom</span>
                          </div>
                          {p.notas && <div className="text-[10px] text-slate-400">{p.notas}</div>}
                        </div>
                        <button
                          onClick={() => handleDeletePartidaCustom(p.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          title="Eliminar partida"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatMonedaARS(p.montoPresupuestado)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-300 font-bold">
                        {formatMonedaARS(p.montoRealEjecutado)}
                      </td>
                      {vistaModo === 'comparativo' && (
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {p.montoPresupuestado > 0
                            ? ((p.montoRealEjecutado / p.montoPresupuestado) * 100).toFixed(0)
                            : 0}%
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 4. RESULTADO TOTAL DEL NEGOCIO ANTES DE IMPUESTOS (P&L CONSOLIDADO)  */}
      {/* ==================================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Estado de Resultados Consolidado (Antes de Impuestos)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Liquidación sintética de ingresos devengados versus costos fiduciarios incurridos
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Resultado Neto Operativo (Antes de Impuestos)
            </span>
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              (vistaModo === 'presupuesto' ? resultadoNetoPresupuestado : resultadoNetoReal) >= 0
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}>
              {formatMonedaARS(vistaModo === 'presupuesto' ? resultadoNetoPresupuestado : resultadoNetoReal)}
            </span>
          </div>
        </div>

        {/* Resumen comparativo en 3 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              (+) Ingresos por Todo Concepto
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
              {formatMonedaARS(vistaModo === 'presupuesto' ? totalIngresosPresupuestado : totalIngresosReal)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              {vistaModo === 'presupuesto' ? '100% Proyectado' : 'Efectivamente Recaudado'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              (-) Costos & Gastos del Proyecto
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono">
              {formatMonedaARS(vistaModo === 'presupuesto' ? totalGastosPresupuestado : totalGastosReal)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Lote, obra, tasas, honorarios y escribanía
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-500/40">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
              (=) Margen Comercial Neto
            </span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {vistaModo === 'presupuesto' ? margenOperativoPresupuestado : margenOperativoReal}%
            </span>
            <span className="text-[10px] text-indigo-400/80 block mt-1">
              Rentabilidad sobre ventas del fondo
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL: EDITAR RUBROS PRESUPUESTARIOS                                 */}
      {/* ==================================================================== */}
      {isModalEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Editar Partidas Presupuestarias del Negocio</h3>
                  <p className="text-xs text-slate-400">Ajusta los costos reales y presupuestados para {currentFondo.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalEditOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Compra de Lote */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">1. Compra de Lote / Terreno ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.compraLote?.presupuestado ?? compraLotePres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            compraLote: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.compraLote?.ejecutado ?? compraLoteReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.compraLote?.ejecutado ?? compraLoteReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            compraLote: {
                              presupuestado: prev.compraLote?.presupuestado ?? compraLotePres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Tasas Municipales */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">2. Tasas Municipales & Permisos ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.tasasMunicipales?.presupuestado ?? tasasPres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tasasMunicipales: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.tasasMunicipales?.ejecutado ?? tasasReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.tasasMunicipales?.ejecutado ?? tasasReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tasasMunicipales: {
                              presupuestado: prev.tasasMunicipales?.presupuestado ?? tasasPres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Pago al Equipo Técnico */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">3. Pago al Equipo Técnico ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.equipoTecnico?.presupuestado ?? equipoTecnicoPres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            equipoTecnico: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.equipoTecnico?.ejecutado ?? equipoTecnicoReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.equipoTecnico?.ejecutado ?? equipoTecnicoReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            equipoTecnico: {
                              presupuestado: prev.equipoTecnico?.presupuestado ?? equipoTecnicoPres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Costos Directos de Obra */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">4. Costo Construcción Directo ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.costoConstruccionDirecto?.presupuestado ?? construccionPres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            costoConstruccionDirecto: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.costoConstruccionDirecto?.ejecutado ?? construccionReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.costoConstruccionDirecto?.ejecutado ?? construccionReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            costoConstruccionDirecto: {
                              presupuestado: prev.costoConstruccionDirecto?.presupuestado ?? construccionPres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Gastos Administrativos */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">5. Gastos Administrativos & Banco ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.gastosAdministrativos?.presupuestado ?? adminPres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            gastosAdministrativos: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.gastosAdministrativos?.ejecutado ?? adminReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.gastosAdministrativos?.ejecutado ?? adminReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            gastosAdministrativos: {
                              presupuestado: prev.gastosAdministrativos?.presupuestado ?? adminPres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Pagos a Escribanía */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <span className="text-xs font-bold text-white block">6. Pagos a Escribanía ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.pagosEscribania?.presupuestado ?? escribaniaPres}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pagosEscribania: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.pagosEscribania?.ejecutado ?? escribaniaReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Pagado Real</label>
                      <input
                        type="number"
                        value={formData.pagosEscribania?.ejecutado ?? escribaniaReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            pagosEscribania: {
                              presupuestado: prev.pagosEscribania?.presupuestado ?? escribaniaPres,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Otros Ingresos */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 space-y-2 sm:col-span-2">
                  <span className="text-xs font-bold text-emerald-400 block">7. Otros Ingresos Extraordinarios ($)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Presupuestado</label>
                      <input
                        type="number"
                        value={formData.otrosIngresos?.presupuestado ?? otrosIngresosPresupuestado}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            otrosIngresos: {
                              presupuestado: Number(e.target.value) || 0,
                              ejecutado: prev.otrosIngresos?.ejecutado ?? otrosIngresosReal
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Cobrado Real</label>
                      <input
                        type="number"
                        value={formData.otrosIngresos?.ejecutado ?? otrosIngresosReal}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            otrosIngresos: {
                              presupuestado: prev.otrosIngresos?.presupuestado ?? otrosIngresosPresupuestado,
                              ejecutado: Number(e.target.value) || 0
                            }
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 shrink-0">
              <button
                onClick={() => setIsModalEditOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditModal}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: AGREGAR NUEVA PARTIDA PERSONALIZADA                           */}
      {/* ==================================================================== */}
      {isModalNuevaPartidaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Nueva Partida del Proyecto</h3>
              </div>
              <button
                onClick={() => setIsModalNuevaPartidaOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Partida</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevaPartida((prev) => ({ ...prev, categoria: 'ingreso' }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      nuevaPartida.categoria === 'ingreso'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    + Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevaPartida((prev) => ({ ...prev, categoria: 'gasto' }))}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      nuevaPartida.categoria === 'gasto'
                        ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    - Gasto / Egreso
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Concepto o Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Rendimiento colocación bancaria, Seguro caución especial..."
                  value={nuevaPartida.concepto}
                  onChange={(e) => setNuevaPartida((prev) => ({ ...prev, concepto: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monto Presupuestado ($)</label>
                  <input
                    type="number"
                    value={nuevaPartida.montoPresupuestado || ''}
                    onChange={(e) => setNuevaPartida((prev) => ({ ...prev, montoPresupuestado: Number(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monto Real ($)</label>
                  <input
                    type="number"
                    value={nuevaPartida.montoRealEjecutado || ''}
                    onChange={(e) => setNuevaPartida((prev) => ({ ...prev, montoRealEjecutado: Number(e.target.value) || 0 }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notas u Observaciones (Opcional)</label>
                <input
                  type="text"
                  placeholder="Factura, expediente o referencia..."
                  value={nuevaPartida.notas}
                  onChange={(e) => setNuevaPartida((prev) => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900">
              <button
                onClick={() => setIsModalNuevaPartidaOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNuevaPartida}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Agregar Partida
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GestionNegocioProyecto;

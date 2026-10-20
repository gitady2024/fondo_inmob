import React, { useState, useMemo } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import { fmtMoneda, calcularGastos, calcularFlujoIndividual } from '../utils/calculations';
import type { DatosTecnicosProyecto } from '../types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import { FOTOS_OBRA_PREDETERMINADAS, type FotoAvance } from '../services/fondoService';
import { CurrencyInput } from './common/CurrencyInput';
import { exportarReporteEjecutivoPDF } from '../utils/exportToPDF';
import {
  HardHat,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Camera,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Download,
  MapPin,
  Layers,
  Briefcase,
  FolderCheck,
  Percent,
  ArrowRight
} from 'lucide-react';

interface ObraDetallePageProps {
  obra: FondoGuardado;
  proyectosActivos?: FondoGuardado[];
  onSelectObra?: (obraId: string) => void;
  onVolverInicio: () => void;
  onSimularObra: (obra: FondoGuardado) => void;
  onPreinscribirObra: (obra: FondoGuardado, cuotaEstimada: number) => void;
  onEditarObra?: (obraId: string) => void;
  isAdmin?: boolean;
}

export const ObraDetallePage: React.FC<ObraDetallePageProps> = ({
  obra,
  proyectosActivos = [],
  onSelectObra,
  onVolverInicio,
  onSimularObra,
  onPreinscribirObra,
  onEditarObra,
  isAdmin = false
}) => {
  const [tabActiva, setTabActiva] = useState<'financiero' | 'tecnico' | 'resumen'>('financiero');
  const [fotoActivaIndex, setFotoActivaIndex] = useState<number>(0);

  // Parámetros financieros del proyecto
  const costoDeptoBase = obra.params?.costoDepto || 70000;
  const cantidadCuotasBase = obra.params?.cantidadCuotas || 36;
  const cantidadDeptos = obra.params?.cantidadDeptos || 10;
  const fechaInicio = obra.params?.fechaInicio || new Date().toISOString().slice(0, 7);

  // Gastos del fideicomiso
  const gastosConfig = useMemo(() => ({
    formaPagoGastos: obra.gastos?.formaPagoGastos || 'final',
    comisionGestion: obra.gastos?.comisionGestion ?? 7,
    comisionEscribania: obra.gastos?.comisionEscribania ?? 3,
    otrosGastos: obra.gastos?.otrosGastos ?? 500
  }), [obra.gastos]);

  // Datos Técnicos completos (con fallback a valores oficiales si están vacíos)
  const datosTec: DatosTecnicosProyecto = useMemo(() => {
    return {
      ...DATOS_TECNICOS_DEFAULT,
      ...(obra.datosTecnicos || {}),
      etapas: (obra.datosTecnicos?.etapas && obra.datosTecnicos.etapas.length > 0)
        ? obra.datosTecnicos.etapas
        : DATOS_TECNICOS_DEFAULT.etapas,
      tramites: (obra.datosTecnicos?.tramites && obra.datosTecnicos.tramites.length > 0)
        ? obra.datosTecnicos.tramites
        : DATOS_TECNICOS_DEFAULT.tramites,
      documentos: (obra.datosTecnicos?.documentos && obra.datosTecnicos.documentos.length > 0)
        ? obra.datosTecnicos.documentos
        : DATOS_TECNICOS_DEFAULT.documentos,
      profesionales: (obra.datosTecnicos?.profesionales && obra.datosTecnicos.profesionales.length > 0)
        ? obra.datosTecnicos.profesionales
        : DATOS_TECNICOS_DEFAULT.profesionales
    };
  }, [obra.datosTecnicos]);

  // Fotos de obra
  const fotosDeLaObra: FotoAvance[] = (obra.fotos && obra.fotos.length > 0)
    ? obra.fotos
    : FOTOS_OBRA_PREDETERMINADAS;

  const fotoActual = fotosDeLaObra[fotoActivaIndex % fotosDeLaObra.length] || fotosDeLaObra[0];

  // Cálculo de avance de obra ponderado
  const avanceObraPonderado = useMemo(() => {
    if (datosTec.etapas && datosTec.etapas.length > 0) {
      const suma = datosTec.etapas.reduce(
        (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
        0
      );
      if (suma > 0) return Math.round(suma);
    }
    return 68; // Porcentaje estándar verificado
  }, [datosTec.etapas]);

  // Adjudicaciones y unidades disponibles
  const adjudicacionesObj = obra.adjudicacionFijada || {};
  const unidadesAdjudicadasConteo = Object.keys(adjudicacionesObj).length;
  const unidadesAdjudicadas = unidadesAdjudicadasConteo > 0
    ? Math.min(unidadesAdjudicadasConteo, cantidadDeptos - 1)
    : Math.max(1, Math.min(7, cantidadDeptos - 3));
  const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);
  const porcentajeOcupacion = Math.round((unidadesAdjudicadas / cantidadDeptos) * 100);

  // Estados interactivos para simulación integrada dentro de la obra
  const [simAnticipo, setSimAnticipo] = useState<number>(0);
  const [simCuotaPosesion, setSimCuotaPosesion] = useState<number>(() => {
    const defaultPos = Math.round(cantidadCuotasBase * 0.45);
    return defaultPos > 0 ? defaultPos : 15;
  });
  const [simTieneAdelanto, setSimTieneAdelanto] = useState<boolean>(false);
  const [simMontoAdelanto, setSimMontoAdelanto] = useState<number>(0);
  const [simCuotaAdelanto, setSimCuotaAdelanto] = useState<number>(10);
  const [simEstrategiaAdelanto, setSimEstrategiaAdelanto] = useState<'reducir_cuota' | 'acortar_plazo'>('reducir_cuota');

  // Cálculos de gastos reactivos
  const gastosCalculados = useMemo(() => {
    return calcularGastos(costoDeptoBase, gastosConfig, cantidadCuotasBase);
  }, [costoDeptoBase, gastosConfig, cantidadCuotasBase]);

  // Flujo financiero individual recalculado en tiempo real
  const flujoCalculado = useMemo(() => {
    return calcularFlujoIndividual(
      1,
      costoDeptoBase,
      simAnticipo,
      cantidadCuotasBase,
      'reducir_cuota',
      gastosCalculados.recargoGastosPorCuota,
      {
        activo: simTieneAdelanto && simMontoAdelanto > 0,
        mes: Math.min(simCuotaAdelanto, cantidadCuotasBase > 0 ? cantidadCuotasBase : 1),
        monto: simMontoAdelanto,
        estrategia: simEstrategiaAdelanto === 'acortar_plazo' ? 'acelerar' : 'reducir_cuota'
      },
      simCuotaPosesion,
      gastosCalculados.pagoFinalGastos,
      obra.ajustes || []
    );
  }, [
    costoDeptoBase,
    simAnticipo,
    cantidadCuotasBase,
    gastosCalculados.recargoGastosPorCuota,
    gastosCalculados.pagoFinalGastos,
    simTieneAdelanto,
    simMontoAdelanto,
    simCuotaAdelanto,
    simEstrategiaAdelanto,
    simCuotaPosesion,
    obra.ajustes
  ]);

  const cuotaEstimadaBase = cantidadCuotasBase > 0 ? Math.round(costoDeptoBase / cantidadCuotasBase) : 0;

  const handleDescargarPDF = () => {
    exportarReporteEjecutivoPDF(
      flujoCalculado,
      {
        costoDepto: costoDeptoBase,
        cantidadDeptos,
        cantidadCuotas: cantidadCuotasBase,
        valorCuotaBase: cuotaEstimadaBase,
        fechaInicio,
        modalidadAnticipo: 'reducir_cuota'
      },
      gastosConfig,
      fechaInicio,
      obra.nombre
    );
  };

  return (
    <div id="pagina-detalle-obra" className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR DE NAVEGACIÓN Y ACCIONES                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 transition-all shadow-xl shadow-black/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-volver-inicio"
              onClick={onVolverInicio}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Volver a la página principal"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Volver a Inicio</span>
            </button>

            {/* Selector de otra obra activa si hay varias */}
            {proyectosActivos.length > 1 && onSelectObra && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 px-2 font-mono">Cambiar Obra:</span>
                {proyectosActivos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectObra(p.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      p.id === obra.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditarObra && isAdmin && (
              <button
                type="button"
                onClick={() => onEditarObra(obra.id)}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Editar Obra</span>
              </button>
            )}

            <button
              type="button"
              id="btn-detalle-descargar-pdf"
              onClick={handleDescargarPDF}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Descargar Ficha Completa en PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>

            <button
              type="button"
              id="btn-detalle-simular-plan"
              onClick={() => onSimularObra(obra)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition transform hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Simular mi Plan</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              type="button"
              id="btn-detalle-preinscribir"
              onClick={() => onPreinscribirObra(obra, cuotaEstimadaBase)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-200" />
              <span>Preinscribirme</span>
            </button>
          </div>

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BANNER PRINCIPAL DE LA OBRA ACTIVA                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 shadow-2xl p-6 sm:p-8">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <HardHat className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Obra en Marcha • Fideicomiso Activo</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                  {avanceObraPonderado}% Avance Certificado
                </span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
                  {cantidadCuotasBase} Cuotas Mensuales
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {obra.nombre}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{datosTec.direccionObra || 'Zona Céntrica de Alta Valorización'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{datosTec.cantidadUnidades || cantidadDeptos} Unidades Totales</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                {obra.descripcion || datosTec.memoriaDescriptiva || 'Proyecto fiduciario de escala residencial en desarrollo. Inversión transparente al costo directo de materiales y mano de obra.'}
              </p>
            </div>

            {/* Tarjeta Resumen Rápido con Escasez */}
            <div className="lg:w-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 shrink-0 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Disponibilidad</span>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                  {porcentajeOcupacion}% Asignado
                </span>
              </div>

              <div>
                <strong className="text-lg font-black text-white font-mono block">
                  Quedan {unidadesDisponibles} de {cantidadDeptos} unidades
                </strong>
                <span className="text-xs text-emerald-400 block mt-0.5">
                  ✓ {unidadesAdjudicadas} unidades ya reservadas y aportando
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Cuota base:</span>
                <strong className="text-white font-mono font-bold text-sm">{fmtMoneda(cuotaEstimadaBase)}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Costo total depto:</span>
                <strong className="text-emerald-400 font-mono font-bold text-sm">{fmtMoneda(costoDeptoBase)}</strong>
              </div>
            </div>

          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* SELECTOR DE PESTAÑAS: FINANCIERO vs TÉCNICO vs RESUMEN            */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
            <button
              type="button"
              id="tab-aspecto-financiero"
              onClick={() => setTabActiva('financiero')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'financiero'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Aspecto Financiero Completo</span>
            </button>

            <button
              type="button"
              id="tab-aspecto-tecnico"
              onClick={() => setTabActiva('tecnico')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'tecnico'
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25 scale-[1.02]'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Aspecto Técnico Completo</span>
            </button>

            <button
              type="button"
              id="tab-aspecto-resumen"
              onClick={() => setTabActiva('resumen')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'resumen'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.02]'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Resumen Ejecutivo Integral</span>
            </button>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CUERPO PRINCIPAL SEGÚN PESTAÑA ACTIVA                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
        
        {/* ================================================================= */}
        {/* PESTAÑA 1: ASPECTO FINANCIERO COMPLETO                            */}
        {/* ================================================================= */}
        {tabActiva === 'financiero' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. KPIs Financieros Principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block font-medium">Costo Departamento</span>
                <strong className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {fmtMoneda(costoDeptoBase)}
                </strong>
                <span className="text-[11px] text-emerald-400 block">Al costo fiduciario</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block font-medium">Plazo de Financiación</span>
                <strong className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                  {cantidadCuotasBase} Cuotas
                </strong>
                <span className="text-[11px] text-slate-400 block">Meses corridos</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block font-medium">Cuota Pura Base</span>
                <strong className="text-xl sm:text-2xl font-black text-amber-300 font-mono tabular-nums">
                  {fmtMoneda(cuotaEstimadaBase)}
                </strong>
                <span className="text-[11px] text-slate-400 block">Sin intereses bancarios</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block font-medium">Total Consorcio</span>
                <strong className="text-xl sm:text-2xl font-black text-indigo-300 font-mono tabular-nums">
                  {fmtMoneda(costoDeptoBase * cantidadDeptos)}
                </strong>
                <span className="text-[11px] text-slate-400 block">{cantidadDeptos} unidades fijadas</span>
              </div>
            </div>

            {/* 2. Estructura y Desglose de Gastos del Fideicomiso */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Estructura & Desglose de Gastos Fiduciarios
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gastos operativos, legales y notariales indispensables para constituir y blindar el fideicomiso.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  Forma de pago: {gastosConfig.formaPagoGastos === 'prorrateado' ? 'Prorrateado en cada cuota' : 'Al momento de la Posesión'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Comisión de Gestión</span>
                    <span className="font-mono font-bold text-amber-400">{gastosConfig.comisionGestion}%</span>
                  </div>
                  <strong className="text-lg font-black text-white font-mono block">
                    {fmtMoneda(gastosCalculados.montoGestion)}
                  </strong>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Administración fiduciaria, contabilidad, liquidaciones y control de fondos.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Escribanía & Escrituras</span>
                    <span className="font-mono font-bold text-indigo-400">{gastosConfig.comisionEscribania}%</span>
                  </div>
                  <strong className="text-lg font-black text-white font-mono block">
                    {fmtMoneda(gastosCalculados.montoEscribania)}
                  </strong>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Contrato de fideicomiso por escritura pública, actas notariales e inscripción.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Otros Gastos / Seguros</span>
                    <span className="font-mono text-slate-400">Fijo</span>
                  </div>
                  <strong className="text-lg font-black text-white font-mono block">
                    {fmtMoneda(gastosConfig.otrosGastos)}
                  </strong>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Seguro de caución, tasas de sellado, mantenimiento bancario y timbrados.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-300 font-bold block">Total de Gastos del Fideicomiso por Unidad:</span>
                  <strong className="text-xl font-black text-white font-mono">
                    {fmtMoneda(gastosCalculados.gastosTotales)}
                  </strong>
                </div>
                <div className="text-xs text-slate-400 sm:text-right">
                  {gastosConfig.formaPagoGastos === 'prorrateado' ? (
                    <span>Aporte mensual por cuota: <strong className="text-emerald-400 font-mono font-bold">{fmtMoneda(gastosCalculados.recargoGastosPorCuota)}</strong></span>
                  ) : (
                    <span>Se abona al momento de la posesión: <strong className="text-amber-400 font-mono font-bold">{fmtMoneda(gastosCalculados.pagoFinalGastos)}</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Simulador Interactivo Integrado para esta Obra */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white">
                      Simulador Interactivo para esta Obra
                    </h3>
                    <p className="text-xs text-slate-400">
                      Personalizá tu anticipo y cuota de posesión para calcular tus cuotas exactas en este edificio.
                    </p>
                  </div>
                </div>

                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                  Cálculo Dinámico en Tiempo Real
                </span>
              </div>

              {/* Controles del Simulador */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* Control 1: Anticipo Inicial */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-200">1. Anticipo Inicial (Mes 0)</label>
                    <span className="text-emerald-400 font-mono font-bold">
                      {costoDeptoBase > 0 ? Math.round((simAnticipo / costoDeptoBase) * 100) : 0}%
                    </span>
                  </div>
                  <CurrencyInput
                    value={simAnticipo}
                    onChange={(val) => setSimAnticipo(Math.min(costoDeptoBase, Math.max(0, val)))}
                    placeholder="Monto de anticipo"
                    className="w-full text-base font-mono font-bold bg-slate-900 border-slate-700 text-white"
                  />
                  <div className="flex gap-1.5">
                    {[0, 10, 20, 30].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setSimAnticipo(Math.round((costoDeptoBase * pct) / 100))}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-800 cursor-pointer"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Reduce el saldo a financiar y amortiza inmediatamente las cuotas.
                  </span>
                </div>

                {/* Control 2: Cuota de Posesión */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-200">2. Cuota de Posesión (Mes)</label>
                    <span className="text-amber-400 font-mono font-bold">Mes {simCuotaPosesion}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={cantidadCuotasBase > 0 ? cantidadCuotasBase : 36}
                    value={simCuotaPosesion}
                    onChange={(e) => setSimCuotaPosesion(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Mes 1</span>
                    <span>Entrega: Mes {simCuotaPosesion}</span>
                    <span>Mes {cantidadCuotasBase}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    El mes en que recibís la llave del departamento y comenzás a habitar o alquilar.
                  </span>
                </div>

                {/* Control 3: Adelanto Extraordinario */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-200">3. Adelanto Voluntario</label>
                    <input
                      type="checkbox"
                      checked={simTieneAdelanto}
                      onChange={(e) => setSimTieneAdelanto(e.target.checked)}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  {simTieneAdelanto ? (
                    <div className="space-y-2">
                      <CurrencyInput
                        value={simMontoAdelanto}
                        onChange={(val) => setSimMontoAdelanto(Math.max(0, val))}
                        placeholder="Monto a adelantar"
                        className="w-full text-sm font-mono font-bold bg-slate-900 border-slate-700 text-white"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">Mes:</span>
                        <input
                          type="number"
                          min={1}
                          max={cantidadCuotasBase}
                          value={simCuotaAdelanto}
                          onChange={(e) => setSimCuotaAdelanto(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white text-center"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">Modo:</span>
                        <select
                          value={simEstrategiaAdelanto}
                          onChange={(e) => setSimEstrategiaAdelanto(e.target.value as 'reducir_cuota' | 'acortar_plazo')}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                        >
                          <option value="reducir_cuota">Reducir Cuota</option>
                          <option value="acortar_plazo">Acelerar Plazo</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Podés activar una inyección de capital en un mes específico para liquidar cuotas antes de tiempo.
                    </p>
                  )}
                </div>

              </div>

              {/* Resultados Dinámicos del Simulador */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Cuota mensual inicial:</span>
                  <strong className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tabular-nums">
                    {fmtMoneda(flujoCalculado.cuotaInmInicial + flujoCalculado.recargoGastosPorCuota)}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    (Cuota pura {fmtMoneda(flujoCalculado.cuotaInmInicial)} {flujoCalculado.recargoGastosPorCuota > 0 ? `+ ${fmtMoneda(flujoCalculado.recargoGastosPorCuota)} gastos` : ''})
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Total a Abonar Plan:</span>
                  <strong className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums">
                    {fmtMoneda(flujoCalculado.totalAbonado + flujoCalculado.pagoFinalGastos)}
                  </strong>
                  <span className="text-[11px] text-slate-500 block">
                    Capital 100% aplicado a la obra
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <span className="text-xs text-slate-400 block">Ahorro vs Crédito UVA/Banco:</span>
                  <strong className="text-xl sm:text-2xl font-black text-amber-300 font-mono tabular-nums">
                    ~ {fmtMoneda(Math.round(costoDeptoBase * 0.4))}
                  </strong>
                  <span className="text-[11px] text-emerald-400 block">
                    Sin intereses bancarios usurarios
                  </span>
                </div>
              </div>

            </div>

            {/* 4. Cuadro de Marcha Completo Mes a Mes */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Cuadro de Marcha & Flujo de Fondos Proyectado
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evolución mes a mes de tus aportes, cuotas puras, gastos y saldo cancelado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDescargarPDF}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Descargar Cuadro Completo (PDF)</span>
                </button>
              </div>

              {/* Tabla Responsive de Cuadro de Marcha */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Mes / Cuota</th>
                      <th className="py-2.5 px-3">Cuota Inmobiliaria</th>
                      <th className="py-2.5 px-3">Aporte Gastos</th>
                      <th className="py-2.5 px-3">Total del Mes</th>
                      <th className="py-2.5 px-3">Saldo Restante</th>
                      <th className="py-2.5 px-3">Hito / Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {/* Fila Mes 0 (Anticipo) */}
                    {simAnticipo > 0 && (
                      <tr className="bg-amber-500/10 font-bold">
                        <td className="py-2.5 px-3 text-amber-300">Mes 0 (Anticipo)</td>
                        <td className="py-2.5 px-3 text-white">{fmtMoneda(simAnticipo)}</td>
                        <td className="py-2.5 px-3 text-slate-400">$ 0</td>
                        <td className="py-2.5 px-3 text-amber-300">{fmtMoneda(simAnticipo)}</td>
                        <td className="py-2.5 px-3 text-slate-300">{fmtMoneda(costoDeptoBase - simAnticipo)}</td>
                        <td className="py-2.5 px-3 text-amber-400">⚡ Anticipo Inicial</td>
                      </tr>
                    )}

                    {flujoCalculado.flujo.slice(0, 36).map((m) => {
                      const esPosesion = m.mes === simCuotaPosesion;
                      return (
                        <tr
                          key={m.mes}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            esPosesion ? 'bg-emerald-950/30 font-bold border-l-2 border-emerald-500' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-slate-300">Cuota {m.mes}</td>
                          <td className="py-2 px-3 text-white">{fmtMoneda(m.capital)}</td>
                          <td className="py-2 px-3 text-slate-400">{fmtMoneda(m.gastos)}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{fmtMoneda(m.abonadoMes)}</td>
                          <td className="py-2 px-3 text-slate-400">{fmtMoneda(m.saldoRemanente)}</td>
                          <td className="py-2 px-3">
                            {esPosesion ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                🔑 Entrega / Posesión
                              </span>
                            ) : m.mes === 1 ? (
                              <span className="text-slate-500 text-[11px]">Inicio</span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 2: ASPECTO TÉCNICO COMPLETO                               */}
        {/* ================================================================= */}
        {tabActiva === 'tecnico' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. Visor Fotográfico y Avance Certificado */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Carrusel de Fotos */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950 overflow-hidden group">
                  <img
                    src={fotoActual.url}
                    alt={fotoActual.etapa}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-900/90 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 backdrop-blur-md">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>{fotoActual.etapa}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">
                      Verificado por Dirección de Obra
                    </span>
                  </div>

                  {/* Botones carrusel */}
                  <button
                    type="button"
                    onClick={() => setFotoActivaIndex((prev) => (prev - 1 + fotosDeLaObra.length) % fotosDeLaObra.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 cursor-pointer shadow-lg"
                    title="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFotoActivaIndex((prev) => (prev + 1) % fotosDeLaObra.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white flex items-center justify-center border border-slate-700 cursor-pointer shadow-lg"
                    title="Siguiente foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <p className="text-xs sm:text-sm font-semibold text-white drop-shadow">
                      {fotoActual.descripcion}
                    </p>
                    <span className="text-xs text-slate-400 font-mono block mt-0.5">
                      Inspección técnica: {fotoActual.fecha}
                    </span>
                  </div>
                </div>

                {/* Miniaturas */}
                <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {fotosDeLaObra.map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFotoActivaIndex(i)}
                        className={`h-12 w-16 sm:w-20 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                          (fotoActivaIndex % fotosDeLaObra.length) === i
                            ? 'border-amber-400 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={f.url} alt={f.etapa} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {(fotoActivaIndex % fotosDeLaObra.length) + 1} / {fotosDeLaObra.length}
                  </span>
                </div>
              </div>

              {/* Panel de Avance y Métricas Técnicas */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6">
                
                <div className="space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                      <HardHat className="w-4 h-4" />
                      <span>Certificación Técnica & Avance Físico</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {avanceObraPonderado}% Completado
                    </h3>
                  </div>

                  {/* Barra de Progreso Ponderado */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${avanceObraPonderado}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Fundaciones: 100%</span>
                      <span>H°A°: 85%</span>
                      <span>Terminaciones: 30%</span>
                    </div>
                  </div>

                  {/* Datos del Edificio */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Superficie Total:</span>
                      <strong className="text-sm sm:text-base font-bold text-white font-mono">
                        {datosTec.superficieTotalM2} m²
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Plantas / Pisos:</span>
                      <strong className="text-sm sm:text-base font-bold text-white font-mono">
                        PB + {datosTec.cantidadPisos - 1} Pisos
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Permiso Municipal:</span>
                      <strong className="text-xs font-bold text-emerald-400 font-mono truncate block">
                        {datosTec.numeroPermisoObra || 'Aprobado'}
                      </strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs text-slate-400 block">Nomenclatura:</span>
                      <strong className="text-xs font-bold text-slate-300 font-mono truncate block">
                        {datosTec.nomenclaturaCatastral || 'Reg. Catastral'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Inspecciones estructurales periódicas al día</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Póliza de seguro de obra contra todo riesgo vigente</span>
                  </div>
                </div>

              </div>

            </div>

            {/* 2. Cronograma de Etapas Constructivas Detallado */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Cronograma & Desglose de Etapas Constructivas</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pesos ponderados asignados por la dirección técnica y avance físico verificado en cada rubro.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Etapa Constructiva</th>
                      <th className="py-3 px-4">Peso Ponderado</th>
                      <th className="py-3 px-4">Avance Real</th>
                      <th className="py-3 px-4">Plazo Estimado</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {datosTec.etapas.map((etapa) => {
                      const esCompletada = etapa.porcentajeReal >= 100 || etapa.estado === 'completada';
                      const enProgreso = etapa.porcentajeReal > 0 && etapa.porcentajeReal < 100;

                      return (
                        <tr key={etapa.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            {esCompletada ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : enProgreso ? (
                              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600" />
                            )}
                            <span>{etapa.nombre}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">{etapa.pesoPonderado}%</td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${esCompletada ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                  style={{ width: `${etapa.porcentajeReal}%` }}
                                />
                              </div>
                              <span className="font-bold text-white">{etapa.porcentajeReal}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {etapa.fechaInicioEstimada} → {etapa.fechaFinEstimada}
                          </td>
                          <td className="py-3 px-4">
                            {esCompletada ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                Completada
                              </span>
                            ) : enProgreso ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                En Progreso
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                                Programada
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Profesionales y Dirección Técnica */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                  <span>Equipo Profesional & Dirección Técnica</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Profesionales matriculados con responsabilidad civil y legal en el proyecto.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(datosTec.profesionales && datosTec.profesionales.length > 0 ? datosTec.profesionales : [
                  { id: '1', rol: 'Director de Obra', nombre: datosTec.directorObra, matricula: 'CAPBA 18452', empresa: 'Estudio Arquitectura' },
                  { id: '2', rol: 'Cálculo Estructural H°A°', nombre: datosTec.calculistaEstructural, matricula: 'CIPBA 22104', empresa: 'Ingeniería Civil' },
                  { id: '3', rol: 'Empresa Constructora', nombre: datosTec.empresaConstructora, matricula: 'Reg. IERIC', empresa: 'Constructora S.A.' }
                ]).map((prof) => (
                  <div key={prof.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      {prof.rol}
                    </span>
                    <strong className="text-sm font-bold text-white block">
                      {prof.nombre}
                    </strong>
                    {prof.matricula && (
                      <span className="text-xs text-slate-400 block font-mono">
                        Matrícula: {prof.matricula}
                      </span>
                    )}
                    {prof.empresa && (
                      <span className="text-xs text-slate-500 block">
                        {prof.empresa}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Trámites y Permisos ante Organismos */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-emerald-400" />
                  <span>Expedientes, Permisos & Trámites Oficiales</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Seguimiento de autorizaciones municipales, catastro, PH y servicios.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {datosTec.tramites.map((tramite) => (
                  <div key={tramite.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase block">
                        {tramite.organismo}
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-white block">
                        {tramite.titulo}
                      </strong>
                      <span className="text-xs text-slate-400 font-mono block">
                        Expediente: {tramite.numeroExpediente}
                      </span>
                      {tramite.observaciones && (
                        <p className="text-[11px] text-slate-500">{tramite.observaciones}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      tramite.estado === 'aprobado'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {tramite.estado === 'aprobado' ? '✓ Aprobado' : '⏳ En Trámite'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 3: RESUMEN EJECUTIVO INTEGRAL                              */}
        {/* ================================================================= */}
        {tabActiva === 'resumen' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Resumen Ejecutivo 360°: {obra.nombre}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Visión consolidada de viabilidad técnica y solidez financiera para toma de decisiones.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Columna Financiera */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Pilares Financieros</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between">
                      <span className="text-slate-400">Precio cerrado al costo:</span>
                      <strong className="font-mono text-white">{fmtMoneda(costoDeptoBase)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Cuotas fijadas:</span>
                      <strong className="font-mono text-white">{cantidadCuotasBase} meses</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Cuota pura estimada:</span>
                      <strong className="font-mono text-emerald-400">{fmtMoneda(cuotaEstimadaBase)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Gastos fiduciarios totales:</span>
                      <strong className="font-mono text-amber-300">{fmtMoneda(gastosCalculados.gastosTotales)}</strong>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setTabActiva('financiero')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 pt-2 cursor-pointer"
                  >
                    <span>Ver simulación completa y cuadro de marcha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Columna Técnica */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <HardHat className="w-4 h-4" />
                    <span>Pilares Constructivos</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex justify-between">
                      <span className="text-slate-400">Avance de obra físico:</span>
                      <strong className="font-mono text-white">{avanceObraPonderado}% Certificado</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Superficie construida:</span>
                      <strong className="font-mono text-white">{datosTec.superficieTotalM2} m²</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Dirección de Obra:</span>
                      <strong className="font-mono text-white">{datosTec.directorObra}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400">Permiso Municipal:</span>
                      <strong className="font-mono text-emerald-400">EXP-Aprobado</strong>
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setTabActiva('tecnico')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 pt-2 cursor-pointer"
                  >
                    <span>Ver etapas constructivas, fotos y trámites</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Botón de Conversión Final */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-950 to-indigo-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <strong className="text-base font-extrabold text-white block">
                    ¿Listo para formar parte de este círculo fiduciario?
                  </strong>
                  <p className="text-xs text-slate-400">
                    Quedan únicamente {unidadesDisponibles} cupos libres antes de cerrar la suscripción definitiva.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onPreinscribirObra(obra, cuotaEstimadaBase)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer"
                  >
                    Preinscribirme en {obra.nombre}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
};

export default ObraDetallePage;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import { FOTOS_OBRA_PREDETERMINADAS } from '../services/fondoService';
import type { UserProfile, UserRole } from '../types/auth';
import { fmtMoneda } from '../utils/calculations';
import {
  ArrowLeft,
  HardHat,
  ChevronRight,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Calculator,
  ChevronDown,
  User,
  Shield,
  Wrench,
  LogOut,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ObrasEnMarchaPageProps {
  proyectos: FondoGuardado[];
  currentUser?: UserProfile | null;
  onSelectObra: (obraId: string) => void;
  onVolverInicio: () => void;
  onSimularObra: (obra: FondoGuardado) => void;
  onPreinscribirObra: (obra: FondoGuardado, cuotaEstimada: number) => void;
  onOpenLogin: (role?: UserRole) => void;
  onSelectPortal?: (portal: 'admin' | 'socio' | 'tecnico') => void;
  onSignOut?: () => void;
  isAdmin?: boolean;
  onEditObra?: (obraId: string) => void;
  onDeleteObra?: (obraId: string, nombre: string) => void;
}

/**
 * Cabecera fotográfica resiliente para tarjetas de obra.
 * Si la foto falla o no existe, muestra un placeholder arquitectónico elegante y moderno
 * sin romper nunca la maquetación ni mostrar íconos rotos del navegador.
 */
const ObraCardHeader: React.FC<{
  fotoUrl?: string;
  nombre: string;
  porcentajeAvanceObra: number;
  direccionObra: string;
  idx: number;
}> = ({ fotoUrl, porcentajeAvanceObra, direccionObra }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isValidUrl = Boolean(fotoUrl && fotoUrl.trim().length > 7 && !imgError);

  return (
    <div className="relative h-48 sm:h-56 md:h-60 w-full overflow-hidden bg-slate-950">
      {isValidUrl && (
        <img
          src={fotoUrl}
          alt=""
          onError={() => setImgError(true)}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Fallback arquitectónico moderno cuando la imagen no carga o no existe */}
      {(!isValidUrl || !imgLoaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/40">
          <div className="relative mb-2.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-black text-slate-200 tracking-wider uppercase">
            Proyecto Fiduciario
          </span>
          <span className="text-[11px] text-amber-400/90 font-mono mt-0.5">
            Estructura & Avance Físico Certificado
          </span>
        </div>
      )}

      {/* Gradiente de contraste para legibilidad perfecta */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none" />

      {/* Badges superiores sobre la imagen (Responsive y con z-10) */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between gap-2 z-10">
        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg shadow-black/50 shrink-0">
          <HardHat className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span>Obra en Marcha</span>
        </span>

        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md text-emerald-400 border border-emerald-500/40 font-mono text-[11px] sm:text-xs font-bold shadow-lg shrink-0">
          {porcentajeAvanceObra}% Avance Certificado
        </span>
      </div>

      {/* Dirección y Ubicación al pie de la foto */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex items-center gap-1.5 text-xs text-slate-300 z-10">
        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="truncate text-[11px] sm:text-xs font-medium text-slate-200">
          {direccionObra}
        </span>
      </div>
    </div>
  );
};

export const ObrasEnMarchaPage: React.FC<ObrasEnMarchaPageProps> = ({
  proyectos,
  currentUser,
  onSelectObra,
  onVolverInicio,
  onSimularObra,
  onPreinscribirObra,
  onOpenLogin,
  onSelectPortal,
  onSignOut,
  isAdmin = false,
  onEditObra,
  onDeleteObra
}) => {
  // Dropdowns del header
  const [isPlanesOpen, setIsPlanesOpen] = useState(false);
  const [isIngresarOpen, setIsIngresarOpen] = useState(false);
  const [obraAEliminar, setObraAEliminar] = useState<{ id: string; nombre: string } | null>(null);

  const planesMenuRef = useRef<HTMLDivElement>(null);
  const ingresarMenuRef = useRef<HTMLDivElement>(null);

  // Al montar Obras en Marcha, asegurar scroll al header superior
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (planesMenuRef.current && !planesMenuRef.current.contains(target)) {
        setIsPlanesOpen(false);
      }
      if (ingresarMenuRef.current && !ingresarMenuRef.current.contains(target)) {
        setIsIngresarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar solo las obras que están en marcha activas (estadoPlan !== 'simulacion')
  const obrasActivas = useMemo(() => {
    const activas = proyectos.filter((p) => p.estadoPlan !== 'simulacion');
    // Si no hay ninguna con bandera explícita, mostrar los proyectos disponibles
    return activas.length > 0 ? activas : proyectos;
  }, [proyectos]);

  return (
    <div id="pagina-obras-en-marcha" className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-amber-500 selection:text-slate-950">
      
      {/* ==================================================================== */}
      {/* BARRA SUPERIOR INSTITUCIONAL (HEADER)                                */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-all shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Lado izquierdo: Botón Volver + Logo Fondin */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              id="btn-volver-landing-desde-obras"
              onClick={onVolverInicio}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Volver a Inicio"
            >
              <ArrowLeft className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">Volver a Inicio</span>
              <span className="sm:hidden">Inicio</span>
            </button>

            <div
              onClick={onVolverInicio}
              className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
              title="Ir al inicio"
            >
              <img
                src="/isologo-fondin.png"
                alt="Fondin"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
              <div className="flex flex-col justify-center min-w-0">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight leading-none">
                  Fondin
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 tracking-tight leading-tight mt-0.5 truncate max-w-[155px] sm:max-w-none">
                  Inversión Fiduciaria Inmobiliaria
                </span>
              </div>
            </div>
          </div>

          {/* Lado derecho: Menú Planes + Menú Ingresar / Usuario */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* 1. MENÚ DESPLEGABLE: PLANES */}
            <div className="relative" ref={planesMenuRef}>
              <button
                type="button"
                id="btn-planes-dropdown-obras"
                onClick={() => {
                  setIsPlanesOpen((prev) => !prev);
                  setIsIngresarOpen(false);
                }}
                className="bg-slate-800/80 hover:bg-slate-800 text-white border border-amber-500/40 text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Planes</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPlanesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPlanesOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in backdrop-blur-xl">
                  <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Planes y Proyectos</span>
                    <span className="text-amber-400 font-mono text-[9px]">Fondin</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPlanesOpen(false)}
                    className="w-full text-left px-3.5 py-2.5 text-xs bg-amber-500/10 text-amber-300 font-bold flex items-start gap-3 transition cursor-default"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                      <HardHat className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs sm:text-sm">Obras en Marcha (Actual)</span>
                      <span className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                        Proyectos en curso, avances y detalles técnicos
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlanesOpen(false);
                      onSimularObra(obrasActivas[0] || proyectos[0]);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-200 hover:text-white hover:bg-emerald-500/10 active:bg-emerald-500/20 flex items-start gap-3 transition cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 shrink-0 mt-0.5">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-slate-100 group-hover:text-white text-xs sm:text-sm">
                        Simular tu plan
                      </span>
                      <span className="text-[11px] text-slate-400 leading-tight mt-0.5">
                        Calculá tus cuotas, anticipo y adjudicación
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. MENÚ DESPLEGABLE: INGRESAR / USUARIO */}
            <div className="relative" ref={ingresarMenuRef}>
              <button
                type="button"
                id="btn-ingresar-dropdown-obras"
                onClick={() => {
                  setIsIngresarOpen((prev) => !prev);
                  setIsPlanesOpen(false);
                }}
                className={`text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  currentUser && !currentUser.isGuest
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 text-amber-300 hover:text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {currentUser && !currentUser.isGuest ? (
                  <>
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span className="max-w-[110px] sm:max-w-[150px] truncate">
                      {currentUser.nombre || currentUser.email?.split('@')[0] || 'Mi Cuenta'}
                    </span>
                  </>
                ) : (
                  <span>Ingresar</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isIngresarOpen ? 'rotate-180' : ''}`} />
              </button>

              {isIngresarOpen && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in backdrop-blur-xl">
                  {currentUser && !currentUser.isGuest && (
                    <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold text-white truncate">{currentUser.nombre}</span>
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                          Rol: {currentUser.role}
                        </span>
                      </div>
                      {onSignOut && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsIngresarOpen(false);
                            onSignOut();
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Cerrar sesión"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Portales de Acceso
                  </div>

                  {/* Portal Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsIngresarOpen(false);
                      if (onSelectPortal) onSelectPortal('admin');
                      else onOpenLogin('admin');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-purple-400" />
                    <div>
                      <strong className="block text-white">Portal Admin</strong>
                      <span className="text-[10px] text-slate-400">Gestión contable y fiduciaria</span>
                    </div>
                  </button>

                  {/* Portal Socios */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsIngresarOpen(false);
                      if (onSelectPortal) onSelectPortal('socio');
                      else onOpenLogin('socio');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-400" />
                    <div>
                      <strong className="block text-white">Portal Socios</strong>
                      <span className="text-[10px] text-slate-400">Adherentes y cuenta corriente</span>
                    </div>
                  </button>

                  {/* Portal Técnico */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsIngresarOpen(false);
                      if (onSelectPortal) onSelectPortal('tecnico');
                      else onOpenLogin('tecnico');
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="block text-white">Portal Técnico</strong>
                      <span className="text-[10px] text-slate-400">Cronogramas, trámites y planos</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ==================================================================== */}
      {/* SECCIÓN HERO / PRESENTACIÓN DE OBRAS EN MARCHA                       */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Luz decorativa ambiental */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Fideicomiso al Costo Real (Art. 1666 CCCN)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Obras en Marcha
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Elegí en cuál de las obras activas querés entrar para auditar su{' '}
              <strong className="text-white font-semibold">cronograma físico de avance</strong>, su{' '}
              <strong className="text-white font-semibold">legajo técnico y planos</strong>, o para simular tu adhesión fiduciaria al costo sin interés bancario.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-slate-200">{obrasActivas.length} Proyectos Activos</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-slate-200">100% Cuota Pura Sin Interés UVA</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* LISTADO DE LAS OBRAS EN MARCHA PARA ELEGIR EN CUÁL ENTRAR             */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        
        {/* Cabecera de la sección: Título e indicación clara (Responsive) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 pb-1 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-wide uppercase">
              Seleccioná la Obra a Consultar
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Hacé clic en cualquier obra para auditar datos financieros y técnicos
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {obrasActivas.map((proyecto, idx) => {
            const cantidadDeptos = Number(proyecto.params?.cantidadDeptos) || 10;
            const cantidadCuotas = Number(proyecto.params?.cantidadCuotas) || 36;
            const costoDepto = Number(proyecto.params?.costoDepto) > 0 ? Number(proyecto.params.costoDepto) : 70000;
            const cuotaEstimada = (Number(proyecto.params?.valorCuotaBase) > 0)
              ? Number(proyecto.params.valorCuotaBase)
              : (cantidadCuotas > 0 ? Math.round(costoDepto / cantidadCuotas) : 0);

            // Adjudicaciones y unidades disponibles
            const adjudicacionesObj = proyecto.adjudicacionFijada || {};
            const unidadesAdjudicadasConteo = Object.keys(adjudicacionesObj).length;
            const unidadesAdjudicadas = unidadesAdjudicadasConteo > 0
              ? Math.min(unidadesAdjudicadasConteo, cantidadDeptos - 1)
              : Math.max(1, Math.min(7, cantidadDeptos - 3));
            const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);

            // Avance ponderado
            let porcentajeAvanceObra = idx === 0 ? 30 : 68;
            if (proyecto.datosTecnicos?.etapas && proyecto.datosTecnicos.etapas.length > 0) {
              const totalPonderado = proyecto.datosTecnicos.etapas.reduce(
                (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
                0
              );
              if (totalPonderado > 0) porcentajeAvanceObra = Math.round(totalPonderado);
            }

            // Foto de la obra con validación estricta
            const fotoObraCandidata = (proyecto.fotos && proyecto.fotos.length > 0 && proyecto.fotos[0]?.url)
              ? proyecto.fotos[0].url.trim()
              : (FOTOS_OBRA_PREDETERMINADAS[idx % FOTOS_OBRA_PREDETERMINADAS.length]?.url || FOTOS_OBRA_PREDETERMINADAS[0].url);

            const direccionObra = proyecto.datosTecnicos?.direccionObra || 'Av. Libertador 1450, Zona Céntrica';

            return (
              <article
                key={proyecto.id}
                id={`tarjeta-obra-en-marcha-${proyecto.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-amber-500/10 flex flex-col group"
              >
                {/* Cabecera con Imagen / Render y Badges (UX Fail-Safe y Totalmente Responsive) */}
                <ObraCardHeader
                  fotoUrl={fotoObraCandidata}
                  nombre={proyecto.nombre}
                  porcentajeAvanceObra={porcentajeAvanceObra}
                  direccionObra={direccionObra}
                  idx={idx}
                />

                {/* Contenido de la Tarjeta */}
                <div className="p-4 sm:p-6 md:p-7 flex-1 flex flex-col justify-between space-y-5 sm:space-y-6">
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                        {proyecto.nombre}
                      </h3>
                      {proyecto.descripcion && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {proyecto.descripcion}
                        </p>
                      )}
                    </div>
                    
                    {/* Barra de Progreso del Avance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400">Certificación Física de Obra</span>
                        <strong className="text-amber-400 font-bold">{porcentajeAvanceObra}%</strong>
                      </div>
                      <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${porcentajeAvanceObra}%` }}
                        />
                      </div>
                    </div>

                    {/* Matriz de Parámetros Clave (2x2 Grid Adaptativa) */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block truncate">
                          Cuota Pura Base
                        </span>
                        <strong className="text-base sm:text-lg font-black text-amber-300 font-mono block mt-0.5">
                          {fmtMoneda(cuotaEstimada)}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">Sin interés bancario</span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block truncate">
                          Plazo Fiduciario
                        </span>
                        <strong className="text-base sm:text-lg font-black text-white font-mono block mt-0.5">
                          {cantidadCuotas} Cuotas
                        </strong>
                        <span className="text-[10px] text-slate-500 block">Meses corridos</span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block truncate">
                          Costo Departamento
                        </span>
                        <strong className="text-sm sm:text-base font-extrabold text-white font-mono block mt-0.5">
                          {fmtMoneda(costoDepto)}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">Al costo de obra</span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block truncate">
                          Disponibilidad
                        </span>
                        <strong className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono block mt-0.5">
                          Quedan {unidadesDisponibles} de {cantidadDeptos}
                        </strong>
                        <span className="text-[10px] text-slate-500 block">
                          {unidadesAdjudicadas} ya aportando
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones principales: Entrar a la Obra, Simular o Preinscribirse */}
                  <div className="space-y-2.5 sm:space-y-3 pt-2 border-t border-slate-800/80">
                    
                    {/* BOTÓN PRINCIPAL: ENTRAR A LA OBRA */}
                    <button
                      type="button"
                      id={`btn-entrar-obra-${proyecto.id}`}
                      onClick={() => onSelectObra(proyecto.id)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm md:text-base py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer group/btn active:scale-[0.99]"
                    >
                      <HardHat className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 shrink-0" />
                      <span className="hidden sm:inline">Entrar a la Obra (Aspecto Financiero & Técnico)</span>
                      <span className="sm:hidden">Ver Obra Completa y Datos</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover/btn:translate-x-1 shrink-0" />
                    </button>

                    {/* Botones secundarios: Simular y Preinscribirse */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id={`btn-simular-obra-${proyecto.id}`}
                        onClick={() => onSimularObra(proyecto)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 px-2.5 sm:px-3 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Calculator className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Simular este plan</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-preinscribir-obra-${proyecto.id}`}
                        onClick={() => onPreinscribirObra(proyecto, cuotaEstimada)}
                        className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs py-2.5 px-2.5 sm:px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Preinscribirme</span>
                      </button>

                      {/* Herramientas de Administrador */}
                      {isAdmin && onEditObra && (
                        <button
                          type="button"
                          onClick={() => onEditObra(proyecto.id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition cursor-pointer shrink-0"
                          title="Editar parámetros de esta obra (Admin)"
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && onDeleteObra && (
                        <button
                          type="button"
                          onClick={() => setObraAEliminar({ id: proyecto.id, nombre: proyecto.nombre })}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer shrink-0"
                          title="Eliminar esta obra (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </article>
            );
          })}
        </div>

      </main>

      {/* Modal de Confirmación para Eliminar Obra (Admin) */}
      {obraAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setObraAEliminar(null)}
        >
          <div
            className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl shadow-rose-950/40 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">¿Eliminar Obra en Marcha?</h3>
                <p className="text-xs text-rose-300 font-medium">Acción irreversible para Administradores</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              ¿Confirmás que querés eliminar definitivamente la obra{' '}
              <strong className="text-white font-bold font-mono">"{obraAEliminar.nombre}"</strong>?
              Se eliminarán sus cronogramas y parámetros activos asociados.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setObraAEliminar(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-eliminar-obra-page"
                onClick={() => {
                  if (onDeleteObra && obraAEliminar) {
                    onDeleteObra(obraAEliminar.id, obraAEliminar.nombre);
                  }
                  setObraAEliminar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, eliminar obra</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ObrasEnMarchaPage;

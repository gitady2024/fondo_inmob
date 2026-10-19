import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Zap,
  KeyRound,
  ScrollText,
  Clock,
  TrendingDown,
  Info,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import type { EstrategiaImpactoAdelanto } from '../types/fondo';
import { fmtMoneda, formatFecha } from '../utils/calculations';

// Componente de entrada numérica optimizado para valores financieros
// Permite vaciar el campo, poner en cero y volver a cargar sin formateos molestos ni 010000
interface FintechInputProps {
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
  borderColor?: string;
  textColor?: string;
  min?: number;
  max?: number;
  isDecimal?: boolean;
}

export const FintechInput: React.FC<FintechInputProps> = ({
  value,
  onChange,
  prefix,
  suffix,
  placeholder = '0',
  className = '',
  borderColor = 'focus:border-indigo-500',
  textColor = 'text-white',
  min,
  max,
  isDecimal = false
}) => {
  const [text, setText] = useState<string>(() => (value === 0 ? '0' : String(value)));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setText(value === 0 ? '0' : String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    if (isDecimal) {
      raw = raw.replace(',', '.');
      const clean = raw.replace(/[^\d.]/g, '');
      const parts = clean.split('.');
      const cleanNumStr = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');

      if (cleanNumStr === '' || cleanNumStr === '.') {
        setText(cleanNumStr);
        onChange(0);
        return;
      }

      const num = parseFloat(cleanNumStr);
      setText(cleanNumStr);
      if (!isNaN(num)) {
        onChange(num);
      }
      return;
    }

    const cleanDigits = raw.replace(/[^\d]/g, '');

    if (cleanDigits === '') {
      setText('');
      onChange(0);
      return;
    }

    let num = parseInt(cleanDigits, 10);
    if (isNaN(num)) num = 0;

    if (max !== undefined && num > max) {
      num = max;
    }

    setText(num === 0 ? '0' : String(num));
    onChange(num);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = isDecimal
      ? parseFloat(text.replace(',', '.')) || 0
      : parseInt(text.replace(/[^\d]/g, ''), 10) || 0;

    if (isNaN(num) || num < 0) num = 0;
    if (min !== undefined && num < min && num !== 0) num = min;
    if (max !== undefined && num > max) num = max;

    setText(String(num));
    onChange(num);
  };

  const displayValue = isFocused
    ? text
    : value === 0
    ? '0'
    : isDecimal
    ? String(value)
    : value.toLocaleString('es-AR');

  return (
    <div className="relative w-full flex items-center">
      {prefix && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none pointer-events-none z-10">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode={isDecimal ? 'decimal' : 'numeric'}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full bg-slate-900 border border-slate-700 ${borderColor} rounded-xl ${
          prefix ? 'pl-20' : 'pl-3.5'
        } ${suffix ? 'pr-8' : 'pr-3.5'} py-2.5 font-mono font-bold ${textColor} outline-none transition shadow-inner ${className}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs select-none pointer-events-none z-10">
          {suffix}
        </span>
      )}
    </div>
  );
};

export interface PanelSimuladorPlanProps {
  // 1ero: Importe de la unidad
  importeUnidad: number;
  onImporteChange: (val: number) => void;

  // 2do: Anticipo mes 0 integrado
  anticipo: number;
  onAnticipoChange: (val: number) => void;

  // 3ero: Adelanto específico en un mes a elegir
  tieneAdelanto: boolean;
  onTieneAdelantoChange: (val: boolean) => void;
  montoAdelanto: number;
  onMontoAdelantoChange: (val: number) => void;
  cuotaAdelanto: number;
  onCuotaAdelantoChange: (val: number) => void;
  estrategiaAdelanto: EstrategiaImpactoAdelanto;
  onEstrategiaAdelantoChange: (val: EstrategiaImpactoAdelanto) => void;

  // 4to: Entrega/adjudicación de la unidad
  cuotaPosesion: number;
  onCuotaPosesionChange: (val: number) => void;
  gastosAdjudicacion: number;

  // 5to: Cesión/venta de la unidad o participación
  activarCesion: boolean;
  onActivarCesionChange: (val: boolean) => void;
  cuotaCesion: number;
  onCuotaCesionChange: (val: number) => void;
  porcentajePrimaCesion: number;
  onPorcentajePrimaCesionChange: (val: number) => void;

  // Contexto y auxiliares
  cantidadCuotasTotal: number;
  fechaInicio: string;
  capitalAportadoHastaCesion: number;
}

export const PanelSimuladorPlan: React.FC<PanelSimuladorPlanProps> = ({
  importeUnidad,
  onImporteChange,
  anticipo,
  onAnticipoChange,
  tieneAdelanto,
  onTieneAdelantoChange,
  montoAdelanto,
  onMontoAdelantoChange,
  cuotaAdelanto,
  onCuotaAdelantoChange,
  estrategiaAdelanto,
  onEstrategiaAdelantoChange,
  cuotaPosesion,
  onCuotaPosesionChange,
  gastosAdjudicacion,
  activarCesion,
  onActivarCesionChange,
  cuotaCesion,
  onCuotaCesionChange,
  porcentajePrimaCesion,
  onPorcentajePrimaCesionChange,
  cantidadCuotasTotal,
  fechaInicio,
  capitalAportadoHastaCesion
}) => {
  // Cálculos para Cesión (5to paso)
  const montoPrimaCesion = (importeUnidad * (porcentajePrimaCesion || 0)) / 100;
  const desgloseGestion = montoPrimaCesion * 0.50;
  const desgloseEscribania = montoPrimaCesion * 0.35;
  const desgloseGastosMenores = montoPrimaCesion * 0.15;
  const netoEstimadoCesion = Math.max(0, capitalAportadoHastaCesion - montoPrimaCesion);

  const fechaAdelanto = formatFecha(fechaInicio, cuotaAdelanto);
  const fechaPosesion = formatFecha(fechaInicio, cuotaPosesion);
  const fechaSalidaCesion = formatFecha(fechaInicio, cuotaCesion);

  return (
    <div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md space-y-6">
      
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-xs">
                🎛️
              </span>
              Simulación de Plan de Inversión
            </h3>
            <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
              5 Parámetros Clave
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configurá las variables del plan ordenadas por importancia. Los cambios impactan de inmediato en el cronograma.
          </p>
        </div>
      </div>

      {/* Grid de los 5 ítems en estricto orden de importancia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ========================================================= */}
        {/* 1ERO: EL IMPORTE DE LA UNIDAD                             */}
        {/* ========================================================= */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-indigo-600/30">
                1
              </span>
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Importe de la Unidad
              </label>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Prioridad #1
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <FintechInput
                prefix="USD $"
                value={importeUnidad}
                onChange={onImporteChange}
                borderColor="focus:border-indigo-500"
                textColor="text-white"
                min={0}
              />
            </div>

            {/* Accesos rápidos de importe */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">Rápido:</span>
              {[65000, 72000, 85000, 110000].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onImporteChange(m)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    importeUnidad === m
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  ${m.toLocaleString('es-AR')}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Costo fiduciario al costo real de construcción del departamento o tipología.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 2DO: ANTICIPO MES 0 INTEGRADO                             */}
        {/* ========================================================= */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-emerald-600/30">
                2
              </span>
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Anticipo Mes 0 Integrado
              </label>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Prioridad #2
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <FintechInput
                prefix="USD $"
                value={anticipo}
                onChange={onAnticipoChange}
                borderColor="focus:border-emerald-500"
                textColor="text-emerald-300"
                max={importeUnidad > 0 ? importeUnidad : undefined}
                min={0}
              />
            </div>

            {/* Accesos rápidos de porcentaje de anticipo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold mr-1">Rápido:</span>
              {[
                { label: '0%', val: 0 },
                { label: '10%', val: Math.round(importeUnidad * 0.1) },
                { label: '15%', val: Math.round(importeUnidad * 0.15) },
                { label: '20%', val: Math.round(importeUnidad * 0.2) }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onAnticipoChange(item.val)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                    anticipo === item.val
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {item.label} ({fmtMoneda(item.val)})
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Aporte inicial de suscripción previo al inicio de las cuotas mensuales (amortiza saldo directo).
          </p>
        </div>

        {/* ========================================================= */}
        {/* 3ERO: ADELANTO ESPECÍFICO EN UN MES A ELEGIR               */}
        {/* ========================================================= */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-amber-600/30">
                3
              </span>
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Adelanto Específico en Mes a Elegir
              </label>
            </div>
            
            {/* Switch on/off adelanto */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={tieneAdelanto}
                onChange={(e) => onTieneAdelantoChange(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>{tieneAdelanto ? 'Activo' : 'Sin adelanto'}</span>
            </label>
          </div>

          {tieneAdelanto ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Monto del adelanto */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Monto del Adelanto (USD)
                  </label>
                  <div className="pt-0.5">
                    <FintechInput
                      prefix="$"
                      value={montoAdelanto}
                      onChange={onMontoAdelantoChange}
                      borderColor="focus:border-amber-500"
                      textColor="text-white"
                      min={0}
                    />
                  </div>
                </div>

                {/* Mes / Cuota a elegir */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-slate-400">
                      Mes a Elegir
                    </label>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {fechaAdelanto.fechaCorta}
                    </span>
                  </div>
                  <select
                    value={cuotaAdelanto}
                    onChange={(e) => onCuotaAdelantoChange(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none cursor-pointer"
                  >
                    {Array.from({ length: Math.max(1, cantidadCuotasTotal - 1) }, (_, i) => i + 2).map((m) => (
                      <option key={m} value={m}>
                        Cuota #{m} ({formatFecha(fechaInicio, m).fechaCorta})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de Estrategia */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onEstrategiaAdelantoChange('reducir_cuota')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition text-left cursor-pointer flex items-center justify-between ${
                    estrategiaAdelanto === 'reducir_cuota'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> Aliviar Cuota
                  </span>
                  {estrategiaAdelanto === 'reducir_cuota' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => onEstrategiaAdelantoChange('acelerar')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition text-left cursor-pointer flex items-center justify-between ${
                    estrategiaAdelanto === 'acelerar'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> Acortar Plazo
                  </span>
                  {estrategiaAdelanto === 'acelerar' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Sin adelanto programado. Podés activar esta inyección para ver cómo se reducen tus cuotas.</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Inyección de capital específica en el mes seleccionado que reduce la carga financiera posterior.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 4TO: ENTREGA / ADJUDICACIÓN DE LA UNIDAD                   */}
        {/* ========================================================= */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 relative hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                4
              </span>
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Entrega / Adjudicación de la Unidad
              </label>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
              Prioridad #4
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Cuota de Posesión / Llaves
                </label>
                <select
                  value={cuotaPosesion}
                  onChange={(e) => onCuotaPosesionChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-amber-300 outline-none cursor-pointer"
                >
                  <option value={0}>A definir (seleccionar cuota de posesión)</option>
                  {Array.from({ length: cantidadCuotasTotal || 48 }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      Cuota #{c} ({formatFecha(fechaInicio, c).fechaCorta}) {c === 15 ? '★ (Previsto por Obra)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">Posesión Estimada</span>
                <strong className="text-sm text-amber-300 font-mono block">
                  {cuotaPosesion > 0 ? fechaPosesion.fechaCorta : 'A definir'}
                </strong>
              </div>
            </div>

            {/* Impacto de Gastos de Adjudicación */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Gastos de posesión y escrituración:</span>
              <span className="font-mono font-bold text-amber-300">
                +{fmtMoneda(gastosAdjudicacion)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Hito donde se hace entrega física de llaves y posesión material de tu departamento.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 5TO: CESIÓN / VENTA DE LA UNIDAD O PARTICIPACIÓN          */}
        {/* ========================================================= */}
        <div className="lg:col-span-2 bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 relative hover:border-rose-500/40 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-rose-600/30">
                5
              </span>
              <label className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <ScrollText className="w-4 h-4 text-rose-400" />
                Cesión / Venta de la Unidad o Participación
              </label>
            </div>

            {/* Toggle switch para activar cesión */}
            <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 font-bold cursor-pointer hover:border-rose-500/50 transition">
              <input
                type="checkbox"
                checked={activarCesion}
                onChange={(e) => onActivarCesionChange(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 accent-rose-500 cursor-pointer"
              />
              <span>{activarCesion ? 'Simulación de Cesión Activada' : 'Simular Salida / Cesión Anticipada'}</span>
            </label>
          </div>

          {activarCesion ? (
            <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-rose-500/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Cuota de salida por cesión */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Mes de Salida / Cesión
                    </label>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {fechaSalidaCesion.fechaLarga}
                    </span>
                  </div>
                  <select
                    value={cuotaCesion}
                    onChange={(e) => onCuotaCesionChange(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-rose-300 outline-none cursor-pointer"
                  >
                    {Array.from({ length: Math.max(1, cantidadCuotasTotal - 2) }, (_, i) => i + 2).map((c) => (
                      <option key={c} value={c}>
                        Cuota #{c} ({formatFecha(fechaInicio, c).fechaCorta})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prima por cesión en % del costo total de la unidad */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Prima por Cesión (% del Costo Total de la Unidad)
                    </label>
                    <span className="text-xs font-mono font-bold text-rose-300">
                      {fmtMoneda(montoPrimaCesion)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <FintechInput
                        suffix="%"
                        value={porcentajePrimaCesion}
                        onChange={onPorcentajePrimaCesionChange}
                        borderColor="focus:border-rose-500"
                        textColor="text-white"
                        isDecimal={true}
                        min={0}
                        max={25}
                        className="text-center"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[3, 4, 5, 6].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => onPorcentajePrimaCesionChange(p)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-mono transition cursor-pointer ${
                            porcentajePrimaCesion === p
                              ? 'bg-rose-600 border-rose-500 text-white font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                          }`}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desglose explícito de la prima por cesión */}
              <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Desglose de Costos de la Prima por Cesión ({porcentajePrimaCesion}% del Total)
                  </span>
                  <span className="font-mono text-white">
                    Total: {fmtMoneda(montoPrimaCesion)}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">1. Costos de Gestión Fiduciaria</span>
                    <strong className="text-white font-mono text-sm">{fmtMoneda(desgloseGestion)}</strong>
                    <span className="text-[10px] text-slate-500 block">(50% del arancel)</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">2. Escribanía & Trámites Notariales</span>
                    <strong className="text-white font-mono text-sm">{fmtMoneda(desgloseEscribania)}</strong>
                    <span className="text-[10px] text-slate-500 block">(35% aranceles de cesión)</span>
                  </div>
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">3. Gastos Menores y Administrativos</span>
                    <strong className="text-white font-mono text-sm">{fmtMoneda(desgloseGastosMenores)}</strong>
                    <span className="text-[10px] text-slate-500 block">(15% timbrados y copias)</span>
                  </div>
                </div>
              </div>

              {/* Resultado Financiero de la Cesión */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Capital Integrado a Cuota #{cuotaCesion}</span>
                  <strong className="text-base font-mono text-indigo-300">
                    {fmtMoneda(capitalAportadoHastaCesion)}
                  </strong>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Deducción Prima Cesión</span>
                  <strong className="text-base font-mono text-rose-400">
                    -{fmtMoneda(montoPrimaCesion)}
                  </strong>
                </div>
                <div className="bg-gradient-to-tr from-emerald-950/40 to-slate-950 p-3 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 font-bold block">Neto Estimado a Percibir</span>
                  <strong className="text-lg font-mono text-emerald-300 font-black">
                    {fmtMoneda(netoEstimadoCesion)}
                  </strong>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                No se ha programado cesión anticipada. El plan proyecta la cancelación total hasta la última cuota.
              </span>
              <button
                type="button"
                onClick={() => onActivarCesionChange(true)}
                className="text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ml-2"
              >
                Activar Simulación de Cesión
              </button>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            Transferencia legal formal de la posición contractual antes de la finalización del fideicomiso (Arts. 1614 y 1636 CCCN).
          </p>
        </div>

      </div>

    </div>
  );
};

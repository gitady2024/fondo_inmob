import React, { useState, useMemo } from 'react';
import type { FlujoSocioCalculado, ParametrosFondoState, GastosConfigState, EstrategiaImpactoAdelanto } from '../types/fondo';
import { calcularFlujoIndividual, fmtMoneda, formatFecha } from '../utils/calculations';
import {
  Lock,
  Zap,
  Calendar,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface AdelantoSocioActivoProps {
  socioId: number;
  socioNombre: string;
  flujoActual: FlujoSocioCalculado;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  pagoFinalGastos: number;
  recargoGastosPorCuota: number;
  onOpenMensajes?: () => void;
}

export const AdelantoSocioActivo: React.FC<AdelantoSocioActivoProps> = ({
  socioId,
  socioNombre,
  flujoActual,
  params,
  gastos: _gastos,
  pagoFinalGastos,
  recargoGastosPorCuota,
  onOpenMensajes
}) => {
  // En plan ACTIVO, solo puede modificar el monto y cuota del adelanto / aportes extraordinarios
  const [montoAdelanto, setMontoAdelanto] = useState<number>(5000);
  const [cuotaAdelanto, setCuotaAdelanto] = useState<number>(Math.min(12, params.cantidadCuotas));
  const [estrategia, setEstrategia] = useState<EstrategiaImpactoAdelanto>('reducir_cuota');

  // Recalcular el impacto exclusivamente para este socio con las variables contractuales fijadas
  const flujoConAdelanto = useMemo(() => {
    if (montoAdelanto <= 0) return flujoActual;

    return calcularFlujoIndividual(
      socioId,
      params.costoDepto,
      flujoActual.anticipoMes0,
      params.cantidadCuotas,
      params.modalidadAnticipo,
      recargoGastosPorCuota,
      {
        activo: true,
        mes: cuotaAdelanto,
        monto: montoAdelanto,
        estrategia: estrategia
      },
      flujoActual.cuotaPosesion,
      pagoFinalGastos,
      []
    );
  }, [
    socioId,
    params,
    flujoActual,
    recargoGastosPorCuota,
    pagoFinalGastos,
    montoAdelanto,
    cuotaAdelanto,
    estrategia
  ]);

  // Cuota promedio post-adelanto
  const cuotaPreAdelanto = flujoActual.cuotaInmInicial;
  const cuotaPostAdelanto = useMemo(() => {
    const cuotaAfectada = flujoConAdelanto.flujo.find((f) => f.mes > cuotaAdelanto);
    return cuotaAfectada ? cuotaAfectada.capital : cuotaPreAdelanto;
  }, [flujoConAdelanto, cuotaAdelanto, cuotaPreAdelanto]);

  const reduccionCuota = Math.max(0, cuotaPreAdelanto - cuotaPostAdelanto);
  const mesesReducidos = Math.max(0, flujoActual.mesesTotales - flujoConAdelanto.mesesTotales);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
      
      {/* Cabecera Informativa con bloqueo contractual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Plan Perfeccionado y Activo</span>
            </span>
            <span className="p-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Bases Fiduciarias Bloqueadas</span>
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1.5">
            Proyección de Aportes Extraordinarios para {socioNombre} (Unidad #{socioId})
          </h3>
          <p className="text-xs text-slate-400">
            Como socio activo, las condiciones del fideicomiso son inalterables, pero puedes proyectar inyecciones voluntarias para optimizar tu flujo mensual.
          </p>
        </div>

        {/* Chips de variables contractuales fijas */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5" title="Costo fijado en contrato">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Valor: {fmtMoneda(params.costoDepto)}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5" title="Plazo fijado en contrato">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Plazo: {params.cantidadCuotas}m</span>
          </div>
        </div>
      </div>

      {/* Controles de Adelanto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Input Monto */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Monto a Adelantar
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">$</span>
            <input
              type="number"
              step={500}
              min={1000}
              max={params.costoDepto * 0.6}
              value={montoAdelanto}
              onChange={(e) => setMontoAdelanto(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-white font-mono outline-none"
            />
          </div>
          <div className="flex gap-1.5 pt-1">
            {[2500, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setMontoAdelanto(preset)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-mono transition-colors cursor-pointer"
              >
                +${preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Input Cuota */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Cuota Estimada de Inyección
          </label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="number"
              min={1}
              max={params.cantidadCuotas}
              value={cuotaAdelanto}
              onChange={(e) => setCuotaAdelanto(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white font-mono outline-none"
            />
          </div>
          <span className="text-[11px] text-slate-400 block pt-1">
            Equivale a: {formatFecha(params.fechaInicio, cuotaAdelanto).fechaLarga}
          </span>
        </div>

        {/* Estrategia de Impacto */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Estrategia de Aplicación
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEstrategia('reducir_cuota')}
              className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                estrategia === 'reducir_cuota'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className="text-[11px] leading-tight">Reducir Cuotas</div>
            </button>
            <button
              type="button"
              onClick={() => setEstrategia('acelerar')}
              className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                estrategia === 'acelerar'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className="text-[11px] leading-tight">Acelerar Posesión</div>
            </button>
          </div>
        </div>

      </div>

      {/* Resultados y Comparativa Visual del Impacto */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Impacto Proyectado en tu Plan Individual</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Cuota Mensual Actual</span>
            <div className="text-lg font-bold text-slate-300 font-mono">
              {fmtMoneda(cuotaPreAdelanto)}
            </div>
            <span className="text-[10px] text-slate-500">Sin inyección adicional</span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
            <span className="text-[11px] text-indigo-300 block">Nueva Cuota desde Mes #{cuotaAdelanto + 1}</span>
            <div className="text-xl font-extrabold text-white font-mono">
              {fmtMoneda(cuotaPostAdelanto)}
            </div>
            {reduccionCuota > 0 && (
              <span className="text-[11px] text-emerald-400 font-semibold block">
                ⬇️ Ahorro de {fmtMoneda(reduccionCuota)}/mes
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block">Mes Estimado de Posesión</span>
            <div className="text-lg font-bold text-sky-300 font-mono">
              Cuota #{flujoConAdelanto.cuotaPosesion}
            </div>
            <span className="text-[10px] text-slate-500 block">
              {formatFecha(params.fechaInicio, flujoConAdelanto.cuotaPosesion).fechaLarga}
            </span>
            {mesesReducidos > 0 && (
              <span className="text-[10px] text-emerald-400 font-bold block">
                ⚡ Anticipas {mesesReducidos} meses
              </span>
            )}
          </div>
        </div>

        {onOpenMensajes && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-400">
              ¿Listo para imputar este adelanto fiduciario?
            </span>
            <button
              onClick={onOpenMensajes}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Notificar Intención a la Administración</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

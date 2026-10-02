import React, { useState } from 'react';
import type { AjusteCuota } from '../types/fondo';
import { formatFecha, fmtMoneda } from '../utils/calculations';
import { TrendingUp, Plus, Trash2, AlertCircle, HelpCircle } from 'lucide-react';

interface AjustesMayoresCostosProps {
  ajustes: AjusteCuota[];
  cantidadCuotas: number;
  fechaInicio: string;
  costoDepto: number;
  onChangeAjustes: (nuevosAjustes: AjusteCuota[]) => void;
}

export const AjustesMayoresCostos: React.FC<AjustesMayoresCostosProps> = ({
  ajustes,
  cantidadCuotas,
  fechaInicio,
  costoDepto,
  onChangeAjustes
}) => {
  const [mesNuevo, setMesNuevo] = useState<number>(6);
  const [porcentajeNuevo, setPorcentajeNuevo] = useState<number>(10);
  const [motivoNuevo, setMotivoNuevo] = useState<string>('Aumento Materiales (Índice CAC / Cemento / Acero)');
  const [errorValidacion, setErrorValidacion] = useState<string>('');

  const cuotaBaseEstimada = cantidadCuotas > 0 ? costoDepto / cantidadCuotas : 0;

  // Calcular porcentaje acumulado compuesto
  const factorTotalAcumulado = ajustes.reduce((acc, aj) => acc * (1 + aj.porcentaje / 100), 1);
  const porcentajeTotalAcumulado = ((factorTotalAcumulado - 1) * 100).toFixed(1);

  const handleAgregarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion('');

    if (mesNuevo < 1 || mesNuevo > cantidadCuotas) {
      setErrorValidacion(`El mes debe estar entre 1 y ${cantidadCuotas}.`);
      return;
    }

    if (porcentajeNuevo <= 0 || porcentajeNuevo > 200) {
      setErrorValidacion('El porcentaje de incremento debe ser mayor a 0% y menor a 200%.');
      return;
    }

    const nuevoAjuste: AjusteCuota = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
      mes: mesNuevo,
      porcentaje: Math.round(porcentajeNuevo * 10) / 10,
      motivo: motivoNuevo.trim() || 'Ajuste por mayores costos',
      fechaAplicacion: formatFecha(fechaInicio, mesNuevo).fechaCorta
    };

    const nuevaLista = [...ajustes, nuevoAjuste].sort((a, b) => a.mes - b.mes);
    onChangeAjustes(nuevaLista);

    // Sugerir el siguiente semestre
    setMesNuevo(Math.min(cantidadCuotas, mesNuevo + 6));
  };

  const handleEliminarAjuste = (id: string) => {
    const filtrados = ajustes.filter((a) => a.id !== id);
    onChangeAjustes(filtrados);
  };

  const aplicarPlantillaPredefinida = (tipo: 'cac' | 'semestral' | 'tecnico') => {
    if (tipo === 'cac') {
      const aj: AjusteCuota = {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
        mes: 6,
        porcentaje: 8.5,
        motivo: 'Ajuste Índice CAC (Cámara Argentina de la Construcción)',
        fechaAplicacion: formatFecha(fechaInicio, 6).fechaCorta
      };
      onChangeAjustes([...ajustes.filter((a) => a.mes !== 6), aj].sort((a, b) => a.mes - b.mes));
    } else if (tipo === 'semestral') {
      const m1 = Math.min(6, cantidadCuotas);
      const m2 = Math.min(12, cantidadCuotas);
      const aj1: AjusteCuota = {
        id: 'aj-sem-1',
        mes: m1,
        porcentaje: 6.0,
        motivo: 'Readecuación Semestral 1 (Materiales y Mano de Obra)'
      };
      const aj2: AjusteCuota = {
        id: 'aj-sem-2',
        mes: m2,
        porcentaje: 5.5,
        motivo: 'Readecuación Semestral 2 (Gestión Técnica e Inflación)'
      };
      onChangeAjustes([aj1, aj2].sort((a, b) => a.mes - b.mes));
    } else if (tipo === 'tecnico') {
      const aj: AjusteCuota = {
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
        mes: 4,
        porcentaje: 5.0,
        motivo: 'Aprobación de Planos y Redeterminación de Gestión Técnica'
      };
      onChangeAjustes([...ajustes.filter((a) => a.mes !== 4), aj].sort((a, b) => a.mes - b.mes));
    }
  };

  return (
    <section
      id="seccionAjustes"
      className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 no-print transition-all"
    >
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Ajuste por Mayores Costos e Inflación Técnica
            </h2>
            <p className="text-xs text-slate-400">
              Redeterminación de precios de materiales, honorarios y gestión de obra al costo
            </p>
          </div>
        </div>

        {/* Badges de Resumen */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300">
            {ajustes.length} {ajustes.length === 1 ? 'Ajuste Activo' : 'Ajustes Activos'}
          </span>
          {ajustes.length > 0 && (
            <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
              +{porcentajeTotalAcumulado}% Acumulado
            </span>
          )}
        </div>
      </div>

      {/* Formulario para agregar nuevo ajuste */}
      <form
        onSubmit={handleAgregarAjuste}
        className="bg-slate-900/80 border border-slate-700/70 p-4 rounded-xl space-y-3"
      >
        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Programar Nuevo Incremento</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Mes de aplicación */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Mes de Aplicación:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={cantidadCuotas}
                value={mesNuevo}
                onChange={(e) => setMesNuevo(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-amber-500/30"
              />
              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap bg-slate-800/80 px-2 py-2 rounded border border-slate-700">
                {formatFecha(fechaInicio, mesNuevo).fechaCorta}
              </span>
            </div>
          </div>

          {/* Porcentaje de Incremento */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Incremento (%):
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="200"
                value={porcentajeNuevo}
                onChange={(e) => setPorcentajeNuevo(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg pl-3 pr-7 py-2 text-xs font-mono text-white outline-none focus:ring-1 focus:ring-amber-500/30 font-bold"
              />
              <span className="absolute right-2.5 top-2 text-xs text-slate-400 font-mono">%</span>
            </div>
          </div>

          {/* Motivo / Justificativo */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Motivo o Concepto Técnico:
            </label>
            <input
              type="text"
              value={motivoNuevo}
              onChange={(e) => setMotivoNuevo(e.target.value)}
              placeholder="Ej: Aumento CAC Materiales, Acero, Gestión Técnica"
              className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-amber-500/30"
            />
          </div>

          {/* Botón Agregar */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Aplicar</span>
            </button>
          </div>
        </div>

        {errorValidacion && (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs mt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorValidacion}</span>
          </div>
        )}
      </form>

      {/* Tabla de Ajustes Registrados */}
      {ajustes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Mes y Fecha</th>
                <th className="py-2.5 px-3 text-center text-amber-300">Aumento</th>
                <th className="py-2.5 px-3">Motivo / Concepto</th>
                <th className="py-2.5 px-3 text-right">Impacto Cuota Base</th>
                <th className="py-2.5 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
              {ajustes.map((aj, idx) => {
                const fecha = formatFecha(fechaInicio, aj.mes);
                // Calcular cuota aproximada resultante acumulada hasta este ajuste
                const factorHastaAqui = ajustes
                  .slice(0, idx + 1)
                  .reduce((acc, item) => acc * (1 + item.porcentaje / 100), 1);
                const cuotaProyectada = cuotaBaseEstimada * factorHastaAqui;

                return (
                  <tr key={aj.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      Mes {aj.mes}{' '}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({fecha.fechaCorta})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                      +{aj.porcentaje}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px]">
                      {aj.motivo || 'Ajuste de costos'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      ~ {fmtMoneda(cuotaProyectada)}/mes
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleEliminarAjuste(aj.id)}
                        title="Eliminar este ajuste"
                        className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-slate-700 p-4 rounded-xl text-center space-y-1">
          <p className="text-xs text-slate-300 font-medium">
            No hay aumentos por mayores costos configurados en este plan.
          </p>
          <p className="text-[11px] text-slate-500">
            Las cuotas se mantendrán fijas según el valor base inicial. Puedes programar un reajuste arriba o usar una plantilla rápida.
          </p>
        </div>
      )}

      {/* Plantillas Rápidas y Ayuda Conceptual */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-700/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 text-[11px] font-semibold">Plantillas Rápidas:</span>
          <button
            type="button"
            onClick={() => aplicarPlantillaPredefinida('cac')}
            className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-[11px] transition-colors"
          >
            +8.5% CAC (Mes 6)
          </button>
          <button
            type="button"
            onClick={() => aplicarPlantillaPredefinida('semestral')}
            className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-[11px] transition-colors"
          >
            Semestral (+6% Mes 6, +5.5% Mes 12)
          </button>
          <button
            type="button"
            onClick={() => aplicarPlantillaPredefinida('tecnico')}
            className="px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-[11px] transition-colors"
          >
            +5% Aprobación Técnica (Mes 4)
          </button>
          {ajustes.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeAjustes([])}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] transition-colors"
            >
              Restablecer (Sin Ajustes)
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fideicomiso al Costo Real • Art. 1666 CCCN</span>
        </div>
      </div>
    </section>
  );
};

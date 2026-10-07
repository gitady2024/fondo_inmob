import React, { useState } from 'react';
import { fmtMoneda } from '../utils/calculations';
import { Wallet, Sparkles, Divide, RotateCcw, Check } from 'lucide-react';
import { CurrencyInput } from './common/CurrencyInput';

interface MatrizAnticiposProps {
  cantidadSocios: number;
  anticipos: number[];
  onChangeAnticipo: (index: number, monto: number) => void;
  onSetAll: (monto: number) => void;
}

export const MatrizAnticipos: React.FC<MatrizAnticiposProps> = ({
  cantidadSocios,
  anticipos,
  onChangeAnticipo,
  onSetAll
}) => {
  const totalPozo = anticipos.slice(0, cantidadSocios).reduce((acc, curr) => acc + (curr || 0), 0);
  const [pozoObjetivo, setPozoObjetivo] = useState<number>(() => totalPozo > 0 ? totalPozo : 0);
  const [feedbackEquitativo, setFeedbackEquitativo] = useState<string | null>(null);

  const handleAplicarEquitativo = () => {
    // Si el usuario configuró un pozo objetivo o ya hay un pozo acumulado
    const basePozo = pozoObjetivo > 0 ? pozoObjetivo : totalPozo;
    if (basePozo <= 0 || cantidadSocios <= 0) return;

    const montoIndividual = Math.round(basePozo / cantidadSocios);
    onSetAll(montoIndividual);

    setFeedbackEquitativo(`Se distribuyeron ${fmtMoneda(montoIndividual)} por socio`);
    setTimeout(() => setFeedbackEquitativo(null), 3000);
  };

  return (
    <section className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-base font-bold text-emerald-300 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>Matriz de Anticipos Individuales (Mes 0)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa el monto que entrega cada socio antes del inicio de la primera cuota
          </p>
        </div>

        {/* Acciones Rápidas & Presets */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Pozo Objetivo Input & Botón Equitativo */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 p-1 rounded-xl">
            <span className="text-[11px] text-slate-400 font-semibold pl-2">Pozo Total:</span>
            <div className="w-28 sm:w-32">
              <CurrencyInput
                value={pozoObjetivo > 0 ? pozoObjetivo : totalPozo}
                onChange={(val) => setPozoObjetivo(val)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
            <button
              onClick={handleAplicarEquitativo}
              title="Divide el pozo total en partes iguales para todos los socios"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Divide className="w-3.5 h-3.5" />
              <span>Aplicar monto equitativo a todos</span>
            </button>
          </div>

          {/* Botón Limpiar */}
          <button
            onClick={() => {
              onSetAll(0);
              setPozoObjetivo(0);
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-700 hover:border-slate-600 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>

          {/* Total Pozo Card */}
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-sm ml-auto lg:ml-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Recaudado: {fmtMoneda(totalPozo)}</span>
          </div>
        </div>
      </div>

      {feedbackEquitativo && (
        <div className="flex items-center gap-2 p-2 bg-emerald-900/40 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{feedbackEquitativo}</span>
        </div>
      )}

      {/* Grid de Socios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
        {Array.from({ length: cantidadSocios }, (_, i) => {
          const valor = anticipos[i] || 0;
          return (
            <div
              key={i}
              className={`bg-slate-900/90 border ${
                valor > 0 ? 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-950/20' : 'border-slate-700/80'
              } p-3 rounded-xl transition-all shadow-sm hover:border-slate-600`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-indigo-300">Socio D{i + 1}</span>
                <span className="text-[10px] text-slate-400 font-mono">Mes 0</span>
              </div>
              <div className="relative">
                <CurrencyInput
                  id={`anticipo-socio-${i + 1}`}
                  value={valor}
                  onChange={(nuevoMonto) => onChangeAnticipo(i, nuevoMonto)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MatrizAnticipos;

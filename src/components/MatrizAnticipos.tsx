import React from 'react';
import { fmtMoneda } from '../utils/calculations';
import { Wallet, Sparkles } from 'lucide-react';

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

  return (
    <section className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-emerald-300 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span>Matriz de Anticipos Individuales (Mes 0)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa el monto que entrega cada socio antes del inicio de la primera cuota
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetAll(0)}
            className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
          >
            Limpiar
          </button>
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Pozo Inicial: {fmtMoneda(totalPozo)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
        {Array.from({ length: cantidadSocios }, (_, i) => {
          const valor = anticipos[i] || 0;
          return (
            <div
              key={i}
              className={`bg-slate-900/90 border ${
                valor > 0 ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-slate-700/80'
              } p-3 rounded-xl transition-all shadow-sm`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-indigo-300">Socio D{i + 1}</span>
                <span className="text-[10px] text-slate-400 font-mono">Mes 0</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={valor}
                  onChange={(e) => onChangeAnticipo(i, parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

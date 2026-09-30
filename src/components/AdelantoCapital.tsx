import type { AdelantoConfigState } from '../types/fondo';
import { formatFecha } from '../utils/calculations';
import { Zap } from 'lucide-react';


interface AdelantoCapitalProps {
  cantidadSocios: number;
  adelanto: AdelantoConfigState;
  fechaInicio: string;
  maxCuotas: number;
  onChange: (newAdelanto: Partial<AdelantoConfigState>) => void;
}

export const AdelantoCapital: React.FC<AdelantoCapitalProps> = ({
  cantidadSocios,
  adelanto,
  fechaInicio,
  maxCuotas,
  onChange
}) => {
  const fechaAdelanto = formatFecha(fechaInicio, adelanto.cuota);

  return (
    <section className="bg-indigo-950/30 border-2 border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 no-print transition-all">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Adelanto de Capital / Licitación Anticipada</h2>
            <p className="text-xs text-indigo-300">Inyección de capital para reducir cuota mensual o acortar plazo</p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/80 hover:border-indigo-500/50 transition-all">
          <input
            type="checkbox"
            checked={adelanto.activo}
            onChange={(e) => onChange({ activo: e.target.checked })}
            className="w-4 h-4 accent-indigo-500 cursor-pointer rounded"
          />
          <span className="text-xs text-slate-300 font-semibold">Activar Adelanto Voluntario</span>
        </label>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1 transition-all duration-300 ${
          adelanto.activo ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Socio que adelanta</label>
          <select
            value={adelanto.socioAdelanta}
            onChange={(e) => onChange({ socioAdelanta: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-medium"
          >
            {Array.from({ length: cantidadSocios }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Socio D{i + 1} (Depto {i + 1})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Monto Inyectado ($)</label>
          <input
            type="number"
            step="1000"
            value={adelanto.monto}
            onChange={(e) => onChange({ monto: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-mono font-semibold"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <label className="text-slate-300">¿En qué cuota?</label>
            <span className="text-emerald-400 font-bold font-mono">
              Cuota {adelanto.cuota} ({fechaAdelanto.fechaCorta})
            </span>
          </div>
          <input
            type="number"
            min="1"
            max={maxCuotas}
            value={adelanto.cuota}
            onChange={(e) => onChange({ cuota: parseInt(e.target.value) || 1 })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-mono font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Estrategia de Impacto</label>
          <select
            value={adelanto.estrategia}
            onChange={(e) => onChange({ estrategia: e.target.value as any })}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none font-medium"
          >
            <option value="reducir_cuota">Aliviar Cuota (Mismos meses, menor cuota)</option>
            <option value="acelerar">Acelerar Tiempo (Misma cuota, entrega antes)</option>
          </select>
        </div>
      </div>
    </section>
  );
};

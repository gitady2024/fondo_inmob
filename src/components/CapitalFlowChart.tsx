import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import type { FlujoSocioCalculado, FlujoMes } from '../types/fondo';
import { fmtMoneda, formatFecha } from '../utils/calculations';
import { BarChart3, Key, Loader2 } from 'lucide-react';

interface CapitalFlowChartProps {
  flujoSocio: FlujoSocioCalculado;
  fechaInicio: string;
  isCalculating?: boolean;
  costoDepto?: number;
}

export const CapitalFlowChart: React.FC<CapitalFlowChartProps> = ({
  flujoSocio,
  fechaInicio,
  isCalculating = false
}) => {
  const [metricView, setMetricView] = useState<'acumulado' | 'mensual'>('acumulado');

  // Preparar datos para Recharts
  const chartData = useMemo(() => {
    if (!flujoSocio || !flujoSocio.flujo) return [];

    return flujoSocio.flujo.map((m: FlujoMes) => {
      const { fechaCorta } = formatFecha(fechaInicio, m.mes);
      return {
        mes: m.mes,
        mesLabel: `M${m.mes}`,
        fechaLabel: fechaCorta,
        abonadoMes: Math.round(m.abonadoMes),
        capitalAbonadoAcumulado: Math.round(m.totalAcumulado),
        saldoRemanente: Math.round(m.saldoRemanente),
        isPosesion: m.mes === flujoSocio.cuotaPosesion
      };
    });
  }, [flujoSocio, fechaInicio]);

  const mesPosesion = flujoSocio?.cuotaPosesion || 0;

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800 text-white font-bold">
            <span>Mes {dataPoint.mes} ({dataPoint.fechaLabel})</span>
            {dataPoint.isPosesion && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1 font-sans">
                <Key className="w-3 h-3" /> Posesión
              </span>
            )}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span style={{ color: entry.color }} className="flex items-center gap-1 font-medium font-sans">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="text-white font-bold">{fmtMoneda(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section
      id="grafico-flujo-capital"
      className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 no-print transition-all duration-300 ${
        isCalculating ? 'opacity-60 blur-[0.6px]' : 'opacity-100'
      }`}
    >
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Curva de Capital y Amortización Financiera</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evolución del capital aportado frente al saldo deudor hasta la cancelación
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCalculating && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Actualizando gráfico...</span>
            </div>
          )}

          {/* Toggle View */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setMetricView('acumulado')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                metricView === 'acumulado'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acumulado vs. Saldo
            </button>
            <button
              onClick={() => setMetricView('mensual')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                metricView === 'mensual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cuota Mensual
            </button>
          </div>
        </div>
      </div>

      {/* Main Responsive Chart */}
      <div className="w-full h-72 sm:h-80 md:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#6366f1" stopOpacity={0.9} />
                <stop offset="100%" stop-color="#4338ca" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="lineRemanente" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f43f5e" stopOpacity={0.9} />
                <stop offset="100%" stop-color="#be123c" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

            <XAxis
              dataKey="mesLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 12))}
            />

            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              iconType="circle"
            />

            {/* Hito de Posesión (Línea de Referencia Vertical) */}
            {mesPosesion > 0 && mesPosesion <= chartData.length && (
              <ReferenceLine
                x={`M${mesPosesion}`}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={{
                  value: `🔑 Posesión (Mes ${mesPosesion})`,
                  position: 'insideTopRight',
                  fill: '#fbbf24',
                  fontSize: 11,
                  fontWeight: 'bold',
                  offset: 10
                }}
              />
            )}

            {metricView === 'acumulado' ? (
              <>
                <Bar
                  dataKey="capitalAbonadoAcumulado"
                  name="Capital Integrado Acumulado"
                  fill="url(#barGrad)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="saldoRemanente"
                  name="Saldo Deudor Restante"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="abonadoMes"
                  name="Cuota Mensual Total"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Line
                  type="monotone"
                  dataKey="capitalAbonadoAcumulado"
                  name="Capital Integrado Acumulado"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Indicators / Footnote */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
            <span>Capital Integrado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Saldo Remanente</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Hito de Adjudicación / Posesión</span>
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Total de Cuotas del Modelo: <strong className="text-white">{chartData.length}</strong>
        </div>
      </div>
    </section>
  );
};

export default CapitalFlowChart;

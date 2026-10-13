import { fmtMoneda } from '../../utils/calculations';
import { Key, CheckCircle2, MapPin, Sparkles, Calendar } from 'lucide-react';

export interface ResumenMesCardItem {
  mes: number;
  esMesCero?: boolean;
  fechaCorta: string;
  concepto: string;
  abonadoMes: number;
  totalAcumulado: number;
  saldoRemanente: number;
  isPosesion?: boolean;
  isCancelado?: boolean;
  isMesActual?: boolean;
  porcentajeAjuste?: number;
  motivoAjuste?: string;
}

interface MobileCardsListProps {
  items: ResumenMesCardItem[];
}

export const ResumenMesCard: React.FC<{ item: ResumenMesCardItem }> = ({ item }) => {
  let cardBorder = 'border-slate-800 bg-slate-900/90';
  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';

  if (item.isCancelado) {
    cardBorder = 'border-emerald-500/50 bg-emerald-950/20 shadow-emerald-950/20';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (item.isPosesion) {
    cardBorder = 'border-amber-500/50 bg-amber-950/20 shadow-amber-950/20';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (item.isMesActual) {
    cardBorder = 'border-indigo-500/50 bg-indigo-950/20 shadow-indigo-950/20';
    badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
  } else if (item.esMesCero) {
    cardBorder = 'border-emerald-500/30 bg-emerald-950/10';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }

  return (
    <article
      aria-label={`Detalle de cuota mes ${item.mes}`}
      className={`border rounded-xl p-4 shadow-sm transition-all space-y-3 ${cardBorder}`}
    >
      {/* Header: Mes, Fecha e Hito */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-white font-mono">
            {item.esMesCero ? 'Mes 0 (Anticipo)' : `Cuota ${item.mes}`}
          </span>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {item.fechaCorta}
          </span>
        </div>

        {/* Badge de Hito */}
        {item.isCancelado ? (
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${badgeColor}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cancelado 100%
          </span>
        ) : item.isPosesion ? (
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${badgeColor}`}>
            <Key className="w-3 h-3 text-amber-400" /> Posesión / Llaves
          </span>
        ) : item.isMesActual ? (
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${badgeColor}`}>
            <MapPin className="w-3 h-3 text-indigo-400" /> Mes Actual
          </span>
        ) : item.esMesCero ? (
          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${badgeColor}`}>
            <Sparkles className="w-3 h-3 text-emerald-400" /> Anticipo Inicial
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">Devengado</span>
        )}
      </div>

      {/* Concepto Liquidado */}
      <div className="text-xs text-slate-300 font-medium">
        <span className="text-slate-400 text-xs block mb-0.5">Concepto liquidado:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>{item.concepto}</span>
          {item.porcentajeAjuste && (
            <span
              className="px-1.5 py-0.2 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold tabular-nums"
              title={item.motivoAjuste}
            >
              +{item.porcentajeAjuste}% CAC
            </span>
          )}
        </div>
      </div>

      {/* Grid de Valores Clave */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs font-mono tabular-nums">
        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 block font-sans">Abonado Mes</span>
          <span className="text-xs font-bold text-indigo-300 block mt-0.5">
            {fmtMoneda(item.abonadoMes)}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 block font-sans">Acumulado</span>
          <span className="text-xs font-bold text-emerald-300 block mt-0.5">
            {fmtMoneda(item.totalAcumulado)}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 block font-sans">Saldo Restante</span>
          <span className="text-xs font-bold text-slate-300 block mt-0.5">
            {fmtMoneda(item.saldoRemanente)}
          </span>
        </div>
      </div>
    </article>
  );
};

export const MobileCardsList: React.FC<MobileCardsListProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="lg:hidden p-6 text-center text-slate-400 text-xs bg-slate-900/60 rounded-xl border border-slate-800">
        No hay cuotas para mostrar en este filtro.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:hidden space-y-3 pt-2">
      {items.map((item) => (
        <ResumenMesCard key={item.esMesCero ? 'mes-0' : `mes-${item.mes}`} item={item} />
      ))}
    </div>
  );
};

export default MobileCardsList;

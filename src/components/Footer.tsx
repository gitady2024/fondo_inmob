import React from 'react';
import { ShieldCheck, Building2, Scale, FileText, ExternalLink, Lock } from 'lucide-react';

interface FooterProps {
  onOpenContrato?: () => void;
  onOpenPersistencia?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContrato, onOpenPersistencia }) => {
  return (
    <footer className="mt-16 pt-8 pb-12 border-t border-slate-800/80 bg-slate-950/60 text-slate-400 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Top Badges & Security Seals */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide">Fondo Inmobiliario</span>
              <span className="text-xs text-indigo-400 block sm:inline sm:ml-2 font-mono">v1.4 • Círculos de Ahorro Mutuo</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conexión Cifrada</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Marco Jurídico CCCN</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Fideicomiso al Costo</span>
            </div>
          </div>
        </div>

        {/* Quick Links / Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {onOpenContrato && (
              <button
                onClick={onOpenContrato}
                className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Modelo de Contrato Marco</span>
              </button>
            )}
            {onOpenPersistencia && (
              <button
                onClick={onOpenPersistencia}
                className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Base de Datos & Nube Supabase</span>
              </button>
            )}
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            © {new Date().getFullYear()} Plataforma Fiduciaria Inmobiliaria. República Argentina.
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 sm:p-5">
          <p className="text-xs text-gray-500 leading-relaxed text-justify sm:text-left">
            <strong className="text-slate-400 font-semibold">Disclaimer:</strong> Esta simulación es de carácter estrictamente orientativo y no constituye una oferta vinculante ni un contrato. Los cálculos de cuota pura, ajustes y posesión son estimaciones basadas en los parámetros ingresados. El funcionamiento definitivo del fondo está sujeto a los contratos de fiducia/mutuo y a la normativa de la IGJ, CNV y/o BCRA correspondiente.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

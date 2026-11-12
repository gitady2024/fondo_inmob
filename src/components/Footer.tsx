import React from 'react';
import { ShieldCheck, Scale, FileText, ExternalLink, Lock } from 'lucide-react';

interface FooterProps {
  onOpenContrato?: () => void;
  onOpenPersistencia?: () => void;
  onOpenAccesoPrivado?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenContrato, 
  onOpenPersistencia,
  onOpenAccesoPrivado 
}) => {
  return (
    <footer className="mt-16 pt-8 pb-12 border-t border-slate-800/80 bg-slate-950/60 text-slate-400 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Top Badges & Security Seals */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <img
              src="/isologo-fondin.png"
              alt="Inverfondo"
              className="h-8 w-8 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-tight leading-none">Inverfondo</span>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5">Inversión Fiduciaria Inmobiliaria</span>
            </div>
            <span className="text-xs text-indigo-400 font-mono hidden sm:inline ml-2">• v1.4 • Círculos de Ahorro Mutuo</span>
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
                type="button"
                onClick={onOpenContrato}
                className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Modelo de Contrato Marco</span>
              </button>
            )}
            {onOpenPersistencia && (
              <button
                type="button"
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
          <p className="text-xs text-slate-400 leading-relaxed text-justify sm:text-left">
            <strong className="text-slate-300 font-semibold">Disclaimer:</strong> Esta simulación es de carácter estrictamente orientativo y no constituye una oferta vinculante ni un contrato. Los cálculos de cuota pura, ajustes y posesión son estimaciones basadas en los parámetros ingresados. El funcionamiento definitivo del fondo está sujeto a los contratos de fiducia/mutuo y a la normativa de la IGJ, CNV y/o BCRA correspondiente.
          </p>
        </div>

        {/* ======================================================================= */}
        {/* LOGIN DISCRETO: ACCESO PARA ADMINISTRADORES, TÉCNICOS Y SOCIOS         */}
        {/* ======================================================================= */}
        {onOpenAccesoPrivado && (
          <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Portal Privado de Gestión Fiduciaria</span>
            </div>
            <button
              type="button"
              id="footer-login-link"
              onClick={onOpenAccesoPrivado}
              className="text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 font-medium cursor-pointer py-1 px-3 rounded-lg hover:bg-slate-900 border border-slate-800/60 hover:border-indigo-500/30"
            >
              <span>Acceso Administradores, Técnicos y Socios Adjudicados →</span>
            </button>
          </div>
        )}

      </div>
    </footer>
  );
};

export default Footer;

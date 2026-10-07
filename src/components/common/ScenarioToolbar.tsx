import React, { useState } from 'react';
import { Share2, FileDown, FileSpreadsheet, Printer, Loader2, Check } from 'lucide-react';

interface ScenarioToolbarProps {
  onShare: () => void;
  onExportPDF: () => Promise<void> | void;
  onExportCSV: () => void;
  onPrint?: () => void;
  isSharing?: boolean;
}

export const ScenarioToolbar: React.FC<ScenarioToolbarProps> = ({
  onShare,
  onExportPDF,
  onExportCSV,
  onPrint,
  isSharing = false
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [justShared, setJustShared] = useState<boolean>(false);

  const handleShareClick = () => {
    onShare();
    setJustShared(true);
    setTimeout(() => setJustShared(false), 2500);
  };

  const handlePDFClick = async () => {
    try {
      setIsExportingPDF(true);
      await onExportPDF();
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl shadow-lg no-print">
      {/* Botón Compartir Escenario */}
      <button
        type="button"
        onClick={handleShareClick}
        disabled={isSharing}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
          justShared
            ? 'bg-emerald-600 text-white shadow-emerald-900/40'
            : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-900/40'
        }`}
        title="Copiar URL con parámetros del escenario actual al portapapeles"
      >
        {justShared ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
        <span>{justShared ? 'Link Copiado' : 'Compartir Escenario'}</span>
      </button>

      {/* Botón Descargar PDF */}
      <button
        type="button"
        onClick={handlePDFClick}
        disabled={isExportingPDF}
        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
        title="Descargar Reporte Ejecutivo en formato PDF no modificable"
      >
        {isExportingPDF ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        ) : (
          <FileDown className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>{isExportingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
      </button>

      {/* Botón Exportar CSV */}
      <button
        type="button"
        onClick={onExportCSV}
        className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        title="Exportar datos numéricos a planilla Excel / CSV"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Exportar CSV</span>
        <span className="sm:hidden">CSV</span>
      </button>

      {/* Botón Imprimir */}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          title="Imprimir vista del simulador"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Imprimir</span>
        </button>
      )}
    </div>
  );
};

export default ScenarioToolbar;

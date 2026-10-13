import React from 'react';
import { Sparkles, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';

export type FilterMode = 'hitos' | 'todo';

interface SmartFiltersProps {
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems: number;
  showingCount: number;
}

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  filterMode,
  onFilterModeChange,
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  showingCount
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/90 border border-slate-700/80 p-3 rounded-xl shadow-sm no-print">
      
      {/* Pills de Filtrado Inteligente */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
          <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vista:</span>
        </span>

        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFilterModeChange('hitos')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'hitos'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Ver solo Hitos Clave</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterModeChange('todo')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'todo'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Ver todo ({totalItems} cuotas)</span>
          </button>
        </div>
      </div>

      {/* Paginador (Visible solo si está en modo 'todo' y hay más de 1 página) */}
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
        <span className="text-xs text-slate-400 font-mono tabular-nums">
          Mostrando <strong className="text-white">{showingCount}</strong> cuotas
        </span>

        {filterMode === 'todo' && totalPages > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              type="button"
              id="btn-filter-prev-page"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Ir a página anterior"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-xs text-slate-300 font-mono tabular-nums px-1">
              Pág. {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              id="btn-filter-next-page"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Ir a página siguiente"
              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default SmartFilters;

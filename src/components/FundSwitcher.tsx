import React, { useState, useRef, useEffect } from 'react';
import type { FondoGuardado } from '../services/fondoService';
import { fmtMoneda } from '../utils/calculations';
import {
  Building2,
  ChevronDown,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Check,
  Layers
} from 'lucide-react';



interface FundSwitcherProps {
  currentFondo: FondoGuardado;
  fondosList: FondoGuardado[];
  onSelectFondo: (id: string) => void;
  onOpenNewModal: () => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export const FundSwitcher: React.FC<FundSwitcherProps> = ({
  currentFondo,
  fondosList,
  onSelectFondo,
  onOpenNewModal,
  onDuplicate,
  onRename,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentFondo.nombre);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempName(currentFondo.nombre);
  }, [currentFondo.nombre]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = () => {
    if (tempName.trim() && tempName.trim() !== currentFondo.nombre) {
      onRename(currentFondo.id, tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setTempName(currentFondo.nombre);
      setIsEditingName(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg backdrop-blur-md relative no-print mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3.5">
        
        {/* Selector de Plan Activo */}
        <div className="flex flex-wrap items-center gap-3 relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Plan Activo:
            </span>
          </div>

          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-slate-950 border border-indigo-500 rounded-xl px-3 py-1.5 text-sm text-white font-bold outline-none"
              />
              <button
                onClick={handleSaveName}
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg text-xs"
                title="Guardar nombre"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-indigo-500/50 px-3.5 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2.5 transition-all shadow-sm group"
              >
                <Building2 className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                <span className="truncate max-w-[240px] sm:max-w-[320px]">{currentFondo.nombre}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menú Desplegable */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex justify-between items-center">
                    <span>Tus Fondos y Simulaciones ({fondosList.length})</span>
                    <span className="text-[10px] text-indigo-400">Clic para cambiar</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1 space-y-1">
                    {fondosList.map((f) => {
                      const isCurrent = f.id === currentFondo.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            onSelectFondo(f.id);
                            setIsOpen(false);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                            isCurrent
                              ? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
                              : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <strong className="text-xs block">{f.nombre}</strong>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {f.params.cantidadDeptos} Unid. • {f.params.cantidadCuotas} Cuotas • {fmtMoneda(f.params.costoDepto)}
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">
                              Activo
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenNewModal();
                      }}
                      className="w-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear Nuevo Plan o Fondo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chips de resumen rápido */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300">
            <span className="text-indigo-400 font-bold">{currentFondo.params.cantidadDeptos} Socios</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300 font-bold">{currentFondo.params.cantidadCuotas} Cuotas</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-bold">{fmtMoneda(currentFondo.params.costoDepto)}/u</span>
          </div>
        </div>

        {/* Acciones Rápidas del Plan */}
        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          <button
            onClick={() => setIsEditingName(true)}
            title="Renombrar plan actual"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Renombrar</span>
          </button>

          <button
            onClick={() => onDuplicate(currentFondo.id)}
            title="Duplicar este plan para probar otro escenario"
            className="px-3 py-2 text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-600/40 border border-indigo-500/40 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicar Escenario</span>
          </button>

          <button
            onClick={onOpenNewModal}
            title="Crear un plan nuevo"
            className="px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Plan</span>
          </button>

          {fondosList.length > 1 && (
            <button
              onClick={() => {
                if (window.confirm(`¿Estás seguro de eliminar el plan "${currentFondo.nombre}"?`)) {
                  onDelete(currentFondo.id);
                }
              }}
              title="Eliminar este plan"
              className="p-2 text-rose-400 hover:text-rose-200 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/30 rounded-xl transition-colors text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

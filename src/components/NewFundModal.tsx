import React, { useState } from 'react';
import { PLANTILLAS_PREDEFINIDAS } from '../services/fondoService';
import { fmtMoneda } from '../utils/calculations';
import { Building2, Plus, X, Check } from 'lucide-react';


interface NewFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromTemplate: (templateIndex: number, customName: string) => void;
  onCreateBlank: (name: string) => void;
}

export const NewFundModal: React.FC<NewFundModalProps> = ({
  isOpen,
  onClose,
  onCreateFromTemplate,
  onCreateBlank
}) => {
  const [selectedType, setSelectedType] = useState<number | 'blank'>(0);
  const [nombre, setNombre] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    const finalName = nombre.trim() || (selectedType === 'blank' ? 'Nuevo Fondo Inmobiliario' : PLANTILLAS_PREDEFINIDAS[selectedType as number].nombre);
    if (selectedType === 'blank') {
      onCreateBlank(finalName);
    } else {
      onCreateFromTemplate(selectedType as number, finalName);
    }
    onClose();
    setNombre('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Crear Nuevo Plan o Fondo</h3>
              <p className="text-xs text-slate-400">Selecciona una plantilla base o inicia una configuración personalizada</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre del Plan o Fideicomiso</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Fideicomiso Torre Bellini, Complejo Los Álamos..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">Elige la estructura inicial del plan:</span>
            
            <div className="grid grid-cols-1 gap-2.5">
              {PLANTILLAS_PREDEFINIDAS.map((tpl, idx) => {
                const isSelected = selectedType === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedType(idx)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-white">{tpl.nombre}</strong>
                        <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700 font-mono">
                          {tpl.params.cantidadDeptos} Unidades • {tpl.params.cantidadCuotas} Cuotas
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{tpl.descripcion}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Valor Unidad: {fmtMoneda(tpl.params.costoDepto)} | Cuota Pura: {fmtMoneda(tpl.params.valorCuotaBase)}/mes
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}

              {/* Opción en Blanco */}
              <div
                onClick={() => setSelectedType('blank')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                  selectedType === 'blank'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <strong className="text-xs text-white block">Plan en Blanco (Personalizado)</strong>
                  <p className="text-[11px] text-slate-400">Inicia con parámetros por defecto para configurar desde cero a tu medida.</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedType === 'blank' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-700'
                }`}>
                  {selectedType === 'blank' && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

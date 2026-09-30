import React, { useState } from 'react';
import type { ParametrosFondoState, GastosConfigState } from '../types/fondo';
import type { DatosTecnicosProyecto } from '../types/tecnico';
import type { UserProfile } from '../types/auth';
import {
  obtenerTextoContrato,
  descargarContratoPDF
} from '../utils/contractGenerator';
import {
  Download,
  Printer,
  Copy,
  Check,
  X,
  Shield,
  User,
  HardHat,
  Building2,
  ScrollText
} from 'lucide-react';

interface ContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  fondoNombre: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  anticipos: number[];
  datosTecnicos?: DatosTecnicosProyecto;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({
  isOpen,
  onClose,
  user,
  fondoNombre,
  params,
  gastos,
  anticipos,
  datosTecnicos
}) => {
  const initialSocioId = user.role === 'socio' && user.socioId ? user.socioId : 1;
  const [selectedSocioId, setSelectedSocioId] = useState<number>(initialSocioId);
  const [nombrePersonalizado, setNombrePersonalizado] = useState<string>('');
  const [dniPersonalizado, setDniPersonalizado] = useState<string>('');
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const currentSocioId = user.role === 'socio' && user.socioId ? user.socioId : selectedSocioId;
  const anticipoSocio = anticipos[currentSocioId - 1] || 0;

  const contratoInput = {
    fondoNombre,
    params,
    gastos,
    socioId: currentSocioId,
    datosTecnicos,
    anticipoSocio,
    nombreSocio: nombrePersonalizado.trim() || undefined,
    dniSocio: dniPersonalizado.trim() || undefined
  };

  const contratoData = obtenerTextoContrato(contratoInput);

  const handleDescargarPDF = () => {
    descargarContratoPDF(contratoInput);
  };

  const handleCopiarTexto = () => {
    const fullText = `
${contratoData.titulo}

==================================================
PARTES COMPARECIENTES:
==================================================
1. ${contratoData.partes.admin}

2. ${contratoData.partes.socio}

3. ${contratoData.partes.tecnico}

==================================================
CLÁUSULAS CONTRACTUALES:
==================================================
${contratoData.clausulas.map((c) => `CLÁUSULA ${c.numero}: ${c.titulo.toUpperCase()}\n${c.contenido}`).join('\n\n')}

${contratoData.fechaTexto}

_____________________________        _____________________________        _____________________________
Por la Administración Fiduciaria      Por el Socio Adjudicatario D${currentSocioId}        Por el Equipo Técnico y Obra
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Contrato Tripartito de Fideicomiso</h3>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Arts. 1666 CCCN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fiduciaria Administradora • Socio Aportante • Dirección Técnica de Obra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleDescargarPDF}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Descargar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Controles y Selector de Socio */}
        <div className="bg-slate-950/80 border-b border-slate-800 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Unidad / Socio Destinatario
            </label>
            {user.role === 'socio' ? (
              <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold">
                Socio D{user.socioId} (Tu Unidad Adjudicada)
              </div>
            ) : (
              <select
                value={selectedSocioId}
                onChange={(e) => setSelectedSocioId(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-bold outline-none"
              >
                {Array.from({ length: params.cantidadDeptos }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Socio D{i + 1} • Departamento {i + 1} (Anticipo: {anticipos[i] ? `$${anticipos[i]}` : '$0'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Nombre / Titular (Opcional)
            </label>
            <input
              type="text"
              value={nombrePersonalizado}
              onChange={(e) => setNombrePersonalizado(e.target.value)}
              placeholder={`Ej: Juan Pérez (Dpto ${currentSocioId})`}
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              DNI / CUIT Titular (Opcional)
            </label>
            <input
              type="text"
              value={dniPersonalizado}
              onChange={(e) => setDniPersonalizado(e.target.value)}
              placeholder="Ej: DNI 32.456.789 / CUIT..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Cuerpo del Contrato (Visualizador con formato legal) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/40 text-slate-300">
          
          {/* Tarjetas de las 3 partes firmantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Shield className="w-4 h-4" />
                <span>1. Administración Fiduciaria</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Custodia y administración patrimonial, compras por acopio y convocatorias de adjudicación.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <User className="w-4 h-4" />
                <span>2. Socio Aportante D{currentSocioId}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Titular de la Unidad Funcional {currentSocioId}. Aporte de cuotas, posesión y cesión CCCN.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <HardHat className="w-4 h-4" />
                <span>3. Equipo Técnico y Obra</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Dirección ejecutiva, cálculo de H°A°, gestiones públicas y certificación mensual de avance.
              </p>
            </div>
          </div>

          {/* Documento Formal */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6 shadow-inner text-xs sm:text-sm font-serif leading-relaxed">
            
            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-indigo-400 block">
                Instrumento Jurídico Privado con Validez Fiduciaria
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {contratoData.titulo}
              </h2>
            </div>

            {/* Comparecientes */}
            <div className="space-y-3 font-sans text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <strong className="text-slate-200 block text-xs tracking-wider uppercase font-mono">
                Comparecencia de Partes:
              </strong>
              <p className="text-slate-300">
                <strong className="text-white">a) </strong>{contratoData.partes.admin}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">b) </strong>{contratoData.partes.socio}
              </p>
              <p className="text-slate-300">
                <strong className="text-white">c) </strong>{contratoData.partes.tecnico}
              </p>
            </div>

            {/* Cláusulas */}
            <div className="space-y-5 pt-2">
              {contratoData.clausulas.map((c) => (
                <div key={c.numero} className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-sans font-bold text-amber-300 uppercase tracking-wide">
                    CLÁUSULA {c.numero}: {c.titulo}
                  </h4>
                  <p className="text-slate-300 text-justify text-xs sm:text-sm">
                    {c.contenido}
                  </p>
                </div>
              ))}
            </div>

            {/* Fecha y Cierre */}
            <div className="pt-4 border-t border-slate-800 font-sans text-xs text-slate-400 italic">
              {contratoData.fechaTexto}
            </div>

            {/* Cuadros de Firmas */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans text-center text-xs">
              <div className="space-y-2 pt-8 border-t border-slate-700">
                <strong className="block text-white">Por la Fiduciaria</strong>
                <span className="text-[10px] text-slate-500 block">Firma y Sello Representante Legal</span>
              </div>
              <div className="space-y-2 pt-8 border-t border-slate-700">
                <strong className="block text-white">Por el Socio D{currentSocioId}</strong>
                <span className="text-[10px] text-slate-500 block">Titular Adjudicatario Unidad {currentSocioId}</span>
              </div>
              <div className="space-y-2 pt-8 border-t border-slate-700">
                <strong className="block text-white">Por el Equipo Técnico</strong>
                <span className="text-[10px] text-slate-500 block">Dirección de Obra y Matrícula</span>
              </div>
            </div>

          </div>

        </div>

        {/* Barra de Acciones Inferior */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap justify-between items-center gap-3">
          <button
            onClick={handleCopiarTexto}
            className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? '¡Texto Copiado al Portapapeles!' : 'Copiar Texto Completo'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDescargarPDF}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Contrato en PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

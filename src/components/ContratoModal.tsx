import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import mammoth from 'mammoth';
import type { ParametrosFondoState, GastosConfigState } from '../types/fondo';
import type { DatosTecnicosProyecto } from '../types/tecnico';
import type { UserProfile } from '../types/auth';
import {
  obtenerTextoDefaultContrato,
  aplicarVariablesContrato,
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
  ScrollText,
  Edit3,
  Eye,
  Trash2,
  Upload,
  RotateCcw,
  Save,
  Tag,
  FileCheck
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
  contratoPersonalizado?: string;
  onSaveContrato?: (nuevoTexto: string) => void;
}

export const ContratoModal: React.FC<ContratoModalProps> = ({
  isOpen,
  onClose,
  user,
  fondoNombre,
  params,
  gastos,
  anticipos,
  datosTecnicos,
  contratoPersonalizado,
  onSaveContrato
}) => {
  const initialSocioId = user.role === 'socio' && user.socioId ? user.socioId : 1;
  const [selectedSocioId, setSelectedSocioId] = useState<number>(initialSocioId);
  const [nombrePersonalizado, setNombrePersonalizado] = useState<string>('');
  const [dniPersonalizado, setDniPersonalizado] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [modo, setModo] = useState<'vista' | 'edicion'>('vista');
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  // Estado del texto en el editor
  const [textoEditor, setTextoEditor] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inicializar texto del editor con el contrato personalizado del proyecto o con la plantilla estándar
  useEffect(() => {
    if (contratoPersonalizado && contratoPersonalizado.trim()) {
      setTextoEditor(contratoPersonalizado);
    } else {
      const defaultText = obtenerTextoDefaultContrato({
        fondoNombre,
        params,
        gastos,
        socioId: selectedSocioId,
        datosTecnicos,
        anticipoSocio: anticipos[selectedSocioId - 1] || 0
      });
      setTextoEditor(defaultText);
    }
  }, [contratoPersonalizado, fondoNombre, isOpen]);

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
    dniSocio: dniPersonalizado.trim() || undefined,
    contratoPersonalizado: contratoPersonalizado || (textoEditor.trim() ? textoEditor : undefined)
  };

  const tieneContratoPropio = Boolean(contratoPersonalizado && contratoPersonalizado.trim());

  // Descarga del PDF
  const handleDescargarPDF = () => {
    descargarContratoPDF({
      ...contratoInput,
      contratoPersonalizado: textoEditor.trim() ? textoEditor : undefined
    });
  };

  // Guardar en el fondo activo
  const handleGuardarCambios = () => {
    if (onSaveContrato) {
      onSaveContrato(textoEditor);
      setMensajeGuardado(true);
      setTimeout(() => setMensajeGuardado(false), 2500);
      setModo('vista');
    }
  };

  // Vaciar completamente el editor para escribir o pegar desde cero
  const handleVaciarEditor = () => {
    if (confirm('¿Deseas vaciar todo el texto del contrato para escribir o pegar el tuyo propio?')) {
      setTextoEditor('');
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // Restaurar plantilla predeterminada del sistema
  const handleRestaurarDefault = () => {
    if (confirm('¿Restablecer el texto con la plantilla modelo del sistema?')) {
      const defaultText = obtenerTextoDefaultContrato({
        fondoNombre,
        params,
        gastos,
        socioId: currentSocioId,
        datosTecnicos,
        anticipoSocio
      });
      setTextoEditor(defaultText);
    }
  };

  // Cargar archivo desde la computadora (.docx, .txt, .md, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const nombreArchivo = file.name.toLowerCase();

    // 1. Archivos Microsoft Word .docx
    if (nombreArchivo.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result && result.value) {
          setTextoEditor(result.value.trim());
          setModo('edicion');
        } else {
          alert('El archivo .docx no contiene texto legible.');
        }
      } catch (err) {
        console.error('Error al procesar archivo .docx:', err);
        alert('No se pudo procesar el archivo .docx. Asegúrate de que no esté protegido con contraseña.');
      }
      e.target.value = '';
      return;
    }

    // 2. Archivos de texto plano (.txt, .md, etc.)
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setTextoEditor(content.trim());
        setModo('edicion');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Insertar etiqueta dinámica en la posición del cursor
  const handleInsertarTag = (tag: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textoEditor;
    const nuevoTexto = text.substring(0, start) + tag + text.substring(end);
    setTextoEditor(nuevoTexto);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 50);
  };

  // Copiar al portapapeles
  const handleCopiarTexto = () => {
    const textoFinal = aplicarVariablesContrato(
      textoEditor.trim() ? textoEditor : obtenerTextoDefaultContrato(contratoInput),
      contratoInput
    );
    navigator.clipboard.writeText(textoFinal);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // Texto a mostrar en la pestaña de visualización
  const textoVisualizado = aplicarVariablesContrato(
    textoEditor.trim() ? textoEditor : obtenerTextoDefaultContrato(contratoInput),
    contratoInput
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Contrato Tripartito Oficial</h3>
                {tieneContratoPropio ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Contrato Propio Personalizado
                  </span>
                ) : (
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Plantilla del Sistema
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Fiduciaria • Socio Aportante D{currentSocioId} • Equipo Técnico Responsable
              </p>
            </div>
          </div>

          {/* Selector de Modo: Vista vs Edición */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setModo('vista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  modo === 'vista'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa</span>
              </button>

              {user.role !== 'socio' && (
                <button
                  onClick={() => setModo('edicion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    modo === 'edicion'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modificar Contrato</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PESTAÑA 1: MODO VISUALIZACIÓN Y DESCARGA                            */}
        {/* ------------------------------------------------------------------ */}
        {modo === 'vista' ? (
          <>
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

            {/* Visualizador de Contrato */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/40 text-slate-300">
              
              {/* Tarjetas informativas de las 3 partes */}
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

              {/* Contenido del Contrato formateado para lectura */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 shadow-inner text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-line text-slate-200">
                {textoVisualizado}

                {/* Bloque de Firmas al pie del documento */}
                <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans text-center text-xs">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopiarTexto}
                  className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiado ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
                </button>

                {user.role !== 'socio' && (
                  <button
                    onClick={() => setModo('edicion')}
                    className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-amber-950/30 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Editar Contrato</span>
                  </button>
                )}
              </div>

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
                  <span>Descargar en PDF</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ------------------------------------------------------------------ */
          /* PESTAÑA 2: MODO EDITOR LIBRE / SUBIR CONTRATO PROPIO                */
          /* ------------------------------------------------------------------ */
          <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 overflow-y-auto bg-slate-950/60">
            
            {/* Barra de herramientas del Editor */}
            <div className="flex flex-wrap justify-between items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Botón para subir archivo desde la computadora */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".docx,.txt,.md"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                  title="Cargar texto desde archivo Word (.docx) o texto (.txt, .md)"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Archivo (.docx / .txt)</span>
                </button>

                {/* Botón para vaciar / borrar todo el texto */}
                <button
                  type="button"
                  onClick={handleVaciarEditor}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  title="Vaciar todo el texto actual para empezar desde cero"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar / Borrar Texto</span>
                </button>

                {/* Botón para restaurar plantilla del sistema */}
                <button
                  type="button"
                  onClick={handleRestaurarDefault}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                  title="Recuperar la plantilla base"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Plantilla Base</span>
                </button>
              </div>

              {/* Botón Guardar Cambios */}
              <button
                type="button"
                onClick={handleGuardarCambios}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>{mensajeGuardado ? '¡Guardado con Éxito!' : 'Guardar mi Contrato'}</span>
              </button>
            </div>

            {/* Barra de Etiquetas Dinámicas Sugeridas */}
            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-400" />
                <span>Etiquetas Dinámicas Opcionales (Haz clic para insertar en el texto):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{{PROYECTO}}', label: 'Nombre Proyecto' },
                  { tag: '{{SOCIO}}', label: 'Nombre Socio' },
                  { tag: '{{DNI}}', label: 'DNI Socio' },
                  { tag: '{{DEPTO}}', label: 'N° Unidad/Depto' },
                  { tag: '{{VALOR_TOTAL}}', label: 'Costo Inmueble' },
                  { tag: '{{CUOTAS}}', label: 'Cantidad Cuotas' },
                  { tag: '{{CUOTA_PURA}}', label: 'Cuota Mensual' },
                  { tag: '{{ANTICIPO}}', label: 'Anticipo' },
                  { tag: '{{DIRECTOR_OBRA}}', label: 'Director Obra' },
                  { tag: '{{PERMISO_OBRA}}', label: 'Permiso Municipal' },
                  { tag: '{{DIRECCION_OBRA}}', label: 'Dirección' },
                  { tag: '{{FECHA_HOY}}', label: 'Fecha Actual' }
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertarTag(item.tag)}
                    className="bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-slate-700 text-[10px] font-mono px-2 py-1 rounded transition-colors"
                    title={`Insertar ${item.tag}`}
                  >
                    {item.tag} <span className="text-slate-400">({item.label})</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                💡 Nota: Las etiquetas son opcionales. Puedes escribir o pegar tu contrato 100% en texto plano con tus propios nombres y cláusulas.
              </p>
            </div>

            {/* Área de Texto Principal (Textarea) */}
            <div className="flex-1 min-h-[360px] flex flex-col">
              <textarea
                ref={textareaRef}
                value={textoEditor}
                onChange={(e) => setTextoEditor(e.target.value)}
                placeholder="Pega aquí el texto de tu contrato redactado a tu gusto, o sube un archivo con el botón superior..."
                className="w-full flex-1 min-h-[360px] bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-4 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed outline-none resize-y shadow-inner"
              />
            </div>

            {/* Pie del Editor */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-400 font-mono">
                Caracteres: <strong>{textoEditor.length}</strong> • Líneas: <strong>{textoEditor.split('\n').length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModo('vista')}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarCambios}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar y Ver Vista Previa</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

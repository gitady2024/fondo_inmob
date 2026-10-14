import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Save,
  Building2,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import {
  type FondoGuardado,
  saveFondo,
  deleteFondo,
  duplicateFondo
} from '../services/fondoService';
import type { EstadoPlanFondo, ModalidadAnticipo, FormaPagoGastos } from '../types/fondo';
import { fmtMoneda } from '../utils/calculations';

interface ObrasAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: FondoGuardado[];
  onProyectosChange: () => void; // callback para recargar la lista desde App
  initialEditId?: string; // Si se especifica, abre directamente la edición de esta obra
  isAdmin?: boolean; // Permisos de Administrador
}

type FormMode = 'list' | 'edit' | 'new' | 'confirm-delete';

// ─── Componentes estables de formulario (fuera para no perder foco al tipear) ───
const Campo: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-300 block">{label}</label>
    {children}
  </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
  />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
  />
);

interface SeccionProps {
  id: 'basico' | 'financiero' | 'gastos';
  titulo: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FormSeccion: React.FC<SeccionProps> = ({ titulo, isOpen, onToggle, children }) => (
  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-sm font-bold text-white hover:bg-slate-800/40 transition cursor-pointer"
    >
      <span>{titulo}</span>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-indigo-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-400" />
      )}
    </button>
    {isOpen && (
      <div className="p-4 pt-0 space-y-4 border-t border-slate-800/60">{children}</div>
    )}
  </div>
);

// ─── Estado inicial del formulario ────────────────────────────────────────────
const formVacio = (): Partial<FondoGuardado> => ({
  nombre: '',
  descripcion: '',
  estadoPlan: 'activo',
  params: {
    costoDepto: 65000,
    cantidadDeptos: 10,
    cantidadCuotas: 48,
    valorCuotaBase: 1354,
    fechaInicio: '2027-01',
    modalidadAnticipo: 'reducir_cuota'
  },
  gastos: {
    formaPagoGastos: 'final',
    comisionGestion: 7,
    comisionEscribania: 3,
    otrosGastos: 500
  },
  anticipos: [],
  adjudicacionFijada: {},
  cesion: { activo: false, socioCedente: 1, cuotaSalida: 12, primaCesion: 10, mecanismoSalida: 'tercero' },
  adelanto: { activo: false, socioAdelanta: 1, monto: 10000, cuota: 12, estrategia: 'reducir_cuota' }
});

const ESTADO_LABELS: Record<EstadoPlanFondo, { label: string; color: string }> = {
  activo:    { label: 'Activo',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  simulacion:{ label: 'Simulación',color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  cerrado:   { label: 'Cerrado',   color: 'text-slate-400 bg-slate-800 border-slate-700' },
  pausado:   { label: 'Pausado',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
};

// ─── Componente principal ──────────────────────────────────────────────────────
export const ObrasAdminModal: React.FC<ObrasAdminModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  onProyectosChange,
  initialEditId,
  isAdmin = true
}) => {
  const [mode, setMode] = useState<FormMode>('list');
  const [editando, setEditando] = useState<Partial<FondoGuardado>>(formVacio());
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [seccionAbierta, setSeccionAbierta] = useState<'basico' | 'financiero' | 'gastos'>('basico');

  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setFeedback(null);
      setEditandoId(undefined);
    } else if (initialEditId) {
      const p = proyectos.find((proj) => proj.id === initialEditId);
      if (p) {
        setEditando({ ...p });
        setEditandoId(p.id);
        setMode('edit');
        setSeccionAbierta('basico');
      }
    }
  }, [isOpen, initialEditId, proyectos]);

  if (!isOpen) return null;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setParam = (key: string, value: unknown) =>
    setEditando((prev) => ({ ...prev, params: { ...prev.params!, [key]: value } as FondoGuardado['params'] }));

  const setGasto = (key: string, value: unknown) =>
    setEditando((prev) => ({ ...prev, gastos: { ...prev.gastos!, [key]: value } as FondoGuardado['gastos'] }));

  const abrirNuevo = () => {
    setEditando(formVacio());
    setEditandoId(undefined);
    setMode('new');
    setSeccionAbierta('basico');
    setFeedback(null);
  };

  const abrirEditar = (p: FondoGuardado) => {
    setEditando({ ...p });
    setEditandoId(p.id);
    setMode('edit');
    setSeccionAbierta('basico');
    setFeedback(null);
  };

  const confirmarEliminar = (id: string) => {
    if (!isAdmin) {
      setFeedback({ ok: false, msg: 'Acceso denegado: Solo el Administrador puede eliminar obras.' });
      return;
    }
    setDeletingId(id);
    setMode('confirm-delete');
  };

  const handleEliminar = async () => {
    if (!isAdmin) {
      setFeedback({ ok: false, msg: 'Acceso denegado: Solo el Administrador puede eliminar obras.' });
      return;
    }
    if (!deletingId) return;
    setGuardando(true);
    await deleteFondo(deletingId);
    onProyectosChange();
    setGuardando(false);
    setMode('list');
    setFeedback({ ok: true, msg: 'Obra eliminada correctamente.' });
  };

  const handleDuplicar = async (id: string) => {
    if (!isAdmin) {
      setFeedback({ ok: false, msg: 'Acceso denegado: Solo el Administrador puede duplicar obras.' });
      return;
    }
    setGuardando(true);
    await duplicateFondo(id);
    onProyectosChange();
    setGuardando(false);
    setFeedback({ ok: true, msg: 'Obra duplicada. Editá la copia desde la lista.' });
  };

  const handleGuardar = async () => {
    if (!isAdmin) {
      setFeedback({ ok: false, msg: 'Acceso denegado: Solo el Administrador tiene permisos para modificar y guardar obras.' });
      return;
    }
    if (!editando.nombre?.trim()) {
      setFeedback({ ok: false, msg: 'El nombre del proyecto es obligatorio.' });
      return;
    }

    const costoDeptoNum = Number(editando.params?.costoDepto);
    if (!costoDeptoNum || costoDeptoNum <= 0) {
      setFeedback({ ok: false, msg: 'El costo del departamento debe ser mayor a 0.' });
      return;
    }

    setGuardando(true);
    setFeedback(null);

    try {
      const p: FondoGuardado['params'] = {
        ...editando.params!,
        costoDepto: costoDeptoNum,
        cantidadDeptos: Number(editando.params!.cantidadDeptos) || 10,
        cantidadCuotas: Number(editando.params!.cantidadCuotas) || 48,
        valorCuotaBase: Number(editando.params!.valorCuotaBase) || Math.round(costoDeptoNum / (Number(editando.params!.cantidadCuotas) || 48)),
        fechaInicio: editando.params!.fechaInicio || '2027-01',
        modalidadAnticipo: editando.params!.modalidadAnticipo || 'reducir_cuota'
      };

      const g: FondoGuardado['gastos'] = {
        ...editando.gastos!,
        formaPagoGastos: editando.gastos!.formaPagoGastos || 'final',
        comisionGestion: Number(editando.gastos!.comisionGestion) || 0,
        comisionEscribania: Number(editando.gastos!.comisionEscribania) || 0,
        otrosGastos: Number(editando.gastos!.otrosGastos) || 0
      };

      // Regenerar array de anticipos del tamaño correcto
      const anticipos = Array.from({ length: p.cantidadDeptos }, (_, i) => editando.anticipos?.[i] || 0);

      await saveFondo(
        editando.nombre!.trim(),
        p,
        g,
        anticipos,
        editando.adjudicacionFijada || {},
        editando.cesion!,
        editando.adelanto!,
        editandoId,
        editando.descripcion || '',
        editando.datosTecnicos,
        editando.contratoPersonalizado,
        editando.ajustes || [],
        editando.estadoPlan as EstadoPlanFondo
      );

      onProyectosChange();
      setFeedback({ ok: true, msg: mode === 'new' ? 'Obra creada exitosamente.' : 'Cambios guardados correctamente.' });
      setTimeout(() => setMode('list'), 900);
    } catch (err) {
      setFeedback({ ok: false, msg: 'Error al guardar. Intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  // ── Render: Lista ────────────────────────────────────────────────────────────
  const renderLista = () => (
    <div className="space-y-3">
      {!isAdmin && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Modo Consulta: Solo el Administrador puede crear, editar o eliminar obras.</span>
        </div>
      )}
      {proyectos.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No hay obras registradas. ¡Creá la primera!
        </div>
      )}
      {proyectos.map((p) => {
        const estadoInfo = ESTADO_LABELS[p.estadoPlan || 'activo'];
        return (
          <div
            key={p.id}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white truncate">{p.nombre}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoInfo.color}`}>
                  {estadoInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{p.descripcion || 'Sin descripción'}</p>
              <div className="text-[11px] text-slate-500 font-mono">
                {p.params.cantidadDeptos} unidades · {p.params.cantidadCuotas} cuotas ·{' '}
                {fmtMoneda(p.params.costoDepto)}/unidad
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDuplicar(p.id)}
                  title="Duplicar obra"
                  className="p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => abrirEditar(p)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                {isAdmin ? 'Editar' : 'Ver Parámetros'}
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => confirmarEliminar(p.id)}
                  title="Eliminar obra"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Render: Formulario (editar / nuevo) ──────────────────────────────────────
  const renderForm = () => {
    const p = editando.params!;
    const g = editando.gastos!;

    return (
      <div className="space-y-4">
        {/* Banner de permisos si no es admin */}
        {!isAdmin && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Modo Solo Lectura: Solo el usuario Administrador puede modificar los valores de esta obra.</span>
          </div>
        )}

        {/* Nombre y estado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Campo label="Nombre del Proyecto *">
              <FormInput
                disabled={!isAdmin}
                value={editando.nombre || ''}
                onChange={(e) => setEditando((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Torre Bellini • 12 Deptos • 48 Meses"
                maxLength={80}
              />
            </Campo>
          </div>
          <Campo label="Estado del Plan">
            <FormSelect
              disabled={!isAdmin}
              value={editando.estadoPlan || 'activo'}
              onChange={(e) => setEditando((prev) => ({ ...prev, estadoPlan: e.target.value as EstadoPlanFondo }))}
            >
              <option value="activo">Activo</option>
              <option value="simulacion">Simulación</option>
              <option value="pausado">Pausado</option>
              <option value="cerrado">Cerrado</option>
            </FormSelect>
          </Campo>
        </div>

        <Campo label="Descripción breve (visible en la landing)">
          <textarea
            disabled={!isAdmin}
            value={editando.descripcion || ''}
            onChange={(e) => setEditando((prev) => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Breve descripción del fideicomiso, barrio, tipología..."
            rows={2}
            maxLength={200}
            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </Campo>

        {/* Sección: Parámetros básicos */}
        <FormSeccion
          id="basico"
          titulo="📐 Parámetros de la Obra"
          isOpen={seccionAbierta === 'basico'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'basico' ? 'gastos' : 'basico'))}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Campo label="Costo por Unidad (USD)">
              <FormInput
                type="number"
                min={5000}
                max={500000}
                step={1000}
                disabled={!isAdmin}
                value={p.costoDepto !== undefined && p.costoDepto !== null ? p.costoDepto : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setParam('costoDepto', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
            <Campo label="Cantidad de Unidades">
              <FormInput
                type="number"
                min={2}
                max={100}
                disabled={!isAdmin}
                value={p.cantidadDeptos !== undefined && p.cantidadDeptos !== null ? p.cantidadDeptos : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setParam('cantidadDeptos', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
            <Campo label="Cuotas Totales">
              <FormInput
                type="number"
                min={12}
                max={120}
                disabled={!isAdmin}
                value={p.cantidadCuotas !== undefined && p.cantidadCuotas !== null ? p.cantidadCuotas : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setParam('cantidadCuotas', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
            <Campo label="Cuota Base Pura (USD)">
              <FormInput
                type="number"
                min={100}
                max={20000}
                step={10}
                disabled={!isAdmin}
                value={p.valorCuotaBase !== undefined && p.valorCuotaBase !== null ? p.valorCuotaBase : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setParam('valorCuotaBase', val === '' ? '' : Number(val));
                }}
              />
              <span className="text-[10px] text-slate-500">
                Calculada: {Number(p.costoDepto) > 0 && Number(p.cantidadCuotas) > 0
                  ? `≈ USD ${Math.round(Number(p.costoDepto) / Number(p.cantidadCuotas)).toLocaleString('es-AR')}/mes`
                  : '-'}
              </span>
            </Campo>
            <Campo label="Fecha de Inicio (YYYY-MM)">
              <FormInput
                type="month"
                disabled={!isAdmin}
                value={p.fechaInicio}
                onChange={(e) => setParam('fechaInicio', e.target.value)}
              />
            </Campo>
            <Campo label="Modalidad de Anticipo">
              <FormSelect
                disabled={!isAdmin}
                value={p.modalidadAnticipo}
                onChange={(e) => setParam('modalidadAnticipo', e.target.value as ModalidadAnticipo)}
              >
                <option value="reducir_cuota">Reducir Cuota</option>
                <option value="reducir_plazo">Reducir Plazo</option>
              </FormSelect>
            </Campo>
          </div>
        </FormSeccion>

        {/* Sección: Gastos fiduciarios */}
        <FormSeccion
          id="gastos"
          titulo="💼 Gastos Fiduciarios"
          isOpen={seccionAbierta === 'gastos'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'gastos' ? 'basico' : 'gastos'))}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Campo label="Forma de Pago Gastos">
              <FormSelect
                disabled={!isAdmin}
                value={g.formaPagoGastos}
                onChange={(e) => setGasto('formaPagoGastos', e.target.value as FormaPagoGastos)}
              >
                <option value="final">Al Final</option>
                <option value="prorrateado">Prorrateado</option>
                <option value="primer_cuota">1era Cuota</option>
              </FormSelect>
            </Campo>
            <Campo label="Comisión Gestión (%)">
              <FormInput
                type="number"
                min={0}
                max={20}
                step={0.5}
                disabled={!isAdmin}
                value={g.comisionGestion !== undefined && g.comisionGestion !== null ? g.comisionGestion : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setGasto('comisionGestion', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
            <Campo label="Escribanía (%)">
              <FormInput
                type="number"
                min={0}
                max={10}
                step={0.5}
                disabled={!isAdmin}
                value={g.comisionEscribania !== undefined && g.comisionEscribania !== null ? g.comisionEscribania : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setGasto('comisionEscribania', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
            <Campo label="Otros Gastos (USD)">
              <FormInput
                type="number"
                min={0}
                max={10000}
                step={100}
                disabled={!isAdmin}
                value={g.otrosGastos !== undefined && g.otrosGastos !== null ? g.otrosGastos : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setGasto('otrosGastos', val === '' ? '' : Number(val));
                }}
              />
            </Campo>
          </div>
        </FormSeccion>

        {/* Preview de cuota calculada */}
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Cuota pura estimada (costo/cuotas)</p>
            <p className="text-xl font-black text-emerald-400 font-mono">
              {Number(p.costoDepto) > 0 && Number(p.cantidadCuotas) > 0
                ? `USD ${Math.round(Number(p.costoDepto) / Number(p.cantidadCuotas)).toLocaleString('es-AR')}/mes`
                : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total por {p.cantidadDeptos || 0} unidades</p>
            <p className="text-base font-bold text-white font-mono">
              {fmtMoneda((Number(p.costoDepto) || 0) * (Number(p.cantidadDeptos) || 0))}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Render: Confirmar eliminación ────────────────────────────────────────────
  const renderConfirmDelete = () => {
    const proyecto = proyectos.find((p) => p.id === deletingId);
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-white">¿Eliminar esta obra?</h4>
          <p className="text-sm text-slate-400 mt-1">
            Se eliminará <strong className="text-white">{proyecto?.nombre}</strong> de forma permanente.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={guardando}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {guardando ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    );
  };

  // ── Render raíz ──────────────────────────────────────────────────────────────
  const isList = mode === 'list';
  const isForm = mode === 'edit' || mode === 'new';
  const isDelete = mode === 'confirm-delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/60 my-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isList && 'Gestión de Obras Activas'}
                {mode === 'new' && 'Nueva Obra / Proyecto'}
                {mode === 'edit' && 'Editar Obra'}
                {isDelete && 'Confirmar Eliminación'}
              </h3>
              <p className="text-xs text-slate-400">
                {isList && `${proyectos.length} proyectos registrados`}
                {isForm && 'Solo el administrador puede modificar estos datos'}
                {isDelete && 'Acción irreversible'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isForm ? () => setMode('list') : onClose}
            aria-label="Cerrar"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div className={`mx-5 mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold border ${
            feedback.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {feedback.ok
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />}
            {feedback.msg}
          </div>
        )}

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {isList && renderLista()}
          {isForm && renderForm()}
          {isDelete && renderConfirmDelete()}
        </div>

        {/* Footer con acciones */}
        {(isList || isForm) && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
            {isList ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Cerrar
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={abrirNuevo}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Nueva Obra
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setMode('list'); setFeedback(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Volver a la lista
                </button>
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={guardando || !isAdmin}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : mode === 'new' ? 'Crear Obra' : 'Guardar Cambios'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
  RotateCcw,
  Camera,
  Upload,
  MapPin,
  Star,
  Play,
  Coins,
  ImageIcon,
  Lock
} from 'lucide-react';
import {
  type FondoGuardado,
  saveFondo,
  deleteFondo,
  duplicateFondo,
  type FotoAvance,
  FOTOS_OBRA_PREDETERMINADAS
} from '../services/fondoService';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import type {
  EstadoPlanFondo,
  ModalidadAnticipo,
  FormaPagoGastos,
  MecanismoSalida,
  EstrategiaImpactoAdelanto
} from '../types/fondo';
import { fmtMoneda } from '../utils/calculations';

interface ObrasAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyectos: FondoGuardado[];
  onProyectosChange: (newActiveId?: string) => void;
  initialEditId?: string;
  isAdmin?: boolean;
  activeFondoId?: string;
  onSelectActiveFondo?: (id: string) => void;
  onSimularFondo?: (proyecto: FondoGuardado) => void;
}

type FormMode = 'list' | 'edit' | 'new' | 'confirm-delete';
type SeccionAbierta = 'basico' | 'fotos' | 'anticipos' | 'cesion' | 'adelanto' | 'gastos';

// ─── Componentes estables de formulario (fuera para no perder foco al tipear) ───
const Campo: React.FC<{ label: string; children: React.ReactNode; sublabel?: string }> = ({
  label,
  children,
  sublabel
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-slate-300 block">{label}</label>
      {sublabel && <span className="text-[11px] text-slate-400 font-mono">{sublabel}</span>}
    </div>
    {children}
  </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors placeholder-slate-600 disabled:opacity-50 disabled:cursor-not-allowed ${
      props.className || ''
    }`}
  />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className={`w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
      props.className || ''
    }`}
  />
);

interface SeccionProps {
  id: SeccionAbierta;
  titulo: string;
  badge?: string;
  badgeColor?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const FormSeccion: React.FC<SeccionProps> = ({
  titulo,
  badge,
  badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  isOpen,
  onToggle,
  children
}) => (
  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden transition-all">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-sm font-bold text-white hover:bg-slate-800/40 transition cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <span>{titulo}</span>
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
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
  anticipos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  adjudicacionFijada: {},
  cesion: {
    activo: false,
    socioCedente: 1,
    cuotaSalida: 12,
    primaCesion: 10,
    mecanismoSalida: 'tercero'
  },
  adelanto: {
    activo: false,
    socioAdelanta: 1,
    monto: 10000,
    cuota: 12,
    estrategia: 'reducir_cuota'
  },
  datosTecnicos: {
    ...DATOS_TECNICOS_DEFAULT,
    direccionObra: 'Av. Libertador 1450, Zona Céntrica'
  },
  fotos: [...FOTOS_OBRA_PREDETERMINADAS]
});

const ESTADO_LABELS: Record<EstadoPlanFondo, { label: string; color: string }> = {
  activo: { label: 'Activo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  simulacion: { label: 'Simulación', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  cerrado: { label: 'Cerrado', color: 'text-slate-400 bg-slate-800 border-slate-700' },
  pausado: { label: 'Pausado', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
};

// ─── Componente principal ──────────────────────────────────────────────────────
export const ObrasAdminModal: React.FC<ObrasAdminModalProps> = ({
  isOpen,
  onClose,
  proyectos,
  onProyectosChange,
  initialEditId,
  isAdmin = true,
  activeFondoId,
  onSelectActiveFondo,
  onSimularFondo
}) => {
  const [mode, setMode] = useState<FormMode>('list');
  const [filtroLista, setFiltroLista] = useState<'todas' | 'activas' | 'simulaciones'>('todas');
  const [editando, setEditando] = useState<Partial<FondoGuardado>>(formVacio());
  const [editandoId, setEditandoId] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [seccionAbierta, setSeccionAbierta] = useState<SeccionAbierta>('basico');
  const [anticipoUniforme, setAnticipoUniforme] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setMode('list');
      setFeedback(null);
      setEditandoId(undefined);
    } else if (initialEditId) {
      const p = proyectos.find((proj) => proj.id === initialEditId);
      if (p) {
        setEditando({
          ...p,
          datosTecnicos: p.datosTecnicos || { ...DATOS_TECNICOS_DEFAULT },
          fotos: p.fotos && p.fotos.length > 0 ? [...p.fotos] : [...FOTOS_OBRA_PREDETERMINADAS],
          anticipos: p.anticipos && p.anticipos.length > 0
            ? [...p.anticipos]
            : new Array(p.params?.cantidadDeptos || 10).fill(0),
          cesion: p.cesion || {
            activo: false,
            socioCedente: 1,
            cuotaSalida: 12,
            primaCesion: 10,
            mecanismoSalida: 'tercero'
          },
          adelanto: p.adelanto || {
            activo: false,
            socioAdelanta: 1,
            monto: 10000,
            cuota: 12,
            estrategia: 'reducir_cuota'
          }
        });
        setEditandoId(p.id);
        setMode('edit');
        setSeccionAbierta('basico');
      }
    }
  }, [isOpen, initialEditId, proyectos]);

  if (!isOpen) return null;

  // ── Helpers de actualización de campos ────────────────────────────────────────
  const setParam = (key: string, value: unknown) =>
    setEditando((prev) => ({
      ...prev,
      params: { ...prev.params!, [key]: value } as FondoGuardado['params']
    }));

  const setGasto = (key: string, value: unknown) =>
    setEditando((prev) => ({
      ...prev,
      gastos: { ...prev.gastos!, [key]: value } as FondoGuardado['gastos']
    }));

  const setDireccion = (direccion: string) =>
    setEditando((prev) => ({
      ...prev,
      datosTecnicos: {
        ...(prev.datosTecnicos || DATOS_TECNICOS_DEFAULT),
        direccionObra: direccion
      }
    }));

  // Anticipos
  const setAnticipoSocio = (index: number, monto: number) => {
    setEditando((prev) => {
      const cant = Number(prev.params?.cantidadDeptos) || 10;
      const array = Array.from({ length: cant }, (_, i) => prev.anticipos?.[i] || 0);
      array[index] = monto;
      return { ...prev, anticipos: array };
    });
  };

  const aplicarAnticipoUniforme = () => {
    const monto = Number(anticipoUniforme) || 0;
    setEditando((prev) => {
      const cant = Number(prev.params?.cantidadDeptos) || 10;
      return {
        ...prev,
        anticipos: new Array(cant).fill(monto)
      };
    });
    setFeedback({ ok: true, msg: `Anticipo de USD ${monto.toLocaleString('es-AR')} aplicado a todas las unidades.` });
  };

  // Cesión
  const setCesionField = (key: keyof FondoGuardado['cesion'], value: unknown) => {
    setEditando((prev) => ({
      ...prev,
      cesion: {
        ...(prev.cesion || {
          activo: false,
          socioCedente: 1,
          cuotaSalida: 12,
          primaCesion: 10,
          mecanismoSalida: 'tercero'
        }),
        [key]: value
      }
    }));
  };

  // Adelanto
  const setAdelantoField = (key: keyof FondoGuardado['adelanto'], value: unknown) => {
    setEditando((prev) => ({
      ...prev,
      adelanto: {
        ...(prev.adelanto || {
          activo: false,
          socioAdelanta: 1,
          monto: 10000,
          cuota: 12,
          estrategia: 'reducir_cuota'
        }),
        [key]: value
      }
    }));
  };

  // Fotos (Hasta 4)
  const handleFotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 3MB. Por favor seleccioná un archivo más liviano.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setEditando((prev) => {
          const fotos = [...(prev.fotos || FOTOS_OBRA_PREDETERMINADAS)];
          while (fotos.length <= index) {
            fotos.push({
              url: '',
              etapa: `Foto ${fotos.length + 1}`,
              descripcion: 'Avance constructivo certificado',
              fecha: 'En ejecución'
            });
          }
          fotos[index] = { ...fotos[index], url: dataUrl };
          return { ...prev, fotos: fotos.slice(0, 4) };
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFotoMetaChange = (index: number, field: keyof FotoAvance, val: string) => {
    setEditando((prev) => {
      const fotos = [...(prev.fotos || FOTOS_OBRA_PREDETERMINADAS)];
      if (fotos[index]) {
        fotos[index] = { ...fotos[index], [field]: val };
      }
      return { ...prev, fotos: fotos.slice(0, 4) };
    });
  };

  const handleAgregarFoto = () => {
    setEditando((prev) => {
      const fotos = [...(prev.fotos || FOTOS_OBRA_PREDETERMINADAS)];
      if (fotos.length >= 4) return prev;
      fotos.push({
        url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
        etapa: `Plano / Imagen ${fotos.length + 1}`,
        descripcion: 'Plano, render arquitectónico o inspección técnica de obra.',
        fecha: 'Octubre 2026'
      });
      return { ...prev, fotos: fotos.slice(0, 4) };
    });
  };

  const handleEliminarFoto = (index: number) => {
    setEditando((prev) => {
      const fotos = [...(prev.fotos || FOTOS_OBRA_PREDETERMINADAS)];
      fotos.splice(index, 1);
      return { ...prev, fotos };
    });
  };

  const handleRestablecerFotos = () => {
    setEditando((prev) => ({
      ...prev,
      fotos: [...FOTOS_OBRA_PREDETERMINADAS]
    }));
    setFeedback({ ok: true, msg: 'Se restablecieron las 4 fotos y planos de muestra.' });
  };

  // ── Navegación interna ────────────────────────────────────────────────────────
  const abrirNuevo = () => {
    setEditando(formVacio());
    setEditandoId(undefined);
    setMode('new');
    setSeccionAbierta('basico');
    setFeedback(null);
  };

  const abrirEditar = (p: FondoGuardado) => {
    setEditando({
      ...p,
      datosTecnicos: p.datosTecnicos || { ...DATOS_TECNICOS_DEFAULT },
      fotos: p.fotos && p.fotos.length > 0 ? [...p.fotos] : [...FOTOS_OBRA_PREDETERMINADAS],
      anticipos: p.anticipos && p.anticipos.length > 0
        ? [...p.anticipos]
        : new Array(p.params?.cantidadDeptos || 10).fill(0),
      cesion: p.cesion || {
        activo: false,
        socioCedente: 1,
        cuotaSalida: 12,
        primaCesion: 10,
        mecanismoSalida: 'tercero'
      },
      adelanto: p.adelanto || {
        activo: false,
        socioAdelanta: 1,
        monto: 10000,
        cuota: 12,
        estrategia: 'reducir_cuota'
      }
    });
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
    if (!isAdmin) return;
    if (!deletingId) return;
    setGuardando(true);
    await deleteFondo(deletingId);
    onProyectosChange();
    setGuardando(false);
    setMode('list');
    setFeedback({ ok: true, msg: 'Obra eliminada correctamente.' });
  };

  const handleDuplicar = async (id: string) => {
    if (!isAdmin) return;
    setGuardando(true);
    await duplicateFondo(id);
    onProyectosChange();
    setGuardando(false);
    setFeedback({ ok: true, msg: 'Obra duplicada exitosamente. Podés editarla en la lista.' });
  };

  const handleEstablecerActiva = (id: string) => {
    if (onSelectActiveFondo) {
      onSelectActiveFondo(id);
      setFeedback({ ok: true, msg: '⭐ Esta obra ha sido establecida como la Obra Activa principal de la plataforma.' });
    }
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
      setFeedback({ ok: false, msg: 'El costo por unidad debe ser mayor a 0.' });
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
      const anticipos = Array.from({ length: p.cantidadDeptos }, (_, i) => Number(editando.anticipos?.[i]) || 0);

      const res = await saveFondo(
        editando.nombre!.trim(),
        p,
        g,
        anticipos,
        editando.adjudicacionFijada || {},
        editando.cesion || { activo: false, socioCedente: 1, cuotaSalida: 12, primaCesion: 10, mecanismoSalida: 'tercero' },
        editando.adelanto || { activo: false, socioAdelanta: 1, monto: 10000, cuota: 12, estrategia: 'reducir_cuota' },
        editandoId,
        editando.descripcion || '',
        editando.datosTecnicos || { ...DATOS_TECNICOS_DEFAULT },
        editando.contratoPersonalizado,
        editando.ajustes || [],
        editando.estadoPlan as EstadoPlanFondo,
        (editando.fotos || []).slice(0, 4)
      );

      // Si la obra editada/creada está activa o es la que estaba activa, actualizarla como obra activa en todo el proyecto
      if (res.id && (editando.estadoPlan === 'activo' || editandoId === activeFondoId || !activeFondoId)) {
        onSelectActiveFondo?.(res.id);
      }
      onProyectosChange(res.id);
      setFeedback({ ok: true, msg: mode === 'new' ? 'Obra creada exitosamente.' : 'Cambios guardados correctamente.' });
      setTimeout(() => setMode('list'), 900);
    } catch (err) {
      setFeedback({ ok: false, msg: 'Error al guardar. Intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  // ── Render: Lista de Obras y Simulaciones ────────────────────────────────────
  const renderLista = () => {
    const proyectosFiltrados = proyectos.filter((p) => {
      if (filtroLista === 'activas') return p.estadoPlan === 'activo';
      if (filtroLista === 'simulaciones') return p.estadoPlan === 'simulacion';
      return true;
    });

    return (
      <div className="space-y-4">
        {!isAdmin && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Modo Consulta: Solo el Administrador puede crear, editar o eliminar obras.</span>
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroLista('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroLista === 'todas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todas ({proyectos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroLista('activas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroLista === 'activas'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Obras Activas ({proyectos.filter((p) => p.estadoPlan === 'activo').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroLista('simulaciones')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroLista === 'simulaciones'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Simulaciones ({proyectos.filter((p) => p.estadoPlan === 'simulacion').length})
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Obra Activa Principal: <strong className="text-amber-400">{proyectos.find((p) => p.id === activeFondoId)?.nombre || 'Por defecto'}</strong>
          </div>
        </div>

        {proyectosFiltrados.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No hay proyectos en esta categoría.
          </div>
        )}

        <div className="space-y-3">
          {proyectosFiltrados.map((p) => {
            const estadoInfo = ESTADO_LABELS[p.estadoPlan || 'activo'];
            const esActivaPrincipal = p.id === activeFondoId;

            return (
              <div
                key={p.id}
                className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  esActivaPrincipal
                    ? 'border-amber-500/60 shadow-lg shadow-amber-500/10 bg-gradient-to-r from-amber-950/20 via-slate-950 to-slate-950'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white truncate">{p.nombre}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoInfo.color}`}>
                      {estadoInfo.label}
                    </span>
                    {esActivaPrincipal && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        Obra Activa Principal
                      </span>
                    )}
                  </div>
                  
                  {p.datosTecnicos?.direccionObra && (
                    <div className="text-xs text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{p.datosTecnicos.direccionObra}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3 flex-wrap">
                    <span>{p.params.cantidadDeptos} unidades</span>
                    <span>•</span>
                    <span>{p.params.cantidadCuotas} cuotas</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">{fmtMoneda(p.params.costoDepto)}/u</span>
                    {p.fotos && p.fotos.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-400 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> {p.fotos.length} fotos
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Establecer como activa */}
                  {isAdmin && !esActivaPrincipal && onSelectActiveFondo && (
                    <button
                      type="button"
                      onClick={() => handleEstablecerActiva(p.id)}
                      title="Establecer como la Obra Activa principal de la plataforma"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Activar</span>
                    </button>
                  )}

                  {/* Simular como admin */}
                  {onSimularFondo && (
                    <button
                      type="button"
                      onClick={() => onSimularFondo(p)}
                      title="Simular este escenario completo en el simulador"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simular</span>
                    </button>
                  )}

                  {/* Duplicar */}
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

                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => abrirEditar(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {isAdmin ? 'Editar' : 'Ver Detalles'}
                  </button>

                  {/* Eliminar */}
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
      </div>
    );
  };

  // ── Render: Formulario Completo de Edición ──────────────────────────────────
  const renderForm = () => {
    const p = editando.params!;
    const g = editando.gastos!;
    const cesion = editando.cesion || { activo: false, socioCedente: 1, cuotaSalida: 12, primaCesion: 10, mecanismoSalida: 'tercero' };
    const adelanto = editando.adelanto || { activo: false, socioAdelanta: 1, monto: 10000, cuota: 12, estrategia: 'reducir_cuota' };
    const fotos = editando.fotos || [];
    const anticipos = editando.anticipos || [];
    const esActiva = editandoId === activeFondoId;

    // Métricas de anticipos
    const totalAnticipos = anticipos.reduce((acc, val) => acc + (Number(val) || 0), 0);
    const costoTotalObra = (Number(p.costoDepto) || 0) * (Number(p.cantidadDeptos) || 0);
    const pctCoberturaAnticipos = costoTotalObra > 0 ? Math.round((totalAnticipos / costoTotalObra) * 100) : 0;

    return (
      <div className="space-y-4">
        {/* Banner de permisos si no es admin */}
        {!isAdmin && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Modo Solo Lectura: Solo el usuario Administrador puede modificar los valores de esta obra.</span>
          </div>
        )}

        {/* Acciones Rápidas: Marcar como activa / Estado */}
        <div className="flex items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Estado de Obra Activa:</span>
            {esActiva ? (
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Obra Activa Principal
              </span>
            ) : (
              isAdmin && editandoId && onSelectActiveFondo && (
                <button
                  type="button"
                  onClick={() => handleEstablecerActiva(editandoId)}
                  className="text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Establecer como Obra Activa
                </button>
              )
            )}
          </div>

          {onSimularFondo && editandoId && (
            <button
              type="button"
              onClick={() => onSimularFondo(editando as FondoGuardado)}
              className="text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Probar en Simulador
            </button>
          )}
        </div>

        {/* Nombre, Estado y Dirección */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Campo label="Nombre del Proyecto *">
              <FormInput
                disabled={!isAdmin}
                value={editando.nombre || ''}
                onChange={(e) => setEditando((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: 12 de Octubre I • 10 Deptos • 36 Meses"
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
              <option value="activo">Activo (Obras en marcha)</option>
              <option value="simulacion">Simulación (Laboratorio)</option>
              <option value="pausado">Pausado</option>
              <option value="cerrado">Cerrado</option>
            </FormSelect>
          </Campo>
        </div>

        {/* DIRECCIÓN DE LA OBRA (Requerimiento solicitado) */}
        <div className="p-3 bg-amber-500/5 border border-amber-500/30 rounded-2xl space-y-2">
          <Campo label="📍 Dirección y Ubicación de la Obra (Editable)" sublabel="Visible en la tarjeta de Obra Activa">
            <div className="relative">
              <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <FormInput
                disabled={!isAdmin}
                value={editando.datosTecnicos?.direccionObra || ''}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Av. 12 de Octubre 1450, Quilmes / Zona Céntrica"
                className="pl-9 font-medium"
              />
            </div>
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

        {/* ── 1. SECCIÓN: PARÁMETROS BÁSICOS ───────────────────────────────── */}
        <FormSeccion
          id="basico"
          titulo="📐 Parámetros Constructivos y Financieros"
          badge={`${p.cantidadDeptos} deptos • ${p.cantidadCuotas} meses`}
          isOpen={seccionAbierta === 'basico'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'basico' ? 'fotos' : 'basico'))}
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

        {/* ── 2. SECCIÓN: FOTOS Y PLANOS (Hasta 4 imágenes) ────────────────── */}
        <FormSeccion
          id="fotos"
          titulo="📸 Fotos, Planos y Avance de Obra"
          badge={`${fotos.length} / 4 fotos`}
          badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
          isOpen={seccionAbierta === 'fotos'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'fotos' ? 'anticipos' : 'fotos'))}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-slate-400">
                Podés cargar hasta <strong>4 imágenes</strong> (planos arquitectónicos, renders o fotos de avance). Podés subir un archivo o indicar una URL web.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestablecerFotos}
                  disabled={!isAdmin}
                  className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  Restablecer 4 de muestra
                </button>
                {fotos.length < 4 && isAdmin && (
                  <button
                    type="button"
                    onClick={handleAgregarFoto}
                    className="text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Imagen
                  </button>
                )}
              </div>
            </div>

            {/* Listado de las hasta 4 fotos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fotos.map((foto, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5" /> Imagen {idx + 1} de {fotos.length}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleEliminarFoto(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Eliminar esta imagen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Vista Previa y carga */}
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group">
                      <img
                        src={foto.url}
                        alt={foto.etapa}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-1 min-w-0 flex-1">
                      <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Subir archivo local
                      </label>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Seleccionar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isAdmin}
                          onChange={(e) => handleFotoUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* URL de la imagen */}
                  <Campo label="O URL web de la imagen:">
                    <FormInput
                      disabled={!isAdmin}
                      value={foto.url}
                      onChange={(e) => handleFotoMetaChange(idx, 'url', e.target.value)}
                      placeholder="https://..."
                      className="text-xs font-mono"
                    />
                  </Campo>

                  {/* Título y Fecha */}
                  <div className="grid grid-cols-2 gap-2">
                    <Campo label="Etapa / Título">
                      <FormInput
                        disabled={!isAdmin}
                        value={foto.etapa}
                        onChange={(e) => handleFotoMetaChange(idx, 'etapa', e.target.value)}
                        placeholder="Ej: Estructura H°A°"
                        className="text-xs"
                      />
                    </Campo>
                    <Campo label="Fecha / Inspección">
                      <FormInput
                        disabled={!isAdmin}
                        value={foto.fecha}
                        onChange={(e) => handleFotoMetaChange(idx, 'fecha', e.target.value)}
                        placeholder="Ej: Octubre 2026"
                        className="text-xs"
                      />
                    </Campo>
                  </div>

                  {/* Descripción */}
                  <Campo label="Descripción técnica breve">
                    <FormInput
                      disabled={!isAdmin}
                      value={foto.descripcion}
                      onChange={(e) => handleFotoMetaChange(idx, 'descripcion', e.target.value)}
                      placeholder="Descripción de la etapa..."
                      className="text-xs"
                    />
                  </Campo>
                </div>
              ))}
            </div>
          </div>
        </FormSeccion>

        {/* ── 3. SECCIÓN: ANTICIPOS INDIVIDUALES MES 0 ─────────────────────── */}
        <FormSeccion
          id="anticipos"
          titulo="💰 Anticipos Individuales Mes 0"
          badge={`Recaudado: USD ${totalAnticipos.toLocaleString('es-AR')} (${pctCoberturaAnticipos}%)`}
          badgeColor="bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
          isOpen={seccionAbierta === 'anticipos'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'anticipos' ? 'cesion' : 'anticipos'))}
        >
          <div className="space-y-4">
            {/* Aplicación Rápida Uniforme */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Anticipo Uniforme para Todos
                </span>
                <p className="text-[11px] text-slate-400">
                  Definí un monto idéntico para las {p.cantidadDeptos} unidades con un solo clic.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <FormInput
                  type="number"
                  min={0}
                  step={500}
                  disabled={!isAdmin}
                  value={anticipoUniforme}
                  onChange={(e) => setAnticipoUniforme(e.target.value)}
                  placeholder="Ej: 13000"
                  className="w-36 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={aplicarAnticipoUniforme}
                  disabled={!isAdmin || !anticipoUniforme}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  Aplicar a Todos
                </button>
              </div>
            </div>

            {/* Grilla de Anticipo por Socio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Anticipo específico por Unidad / Socio (Mes 0):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-1">
                {Array.from({ length: Number(p.cantidadDeptos) || 10 }, (_, i) => {
                  const monto = anticipos[i] || 0;
                  const pct = p.costoDepto > 0 ? Math.round((monto / p.costoDepto) * 100) : 0;

                  return (
                    <div
                      key={i}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">Unidad {i + 1}</span>
                        <span className="text-emerald-400 font-mono font-semibold">{pct}%</span>
                      </div>
                      <FormInput
                        type="number"
                        min={0}
                        step={500}
                        disabled={!isAdmin}
                        value={monto || ''}
                        onChange={(e) => setAnticipoSocio(i, Number(e.target.value) || 0)}
                        placeholder="USD 0"
                        className="text-xs font-mono py-1 px-2 text-right"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">Total Recaudado en Mes 0:</span>
              <span className="font-black text-emerald-400 font-mono text-sm">
                USD {totalAnticipos.toLocaleString('es-AR')} ({pctCoberturaAnticipos}% del costo total)
              </span>
            </div>
          </div>
        </FormSeccion>

        {/* ── 4. SECCIÓN: CESIÓN DE POSICIÓN CONTRACTUAL ────────────────────── */}
        <FormSeccion
          id="cesion"
          titulo="🔄 Cesión de Posición Contractual (Art. 1614 CCCN)"
          badge={cesion.activo ? `Activo (Socio ${cesion.socioCedente} • Cuota ${cesion.cuotaSalida})` : 'Inactivo'}
          badgeColor={cesion.activo ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-800 text-slate-400'}
          isOpen={seccionAbierta === 'cesion'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'cesion' ? 'adelanto' : 'cesion'))}
        >
          <div className="space-y-4">
            {/* Toggle de activación */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={!!cesion.activo}
                onChange={(e) => setCesionField('activo', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  Habilitar simulación de Cesión de Posición Contractual y Salida de Socios
                </span>
                <span className="text-[11px] text-slate-400">
                  Permite simular el retiro de un socio y el traspaso a un nuevo inversor bajo el Art. 1614 del CCCN.
                </span>
              </div>
            </label>

            {cesion.activo && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-amber-500/20 rounded-2xl">
                <Campo label="Socio Cedente">
                  <FormSelect
                    disabled={!isAdmin}
                    value={cesion.socioCedente}
                    onChange={(e) => setCesionField('socioCedente', Number(e.target.value))}
                  >
                    {Array.from({ length: Number(p.cantidadDeptos) || 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Socio / Depto {i + 1}
                      </option>
                    ))}
                  </FormSelect>
                </Campo>

                <Campo label="Mes / Cuota de Salida">
                  <FormInput
                    type="number"
                    min={1}
                    max={p.cantidadCuotas || 48}
                    disabled={!isAdmin}
                    value={cesion.cuotaSalida || ''}
                    onChange={(e) => setCesionField('cuotaSalida', Number(e.target.value) || 1)}
                  />
                </Campo>

                <Campo label="Prima de Cesión (%)">
                  <FormInput
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    disabled={!isAdmin}
                    value={cesion.primaCesion !== undefined ? cesion.primaCesion : ''}
                    onChange={(e) => setCesionField('primaCesion', Number(e.target.value) || 0)}
                  />
                </Campo>

                <Campo label="Mecanismo de Salida">
                  <FormSelect
                    disabled={!isAdmin}
                    value={cesion.mecanismoSalida}
                    onChange={(e) => setCesionField('mecanismoSalida', e.target.value as MecanismoSalida)}
                  >
                    <option value="tercero">Tercero Ingresante</option>
                    <option value="preferencia">Derecho Preferencia Socios</option>
                    <option value="diferido">Pago Diferido al Final</option>
                  </FormSelect>
                </Campo>
              </div>
            )}
          </div>
        </FormSeccion>

        {/* ── 5. SECCIÓN: ADELANTO DE CAPITAL / LICITACIÓN ANTICIPADA ───────── */}
        <FormSeccion
          id="adelanto"
          titulo="⚡ Adelanto de Capital / Licitación Anticipada"
          badge={adelanto.activo ? `Activo (USD ${Number(adelanto.monto).toLocaleString('es-AR')} en mes ${adelanto.cuota})` : 'Inactivo'}
          badgeColor={adelanto.activo ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400'}
          isOpen={seccionAbierta === 'adelanto'}
          onToggle={() => setSeccionAbierta((prev) => (prev === 'adelanto' ? 'gastos' : 'adelanto'))}
        >
          <div className="space-y-4">
            {/* Toggle de activación */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={!!adelanto.activo}
                onChange={(e) => setAdelantoField('activo', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  Habilitar Inyección Extraordinaria / Licitación Anticipada de Cuotas
                </span>
                <span className="text-[11px] text-slate-400">
                  Permite que un socio adelante capital en una cuota determinada para reducir su cuota o acortar su plan.
                </span>
              </div>
            </label>

            {adelanto.activo && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-indigo-500/20 rounded-2xl">
                <Campo label="Socio que Adelanta">
                  <FormSelect
                    disabled={!isAdmin}
                    value={adelanto.socioAdelanta}
                    onChange={(e) => setAdelantoField('socioAdelanta', Number(e.target.value))}
                  >
                    {Array.from({ length: Number(p.cantidadDeptos) || 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Socio / Depto {i + 1}
                      </option>
                    ))}
                  </FormSelect>
                </Campo>

                <Campo label="Monto a Adelantar (USD)">
                  <FormInput
                    type="number"
                    min={500}
                    step={500}
                    disabled={!isAdmin}
                    value={adelanto.monto || ''}
                    onChange={(e) => setAdelantoField('monto', Number(e.target.value) || 0)}
                  />
                </Campo>

                <Campo label="Mes / Cuota de Inyección">
                  <FormInput
                    type="number"
                    min={1}
                    max={p.cantidadCuotas || 48}
                    disabled={!isAdmin}
                    value={adelanto.cuota || ''}
                    onChange={(e) => setAdelantoField('cuota', Number(e.target.value) || 1)}
                  />
                </Campo>

                <Campo label="Estrategia de Impacto">
                  <FormSelect
                    disabled={!isAdmin}
                    value={adelanto.estrategia}
                    onChange={(e) => setAdelantoField('estrategia', e.target.value as EstrategiaImpactoAdelanto)}
                  >
                    <option value="reducir_cuota">Reducir Cuotas Restantes</option>
                    <option value="acelerar">Acelerar y Reducir Plazo</option>
                  </FormSelect>
                </Campo>
              </div>
            )}
          </div>
        </FormSeccion>

        {/* ── 6. SECCIÓN: GASTOS FIDUCIARIOS ───────────────────────────────── */}
        <FormSeccion
          id="gastos"
          titulo="💼 Gastos Fiduciarios y Honorarios"
          badge={`${g.comisionGestion}% Gestión • ${g.comisionEscribania}% Escribanía`}
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
                <option value="final">Al Final (Posesión)</option>
                <option value="prorrateado">Prorrateado en Cuotas</option>
                <option value="primer_cuota">En la 1era Cuota</option>
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

        {/* Preview de Cuota Estimada y Totales */}
        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium">Cuota pura estimada por unidad</p>
            <p className="text-xl font-black text-emerald-400 font-mono">
              {Number(p.costoDepto) > 0 && Number(p.cantidadCuotas) > 0
                ? `USD ${Math.round(Number(p.costoDepto) / Number(p.cantidadCuotas)).toLocaleString('es-AR')}/mes`
                : '—'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400">Presupuesto total del Fideicomiso</p>
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
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl shadow-black/60 my-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {isList && (isAdmin ? 'Gestión y Simulación de Obras (Panel Administrador)' : 'Obras y Proyectos Fiduciarios')}
                {mode === 'new' && 'Nueva Obra / Escenario de Simulación'}
                {mode === 'edit' && (isAdmin ? 'Editar Obra y Parámetros' : 'Detalles Oficiales del Plan')}
                {isDelete && 'Confirmar Eliminación'}
              </h3>
              <p className="text-xs text-slate-400">
                {isList && `${proyectos.length} proyectos registrados • Obras activas y simulaciones`}
                {isForm && (isAdmin ? 'Configurá dirección, fotos, anticipos, cesión y adelantos' : 'Especificaciones técnicas, financieras y contractuales (Solo lectura)')}
                {isDelete && 'Acción irreversible'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
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
        <div className="p-5 max-h-[72vh] overflow-y-auto">
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
                    Crear Nueva Obra / Simulación
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
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
                      onClick={() => { setMode('list'); setFeedback(null); }}
                      className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Volver a la lista
                    </button>
                  )}
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {guardando ? 'Guardando...' : mode === 'new' ? 'Crear Proyecto' : 'Guardar Cambios'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm">
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Solo modificable con Perfil Administrador</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

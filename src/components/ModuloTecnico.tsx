import React, { useState, useMemo, useEffect } from 'react';
import type {
  DatosTecnicosProyecto,
  TramiteOrganismo,
  DocumentoTecnico,
  CategoriaOrganismo,
  EstadoTramite,
  ProfesionalTecnico,
  EtapaObra
} from '../types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';
import type { UserProfile } from '../types/auth';
import { CentroMensajes } from './CentroMensajes';
import {
  Landmark,
  HardHat,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Download,
  Trash2,
  FolderPlus,
  Users,
  Ruler,
  Edit3,
  MapPin,
  Layers,
  Phone,
  Mail,
  Briefcase,
  FileBadge,
  X,
  Save,
  MessageSquare,
  LogOut
} from 'lucide-react';

interface ModuloTecnicoProps {
  datosTecnicos: DatosTecnicosProyecto;
  fondoNombre: string;
  fondoId?: string;
  currentUser?: UserProfile;
  isReadOnly?: boolean;
  onUpdateDatosTecnicos: (newDatos: DatosTecnicosProyecto) => void;
  onSignOut?: () => void;
}

export const ModuloTecnico: React.FC<ModuloTecnicoProps> = ({
  datosTecnicos,
  fondoNombre,
  fondoId = 'default',
  currentUser,
  isReadOnly = false,
  onUpdateDatosTecnicos,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'tramites' | 'avance' | 'planos' | 'memoria' | 'mensajes'>('tramites');

  // Modal / Form para Trámite (Crear y Editar)
  const [isTramiteModalOpen, setIsTramiteModalOpen] = useState(false);
  const [editingTramiteId, setEditingTramiteId] = useState<string | null>(null);
  const [tramiteForm, setTramiteForm] = useState<{
    organismo: CategoriaOrganismo;
    titulo: string;
    numeroExpediente: string;
    estado: EstadoTramite;
    fechaInicio: string;
    observaciones: string;
  }>({
    organismo: 'Municipalidad',
    titulo: '',
    numeroExpediente: '',
    estado: 'en_tramite',
    fechaInicio: new Date().toISOString().slice(0, 10),
    observaciones: ''
  });

  // Modal / Form para Etapa de Obra (Crear y Editar)
  const [isEtapaModalOpen, setIsEtapaModalOpen] = useState(false);
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);
  const [etapaForm, setEtapaForm] = useState<{
    nombre: string;
    pesoPonderado: number;
    porcentajeReal: number;
    fechaInicioEstimada: string;
    fechaFinEstimada: string;
  }>({
    nombre: '',
    pesoPonderado: 10,
    porcentajeReal: 0,
    fechaInicioEstimada: 'Mes 1',
    fechaFinEstimada: 'Mes 3'
  });

  // Modal / Form para Documento / Plano (Crear y Editar)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<{
    categoria: DocumentoTecnico['categoria'];
    nombre: string;
    numeroPlanoResolucion: string;
    profesionalFirmante: string;
  }>({
    categoria: 'Plano Arquitectura',
    nombre: '',
    numeroPlanoResolucion: '',
    profesionalFirmante: ''
  });

  // Modal / Form para Editar Ficha Técnica
  const [isEditFichaOpen, setIsEditFichaOpen] = useState(false);
  const [fichaForm, setFichaForm] = useState({
    superficieTotalM2: datosTecnicos.superficieTotalM2 || 1250,
    superficieCubiertaM2: datosTecnicos.superficieCubiertaM2 || 1100,
    superficieSemicubiertaM2: datosTecnicos.superficieSemicubiertaM2 || 150,
    superficieTerrenoM2: datosTecnicos.superficieTerrenoM2 || 450,
    cantidadPisos: datosTecnicos.cantidadPisos || 5,
    cantidadUnidades: datosTecnicos.cantidadUnidades || 10,
    direccionObra: datosTecnicos.direccionObra || 'Av. Libertador 1450, Zona Céntrica',
    nomenclaturaCatastral: datosTecnicos.nomenclaturaCatastral || 'Circ. I, Secc. B, Manz. 24, Parc. 12',
    partidaInmobiliaria: datosTecnicos.partidaInmobiliaria || '045-894120-7',
    numeroPermisoObra: datosTecnicos.numeroPermisoObra || 'EXP-MUNIC-2026-89412',
    memoriaDescriptiva: datosTecnicos.memoriaDescriptiva || 'Edificio residencial de categoría desarrollado en PB y 4 plantas tipo con 10 unidades de 2 y 3 ambientes. Estructura independiente de H°A°, cerramientos de doble muro con cámara de aire, aberturas de aluminio DVH y terminaciones de primera línea.'
  });

  // Modal / Form para Crear o Editar Profesional
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [editingProfId, setEditingProfId] = useState<string | null>(null);
  const [profForm, setProfForm] = useState<Omit<ProfesionalTecnico, 'id'>>({
    rol: 'Director de Obra',
    nombre: '',
    matricula: '',
    entidadColegiada: 'Colegio de Arquitectos',
    empresa: '',
    telefono: '',
    email: ''
  });

  // Sincronizar formulario de Ficha Técnica cuando cambia el fondo activo
  useEffect(() => {
    setFichaForm({
      superficieTotalM2: datosTecnicos.superficieTotalM2 || 1250,
      superficieCubiertaM2: datosTecnicos.superficieCubiertaM2 || 1100,
      superficieSemicubiertaM2: datosTecnicos.superficieSemicubiertaM2 || 150,
      superficieTerrenoM2: datosTecnicos.superficieTerrenoM2 || 450,
      cantidadPisos: datosTecnicos.cantidadPisos || 5,
      cantidadUnidades: datosTecnicos.cantidadUnidades || 10,
      direccionObra: datosTecnicos.direccionObra || 'Av. Libertador 1450, Zona Céntrica',
      nomenclaturaCatastral: datosTecnicos.nomenclaturaCatastral || 'Circ. I, Secc. B, Manz. 24, Parc. 12',
      partidaInmobiliaria: datosTecnicos.partidaInmobiliaria || '045-894120-7',
      numeroPermisoObra: datosTecnicos.numeroPermisoObra || 'EXP-MUNIC-2026-89412',
      memoriaDescriptiva: datosTecnicos.memoriaDescriptiva || ''
    });
  }, [datosTecnicos]);

  // Lista normalizada de profesionales
  const listaProfesionales: ProfesionalTecnico[] = useMemo(() => {
    if (datosTecnicos.profesionales && datosTecnicos.profesionales.length > 0) {
      return datosTecnicos.profesionales;
    }
    const legacy: ProfesionalTecnico[] = [];
    if (datosTecnicos.directorObra) {
      legacy.push({
        id: 'prof-legacy-1',
        rol: 'Director de Obra',
        nombre: datosTecnicos.directorObra,
        matricula: 'CAPBA 18452',
        entidadColegiada: 'Colegio de Arquitectos'
      });
    }
    if (datosTecnicos.calculistaEstructural) {
      legacy.push({
        id: 'prof-legacy-2',
        rol: 'Cálculo Estructural H°A°',
        nombre: datosTecnicos.calculistaEstructural,
        matricula: 'CIPBA 22104',
        entidadColegiada: 'Colegio de Ingenieros'
      });
    }
    if (datosTecnicos.empresaConstructora) {
      legacy.push({
        id: 'prof-legacy-3',
        rol: 'Empresa Constructora Principal',
        nombre: datosTecnicos.empresaConstructora,
        empresa: datosTecnicos.empresaConstructora
      });
    }
    return legacy.length > 0 ? legacy : DATOS_TECNICOS_DEFAULT.profesionales || [];
  }, [datosTecnicos]);

  // Cálculo de avance global ponderado
  const avanceGlobal = Math.round(
    datosTecnicos.etapas.reduce((acc, curr) => acc + (curr.porcentajeReal * (curr.pesoPonderado / 100)), 0)
  );

  // ------------------------------------------------------------------
  // Handlers para Ficha Técnica
  // ------------------------------------------------------------------
  const handleSaveFicha = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDatosTecnicos({
      ...datosTecnicos,
      superficieTotalM2: Number(fichaForm.superficieTotalM2) || 0,
      superficieCubiertaM2: Number(fichaForm.superficieCubiertaM2) || 0,
      superficieSemicubiertaM2: Number(fichaForm.superficieSemicubiertaM2) || 0,
      superficieTerrenoM2: Number(fichaForm.superficieTerrenoM2) || 0,
      cantidadPisos: Number(fichaForm.cantidadPisos) || 1,
      cantidadUnidades: Number(fichaForm.cantidadUnidades) || 1,
      direccionObra: fichaForm.direccionObra,
      nomenclaturaCatastral: fichaForm.nomenclaturaCatastral,
      partidaInmobiliaria: fichaForm.partidaInmobiliaria,
      numeroPermisoObra: fichaForm.numeroPermisoObra,
      memoriaDescriptiva: fichaForm.memoriaDescriptiva
    });
    setIsEditFichaOpen(false);
  };

  // ------------------------------------------------------------------
  // Handlers para Profesionales
  // ------------------------------------------------------------------
  const handleOpenNewProf = () => {
    setEditingProfId(null);
    setProfForm({
      rol: 'Director de Obra',
      nombre: '',
      matricula: '',
      entidadColegiada: 'Colegio de Arquitectos',
      empresa: '',
      telefono: '',
      email: ''
    });
    setIsProfModalOpen(true);
  };

  const handleOpenEditProf = (prof: ProfesionalTecnico) => {
    setEditingProfId(prof.id);
    setProfForm({
      rol: prof.rol,
      nombre: prof.nombre,
      matricula: prof.matricula || '',
      entidadColegiada: prof.entidadColegiada || '',
      empresa: prof.empresa || '',
      telefono: prof.telefono || '',
      email: prof.email || ''
    });
    setIsProfModalOpen(true);
  };

  const handleSaveProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profForm.nombre.trim()) return;

    let updatedList: ProfesionalTecnico[];
    if (editingProfId) {
      updatedList = listaProfesionales.map((p) =>
        p.id === editingProfId ? { ...profForm, id: editingProfId } : p
      );
    } else {
      const nuevoProf: ProfesionalTecnico = {
        ...profForm,
        id: `prof-${Date.now()}`
      };
      updatedList = [...listaProfesionales, nuevoProf];
    }

    // Actualizar también campos legacy para consistencia
    const dir = updatedList.find((p) => p.rol.toLowerCase().includes('director'))?.nombre || datosTecnicos.directorObra;
    const calc = updatedList.find((p) => p.rol.toLowerCase().includes('estructur') || p.rol.toLowerCase().includes('cálculo'))?.nombre || datosTecnicos.calculistaEstructural;
    const emp = updatedList.find((p) => p.rol.toLowerCase().includes('constructora') || p.rol.toLowerCase().includes('empresa'))?.nombre || datosTecnicos.empresaConstructora;

    onUpdateDatosTecnicos({
      ...datosTecnicos,
      directorObra: dir,
      calculistaEstructural: calc,
      empresaConstructora: emp,
      profesionales: updatedList
    });

    setIsProfModalOpen(false);
  };

  const handleDeleteProf = (id: string) => {
    if (confirm('¿Confirma que desea eliminar este profesional de la nómina?')) {
      const updatedList = listaProfesionales.filter((p) => p.id !== id);
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        profesionales: updatedList
      });
    }
  };

  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Handlers para trámites (Crear y Editar)
  // ------------------------------------------------------------------
  const handleOpenNewTramite = () => {
    setEditingTramiteId(null);
    setTramiteForm({
      organismo: 'Municipalidad',
      titulo: '',
      numeroExpediente: '',
      estado: 'en_tramite',
      fechaInicio: new Date().toISOString().slice(0, 10),
      observaciones: ''
    });
    setIsTramiteModalOpen(true);
  };

  const handleOpenEditTramite = (t: TramiteOrganismo) => {
    setEditingTramiteId(t.id);
    setTramiteForm({
      organismo: t.organismo,
      titulo: t.titulo,
      numeroExpediente: t.numeroExpediente,
      estado: t.estado,
      fechaInicio: t.fechaInicio || new Date().toISOString().slice(0, 10),
      observaciones: t.observaciones || ''
    });
    setIsTramiteModalOpen(true);
  };

  const handleSaveTramite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tramiteForm.titulo.trim()) return;

    if (editingTramiteId) {
      const updated = datosTecnicos.tramites.map((t) =>
        t.id === editingTramiteId
          ? {
              ...t,
              ...tramiteForm,
              titulo: tramiteForm.titulo.trim(),
              numeroExpediente: tramiteForm.numeroExpediente.trim() || t.numeroExpediente,
              fechaAprobacion:
                tramiteForm.estado === 'aprobado'
                  ? t.fechaAprobacion || new Date().toISOString().slice(0, 10)
                  : undefined
            }
          : t
      );
      onUpdateDatosTecnicos({ ...datosTecnicos, tramites: updated });
    } else {
      const nuevo: TramiteOrganismo = {
        id: `t-${Date.now()}`,
        organismo: tramiteForm.organismo,
        titulo: tramiteForm.titulo.trim(),
        numeroExpediente:
          tramiteForm.numeroExpediente.trim() || `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
        estado: tramiteForm.estado,
        fechaInicio: tramiteForm.fechaInicio || new Date().toISOString().slice(0, 10),
        fechaAprobacion:
          tramiteForm.estado === 'aprobado' ? new Date().toISOString().slice(0, 10) : undefined,
        observaciones: tramiteForm.observaciones.trim()
      };
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        tramites: [nuevo, ...datosTecnicos.tramites]
      });
    }

    setIsTramiteModalOpen(false);
  };

  const handleUpdateEstadoTramite = (id: string, estado: EstadoTramite) => {
    const updated = datosTecnicos.tramites.map((t) =>
      t.id === id
        ? {
            ...t,
            estado,
            fechaAprobacion: estado === 'aprobado' ? new Date().toISOString().slice(0, 10) : undefined
          }
        : t
    );
    onUpdateDatosTecnicos({ ...datosTecnicos, tramites: updated });
  };

  const handleDeleteTramite = (id: string) => {
    if (confirm('¿Confirma que desea eliminar este trámite de la lista?')) {
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        tramites: datosTecnicos.tramites.filter((t) => t.id !== id)
      });
    }
  };

  // ------------------------------------------------------------------
  // Handlers para etapas de obra (Crear, Editar y Eliminar)
  // ------------------------------------------------------------------
  const handleOpenNewEtapa = () => {
    setEditingEtapaId(null);
    setEtapaForm({
      nombre: '',
      pesoPonderado: 10,
      porcentajeReal: 0,
      fechaInicioEstimada: `Mes ${datosTecnicos.etapas.length * 2 + 1}`,
      fechaFinEstimada: `Mes ${datosTecnicos.etapas.length * 2 + 4}`
    });
    setIsEtapaModalOpen(true);
  };

  const handleOpenEditEtapa = (et: EtapaObra) => {
    setEditingEtapaId(et.id);
    setEtapaForm({
      nombre: et.nombre,
      pesoPonderado: et.pesoPonderado,
      porcentajeReal: et.porcentajeReal,
      fechaInicioEstimada: et.fechaInicioEstimada,
      fechaFinEstimada: et.fechaFinEstimada
    });
    setIsEtapaModalOpen(true);
  };

  const handleSaveEtapa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!etapaForm.nombre.trim()) return;

    const p = Math.max(0, Math.min(100, Number(etapaForm.porcentajeReal) || 0));
    const peso = Math.max(0, Math.min(100, Number(etapaForm.pesoPonderado) || 0));
    const estado: 'pendiente' | 'en_progreso' | 'completada' =
      p === 100 ? 'completada' : p > 0 ? 'en_progreso' : 'pendiente';

    if (editingEtapaId) {
      const updated = datosTecnicos.etapas.map((et) =>
        et.id === editingEtapaId
          ? {
              ...et,
              nombre: etapaForm.nombre.trim(),
              pesoPonderado: peso,
              porcentajeReal: p,
              fechaInicioEstimada: etapaForm.fechaInicioEstimada.trim(),
              fechaFinEstimada: etapaForm.fechaFinEstimada.trim(),
              estado
            }
          : et
      );
      onUpdateDatosTecnicos({ ...datosTecnicos, etapas: updated });
    } else {
      const nueva: EtapaObra = {
        id: `etapa-${Date.now()}`,
        nombre: etapaForm.nombre.trim(),
        pesoPonderado: peso,
        porcentajeReal: p,
        fechaInicioEstimada: etapaForm.fechaInicioEstimada.trim() || 'Inicio',
        fechaFinEstimada: etapaForm.fechaFinEstimada.trim() || 'Fin',
        estado
      };
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        etapas: [...datosTecnicos.etapas, nueva]
      });
    }

    setIsEtapaModalOpen(false);
  };

  const handleDeleteEtapa = (id: string) => {
    if (confirm('¿Confirma que desea eliminar esta etapa del cronograma de obra?')) {
      const updated = datosTecnicos.etapas.filter((et) => et.id !== id);
      onUpdateDatosTecnicos({ ...datosTecnicos, etapas: updated });
    }
  };

  const handleUpdatePorcentajeEtapa = (id: string, porcentaje: number) => {
    const updated = datosTecnicos.etapas.map((et) => {
      if (et.id === id) {
        const p = Math.max(0, Math.min(100, porcentaje));
        const estado: 'pendiente' | 'en_progreso' | 'completada' =
          p === 100 ? 'completada' : p > 0 ? 'en_progreso' : 'pendiente';
        return { ...et, porcentajeReal: p, estado };
      }
      return et;
    });
    onUpdateDatosTecnicos({ ...datosTecnicos, etapas: updated });
  };

  // ------------------------------------------------------------------
  // Handlers para documentos (Crear, Editar y Eliminar)
  // ------------------------------------------------------------------
  const handleOpenNewDoc = () => {
    setEditingDocId(null);
    setDocForm({
      categoria: 'Plano Arquitectura',
      nombre: '',
      numeroPlanoResolucion: '',
      profesionalFirmante: datosTecnicos.directorObra || ''
    });
    setIsDocModalOpen(true);
  };

  const handleOpenEditDoc = (doc: DocumentoTecnico) => {
    setEditingDocId(doc.id);
    setDocForm({
      categoria: doc.categoria,
      nombre: doc.nombre,
      numeroPlanoResolucion: doc.numeroPlanoResolucion || '',
      profesionalFirmante: doc.profesionalFirmante || ''
    });
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.nombre.trim()) return;

    if (editingDocId) {
      const updated = datosTecnicos.documentos.map((d) =>
        d.id === editingDocId
          ? {
              ...d,
              categoria: docForm.categoria,
              nombre: docForm.nombre.trim(),
              numeroPlanoResolucion: docForm.numeroPlanoResolucion.trim() || '-',
              profesionalFirmante: docForm.profesionalFirmante.trim() || datosTecnicos.directorObra
            }
          : d
      );
      onUpdateDatosTecnicos({ ...datosTecnicos, documentos: updated });
    } else {
      const nuevo: DocumentoTecnico = {
        id: `d-${Date.now()}`,
        categoria: docForm.categoria,
        nombre: docForm.nombre.trim(),
        numeroPlanoResolucion: docForm.numeroPlanoResolucion.trim() || 'PL-REV-01',
        fechaCarga: new Date().toISOString().slice(0, 10),
        profesionalFirmante: docForm.profesionalFirmante.trim() || datosTecnicos.directorObra,
        tamanio: '3.5 MB'
      };
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        documentos: [nuevo, ...datosTecnicos.documentos]
      });
    }

    setIsDocModalOpen(false);
  };

  const handleDeleteDocumento = (id: string) => {
    if (confirm('¿Confirma que desea eliminar este documento / plano?')) {
      onUpdateDatosTecnicos({
        ...datosTecnicos,
        documentos: datosTecnicos.documentos.filter((d) => d.id !== id)
      });
    }
  };

  // Helper de badges de estado
  const renderEstadoTramiteBadge = (estado: EstadoTramite) => {
    switch (estado) {
      case 'aprobado':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Aprobado / Concluido
          </span>
        );
      case 'en_tramite':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> En Trámite / Revisión
          </span>
        );
      case 'observado':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Con Observaciones
          </span>
        );
      case 'iniciado':
      default:
        return (
          <span className="bg-slate-700/80 text-slate-300 border border-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <FileText className="w-3 h-3" /> Ingresado / Iniciado
          </span>
        );
    }
  };

  return (
    <section className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      
      {/* Cabecera del Panel Técnico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Dirección Técnica y Gestoría Pública
              </h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                Carpeta Técnica Oficial
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Proyecto: <strong className="text-white">{fondoNombre}</strong> • Permiso de Obra: <strong className="text-amber-400 font-mono">{datosTecnicos.numeroPermisoObra || 'En trámite'}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Badge de avance global */}
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Avance Físico Global</span>
              <span className="text-lg sm:text-xl font-mono font-black text-amber-300">{avanceGlobal}% Ejecutado</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              {avanceGlobal}%
            </div>
          </div>

          {/* Botón Salir de la cuenta */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/40 px-3.5 py-3 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Cerrar sesión de Equipo Técnico"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Salir de la cuenta</span>
            </button>
          )}
        </div>
      </div>

      {/* Pestañas del Módulo Técnico */}
      <div className="flex flex-wrap border-b border-slate-800 bg-slate-950/60 rounded-2xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('tramites')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tramites'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Trámites y Permisos Públicos ({datosTecnicos.tramites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('avance')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'avance'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>Cronograma de Obra ({avanceGlobal}%)</span>
        </button>

        <button
          onClick={() => setActiveTab('planos')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'planos'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Planos y Documentación ({datosTecnicos.documentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('memoria')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'memoria'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Ficha Técnica y Profesionales</span>
        </button>

        {!isReadOnly && currentUser && currentUser.role !== 'socio' && (
          <button
            onClick={() => setActiveTab('mensajes')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mensajes'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comunicaciones con Administración</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* PESTAÑA 1: TRÁMITES ANTE ORGANISMOS PÚBLICOS                        */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'tramites' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>Gestiones y Permisos ante Entes Gubernamentales</span>
              </h3>
              <p className="text-xs text-slate-400">
                Seguimiento de números de expediente, convalidaciones municipales, servicios y agrimensura
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleOpenNewTramite}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Trámite / Permiso</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Organismo</th>
                  <th className="py-3 px-3">Trámite / Asunto</th>
                  <th className="py-3 px-3 font-mono">N° Expediente</th>
                  <th className="py-3 px-3">Fecha Inicio</th>
                  <th className="py-3 px-3">Estado Actual</th>
                  <th className="py-3 px-3">Observaciones / Dictamen</th>
                  {!isReadOnly && <th className="py-3 px-3 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {datosTecnicos.tramites.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No hay trámites cargados actualmente para este proyecto.
                    </td>
                  </tr>
                ) : (
                  datosTecnicos.tramites.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-slate-200">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-300">
                          {t.organismo}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{t.titulo}</td>
                      <td className="py-3 px-3 font-mono text-amber-300 text-[11px]">
                        {t.numeroExpediente}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{t.fechaInicio}</td>
                      <td className="py-3 px-3">
                        {!isReadOnly ? (
                          <select
                            value={t.estado}
                            onChange={(e) => handleUpdateEstadoTramite(t.id, e.target.value as EstadoTramite)}
                            className="bg-slate-950 border border-slate-700 text-[11px] font-bold rounded-lg px-2 py-1 text-slate-200 focus:border-amber-500 outline-none"
                          >
                            <option value="iniciado">Iniciado</option>
                            <option value="en_tramite">En Trámite</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="observado">Observado</option>
                          </select>
                        ) : (
                          renderEstadoTramiteBadge(t.estado)
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={t.observaciones}>
                        {t.observaciones || '-'}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditTramite(t)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded hover:bg-slate-800"
                              title="Editar trámite"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTramite(t.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-800"
                              title="Eliminar trámite"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PESTAÑA 2: CRONOGRAMA DE AVANCE FÍSICO DE OBRA                     */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'avance' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Certificación de Avance Físico Ponderado</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ponderación por rubro constructivo y porcentaje certificado por la dirección de obra
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono">
                Total: <strong>{datosTecnicos.etapas.reduce((acc, e) => acc + e.pesoPonderado, 0)}%</strong> • Ejecutado: <strong className="text-amber-400">{avanceGlobal}%</strong>
              </div>
              {!isReadOnly && (
                <button
                  onClick={handleOpenNewEtapa}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Etapa</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {datosTecnicos.etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-all"
              >
                <div className="flex-1 space-y-1 w-full sm:w-auto">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-white font-semibold flex items-center gap-2">
                      {etapa.nombre}
                    </strong>
                    <span className="text-[11px] font-mono text-slate-400">
                      Peso: <strong className="text-slate-200">{etapa.pesoPonderado}%</strong>
                    </span>
                  </div>

                  {/* Barra de progreso de la etapa */}
                  <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        etapa.porcentajeReal === 100
                          ? 'bg-emerald-500'
                          : etapa.porcentajeReal > 0
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${etapa.porcentajeReal}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Est: {etapa.fechaInicioEstimada} al {etapa.fechaFinEstimada}</span>
                    <span>
                      {etapa.porcentajeReal === 100 ? (
                        <span className="text-emerald-400 font-bold">100% Concluido</span>
                      ) : (
                        <span>Avance: {etapa.porcentajeReal}%</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Control interactivo de porcentaje y acciones de etapa */}
                {!isReadOnly ? (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={etapa.porcentajeReal}
                        onChange={(e) => handleUpdatePorcentajeEtapa(etapa.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs font-bold px-2 py-1.5 rounded-lg text-center focus:border-amber-500 outline-none"
                        title="Porcentaje de avance ejecutado"
                      />
                      <span className="text-xs text-slate-400 font-mono">%</span>
                    </div>
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => handleOpenEditEtapa(etapa)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded hover:bg-slate-800"
                        title="Editar datos de la etapa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEtapa(etapa.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-800"
                        title="Eliminar etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs font-bold text-amber-300 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                    {etapa.porcentajeReal}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PESTAÑA 3: PLANOS Y DOCUMENTACIÓN OFICIAL                         */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'planos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span>Legajo de Planos, Estructuras y Resoluciones</span>
              </h3>
              <p className="text-xs text-slate-400">
                Documentación digitalizada firmada por profesionales responsables y apta para consulta
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={handleOpenNewDoc}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Agregar Documento / Plano</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {datosTecnicos.documentos.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex flex-col justify-between space-y-3 transition-all shadow-sm"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono block">
                    {doc.categoria}
                  </span>
                  <strong className="text-xs text-white block">{doc.nombre}</strong>
                  <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                    <div>Ref/Plano: <span className="text-slate-200">{doc.numeroPlanoResolucion || '-'}</span></div>
                    <div>Firmante: <span className="text-slate-300">{doc.profesionalFirmante || '-'}</span></div>
                    <div>Fecha: {doc.fechaCarga} • {doc.tamanio || 'PDF'}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => alert(`Descarga de demostración de: ${doc.nombre}`)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Archivo</span>
                  </button>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditDoc(doc)}
                        className="p-1 text-slate-400 hover:text-amber-400 transition-colors rounded hover:bg-slate-800"
                        title="Editar datos del plano o documento"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocumento(doc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-800"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PESTAÑA 4: FICHA TÉCNICA Y PROFESIONALES (EDITABLE COMPLETO)       */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'memoria' && (
        <div className="space-y-6">
          
          {/* Cabecera de la sección con botón de edición */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <span>Ficha Técnica y Equipo Profesional del Emprendimiento</span>
              </h3>
              <p className="text-xs text-slate-400">
                Parámetros dimensionales, datos catastrales, memoria constructiva y nómina colegiada
              </p>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setIsEditFichaOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Ficha Técnica Completa</span>
              </button>
            )}
          </div>

          {/* Bloque 1: Métricas Dimensionales Clave */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sup. Total</span>
              <strong className="text-base sm:text-lg font-mono text-white block mt-1">
                {datosTecnicos.superficieTotalM2 || 0} m²
              </strong>
              <span className="text-[10px] text-slate-500">Cubierta + Semic.</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sup. Cubierta</span>
              <strong className="text-base sm:text-lg font-mono text-emerald-400 block mt-1">
                {datosTecnicos.superficieCubiertaM2 || 0} m²
              </strong>
              <span className="text-[10px] text-slate-500">Unidades funcionales</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sup. Semicubierta</span>
              <strong className="text-base sm:text-lg font-mono text-amber-300 block mt-1">
                {datosTecnicos.superficieSemicubiertaM2 || 0} m²
              </strong>
              <span className="text-[10px] text-slate-500">Balcones y accesos</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sup. Terreno / Lote</span>
              <strong className="text-base sm:text-lg font-mono text-cyan-300 block mt-1">
                {datosTecnicos.superficieTerrenoM2 || 0} m²
              </strong>
              <span className="text-[10px] text-slate-500">Parcela catastral</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pisos / Altura</span>
              <strong className="text-base sm:text-lg font-mono text-indigo-300 block mt-1">
                {datosTecnicos.cantidadPisos || 1} Pisos
              </strong>
              <span className="text-[10px] text-slate-500">PB + Plantas Tipo</span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Unidades Totales</span>
              <strong className="text-base sm:text-lg font-mono text-purple-300 block mt-1">
                {datosTecnicos.cantidadUnidades || 10} Unidades
              </strong>
              <span className="text-[10px] text-slate-500">Departamentos</span>
            </div>
          </div>

          {/* Bloque 2: Datos Catastrales y Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px] mb-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Ubicación / Dirección de Obra
              </span>
              <p className="text-white font-medium">{datosTecnicos.direccionObra || 'No especificada'}</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px] mb-1">
                <FileBadge className="w-3.5 h-3.5 text-amber-400" />
                Permiso Municipal / Expediente
              </span>
              <p className="text-amber-300 font-mono font-bold">{datosTecnicos.numeroPermisoObra || 'En trámite'}</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px] mb-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Nomenclatura Catastral
              </span>
              <p className="text-slate-200 font-mono">{datosTecnicos.nomenclaturaCatastral || 'Sin asignar'}</p>
            </div>

            <div>
              <span className="text-slate-400 font-semibold flex items-center gap-1.5 text-[11px] mb-1">
                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                Partida Inmobiliaria
              </span>
              <p className="text-slate-200 font-mono">{datosTecnicos.partidaInmobiliaria || 'Sin asignar'}</p>
            </div>
          </div>

          {/* Bloque 3: Memoria Descriptiva */}
          {datosTecnicos.memoriaDescriptiva && (
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Memoria Descriptiva y Tipología Constructiva
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {datosTecnicos.memoriaDescriptiva}
              </p>
            </div>
          )}

          {/* Bloque 4: Profesionales a Cargo de la Obra (Lista Dinámica Completa) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Profesionales, Asesores Técnicos y Contratistas ({listaProfesionales.length})
                </h4>
              </div>

              {!isReadOnly && (
                <button
                  onClick={handleOpenNewProf}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Profesional</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {listaProfesionales.map((prof) => (
                <div
                  key={prof.id}
                  className="bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex flex-col justify-between space-y-3 transition-all shadow-sm group"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {prof.rol}
                      </span>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditProf(prof)}
                            title="Editar profesional"
                            className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProf(prof.id)}
                            title="Eliminar profesional"
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <strong className="text-sm font-bold text-white block">{prof.nombre}</strong>
                      {prof.empresa && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          {prof.empresa}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-800/80">
                      {prof.matricula && (
                        <div className="flex items-center gap-1">
                          <FileBadge className="w-3 h-3 text-indigo-400" />
                          <span>Mat: <strong className="text-slate-200">{prof.matricula}</strong> {prof.entidadColegiada ? `(${prof.entidadColegiada})` : ''}</span>
                        </div>
                      )}
                      {prof.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <a href={`tel:${prof.telefono}`} className="text-slate-300 hover:text-emerald-300 transition-colors">
                            {prof.telefono}
                          </a>
                        </div>
                      )}
                      {prof.email && (
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-sky-400" />
                          <a href={`mailto:${prof.email}`} className="text-slate-300 hover:text-sky-300 transition-colors truncate">
                            {prof.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* PESTAÑA 5: COMUNICACIONES CON ADMINISTRACIÓN FIDUCIARIA           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'mensajes' && currentUser && (
        <div className="space-y-4">
          <CentroMensajes
            user={currentUser}
            fondoId={fondoId}
            fondoNombre={fondoNombre}
            isEmbedded={true}
            initialContactRole="tecnico"
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDITAR FICHA TÉCNICA GENERAL                                */}
      {/* ------------------------------------------------------------------ */}
      {isEditFichaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Ruler className="w-4 h-4 text-amber-400" />
                <span>Editar Ficha Técnica y Catastral del Proyecto</span>
              </h3>
              <button onClick={() => setIsEditFichaOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFicha} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superficie Total (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fichaForm.superficieTotalM2}
                    onChange={(e) => setFichaForm({ ...fichaForm, superficieTotalM2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superficie Cubierta (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={fichaForm.superficieCubiertaM2}
                    onChange={(e) => setFichaForm({ ...fichaForm, superficieCubiertaM2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superficie Semicubierta (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fichaForm.superficieSemicubiertaM2}
                    onChange={(e) => setFichaForm({ ...fichaForm, superficieSemicubiertaM2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Superficie Terreno / Lote (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fichaForm.superficieTerrenoM2}
                    onChange={(e) => setFichaForm({ ...fichaForm, superficieTerrenoM2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cantidad de Pisos / Altura</label>
                  <input
                    type="number"
                    min={1}
                    value={fichaForm.cantidadPisos}
                    onChange={(e) => setFichaForm({ ...fichaForm, cantidadPisos: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={fichaForm.cantidadUnidades}
                    onChange={(e) => setFichaForm({ ...fichaForm, cantidadUnidades: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dirección / Ubicación de Obra</label>
                  <input
                    type="text"
                    value={fichaForm.direccionObra}
                    onChange={(e) => setFichaForm({ ...fichaForm, direccionObra: e.target.value })}
                    placeholder="Ej: Av. Libertador 1450, Piso 1..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° Permiso / Expediente Municipal</label>
                  <input
                    type="text"
                    value={fichaForm.numeroPermisoObra}
                    onChange={(e) => setFichaForm({ ...fichaForm, numeroPermisoObra: e.target.value })}
                    placeholder="Ej: EXP-MUNIC-2026-89412"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nomenclatura Catastral</label>
                  <input
                    type="text"
                    value={fichaForm.nomenclaturaCatastral}
                    onChange={(e) => setFichaForm({ ...fichaForm, nomenclaturaCatastral: e.target.value })}
                    placeholder="Ej: Circ. I, Secc. B, Manz. 24, Parc. 12"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Partida Inmobiliaria</label>
                  <input
                    type="text"
                    value={fichaForm.partidaInmobiliaria}
                    onChange={(e) => setFichaForm({ ...fichaForm, partidaInmobiliaria: e.target.value })}
                    placeholder="Ej: 045-894120-7"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Memoria Descriptiva & Tipología Constructiva</label>
                <textarea
                  rows={3}
                  value={fichaForm.memoriaDescriptiva}
                  onChange={(e) => setFichaForm({ ...fichaForm, memoriaDescriptiva: e.target.value })}
                  placeholder="Detalles sobre sistema estructural, cerramientos, instalaciones y terminaciones..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none resize-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditFichaOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios de Ficha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR / EDITAR PROFESIONAL                              */}
      {/* ------------------------------------------------------------------ */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingProfId ? 'Editar Datos del Profesional' : 'Registrar Nuevo Profesional a Cargo'}</span>
              </h3>
              <button onClick={() => setIsProfModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProf} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rol / Cargo en el Proyecto</label>
                <input
                  type="text"
                  required
                  value={profForm.rol}
                  onChange={(e) => setProfForm({ ...profForm, rol: e.target.value })}
                  placeholder="Ej: Director de Obra, Cálculo Estructural, Agrimensura..."
                  list="roles-sugeridos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
                <datalist id="roles-sugeridos">
                  <option value="Director de Obra" />
                  <option value="Cálculo y Proyecto Estructural H°A°" />
                  <option value="Empresa Constructora Principal" />
                  <option value="Agrimensura y Subdivisión PH" />
                  <option value="Seguridad e Higiene Laboral" />
                  <option value="Instalaciones Termomecánicas y Gas" />
                  <option value="Instalaciones Eléctricas y Baja Tensión" />
                  <option value="Proyecto y Diseño Arquitectónico" />
                  <option value="Estudio de Suelos y Geotecnia" />
                </datalist>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  required
                  value={profForm.nombre}
                  onChange={(e) => setProfForm({ ...profForm, nombre: e.target.value })}
                  placeholder="Ej: Arq. Roberto Gómez / Constructora Alfa S.A."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Matrícula / Registro</label>
                  <input
                    type="text"
                    value={profForm.matricula}
                    onChange={(e) => setProfForm({ ...profForm, matricula: e.target.value })}
                    placeholder="Ej: CAPBA 18452 / CIPBA 22104"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Entidad Colegiada</label>
                  <input
                    type="text"
                    value={profForm.entidadColegiada}
                    onChange={(e) => setProfForm({ ...profForm, entidadColegiada: e.target.value })}
                    placeholder="Ej: CAPBA / CIPBA / CPA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Empresa / Estudio Profesional</label>
                <input
                  type="text"
                  value={profForm.empresa}
                  onChange={(e) => setProfForm({ ...profForm, empresa: e.target.value })}
                  placeholder="Ej: Estudio Gómez & Asociados"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={profForm.telefono}
                    onChange={(e) => setProfForm({ ...profForm, telefono: e.target.value })}
                    placeholder="Ej: +54 11 4455-8899"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Profesional</label>
                  <input
                    type="email"
                    value={profForm.email}
                    onChange={(e) => setProfForm({ ...profForm, email: e.target.value })}
                    placeholder="Ej: contacto@estudio.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingProfId ? 'Guardar Cambios' : 'Registrar Profesional'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR / EDITAR TRÁMITE                                    */}
      {/* ------------------------------------------------------------------ */}
      {isTramiteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                <span>{editingTramiteId ? 'Editar Trámite Oficial' : 'Registrar Nuevo Trámite / Permiso Oficial'}</span>
              </h3>
              <button onClick={() => setIsTramiteModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTramite} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organismo Público</label>
                <select
                  value={tramiteForm.organismo}
                  onChange={(e) => setTramiteForm({ ...tramiteForm, organismo: e.target.value as CategoriaOrganismo })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="Municipalidad">Municipalidad (Dirección de Obras)</option>
                  <option value="Catastro / PH">Catastro / Subdivisión en PH</option>
                  <option value="Servicios Públicos">Servicios Públicos (Luz, Agua, Gas)</option>
                  <option value="Medio Ambiente">Medio Ambiente / Impacto Ambiental</option>
                  <option value="Bomberos / Seguridad">Bomberos / Seguridad contra Incendios</option>
                  <option value="Otros Organismos">Otros Organismos</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título del Trámite / Asunto</label>
                <input
                  type="text"
                  required
                  value={tramiteForm.titulo}
                  onChange={(e) => setTramiteForm({ ...tramiteForm, titulo: e.target.value })}
                  placeholder="Ej: Factibilidad de Gas Natural / Conexión de Red..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° de Expediente</label>
                  <input
                    type="text"
                    value={tramiteForm.numeroExpediente}
                    onChange={(e) => setTramiteForm({ ...tramiteForm, numeroExpediente: e.target.value })}
                    placeholder="Ej: EXP-2027-4891"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={tramiteForm.fechaInicio}
                    onChange={(e) => setTramiteForm({ ...tramiteForm, fechaInicio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estado del Trámite</label>
                <select
                  value={tramiteForm.estado}
                  onChange={(e) => setTramiteForm({ ...tramiteForm, estado: e.target.value as EstadoTramite })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="iniciado">Iniciado</option>
                  <option value="en_tramite">En Trámite</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="observado">Observado</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observaciones / Dictamen</label>
                <textarea
                  rows={2}
                  value={tramiteForm.observaciones}
                  onChange={(e) => setTramiteForm({ ...tramiteForm, observaciones: e.target.value })}
                  placeholder="Detalles sobre dictámenes, requisitos cumplimentados o próximos pasos..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none resize-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTramiteModalOpen(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTramiteId ? 'Guardar Cambios' : 'Registrar Trámite'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR / EDITAR ETAPA DE OBRA                             */}
      {/* ------------------------------------------------------------------ */}
      {isEtapaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>{editingEtapaId ? 'Editar Etapa de Obra' : 'Registrar Nueva Etapa de Obra'}</span>
              </h3>
              <button onClick={() => setIsEtapaModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEtapa} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre del Rubro o Etapa</label>
                <input
                  type="text"
                  required
                  value={etapaForm.nombre}
                  onChange={(e) => setEtapaForm({ ...etapaForm, nombre: e.target.value })}
                  placeholder="Ej: Fundaciones y Submuración / Mampostería..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Peso Ponderado (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={etapaForm.pesoPonderado}
                    onChange={(e) => setEtapaForm({ ...etapaForm, pesoPonderado: Number(e.target.value) || 0 })}
                    placeholder="Ej: 15"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Avance Certificado Actual (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={etapaForm.porcentajeReal}
                    onChange={(e) => setEtapaForm({ ...etapaForm, porcentajeReal: Number(e.target.value) || 0 })}
                    placeholder="Ej: 45"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimación Inicio</label>
                  <input
                    type="text"
                    value={etapaForm.fechaInicioEstimada}
                    onChange={(e) => setEtapaForm({ ...etapaForm, fechaInicioEstimada: e.target.value })}
                    placeholder="Ej: Mes 1 / Marzo 2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimación Fin</label>
                  <input
                    type="text"
                    value={etapaForm.fechaFinEstimada}
                    onChange={(e) => setEtapaForm({ ...etapaForm, fechaFinEstimada: e.target.value })}
                    placeholder="Ej: Mes 4 / Junio 2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEtapaModalOpen(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEtapaId ? 'Guardar Cambios' : 'Registrar Etapa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: REGISTRAR / EDITAR DOCUMENTO O PLANO                         */}
      {/* ------------------------------------------------------------------ */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>{editingDocId ? 'Editar Documento / Plano Técnico' : 'Agregar Documento / Plano Técnico'}</span>
              </h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Categoría del Archivo</label>
                <select
                  value={docForm.categoria}
                  onChange={(e) => setDocForm({ ...docForm, categoria: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                >
                  <option value="Plano Arquitectura">Plano de Arquitectura</option>
                  <option value="Estructura H°A°">Cálculo de Estructura H°A°</option>
                  <option value="Instalaciones">Planos de Instalaciones (Gas/Agua/Luz)</option>
                  <option value="Permiso / Resolución">Permiso Oficial / Resolución</option>
                  <option value="Memoria Descriptiva">Memoria Descriptiva y Pliego</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  value={docForm.nombre}
                  onChange={(e) => setDocForm({ ...docForm, nombre: e.target.value })}
                  placeholder="Ej: Plano de Instalación contra Incendios..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Identificador / N° Plano</label>
                  <input
                    type="text"
                    value={docForm.numeroPlanoResolucion}
                    onChange={(e) => setDocForm({ ...docForm, numeroPlanoResolucion: e.target.value })}
                    placeholder="Ej: PL-INC-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Profesional Firmante</label>
                  <input
                    type="text"
                    value={docForm.profesionalFirmante}
                    onChange={(e) => setDocForm({ ...docForm, profesionalFirmante: e.target.value })}
                    placeholder="Ej: Arq. María Soler..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDocId ? 'Guardar Cambios' : 'Guardar Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

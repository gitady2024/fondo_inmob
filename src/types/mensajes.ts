export type CategoriaMensaje =
  | 'consulta_general'
  | 'pago_cuota'
  | 'adelanto_licitacion'
  | 'cesion_contrato'
  | 'avance_obra'
  | 'tramite_municipal'
  | 'urgente'
  | 'otros';

export interface CategoriaInfo {
  key: CategoriaMensaje;
  label: string;
  badgeClass: string;
  descripcion: string;
  rolesPermitidos?: ('admin' | 'tecnico' | 'socio')[];
}

export const CATEGORIAS_CONFIG: Record<CategoriaMensaje, CategoriaInfo> = {
  consulta_general: {
    key: 'consulta_general',
    label: 'Consulta General',
    badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-600',
    descripcion: 'Consultas sobre el fondo, fechas o funcionamiento general'
  },
  pago_cuota: {
    key: 'pago_cuota',
    label: 'Pago de Cuota / Cartola',
    badgeClass: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    descripcion: 'Aviso o consulta sobre imputación de cuotas, transferencias o saldos'
  },
  adelanto_licitacion: {
    key: 'adelanto_licitacion',
    label: 'Adelanto de Capital / Licitación',
    badgeClass: 'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
    descripcion: 'Propuesta o consulta de inyección de capital para adelantar cuotas'
  },
  cesion_contrato: {
    key: 'cesion_contrato',
    label: 'Cesión Contractual (CCCN)',
    badgeClass: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
    descripcion: 'Trámites de cesión de boleto/derechos a terceros o preferencia fiduciaria'
  },
  avance_obra: {
    key: 'avance_obra',
    label: 'Avance de Obra',
    badgeClass: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    descripcion: 'Informes de certificación, hormigonado, compras de materiales o cronograma'
  },
  tramite_municipal: {
    key: 'tramite_municipal',
    label: 'Trámite / Expediente Municipal',
    badgeClass: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
    descripcion: 'Expedientes de obra, factibilidad de servicios, planos y colegios profesionales'
  },
  urgente: {
    key: 'urgente',
    label: 'Urgente / Prioritario',
    badgeClass: 'bg-rose-900/50 text-rose-300 border-rose-700/50',
    descripcion: 'Asuntos que requieren atención o resolución inmediata'
  },
  otros: {
    key: 'otros',
    label: 'Otros (Especificar motivo)',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-600',
    descripcion: 'Motivo particular o fuera de las categorías estándar'
  }
};

export interface ReplyPreview {
  id: string;
  asunto: string;
  contenido: string;
  senderNombre: string;
  senderRole: 'admin' | 'tecnico' | 'socio';
}

export type TipoDocumentoAdjunto = 'pdf' | 'excel' | 'word' | 'otro';

export interface AdjuntoMensaje {
  id: string;
  nombre: string;
  tamano: number; // Tamaño en bytes
  tipo: TipoDocumentoAdjunto;
  mimeType: string;
  dataUrl: string; // Base64 Data URL para descarga y visualización
}

export interface Mensaje {
  id: string;
  fondoId: string;

  // Remitente
  senderId: string;
  senderRole: 'admin' | 'tecnico' | 'socio';
  senderNombre: string;
  senderSocioId?: number; // Para rol 'socio' (1-indexed)

  // Destinatario
  receiverRole: 'admin' | 'tecnico' | 'socio';
  receiverSocioId?: number; // Para rol 'socio' (1-indexed)

  // Contenido y Categoría
  categoria: CategoriaMensaje;
  motivoPersonalizado?: string; // Motivo sucinto (obligatorio cuando categoria === 'otros')
  asunto: string;
  contenido: string;

  // Documentos adjuntos (Excel, Word, PDF)
  adjuntos?: AdjuntoMensaje[];

  // Hilos y Respuestas
  replyToId?: string;
  replyToPreview?: ReplyPreview;

  // Estado y Tiempos
  leido: boolean;
  fechaLectura?: string; // ISO string de cuando se marcó como leído
  fechaCreacion: string; // ISO string
}

export interface NuevoMensajeInput {
  fondoId: string;
  receiverRole: 'admin' | 'tecnico' | 'socio';
  receiverSocioId?: number;
  categoria: CategoriaMensaje;
  motivoPersonalizado?: string;
  asunto: string;
  contenido: string;
  adjuntos?: AdjuntoMensaje[];
  replyToId?: string;
  replyToPreview?: ReplyPreview;
}

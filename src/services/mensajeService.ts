import type { UserProfile } from '../types/auth';
import type { Mensaje, NuevoMensajeInput, ReplyPreview } from '../types/mensajes';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_MENSAJES_KEY = 'fondo_inmobil_mensajes_store';

// Semilla inicial de mensajes demostrativos con aislamiento estricto
const MENSAJES_INICIALES_DEMO: Mensaje[] = [
  {
    id: 'msg-seed-1',
    fondoId: 'default',
    senderId: 'socio-1',
    senderRole: 'socio',
    senderNombre: 'Socio Inversor D1',
    senderSocioId: 1,
    receiverRole: 'admin',
    categoria: 'pago_cuota',
    asunto: 'Imputación del anticipo inicial y ajuste de cuota',
    contenido: 'Estimada Administración Fiduciaria: Quería confirmar si el anticipo inicial de USD 6.500 que realicé ya se encuentra debidamente imputado en la Cartola y si el recálculo de la cuota mensual amortizada aplica desde la cuota 1.',
    leido: true,
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // Hace 2 días
  },
  {
    id: 'msg-seed-2',
    fondoId: 'default',
    senderId: 'admin-1',
    senderRole: 'admin',
    senderNombre: 'Administrador Fiduciario',
    receiverRole: 'socio',
    receiverSocioId: 1,
    categoria: 'pago_cuota',
    asunto: 'Re: Imputación del anticipo inicial y ajuste de cuota',
    contenido: 'Estimado Inversor de la Unidad D1: Confirmamos que su anticipo de USD 6.500 está acreditado correctamente en la cuenta fiduciaria y la modalidad activa es "reducir_cuota", lo que aminora el valor mensual. Puede descargarlo y verificarlo en su pestaña de Cartola Individual.',
    replyToId: 'msg-seed-1',
    replyToPreview: {
      id: 'msg-seed-1',
      asunto: 'Imputación del anticipo inicial y ajuste de cuota',
      contenido: 'Estimada Administración Fiduciaria: Quería confirmar si el anticipo inicial...',
      senderNombre: 'Socio Inversor D1',
      senderRole: 'socio'
    },
    leido: true,
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString() // Hace 36h
  },
  {
    id: 'msg-seed-3',
    fondoId: 'default',
    senderId: 'tecnico-1',
    senderRole: 'tecnico',
    senderNombre: 'Equipo Técnico & Gestoría de Obras',
    receiverRole: 'admin',
    categoria: 'avance_obra',
    asunto: 'Certificado de Hormigonado de Losa 2do Piso y Ensayos de Probetas',
    contenido: 'Estimado Administrador: Se concluyó con éxito el vaciado de hormigón H-30 en la losa sobre el segundo piso. Las probetas de control de resistencia a 7 días han dado valores óptimos. Solicitamos la aprobación de la certificación técnica para liberar el pago de la subcontrata de estructura.',
    leido: true,
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // Hace 24h
  },
  {
    id: 'msg-seed-4',
    fondoId: 'default',
    senderId: 'admin-1',
    senderRole: 'admin',
    senderNombre: 'Administrador Fiduciario',
    receiverRole: 'tecnico',
    categoria: 'avance_obra',
    asunto: 'Re: Certificado de Hormigonado de Losa 2do Piso y Ensayos de Probetas',
    contenido: 'Estimada Dirección de Obra: Recibido el informe con total conformidad. Hemos remitido la orden de pago al fiduciario para liquidar la certificación de hormigón. Por favor avanzar con el replanteo de mampostería de cierre.',
    replyToId: 'msg-seed-3',
    replyToPreview: {
      id: 'msg-seed-3',
      asunto: 'Certificado de Hormigonado de Losa 2do Piso y Ensayos de Probetas',
      contenido: 'Estimado Administrador: Se concluyó con éxito el vaciado de hormigón H-30...',
      senderNombre: 'Equipo Técnico & Gestoría de Obras',
      senderRole: 'tecnico'
    },
    leido: false,
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // Hace 12h
  },
  {
    id: 'msg-seed-5',
    fondoId: 'default',
    senderId: 'socio-2',
    senderRole: 'socio',
    senderNombre: 'Socio Inversor D2',
    senderSocioId: 2,
    receiverRole: 'admin',
    categoria: 'otros',
    motivoPersonalizado: 'Consulta sobre cesión contractual por cambio de radicación',
    asunto: 'Orientación para cesión de posición contractual',
    contenido: 'Buenos días. Por motivos laborales debo radicarme en el exterior a fin de año y desearía evaluar la cesión de mi boleto bajo el Art. 1636 CCCN. ¿Podrían informarme el arancel de cesión y si hay interesados en la lista de espera fiduciaria?',
    leido: false,
    fechaCreacion: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // Hace 5h
  }
];

let memoryStore: Mensaje[] | null = null;

// Recuperar mensajes desde LocalStorage o memoria
export const getStoredMensajes = (): Mensaje[] => {
  if (memoryStore !== null) {
    return memoryStore;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_MENSAJES_KEY);
      if (raw) {
        memoryStore = JSON.parse(raw);
        return memoryStore!;
      }
    } catch (e) {
      console.error('Error al leer mensajes de localStorage:', e);
    }
  }
  memoryStore = [...MENSAJES_INICIALES_DEMO];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_MENSAJES_KEY, JSON.stringify(memoryStore));
    } catch (e) {
      console.error('Error al inicializar mensajes en localStorage:', e);
    }
  }
  return memoryStore;
};

// Guardar mensajes en LocalStorage y memoria
export const saveStoredMensajes = (mensajes: Mensaje[]) => {
  memoryStore = mensajes;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LOCAL_STORAGE_MENSAJES_KEY, JSON.stringify(mensajes));
    } catch (e) {
      console.error('Error al guardar mensajes en localStorage:', e);
    }
  }
};

/**
 * Obtener todos los mensajes visibles para un usuario en un fondo determinado.
 * Aplica aislamiento estricto de roles:
 * - Socio: Únicamente mensajes donde participa (su socioId) con el Admin.
 * - Técnico: Únicamente mensajes entre Técnico y Admin.
 * - Admin: Todos los mensajes del fondo.
 */
export const getMensajesForUser = (fondoId: string, user: UserProfile): Mensaje[] => {
  const todos = getStoredMensajes();
  
  // Normalizar fondoId: comparar fondoId exacto, o equiparar a 'default' si no tiene id
  const targetFondoId = fondoId || 'default';
  const filtroFondo = (m: Mensaje) => m.fondoId === targetFondoId;

  if (user.role === 'admin') {
    return todos.filter(filtroFondo);
  }

  if (user.role === 'tecnico') {
    return todos.filter((m) => {
      if (!filtroFondo(m)) return false;
      // Sólo mensajes donde el emisor o receptor es técnico (y el otro es admin)
      const esParticipante = m.senderRole === 'tecnico' || m.receiverRole === 'tecnico';
      const esConAdmin = m.senderRole === 'admin' || m.receiverRole === 'admin';
      return esParticipante && esConAdmin;
    });
  }

  if (user.role === 'socio') {
    const socioId = user.socioId || 1;
    return todos.filter((m) => {
      if (!filtroFondo(m)) return false;
      const esRemitente = m.senderRole === 'socio' && m.senderSocioId === socioId && m.receiverRole === 'admin';
      const esDestinatario = m.receiverRole === 'socio' && m.receiverSocioId === socioId && m.senderRole === 'admin';
      return esRemitente || esDestinatario;
    });
  }

  return [];
};

/**
 * Cuenta los mensajes no leídos dirigidos al usuario actual.
 */
export const getUnreadCount = (fondoId: string, user: UserProfile): number => {
  const mensajes = getMensajesForUser(fondoId, user);
  return mensajes.filter((m) => {
    if (m.leido) return false;

    if (user.role === 'admin') {
      return m.receiverRole === 'admin';
    }

    if (user.role === 'tecnico') {
      return m.receiverRole === 'tecnico';
    }

    if (user.role === 'socio') {
      return m.receiverRole === 'socio' && m.receiverSocioId === (user.socioId || 1);
    }

    return false;
  }).length;
};

/**
 * Enviar un nuevo mensaje con validación estricta de aislamiento.
 */
export const enviarMensaje = async (
  input: NuevoMensajeInput,
  sender: UserProfile
): Promise<Mensaje> => {
  // 1. REGLA DE AISLAMIENTO ESTRICTA: El Técnico y el Socio NUNCA pueden comunicarse directamente
  if (
    (sender.role === 'tecnico' && input.receiverRole === 'socio') ||
    (sender.role === 'socio' && input.receiverRole === 'tecnico')
  ) {
    throw new Error('Violación de seguridad fiduciaria: No está permitida la comunicación directa entre el Perfil Técnico y los Socios Inversores.');
  }

  // 2. Validación de categoría 'otros': debe tener motivo personalizado sucinto
  if (input.categoria === 'otros' && (!input.motivoPersonalizado || input.motivoPersonalizado.trim() === '')) {
    throw new Error('Por favor especifique sucintamente el motivo para la categoría Otros.');
  }

  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const nuevoMensaje: Mensaje = {
    id,
    fondoId: input.fondoId || 'default',
    senderId: sender.id,
    senderRole: sender.role,
    senderNombre: sender.nombre,
    senderSocioId: sender.role === 'socio' ? (sender.socioId || 1) : undefined,
    receiverRole: input.receiverRole,
    receiverSocioId: input.receiverRole === 'socio' ? input.receiverSocioId : undefined,
    categoria: input.categoria,
    motivoPersonalizado: input.motivoPersonalizado?.trim(),
    asunto: input.asunto.trim(),
    contenido: input.contenido.trim(),
    replyToId: input.replyToId,
    replyToPreview: input.replyToPreview,
    leido: false,
    fechaCreacion: new Date().toISOString()
  };

  // Guardar en almacenamiento local
  const actuales = getStoredMensajes();
  const actualizados = [nuevoMensaje, ...actuales];
  saveStoredMensajes(actualizados);

  // Intentar persistencia en Supabase si está disponible
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseClient();
      if (client) {
        await client.from('mensajes').insert({
          id: nuevoMensaje.id,
          fondo_id: nuevoMensaje.fondoId === 'default' ? null : nuevoMensaje.fondoId,
          sender_id: nuevoMensaje.senderId,
          sender_role: nuevoMensaje.senderRole,
          sender_nombre: nuevoMensaje.senderNombre,
          sender_socio_id: nuevoMensaje.senderSocioId,
          receiver_role: nuevoMensaje.receiverRole,
          receiver_socio_id: nuevoMensaje.receiverSocioId,
          categoria: nuevoMensaje.categoria,
          motivo_personalizado: nuevoMensaje.motivoPersonalizado,
          asunto: nuevoMensaje.asunto,
          contenido: nuevoMensaje.contenido,
          reply_to_id: nuevoMensaje.replyToId,
          leido: false,
          created_at: nuevoMensaje.fechaCreacion
        });
      }
    } catch (e) {
      console.warn('No se pudo sincronizar el mensaje con Supabase (quedó en local):', e);
    }
  }

  return nuevoMensaje;
};

/**
 * Responder a un mensaje existente.
 */
export const responderMensaje = async (
  mensajeOriginal: Mensaje,
  contenidoRespuesta: string,
  sender: UserProfile
): Promise<Mensaje> => {
  // Determinar destinatario de la respuesta
  let receiverRole: 'admin' | 'tecnico' | 'socio';
  let receiverSocioId: number | undefined;

  if (sender.role === 'admin') {
    receiverRole = mensajeOriginal.senderRole;
    receiverSocioId = mensajeOriginal.senderSocioId;
  } else {
    // Tanto socio como técnico le responden al Administrador
    receiverRole = 'admin';
    receiverSocioId = undefined;
  }

  const replyPreview: ReplyPreview = {
    id: mensajeOriginal.id,
    asunto: mensajeOriginal.asunto,
    contenido: mensajeOriginal.contenido.slice(0, 120) + (mensajeOriginal.contenido.length > 120 ? '...' : ''),
    senderNombre: mensajeOriginal.senderNombre,
    senderRole: mensajeOriginal.senderRole
  };

  const asunto = mensajeOriginal.asunto.startsWith('Re: ')
    ? mensajeOriginal.asunto
    : `Re: ${mensajeOriginal.asunto}`;

  return enviarMensaje(
    {
      fondoId: mensajeOriginal.fondoId,
      receiverRole,
      receiverSocioId,
      categoria: mensajeOriginal.categoria,
      motivoPersonalizado: mensajeOriginal.motivoPersonalizado,
      asunto,
      contenido: contenidoRespuesta,
      replyToId: mensajeOriginal.id,
      replyToPreview: replyPreview
    },
    sender
  );
};

/**
 * Marcar mensaje como leído.
 */
export const marcarMensajeComoLeido = async (mensajeId: string): Promise<void> => {
  const actuales = getStoredMensajes();
  let modificado = false;
  const actualizados = actuales.map((m) => {
    if (m.id === mensajeId && !m.leido) {
      modificado = true;
      return { ...m, leido: true };
    }
    return m;
  });

  if (modificado) {
    saveStoredMensajes(actualizados);
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        if (client) {
          await client.from('mensajes').update({ leido: true }).eq('id', mensajeId);
        }
      } catch (e) {
        console.warn('Error al marcar leído en Supabase:', e);
      }
    }
  }
};

/**
 * Marcar todos los mensajes de una conversación como leídos para el usuario.
 */
export const marcarConversacionComoLeida = async (
  fondoId: string,
  user: UserProfile,
  interlocutorRole: 'admin' | 'tecnico' | 'socio',
  interlocutorSocioId?: number
): Promise<void> => {
  const actuales = getStoredMensajes();
  const actualizados = actuales.map((m) => {
    const esDelFondo = m.fondoId === fondoId || m.fondoId === 'default';
    if (!esDelFondo || m.leido) return m;

    let esParaMi = false;
    let esDeInterlocutor = false;

    if (user.role === 'admin') {
      esParaMi = m.receiverRole === 'admin';
      esDeInterlocutor = interlocutorRole === 'socio'
        ? m.senderRole === 'socio' && m.senderSocioId === interlocutorSocioId
        : m.senderRole === 'tecnico';
    } else if (user.role === 'tecnico') {
      esParaMi = m.receiverRole === 'tecnico';
      esDeInterlocutor = m.senderRole === 'admin';
    } else if (user.role === 'socio') {
      esParaMi = m.receiverRole === 'socio' && m.receiverSocioId === (user.socioId || 1);
      esDeInterlocutor = m.senderRole === 'admin';
    }

    if (esParaMi && esDeInterlocutor) {
      return { ...m, leido: true };
    }
    return m;
  });

  saveStoredMensajes(actualizados);
};

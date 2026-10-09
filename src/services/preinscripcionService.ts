import type { DatosPreinscripcion } from '../types/preinscripcion';
import { enviarMensaje } from './mensajeService';
import type { UserProfile } from '../types/auth';

const LOCAL_STORAGE_PREINSCRIPCIONES_KEY = 'fondo_inmobil_preinscripciones_leads';

let memoryPreinscripciones: DatosPreinscripcion[] = [];

export const guardarPreinscripcion = async (
  datos: Omit<DatosPreinscripcion, 'id' | 'created_at'>
): Promise<{ success: boolean; leadId: string }> => {
  const leadId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `lead-${Date.now()}`;
    
  const registroCompleto: DatosPreinscripcion = {
    ...datos,
    id: leadId,
    created_at: new Date().toISOString()
  };

  // 1. Guardar en memoria y localmente si está disponible
  memoryPreinscripciones.unshift(registroCompleto);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_PREINSCRIPCIONES_KEY);
      const lista: DatosPreinscripcion[] = raw ? JSON.parse(raw) : [];
      lista.unshift(registroCompleto);
      window.localStorage.setItem(LOCAL_STORAGE_PREINSCRIPCIONES_KEY, JSON.stringify(lista));
    } catch (err) {
      console.warn('Error al guardar preinscripción en localStorage:', err);
    }
  }

  // 2. Registrar como mensaje formal para la Administración en el Centro de Mensajes
  try {
    const senderLead: UserProfile = {
      id: `lead-${datos.dni}`,
      role: 'socio',
      nombre: datos.nombreApellido,
      email: datos.email
    };

    await enviarMensaje({
      fondoId: datos.proyectoId || 'default',
      receiverRole: 'admin',
      categoria: 'consulta_general',
      asunto: `Preinscripción Fiduciaria: ${datos.nombreApellido} - ${datos.proyectoNombre}`,
      contenido: `Se ha recibido una nueva solicitud de preinscripción fiduciaria:\n\n` +
        `• Interesado: ${datos.nombreApellido}\n` +
        `• DNI: ${datos.dni}\n` +
        `• Teléfono: ${datos.telefono}\n` +
        `• Correo: ${datos.email}\n` +
        `• Proyecto de Interés: ${datos.proyectoNombre}\n` +
        `• Disponibilidad Mensual: ${datos.moneda} $${datos.importeMensualInvertir.toLocaleString('es-AR')}\n` +
        (datos.cuotaSimulada ? `• Cuota Proyectada en Simulador: USD $${Math.round(datos.cuotaSimulada).toLocaleString('es-AR')}\n` : '') +
        (datos.anticipoSimulado ? `• Anticipo Proyectado: USD $${Math.round(datos.anticipoSimulado).toLocaleString('es-AR')}\n` : '') +
        `\nFavor de comunicarse a la brevedad con el suscriptor.`
    }, senderLead);
  } catch (err) {
    console.warn('Error al notificar preinscripción a administración:', err);
  }

  return { success: true, leadId };
};

export const getPreinscripcionesGuardadas = (): DatosPreinscripcion[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_PREINSCRIPCIONES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Fallback a memoria
    }
  }
  return memoryPreinscripciones;
};

export const resetPreinscripcionesParaTesting = (): void => {
  memoryPreinscripciones = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_PREINSCRIPCIONES_KEY);
    } catch {
      // ignore
    }
  }
};

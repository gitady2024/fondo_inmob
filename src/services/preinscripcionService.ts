import type { DatosPreinscripcion } from '../types/preinscripcion';
import {
  ADMIN_EMAIL_DESTINATARIO,
  generarEnlaceWhatsAppFichaPreinscripcion
} from '../types/preinscripcion';
import { enviarMensaje } from './mensajeService';
import type { UserProfile } from '../types/auth';

const LOCAL_STORAGE_PREINSCRIPCIONES_KEY = 'fondo_inmobil_preinscripciones_leads';

let memoryPreinscripciones: DatosPreinscripcion[] = [];

/**
 * Despacho automático de correo electrónico fiduciario hacia el administrador (qdoblea@gmail.com)
 */
export const enviarEmailPreinscripcion = async (
  datos: DatosPreinscripcion
): Promise<{ success: boolean; status?: string }> => {
  try {
    const payload = {
      _subject: `Nueva Preinscripción Fiduciaria: ${datos.nombreApellido} - ${datos.proyectoNombre}`,
      "Interesado": datos.nombreApellido,
      "DNI_CUIT": datos.dni,
      "Telefono": datos.telefono,
      "Email": datos.email,
      "Proyecto": datos.proyectoNombre,
      "Importe_Mensual_Invertir": `${datos.moneda} $${datos.importeMensualInvertir.toLocaleString('es-AR')}`,
      "Cuota_Simulada": datos.cuotaSimulada ? `USD $${Math.round(datos.cuotaSimulada).toLocaleString('es-AR')}` : 'No calculada',
      "Anticipo_Simulado": datos.anticipoSimulado ? `USD $${Math.round(datos.anticipoSimulado).toLocaleString('es-AR')}` : 'No calculado',
      "Codigo_Registro": datos.id,
      "Fecha_Hora": new Date().toLocaleString('es-AR'),
      _template: 'table',
      _captcha: 'false'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL_DESTINATARIO}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (response.ok) {
      return { success: true, status: 'sent' };
    }
    return { success: false, status: `http_${response.status}` };
  } catch (err) {
    console.warn('Advertencia al enviar email fiduciario via endpoint:', err);
    return { success: false, status: 'network_fallback' };
  }
};

export const guardarPreinscripcion = async (
  datos: Omit<DatosPreinscripcion, 'id' | 'created_at'>
): Promise<{ success: boolean; leadId: string; emailEnviado: boolean; whatsappUrl: string }> => {
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

  // 3. Despachar email al correo del administrador (qdoblea@gmail.com)
  const emailRes = await enviarEmailPreinscripcion(registroCompleto);

  // 4. Generar URL con ficha fiduciaria completa para WhatsApp (+54 264 4132644)
  const whatsappUrl = generarEnlaceWhatsAppFichaPreinscripcion(registroCompleto);

  return {
    success: true,
    leadId,
    emailEnviado: emailRes.success,
    whatsappUrl
  };
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

export interface DatosPreinscripcion {
  id: string;
  proyectoNombre: string;
  proyectoId?: string;
  nombreApellido: string;
  dni: string;
  telefono: string;
  email: string;
  importeMensualInvertir: number;
  moneda: 'USD' | 'ARS';
  cuotaSimulada?: number;
  anticipoSimulado?: number;
  created_at: string;
}

export const WHATSAPP_CONTACT_NUMBER = '+54 264 4132644';
export const WHATSAPP_RAW_NUMBER = '5492644132644';
export const GOOGLE_CALENDAR_MEETING_URL = 'https://calendar.app.google/F42KejMd8DqM4E9W9';

export const generarEnlaceWhatsApp = (
  proyectoNombre: string,
  cuotaEstimada?: number,
  montoInvertir?: number
): string => {
  let mensaje = `Hola, estuve en el simulador inmobiliario y me interesa el proyecto *${proyectoNombre}*.`;
  if (cuotaEstimada && cuotaEstimada > 0) {
    mensaje += ` Estuve proyectando una cuota mensual de aprox. USD $${Math.round(cuotaEstimada)}.`;
  }
  if (montoInvertir && montoInvertir > 0) {
    mensaje += ` Cuento con una disponibilidad mensual de inversión de USD $${Math.round(montoInvertir)}.`;
  }
  mensaje += ` Quisiera recibir información y asesoramiento para suscribirme. Muchas gracias.`;
  return `https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(mensaje)}`;
};

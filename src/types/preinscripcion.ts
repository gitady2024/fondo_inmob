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
export const ADMIN_EMAIL_DESTINATARIO = 'qdoblea@gmail.com';

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

export const generarEnlaceWhatsAppFichaPreinscripcion = (
  datos: Omit<DatosPreinscripcion, 'id' | 'created_at'> & { id?: string }
): string => {
  const lineas = [
    `🚨 *NUEVA SOLICITUD DE PREINSCRIPCIÓN FIDUCIARIA* 🚨`,
    `----------------------------------------`,
    `👤 *Interesado:* ${datos.nombreApellido}`,
    `🆔 *DNI / CUIT:* ${datos.dni}`,
    `📱 *Teléfono:* ${datos.telefono}`,
    `✉️ *Email:* ${datos.email}`,
    `🏢 *Proyecto de Interés:* ${datos.proyectoNombre}`,
    `💰 *Disponibilidad Mensual:* ${datos.moneda} $${datos.importeMensualInvertir.toLocaleString('es-AR')}`,
    datos.cuotaSimulada && datos.cuotaSimulada > 0
      ? `📊 *Cuota Simulada:* USD $${Math.round(datos.cuotaSimulada).toLocaleString('es-AR')}/mes`
      : null,
    datos.anticipoSimulado && datos.anticipoSimulado > 0
      ? `💵 *Anticipo Estimado:* USD $${Math.round(datos.anticipoSimulado).toLocaleString('es-AR')}`
      : null,
    datos.id ? `🔖 *Código de Registro:* ${datos.id.slice(0, 16)}` : null,
    `----------------------------------------`,
    `Hola! Acabo de completar el formulario oficial de preinscripción fiduciaria en la web para el proyecto *${datos.proyectoNombre}*. Adjunto mi ficha para coordinar la entrevista y reserva de cupo. Muchas gracias!`
  ].filter(Boolean).join('\n');

  return `https://wa.me/${WHATSAPP_RAW_NUMBER}?text=${encodeURIComponent(lineas)}`;
};

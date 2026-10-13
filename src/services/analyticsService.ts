/**
 * analyticsService.ts
 * ─────────────────────────────────────────────────────────────────
 * Servicio centralizado de tracking de eventos para FONDO INMOBIL.
 *
 * Compatible con:
 *   · GA4  → via gtag() si está cargado en window
 *   · GTM  → via dataLayer.push() (recomendado en producción)
 *   · Dev  → console.debug en modo desarrollo (fallback seguro)
 *
 * Para activar GA4, agregá en index.html:
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
 *   <script>
 *     window.dataLayer = window.dataLayer || [];
 *     function gtag(){dataLayer.push(arguments);}
 *     gtag('js', new Date());
 *     gtag('config', 'G-XXXXXXXXXX');
 *   </script>
 * ─────────────────────────────────────────────────────────────────
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export interface EventParams {
  valor_unidad?: number;
  cuota_mensual?: number;
  proyecto?: string;
  anticipo?: number;
  paso?: number;
  plazo_cuotas?: number;
  label?: string;
  [key: string]: unknown;
}

const isDev = (): boolean => {
  try {
    return (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
  } catch {
    return false;
  }
};

const fireEvent = (eventName: string, params: EventParams = {}): void => {
  const payload: Record<string, unknown> = { event: eventName, ...params };

  // 1. GA4 via gtag()
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }

  // 2. GTM via dataLayer
  if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }

  // 3. Dev console fallback
  if (isDev()) {
    console.debug(
      '%c[Analytics] %c' + eventName,
      'color:#6366f1;font-weight:bold',
      'color:#34d399;font-weight:bold',
      params
    );
  }
};

// ── EMBUDO DEL SIMULADOR ──────────────────────────────────────────

/** Clic en el botón principal para empezar a simular */
export const trackSimuladorInicio = (
  params?: Pick<EventParams, 'proyecto' | 'label'>
): void => {
  fireEvent('simulador_inicio', params);
};

/** Completa Paso 1 "Mi Unidad" y avanza al Paso 2 */
export const trackSimuladorPaso1 = (
  valorUnidad: number,
  anticipo: number,
  proyecto?: string
): void => {
  fireEvent('simulador_paso_1', { valor_unidad: valorUnidad, anticipo, proyecto, paso: 1 });
};

/** Completa Paso 2 "Mi Plan" y avanza al Paso 3 */
export const trackSimuladorPaso2 = (
  valorUnidad: number,
  cuotaMensual: number,
  plazoCuotas: number,
  proyecto?: string
): void => {
  fireEvent('simulador_paso_2', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    plazo_cuotas: plazoCuotas,
    proyecto,
    paso: 2
  });
};

/** Llega a la pantalla final de Resultados (Paso 3) */
export const trackSimuladorCompletado = (
  valorUnidad: number,
  cuotaMensual: number,
  anticipo: number,
  proyecto?: string
): void => {
  fireEvent('simulador_completado', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    anticipo,
    proyecto,
    paso: 3
  });
};

// ── INTERACCIÓN Y TRACCIÓN ────────────────────────────────────────

/** Abre el panel de Opciones Avanzadas */
export const trackClicOpcionesAvanzadas = (
  valorUnidad?: number,
  proyecto?: string
): void => {
  fireEvent('clic_opciones_avanzadas', { valor_unidad: valorUnidad, proyecto });
};

/** Genera y copia el link para compartir la simulación */
export const trackSimulacionCompartida = (
  valorUnidad: number,
  cuotaMensual: number,
  proyecto?: string
): void => {
  fireEvent('simulacion_compartida', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    proyecto
  });
};

// ── CONVERSIÓN FINAL ──────────────────────────────────────────────

/** Clic en "¡Quiero este plan!" que abre el modal de preinscripción */
export const trackClicQuiereEstePlan = (
  valorUnidad: number,
  cuotaMensual: number,
  proyecto?: string
): void => {
  fireEvent('clic_quiero_este_plan', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    proyecto,
    currency: 'USD',
    value: cuotaMensual
  });
};

/** Formulario de preinscripción completado con éxito */
export const trackLeadGenerado = (
  valorUnidad: number,
  cuotaMensual: number,
  proyecto?: string,
  ticketId?: string
): void => {
  fireEvent('lead_generado', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    proyecto,
    label: ticketId,
    currency: 'USD',
    value: valorUnidad
  });
  // También disparar generate_lead nativo de GA4 para optimización de campañas
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'generate_lead', { currency: 'USD', value: valorUnidad });
  }
};

/** Clic en botón de agendar entrevista (WhatsApp o Calendar) */
export const trackClicAgendarEntrevista = (
  canal: 'whatsapp' | 'calendar' | 'fab',
  valorUnidad?: number,
  cuotaMensual?: number,
  proyecto?: string
): void => {
  fireEvent('clic_agendar_entrevista', {
    valor_unidad: valorUnidad,
    cuota_mensual: cuotaMensual,
    proyecto,
    label: canal
  });
};

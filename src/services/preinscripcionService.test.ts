import { describe, it, expect, beforeEach } from 'vitest';
import { guardarPreinscripcion, getPreinscripcionesGuardadas, resetPreinscripcionesParaTesting } from './preinscripcionService';
import { generarEnlaceWhatsApp, WHATSAPP_RAW_NUMBER, GOOGLE_CALENDAR_MEETING_URL } from '../types/preinscripcion';

describe('preinscripcionService & conversion logic', () => {
  beforeEach(() => {
    resetPreinscripcionesParaTesting();
  });

  it('guarda una preinscripción correctamente en almacenamiento local y genera ID', async () => {
    const resultado = await guardarPreinscripcion({
      proyectoNombre: 'Torre Alvear Suite',
      proyectoId: 'fondo-1',
      nombreApellido: 'Carlos Mendoza',
      dni: '28456123',
      telefono: '+5492644123456',
      email: 'carlos@ejemplo.com',
      importeMensualInvertir: 1500,
      moneda: 'USD',
      cuotaSimulada: 1354,
      anticipoSimulado: 6500
    });

    expect(resultado.success).toBe(true);
    expect(resultado.leadId).toBeDefined();

    const guardadas = getPreinscripcionesGuardadas();
    expect(guardadas.length).toBe(1);
    expect(guardadas[0].nombreApellido).toBe('Carlos Mendoza');
    expect(guardadas[0].dni).toBe('28456123');
    expect(guardadas[0].importeMensualInvertir).toBe(1500);
    expect(guardadas[0].proyectoNombre).toBe('Torre Alvear Suite');
  });

  it('genera correctamente el enlace dinámico de WhatsApp con los parámetros', () => {
    const link = generarEnlaceWhatsApp('Complejo Los Olivos', 1200, 1500);
    expect(link).toContain(`https://wa.me/${WHATSAPP_RAW_NUMBER}`);
    expect(link).toContain(encodeURIComponent('Complejo Los Olivos'));
    expect(link).toContain(encodeURIComponent('1200'));
    expect(link).toContain(encodeURIComponent('1500'));
  });

  it('valida que la URL de Google Calendar esté correctamente configurada', () => {
    expect(GOOGLE_CALENDAR_MEETING_URL).toBe('https://calendar.app.google/F42KejMd8DqM4E9W9');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { guardarPreinscripcion, getPreinscripcionesGuardadas, resetPreinscripcionesParaTesting } from './preinscripcionService';
import {
  generarEnlaceWhatsApp,
  generarEnlaceWhatsAppFichaPreinscripcion,
  WHATSAPP_RAW_NUMBER,
  GOOGLE_CALENDAR_MEETING_URL,
  ADMIN_EMAIL_DESTINATARIO
} from '../types/preinscripcion';

describe('preinscripcionService & conversion logic', () => {
  beforeEach(() => {
    resetPreinscripcionesParaTesting();
  });

  it('guarda una preinscripción correctamente en almacenamiento local, genera ID y URL de WhatsApp con la ficha completa', async () => {
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
    expect(resultado.whatsappUrl).toContain(`https://wa.me/${WHATSAPP_RAW_NUMBER}`);
    expect(resultado.whatsappUrl).toContain(encodeURIComponent('Carlos Mendoza'));
    expect(resultado.whatsappUrl).toContain(encodeURIComponent('28456123'));
    expect(resultado.whatsappUrl).toContain(encodeURIComponent('Torre Alvear Suite'));

    const guardadas = getPreinscripcionesGuardadas();
    expect(guardadas.length).toBe(1);
    expect(guardadas[0].nombreApellido).toBe('Carlos Mendoza');
    expect(guardadas[0].dni).toBe('28456123');
    expect(guardadas[0].importeMensualInvertir).toBe(1500);
    expect(guardadas[0].proyectoNombre).toBe('Torre Alvear Suite');
  }, 15000);

  it('genera correctamente el enlace dinámico de WhatsApp con los parámetros', () => {
    const link = generarEnlaceWhatsApp('Complejo Los Olivos', 1200, 1500);
    expect(link).toContain(`https://wa.me/${WHATSAPP_RAW_NUMBER}`);
    expect(link).toContain(encodeURIComponent('Complejo Los Olivos'));
    expect(link).toContain(encodeURIComponent('1200'));
    expect(link).toContain(encodeURIComponent('1500'));
  });

  it('genera la ficha fiduciaria completa con todos los datos obligatorios para WhatsApp', () => {
    const link = generarEnlaceWhatsAppFichaPreinscripcion({
      nombreApellido: 'Mariana Gomez',
      dni: '33987654',
      telefono: '+5492644998877',
      email: 'mariana@ejemplo.com',
      proyectoNombre: 'Paseo del Parque',
      importeMensualInvertir: 850,
      moneda: 'USD',
      cuotaSimulada: 800,
      anticipoSimulado: 5000,
      id: 'lead-test-123'
    });
    expect(link).toContain(`https://wa.me/${WHATSAPP_RAW_NUMBER}`);
    expect(link).toContain(encodeURIComponent('Mariana Gomez'));
    expect(link).toContain(encodeURIComponent('33987654'));
    expect(link).toContain(encodeURIComponent('mariana@ejemplo.com'));
    expect(link).toContain(encodeURIComponent('USD $850'));
  });

  it('valida que la URL de Google Calendar y el correo del Administrador estén correctamente configurados', () => {
    expect(GOOGLE_CALENDAR_MEETING_URL).toBe('https://calendar.app.google/F42KejMd8DqM4E9W9');
    expect(ADMIN_EMAIL_DESTINATARIO).toBe('qdoblea@gmail.com');
  });
});


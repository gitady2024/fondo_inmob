import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMensajesForUser,
  enviarMensaje,
  responderMensaje,
  getUnreadCount,
  saveStoredMensajes
} from './mensajeService';
import type { UserProfile } from '../types/auth';

const ADMIN: UserProfile = {
  id: 'admin-1',
  role: 'admin',
  nombre: 'Administrador Fiduciario'
};

const SOCIO_1: UserProfile = {
  id: 'socio-1',
  role: 'socio',
  nombre: 'Inversor D1',
  socioId: 1
};

const SOCIO_2: UserProfile = {
  id: 'socio-2',
  role: 'socio',
  nombre: 'Inversor D2',
  socioId: 2
};

const TECNICO: UserProfile = {
  id: 'tecnico-1',
  role: 'tecnico',
  nombre: 'Director de Obra'
};

describe('mensajeService - Aislamiento Estricto y Gestión de Mensajes', () => {
  beforeEach(() => {
    // Limpiar almacenamiento antes de cada prueba
    saveStoredMensajes([]);
  });

  it('permite comunicación bidireccional entre Administrador y Socio Inversor', async () => {
    // 1. Socio 1 envía consulta al Admin
    const msg1 = await enviarMensaje(
      {
        fondoId: 'fondo-test',
        receiverRole: 'admin',
        categoria: 'pago_cuota',
        asunto: 'Consulta cuota 1',
        contenido: '¿Cuándo vence la cuota?'
      },
      SOCIO_1
    );

    expect(msg1.id).toBeDefined();
    expect(msg1.senderRole).toBe('socio');
    expect(msg1.receiverRole).toBe('admin');

    // 2. Admin responde al Socio 1
    const rtaAdmin = await responderMensaje(msg1, 'Vence el día 10 del mes corriente.', ADMIN);
    expect(rtaAdmin.receiverRole).toBe('socio');
    expect(rtaAdmin.receiverSocioId).toBe(1);
    expect(rtaAdmin.replyToId).toBe(msg1.id);

    // 3. Socio 1 ve ambos mensajes
    const msgsSocio1 = getMensajesForUser('fondo-test', SOCIO_1);
    expect(msgsSocio1.length).toBe(2);

    // 4. Socio 2 NO ve los mensajes del Socio 1
    const msgsSocio2 = getMensajesForUser('fondo-test', SOCIO_2);
    expect(msgsSocio2.length).toBe(0);
  });

  it('permite comunicación bidireccional entre Administrador y Equipo Técnico', async () => {
    // 1. Técnico envía informe al Admin
    const msgTec = await enviarMensaje(
      {
        fondoId: 'fondo-test',
        receiverRole: 'admin',
        categoria: 'avance_obra',
        asunto: 'Hormigón losa nivel 1',
        contenido: 'Completado hormigonado hoy.'
      },
      TECNICO
    );

    expect(msgTec.senderRole).toBe('tecnico');
    expect(msgTec.receiverRole).toBe('admin');

    // 2. Admin responde al Técnico
    const rtaAdmin = await responderMensaje(msgTec, 'Aprobado certificado.', ADMIN);
    expect(rtaAdmin.receiverRole).toBe('tecnico');
    expect(rtaAdmin.replyToId).toBe(msgTec.id);

    // 3. Técnico ve la conversación
    const msgsTec = getMensajesForUser('fondo-test', TECNICO);
    expect(msgsTec.length).toBe(2);

    // 4. Ningún Socio Inversor ve los mensajes técnicos
    const msgsSocio1 = getMensajesForUser('fondo-test', SOCIO_1);
    expect(msgsSocio1.length).toBe(0);
  });

  it('REGLA CRÍTICA: Bloquea e impide comunicación directa entre Técnico y Socio Inversor', async () => {
    // Técnico intentando enviar mensaje a un Socio
    await expect(
      enviarMensaje(
        {
          fondoId: 'fondo-test',
          receiverRole: 'socio',
          receiverSocioId: 1,
          categoria: 'avance_obra',
          asunto: 'Intento no permitido',
          contenido: 'Hola socio'
        },
        TECNICO
      )
    ).rejects.toThrow(/Violación de seguridad fiduciaria/);

    // Socio intentando enviar mensaje a Técnico
    await expect(
      enviarMensaje(
        {
          fondoId: 'fondo-test',
          receiverRole: 'tecnico',
          categoria: 'avance_obra',
          asunto: 'Intento no permitido',
          contenido: 'Hola técnico'
        },
        SOCIO_1
      )
    ).rejects.toThrow(/Violación de seguridad fiduciaria/);
  });

  it('exige motivo personalizado sucinto cuando la categoría es "otros"', async () => {
    // Sin motivo debe fallar
    await expect(
      enviarMensaje(
        {
          fondoId: 'fondo-test',
          receiverRole: 'admin',
          categoria: 'otros',
          asunto: 'Tema particular',
          contenido: 'Detalle...'
        },
        SOCIO_1
      )
    ).rejects.toThrow(/Por favor especifique sucintamente el motivo para la categoría Otros/);

    // Con motivo debe crearse correctamente
    const msg = await enviarMensaje(
      {
        fondoId: 'fondo-test',
        receiverRole: 'admin',
        categoria: 'otros',
        motivoPersonalizado: 'Reunión de coordinación presencial',
        asunto: 'Tema particular',
        contenido: 'Detalle de la propuesta...'
      },
      SOCIO_1
    );

    expect(msg.categoria).toBe('otros');
    expect(msg.motivoPersonalizado).toBe('Reunión de coordinación presencial');
  });

  it('calcula correctamente el contador de mensajes no leídos por rol', async () => {
    // Socio envía mensaje no leído al Admin
    await enviarMensaje(
      {
        fondoId: 'fondo-test',
        receiverRole: 'admin',
        categoria: 'pago_cuota',
        asunto: 'Consulta saldo',
        contenido: '¿Tengo saldo a favor?'
      },
      SOCIO_1
    );

    // Admin tiene 1 no leído
    expect(getUnreadCount('fondo-test', ADMIN)).toBe(1);
    // Socio 1 tiene 0 no leídos (él es el remitente)
    expect(getUnreadCount('fondo-test', SOCIO_1)).toBe(0);

    // Admin le responde
    const msgsAdmin = getMensajesForUser('fondo-test', ADMIN);
    await responderMensaje(msgsAdmin[0], 'No hay saldo a favor.', ADMIN);

    // Ahora Socio 1 tiene 1 no leído
    expect(getUnreadCount('fondo-test', SOCIO_1)).toBe(1);
  });
});

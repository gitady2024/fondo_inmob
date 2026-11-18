import { describe, it, expect, vi } from 'vitest';
import {
  construirSystemPrompt,
  responderConMotorLocal,
  consultarAsesorGemini,
  consultarAsesorGeminiStream,
  type ChatMessage
} from './geminiService';
import type { FondoGuardado } from './fondoService';

describe('geminiService - Asesor Virtual de Inverfondo', () => {
  const dummyObras: FondoGuardado[] = [
    {
      id: 'obra-test-1',
      nombre: 'Family Homes La Lucia (36 meses)',
      updated_at: new Date().toISOString(),
      params: {
        costoDepto: 75000,
        cantidadCuotas: 36,
        cantidadDeptos: 10,
        tasaAjusteMensual: 0,
        mesInicio: '2026-01',
        modalidadAnticipo: 'tradicional',
        porcentajeAdelantoFijo: 0
      } as any,
      gastos: {} as any,
      anticipos: [] as any,
      adjudicacionFijada: {} as any,
      cesion: {} as any,
      adelanto: {} as any,
      datosTecnicos: {
        direccionObra: 'Av. Roque Saenz Peña esquina 12 de Octubre, Santa Lucía',
        etapas: [{ pesoPonderado: 100, porcentajeReal: 30 }]
      } as any
    }
  ];

  it('construye el System Prompt inyectando las obras activas en tiempo real', () => {
    const prompt = construirSystemPrompt(dummyObras);
    expect(prompt).toContain('Inverfondo');
    expect(prompt).toContain('Family Homes La Lucia (36 meses)');
    expect(prompt).toContain('Santa Lucía');
    expect(prompt).toContain('Art. 1666');
    expect(prompt).toContain('UVA');
  });

  it('el motor local responde preguntas sobre créditos UVA sin API key', () => {
    const res = responderConMotorLocal('¿Qué diferencia tiene con el crédito UVA?', dummyObras);
    expect(res.text.toLowerCase()).toContain('uva');
    expect(res.text.toLowerCase()).toContain('cac');
    expect(res.actions).toBeDefined();
    expect(res.actions?.length).toBeGreaterThan(0);
  });

  it('el motor local responde preguntas sobre obras activas listando los proyectos en vivo', () => {
    const res = responderConMotorLocal('¿Qué departamentos u obras tienen disponibles?', dummyObras);
    expect(res.text).toContain('Family Homes La Lucia');
    expect(res.actions?.some((a) => a.action === 'obras')).toBe(true);
  });

  it('el motor local responde preguntas sobre anticipos y cuotas', () => {
    const res = responderConMotorLocal('¿Cuánto tengo que pagar de anticipo?', dummyObras);
    expect(res.text).toContain('10.000');
    expect(res.actions?.some((a) => a.action === 'simular')).toBe(true);
  });

  it('el motor local realiza cálculos financieros dinámicos en diálogo', () => {
    const res = responderConMotorLocal('Tengo USD 20.000 de anticipo, ¿cuánto pago por mes?', dummyObras);
    expect(res.text).toContain('20.000');
    expect(res.text).toContain('55.000'); // 75.000 - 20.000
    expect(res.text).toContain('1.528');  // 55.000 / 36
    expect(res.actions?.some((a) => a.action === 'whatsapp')).toBe(true);
  });

  it('el motor local detecta intención de preinscripción o reserva', () => {
    const res = responderConMotorLocal('Quiero anotarme para reservar un depto', dummyObras);
    expect(res.text.toLowerCase()).toContain('reserva');
    expect(res.actions?.some((a) => a.action === 'whatsapp')).toBe(true);
  });

  it('el motor local responde sobre la garantía de finalización en tiempo estipulado y el equipo desarrollador', () => {
    const res = responderConMotorLocal('que garantia tengo que el plan va a finalizar en el tiempo estipulado?', dummyObras);
    expect(res.text).toContain('Los desarrolladores reúnen las siguientes características:');
    expect(res.text).toContain('Equipo de Gestión');
    expect(res.text).toContain('30 años');
    expect(res.text).toContain('Equipo legal');
    expect(res.text).toContain('San Juan');
    expect(res.text).toContain('Equipo Construcción');

    const res2 = responderConMotorLocal('¿Quiénes son los desarrolladores?', dummyObras);
    expect(res2.text).toContain('Equipo de Gestión');
    expect(res2.text).toContain('Equipo legal');
    expect(res2.text).toContain('Equipo Construcción');
  });

  it('el motor local responde sobre la documentación requerida para inscribirse', () => {
    const res = responderConMotorLocal('¿Qué documentación necesito para inscribirme?', dummyObras);
    expect(res.text).toContain('DNI');
    expect(res.text).toContain('domicilio');
    expect(res.text).toContain('Garantía');
  });

  it('el motor local responde sobre la moneda de pago en dólares', () => {
    const res = responderConMotorLocal('¿En qué moneda se pagan las cuotas?', dummyObras);
    expect(res.text).toContain('DÓLARES ESTADOUNIDENSES');

    const resTypo = responderConMotorLocal('en que monda puedo pagar', dummyObras);
    expect(resTypo.text).toContain('DÓLARES ESTADOUNIDENSES');
  });

  it('el motor local aclara que no se aceptan permutas de vehículos', () => {
    const res = responderConMotorLocal('¿Aceptan un auto o vehículo en parte de pago?', dummyObras);
    expect(res.text.toLowerCase()).toContain('no se aceptan permutas');
  });

  it('el motor local explica el tratamiento de la mora o retraso', () => {
    const res = responderConMotorLocal('¿Qué pasa si tengo un retraso o mora en una cuota?', dummyObras);
    expect(res.text).toContain('prima de retraso');
  });

  it('el motor local explica las terminaciones de obra y entrega', () => {
    const res = responderConMotorLocal('¿Cómo son las terminaciones y la entrega?', dummyObras);
    expect(res.text).toContain('memoria técnica');
  });

  it('el motor local responde sobre los gastos de posesión y escrituración', () => {
    const res = responderConMotorLocal('¿Cómo se pagan los gastos de posesión y escrituración?', dummyObras);
    expect(res.text).toContain('elección del fondo');
    expect(res.text.toLowerCase()).toContain('prorratearse');
  });

  it('consultarAsesorGemini responde en modo fallback si no hay API key', async () => {
    const historial: ChatMessage[] = [];
    const res = await consultarAsesorGemini({
      historial,
      nuevoMensaje: 'Hola, ¿cómo funciona el fideicomiso?',
      proyectosActivos: dummyObras
    });

    expect(res.sender).toBe('assistant');
    expect(res.text.length).toBeGreaterThan(20);
    expect(res.timestamp).toBeDefined();
  });

  it('consultarAsesorGeminiStream emite fragmentos vía onChunk', async () => {
    const historial: ChatMessage[] = [];
    const chunks: string[] = [];
    const res = await consultarAsesorGeminiStream({
      historial,
      nuevoMensaje: 'Tengo USD 15.000 para invertir',
      proyectosActivos: dummyObras,
      onChunk: (chunk) => {
        chunks.push(chunk);
      }
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(res.sender).toBe('assistant');
    expect(res.text).toContain('15.000');
  });
});

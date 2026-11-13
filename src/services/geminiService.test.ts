import { describe, it, expect } from 'vitest';
import {
  construirSystemPrompt,
  responderConMotorLocal,
  consultarAsesorGemini,
  type ChatMessage
} from './geminiService';
import type { FondoGuardado } from './fondoService';

describe('geminiService - Asesor Virtual de Inverfondo', () => {
  const dummyObras: FondoGuardado[] = [
    {
      id: 'obra-test-1',
      nombre: 'Edificio Las Heras 48 Meses',
      updated_at: new Date().toISOString(),
      params: {
        costoDepto: 48000000,
        cantidadCuotas: 48,
        cantidadDeptos: 24,
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
        direccionObra: 'Av. Las Heras 2340',
        etapas: [{ pesoPonderado: 100, porcentajeReal: 35 }]
      } as any
    }
  ];

  it('construye el System Prompt inyectando las obras activas en tiempo real', () => {
    const prompt = construirSystemPrompt(dummyObras);
    expect(prompt).toContain('Inverfondo');
    expect(prompt).toContain('Edificio Las Heras 48 Meses');
    expect(prompt).toContain('Av. Las Heras 2340');
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
    expect(res.text).toContain('Edificio Las Heras 48 Meses');
    expect(res.actions?.some(a => a.action === 'obras')).toBe(true);
  });

  it('el motor local responde preguntas sobre anticipos y cuotas', () => {
    const res = responderConMotorLocal('¿Cuánto tengo que pagar de anticipo?', dummyObras);
    expect(res.text).toContain('10.000');
    expect(res.actions?.some(a => a.action === 'simular')).toBe(true);
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
});

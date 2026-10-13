import { describe, it, expect } from 'vitest';
import { parseUrlParams } from './useUrlState';

describe('useUrlState: Parseo y Validación de Parámetros de URL', () => {
  it('Parsea parámetros numéricos y strings válidos en la URL', () => {
    const params = parseUrlParams('?monto=100000&plazo=48&socios=10&inicio=2027-05&modalidad=reducir_plazo&socio=3');

    expect(params.costoDepto).toBe(100000);
    expect(params.cantidadCuotas).toBe(48);
    expect(params.cantidadDeptos).toBe(10);
    expect(params.fechaInicio).toBe('2027-05');
    expect(params.modalidadAnticipo).toBe('reducir_plazo');
    expect(params.socioId).toBe(3);
  });

  it('Aplica fallback y descarta valores no numéricos o corrompidos', () => {
    const params = parseUrlParams('?monto=invalido&plazo=-5&socios=abc&inicio=fecha_falsa&modalidad=otra');

    expect(params.costoDepto).toBeUndefined();
    expect(params.cantidadCuotas).toBeUndefined();
    expect(params.cantidadDeptos).toBeUndefined();
    expect(params.fechaInicio).toBeUndefined();
    expect(params.modalidadAnticipo).toBeUndefined();
  });

  it('Soporta alias alternativos como costo, cuotas, deptos', () => {
    const params = parseUrlParams('?costo=75000&cuotas=36&deptos=6');

    expect(params.costoDepto).toBe(75000);
    expect(params.cantidadCuotas).toBe(36);
    expect(params.cantidadDeptos).toBe(6);
  });

  it('Retorna objeto vacío cuando la query está vacía', () => {
    expect(parseUrlParams('')).toEqual({});
    expect(parseUrlParams('?')).toEqual({});
  });

  it('Parsea hash corto ?sim=a8f93 correctamente para evitar parámetros crudos', () => {
    const params = parseUrlParams('?sim=a8f93');
    expect(params.simHash).toBe('a8f93');
  });

  it('Limpieza de URL: no expone UUID de fondo como parámetro crudo (solo via ?sim=hash)', () => {
    // Cuando llega un fondo UUID crudo, se parsea pero no se re-expone en la URL
    // El hook lo limpia con history.replaceState; aquí validamos que el parser lo recibe
    const params = parseUrlParams('?fondo=43f8b1a2-9c3d-4e5f-b6a7-c8d9e0f1a2b3&modalidad=reducir_cuota&socio=2');
    // Los datos se leen correctamente para aplicar el estado
    expect(params.fondoId).toBe('43f8b1a2-9c3d-4e5f-b6a7-c8d9e0f1a2b3');
    expect(params.modalidadAnticipo).toBe('reducir_cuota');
    expect(params.socioId).toBe(2);
    // La clave: simHash está undefined (no es un link compartido limpio)
    expect(params.simHash).toBeUndefined();
  });

  it('Detecta correctamente un ?sim= puro (único parámetro) para preservar la URL limpia', () => {
    const params = parseUrlParams('?sim=k9x2p');
    expect(params.simHash).toBe('k9x2p');
    // No hay parámetros crudos adicionales
    expect(params.fondoId).toBeUndefined();
    expect(params.costoDepto).toBeUndefined();
    expect(params.modalidadAnticipo).toBeUndefined();
  });
});


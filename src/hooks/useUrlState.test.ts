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
});

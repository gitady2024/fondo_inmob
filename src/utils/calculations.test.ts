import { describe, it, expect } from 'vitest';
import {
  calcularFlujoIndividual,
  calcularGastos,
  calcularLiquidacionCesion
} from './calculations';
import type { AjusteCuota } from '../types/fondo';

describe('Motor Financiero: Pruebas de Fiabilidad y Ajustes de Cuota', () => {
  const adelantoInactivo = {
    activo: false,
    mes: 10,
    monto: 0,
    estrategia: 'reducir_cuota' as const
  };

  it('Test 1 (Regresión Base): Plan sin ajustes mantiene amortización exacta y finaliza en saldo cero', () => {
    const res = calcularFlujoIndividual(
      1,
      65000,
      0, // sin anticipo
      48,
      'reducir_cuota',
      0, // sin gastos
      adelantoInactivo,
      15, // cuota posesion
      0,
      []
    );

    expect(res.mesesTotales).toBe(48);
    expect(res.flujo.length).toBe(48);
    // Cada cuota debe ser 65000 / 48 = 1354.1666...
    expect(res.cuotaInmInicial).toBeCloseTo(65000 / 48, 2);
    // Saldo remanente final debe ser exactamente 0
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
    // Total abonado debe ser 65000
    expect(res.totalAbonado).toBeCloseTo(65000, 2);
    expect(res.totalAjustesPorcentaje).toBe(0);
  });

  it('Test 2 (Ajuste Simple): Incremento del 10% en el Mes 6 repercute en cuotas posteriores y amortiza el 100%', () => {
    const ajustes: AjusteCuota[] = [
      {
        id: 'aj-1',
        mes: 6,
        porcentaje: 10,
        motivo: 'Aumento índice CAC materiales'
      }
    ];

    const res = calcularFlujoIndividual(
      1,
      65000,
      0,
      48,
      'reducir_cuota',
      0,
      adelantoInactivo,
      15,
      0,
      ajustes
    );

    expect(res.mesesTotales).toBe(48);
    // Cuotas 1 a 5 deben tener el valor base original
    const cuotaBase = 65000 / 48;
    for (let i = 0; i < 5; i++) {
      expect(res.flujo[i].capital).toBeCloseTo(cuotaBase, 2);
      expect(res.flujo[i].porcentajeAjuste).toBeUndefined();
    }

    // Cuota Mes 6 debe reflejar el aumento del 10%
    const cuotaAjustada = cuotaBase * 1.10;
    expect(res.flujo[5].mes).toBe(6);
    expect(res.flujo[5].porcentajeAjuste).toBe(10);
    expect(res.flujo[5].motivoAjuste).toBe('Aumento índice CAC materiales');
    expect(res.flujo[5].capital).toBeCloseTo(cuotaAjustada, 2);

    // Cuotas 6 a 48 deben mantener la cuota ajustada
    for (let i = 5; i < 48; i++) {
      expect(res.flujo[i].capital).toBeCloseTo(cuotaAjustada, 2);
    }

    // Total abonado teórico = (5 * cuotaBase) + (43 * cuotaAjustada)
    const totalEsperado = 5 * cuotaBase + 43 * cuotaAjustada;
    expect(res.totalAbonado).toBeCloseTo(totalEsperado, 2);
    // Saldo final cancelado
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
    expect(res.totalAjustesPorcentaje).toBe(10);
    expect(res.cuotaInmActual).toBeCloseTo(cuotaAjustada, 2);
  });

  it('Test 3 (Ajustes Compuestos Sucesivos): Mes 6 (+10%) y Mes 12 (+5%)', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 10, motivo: 'Materiales' },
      { id: 'aj-2', mes: 12, porcentaje: 5, motivo: 'Gestión Técnica' }
    ];

    const res = calcularFlujoIndividual(
      1,
      65000,
      0,
      48,
      'reducir_cuota',
      0,
      adelantoInactivo,
      15,
      0,
      ajustes
    );

    const cuotaBase = 65000 / 48;
    const cuotaTramo2 = cuotaBase * 1.10;
    const cuotaTramo3 = cuotaTramo2 * 1.05;

    // Mes 1 a 5
    expect(res.flujo[0].capital).toBeCloseTo(cuotaBase, 2);
    // Mes 6 a 11
    expect(res.flujo[5].capital).toBeCloseTo(cuotaTramo2, 2);
    expect(res.flujo[10].capital).toBeCloseTo(cuotaTramo2, 2);
    // Mes 12 en adelante
    expect(res.flujo[11].capital).toBeCloseTo(cuotaTramo3, 2);
    expect(res.flujo[47].capital).toBeCloseTo(cuotaTramo3, 2);

    // Amortización final perfecta
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
    expect(res.mesesTotales).toBe(48);
  });

  it('Test 4 (Interacción con Anticipo Mes 0): El aumento se aplica sobre el saldo financiado de la unidad', () => {
    const ant = 6500; // 10% de anticipo
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 10, motivo: 'Revalúo' }
    ];

    const res = calcularFlujoIndividual(
      1,
      65000,
      ant,
      48,
      'reducir_cuota',
      0,
      adelantoInactivo,
      15,
      0,
      ajustes
    );

    const saldoInicial = 65000 - ant; // 58500
    const cuotaBaseConAnticipo = saldoInicial / 48; // 1218.75

    expect(res.flujo[0].capital).toBeCloseTo(cuotaBaseConAnticipo, 2);
    expect(res.flujo[5].capital).toBeCloseTo(cuotaBaseConAnticipo * 1.10, 2);
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);

    const totalEsperado = ant + 5 * cuotaBaseConAnticipo + 43 * (cuotaBaseConAnticipo * 1.10);
    expect(res.totalAbonado).toBeCloseTo(totalEsperado, 2);
  });

  it('Test 5 (Interacción con Adelanto / Licitación en Mes 10): Recalcula cuota correctamente con ajuste previo', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 10, motivo: 'Materiales' }
    ];

    const adelantoActivo = {
      activo: true,
      mes: 10,
      monto: 10000,
      estrategia: 'reducir_cuota' as const
    };

    const res = calcularFlujoIndividual(
      1,
      65000,
      0,
      48,
      'reducir_cuota',
      0,
      adelantoActivo,
      15,
      0,
      ajustes
    );

    // En mes 10 se inyectan 10,000
    expect(res.flujo[9].adelanto).toBe(10000);
    // En mes 11 la cuota debe ser menor gracias a la reducción
    expect(res.flujo[10].capital).toBeLessThan(res.flujo[8].capital);
    // Y al final del plazo (48 meses) el saldo remanente es 0
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
  });

  it('Test 6 (Cesión de Posición Contractual): Valida cálculo con cuotas pagadas ajustadas', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 4, porcentaje: 10, motivo: 'Materiales' }
    ];

    const res = calcularFlujoIndividual(
      1,
      65000,
      5000,
      48,
      'reducir_cuota',
      50,
      adelantoInactivo,
      15,
      1000,
      ajustes
    );

    // Simular cesión en cuota 12 con prima 10%
    const liq = calcularLiquidacionCesion(res, 12, 10, 1000);

    expect(liq.cuotasPagas).toBe(12);
    expect(liq.capitalAportado).toBeGreaterThan(5000);
    expect(liq.montoPrima).toBeCloseTo(liq.capitalAportado * 0.10, 2);
    expect(liq.netoACobrar).toBeGreaterThan(liq.capitalAportado);
  });

  it('Test 7 (Gastos prorrateados y finales se ajustan proporcionalmente)', () => {
    const gastosBase = calcularGastos(
      65000,
      {
        formaPagoGastos: 'prorrateado',
        comisionGestion: 7,
        comisionEscribania: 3,
        otrosGastos: 500
      },
      48
    );

    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 10, motivo: 'Ajuste general' }
    ];

    const res = calcularFlujoIndividual(
      1,
      65000,
      0,
      48,
      'reducir_cuota',
      gastosBase.recargoGastosPorCuota,
      adelantoInactivo,
      15,
      gastosBase.pagoFinalGastos,
      ajustes
    );

    // Meses 1 a 5: gastos base
    expect(res.flujo[0].gastos).toBeCloseTo(gastosBase.recargoGastosPorCuota, 2);
    // Mes 6 en adelante: gastos aumentados 10%
    expect(res.flujo[5].gastos).toBeCloseTo(gastosBase.recargoGastosPorCuota * 1.10, 2);
  });

  it('Test 8 (Modalidad Reducir Plazo con Ajuste): Amortiza el saldo ajustado', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 15, motivo: 'Hierro y Cemento' }
    ];

    const res = calcularFlujoIndividual(
      1,
      60000,
      10000, // anticipo que reduce plazo
      36,
      'reducir_plazo',
      0,
      adelantoInactivo,
      12,
      0,
      ajustes
    );

    expect(res.flujo[5].porcentajeAjuste).toBe(15);
    const last = res.flujo[res.flujo.length - 1];
    expect(last.saldoRemanente).toBeCloseTo(0, 2);
  });

  it('Test 9 (Ajuste en Mes 1): Afecta desde el inicio de las cuotas ordinarias', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 1, porcentaje: 8, motivo: 'Actualización previa al inicio' }
    ];

    const res = calcularFlujoIndividual(
      1,
      48000,
      0,
      48,
      'reducir_cuota',
      0,
      adelantoInactivo,
      10,
      0,
      ajustes
    );

    const cuotaBase = 48000 / 48; // 1000
    expect(res.flujo[0].capital).toBeCloseTo(cuotaBase * 1.08, 2);
    expect(res.flujo[0].porcentajeAjuste).toBe(8);
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
  });

  it('Test 10 (Múltiples ajustes en el mismo mes se acumulan correctamente)', () => {
    const ajustes: AjusteCuota[] = [
      { id: 'aj-1', mes: 6, porcentaje: 5, motivo: 'Materiales' },
      { id: 'aj-2', mes: 6, porcentaje: 3, motivo: 'Honorarios' }
    ];

    const res = calcularFlujoIndividual(
      1,
      48000,
      0,
      48,
      'reducir_cuota',
      0,
      adelantoInactivo,
      10,
      0,
      ajustes
    );

    const factorEsperado = 1.05 * 1.03;
    expect(res.flujo[5].capital).toBeCloseTo(1000 * factorEsperado, 2);
    expect(res.flujo[5].porcentajeAjuste).toBe(8);
    expect(res.flujo[47].saldoRemanente).toBeCloseTo(0, 2);
  });
});

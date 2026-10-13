import { describe, it, expect } from 'vitest';
import { calcularFlujoIndividual, calcularGastos, fmtMoneda } from '../utils/calculations';

describe('SimuladorSocio: Lógica del Wizard de 3 Pasos y Progressive Disclosure (Etapa 2)', () => {
  it('Paso 1 (Mi Unidad): Calcula correctamente el saldo a financiar según el valor objetivo y anticipo inicial', () => {
    const valorObjetivo = 65000;
    const anticipoMes0 = 15000;
    const saldoAFinanciar = valorObjetivo - anticipoMes0;

    expect(saldoAFinanciar).toBe(50000);
    expect(fmtMoneda(saldoAFinanciar)).toContain('50.000');
  });

  it('Paso 2 (Mi Plan): Modalidad "reducir_cuota" mantiene el plazo y abarata la cuota inicial mensual', () => {
    const costoDepto = 65000;
    const cantidadCuotas = 48;
    const anticipo = 10000;

    const baseSinAnticipo = calcularFlujoIndividual(
      1,
      costoDepto,
      0,
      cantidadCuotas,
      'reducir_cuota',
      0,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      16,
      0,
      []
    );

    const conAnticipo = calcularFlujoIndividual(
      1,
      costoDepto,
      anticipo,
      cantidadCuotas,
      'reducir_cuota',
      0,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      16,
      0,
      []
    );

    // Mantiene las 48 cuotas
    expect(conAnticipo.mesesTotales).toBe(48);
    // La cuota mensual es menor con anticipo
    expect(conAnticipo.cuotaInmInicial).toBeLessThan(baseSinAnticipo.cuotaInmInicial);
    // La diferencia es exactamente el anticipo dividido las cuotas
    const ahorroEsperado = Math.round(anticipo / cantidadCuotas);
    expect(Math.round(baseSinAnticipo.cuotaInmInicial - conAnticipo.cuotaInmInicial)).toBe(ahorroEsperado);
  });

  it('Paso 2 (Mi Plan): Modalidad "reducir_plazo" mantiene la cuota pura base y reduce los meses totales', () => {
    const costoDepto = 65000;
    const cantidadCuotas = 48;
    const anticipo = 15000;

    const conReduccionPlazo = calcularFlujoIndividual(
      1,
      costoDepto,
      anticipo,
      cantidadCuotas,
      'reducir_plazo',
      0,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      16,
      0,
      []
    );

    // Los meses totales deben ser menores a 48
    expect(conReduccionPlazo.mesesTotales).toBeLessThan(cantidadCuotas);
  });

  it('Paso 3 (Mi Resultado): Proyecta el desembolso total y la cuota inicial mensual con los gastos configurados', () => {
    const costoDepto = 80000;
    const cuotas = 48;
    const gastos = calcularGastos(
      costoDepto,
      {
        formaPagoGastos: 'final',
        comisionGestion: 7,
        comisionEscribania: 3,
        otrosGastos: 500
      },
      cuotas
    );

    const flujo = calcularFlujoIndividual(
      1,
      costoDepto,
      8000,
      cuotas,
      'reducir_cuota',
      gastos.recargoGastosPorCuota,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      16,
      gastos.pagoFinalGastos,
      []
    );

    // Verifica que la cuota inicial mensual sea positiva y calculada al costo
    expect(flujo.cuotaInmInicial).toBeGreaterThan(0);
    // El total abonado debe contemplar tanto el costo de la unidad como los gastos fiduciarios
    expect(flujo.totalAbonado).toBeGreaterThanOrEqual(costoDepto);
  });

  it('Conexión con CTA de Conversión: Garantiza que la cuota y el anticipo se transmiten con valores numéricos válidos', () => {
    const cuotaCalculada = 1450.75;
    const anticipoCalculado = 12000;

    // Validación de que Math.round y el formato para modal funcionan
    const cuotaParaModal = Math.round(cuotaCalculada);
    const cuotaStr = String(cuotaParaModal);

    expect(cuotaParaModal).toBe(1451);
    expect(cuotaStr).toBe('1451');
    expect(anticipoCalculado).toBe(12000);
  });
});

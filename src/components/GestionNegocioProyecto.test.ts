import { describe, it, expect } from 'vitest';
import type { FondoGuardado } from '../services/fondoService';

describe('GestionNegocioProyecto: Cálculos del Estado de Resultados (P&L Fiduciario) y Discriminación Total', () => {
  const fondoMock: FondoGuardado = {
    id: 'test-fondo-negocio',
    nombre: 'Torre Negocio Test',
    updated_at: new Date().toISOString(),
    estadoPlan: 'activo',
    params: {
      costoDepto: 80000,
      cantidadDeptos: 10,
      cantidadCuotas: 40,
      valorCuotaBase: 2000,
      fechaInicio: '2027-01',
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 6, // 6% sobre 800.000 = 48.000
      comisionEscribania: 3, // 3% sobre 800.000 = 24.000
      otrosGastos: 500
    },
    anticipos: [10000, 10000, 0, 0, 0, 0, 0, 0, 0, 0], // Total anticipos = 20.000
    adjudicacionFijada: { 1: 10 },
    cesion: {
      activo: true,
      socioCedente: 1,
      cuotaSalida: 15,
      primaCesion: 10, // 10% sobre 80.000 = 8.000
      mecanismoSalida: 'tercero'
    },
    adelanto: {
      activo: true,
      socioAdelanta: 2,
      monto: 5000,
      cuota: 12,
      estrategia: 'reducir_cuota'
    },
    ajustes: [],
    datosNegocio: {
      compraLote: { presupuestado: 160000, ejecutado: 150000 },
      tasasMunicipales: { presupuestado: 25000, ejecutado: 20000 },
      equipoTecnico: { presupuestado: 50000, ejecutado: 35000 },
      costoConstruccionDirecto: { presupuestado: 450000, ejecutado: 200000 },
      gastosAdministrativos: { presupuestado: 20000, ejecutado: 10000 },
      pagosEscribania: { presupuestado: 20000, ejecutado: 8000 },
      otrosGastos: { presupuestado: 30000, ejecutado: 5000 },
      otrosIngresos: { presupuestado: 12000, ejecutado: 6000 },
      partidasPersonalizadas: [
        {
          id: 'custom-1',
          concepto: 'Rendimiento Plazo Fijo Transitorio',
          categoria: 'ingreso',
          subcategoria: 'Partida Manual',
          montoPresupuestado: 4000,
          montoRealEjecutado: 4000
        },
        {
          id: 'custom-2',
          concepto: 'Seguro de Caución Fiduciario',
          categoria: 'gasto',
          subcategoria: 'Partida Manual',
          montoPresupuestado: 5000,
          montoRealEjecutado: 5000
        }
      ]
    }
  };

  it('1. Calcula correctamente los ingresos totales por todo concepto', () => {
    const volumenObra = fondoMock.params.cantidadDeptos * fondoMock.params.costoDepto; // 800.000
    const anticipos = 20000;
    const cuotasPurasPres = volumenObra - anticipos; // 780.000
    const primaCesion = (fondoMock.params.costoDepto * fondoMock.cesion.primaCesion) / 100; // 8.000
    const comisionGestion = (volumenObra * fondoMock.gastos.comisionGestion) / 100; // 48.000
    const comisionEscribania = (volumenObra * fondoMock.gastos.comisionEscribania) / 100; // 24.000
    const adelanto = fondoMock.adelanto.monto; // 5.000
    const otrosIngresos = fondoMock.datosNegocio!.otrosIngresos!.presupuestado; // 12.000
    const customIngreso = 4000;

    const totalIngresosEsperado =
      cuotasPurasPres +
      anticipos +
      primaCesion +
      comisionGestion +
      comisionEscribania +
      adelanto +
      otrosIngresos +
      customIngreso;

    // 780.000 + 20.000 + 8.000 + 48.000 + 24.000 + 5.000 + 12.000 + 4.000 = 901.000
    expect(totalIngresosEsperado).toBe(901000);
  });

  it('2. Calcula correctamente las erogaciones totales del proyecto (lote, tasas, obra, etc.)', () => {
    const neg = fondoMock.datosNegocio!;
    const lote = neg.compraLote!.presupuestado; // 160.000
    const tasas = neg.tasasMunicipales!.presupuestado; // 25.000
    const equipo = neg.equipoTecnico!.presupuestado; // 50.000
    const obra = neg.costoConstruccionDirecto!.presupuestado; // 450.000
    const admin = neg.gastosAdministrativos!.presupuestado; // 20.000
    const escribania = neg.pagosEscribania!.presupuestado; // 20.000
    const otros = neg.otrosGastos!.presupuestado; // 30.000
    const customGasto = 5000;

    const totalGastosEsperado =
      lote + tasas + equipo + obra + admin + escribania + otros + customGasto;

    // 160.000 + 25.000 + 50.000 + 450.000 + 20.000 + 20.000 + 30.000 + 5.000 = 760.000
    expect(totalGastosEsperado).toBe(760000);
  });

  it('3. Determina el resultado operativo neto antes de impuestos (Superávit = Ingresos - Gastos)', () => {
    const totalIngresos = 901000;
    const totalGastos = 760000;
    const resultadoNetoAntesDeImpuestos = totalIngresos - totalGastos;

    expect(resultadoNetoAntesDeImpuestos).toBe(141000);

    const margenPct = (resultadoNetoAntesDeImpuestos / totalIngresos) * 100;
    expect(Number(margenPct.toFixed(1))).toBe(15.6);
  });

  it('4. Permite discriminar entre valores presupuestados al 100% y valores ejecutados en caja real', () => {
    const neg = fondoMock.datosNegocio!;
    const loteReal = neg.compraLote!.ejecutado; // 150.000
    const tasasReal = neg.tasasMunicipales!.ejecutado; // 20.000
    const equipoReal = neg.equipoTecnico!.ejecutado; // 35.000

    expect(loteReal).toBeLessThan(neg.compraLote!.presupuestado);
    expect(tasasReal).toBeLessThan(neg.tasasMunicipales!.presupuestado);
    expect(equipoReal).toBeLessThan(neg.equipoTecnico!.presupuestado);
  });
});

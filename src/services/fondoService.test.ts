import { describe, it, expect, beforeEach } from 'vitest';
import {
  esSimulacion,
  getStoredFondosSync,
  eliminarSimulacionDeBase,
  type FondoGuardado
} from './fondoService';

// Mock de localStorage para el entorno de pruebas Node
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true
});

describe('fondoService - Ciclo de vida de Simulaciones vs Obras en Marcha', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('detecta correctamente si un fondo es una simulación temporal', () => {
    expect(esSimulacion({ estadoPlan: 'simulacion' })).toBe(true);
    expect(esSimulacion({ nombre: 'Nueva Simulación de Plan', estadoPlan: 'activo' })).toBe(true);
    expect(esSimulacion({ nombre: 'Simulación en Torre Central' })).toBe(true);
    expect(esSimulacion({ nombre: 'Laboratorio de Simulación Abierta' })).toBe(true);

    // Obras en Marcha legítimas
    expect(esSimulacion({ nombre: 'Torre Central (10 Deptos • 36 Meses)', estadoPlan: 'activo' })).toBe(false);
    expect(esSimulacion({ nombre: 'Complejo Casas del Parque', estadoPlan: 'activo' })).toBe(false);
  });

  it('getStoredFondosSync purga simulaciones viejas y solo retorna Obras en Marcha vigentes', () => {
    const simulacionVieja: FondoGuardado = {
      id: 'sim-vieja-1',
      nombre: 'Simulación en Proyecto Nuevo II',
      updated_at: new Date().toISOString(),
      estadoPlan: 'simulacion',
      params: { costoDepto: 0, cantidadDeptos: 10, cantidadCuotas: 0, valorCuotaBase: 0, fechaInicio: '2027-01', modalidadAnticipo: 'reducir_cuota' },
      gastos: { formaPagoGastos: 'final', comisionGestion: 0, comisionEscribania: 0, otrosGastos: 0 },
      anticipos: [],
      adjudicacionFijada: {},
      cesion: { activo: false, socioCedente: 1, cuotaSalida: 12, primaCesion: 0, mecanismoSalida: 'tercero' },
      adelanto: { activo: false, socioAdelanta: 1, monto: 0, cuota: 12, estrategia: 'reducir_cuota' }
    };

    const obraReal: FondoGuardado = {
      id: 'obra-real-1',
      nombre: 'Torre Central (10 Deptos • 36 Meses)',
      updated_at: new Date().toISOString(),
      estadoPlan: 'activo',
      params: { costoDepto: 75000, cantidadDeptos: 10, cantidadCuotas: 36, valorCuotaBase: 2083, fechaInicio: '2027-01', modalidadAnticipo: 'reducir_cuota' },
      gastos: { formaPagoGastos: 'final', comisionGestion: 7, comisionEscribania: 3, otrosGastos: 500 },
      anticipos: [7500],
      adjudicacionFijada: { 1: 12 },
      cesion: { activo: false, socioCedente: 3, cuotaSalida: 15, primaCesion: 10, mecanismoSalida: 'tercero' },
      adelanto: { activo: true, socioAdelanta: 1, monto: 10000, cuota: 10, estrategia: 'reducir_cuota' }
    };

    localStorage.setItem('fondo_inmobil_saved_circles', JSON.stringify([simulacionVieja, obraReal]));

    const vigentes = getStoredFondosSync();
    expect(vigentes.length).toBe(1);
    expect(vigentes[0].id).toBe('obra-real-1');
    expect(vigentes[0].nombre).toBe('Torre Central (10 Deptos • 36 Meses)');
  });

  it('eliminarSimulacionDeBase remueve la simulación de la base y de localStorage', async () => {
    const sim: FondoGuardado = {
      id: 'sim-a-eliminar',
      nombre: 'Simulación Temporal',
      updated_at: new Date().toISOString(),
      estadoPlan: 'simulacion',
      params: { costoDepto: 50000, cantidadDeptos: 5, cantidadCuotas: 20, valorCuotaBase: 2500, fechaInicio: '2027-01', modalidadAnticipo: 'reducir_cuota' },
      gastos: { formaPagoGastos: 'final', comisionGestion: 0, comisionEscribania: 0, otrosGastos: 0 },
      anticipos: [],
      adjudicacionFijada: {},
      cesion: { activo: false, socioCedente: 1, cuotaSalida: 12, primaCesion: 0, mecanismoSalida: 'tercero' },
      adelanto: { activo: false, socioAdelanta: 1, monto: 0, cuota: 12, estrategia: 'reducir_cuota' }
    };

    localStorage.setItem('fondo_inmobil_saved_circles', JSON.stringify([sim]));
    await eliminarSimulacionDeBase('sim-a-eliminar');

    const raw = localStorage.getItem('fondo_inmobil_saved_circles');
    const list = raw ? JSON.parse(raw) : [];
    expect(list.find((f: any) => f.id === 'sim-a-eliminar')).toBeUndefined();
  });
});

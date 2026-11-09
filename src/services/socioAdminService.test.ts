import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSociosPorFondo,
  guardarSocio,
  togglePagoInicialSocio,
  calcularResumenSocios
} from './socioAdminService';
import type { SocioFiduciario } from '../types/socio';

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

describe('socioAdminService - Gestión y Padrón de Socios', () => {
  const fondoId = 'fondo-test-1';

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('genera y retorna el padrón completo según la cantidad de departamentos de la obra', async () => {
    const socios = await getSociosPorFondo(fondoId, 10, 75000, [7500]);
    expect(socios.length).toBe(10);
    expect(socios[0].numeroSocio).toBe(1);
    expect(socios[0].unidadDepto).toBe('Depto 1');
    expect(socios[9].numeroSocio).toBe(10);
  });

  it('permite guardar y actualizar los datos completos de un socio incluyendo contrato digital', async () => {
    const nuevoSocio: SocioFiduciario = {
      id: 'socio-1-uuid',
      fondoId,
      numeroSocio: 1,
      unidadDepto: 'Depto 1',
      nombreCompleto: 'Juan Martín González',
      dni: '30.123.456',
      fotoDniUrl: 'data:image/jpeg;base64,mockDni',
      fotoDniNombre: 'dni_frente.jpg',
      email: 'juan@ejemplo.com',
      telefono: '+5492644987654',
      pagoInicialEfectuado: true,
      montoPagoInicial: 7500,
      fechaPagoInicial: '2027-01-15',
      contratoFirmadoUrl: 'data:application/pdf;base64,mockContratoPdf',
      contratoFirmadoNombre: 'Contrato_Juan_Gonzalez.pdf',
      fechaFirmaContrato: '2027-01-10',
      estado: 'activo',
      updatedAt: new Date().toISOString()
    };

    const res = await guardarSocio(nuevoSocio);
    expect(res.success).toBe(true);
    expect(res.socio.nombreCompleto).toBe('Juan Martín González');
    expect(res.socio.contratoFirmadoNombre).toBe('Contrato_Juan_Gonzalez.pdf');
    expect(res.socio.estado).toBe('activo');

    // Recuperar
    const recuperados = await getSociosPorFondo(fondoId, 10);
    const socioGuardado = recuperados.find((s) => s.numeroSocio === 1);
    expect(socioGuardado?.dni).toBe('30.123.456');
    expect(socioGuardado?.contratoFirmadoUrl).toBe('data:application/pdf;base64,mockContratoPdf');
  });

  it('permite alternar el estado del pago inicial para activar o suspender la calidad de socio pleno', async () => {
    const socio: SocioFiduciario = {
      id: 'socio-2',
      fondoId,
      numeroSocio: 2,
      unidadDepto: 'Depto 2',
      nombreCompleto: 'María López',
      dni: '28.987.654',
      email: 'maria@ejemplo.com',
      telefono: '+5492644111222',
      pagoInicialEfectuado: false,
      montoPagoInicial: 0,
      estado: 'pendiente_pago',
      updatedAt: new Date().toISOString()
    };

    await guardarSocio(socio);

    // Marcar como pagado
    const ok = await togglePagoInicialSocio(fondoId, 'socio-2', true, 8000);
    expect(ok).toBe(true);

    const listaActualizada = await getSociosPorFondo(fondoId, 10);
    const socioActualizado = listaActualizada.find((s) => s.numeroSocio === 2);
    expect(socioActualizado?.pagoInicialEfectuado).toBe(true);
    expect(socioActualizado?.estado).toBe('activo');
    expect(socioActualizado?.montoPagoInicial).toBe(8000);
  });

  it('calcula métricas de resumen fiduciario correctamente', () => {
    const lista: SocioFiduciario[] = [
      {
        id: 's1',
        fondoId,
        numeroSocio: 1,
        unidadDepto: 'Depto 1',
        nombreCompleto: 'Socio 1',
        dni: '123',
        email: 's1@test.com',
        telefono: '111',
        pagoInicialEfectuado: true,
        montoPagoInicial: 5000,
        contratoFirmadoUrl: 'data:pdf...',
        estado: 'activo',
        updatedAt: ''
      },
      {
        id: 's2',
        fondoId,
        numeroSocio: 2,
        unidadDepto: 'Depto 2',
        nombreCompleto: 'Socio 2',
        dni: '456',
        email: '',
        telefono: '',
        pagoInicialEfectuado: false,
        montoPagoInicial: 0,
        estado: 'pendiente_pago',
        updatedAt: ''
      },
      {
        id: 's3',
        fondoId,
        numeroSocio: 3,
        unidadDepto: 'Depto 3',
        nombreCompleto: '',
        dni: '',
        email: '',
        telefono: '',
        pagoInicialEfectuado: false,
        montoPagoInicial: 0,
        estado: 'pendiente_pago',
        updatedAt: ''
      }
    ];

    const resumen = calcularResumenSocios(lista);
    expect(resumen.totalUnidades).toBe(3);
    expect(resumen.sociosRegistrados).toBe(2);
    expect(resumen.sociosActivos).toBe(1);
    expect(resumen.sociosPendientesPago).toBe(2);
    expect(resumen.contratosCargados).toBe(1);
  });
});

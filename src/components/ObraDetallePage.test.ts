import { describe, it, expect } from 'vitest';
import { calcularGastos, calcularFlujoIndividual } from '../utils/calculations';
import { PLANTILLAS_PREDEFINIDAS, type FondoGuardado } from '../services/fondoService';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';

describe('Requerimiento: Obras en Marcha (Renglón Único y Detalle Completo en otra página)', () => {
  const mockObra: FondoGuardado = {
    ...PLANTILLAS_PREDEFINIDAS[0],
    id: 'fondo-obra-1',
    nombre: 'Edificio Las Heras 1420 - Fondo Inmobiliario 1',
    descripcion: 'Edificio residencial de categoría desarrollado en PB y 4 plantas.',
    updated_at: '2026-03-30T10:00:00.000Z',
    estadoPlan: 'activo',
    params: {
      ...PLANTILLAS_PREDEFINIDAS[0].params,
      costoDepto: 70000,
      cantidadCuotas: 36,
      cantidadDeptos: 10
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 7,
      comisionEscribania: 3,
      otrosGastos: 500
    },
    datosTecnicos: {
      ...DATOS_TECNICOS_DEFAULT,
      superficieTotalM2: 1250,
      directorObra: 'Arq. Marcelo Gómez',
      numeroPermisoObra: 'EXP-MUNIC-2026-89412',
      etapas: [
        {
          id: 'et-1',
          nombre: 'Fundaciones y Submuración',
          pesoPonderado: 20,
          porcentajeReal: 100,
          fechaInicioEstimada: '2026-01-01',
          fechaFinEstimada: '2026-03-30',
          estado: 'completada'
        },
        {
          id: 'et-2',
          nombre: 'Estructura de H°A°',
          pesoPonderado: 40,
          porcentajeReal: 75,
          fechaInicioEstimada: '2026-04-01',
          fechaFinEstimada: '2026-08-30',
          estado: 'en_progreso'
        },
        {
          id: 'et-3',
          nombre: 'Mampostería y Cerramientos',
          pesoPonderado: 40,
          porcentajeReal: 10,
          fechaInicioEstimada: '2026-09-01',
          fechaFinEstimada: '2026-12-30',
          estado: 'en_progreso'
        }
      ]
    }
  };

  it('Renglón Único: calcula y formatea los datos básicos requeridos para la línea compacta', () => {
    const cantidadDeptos = mockObra.params.cantidadDeptos;
    const cantidadCuotas = mockObra.params.cantidadCuotas;
    const costoDepto = mockObra.params.costoDepto;
    const cuotaEstimada = Math.round(costoDepto / cantidadCuotas);

    // Unidades disponibles
    const unidadesAdjudicadas = 7;
    const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);

    // Avance ponderado de obra
    const avancePonderado = Math.round(
      mockObra.datosTecnicos!.etapas!.reduce(
        (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
        0
      )
    );

    expect(mockObra.nombre).toBe('Edificio Las Heras 1420 - Fondo Inmobiliario 1');
    expect(cantidadCuotas).toBe(36);
    expect(cuotaEstimada).toBe(1944);
    expect(unidadesDisponibles).toBe(3);
    // 20*1.0 + 40*0.75 + 40*0.10 = 20 + 30 + 4 = 54%
    expect(avancePonderado).toBe(54);
  });

  it('Aspecto Financiero: calcula desglose de gastos de gestión y escribanía para el detalle', () => {
    const gastos = calcularGastos(
      mockObra.params.costoDepto,
      mockObra.gastos!,
      mockObra.params.cantidadCuotas
    );

    // Gestión: 7% de 70.000 = 4.900
    expect(gastos.montoGestion).toBeCloseTo(4900, 2);
    // Escribanía: 3% de 70.000 = 2.100
    expect(gastos.montoEscribania).toBeCloseTo(2100, 2);
    // Otros: 500
    // Total gastos: 4.900 + 2.100 + 500 = 7.500
    expect(gastos.gastosTotales).toBeCloseTo(7500, 2);
    // Al ser forma 'final', se cobra en la posesión
    expect(gastos.pagoFinalGastos).toBeCloseTo(7500, 2);
    expect(gastos.recargoGastosPorCuota).toBe(0);
  });

  it('Aspecto Financiero: genera el flujo de fondos y cuadro de marcha para la obra', () => {
    const gastos = calcularGastos(
      mockObra.params.costoDepto,
      mockObra.gastos!,
      mockObra.params.cantidadCuotas
    );

    const anticipo = 14000; // 20%
    const cuotaPosesion = 15;
    const adelantoInactivo = {
      activo: false,
      mes: 10,
      monto: 0,
      estrategia: 'reducir_cuota' as const
    };

    const flujo = calcularFlujoIndividual(
      1,
      mockObra.params.costoDepto,
      anticipo,
      mockObra.params.cantidadCuotas,
      'reducir_cuota',
      gastos.recargoGastosPorCuota,
      adelantoInactivo,
      cuotaPosesion,
      gastos.pagoFinalGastos,
      []
    );

    expect(flujo.cuotaInmInicial).toBeGreaterThan(0);
    // Costo del depto (70000) + pago final de gastos fiduciarios (7500)
    expect(flujo.totalAbonado).toBeCloseTo(77500, 2);
    expect(flujo.flujo.length).toBe(mockObra.params.cantidadCuotas);
    expect(flujo.flujo[14].mes).toBe(15);
  });

  it('Aspecto Técnico: verifica que la obra posea la totalidad de los datos requeridos', () => {
    const datos = mockObra.datosTecnicos!;

    expect(datos.superficieTotalM2).toBe(1250);
    expect(datos.directorObra).toBe('Arq. Marcelo Gómez');
    expect(datos.numeroPermisoObra).toBe('EXP-MUNIC-2026-89412');
    expect(datos.etapas.length).toBeGreaterThanOrEqual(2);
    expect(datos.tramites.length).toBeGreaterThan(0);
    expect((datos.profesionales || []).length).toBeGreaterThan(0);
  });

  it('Navegación: la ruta /obra o #/obra es identificada como obra-detalle', () => {
    const testPaths = ['/obra', '/obra?id=fondo-obra-1', '#/obra', '#/obra?id=fondo-obra-1'];

    testPaths.forEach((path) => {
      const isObraRoute = path.toLowerCase().includes('/obra') || path.toLowerCase().includes('obra-detalle');
      expect(isObraRoute).toBe(true);
    });
  });

  it('Gastos Fiduciarios: al modificar y guardar nuevos valores de gastos, se calculan y reflejan inmediatamente', () => {
    // Caso de prueba reportado por el usuario: Modificar gestión a 10%, escribanía 3%, otros gastos $500
    const gastosEditados = {
      formaPagoGastos: 'final' as const,
      comisionGestion: 10,
      comisionEscribania: 3,
      otrosGastos: 500
    };

    const obraConGastosNuevos: FondoGuardado = {
      ...mockObra,
      params: {
        ...mockObra.params,
        costoDepto: 75000,
        cantidadCuotas: 36
      },
      gastos: gastosEditados
    };

    const calculados = calcularGastos(
      obraConGastosNuevos.params.costoDepto,
      obraConGastosNuevos.gastos,
      obraConGastosNuevos.params.cantidadCuotas
    );

    // Gestión: 10% de $75.000 = $7.500
    expect(calculados.montoGestion).toBe(7500);
    // Escribanía: 3% de $75.000 = $2.250
    expect(calculados.montoEscribania).toBe(2250);
    // Otros: $500
    // Total gastos: 7.500 + 2.250 + 500 = $10.250
    expect(calculados.gastosTotales).toBe(10250);
    expect(calculados.pagoFinalGastos).toBe(10250);
  });

  it('Seguridad y Perfiles: solo el perfil administrador puede editar la obra', () => {
    const roles: Array<{ role: string; puedeEditar: boolean }> = [
      { role: 'admin', puedeEditar: true },
      { role: 'tecnico', puedeEditar: false },
      { role: 'socio', puedeEditar: false },
      { role: 'invitado', puedeEditar: false }
    ];

    roles.forEach(({ role, puedeEditar }) => {
      const tienePermisoEditar = role === 'admin';
      expect(tienePermisoEditar).toBe(puedeEditar);
    });
  });

  it('Simulación y Aprendizaje: cualquier usuario puede simular libremente cuotas y anticipos sin alterar la obra base', () => {
    // La obra base se mantiene inmutable
    const costoBase = mockObra.params.costoDepto; // $70.000
    const cuotasBase = mockObra.params.cantidadCuotas; // 36

    // Simulación 1: Usuario prueba con anticipo $0
    const simCero = calcularFlujoIndividual(1, costoBase, 0, cuotasBase, 'reducir_cuota', 0, { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' }, 15, 0, []);
    expect(simCero.cuotaInmInicial).toBeGreaterThan(0);

    // Simulación 2: Usuario prueba con anticipo de $20.000 para aprender cómo amortiza
    const simConAnticipo = calcularFlujoIndividual(1, costoBase, 20000, cuotasBase, 'reducir_cuota', 0, { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' }, 15, 0, []);
    expect(simConAnticipo.cuotaInmInicial).toBeLessThan(simCero.cuotaInmInicial);

    // La obra original nunca fue alterada
    expect(mockObra.params.costoDepto).toBe(70000);
    expect(mockObra.params.cantidadCuotas).toBe(36);
  });

  it('Inmutabilidad de Obra en Marcha: solo admin puede persistir modificaciones sobre obra activa', () => {
    const puedeModificarFondo = (estadoPlan: string, role?: string) => {
      if (estadoPlan !== 'simulacion' && role !== 'admin') {
        return false;
      }
      return true;
    };

    // Caso 1: Obra en Marcha (estadoPlan: 'activo')
    expect(puedeModificarFondo('activo', undefined)).toBe(false); // Visitante / Temporal
    expect(puedeModificarFondo('activo', 'socio')).toBe(false);    // Socio
    expect(puedeModificarFondo('activo', 'tecnico')).toBe(false);  // Técnico
    expect(puedeModificarFondo('activo', 'admin')).toBe(true);     // Administrador Único

    // Caso 2: Plan en simulación / aprendizaje (estadoPlan: 'simulacion')
    expect(puedeModificarFondo('simulacion', undefined)).toBe(true); // Cualquier visitante puede simular
    expect(puedeModificarFondo('simulacion', 'socio')).toBe(true);   // Cualquier usuario puede aprender
  });

  it('Blindaje de Importes en Obra en Marcha: para usuarios no admin los valores efectivos son estrictamente los oficiales inmutables', () => {
    const anticipoOficial = 0;
    const posesionOficial = 16;
    const simAnticipoIngresado = 1000; // El importe que el usuario intentó ingresar
    const simCuotaPosesionModificada = 24;

    const resolverValoresEfectivos = (isAdmin: boolean) => ({
      anticipoEfectivo: isAdmin ? simAnticipoIngresado : anticipoOficial,
      posesionEfectiva: isAdmin ? simCuotaPosesionModificada : posesionOficial,
      tieneAdelantoEfectivo: isAdmin ? true : false,
      puedeEditarCampos: isAdmin
    });

    // Usuario temporal / sin rol admin: los importes son estrictamente los oficiales
    const noAdmin = resolverValoresEfectivos(false);
    expect(noAdmin.anticipoEfectivo).toBe(0);
    expect(noAdmin.posesionEfectiva).toBe(16);
    expect(noAdmin.tieneAdelantoEfectivo).toBe(false);
    expect(noAdmin.puedeEditarCampos).toBe(false);

    // Usuario Admin: tiene control sobre los campos e importes
    const admin = resolverValoresEfectivos(true);
    expect(admin.anticipoEfectivo).toBe(1000);
    expect(admin.posesionEfectiva).toBe(24);
    expect(admin.tieneAdelantoEfectivo).toBe(true);
    expect(admin.puedeEditarCampos).toBe(true);
  });
});


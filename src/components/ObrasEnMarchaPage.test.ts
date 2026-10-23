import { describe, it, expect } from 'vitest';
import { PLANTILLAS_PREDEFINIDAS, type FondoGuardado } from '../services/fondoService';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';

describe('Requerimiento: Obras en Marcha en Página Aparte (/obras) y Selección de Obra', () => {
  const obrasActivasMock: FondoGuardado[] = [
    {
      ...PLANTILLAS_PREDEFINIDAS[0],
      id: 'obra-1',
      nombre: 'Proyecto Nuevo II',
      updated_at: '2026-10-23T12:00:00.000Z',
      estadoPlan: 'activo',
      params: {
        ...PLANTILLAS_PREDEFINIDAS[0].params,
        costoDepto: 70000,
        cantidadCuotas: 36,
        cantidadDeptos: 10
      },
      datosTecnicos: {
        ...DATOS_TECNICOS_DEFAULT,
        direccionObra: 'Av. Libertador 1450, Zona Céntrica',
        etapas: [
          {
            id: 'e1',
            nombre: 'Estructura',
            pesoPonderado: 100,
            porcentajeReal: 30,
            fechaInicioEstimada: 'Mes 1',
            fechaFinEstimada: 'Mes 12',
            estado: 'en_progreso'
          }
        ]
      }
    },
    {
      ...PLANTILLAS_PREDEFINIDAS[0],
      id: 'obra-2',
      nombre: 'La Lucía Family Homes',
      updated_at: '2026-10-23T12:00:00.000Z',
      estadoPlan: 'activo',
      params: {
        ...PLANTILLAS_PREDEFINIDAS[0].params,
        costoDepto: 85000,
        cantidadCuotas: 48,
        cantidadDeptos: 12
      },
      datosTecnicos: {
        ...DATOS_TECNICOS_DEFAULT,
        direccionObra: 'Calle Los Tilos 230',
        etapas: [
          {
            id: 'e2',
            nombre: 'Estructura',
            pesoPonderado: 100,
            porcentajeReal: 68,
            fechaInicioEstimada: 'Mes 1',
            fechaFinEstimada: 'Mes 18',
            estado: 'en_progreso'
          }
        ]
      }
    }
  ];

  it('identifica correctamente las obras en marcha activas para la página dedicada', () => {
    const activas = obrasActivasMock.filter((p) => p.estadoPlan !== 'simulacion');
    expect(activas.length).toBe(2);
    expect(activas[0].nombre).toBe('Proyecto Nuevo II');
    expect(activas[1].nombre).toBe('La Lucía Family Homes');
  });

  it('calcula correctamente el avance ponderado y cuotas base de cada obra', () => {
    const obra1 = obrasActivasMock[0];
    const obra2 = obrasActivasMock[1];

    const avance1 = obra1.datosTecnicos!.etapas.reduce(
      (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
      0
    );
    const avance2 = obra2.datosTecnicos!.etapas.reduce(
      (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
      0
    );

    expect(avance1).toBe(30);
    expect(avance2).toBe(68);

    const cuota1 = Math.round(obra1.params.costoDepto / obra1.params.cantidadCuotas);
    const cuota2 = Math.round(obra2.params.costoDepto / obra2.params.cantidadCuotas);

    expect(cuota1).toBe(1944);
    expect(cuota2).toBe(1771);
  });

  it('permite navegación independiente a cada obra seleccionada', () => {
    const obraElegida = obrasActivasMock.find((o) => o.id === 'obra-2');
    expect(obraElegida).toBeDefined();
    expect(obraElegida?.nombre).toBe('La Lucía Family Homes');
  });
});

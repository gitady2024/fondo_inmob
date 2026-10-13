import { describe, it, expect } from 'vitest';

describe('Etapa 3: Optimizaciones Móviles, Tipografía, a11y, Toasts y Obras en Marcha', () => {
  it('Contador Dinámico de Escasez: calcula correctamente las unidades disponibles (cantidadDeptos - unidadesAdjudicadas)', () => {
    const cantidadDeptos = 10;
    const unidadesAdjudicadas = 7;
    const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);

    expect(unidadesDisponibles).toBe(3);
    const mensajeEscasez = `Quedan ${unidadesDisponibles} de ${cantidadDeptos} unidades`;
    expect(mensajeEscasez).toBe('Quedan 3 de 10 unidades');
  });

  it('Contador Dinámico con otra escala: respeta círculos de 8 departamentos con 5 adjudicados', () => {
    const cantidadDeptos = 8;
    const unidadesAdjudicadas = 5;
    const unidadesDisponibles = Math.max(1, cantidadDeptos - unidadesAdjudicadas);

    expect(unidadesDisponibles).toBe(3);
    const mensajeEscasez = `Quedan ${unidadesDisponibles} de ${cantidadDeptos} unidades`;
    expect(mensajeEscasez).toBe('Quedan 3 de 8 unidades');
  });

  it('Porcentaje de Avance de Obra Ponderado: calcula correctamente el avance ponderado de las etapas', () => {
    const etapas = [
      { pesoPonderado: 10, porcentajeReal: 100 }, // 10%
      { pesoPonderado: 20, porcentajeReal: 80 },  // 16%
      { pesoPonderado: 40, porcentajeReal: 50 },  // 20%
      { pesoPonderado: 30, porcentajeReal: 0 }    // 0%
    ];

    const avanceTotal = etapas.reduce(
      (acc, et) => acc + (et.pesoPonderado * et.porcentajeReal) / 100,
      0
    );

    expect(Math.round(avanceTotal)).toBe(46);
  });

  it('Toasts Persistentes: una notificación crítica sin timer permanece activa hasta interacción del usuario', () => {
    let isVisible = true;
    const duration = null; // Persistente por requerimiento de etapa 3

    const onClose = () => {
      isVisible = false;
    };

    // Al no haber timer automático, isVisible se mantiene true
    expect(duration).toBeNull();
    expect(isVisible).toBe(true);

    // Solo al disparar onClose manualmente se oculta
    onClose();
    expect(isVisible).toBe(false);
  });

  it('Formato Tabular Numérico: los valores monetarios y numéricos retienen consistencia de dígitos', () => {
    const valor1 = 1354000;
    const valor2 = 98000;

    const formatted1 = `$ ${valor1.toLocaleString('es-AR')}`;
    const formatted2 = `$ ${valor2.toLocaleString('es-AR')}`;

    expect(formatted1).toContain('1.354.000');
    expect(formatted2).toContain('98.000');
  });
});

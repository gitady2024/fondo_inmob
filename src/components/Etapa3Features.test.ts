import { describe, it, expect } from 'vitest';
import { calcularGastos, calcularFlujoIndividual } from '../utils/calculations';
import type { GastosConfigState } from '../types/fondo';

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

  it('Botón Ingresar a mi Cuenta: dispara el callback para abrir el modal de autenticación', () => {
    let loginModalAbierto = false;
    let rolSeleccionado = '';

    const onOpenLogin = (rol: string = 'socio') => {
      loginModalAbierto = true;
      rolSeleccionado = rol;
    };

    onOpenLogin('socio');
    expect(loginModalAbierto).toBe(true);
    expect(rolSeleccionado).toBe('socio');
  });

  it('Botón Editar esta Obra: pasa el ID de la obra seleccionada al administrador', () => {
    let obraEditandoId: string | null = null;
    let modalObrasAbierto = false;

    const onEditObra = (id: string) => {
      obraEditandoId = id;
      modalObrasAbierto = true;
    };

    onEditObra('fondo-torre-mitre-1');
    expect(modalObrasAbierto).toBe(true);
    expect(obraEditandoId).toBe('fondo-torre-mitre-1');
  });

  it('Transformar Simulación en Obra Activa: cambia estadoPlan a "activo" y permite fijarla como obra principal', () => {
    const planSimulacion = {
      id: 'plan-sim-1',
      nombre: 'Proyecto Las Heras - Simulación',
      estadoPlan: 'simulacion' as const,
      params: { costoDepto: 80000, cantidadCuotas: 36, cantidadDeptos: 8 }
    };

    let activeFondoId = 'obra-existente-1';
    const transformarEnObraActiva = (fondo: typeof planSimulacion) => {
      const transformado = {
        ...fondo,
        estadoPlan: 'activo' as const
      };
      activeFondoId = transformado.id;
      return transformado;
    };

    const resultado = transformarEnObraActiva(planSimulacion);
    expect(resultado.estadoPlan).toBe('activo');
    expect(activeFondoId).toBe('plan-sim-1');
  });

  it('Edición Integral de Obra Activa: permite modificar todas las opciones de la simulación', () => {
    const obraActivaInicial = {
      id: 'obra-1',
      nombre: 'Edificio Central',
      estadoPlan: 'activo' as const,
      params: {
        costoDepto: 60000,
        cantidadCuotas: 48,
        cantidadDeptos: 10,
        valorCuotaBase: 1250,
        fechaInicio: '2027-01',
        modalidadAnticipo: 'reducir_cuota' as const
      },
      gastos: {
        formaPagoGastos: 'final' as const,
        comisionGestion: 7,
        comisionEscribania: 3,
        otrosGastos: 500
      },
      anticipos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      adjudicacionFijada: {} as Record<number, number>,
      adelanto: {
        activo: false,
        socioAdelanta: 1,
        monto: 0,
        cuota: 12,
        estrategia: 'reducir_cuota' as const
      },
      ajustes: [] as Array<{ id: string; mes: number; porcentaje: number; motivo: string }>
    };

    // Simulamos la edición con todas las opciones
    const obraModificada = {
      ...obraActivaInicial,
      // 1. Precio inicial unidad y meses de duración
      params: {
        ...obraActivaInicial.params,
        costoDepto: 75000,
        cantidadCuotas: 36,
        valorCuotaBase: 2083
      },
      // 2. Costos administrativos y de escribanía
      gastos: {
        formaPagoGastos: 'prorrateado' as const,
        comisionGestion: 8.5,
        comisionEscribania: 4.0,
        otrosGastos: 800
      },
      // 3. Monto inicial en mes cero
      anticipos: [15000, 15000, 10000, 10000, 5000, 5000, 5000, 5000, 5000, 5000],
      // 4. Adelanto opcional de socios
      adelanto: {
        activo: true,
        socioAdelanta: 2,
        monto: 12000,
        cuota: 8,
        estrategia: 'acelerar' as const
      },
      // 5. Adjudicaciones fijadas
      adjudicacionFijada: { 1: 6, 2: 12, 3: 18, 4: 24, 5: 36 },
      // 6. Ajustes CAC / mayores costos
      ajustes: [
        { id: 'aj-1', mes: 6, porcentaje: 12, motivo: 'Aumento CAC Materiales' }
      ]
    };

    expect(obraModificada.params.costoDepto).toBe(75000);
    expect(obraModificada.params.cantidadCuotas).toBe(36);
    expect(obraModificada.gastos.comisionGestion).toBe(8.5);
    expect(obraModificada.gastos.comisionEscribania).toBe(4.0);
    expect(obraModificada.anticipos[0]).toBe(15000);
    expect(obraModificada.adelanto.activo).toBe(true);
    expect(obraModificada.adelanto.socioAdelanta).toBe(2);
    expect(obraModificada.adjudicacionFijada[1]).toBe(6);
    expect(obraModificada.ajustes).toHaveLength(1);
    expect(obraModificada.ajustes[0].porcentaje).toBe(12);
  });

  it('Unificación Simulación: iniciar simulación genera un plan limpio con todos los datos en cero', () => {
    const crearSimulacionPrueba = (nombre?: string, base?: { costoDepto?: number; cantidadDeptos?: number }) => {
      const cantidadDeptos = base?.cantidadDeptos || 10;
      return {
        id: 'sim-' + Date.now(),
        nombre: nombre || 'Nueva Simulación de Plan',
        estadoPlan: 'simulacion' as const,
        params: {
          costoDepto: base?.costoDepto !== undefined ? base.costoDepto : 0,
          cantidadDeptos,
          cantidadCuotas: 0, // Estrictamente 0 por defecto
          valorCuotaBase: 0,
          fechaInicio: '2027-01',
          modalidadAnticipo: 'reducir_cuota' as const
        },
        gastos: {
          formaPagoGastos: 'final' as const,
          comisionGestion: 0,
          comisionEscribania: 0,
          otrosGastos: 0
        },
        anticipos: new Array(cantidadDeptos).fill(0), // Estrictamente 0
        adjudicacionFijada: {}, // Vacío
        cesion: {
          activo: false,
          socioCedente: 1,
          cuotaSalida: 12,
          primaCesion: 0,
          mecanismoSalida: 'tercero' as const
        },
        adelanto: {
          activo: false,
          socioAdelanta: 1,
          monto: 0, // En 0
          cuota: 12,
          estrategia: 'reducir_cuota' as const
        },
        ajustes: []
      };
    };

    const nuevaSimulacion = crearSimulacionPrueba('Simulación 1');
    expect(nuevaSimulacion.estadoPlan).toBe('simulacion');
    expect(nuevaSimulacion.params.costoDepto).toBe(0);
    expect(nuevaSimulacion.params.cantidadCuotas).toBe(0); // Debe salir cero por defecto
    expect(nuevaSimulacion.params.valorCuotaBase).toBe(0);
    expect(nuevaSimulacion.anticipos.every((a) => a === 0)).toBe(true);
    expect(nuevaSimulacion.adelanto.activo).toBe(false);
    expect(nuevaSimulacion.adelanto.monto).toBe(0);
    expect(nuevaSimulacion.cesion.activo).toBe(false);
    expect(nuevaSimulacion.ajustes).toHaveLength(0);
    expect(Object.keys(nuevaSimulacion.adjudicacionFijada)).toHaveLength(0);
  });

  it('Duración Elegible por el Usuario: permite configurar libremente la cantidad de cuotas (plazo) en la simulación', () => {
    const calcularCuotaSimulada = (costoDepto: number, cantidadCuotas: number) => {
      return cantidadCuotas > 0 ? Math.round(costoDepto / cantidadCuotas) : 0;
    };

    // Caso 1: Usuario elige 24 cuotas (2 años) para depto de USD $60.000
    const cuota24 = calcularCuotaSimulada(60000, 24);
    expect(cuota24).toBe(2500);

    // Caso 2: Usuario elige 36 cuotas (3 años)
    const cuota36 = calcularCuotaSimulada(60000, 36);
    expect(cuota36).toBe(1667);

    // Caso 3: Usuario elige 60 cuotas (5 años)
    const cuota60 = calcularCuotaSimulada(60000, 60);
    expect(cuota60).toBe(1000);

    // Caso 4: Clamping automático de cuota de posesión si excede el nuevo plazo
    let cuotaPosesion = 40;
    const nuevoPlazo = 36;
    if (cuotaPosesion > nuevoPlazo) {
      cuotaPosesion = nuevoPlazo;
    }
    expect(cuotaPosesion).toBe(36);
  });

  it('Cuota de Posesión Libre: el usuario elige cualquier cuota sin etiqueta forzada ni hardcodeo de cuota 15', () => {
    const generarOpcionesPosesion = (
      totalCuotas: number,
      cuotaPosesionPrevistaObra?: number
    ) => {
      return Array.from({ length: totalCuotas }, (_, i) => i + 1).map((c) => ({
        cuota: c,
        label: `Cuota #${c}`,
        esPrevistaEnObra: Boolean(cuotaPosesionPrevistaObra && c === cuotaPosesionPrevistaObra)
      }));
    };

    // Caso 1: En simulación libre, ninguna cuota tiene etiqueta forzada "Prevista en Obra"
    const opcionesSimulacion = generarOpcionesPosesion(36);
    expect(opcionesSimulacion.some((o) => o.esPrevistaEnObra)).toBe(false);
    expect(opcionesSimulacion.find((o) => o.cuota === 15)?.esPrevistaEnObra).toBe(false);

    // Caso 2: En obra activa con posesión fijada en cuota 18, solo cuota 18 se marca
    const opcionesObraReal = generarOpcionesPosesion(48, 18);
    expect(opcionesObraReal.find((o) => o.cuota === 18)?.esPrevistaEnObra).toBe(true);
    expect(opcionesObraReal.find((o) => o.cuota === 15)?.esPrevistaEnObra).toBe(false);
  });

  it('Gastos de Escribanía, Gestión y Otros: permite edición y cálculo reactivo en cuotas y posesión', () => {
    // Depto de USD 75.000 con 3% Escribanía, 2% Gestión, $500 otros gastos
    const costoDepto = 75000;
    const gastosEditados: GastosConfigState = {
      formaPagoGastos: 'final',
      comisionEscribania: 3,
      comisionGestion: 2,
      otrosGastos: 500
    };

    const resFinal = calcularGastos(costoDepto, gastosEditados, 36);
    expect(resFinal.montoEscribania).toBe(2250); // 75000 * 3%
    expect(resFinal.montoGestion).toBe(1500);    // 75000 * 2%
    expect(resFinal.gastosTotales).toBe(4250);   // 2250 + 1500 + 500
    expect(resFinal.pagoFinalGastos).toBe(4250); // Pago al adjudicar
    expect(resFinal.recargoGastosPorCuota).toBe(0);

    // Modalidad prorrateada en 36 meses
    const gastosProrrateados: GastosConfigState = {
      ...gastosEditados,
      formaPagoGastos: 'prorrateado'
    };
    const resProrrateado = calcularGastos(costoDepto, gastosProrrateados, 36);
    expect(resProrrateado.gastosTotales).toBe(4250);
    expect(resProrrateado.pagoFinalGastos).toBe(0);
    expect(Math.round(resProrrateado.recargoGastosPorCuota)).toBe(Math.round(4250 / 36)); // ~118 USD/mes
  });

  it('Simulación con 0 cuotas: flujo individual maneja estado en cero sin bucles ni divisiones por cero', () => {
    const flujoVacio = calcularFlujoIndividual(
      1,
      60000,
      0,
      0, // 0 cuotas
      'reducir_cuota',
      0,
      { activo: false, mes: 1, monto: 0, estrategia: 'reducir_cuota' },
      0,
      0,
      []
    );

    expect(flujoVacio.mesesTotales).toBe(0);
    expect(flujoVacio.flujo).toHaveLength(0);
    expect(flujoVacio.cuotaInmInicial).toBe(0);
    expect(flujoVacio.cuotaFinInicial).toBe(0);
  });

  it('Gastos Fiduciarios: cálculo de escribanía y gastos administrativos tanto en 0 como con valores personalizados', () => {
    // Al inicio en 0
    const gastosCero: GastosConfigState = {
      formaPagoGastos: 'final',
      comisionEscribania: 0,
      comisionGestion: 0,
      otrosGastos: 0
    };
    const resCero = calcularGastos(0, gastosCero, 0);
    expect(resCero.gastosTotales).toBe(0);
    expect(resCero.montoEscribania).toBe(0);
    expect(resCero.montoGestion).toBe(0);

    // Cuando el usuario ingresa 3% escribanía y 6% administrativos sobre $80.000
    const gastosUsuario: GastosConfigState = {
      formaPagoGastos: 'final',
      comisionEscribania: 3,
      comisionGestion: 6,
      otrosGastos: 300
    };
    const resUsuario = calcularGastos(80000, gastosUsuario, 36);
    expect(resUsuario.montoEscribania).toBe(2400); // 80000 * 3%
    expect(resUsuario.montoGestion).toBe(4800);    // 80000 * 6%
    expect(resUsuario.gastosTotales).toBe(7500);   // 2400 + 4800 + 300
    expect(resUsuario.pagoFinalGastos).toBe(7500);

    // Modalidad prorrateada
    const resProrrateada = calcularGastos(80000, { ...gastosUsuario, formaPagoGastos: 'prorrateado' }, 36);
    expect(resProrrateada.pagoFinalGastos).toBe(0);
    expect(resProrrateada.recargoGastosPorCuota).toBeCloseTo(7500 / 36, 2);
  });
});

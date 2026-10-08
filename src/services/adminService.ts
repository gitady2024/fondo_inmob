import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ParametrosFondoState, GastosConfigState, CesionConfigState, AdelantoConfigState, AjusteCuota } from '../types/fondo';

export interface AdminCuotaRow {
  id: string;
  participacion_id: string;
  fondo_id: string;
  socio_id: string;
  socio_nombre: string;
  socio_unidad: string;
  nro_mes: number;
  monto: number;
  pagado: boolean;
  fecha_vencimiento: string;
  fecha_pago?: string | null;
  estado_calculado: 'pagado' | 'vencido' | 'pendiente';
}

export interface AdminFondoHealth {
  capitalRecaudado: number;
  capitalPendiente: number;
  tasaMorosidadPorcentaje: number;
  montoMorosidad: number;
  cantidadMorosos: number;
  proximasPosesiones: {
    socio_nombre: string;
    socio_unidad: string;
    mes_posesion: number;
    fecha_posesion: string;
    faltan_meses: number;
  }[];
}

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const formatFechaCuotaAdmin = (fechaInicioStr: string, nroMes: number, diaVencimiento: number = 10): string => {
  const [startYear, startMonth] = (fechaInicioStr || '2027-01').split('-').map(Number);
  const targetMonthIndex = (startMonth || 1) - 1 + (nroMes - 1);
  const anio = (startYear || 2027) + Math.floor(targetMonthIndex / 12);
  const mesIndex = targetMonthIndex % 12;
  return `${diaVencimiento} de ${MESES_NOMBRES[mesIndex]}, ${anio}`;
};

/**
 * 1. Obtener fondos pertenecientes al administrador
 */
export const fetchAdminFondos = async (adminId?: string): Promise<any[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    let query = supabase.from('fondos').select('*').order('updated_at', { ascending: false });
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error en fetchAdminFondos:', err);
    return [];
  }
};

/**
 * 2. Obtener participaciones y cuotas asociadas al fondo seleccionado
 */
export const fetchFondoParticipacionesYCuotas = async (
  fondoId: string,
  fechaInicioStr: string = '2027-01'
): Promise<{ cuotas: AdminCuotaRow[]; health: AdminFondoHealth }> => {
  if (isSupabaseConfigured() && fondoId) {
    try {
      // Consultar participaciones del fondo
      const { data: participaciones, error: pError } = await supabase
        .from('participaciones')
        .select('*')
        .eq('fondo_id', fondoId);

      if (pError) throw pError;

      if (participaciones && participaciones.length > 0) {
        const partIds = participaciones.map((p) => p.id);

        // Consultar cuotas asociadas a estas participaciones
        const { data: cuotasDB, error: cError } = await supabase
          .from('cuotas')
          .select('*')
          .in('participacion_id', partIds)
          .order('nro_mes', { ascending: true });

        if (cError) throw cError;

        if (cuotasDB && cuotasDB.length > 0) {
          const partMap = new Map(participaciones.map((p, idx) => [p.id, { p, idx: idx + 1 }]));
          const mesActualReferencia = 3; // Mes de corte para análisis de morosidad

          const mappedCuotas: AdminCuotaRow[] = cuotasDB.map((c) => {
            const pInfo = partMap.get(c.participacion_id);
            const numUnidad = pInfo ? pInfo.idx : 1;
            const esPagado = Boolean(c.pagado);
            const esVencido = !esPagado && c.nro_mes < mesActualReferencia;

            return {
              id: c.id,
              participacion_id: c.participacion_id,
              fondo_id: fondoId,
              socio_id: pInfo?.p.socio_id || 'socio-desconocido',
              socio_nombre: `Socio D${numUnidad}`,
              socio_unidad: `Depto ${numUnidad}`,
              nro_mes: Number(c.nro_mes),
              monto: Number(c.monto),
              pagado: esPagado,
              fecha_vencimiento: formatFechaCuotaAdmin(fechaInicioStr, Number(c.nro_mes)),
              fecha_pago: c.fecha_pago,
              estado_calculado: esPagado ? 'pagado' : esVencido ? 'vencido' : 'pendiente'
            };
          });

          return {
            cuotas: mappedCuotas,
            health: calcularHealthDesdeCuotas(mappedCuotas, participaciones, fechaInicioStr)
          };
        }
      }
    } catch (err) {
      console.warn('Error fetching cuotas reales de Supabase:', err);
    }
  }

  // Fallback simulado para entorno demo o si el fondo aún no tiene cuotas persistidas
  return generarCuotasSimuladasAdmin(fondoId, fechaInicioStr);
};

/**
 * 3. Actualizar estado de pago de una cuota en Supabase
 */
export const togglePagoCuotaEnSupabase = async (
  cuotaId: string,
  nuevoEstado: boolean
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: true }; // Modo local/demo instantáneo
  }

  try {
    const { error } = await supabase
      .from('cuotas')
      .update({
        pagado: nuevoEstado,
        fecha_pago: nuevoEstado ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cuotaId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error al actualizar cuota en Supabase:', err);
    return { success: false, error: err.message || 'Error al persistir pago' };
  }
};

/**
 * 4. Crear y Guardar Fondo completo en Supabase (Puente Simulador -> SaaS)
 */
export const crearYGuardarFondoEnSupabase = async (
  nombre: string,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  anticipos: number[],
  adjudicacionFijada: Record<number, number>,
  cesion: CesionConfigState,
  adelanto: AdelantoConfigState,
  ajustes: AjusteCuota[],
  adminId: string
): Promise<{ success: boolean; fondoId: string; error?: string }> => {
  const fondoId = typeof crypto !== 'undefined' ? crypto.randomUUID() : `fondo-${Date.now()}`;
  const now = new Date().toISOString();

  const parametrosJson = {
    params,
    gastos,
    anticipos,
    adjudicacionFijada,
    cesion,
    adelanto,
    ajustes
  };

  if (isSupabaseConfigured() && adminId) {
    try {
      // 1. INSERT en tabla 'fondos'
      const { error: fondoError } = await supabase.from('fondos').insert({
        id: fondoId,
        nombre,
        parametros_json: parametrosJson,
        admin_id: adminId,
        created_at: now,
        updated_at: now
      });

      if (fondoError) throw fondoError;

      // 2. INSERT masivo en 'participaciones'
      const participacionesPayload = Array.from({ length: params.cantidadDeptos }, (_, i) => ({
        id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `part-${fondoId}-${i + 1}`,
        fondo_id: fondoId,
        socio_id: adminId, // Asignado inicialmente al administrador fiduciario hasta cesión/suscripción
        estado: 'activo',
        created_at: now,
        updated_at: now
      }));

      const { data: insertedParts, error: partError } = await supabase
        .from('participaciones')
        .insert(participacionesPayload)
        .select('id');

      if (partError) throw partError;

      const partIds = insertedParts ? insertedParts.map((p) => p.id) : participacionesPayload.map((p) => p.id);

      // 3. INSERT masivo en 'cuotas'
      const cuotasPayload: any[] = [];
      partIds.forEach((partId, deptoIdx) => {
        const anticipoMes0 = anticipos[deptoIdx] || 0;

        for (let mes = 1; mes <= params.cantidadCuotas; mes++) {
          let cuotaValor = params.valorCuotaBase;
          // Si hubo anticipo con reducción de cuota:
          if (params.modalidadAnticipo === 'reducir_cuota' && anticipoMes0 > 0) {
            const descuentoPorCuota = anticipoMes0 / params.cantidadCuotas;
            cuotaValor = Math.max(0, params.valorCuotaBase - descuentoPorCuota);
          }

          cuotasPayload.push({
            id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `cuota-${partId}-${mes}`,
            participacion_id: partId,
            nro_mes: mes,
            monto: Math.round(cuotaValor),
            pagado: false,
            fecha_pago: null,
            created_at: now,
            updated_at: now
          });
        }
      });

      // Lotes de 500 para inserción masiva segura en Supabase
      const chunkSize = 400;
      for (let i = 0; i < cuotasPayload.length; i += chunkSize) {
        const chunk = cuotasPayload.slice(i, i + chunkSize);
        const { error: cuotaChunkError } = await supabase.from('cuotas').insert(chunk);
        if (cuotaChunkError) throw cuotaChunkError;
      }

      return { success: true, fondoId };
    } catch (err: any) {
      console.warn('Error al persistir fondo completo en Supabase:', err);
      return { success: false, fondoId, error: err.message || 'Error en Supabase' };
    }
  }

  return { success: true, fondoId };
};

// Generador de datos simulados para demo rápida
const generarCuotasSimuladasAdmin = (
  fondoId: string,
  fechaInicioStr: string
): { cuotas: AdminCuotaRow[]; health: AdminFondoHealth } => {
  const cuotas: AdminCuotaRow[] = [];
  const cantidadSocios = 10;
  const mesActual = 4; // Supongamos que estamos en el mes 4 del fondo
  const cuotaBase = 1354000;

  for (let s = 1; s <= cantidadSocios; s++) {
    for (let m = 1; m <= 12; m++) {
      // Simular que hasta el mes 3 casi todos pagaron, pero Socio D3 y D7 deben el mes 2 o 3
      let pagado = false;
      let fechaPago: string | null = null;

      if (m < mesActual) {
        if ((s === 3 && m === 3) || (s === 7 && m === 2) || (s === 7 && m === 3)) {
          pagado = false;
        } else {
          pagado = true;
          fechaPago = formatFechaCuotaAdmin(fechaInicioStr, m, 5);
        }
      }

      const estado: 'pagado' | 'vencido' | 'pendiente' = pagado
        ? 'pagado'
        : m < mesActual
        ? 'vencido'
        : 'pendiente';

      cuotas.push({
        id: `sim-cuota-${s}-${m}`,
        participacion_id: `part-${s}`,
        fondo_id: fondoId,
        socio_id: `socio-${s}`,
        socio_nombre: `Socio D${s}`,
        socio_unidad: `Depto ${s}`,
        nro_mes: m,
        monto: cuotaBase,
        pagado,
        fecha_vencimiento: formatFechaCuotaAdmin(fechaInicioStr, m),
        fecha_pago: fechaPago,
        estado_calculado: estado
      });
    }
  }

  const health = calcularHealthDesdeCuotas(cuotas, null, fechaInicioStr);
  return { cuotas, health };
};

const calcularHealthDesdeCuotas = (
  cuotas: AdminCuotaRow[],
  _participaciones: any[] | null,
  fechaInicioStr: string
): AdminFondoHealth => {
  let capitalRecaudado = 0;
  let capitalPendiente = 0;
  let montoMorosidad = 0;
  const morososSet = new Set<string>();

  cuotas.forEach((c) => {
    if (c.pagado) {
      capitalRecaudado += c.monto;
    } else {
      capitalPendiente += c.monto;
      if (c.estado_calculado === 'vencido') {
        montoMorosidad += c.monto;
        morososSet.add(c.socio_nombre);
      }
    }
  });

  const totalFacturadoEsperado = capitalRecaudado + montoMorosidad;
  const tasaMorosidadPorcentaje =
    totalFacturadoEsperado > 0 ? Number(((montoMorosidad / totalFacturadoEsperado) * 100).toFixed(1)) : 0;

  // Próximas posesiones (cuotas entre mes 4 y 7 por ejemplo)
  const proximasPosesiones = [
    {
      socio_nombre: 'Socio D1',
      socio_unidad: 'Depto 1 (Piso 1A)',
      mes_posesion: 10,
      fecha_posesion: formatFechaCuotaAdmin(fechaInicioStr, 10, 15),
      faltan_meses: 6
    },
    {
      socio_nombre: 'Socio D2',
      socio_unidad: 'Depto 2 (Piso 1B)',
      mes_posesion: 12,
      fecha_posesion: formatFechaCuotaAdmin(fechaInicioStr, 12, 15),
      faltan_meses: 8
    }
  ];

  return {
    capitalRecaudado,
    capitalPendiente,
    tasaMorosidadPorcentaje,
    montoMorosidad,
    cantidadMorosos: morososSet.size,
    proximasPosesiones
  };
};

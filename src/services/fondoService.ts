import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type {
  ParametrosFondoState,
  GastosConfigState,
  CesionConfigState,
  AdelantoConfigState,
  AjusteCuota,
  EstadoPlanFondo,
  FotoAvance,
  DatosNegocioProyecto
} from '../types/fondo';

import type { DatosTecnicosProyecto } from '../types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';

export { type FotoAvance };

export const FOTOS_OBRA_PREDETERMINADAS: FotoAvance[] = [
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=1200&q=80',
    etapa: 'Estructura de Hormigón Armado',
    descripcion: 'Encofrado de columnas y losa con hormigón elaborado H-30 bajo normas IRAM.',
    fecha: 'Última inspección: Octubre 2026'
  },
  {
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    etapa: 'Planos y Fundaciones',
    descripcion: 'Bases y plateas antisísmicas ejecutadas con hormigón de alta resistencia e impermeabilización.',
    fecha: 'Certificado: Agosto 2026'
  },
  {
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    etapa: 'Mampostería y Cerramientos',
    descripcion: 'Doble muro exterior con cámara de aire y barrera térmica para máxima eficiencia energética.',
    fecha: 'En ejecución continua'
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    etapa: 'Render y Proyecto Terminado',
    descripcion: 'Tipologías de 2 y 3 ambientes con balcón terraza, carpintería DVH y cochera opcional.',
    fecha: 'Posesión proyectada según cronograma'
  }
];

export interface FondoGuardado {
  id: string;
  nombre: string;
  descripcion?: string;
  updated_at: string;
  estadoPlan?: EstadoPlanFondo;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  anticipos: number[];
  adjudicacionFijada: Record<number, number>;
  cesion: CesionConfigState;
  adelanto: AdelantoConfigState;
  ajustes?: AjusteCuota[];
  datosTecnicos?: DatosTecnicosProyecto;
  contratoPersonalizado?: string;
  fotos?: FotoAvance[];
  datosNegocio?: DatosNegocioProyecto;
}


const LOCAL_STORAGE_FONDOS_KEY = 'fondo_inmobil_saved_circles';
const CURRENT_FONDO_ID_KEY = 'fondo_inmobil_current_id';

export const PLANTILLAS_PREDEFINIDAS: Omit<FondoGuardado, 'id' | 'updated_at'>[] = [
  {
    nombre: 'Torre Central (10 Deptos • 36 Meses)',
    descripcion: 'Plan fiduciario activo con suscripciones completas y avance de cuotas en marcha.',
    estadoPlan: 'activo',
    params: {
      costoDepto: 75000,
      cantidadDeptos: 10,
      cantidadCuotas: 36,
      valorCuotaBase: 2083,
      fechaInicio: '2027-01',
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 7,
      comisionEscribania: 3,
      otrosGastos: 500
    },
    anticipos: [7500, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    adjudicacionFijada: { 1: 12 },
    cesion: {
      activo: false,
      socioCedente: 3,
      cuotaSalida: 15,
      primaCesion: 10,
      mecanismoSalida: 'tercero'
    },
    adelanto: {
      activo: true,
      socioAdelanta: 1,
      monto: 10000,
      cuota: 10,
      estrategia: 'reducir_cuota'
    },
    ajustes: []
  },
  {
    nombre: 'Residencial Plaza Belgrano (8 Deptos • 24 Meses)',
    descripcion: 'Edificio residencial de escala media con entrega pactada en 24 meses y cuotas de obra al costo.',
    estadoPlan: 'activo',
    params: {
      costoDepto: 60000,
      cantidadDeptos: 8,
      cantidadCuotas: 24,
      valorCuotaBase: 2500,
      fechaInicio: '2027-01',
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 6,
      comisionEscribania: 3,
      otrosGastos: 350
    },
    anticipos: [6000, 0, 0, 0, 0, 0, 0, 0],
    adjudicacionFijada: { 1: 10 },
    cesion: {
      activo: false,
      socioCedente: 1,
      cuotaSalida: 12,
      primaCesion: 10,
      mecanismoSalida: 'tercero'
    },
    adelanto: {
      activo: false,
      socioAdelanta: 1,
      monto: 5000,
      cuota: 8,
      estrategia: 'reducir_cuota'
    },
    ajustes: []
  },
  {
    nombre: 'Complejo Casas del Parque (6 Casas • 36 Meses)',
    descripcion: 'Círculo ágil de viviendas de mayor metraje con amortización en 3 años y gastos prorrateados.',
    estadoPlan: 'activo',
    params: {
      costoDepto: 90000,
      cantidadDeptos: 6,
      cantidadCuotas: 36,
      valorCuotaBase: 2500,
      fechaInicio: '2027-03',
      modalidadAnticipo: 'reducir_plazo'
    },
    gastos: {
      formaPagoGastos: 'prorrateado',
      comisionGestion: 6,
      comisionEscribania: 3,
      otrosGastos: 400
    },
    anticipos: [15000, 10000, 0, 0, 0, 0],
    adjudicacionFijada: { 1: 6, 2: 12 },
    cesion: {
      activo: false,
      socioCedente: 2,
      cuotaSalida: 12,
      primaCesion: 12,
      mecanismoSalida: 'tercero'
    },
    adelanto: {
      activo: false,
      socioAdelanta: 1,
      monto: 15000,
      cuota: 8,
      estrategia: 'acelerar'
    },
    ajustes: []
  },
  {
    nombre: 'Edificio Studio Suites (16 Unidades • 60 Meses)',
    descripcion: 'Microdepartamentos para inversores con cuota accesible financiada a 5 años.',
    estadoPlan: 'activo',
    params: {
      costoDepto: 45000,
      cantidadDeptos: 16,
      cantidadCuotas: 60,
      valorCuotaBase: 750,
      fechaInicio: '2027-06',
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 8,
      comisionEscribania: 3,
      otrosGastos: 300
    },
    anticipos: [4500, 4500, 4500, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    adjudicacionFijada: { 1: 10, 2: 15 },
    cesion: {
      activo: false,
      socioCedente: 4,
      cuotaSalida: 20,
      primaCesion: 15,
      mecanismoSalida: 'preferencia'
    },
    adelanto: {
      activo: false,
      socioAdelanta: 1,
      monto: 5000,
      cuota: 12,
      estrategia: 'reducir_cuota'
    },
    ajustes: []
  }
];

export const esSimulacion = (fondo: {
  nombre?: string;
  estadoPlan?: EstadoPlanFondo;
  params?: Partial<ParametrosFondoState>;
}): boolean => {
  if (fondo.estadoPlan === 'simulacion') return true;
  const nombre = (fondo.nombre || '').trim().toLowerCase();
  if (
    nombre.startsWith('simulación') ||
    nombre.startsWith('simulacion') ||
    nombre.startsWith('nueva simulación') ||
    nombre.startsWith('nueva simulacion') ||
    nombre.includes('laboratorio de simulación') ||
    nombre.includes('laboratorio de simulacion')
  ) {
    return true;
  }
  return false;
};

export const getStoredCurrentFondoId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_FONDO_ID_KEY);
};

export const setStoredCurrentFondoId = (id: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_FONDO_ID_KEY, id);
  }
};

/**
 * Carga sincrónica e instantánea desde LocalStorage (0 ms de espera)
 * Permite inicializar el estado de React en el primer fotograma sin pantallas grises ni demoras
 * Filtra rigurosamente cualquier simulación huérfana para que solo las obras vigentes existan
 */
export const getStoredFondosSync = (): FondoGuardado[] => {
  if (typeof window === 'undefined') {
    return [
      {
        id: 'default',
        updated_at: new Date().toISOString(),
        ...PLANTILLAS_PREDEFINIDAS[0]
      }
    ];
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const parsed: FondoGuardado[] = JSON.parse(raw);
      // Purgar y retornar SOLO obras vigentes (no simulaciones viejas)
      const soloObras = parsed.filter((f) => !esSimulacion(f));
      if (soloObras && soloObras.length > 0) return soloObras;
    }
  } catch {}
  return [
    {
      id: 'default',
      updated_at: new Date().toISOString(),
      ...PLANTILLAS_PREDEFINIDAS[0]
    }
  ];
};

export const getAllFondos = async (): Promise<FondoGuardado[]> => {
  const client = getSupabaseClient();
  let supabaseFondos: FondoGuardado[] = [];

  if (client && isSupabaseConfigured()) {
    try {
      const { data: fondos, error } = await client
        .from('fondos')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (fondos && fondos.length > 0) {
        // Purgar retroactivamente todas las simulaciones que se hayan guardado en Supabase en el pasado
        const simFondoIds = fondos
          .filter((f) => esSimulacion({ nombre: f.nombre, params: { costoDepto: Number(f.costo_depto), cantidadCuotas: f.cantidad_cuotas } }))
          .map((f) => f.id);

        if (simFondoIds.length > 0) {
          try {
            await client.from('socios').delete().in('fondo_id', simFondoIds);
            await client.from('cuotas').delete().in('fondo_id', simFondoIds);
            await client.from('participaciones').delete().in('fondo_id', simFondoIds);
            await client.from('fondos').delete().in('id', simFondoIds);
          } catch (err) {
            console.warn('Purga de simulaciones viejas en Supabase:', err);
          }
        }

        // Quedarse únicamente con los fondos que son verdaderas Obras en Marcha
        const fondosValidos = fondos.filter((f) => !simFondoIds.includes(f.id));

        if (fondosValidos.length > 0) {
          // Optimización masiva: Consultar todos los socios en una sola llamada O(1) en vez de N consultas secuenciales
          const fondoIds = fondosValidos.map((f) => f.id);
          const { data: allSocios } = await client
            .from('socios')
            .select('*')
            .in('fondo_id', fondoIds)
            .order('numero_socio', { ascending: true });

          const sociosByFondo = new Map<string, any[]>();
          allSocios?.forEach((s) => {
            const list = sociosByFondo.get(s.fondo_id) || [];
            list.push(s);
            sociosByFondo.set(s.fondo_id, list);
          });

          for (const f of fondosValidos) {
            const socios = sociosByFondo.get(f.id) || [];
            const anticipos: number[] = [];
            const adjudicacionFijada: Record<number, number> = {};

            socios.forEach((s) => {
              anticipos[s.numero_socio - 1] = Number(s.anticipo_mes0);
              if (s.cuota_posesion_fijada) {
                adjudicacionFijada[s.numero_socio] = s.cuota_posesion_fijada;
              }
            });

            supabaseFondos.push({
              id: f.id,
              nombre: f.nombre,
              descripcion: f.descripcion || '',
              updated_at: f.updated_at,
              estadoPlan: 'activo', // En Supabase solo persisten Obras Activas
              params: {
                costoDepto: Number(f.costo_depto),
                cantidadDeptos: f.cantidad_deptos,
                cantidadCuotas: f.cantidad_cuotas,
                valorCuotaBase: Number(f.valor_cuota_base),
                fechaInicio: f.fecha_inicio ? f.fecha_inicio.slice(0, 7) : '2027-01',
                modalidadAnticipo: f.modalidad_anticipo
              },
              gastos: {
                formaPagoGastos: f.forma_pago_gastos,
                comisionGestion: Number(f.comision_gestion_pct),
                comisionEscribania: Number(f.comision_escribania_pct),
                otrosGastos: Number(f.otros_gastos)
              },
              anticipos,
              adjudicacionFijada,
              cesion: {
                activo: false,
                socioCedente: 3,
                cuotaSalida: 15,
                primaCesion: 10,
                mecanismoSalida: 'tercero'
              },
              adelanto: {
                activo: true,
                socioAdelanta: 1,
                monto: 10000,
                cuota: 10,
                estrategia: 'reducir_cuota'
              },
              ajustes: [],
              fotos: FOTOS_OBRA_PREDETERMINADAS
            });
          }
        }

        if (supabaseFondos.length > 0) {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
            if (raw) {
              const localList: FondoGuardado[] = JSON.parse(raw);
              // Purgar de localList cualquier simulación que haya quedado guardada
              const localLimpio = localList.filter((lf) => !esSimulacion(lf));
              if (localLimpio.length !== localList.length) {
                try {
                  localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(localLimpio));
                } catch {}
              }

              const merged = supabaseFondos.map((sf) => {
                const local = localLimpio.find((l) => l.id === sf.id);
                if (local) {
                  return {
                    ...sf,
                    nombre: local.nombre || sf.nombre,
                    descripcion: local.descripcion || sf.descripcion,
                    estadoPlan: 'activo' as EstadoPlanFondo,
                    params: local.params || sf.params,
                    gastos: local.gastos || sf.gastos,
                    anticipos: (local.anticipos && local.anticipos.length > 0) ? local.anticipos : sf.anticipos,
                    adjudicacionFijada: local.adjudicacionFijada || sf.adjudicacionFijada,
                    datosTecnicos: local.datosTecnicos || sf.datosTecnicos,
                    fotos: local.fotos && local.fotos.length > 0 ? local.fotos : (sf.fotos || FOTOS_OBRA_PREDETERMINADAS),
                    ajustes: local.ajustes && local.ajustes.length > 0 ? local.ajustes : sf.ajustes,
                    contratoPersonalizado: local.contratoPersonalizado || sf.contratoPersonalizado,
                    datosNegocio: local.datosNegocio || sf.datosNegocio
                  };
                }
                return sf;
              });

              // Incluir también los fondos locales que no existan en Supabase y que sean Obras Activas
              const localOnly = localLimpio.filter((lf) => !supabaseFondos.some((sf) => sf.id === lf.id));
              return [...merged, ...localOnly];
            }
          } catch {}
          return supabaseFondos;
        }
      }
    } catch (err) {
      console.warn('Error al cargar fondos de Supabase:', err);
    }
  }

  // Carga desde LocalStorage limpia
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const parsed: FondoGuardado[] = JSON.parse(raw);
      const soloObrasActivas = parsed.filter((f) => !esSimulacion(f));
      if (soloObrasActivas.length > 0) {
        if (soloObrasActivas.length !== parsed.length) {
          try {
            localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(soloObrasActivas));
          } catch {}
        }
        let changed = false;
        const upgraded = soloObrasActivas.map((f) => {
          if (f.nombre.includes('Torre Central') && (f.nombre.includes('48 Meses') || f.params.cantidadCuotas === 48)) {
            changed = true;
            return {
              ...f,
              nombre: 'Torre Central (10 Deptos • 36 Meses)',
              params: {
                ...f.params,
                costoDepto: 75000,
                cantidadCuotas: 36,
                valorCuotaBase: 2083
              },
              anticipos: f.anticipos && f.anticipos[0] === 6500 ? [7500, ...f.anticipos.slice(1)] : f.anticipos,
              ajustes: f.ajustes || []
            };
          }
          return {
            ...f,
            ajustes: f.ajustes || []
          };
        });
        if (changed) {
          try {
            localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(upgraded));
          } catch {}
        }
        return upgraded;
      }
    }
  } catch {}

  // Si no hay fondos guardados, inicializar con las obras predefinidas
  const defaultFondos: FondoGuardado[] = PLANTILLAS_PREDEFINIDAS.map((tpl, i) => ({
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : `default-fondo-${i + 1}`,
    ...tpl,
    updated_at: new Date().toISOString()
  }));

  try {
    localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(defaultFondos));
    setStoredCurrentFondoId(defaultFondos[0].id);
  } catch {}

  return defaultFondos;
};

export const listFondos = async (): Promise<{ id: string; nombre: string; updated_at: string }[]> => {
  const all = await getAllFondos();
  return all.map((f) => ({ id: f.id, nombre: f.nombre, updated_at: f.updated_at }));
};

export const loadFondoById = async (id: string): Promise<FondoGuardado | null> => {
  // Primero buscar en almacenamiento local (0 ms de latencia)
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const list: FondoGuardado[] = JSON.parse(raw);
      const match = list.find((f) => f.id === id);
      if (match) return match;
    }
  } catch {}
  const all = await getAllFondos();
  return all.find((f) => f.id === id) || null;
};

export const saveFondo = async (
  nombre: string,
  params: ParametrosFondoState,
  gastos: GastosConfigState,
  anticipos: number[],
  adjudicacionFijada: Record<number, number>,
  cesion: CesionConfigState,
  adelanto: AdelantoConfigState,
  existenteId?: string,
  descripcion?: string,
  datosTecnicos?: DatosTecnicosProyecto,
  contratoPersonalizado?: string,
  ajustes?: AjusteCuota[],
  estadoPlan?: EstadoPlanFondo,
  fotos?: FotoAvance[],
  datosNegocio?: DatosNegocioProyecto
): Promise<{ id: string; guardadoEn: 'supabase' | 'local' }> => {
  const client = getSupabaseClient();
  const id = existenteId || (typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()));
  const fechaCompleta = `${params.fechaInicio}-01`;
  const updatedAt = new Date().toISOString();

  const esSim = estadoPlan === 'simulacion' || esSimulacion({ nombre, estadoPlan, params });

  // REGLA CRÍTICA: Las simulaciones NO se guardan en la base de datos Supabase
  if (!esSim && client && isSupabaseConfigured()) {
    try {
      const { error: fondoError } = await client.from('fondos').upsert({
        id,
        nombre,
        descripcion: descripcion || '',
        costo_depto: params.costoDepto,
        cantidad_deptos: params.cantidadDeptos,
        cantidad_cuotas: params.cantidadCuotas,
        valor_cuota_base: params.valorCuotaBase,
        fecha_inicio: fechaCompleta,
        modalidad_anticipo: params.modalidadAnticipo,
        forma_pago_gastos: gastos.formaPagoGastos,
        comision_gestion_pct: gastos.comisionGestion,
        comision_escribania_pct: gastos.comisionEscribania,
        otros_gastos: gastos.otrosGastos,
        updated_at: updatedAt
      });

      if (fondoError) throw fondoError;

      const sociosPayload = Array.from({ length: params.cantidadDeptos }, (_, i) => ({
        fondo_id: id,
        numero_socio: i + 1,
        unidad_depto: `Depto ${i + 1}`,
        anticipo_mes0: anticipos[i] || 0,
        cuota_posesion_fijada: adjudicacionFijada[i + 1] || Math.round((params.cantidadCuotas / params.cantidadDeptos) * (i + 1)),
        updated_at: updatedAt
      }));

      await client.from('socios').upsert(sociosPayload, { onConflict: 'fondo_id,numero_socio' });
    } catch (err) {
      console.warn('Error guardando en Supabase, guardando en LocalStorage:', err);
    }
  }

  // Guardado en LocalStorage
  let existingTecnicos: DatosTecnicosProyecto | undefined = undefined;
  let existingContrato: string | undefined = undefined;
  let existingAjustes: AjusteCuota[] | undefined = undefined;
  let existingEstadoPlan: EstadoPlanFondo | undefined = undefined;
  let existingFotos: FotoAvance[] | undefined = undefined;
  let existingNegocio: DatosNegocioProyecto | undefined = undefined;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const list: FondoGuardado[] = JSON.parse(raw);
      const match = list.find((f) => f.id === id);
      if (match?.datosTecnicos) existingTecnicos = match.datosTecnicos;
      if (match?.contratoPersonalizado) existingContrato = match.contratoPersonalizado;
      if (match?.ajustes) existingAjustes = match.ajustes;
      if (match?.estadoPlan) existingEstadoPlan = match.estadoPlan;
      if (match?.fotos) existingFotos = match.fotos;
      if (match?.datosNegocio) existingNegocio = match.datosNegocio;
    }
  } catch {}

  const nuevoFondo: FondoGuardado = {
    id,
    nombre,
    descripcion: descripcion || '',
    updated_at: updatedAt,
    estadoPlan: estadoPlan !== undefined ? estadoPlan : (existingEstadoPlan || 'activo'),
    params: { ...params },
    gastos: {
      formaPagoGastos: gastos.formaPagoGastos || 'final',
      comisionGestion: Number(gastos.comisionGestion) || 0,
      comisionEscribania: Number(gastos.comisionEscribania) || 0,
      otrosGastos: Number(gastos.otrosGastos) || 0
    },
    anticipos,
    adjudicacionFijada,
    cesion,
    adelanto,
    ajustes: ajustes !== undefined ? ajustes : (existingAjustes || []),
    datosTecnicos: datosTecnicos
      ? { ...(existingTecnicos || DATOS_TECNICOS_DEFAULT), ...datosTecnicos }
      : (existingTecnicos || DATOS_TECNICOS_DEFAULT),
    contratoPersonalizado: contratoPersonalizado !== undefined ? contratoPersonalizado : existingContrato,
    fotos: fotos !== undefined ? fotos : (existingFotos || FOTOS_OBRA_PREDETERMINADAS),
    datosNegocio: datosNegocio !== undefined ? datosNegocio : existingNegocio
  };

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    let list: FondoGuardado[] = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((f) => f.id === id);
    if (index >= 0) {
      list[index] = nuevoFondo;
    } else {
      list.unshift(nuevoFondo);
    }
    localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(list));
    setStoredCurrentFondoId(id);
  } catch (e) {
    console.error('Error al guardar en LocalStorage:', e);
  }

  return { id, guardadoEn: isSupabaseConfigured() ? 'supabase' : 'local' };
};

export const crearSimulacionDesdeCero = async (
  nombreCustom?: string,
  baseParams?: {
    costoDepto?: number;
    cantidadDeptos?: number;
    cantidadCuotas?: number;
    fechaInicio?: string;
  }
): Promise<FondoGuardado> => {
  const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now());
  const fechaActual = new Date().toISOString().slice(0, 7);
  const cantidadDeptos = baseParams?.cantidadDeptos || 10;
  const cantidadCuotas = baseParams?.cantidadCuotas !== undefined ? baseParams.cantidadCuotas : 0;
  const costoDepto = baseParams?.costoDepto !== undefined ? baseParams.costoDepto : 0;
  const valorCuotaBase = cantidadCuotas > 0 && costoDepto > 0 ? Math.round(costoDepto / cantidadCuotas) : 0;
  const nombre = nombreCustom || (costoDepto > 0 && cantidadCuotas > 0 ? `Simulación de Plan (${cantidadDeptos} Deptos • ${cantidadCuotas} Meses)` : 'Nueva Simulación de Plan');

  const nuevaSimulacion: FondoGuardado = {
    id,
    nombre,
    descripcion: 'Nueva simulación interactiva iniciada desde cero.',
    updated_at: new Date().toISOString(),
    estadoPlan: 'simulacion',
    params: {
      costoDepto,
      cantidadDeptos,
      cantidadCuotas,
      valorCuotaBase,
      fechaInicio: baseParams?.fechaInicio || fechaActual,
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 0,
      comisionEscribania: 0,
      otrosGastos: 0
    },
    anticipos: new Array(cantidadDeptos).fill(0), // Anticipos estrictamente en 0
    adjudicacionFijada: {},
    cesion: {
      activo: false,
      socioCedente: 1,
      cuotaSalida: 12,
      primaCesion: 0,
      mecanismoSalida: 'tercero'
    },
    adelanto: {
      activo: false,
      socioAdelanta: 1,
      monto: 0,
      cuota: 12,
      estrategia: 'reducir_cuota'
    },
    ajustes: [],
    datosTecnicos: DATOS_TECNICOS_DEFAULT,
    fotos: FOTOS_OBRA_PREDETERMINADAS
  };

  // Guardado SOLO temporal en LocalStorage para la sesión activa actual
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    let list: FondoGuardado[] = raw ? JSON.parse(raw) : [];
    // Mantener las obras activas más esta nueva simulación (reemplazando cualquier simulación previa)
    list = [nuevaSimulacion, ...list.filter((f) => f.id !== id && !esSimulacion(f))];
    localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(list));
    setStoredCurrentFondoId(id);
  } catch (e) {
    console.warn('Error al guardar simulación en LocalStorage:', e);
  }

  // REGLA CRÍTICA: NO se sincroniza en Supabase. Las simulaciones no se guardan en la base de datos.
  return nuevaSimulacion;
};

export const createFondoFromTemplate = async (
  templateIndex: number,
  customName?: string
): Promise<FondoGuardado> => {
  const template = PLANTILLAS_PREDEFINIDAS[templateIndex] || PLANTILLAS_PREDEFINIDAS[0];
  const id = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now());
  const nombre = customName || template.nombre;

  const res = await saveFondo(
    nombre,
    template.params,
    template.gastos,
    [...template.anticipos],
    { ...template.adjudicacionFijada },
    { ...template.cesion },
    { ...template.adelanto },
    id,
    template.descripcion,
    DATOS_TECNICOS_DEFAULT,
    undefined,
    template.ajustes ? [...template.ajustes] : []
  );

  const created = await loadFondoById(res.id);
  return created!;
};

export const duplicateFondo = async (sourceId: string, newName?: string): Promise<FondoGuardado | null> => {
  const original = await loadFondoById(sourceId);
  if (!original) return null;

  const newId = typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now());
  const nombre = newName || `${original.nombre} (Copia)`;

  await saveFondo(
    nombre,
    { ...original.params },
    { ...original.gastos },
    [...original.anticipos],
    { ...original.adjudicacionFijada },
    { ...original.cesion },
    { ...original.adelanto },
    newId,
    original.descripcion,
    original.datosTecnicos ? JSON.parse(JSON.stringify(original.datosTecnicos)) : DATOS_TECNICOS_DEFAULT,
    original.contratoPersonalizado,
    original.ajustes ? JSON.parse(JSON.stringify(original.ajustes)) : []
  );

  return await loadFondoById(newId);
};

export const deleteFondo = async (id: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('socios').delete().eq('fondo_id', id);
      await client.from('cuotas').delete().eq('fondo_id', id);
      await client.from('participaciones').delete().eq('fondo_id', id);
      await client.from('fondos').delete().eq('id', id);
    } catch (e) {
      console.warn('Error al borrar en Supabase:', e);
    }
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (!raw) return false;
    let list: FondoGuardado[] = JSON.parse(raw);
    list = list.filter((f) => f.id !== id);
    localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
};

/**
 * Elimina una simulación temporal de la base de datos (Supabase y LocalStorage) al salir de la misma
 */
export const eliminarSimulacionDeBase = async (id: string): Promise<void> => {
  await deleteFondo(id);
};

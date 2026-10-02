import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type {
  ParametrosFondoState,
  GastosConfigState,
  CesionConfigState,
  AdelantoConfigState,
  AjusteCuota
} from '../types/fondo';

import type { DatosTecnicosProyecto } from '../types/tecnico';
import { DATOS_TECNICOS_DEFAULT } from '../types/tecnico';

export interface FondoGuardado {
  id: string;
  nombre: string;
  descripcion?: string;
  updated_at: string;
  params: ParametrosFondoState;
  gastos: GastosConfigState;
  anticipos: number[];
  adjudicacionFijada: Record<number, number>;
  cesion: CesionConfigState;
  adelanto: AdelantoConfigState;
  ajustes?: AjusteCuota[];
  datosTecnicos?: DatosTecnicosProyecto;
  contratoPersonalizado?: string;
}


const LOCAL_STORAGE_FONDOS_KEY = 'fondo_inmobil_saved_circles';
const CURRENT_FONDO_ID_KEY = 'fondo_inmobil_current_id';

export const PLANTILLAS_PREDEFINIDAS: Omit<FondoGuardado, 'id' | 'updated_at'>[] = [
  {
    nombre: 'Torre Central (10 Deptos • 48 Meses)',
    descripcion: 'Plan estándar balanceado con anticipo inicial del 10% en unidad 1 y gastos al adjudicar.',
    params: {
      costoDepto: 65000,
      cantidadDeptos: 10,
      cantidadCuotas: 48,
      valorCuotaBase: 1354,
      fechaInicio: '2027-01',
      modalidadAnticipo: 'reducir_cuota'
    },
    gastos: {
      formaPagoGastos: 'final',
      comisionGestion: 7,
      comisionEscribania: 3,
      otrosGastos: 500
    },
    anticipos: [6500, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    adjudicacionFijada: { 1: 15 },
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
    nombre: 'Complejo Casas del Parque (6 Casas • 36 Meses)',
    descripcion: 'Círculo ágil de viviendas de mayor metraje con amortización en 3 años y gastos prorrateados.',
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

export const getStoredCurrentFondoId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_FONDO_ID_KEY);
};

export const setStoredCurrentFondoId = (id: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_FONDO_ID_KEY, id);
  }
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
        // Cargar socios para cada fondo
        for (const f of fondos) {
          const { data: socios } = await client
            .from('socios')
            .select('*')
            .eq('fondo_id', f.id)
            .order('numero_socio', { ascending: true });

          const anticipos: number[] = [];
          const adjudicacionFijada: Record<number, number> = {};

          socios?.forEach((s) => {
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
            ajustes: []
          });
        }
        if (supabaseFondos.length > 0) return supabaseFondos;
      }
    } catch (err) {
      console.warn('Error al cargar fondos de Supabase:', err);
    }
  }

  // Carga desde LocalStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const parsed: FondoGuardado[] = JSON.parse(raw);
      if (parsed.length > 0) {
        return parsed.map((f) => ({
          ...f,
          ajustes: f.ajustes || []
        }));
      }
    }
  } catch {}

  // Si no hay fondos guardados, inicializar con la primera plantilla
  const defaultFondo: FondoGuardado = {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'default-fondo-1',
    ...PLANTILLAS_PREDEFINIDAS[0],
    updated_at: new Date().toISOString()
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_FONDOS_KEY, JSON.stringify([defaultFondo]));
    setStoredCurrentFondoId(defaultFondo.id);
  } catch {}

  return [defaultFondo];
};

export const listFondos = async (): Promise<{ id: string; nombre: string; updated_at: string }[]> => {
  const all = await getAllFondos();
  return all.map((f) => ({ id: f.id, nombre: f.nombre, updated_at: f.updated_at }));
};

export const loadFondoById = async (id: string): Promise<FondoGuardado | null> => {
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
  ajustes?: AjusteCuota[]
): Promise<{ id: string; guardadoEn: 'supabase' | 'local' }> => {
  const client = getSupabaseClient();
  const id = existenteId || (typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()));
  const fechaCompleta = `${params.fechaInicio}-01`;
  const updatedAt = new Date().toISOString();

  if (client && isSupabaseConfigured()) {
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
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FONDOS_KEY);
    if (raw) {
      const list: FondoGuardado[] = JSON.parse(raw);
      const match = list.find((f) => f.id === id);
      if (match?.datosTecnicos) existingTecnicos = match.datosTecnicos;
      if (match?.contratoPersonalizado) existingContrato = match.contratoPersonalizado;
      if (match?.ajustes) existingAjustes = match.ajustes;
    }
  } catch {}

  const nuevoFondo: FondoGuardado = {
    id,
    nombre,
    descripcion: descripcion || '',
    updated_at: updatedAt,
    params,
    gastos,
    anticipos,
    adjudicacionFijada,
    cesion,
    adelanto,
    ajustes: ajustes !== undefined ? ajustes : (existingAjustes || []),
    datosTecnicos: datosTecnicos || existingTecnicos || DATOS_TECNICOS_DEFAULT,
    contratoPersonalizado: contratoPersonalizado !== undefined ? contratoPersonalizado : existingContrato
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

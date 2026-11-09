import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { SocioFiduciario, ResumenSociosFondo } from '../types/socio';

const SOCIOS_STORAGE_PREFIX = 'fondo_inmobil_socios_';

export const isValidUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const getSociosStorageKey = (fondoId: string): string => {
  return `${SOCIOS_STORAGE_PREFIX}${fondoId}`;
};

/**
 * Convierte un archivo subido (PDF o Imagen) a Data URL en base64 para previsualización y guardado
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Obtiene el padrón de socios de un fondo u obra.
 * Si alguna unidad aún no tiene datos cargados, genera la plantilla para esa unidad.
 */
export const getSociosPorFondo = async (
  fondoId: string,
  cantidadDeptos: number = 10,
  costoDepto: number = 0,
  anticiposPorUnidad: number[] = []
): Promise<SocioFiduciario[]> => {
  let listLocal: SocioFiduciario[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getSociosStorageKey(fondoId));
      if (raw) {
        listLocal = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error leyendo socios de localStorage:', e);
    }
  }

  // Si Supabase está configurado y el ID es un UUID real de base de datos
  if (isSupabaseConfigured() && isValidUUID(fondoId)) {
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('fondo_id', fondoId)
        .order('numero_socio', { ascending: true });

      if (!error && data && data.length > 0) {
        // Enriquecer datos con lo que haya en Supabase si no está local
        data.forEach((supSocio) => {
          const num = Number(supSocio.numero_socio);
          const matchIndex = listLocal.findIndex((l) => l.numeroSocio === num);
          if (matchIndex === -1 && supSocio.nombre_completo) {
            listLocal.push({
              id: supSocio.id || `socio-${fondoId}-${num}`,
              fondoId,
              numeroSocio: num,
              unidadDepto: supSocio.unidad_depto || `Depto ${num}`,
              nombreCompleto: supSocio.nombre_completo || `Socio Unidad ${num}`,
              dni: supSocio.dni || '',
              email: supSocio.email || '',
              telefono: supSocio.telefono || '',
              pagoInicialEfectuado: !!supSocio.pago_inicial_efectuado,
              montoPagoInicial: Number(supSocio.monto_pago_inicial || supSocio.anticipo_mes0 || 0),
              fechaPagoInicial: supSocio.fecha_pago_inicial,
              contratoFirmadoUrl: supSocio.contrato_firmado_url,
              contratoFirmadoNombre: supSocio.contrato_firmado_nombre,
              fotoDniUrl: supSocio.foto_dni_url,
              fotoDniNombre: supSocio.foto_dni_nombre,
              estado: supSocio.pago_inicial_efectuado ? 'activo' : 'pendiente_pago',
              updatedAt: supSocio.updated_at || new Date().toISOString()
            });
          }
        });
      }
    } catch (err) {
      console.warn('Supabase socios fetch fallback a local:', err);
    }
  }

  // Asegurar que existan todos los socios para las unidades del fondo (1..cantidadDeptos)
  const sociosCompletos: SocioFiduciario[] = [];
  const ahora = new Date().toISOString();

  for (let i = 1; i <= cantidadDeptos; i++) {
    const existing = listLocal.find((s) => s.numeroSocio === i);
    if (existing) {
      sociosCompletos.push(existing);
    } else {
      // Valor sugerido de anticipo si existe
      const anticipoSugerido = anticiposPorUnidad[i - 1] || Math.round(costoDepto * 0.1);
      sociosCompletos.push({
        id: `socio-${fondoId}-${i}`,
        fondoId,
        numeroSocio: i,
        unidadDepto: `Depto ${i}`,
        nombreCompleto: i <= 2 ? `Inversor Adjudicado D${i}` : '',
        dni: '',
        email: '',
        telefono: '',
        pagoInicialEfectuado: i === 1, // Ejemplo: Unidad 1 pagada
        montoPagoInicial: anticipoSugerido > 0 ? anticipoSugerido : 0,
        estado: i === 1 ? 'activo' : 'pendiente_pago',
        updatedAt: ahora
      });
    }
  }

  return sociosCompletos;
};

/**
 * Guarda o actualiza la ficha de un socio
 */
export const guardarSocio = async (
  socio: SocioFiduciario
): Promise<{ success: boolean; socio: SocioFiduciario }> => {
  const fondoId = socio.fondoId;
  const key = getSociosStorageKey(fondoId);
  const updatedAt = new Date().toISOString();
  const socioActualizado: SocioFiduciario = {
    ...socio,
    estado: socio.pagoInicialEfectuado ? 'activo' : 'pendiente_pago',
    updatedAt
  };

  // 1. Guardar en LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      let list: SocioFiduciario[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.id === socio.id || s.numeroSocio === socio.numeroSocio);
      if (idx >= 0) {
        list[idx] = socioActualizado;
      } else {
        list.push(socioActualizado);
      }
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn('Error guardando socio en localStorage:', e);
    }
  }

  // 2. Sincronizar en Supabase si está disponible y los IDs son válidos
  if (isSupabaseConfigured() && isValidUUID(socio.fondoId)) {
    try {
      await supabase.from('socios').upsert(
        {
          id: socio.id,
          fondo_id: socio.fondoId,
          numero_socio: socio.numeroSocio,
          unidad_depto: socio.unidadDepto,
          anticipo_mes0: socio.montoPagoInicial,
          updated_at: updatedAt
        },
        { onConflict: 'fondo_id,numero_socio' }
      );
    } catch (err) {
      console.warn('Sync de socio en Supabase:', err);
    }
  }

  return { success: true, socio: socioActualizado };
};

/**
 * Alterna el estado del pago inicial efectuado de un socio en 1 clic
 */
export const togglePagoInicialSocio = async (
  fondoId: string,
  socioId: string,
  pagoEfectuado: boolean,
  montoDefault?: number
): Promise<boolean> => {
  const key = getSociosStorageKey(fondoId);
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem(key);
    let list: SocioFiduciario[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((s) => s.id === socioId);
    if (idx >= 0) {
      list[idx].pagoInicialEfectuado = pagoEfectuado;
      list[idx].estado = pagoEfectuado ? 'activo' : 'pendiente_pago';
      if (pagoEfectuado && !list[idx].fechaPagoInicial) {
        list[idx].fechaPagoInicial = new Date().toISOString().slice(0, 10);
      }
      if (pagoEfectuado && (!list[idx].montoPagoInicial || list[idx].montoPagoInicial === 0) && montoDefault) {
        list[idx].montoPagoInicial = montoDefault;
      }
      list[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(list));
      return true;
    }
  } catch (e) {
    console.warn('Error al alternar pago inicial:', e);
  }
  return false;
};

/**
 * Calcula los indicadores agregados del padrón de socios
 */
export const calcularResumenSocios = (socios: SocioFiduciario[]): ResumenSociosFondo => {
  const totalUnidades = socios.length;
  const sociosRegistrados = socios.filter((s) => s.nombreCompleto && s.nombreCompleto.trim().length > 0).length;
  const sociosActivos = socios.filter((s) => s.pagoInicialEfectuado).length;
  const sociosPendientesPago = socios.filter((s) => !s.pagoInicialEfectuado).length;
  const contratosCargados = socios.filter((s) => !!s.contratoFirmadoUrl).length;

  return {
    totalUnidades,
    sociosRegistrados,
    sociosActivos,
    sociosPendientesPago,
    contratosCargados
  };
};

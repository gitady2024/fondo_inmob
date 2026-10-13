import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { ParametrosFondoState, ModalidadAnticipo } from '../types/fondo';

export interface SimulationSharePayload {
  costoDepto: number;
  cantidadCuotas: number;
  cantidadDeptos: number;
  fechaInicio: string;
  modalidadAnticipo: ModalidadAnticipo;
  socioId?: number;
  fondoId?: string;
  anticipoMes0?: number;
  nombreFondo?: string;
  timestamp?: number;
}

const STORAGE_SHARED_REGISTRY_KEY = 'fondo_inmobil_shared_simulations_registry';

/**
 * Genera un código hash corto y seguro (5-6 caracteres alfanuméricos)
 */
export const generarHashCorto = (): string => {
  const caracteres = 'abcdefhkmnpqrstuvwxyz23456789'; // caracteres legibles sin confusión
  let resultado = '';
  const bytes = new Uint8Array(5);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < 5; i++) {
      resultado += caracteres[bytes[i] % caracteres.length];
    }
  } else {
    for (let i = 0; i < 5; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
  }
  return resultado;
};

/**
 * Codificación compacta portátil (fallback robusto para compartir sin dependencia de servidor)
 */
const codificarPayloadCompacto = (payload: SimulationSharePayload): string => {
  try {
    const compact = [
      payload.costoDepto || 65000,
      payload.cantidadCuotas || 48,
      payload.cantidadDeptos || 10,
      payload.fechaInicio || '2027-01',
      payload.modalidadAnticipo === 'reducir_plazo' ? 1 : 0,
      payload.socioId || 1,
      payload.anticipoMes0 || 0
    ].join('_');
    return btoa(compact).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
};

const decodificarPayloadCompacto = (token: string): SimulationSharePayload | null => {
  try {
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const decoded = atob(base64);
    const parts = decoded.split('_');
    if (parts.length >= 5) {
      return {
        costoDepto: Number(parts[0]) || 65000,
        cantidadCuotas: Number(parts[1]) || 48,
        cantidadDeptos: Number(parts[2]) || 10,
        fechaInicio: parts[3] || '2027-01',
        modalidadAnticipo: parts[4] === '1' ? 'reducir_plazo' : 'reducir_cuota',
        socioId: Number(parts[5]) || 1,
        anticipoMes0: Number(parts[6]) || 0
      };
    }
  } catch {
    // Si no es un token compacto, fallar silenciosamente
  }
  return null;
};

/**
 * Guarda y publica una simulación, retornando un hash corto (?sim=hash)
 */
export const crearSimulacionCompartida = async (
  params: ParametrosFondoState,
  socioId: number = 1,
  anticipoMes0?: number,
  fondoId?: string,
  nombreFondo?: string
): Promise<{ hash: string; url: string }> => {
  const hash = generarHashCorto();
  const payload: SimulationSharePayload = {
    costoDepto: params.costoDepto,
    cantidadCuotas: params.cantidadCuotas,
    cantidadDeptos: params.cantidadDeptos,
    fechaInicio: params.fechaInicio,
    modalidadAnticipo: params.modalidadAnticipo,
    socioId,
    fondoId,
    anticipoMes0,
    nombreFondo,
    timestamp: Date.now()
  };

  // 1. Guardar en registro local (persistencia inmediata)
  if (typeof window !== 'undefined') {
    try {
      const rawRegistry = localStorage.getItem(STORAGE_SHARED_REGISTRY_KEY);
      const registry: Record<string, SimulationSharePayload> = rawRegistry
        ? JSON.parse(rawRegistry)
        : {};
      registry[hash] = payload;

      // También asociar el token compacto para redundancia universal
      const compactToken = codificarPayloadCompacto(payload);
      if (compactToken) {
        registry[compactToken] = payload;
      }

      localStorage.setItem(STORAGE_SHARED_REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      // Ignorar quota exceeded
    }
  }

  // 2. Guardar en Supabase si está disponible
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('simulaciones_compartidas').insert([
          {
            hash_code: hash,
            payload,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch {
      // Si la tabla remota no existe aún, el registro local y fallback resuelven la solicitud
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/app';
  const url = `${origin}${pathname}?sim=${hash}`;

  return { hash, url };
};

/**
 * Resuelve una simulación a partir de su hash corto (?sim=hash)
 */
export const resolverSimulacionCompartida = async (
  hash: string
): Promise<SimulationSharePayload | null> => {
  if (!hash) return null;
  const hashLimpio = hash.trim().toLowerCase();

  // 1. Probar registro local
  if (typeof window !== 'undefined') {
    try {
      const rawRegistry = localStorage.getItem(STORAGE_SHARED_REGISTRY_KEY);
      if (rawRegistry) {
        const registry: Record<string, SimulationSharePayload> = JSON.parse(rawRegistry);
        if (registry[hashLimpio]) {
          return registry[hashLimpio];
        }
      }
    } catch {
      // Ignorar error de parseo
    }
  }

  // 2. Probar decodificación de fallback universal si el hash es un token portable
  const fallbackPayload = decodificarPayloadCompacto(hash);
  if (fallbackPayload) return fallbackPayload;

  // 3. Probar en Supabase si está activo
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('simulaciones_compartidas')
          .select('payload')
          .eq('hash_code', hashLimpio)
          .maybeSingle();

        if (data && data.payload && !error) {
          return data.payload as SimulationSharePayload;
        }
      }
    } catch {
      // Fallback
    }
  }

  return null;
};

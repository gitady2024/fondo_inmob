import { useEffect, useRef, useCallback } from 'react';
import type { ParametrosFondoState } from '../types/fondo';
import { crearSimulacionCompartida, resolverSimulacionCompartida } from '../services/shareService';

export interface UrlScenarioParams {
  costoDepto?: number;
  cantidadCuotas?: number;
  cantidadDeptos?: number;
  fechaInicio?: string;
  modalidadAnticipo?: 'reducir_cuota' | 'reducir_plazo';
  socioId?: number;
  fondoId?: string;
  role?: 'admin' | 'tecnico' | 'socio';
  simHash?: string;
}

export const parseUrlParams = (searchQuery?: string): UrlScenarioParams => {
  try {
    const rawSearch = searchQuery !== undefined
      ? searchQuery
      : (typeof window !== 'undefined' ? window.location.search : '');

    if (!rawSearch) return {};
    const searchParams = new URLSearchParams(rawSearch);
    const parsed: UrlScenarioParams = {};

    // 1. Soporte prioritario para hash corto limpio (?sim=a8f93)
    const simRaw = searchParams.get('sim');
    if (simRaw) {
      parsed.simHash = simRaw.trim();
    }

    // 2. Compatibilidad con parámetros legibles existentes
    const costoRaw = searchParams.get('monto') || searchParams.get('costo');
    if (costoRaw) {
      const num = parseInt(costoRaw, 10);
      if (!isNaN(num) && num > 0) parsed.costoDepto = num;
    }

    const plazoRaw = searchParams.get('plazo') || searchParams.get('cuotas');
    if (plazoRaw) {
      const num = parseInt(plazoRaw, 10);
      if (!isNaN(num) && num >= 6 && num <= 360) parsed.cantidadCuotas = num;
    }

    const sociosRaw = searchParams.get('socios') || searchParams.get('deptos');
    if (sociosRaw) {
      const num = parseInt(sociosRaw, 10);
      if (!isNaN(num) && num >= 2 && num <= 100) parsed.cantidadDeptos = num;
    }

    const fechaRaw = searchParams.get('inicio');
    if (fechaRaw && /^\d{4}-\d{2}$/.test(fechaRaw)) {
      parsed.fechaInicio = fechaRaw;
    }

    const modRaw = searchParams.get('modalidad');
    if (modRaw === 'reducir_cuota' || modRaw === 'reducir_plazo') {
      parsed.modalidadAnticipo = modRaw;
    }

    const socioRaw = searchParams.get('socio');
    if (socioRaw) {
      const num = parseInt(socioRaw, 10);
      if (!isNaN(num) && num > 0) parsed.socioId = num;
    }

    const fondoRaw = searchParams.get('fondo');
    if (fondoRaw) {
      parsed.fondoId = fondoRaw;
    }

    const roleRaw = searchParams.get('role') || searchParams.get('acceso');
    if (roleRaw === 'admin' || roleRaw === 'tecnico' || roleRaw === 'socio') {
      parsed.role = roleRaw;
    }

    return parsed;
  } catch {
    return {};
  }
};

export const useUrlState = (
  params: ParametrosFondoState,
  socioSeleccionado: number,
  currentFondoId: string,
  onApplyInitialParams?: (initialParams: UrlScenarioParams) => void
) => {
  const isInitialMount = useRef(true);

  // Leer parámetros de URL al montar (y resolver hash corto si está presente)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialFromUrl = parseUrlParams();

      /**
       * Limpiar la URL de parámetros crudos (UUIDs, modalidad, socio, fondo, etc.)
       * Seguridad: nunca exponemos datos internos en la barra de direcciones.
       * Solo mantenemos ?sim=hash cuando es un link compartido legítimo.
       */
      if (typeof window !== 'undefined') {
        const search = window.location.search;
        if (search && search !== '') {
          const hasOnlySimParam =
            initialFromUrl.simHash &&
            new URLSearchParams(search).size === 1;

          try {
            if (hasOnlySimParam) {
              // Mantener solo ?sim=hash — es un link compartido intencional
              // No modificar la URL en este caso
            } else {
              // Limpiar todos los demás parámetros crudos silenciosamente
              const cleanPath = window.location.pathname;
              window.history.replaceState(
                { route: 'app' },
                '',
                cleanPath
              );
            }
          } catch {
            // Ignorar restricciones de seguridad (file://, iframes, etc.)
          }
        }
      }

      // Si viene con un hash corto (?sim=a8f93), resolverlo desde el backend/storage
      if (initialFromUrl.simHash) {
        resolverSimulacionCompartida(initialFromUrl.simHash).then((res) => {
          if (res && onApplyInitialParams) {
            onApplyInitialParams({
              costoDepto: res.costoDepto,
              cantidadCuotas: res.cantidadCuotas,
              cantidadDeptos: res.cantidadDeptos,
              fechaInicio: res.fechaInicio,
              modalidadAnticipo: res.modalidadAnticipo,
              socioId: res.socioId,
              fondoId: res.fondoId
            });
          } else if (Object.keys(initialFromUrl).length > 0 && onApplyInitialParams) {
            onApplyInitialParams(initialFromUrl);
          }
          // Limpiar el ?sim= de la URL una vez resuelto exitosamente
          if (res && typeof window !== 'undefined') {
            try {
              window.history.replaceState({ route: 'app' }, '', window.location.pathname);
            } catch { /* noop */ }
          }
        });
      } else if (Object.keys(initialFromUrl).length > 0 && onApplyInitialParams) {
        onApplyInitialParams(initialFromUrl);
      }
    }
  }, [onApplyInitialParams]);

  // Almacenar el estado en la sesión local en lugar de ensuciar la URL con UUIDs y parámetros crudos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        'fondo_inmobil_active_scenario',
        JSON.stringify({
          costoDepto: params.costoDepto,
          cantidadCuotas: params.cantidadCuotas,
          cantidadDeptos: params.cantidadDeptos,
          fechaInicio: params.fechaInicio,
          modalidadAnticipo: params.modalidadAnticipo,
          socioId: socioSeleccionado,
          fondoId: currentFondoId
        })
      );
    } catch {
      // Ignorar quota exceeded
    }
  }, [params, socioSeleccionado, currentFondoId]);

  // Generador de link seguro para compartir mediante hash corto (?sim=hash)
  const getShareableUrl = useCallback(async (): Promise<string> => {
    if (typeof window === 'undefined') return '';
    try {
      const { url } = await crearSimulacionCompartida(
        params,
        socioSeleccionado,
        Math.round(params.costoDepto * 0.1),
        currentFondoId
      );
      return url;
    } catch {
      return `${window.location.origin}/app`;
    }
  }, [params, socioSeleccionado, currentFondoId]);

  return { getShareableUrl };
};

export default useUrlState;

import { useEffect, useRef, useCallback } from 'react';
import type { ParametrosFondoState } from '../types/fondo';

export interface UrlScenarioParams {
  costoDepto?: number;
  cantidadCuotas?: number;
  cantidadDeptos?: number;
  fechaInicio?: string;
  modalidadAnticipo?: 'reducir_cuota' | 'reducir_plazo';
  socioId?: number;
  fondoId?: string;
  role?: 'admin' | 'tecnico' | 'socio';
}

export const parseUrlParams = (searchQuery?: string): UrlScenarioParams => {
  try {
    const rawSearch = searchQuery !== undefined
      ? searchQuery
      : (typeof window !== 'undefined' ? window.location.search : '');

    if (!rawSearch) return {};
    const searchParams = new URLSearchParams(rawSearch);
    const parsed: UrlScenarioParams = {};

    // Validar monto / costo
    const costoRaw = searchParams.get('monto') || searchParams.get('costo');
    if (costoRaw) {
      const num = parseInt(costoRaw, 10);
      if (!isNaN(num) && num > 0) parsed.costoDepto = num;
    }

    // Validar plazo en cuotas
    const plazoRaw = searchParams.get('plazo') || searchParams.get('cuotas');
    if (plazoRaw) {
      const num = parseInt(plazoRaw, 10);
      if (!isNaN(num) && num >= 6 && num <= 360) parsed.cantidadCuotas = num;
    }

    // Validar socios / unidades
    const sociosRaw = searchParams.get('socios') || searchParams.get('deptos');
    if (sociosRaw) {
      const num = parseInt(sociosRaw, 10);
      if (!isNaN(num) && num >= 2 && num <= 100) parsed.cantidadDeptos = num;
    }

    // Validar fecha inicio
    const fechaRaw = searchParams.get('inicio');
    if (fechaRaw && /^\d{4}-\d{2}$/.test(fechaRaw)) {
      parsed.fechaInicio = fechaRaw;
    }

    // Validar modalidad
    const modRaw = searchParams.get('modalidad');
    if (modRaw === 'reducir_cuota' || modRaw === 'reducir_plazo') {
      parsed.modalidadAnticipo = modRaw;
    }

    // Validar socio seleccionado
    const socioRaw = searchParams.get('socio');
    if (socioRaw) {
      const num = parseInt(socioRaw, 10);
      if (!isNaN(num) && num > 0) parsed.socioId = num;
    }

    // Validar ID de fondo
    const fondoRaw = searchParams.get('fondo');
    if (fondoRaw) {
      parsed.fondoId = fondoRaw;
    }

    // Validar rol de acceso o invitación
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
  const debounceTimerRef = useRef<any>(null);

  // Leer parámetros de URL al montar
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialFromUrl = parseUrlParams();
      if (Object.keys(initialFromUrl).length > 0 && onApplyInitialParams) {
        onApplyInitialParams(initialFromUrl);
      }
    }
  }, [onApplyInitialParams]);

  // Sincronizar hacia la URL al cambiar parámetros (con debounce y replaceState)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const searchParams = new URLSearchParams();

      if (params.costoDepto) searchParams.set('monto', params.costoDepto.toString());
      if (params.cantidadCuotas) searchParams.set('plazo', params.cantidadCuotas.toString());
      if (params.cantidadDeptos) searchParams.set('socios', params.cantidadDeptos.toString());
      if (params.fechaInicio) searchParams.set('inicio', params.fechaInicio);
      if (params.modalidadAnticipo) searchParams.set('modalidad', params.modalidadAnticipo);
      if (socioSeleccionado) searchParams.set('socio', socioSeleccionado.toString());
      if (currentFondoId && currentFondoId !== 'default') searchParams.set('fondo', currentFondoId);

      const queryString = searchParams.toString();
      const newRelativePathQuery = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      if (window.location.search !== `?${queryString}`) {
        window.history.replaceState(null, '', newRelativePathQuery);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [params, socioSeleccionado, currentFondoId]);

  // Generador de link para compartir
  const getShareableUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  return { getShareableUrl };
};

export default useUrlState;

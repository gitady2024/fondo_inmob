import { describe, it, expect } from 'vitest';
import {
  formatFechaCuotaAdmin,
  fetchFondoParticipacionesYCuotas,
  togglePagoCuotaEnSupabase,
  crearYGuardarFondoEnSupabase
} from './adminService';
import { PLANTILLAS_PREDEFINIDAS } from './fondoService';

describe('adminService - Lógica del Backoffice Fiduciario y Supabase', () => {
  it('formatea fechas de cuotas correctamente para administración', () => {
    const fecha = formatFechaCuotaAdmin('2027-01', 1, 10);
    expect(fecha).toBe('10 de Enero, 2027');

    const fechaMes13 = formatFechaCuotaAdmin('2027-01', 13, 10);
    expect(fechaMes13).toBe('10 de Enero, 2028');
  });

  it('obtiene participaciones y calcula indicadores de salud (fallback simulado si no hay Supabase)', async () => {
    const res = await fetchFondoParticipacionesYCuotas('fondo-demo-1', '2027-01');
    expect(res).toBeDefined();
    expect(Array.isArray(res.cuotas)).toBe(true);
    expect(res.cuotas.length).toBeGreaterThan(0);

    // Validar estructura de KPIs
    expect(res.health).toBeDefined();
    expect(typeof res.health.capitalRecaudado).toBe('number');
    expect(typeof res.health.tasaMorosidadPorcentaje).toBe('number');
    expect(Array.isArray(res.health.proximasPosesiones)).toBe(true);
  });

  it('permite alternar estado de pago de cuota (Optimistic/local fallback)', async () => {
    const toggleRes = await togglePagoCuotaEnSupabase('sim-cuota-1-1', true);
    expect(toggleRes.success).toBe(true);
  });

  it('soporta creación y guardado de fondo completo en Supabase o entorno local', async () => {
    const tpl = PLANTILLAS_PREDEFINIDAS[0];
    const res = await crearYGuardarFondoEnSupabase(
      'Fondo Edificio Mitre',
      tpl.params,
      tpl.gastos,
      new Array(tpl.params.cantidadDeptos).fill(0),
      {},
      tpl.cesion,
      tpl.adelanto,
      [],
      'admin-uuid-123'
    );

    expect(res.success).toBe(true);
    expect(res.fondoId).toBeDefined();
  });
});

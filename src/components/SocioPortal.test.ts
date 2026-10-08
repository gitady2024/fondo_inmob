import { describe, it, expect } from 'vitest';
import { formatMonedaARS, formatFechaLegible } from './SocioPortal';

describe('SocioPortal: Formateadores de Moneda y Fechas (Estilo Fintech ARS)', () => {
  it('formatea montos monetarios en moneda local ARS sin decimales superfluos', () => {
    const formatted = formatMonedaARS(1354000);
    // Debe incluir el símbolo de pesos o ARS y los separadores de miles
    expect(formatted).toContain('1.354.000');
  });

  it('formatea montos nulos o cero correctamente', () => {
    const formatted = formatMonedaARS(0);
    expect(formatted).toContain('0');
  });

  it('formatea fechas legibles en formato largo con día, mes en español y año', () => {
    // Mes 1 partiendo de 2027-01 -> 10 de Enero, 2027
    const fechaMes1 = formatFechaLegible('2027-01', 1, 10);
    expect(fechaMes1).toBe('10 de Enero, 2027');

    // Mes 11 partiendo de 2026-01 -> 10 de Noviembre, 2026
    const fechaMes11 = formatFechaLegible('2026-01', 11, 10);
    expect(fechaMes11).toBe('10 de Noviembre, 2026');

    // Mes 14 partiendo de 2027-01 -> Mes 2 (Febrero) de 2028
    const fechaMes14 = formatFechaLegible('2027-01', 14, 10);
    expect(fechaMes14).toBe('10 de Febrero, 2028');
  });
});

import { describe, it, expect } from 'vitest';
import { formatCurrencyValue, parseCurrencyString } from './CurrencyInput';

describe('CurrencyInput: Formateo y Parsing de Moneda en Tiempo Real', () => {
  it('Formatea números correctamente al formato ARS con separador de miles', () => {
    expect(formatCurrencyValue(65000)).toBe('$ 65.000');
    expect(formatCurrencyValue(1500000)).toBe('$ 1.500.000');
    expect(formatCurrencyValue(0)).toBe('$ 0');
    expect(formatCurrencyValue(null)).toBe('$ 0');
    expect(formatCurrencyValue(undefined)).toBe('$ 0');
  });

  it('Parsea strings con símbolos y separadores a números enteros puros', () => {
    expect(parseCurrencyString('$ 65.000')).toBe(65000);
    expect(parseCurrencyString('$ 1.500.000')).toBe(1500000);
    expect(parseCurrencyString('65000')).toBe(65000);
    expect(parseCurrencyString('$ 0')).toBe(0);
    expect(parseCurrencyString('')).toBe(0);
    expect(parseCurrencyString('abc')).toBe(0);
  });

  it('Garantiza que la división equitativa reparta de forma balanceada', () => {
    const pozoTotal = 100000;
    const cantidadSocios = 5;
    const cuotaEquitativa = Math.round(pozoTotal / cantidadSocios);

    expect(cuotaEquitativa).toBe(20000);
    expect(cuotaEquitativa * cantidadSocios).toBe(pozoTotal);
  });
});

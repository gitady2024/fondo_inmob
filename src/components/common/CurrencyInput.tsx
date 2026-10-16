import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  ariaLabel?: string;
}

export const formatCurrencyValue = (val: number | null | undefined, prefix = '$ '): string => {
  if (val === null || val === undefined || isNaN(val)) return `${prefix}0`;
  const rounded = Math.round(val);
  return `${prefix}${rounded.toLocaleString('es-AR')}`;
};

export const parseCurrencyString = (str: string): number => {
  if (!str) return 0;
  // Extraer sólo dígitos numéricos
  const cleanDigits = str.replace(/[^\d]/g, '');
  if (!cleanDigits) return 0;
  const parsed = parseInt(cleanDigits, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  id,
  placeholder = '$ 0',
  className = '',
  disabled = false,
  min = 0,
  max,
  prefix = '$ ',
  ariaLabel
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => formatCurrencyValue(value, prefix));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Mantener sincronizado el texto con el prop value cuando cambie externamente (ej: sliders, presets, resets)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrencyValue(value, prefix));
    }
  }, [value, prefix, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawText = e.target.value;
    
    // Si borró completamente el texto, permitir que quede vacío mientras escribe
    if (!rawText.trim() || rawText === prefix.trim() || rawText === '$') {
      setDisplayValue(prefix);
      onChange(0);
      return;
    }

    const numVal = parseCurrencyString(rawText);
    
    // Validar límite superior si está definido (no limitar min mientras escribe)
    let clampedVal = numVal;
    if (max !== undefined && clampedVal > max) clampedVal = max;

    setDisplayValue(formatCurrencyValue(clampedVal, prefix));
    onChange(clampedVal);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Facilitar la edición seleccionando todo el contenido para sobreescribir inmediatamente
    setTimeout(() => e.target.select(), 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let finalVal = parseCurrencyString(displayValue);
    if (min !== undefined && finalVal < min && finalVal !== 0) {
      finalVal = min;
    }
    setDisplayValue(formatCurrencyValue(finalVal, prefix));
    onChange(finalVal);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={`font-mono font-semibold transition-all outline-none ${className}`}
    />
  );
};

export default CurrencyInput;

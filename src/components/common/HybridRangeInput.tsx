import React from 'react';
import { CurrencyInput } from './CurrencyInput';

interface HybridRangeInputProps {
  label: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  isCurrency?: boolean;
  prefix?: string;
  badge?: React.ReactNode;
  sliderMarks?: { label: string; value: number }[];
  helperText?: string;
  id?: string;
}

export const HybridRangeInput: React.FC<HybridRangeInputProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  isCurrency = false,
  prefix = '$ ',
  badge,
  sliderMarks,
  helperText,
  id
}) => {
  // Asegurar valor dentro de rangos para el slider
  const sliderValue = Math.min(Math.max(value, min), max);
  const percentage = Math.min(Math.max(((sliderValue - min) / (max - min)) * 100, 0), 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    onChange(isNaN(newVal) ? min : newVal);
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 rounded-xl p-3.5 space-y-2.5 transition-all group">
      {/* Label and Badge Row */}
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer">
          {label}
        </label>
        {badge && <div>{badge}</div>}
      </div>

      {/* Main Input Display */}
      <div>
        {isCurrency ? (
          <CurrencyInput
            id={id}
            value={value}
            onChange={onChange}
            prefix={prefix}
            min={0}
            className="w-full bg-slate-950/90 border border-slate-700 group-hover:border-slate-600 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 font-bold font-mono transition-all"
          />
        ) : (
          <div className="relative">
            <input
              id={id}
              type="number"
              min={min}
              max={max}
              step={step}
              value={value || ''}
              onChange={handleNumberInputChange}
              className="w-full bg-slate-950/90 border border-slate-700 group-hover:border-slate-600 focus:border-indigo-500 rounded-lg px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 font-bold font-mono transition-all"
            />
          </div>
        )}
      </div>

      {/* Synchronized Range Slider */}
      <div className="pt-1 space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`
            }}
          />
        </div>

        {/* Min / Max / Custom marks indicator */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-0.5">
          {sliderMarks ? (
            sliderMarks.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(m.value)}
                className="hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {m.label}
              </button>
            ))
          ) : (
            <>
              <span>{isCurrency ? `$ ${(min).toLocaleString('es-AR')}` : min}</span>
              <span className="text-slate-400">{percentage.toFixed(0)}%</span>
              <span>{isCurrency ? `$ ${(max).toLocaleString('es-AR')}` : max}</span>
            </>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 pt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default HybridRangeInput;

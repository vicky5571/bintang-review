'use client';

import React, { useState, useEffect } from 'react';
import { formatRupiahNumber, parseRupiahNumber, formatCompactRupiah, terbilangRupiah } from '@/lib/currency';

interface CurrencyInputProps {
  label?: string;
  required?: boolean;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  helpText?: string;
  presets?: number[];
  showTerbilang?: boolean;
  className?: string;
  disabled?: boolean;
  colorScheme?: 'lime' | 'emerald' | 'amber' | 'indigo' | 'purple' | 'cyan';
}

export function CurrencyInput({
  label,
  required,
  value,
  onChange,
  min = 0,
  max,
  placeholder = '0',
  helpText,
  presets,
  showTerbilang = true,
  className = '',
  disabled = false,
  colorScheme = 'emerald',
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? formatRupiahNumber(value) : ''
  );

  // Sync display string whenever external numerical value changes
  useEffect(() => {
    if (value === 0 && displayValue === '') return;
    setDisplayValue(value ? formatRupiahNumber(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    let numericVal = parseInt(rawDigits, 10);
    if (min !== undefined && numericVal < min) {
      // allow typing lower temporarily, will clamp or display
    }
    if (max !== undefined && numericVal > max) {
      numericVal = max;
    }

    setDisplayValue(formatRupiahNumber(numericVal));
    onChange(numericVal);
  };

  const handleSelectPreset = (presetAmount: number) => {
    setDisplayValue(formatRupiahNumber(presetAmount));
    onChange(presetAmount);
  };

  const focusBorderClasses = {
    lime: 'focus-within:border-[#84cc16] focus-within:ring-lime-500/20',
    emerald: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/20',
    amber: 'focus-within:border-amber-400 focus-within:ring-amber-500/20',
    indigo: 'focus-within:border-indigo-500 focus-within:ring-indigo-500/20',
    purple: 'focus-within:border-purple-500 focus-within:ring-purple-500/20',
    cyan: 'focus-within:border-cyan-500 focus-within:ring-cyan-500/20',
  }[colorScheme];

  const presetActiveClasses = {
    lime: 'bg-lime-50 text-lime-800 border-[#84cc16] font-bold shadow-xs',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-500 font-bold shadow-xs',
    amber: 'bg-amber-50 text-amber-800 border-amber-500 font-bold shadow-xs',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-500 font-bold shadow-xs',
    purple: 'bg-purple-50 text-purple-800 border-purple-500 font-bold shadow-xs',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-500 font-bold shadow-xs',
  }[colorScheme];

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Input container with integrated "Rp" Prefix */}
      <div
        className={`relative flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:ring-2 focus-within:outline-none ${focusBorderClasses} ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''
        }`}
      >
        <div className="flex select-none items-center justify-center rounded-l-xl bg-slate-100/90 px-3 py-2 text-xs font-bold text-slate-500 border-r border-slate-200 shrink-0 tracking-wide">
          Rp
        </div>
        <input
          type="text"
          inputMode="numeric"
          required={required}
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
        />
        {value > 0 && (
          <div className="pr-2.5 text-[10px] font-semibold text-slate-400 select-none shrink-0">
            {formatCompactRupiah(value)}
          </div>
        )}
      </div>

      {/* Option 2: Quick Preset Chips */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2 py-0.5 text-[10px] rounded-lg border transition active:scale-95 ${
                  isSelected
                    ? presetActiveClasses
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Rp {preset.toLocaleString('id-ID')}
              </button>
            );
          })}
        </div>
      )}

      {/* Option 3: Smart Real-time Terbilang Helper */}
      {showTerbilang && value > 0 && (
        <div className="flex items-start gap-1 text-[10px] text-slate-500 italic bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
          <span className="font-semibold text-slate-400 not-italic">Terbilang:</span>
          <span className="text-slate-700 font-medium">{terbilangRupiah(value)}</span>
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-400 mt-0.5">{helpText}</p>}
    </div>
  );
}

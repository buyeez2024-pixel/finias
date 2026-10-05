import React, { useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { COUNTRY_CODES, validatePhoneWithCountry, getCountryConfig, extractRawPhoneAndCountry } from '../../utils/phoneValidation';
import { Smartphone, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface PhoneInputWithCountryProps {
  phoneValue: string;
  countryCode: string;
  onChangePhone: (phone: string) => void;
  onChangeCountryCode: (code: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  showHint?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  phoneValue,
  countryCode,
  onChangePhone,
  onChangeCountryCode,
  label,
  placeholder,
  required = false,
  id,
  showHint = true,
  disabled = false,
  className = '',
}) => {
  const erp = useErp();
  const isLight = erp?.settings?.themeMode === 'light';
  const selectedCountry = useMemo(() => getCountryConfig(countryCode), [countryCode]);

  const validation = useMemo(() => {
    return validatePhoneWithCountry(phoneValue, countryCode, required);
  }, [phoneValue, countryCode, required]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const trimmed = rawInput.trim();

    // If user typed/pasted explicit country prefix (+, 00, or 12-digit 91...)
    if (trimmed.startsWith('+') || trimmed.startsWith('00') || (trimmed.replace(/\D/g, '').length === 12 && trimmed.replace(/\D/g, '').startsWith('91'))) {
      const extracted = extractRawPhoneAndCountry(trimmed, countryCode);
      if (extracted && extracted.countryCode) {
        if (extracted.countryCode !== countryCode) {
          onChangeCountryCode(extracted.countryCode);
        }
        onChangePhone(extracted.rawPhone);
        return;
      }
    }

    onChangePhone(rawInput);
  };

  const handleCountryCodeChange = (newCode: string) => {
    onChangeCountryCode(newCode);
    // If phoneValue currently contains a leading '+' or dial prefix, strip it so it becomes raw
    if (phoneValue && phoneValue.trim().startsWith('+')) {
      const extracted = extractRawPhoneAndCountry(phoneValue.trim(), newCode);
      onChangePhone(extracted.rawPhone);
    }
  };

  return (
    <div className={`space-y-1.5 text-xs ${className}`}>
      {label && (
        <label htmlFor={id} className={`block font-semibold mb-1 flex items-center justify-between ${
          isLight ? 'text-slate-700' : 'text-slate-400'
        }`}>
          <span className="flex items-center gap-1.5 min-w-0">
            <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          {selectedCountry && (
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
              {selectedCountry.flag} {selectedCountry.code}
            </span>
          )}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Country Code Select */}
        <select
          value={countryCode || '+1'}
          onChange={(e) => handleCountryCodeChange(e.target.value)}
          disabled={disabled}
          className={`border rounded-xl px-2 py-2 text-xs font-extrabold focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 max-w-[100px] sm:max-w-[130px] truncate ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              : 'bg-slate-950 border-slate-800 text-white'
          }`}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code + c.iso} value={c.code}>
              {c.flag} {c.code} ({c.iso})
            </option>
          ))}
        </select>

        {/* Phone Input */}
        <div className="relative flex-1 min-w-0">
          <input
            type="tel"
            id={id}
            disabled={disabled}
            placeholder={placeholder || selectedCountry.example}
            value={phoneValue}
            onChange={handlePhoneInputChange}
            className={`w-full border rounded-xl px-3 py-2 pr-8 focus:outline-none font-mono text-xs transition ${
              phoneValue.trim()
                ? validation.isValid
                  ? 'border-emerald-500/60 focus:border-emerald-400 ' + (isLight ? 'bg-white text-slate-900' : 'bg-slate-950 text-white')
                  : 'border-rose-500/80 focus:border-rose-500 ' + (isLight ? 'bg-rose-50 text-rose-900' : 'bg-rose-950/20 text-white')
                : isLight
                ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 placeholder-slate-400'
                : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500 placeholder-slate-500'
            }`}
          />
          {phoneValue.trim() && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {validation.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Hint and Error message */}
      {showHint && (
        <div className="text-[10px] space-y-0.5 pt-0.5">
          {phoneValue.trim() && !validation.isValid ? (
            <p className="text-rose-500 font-medium flex items-center gap-1 animate-fadeIn">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validation.error}</span>
            </p>
          ) : (
            <p className={`font-medium flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <Info className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>
                Format hint for {selectedCountry.flag} {selectedCountry.country}: <strong className="text-indigo-600 dark:text-indigo-300">{selectedCountry.hint}</strong>
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

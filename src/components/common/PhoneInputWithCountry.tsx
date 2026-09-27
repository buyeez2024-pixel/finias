import React, { useMemo } from 'react';
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
  const selectedCountry = useMemo(() => getCountryConfig(countryCode), [countryCode]);

  const validation = useMemo(() => {
    return validatePhoneWithCountry(phoneValue, countryCode, required);
  }, [phoneValue, countryCode, required]);

  // Helper to detect country based on input digits or format
  const detectCountry = React.useCallback((input: string): { countryCode: string; rawPhone: string } | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. If starts with '+', extract using extractRawPhoneAndCountry
    if (trimmed.startsWith('+')) {
      const extracted = extractRawPhoneAndCountry(trimmed);
      if (extracted && extracted.countryCode !== 'OTHER') {
        return extracted;
      }
    }

    // 2. Normalize to digits only, check for leading '00' (IDD prefix)
    let cleanDigits = trimmed.replace(/\D/g, '');
    if (trimmed.startsWith('00')) {
      cleanDigits = cleanDigits.slice(2);
      
      // Sort country codes by descending length of numeric code so we check longer ones first
      const sortedCountries = [...COUNTRY_CODES]
        .filter((c) => c.code !== 'OTHER')
        .map((c) => ({
          ...c,
          numericCode: c.code.replace(/\D/g, ''),
        }))
        .sort((a, b) => b.numericCode.length - a.numericCode.length);

      // Check if starts with numeric country code prefix
      for (const country of sortedCountries) {
        if (cleanDigits.startsWith(country.numericCode)) {
          const remainingDigits = cleanDigits.slice(country.numericCode.length);
          if (remainingDigits.length >= country.minDigits && remainingDigits.length <= country.maxDigits) {
            return {
              countryCode: country.code,
              rawPhone: remainingDigits,
            };
          }
        }
      }
    }

    return null;
  }, []);

  // Continuous smart country code auto-switch effect
  React.useEffect(() => {
    const trimmed = (phoneValue || '').trim();
    if (!trimmed) return;

    const detected = detectCountry(trimmed);
    if (detected) {
      if (detected.countryCode !== countryCode) {
        onChangeCountryCode(detected.countryCode);
        onChangePhone(detected.rawPhone);
      } else {
        // If country code matches but prefix is still in the input, strip it
        const cleanDigits = trimmed.replace(/\D/g, '');
        const numericCode = countryCode.replace(/\D/g, '');
        const country = getCountryConfig(countryCode);
        if (
          numericCode &&
          cleanDigits.startsWith(numericCode) &&
          cleanDigits.length > country.maxDigits &&
          cleanDigits.length === numericCode.length + detected.rawPhone.length
        ) {
          onChangePhone(detected.rawPhone);
        }
      }
    }
  }, [phoneValue, countryCode, onChangeCountryCode, onChangePhone, detectCountry]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const trimmed = rawInput.trim();

    const detected = detectCountry(trimmed);
    if (detected) {
      if (detected.countryCode !== countryCode) {
        onChangeCountryCode(detected.countryCode);
        onChangePhone(detected.rawPhone);
        return;
      } else {
        const cleanDigits = trimmed.replace(/\D/g, '');
        const numericCode = countryCode.replace(/\D/g, '');
        const country = getCountryConfig(countryCode);
        if (
          numericCode &&
          cleanDigits.startsWith(numericCode) &&
          cleanDigits.length > country.maxDigits &&
          cleanDigits.length === numericCode.length + detected.rawPhone.length
        ) {
          onChangePhone(detected.rawPhone);
          return;
        }
      }
    }

    onChangePhone(rawInput);
  };

  return (
    <div className={`space-y-1.5 text-xs ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            <span>{label}</span>
            {required && <span className="text-rose-400">*</span>}
          </span>
          {selectedCountry && (
            <span className="text-[10px] text-indigo-400/90 font-mono font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              {selectedCountry.flag} {selectedCountry.code}
            </span>
          )}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Country Code Select */}
        <select
          value={countryCode || '+1'}
          onChange={(e) => onChangeCountryCode(e.target.value)}
          disabled={disabled}
          className="bg-slate-950 border border-slate-800 text-white rounded-xl px-2.5 py-2 text-xs font-extrabold focus:outline-none focus:border-indigo-500 cursor-pointer shrink-0 max-w-[130px] truncate"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code + c.iso} value={c.code}>
              {c.flag} {c.code} ({c.iso})
            </option>
          ))}
        </select>

        {/* Phone Input */}
        <div className="relative flex-1">
          <input
            type="tel"
            id={id}
            disabled={disabled}
            placeholder={placeholder || selectedCountry.example}
            value={phoneValue}
            onChange={handlePhoneInputChange}
            className={`w-full bg-slate-950 border rounded-xl px-3 py-2 pr-8 text-white focus:outline-none font-mono text-xs transition ${
              phoneValue.trim()
                ? validation.isValid
                  ? 'border-emerald-500/60 focus:border-emerald-400'
                  : 'border-rose-500/80 focus:border-rose-500 bg-rose-950/10'
                : 'border-slate-800 focus:border-indigo-500'
            }`}
          />
          {phoneValue.trim() && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {validation.isValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Hint and Error message */}
      {showHint && (
        <div className="text-[10px] space-y-0.5 pt-0.5">
          {phoneValue.trim() && !validation.isValid ? (
            <p className="text-rose-400 font-medium flex items-center gap-1 animate-fadeIn">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validation.error}</span>
            </p>
          ) : (
            <p className="text-slate-400 font-medium flex items-center gap-1">
              <Info className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="text-slate-300">
                Format hint for {selectedCountry.flag} {selectedCountry.country}: <strong className="text-indigo-300">{selectedCountry.hint}</strong>
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

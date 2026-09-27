/**
 * Utility functions and definitions for validating and formatting phone / mobile numbers 
 * with country code awareness across the entire application.
 */

export interface CountryCodeConfig {
  code: string;
  country: string;
  flag: string;
  iso: string;
  minDigits: number;
  maxDigits: number;
  regex?: RegExp;
  example: string;
  hint: string;
}

export const COUNTRY_CODES: CountryCodeConfig[] = [
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸', iso: 'US', minDigits: 10, maxDigits: 10, regex: /^[2-9]\d{2}[2-9]\d{6}$/, example: '555-019-2834', hint: 'Enter 10 digits e.g. 555-019-2834' },
  { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN', minDigits: 10, maxDigits: 10, regex: /^[6-9]\d{9}$/, example: '9876543210', hint: 'Enter 10 digits starting with 6, 7, 8, or 9 e.g. 9876543210' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB', minDigits: 10, maxDigits: 11, regex: /^(?:7\d{9}|[123789]\d{9,10})$/, example: '7911123456', hint: 'Enter 10-11 digits starting with 7 for mobile' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU', minDigits: 9, maxDigits: 9, regex: /^4\d{8}$/, example: '412345678', hint: 'Enter 9 digits starting with 4 e.g. 412345678' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', iso: 'AE', minDigits: 9, maxDigits: 9, regex: /^5\d{8}$/, example: '501234567', hint: 'Enter 9 digits starting with 5 e.g. 501234567' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA', minDigits: 9, maxDigits: 9, regex: /^5\d{8}$/, example: '501234567', hint: 'Enter 9 digits starting with 5 e.g. 501234567' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', iso: 'PK', minDigits: 10, maxDigits: 10, regex: /^3\d{9}$/, example: '3001234567', hint: 'Enter 10 digits starting with 3 e.g. 3001234567' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', iso: 'BD', minDigits: 10, maxDigits: 10, regex: /^1[3-9]\d{8}$/, example: '1712345678', hint: 'Enter 10 digits starting with 1 e.g. 1712345678' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', iso: 'MY', minDigits: 9, maxDigits: 10, regex: /^1\d{8,9}$/, example: '123456789', hint: 'Enter 9-10 digits starting with 1 e.g. 123456789' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG', minDigits: 8, maxDigits: 8, regex: /^[89]\d{7}$/, example: '81234567', hint: 'Enter 8 digits starting with 8 or 9 e.g. 81234567' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', iso: 'DE', minDigits: 10, maxDigits: 11, example: '1701234567', hint: 'Enter 10-11 digits e.g. 1701234567' },
  { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR', minDigits: 9, maxDigits: 9, regex: /^[67]\d{8}$/, example: '612345678', hint: 'Enter 9 digits starting with 6 or 7 e.g. 612345678' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', iso: 'ZA', minDigits: 9, maxDigits: 9, regex: /^[678]\d{8}$/, example: '712345678', hint: 'Enter 9 digits starting with 6, 7, or 8 e.g. 712345678' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬', iso: 'NG', minDigits: 10, maxDigits: 10, regex: /^[789][01]\d{8}$/, example: '8031234567', hint: 'Enter 10 digits starting with 7, 8, or 9 e.g. 8031234567' },
  { code: 'OTHER', country: 'International (+Other)', flag: '🌐', iso: 'INT', minDigits: 7, maxDigits: 15, example: '1234567890', hint: 'Enter 7-15 digits for international number' },
];

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  hint?: string;
  country?: CountryCodeConfig;
}

/**
 * Helper to find country configuration by code or ISO string.
 */
export function getCountryConfig(countryCodeOrIso: string): CountryCodeConfig {
  const match = COUNTRY_CODES.find(
    (c) => c.code === countryCodeOrIso || c.iso.toLowerCase() === countryCodeOrIso.toLowerCase()
  );
  return match || COUNTRY_CODES[0]; // default to +1 US
}

export function extractRawPhoneAndCountry(phone: string, defaultCountryCode: string = '+1'): { rawPhone: string; countryCode: string } {
  let trimmed = (phone || '').trim();
  if (!trimmed) return { rawPhone: '', countryCode: defaultCountryCode };

  // If phone starts with '+', try matching known country codes
  if (trimmed.startsWith('+')) {
    const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const country of sortedCountries) {
      if (country.code !== 'OTHER' && trimmed.startsWith(country.code)) {
        const raw = trimmed.slice(country.code.length).trim();
        return { rawPhone: raw, countryCode: country.code };
      }
    }
  }

  return { rawPhone: trimmed, countryCode: defaultCountryCode };
}

/**
 * Validates a mobile/phone number string against a specific country code format.
 */
export function validatePhoneWithCountry(
  phone: string,
  countryCode: string = '+1',
  required: boolean = false
): PhoneValidationResult {
  const trimmed = (phone || '').trim();

  // Extract raw phone if country code is prepended (e.g. "+1 5125550199")
  let targetPhone = trimmed;
  let targetCountryCode = countryCode;

  if (trimmed.startsWith('+')) {
    const extracted = extractRawPhoneAndCountry(trimmed, countryCode);
    targetPhone = extracted.rawPhone;
    targetCountryCode = extracted.countryCode;

    if (targetCountryCode !== countryCode) {
      const actualCountry = getCountryConfig(targetCountryCode);
      const selectedCountry = getCountryConfig(countryCode);
      return {
        isValid: false,
        error: `Number starts with ${actualCountry.code} (${actualCountry.country}), but selected country code is ${selectedCountry.code} (${selectedCountry.country}). Please select ${actualCountry.code}.`,
        hint: actualCountry.hint,
        country: selectedCountry,
      };
    }
  }

  const country = getCountryConfig(targetCountryCode);

  if (!targetPhone) {
    if (required) {
      return {
        isValid: false,
        error: 'Phone/Mobile number is required.',
        hint: country.hint,
        country,
      };
    }
    return { isValid: true, hint: country.hint, country };
  }

  // Extract digits only from raw number
  const digitsOnly = targetPhone.replace(/\D/g, '');

  if (digitsOnly.length < country.minDigits) {
    return {
      isValid: false,
      error: `Number is too short for ${country.country} (${country.code}). Minimum ${country.minDigits} digits required.`,
      hint: country.hint,
      country,
    };
  }

  if (digitsOnly.length > country.maxDigits) {
    return {
      isValid: false,
      error: `Number is too long for ${country.country} (${country.code}). Maximum ${country.maxDigits} digits allowed.`,
      hint: country.hint,
      country,
    };
  }

  return { isValid: true, hint: country.hint, country };
}

/**
 * General fallback validator for generic phone strings.
 */
export function validatePhoneNumber(phone: string, required: boolean = false): PhoneValidationResult {
  const trimmed = (phone || '').trim();
  if (trimmed.startsWith('+')) {
    const { countryCode } = extractRawPhoneAndCountry(trimmed, '+1');
    return validatePhoneWithCountry(trimmed, countryCode, required);
  }
  return validatePhoneWithCountry(trimmed, '+1', required);
}

export function sanitizePhoneNumber(phone: string): string {
  return (phone || '').trim();
}

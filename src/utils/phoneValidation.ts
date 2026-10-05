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
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸', iso: 'US', minDigits: 10, maxDigits: 10, regex: /^[2-9]\d{9}$/, example: '555-019-2834', hint: 'Enter 10 digits e.g. 555-019-2834' },
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

export function extractRawPhoneAndCountry(
  phone: string,
  defaultCountryCode: string = '+1'
): { rawPhone: string; countryCode: string } {
  let trimmed = (phone || '').trim();
  if (!trimmed) return { rawPhone: '', countryCode: defaultCountryCode };

  // 1. If phone starts with '+', try matching known country codes (longest code first)
  if (trimmed.startsWith('+')) {
    const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const country of sortedCountries) {
      if (country.code !== 'OTHER' && trimmed.startsWith(country.code)) {
        let raw = trimmed.slice(country.code.length).trim();
        // Strip leading non-alphanumeric separators like - / ( ) .
        raw = raw.replace(/^[\s\-()./]+/, '');
        return { rawPhone: raw, countryCode: country.code };
      }
    }
  }

  // 2. If phone starts with '00' international prefix
  if (trimmed.startsWith('00')) {
    const withoutZeroes = '+' + trimmed.slice(2);
    const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const country of sortedCountries) {
      if (country.code !== 'OTHER' && withoutZeroes.startsWith(country.code)) {
        let raw = withoutZeroes.slice(country.code.length).trim();
        raw = raw.replace(/^[\s\-()./]+/, '');
        return { rawPhone: raw, countryCode: country.code };
      }
    }
  }

  // 3. Extract digits only for prefix detection
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 4. Detect 12-digit Indian format starting with 91 (e.g. 918220038826)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91') && /^[6-9]/.test(digitsOnly.slice(2))) {
    return { rawPhone: digitsOnly.slice(2), countryCode: '+91' };
  }

  // 5. Detect 11-digit Indian format starting with 0 (e.g. 09876543210)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0') && /^[6-9]/.test(digitsOnly.slice(1))) {
    return { rawPhone: digitsOnly.slice(1), countryCode: '+91' };
  }

  // 6. Detect 11-digit UK format starting with 44 (e.g. 447911123456)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('44')) {
    return { rawPhone: digitsOnly.slice(2), countryCode: '+44' };
  }

  // 7. Detect 11-digit UK mobile starting with 07 (e.g. 07911123456)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) {
    return { rawPhone: digitsOnly.slice(1), countryCode: '+44' };
  }

  // 8. Detect 11-digit US format starting with 1 (e.g. 15550192834)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1') && /^[2-9]/.test(digitsOnly.slice(1))) {
    return { rawPhone: digitsOnly.slice(1), countryCode: '+1' };
  }

  // 9. If digitsOnly is 10 digits starting with 6, 7, 8, 9
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly) && defaultCountryCode === '+91') {
    return { rawPhone: digitsOnly, countryCode: '+91' };
  }

  // If defaultCountryCode is provided and not default +1, respect it
  return { rawPhone: trimmed, countryCode: defaultCountryCode };
}

/**
 * Resolves the appropriate country dial code for a contact based on its explicit properties,
 * phone format, country name, or system settings fallback.
 */
export function resolveCountryCodeFromContact(
  contact: any,
  fallbackDefaultCode: string = '+1'
): string {
  if (!contact) return fallbackDefaultCode;

  // 1. Explicit countryCode property on contact (TOP PRIORITY - user selected code)
  if (contact.countryCode && contact.countryCode !== 'OTHER') {
    const found = COUNTRY_CODES.find((c) => c.code === contact.countryCode);
    if (found) return found.code;
  }

  // 2. If explicit phone has dial code prefix '+...' (e.g. "+91 9876543210")
  if (contact.phone && typeof contact.phone === 'string' && contact.phone.trim().startsWith('+')) {
    const extracted = extractRawPhoneAndCountry(contact.phone.trim(), fallbackDefaultCode);
    if (extracted.countryCode && extracted.countryCode !== 'OTHER') {
      return extracted.countryCode;
    }
  }

  // 3. Detect from phone pattern digits
  if (contact.phone && typeof contact.phone === 'string') {
    const digitsOnly = contact.phone.replace(/\D/g, '');
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return '+91';
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0') && /^[6-9]/.test(digitsOnly.slice(1))) return '+91';
    if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly) && fallbackDefaultCode === '+91') return '+91';
    if (digitsOnly.length === 12 && digitsOnly.startsWith('44')) return '+44';
    if (digitsOnly.length === 11 && digitsOnly.startsWith('07')) return '+44';
  }

  // 4. Detect from country name / string in contact (e.g. "India", "United States", "UK")
  const countryName = contact.country || contact.countryName;
  if (countryName && typeof countryName === 'string') {
    const lower = countryName.toLowerCase().trim();
    if (lower === 'india' || lower === 'in') return '+91';
    if (lower === 'united states' || lower === 'us' || lower === 'usa' || lower === 'canada') return '+1';
    if (lower === 'united kingdom' || lower === 'uk' || lower === 'great britain' || lower === 'gb') return '+44';
    if (lower === 'australia' || lower === 'au') return '+61';
    if (lower === 'uae' || lower === 'united arab emirates' || lower === 'ae' || lower === 'dubai') return '+971';
    if (lower === 'saudi arabia' || lower === 'saudi' || lower === 'sa') return '+966';
    if (lower === 'pakistan' || lower === 'pk') return '+92';
    if (lower === 'bangladesh' || lower === 'bd') return '+880';
    if (lower === 'malaysia' || lower === 'my') return '+60';
    if (lower === 'singapore' || lower === 'sg') return '+65';
    if (lower === 'germany' || lower === 'de') return '+49';
    if (lower === 'france' || lower === 'fr') return '+33';
    if (lower === 'south africa' || lower === 'za') return '+27';
    if (lower === 'nigeria' || lower === 'ng') return '+234';

    const matched = COUNTRY_CODES.find(
      (c) =>
        c.country.toLowerCase().includes(lower) ||
        lower.includes(c.country.toLowerCase()) ||
        c.iso.toLowerCase() === lower
    );
    if (matched) return matched.code;
  }

  return fallbackDefaultCode;
}

/**
 * Checks whether two phone numbers refer to the same contact by comparing their significant digits.
 */
export function isDuplicatePhone(phoneA?: string, phoneB?: string): boolean {
  if (!phoneA || !phoneB) return false;
  const digitsA = phoneA.replace(/\D/g, '');
  const digitsB = phoneB.replace(/\D/g, '');
  if (digitsA.length < 7 || digitsB.length < 7) return false;
  // Compare up to the last 10 significant digits
  const minLen = Math.min(digitsA.length, digitsB.length, 10);
  const endA = digitsA.slice(-minLen);
  const endB = digitsB.slice(-minLen);
  return endA === endB;
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

  // Extract raw phone if country code is prepended (e.g. "+91 8220038826" or "+1 5125550199")
  let targetPhone = trimmed;
  let targetCountryCode = countryCode;

  if (trimmed.startsWith('+') || trimmed.startsWith('00') || (trimmed.replace(/\D/g, '').length === 12 && trimmed.replace(/\D/g, '').startsWith('91'))) {
    const extracted = extractRawPhoneAndCountry(trimmed, countryCode);
    targetPhone = extracted.rawPhone;
    targetCountryCode = extracted.countryCode;

    if (targetCountryCode !== countryCode) {
      const actualCountry = getCountryConfig(targetCountryCode);
      const selectedCountry = getCountryConfig(countryCode);
      return {
        isValid: false,
        error: `Input prefix matches ${actualCountry.country} (${actualCountry.code}), but country code is set to ${selectedCountry.code} (${selectedCountry.country}). Please select ${actualCountry.code} or adjust input.`,
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
        error: 'Primary Mobile / Phone Number is required.',
        hint: country.hint,
        country,
      };
    }
    return { isValid: true, hint: country.hint, country };
  }

  // Extract digits only from raw number
  let digitsOnly = targetPhone.replace(/\D/g, '');

  // If US/Canada (+1) and user entered 11 digits starting with 1, normalize by removing leading 1
  if (country.code === '+1' && digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    digitsOnly = digitsOnly.slice(1);
  }

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

  // Verify against country-specific regex pattern if configured
  if (country.regex && !country.regex.test(digitsOnly)) {
    return {
      isValid: false,
      error: `Invalid number format for ${country.country} (${country.code}). ${country.hint}`,
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

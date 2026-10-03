/**
 * Royal POS & ERP - Centralized Strict Input Validation Engine
 * 
 * Philosophy: "Validate & Reject" (Positive Whitelisting)
 * - Validates input against strict schemas (Type, Length, Format, Regex, Range, Enum)
 * - Immediately rejects malformed or invalid inputs with human-readable error messages
 * - Prevents database corruption, calculations with NaN, and injection vulnerabilities
 */

import { validateEmail as baseValidateEmail } from './formatters';
import { validatePhoneWithCountry, extractRawPhoneAndCountry } from './phoneValidation';

export interface FieldValidationRule<T = any> {
  required?: boolean;
  requiredMessage?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integerOnly?: boolean;
  allowNegative?: boolean;
  allowZero?: boolean;
  precision?: number;
  pattern?: RegExp;
  patternMessage?: string;
  allowedValues?: any[];
  custom?: (value: T, allValues?: any) => string | null | undefined;
  label?: string;
}

export type SchemaDefinition<T extends Record<string, any>> = {
  [K in keyof T]?: FieldValidationRule<T[K]>;
};

export interface ValidationResult<T = Record<string, any>> {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
  firstErrorField?: string;
  sanitizedValues?: Partial<T>;
}

// ============================================================================
// CORE ATOMIC FIELD VALIDATORS
// ============================================================================

/**
 * Validate a string value against length, pattern, and custom rules
 */
export function validateString(
  value: any,
  rule: FieldValidationRule<string> = {}
): { isValid: boolean; error?: string } {
  const label = rule.label || 'Field';
  
  if (value === undefined || value === null || String(value).trim() === '') {
    if (rule.required) {
      return { isValid: false, error: rule.requiredMessage || `${label} is required.` };
    }
    return { isValid: true };
  }

  const str = String(value).trim();

  if (rule.minLength !== undefined && str.length < rule.minLength) {
    return {
      isValid: false,
      error: `${label} must be at least ${rule.minLength} characters long (currently ${str.length}).`,
    };
  }

  if (rule.maxLength !== undefined && str.length > rule.maxLength) {
    return {
      isValid: false,
      error: `${label} cannot exceed ${rule.maxLength} characters (currently ${str.length}).`,
    };
  }

  if (rule.pattern && !rule.pattern.test(str)) {
    return {
      isValid: false,
      error: rule.patternMessage || `${label} has an invalid format.`,
    };
  }

  if (rule.allowedValues && rule.allowedValues.length > 0) {
    if (!rule.allowedValues.includes(str)) {
      return {
        isValid: false,
        error: `${label} must be one of: ${rule.allowedValues.join(', ')}.`,
      };
    }
  }

  if (rule.custom) {
    const customErr = rule.custom(str);
    if (customErr) {
      return { isValid: false, error: customErr };
    }
  }

  return { isValid: true };
}

/**
 * Validate a numeric value against range, integer requirement, and precision
 */
export function validateNumber(
  value: any,
  rule: FieldValidationRule<number> = {}
): { isValid: boolean; error?: string; parsedValue?: number } {
  const label = rule.label || 'Value';

  if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
    if (rule.required) {
      return { isValid: false, error: rule.requiredMessage || `${label} is required.` };
    }
    return { isValid: true, parsedValue: undefined };
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, error: `${label} must be a valid finite number.` };
  }

  if (rule.allowNegative === false && num < 0) {
    return { isValid: false, error: `${label} cannot be negative.` };
  }

  if (rule.allowZero === false && num === 0) {
    return { isValid: false, error: `${label} cannot be zero.` };
  }

  if (rule.integerOnly && !Number.isInteger(num)) {
    return { isValid: false, error: `${label} must be a whole integer.` };
  }

  if (rule.min !== undefined && num < rule.min) {
    return { isValid: false, error: `${label} cannot be less than ${rule.min}.` };
  }

  if (rule.max !== undefined && num > rule.max) {
    return { isValid: false, error: `${label} cannot be greater than ${rule.max}.` };
  }

  if (rule.precision !== undefined) {
    const parts = String(value).split('.');
    if (parts.length > 1 && parts[1].length > rule.precision) {
      return {
        isValid: false,
        error: `${label} allows a maximum of ${rule.precision} decimal places.`,
      };
    }
  }

  if (rule.custom) {
    const customErr = rule.custom(num);
    if (customErr) {
      return { isValid: false, error: customErr };
    }
  }

  return { isValid: true, parsedValue: num };
}

/**
 * Validate Email address with RFC format
 */
export function validateEmailField(
  email: any,
  options: { required?: boolean; label?: string } = {}
): { isValid: boolean; error?: string } {
  const label = options.label || 'Email address';
  const str = String(email || '').trim();

  if (!str) {
    if (options.required) {
      return { isValid: false, error: `${label} is required.` };
    }
    return { isValid: true };
  }

  if (str.length > 120) {
    return { isValid: false, error: `${label} cannot exceed 120 characters.` };
  }

  if (!baseValidateEmail(str)) {
    return { isValid: false, error: `Please enter a valid ${label.toLowerCase()} (e.g. name@domain.com).` };
  }

  return { isValid: true };
}

/**
 * Validate Phone Number with country code validation
 */
export function validatePhoneField(
  phone: any,
  countryCode: string = '+1',
  options: { required?: boolean; label?: string } = {}
): { isValid: boolean; error?: string } {
  const label = options.label || 'Phone number';
  const str = String(phone || '').trim();

  if (!str) {
    if (options.required) {
      return { isValid: false, error: `${label} is required.` };
    }
    return { isValid: true };
  }

  const res = validatePhoneWithCountry(str, countryCode);
  if (!res.isValid) {
    return { isValid: false, error: res.error || `Invalid ${label.toLowerCase()} format.` };
  }

  return { isValid: true };
}

/**
 * Validate SKU / Barcode code format
 */
export function validateSkuField(
  sku: any,
  options: { required?: boolean; label?: string } = {}
): { isValid: boolean; error?: string } {
  const label = options.label || 'SKU / Barcode';
  const str = String(sku || '').trim();

  if (!str) {
    if (options.required) {
      return { isValid: false, error: `${label} is required.` };
    }
    return { isValid: true };
  }

  if (str.length < 2 || str.length > 64) {
    return { isValid: false, error: `${label} must be between 2 and 64 characters.` };
  }

  // Allow alphanumeric, underscores, hyphens, slashes, dots
  const validSkuRegex = /^[a-zA-Z0-9_\-./#]+$/;
  if (!validSkuRegex.test(str)) {
    return {
      isValid: false,
      error: `${label} can only contain letters, numbers, hyphens, dots, slashes, and underscores.`,
    };
  }

  return { isValid: true };
}

/**
 * Validate Date string
 */
export function validateDateField(
  dateValue: any,
  options: { required?: boolean; label?: string; minDate?: Date; maxDate?: Date } = {}
): { isValid: boolean; error?: string } {
  const label = options.label || 'Date';
  if (!dateValue) {
    if (options.required) {
      return { isValid: false, error: `${label} is required.` };
    }
    return { isValid: true };
  }

  const d = new Date(dateValue);
  if (isNaN(d.getTime())) {
    return { isValid: false, error: `${label} must be a valid date.` };
  }

  if (options.minDate && d < options.minDate) {
    return { isValid: false, error: `${label} cannot be earlier than ${options.minDate.toISOString().split('T')[0]}.` };
  }

  if (options.maxDate && d > options.maxDate) {
    return { isValid: false, error: `${label} cannot be later than ${options.maxDate.toISOString().split('T')[0]}.` };
  }

  return { isValid: true };
}

// ============================================================================
// GENERIC SCHEMA RUNNER
// ============================================================================

/**
 * Runs a schema definition against an arbitrary data object
 */
export function validateSchema<T extends Record<string, any>>(
  data: T,
  schema: SchemaDefinition<T>
): ValidationResult<T> {
  const errors: Record<string, string> = {};

  for (const [key, rule] of Object.entries(schema) as [keyof T, FieldValidationRule][]) {
    if (!rule) continue;
    const val = data[key];

    // Custom overarching rule first
    if (rule.custom) {
      const customMsg = rule.custom(val, data);
      if (customMsg) {
        errors[String(key)] = customMsg;
        continue;
      }
    }

    // Number rule
    if (rule.min !== undefined || rule.max !== undefined || rule.precision !== undefined || rule.integerOnly || rule.allowNegative !== undefined) {
      const numRes = validateNumber(val, rule);
      if (!numRes.isValid && numRes.error) {
        errors[String(key)] = numRes.error;
      }
      continue;
    }

    // String rule
    const strRes = validateString(val, rule);
    if (!strRes.isValid && strRes.error) {
      errors[String(key)] = strRes.error;
    }
  }

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;

  return {
    isValid,
    errors,
    firstError: isValid ? undefined : errors[errorKeys[0]],
    firstErrorField: isValid ? undefined : errorKeys[0],
  };
}

// ============================================================================
// DOMAIN-SPECIFIC STRICT SCHEMAS & VALIDATION HANDLERS
// ============================================================================

/**
 * 1. CONTACT FORM VALIDATOR (Customer / Supplier / Both)
 * 
 * Rules:
 * - Basic: Name (2-100 chars, required), Mobile (valid country phone, required), Contact Type (required)
 * - GST / TAX Number: Mandatory for 'supplier' and 'both' (5-35 alphanumeric chars). Format-validated for customer if entered.
 * - Address & Geographical Details: ALL fields are MANDATORY:
 *   - Street Address (min 3 chars, max 250 chars, required)
 *   - Zip / Postal Code (3-12 alphanumeric chars, required)
 *   - City (2-80 chars, required)
 *   - Province / District (2-80 chars, required)
 *   - State / Region (2-80 chars, required)
 *   - Country (required)
 * - Non-mandatory fields: strictly format & range validated if provided.
 */
export function validateContactData(data: {
  name: string;
  contactType?: string;
  mobile?: string;
  alternatePhone?: string;
  email?: string;
  taxNumber?: string;
  openingBalance?: number | string;
  advanceBalance?: number | string;
  creditLimit?: number | string;
  address?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  zipcode?: string;
  businessName?: string;
  notes?: string;
  countryCode?: string;
  altCountryCode?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Name: 2-100 characters, required
  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 100,
    label: 'Contact Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  // 2. Contact Type: required, one of 'customer', 'supplier', 'both'
  const isSupplierOrBoth = data.contactType === 'supplier' || data.contactType === 'both';
  const typeRes = validateString(data.contactType, {
    required: true,
    allowedValues: ['customer', 'supplier', 'both'],
    requiredMessage: 'Please select a valid Contact Type (Customer, Supplier, or Both).',
    label: 'Contact Type',
  });
  if (!typeRes.isValid && typeRes.error) errors.contactType = typeRes.error;

  // 3. Mobile Number: required, valid format with country code
  const phoneRes = validatePhoneField(data.mobile, data.countryCode || '+1', {
    required: true,
    label: 'Primary Phone Number',
  });
  if (!phoneRes.isValid && phoneRes.error) errors.mobile = phoneRes.error;

  // 4. Alternate Phone: optional, but strictly validated if provided
  if (data.alternatePhone && data.alternatePhone.trim()) {
    const altPhoneRes = validatePhoneField(data.alternatePhone, data.altCountryCode || '+1', {
      required: false,
      label: 'Alternate Phone Number',
    });
    if (!altPhoneRes.isValid && altPhoneRes.error) errors.alternatePhone = altPhoneRes.error;
  }

  // 5. Email: optional, but must be strictly RFC format if provided
  if (data.email && data.email.trim() && data.email.trim().toUpperCase() !== 'N/A') {
    const emailRes = validateEmailField(data.email, {
      required: false,
      label: 'Email Address',
    });
    if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;
  }

  // 6. GST / Tax Number: MANDATORY if supplier or both; strictly validated format for all
  const taxClean = (data.taxNumber || '').trim();
  if (isSupplierOrBoth) {
    if (!taxClean) {
      errors.taxNumber = 'GST / TAX Number is mandatory for suppliers.';
    } else if (taxClean.length < 5 || taxClean.length > 35) {
      errors.taxNumber = 'GST / TAX Number must be between 5 and 35 characters.';
    } else if (!/^[a-zA-Z0-9\-_./]+$/.test(taxClean)) {
      errors.taxNumber = 'GST / TAX Number must be alphanumeric (letters, numbers, hyphens, slashes).';
    }
  } else if (taxClean) {
    if (taxClean.length < 4 || taxClean.length > 35) {
      errors.taxNumber = 'GST / TAX Number must be between 4 and 35 characters.';
    } else if (!/^[a-zA-Z0-9\-_./]+$/.test(taxClean)) {
      errors.taxNumber = 'GST / TAX Number must be alphanumeric (letters, numbers, hyphens, slashes).';
    }
  }

  // 7. Business Name (if provided)
  if (data.businessName && data.businessName.trim()) {
    const bRes = validateString(data.businessName, {
      minLength: 2,
      maxLength: 120,
      label: 'Business Name',
    });
    if (!bRes.isValid && bRes.error) errors.businessName = bRes.error;
  }

  // 8. Opening Balance (must be valid finite number)
  if (data.openingBalance !== undefined && data.openingBalance !== '') {
    const balRes = validateNumber(data.openingBalance, {
      label: 'Opening Balance',
    });
    if (!balRes.isValid && balRes.error) errors.openingBalance = balRes.error;
  }

  // 9. Advance Balance (must be valid non-negative number)
  if (data.advanceBalance !== undefined && data.advanceBalance !== '') {
    const advRes = validateNumber(data.advanceBalance, {
      min: 0,
      allowNegative: false,
      label: 'Advance Balance',
    });
    if (!advRes.isValid && advRes.error) errors.advanceBalance = advRes.error;
  }

  // 10. Credit Limit (must be valid non-negative number)
  if (data.creditLimit !== undefined && data.creditLimit !== '') {
    const creditRes = validateNumber(data.creditLimit, {
      min: 0,
      allowNegative: false,
      label: 'Credit Limit',
    });
    if (!creditRes.isValid && creditRes.error) errors.creditLimit = creditRes.error;
  }

  // =========================================================================
  // MANDATORY SECTION: Address & Geographical Details
  // =========================================================================

  // Street Address: MANDATORY (min 3 chars, max 250 chars)
  const streetAddr = (data.address || data.addressLine1 || '').trim();
  const addrRes = validateString(streetAddr, {
    required: true,
    minLength: 3,
    maxLength: 250,
    requiredMessage: 'Street Address is mandatory. Please enter a valid address.',
    label: 'Street Address',
  });
  if (!addrRes.isValid && addrRes.error) errors.address = addrRes.error;

  // Zip / Postal Code: MANDATORY (3-12 alphanumeric/digits)
  const rawZip = (data.zipcode || data.zipCode || '').trim();
  const zipRes = validateString(rawZip, {
    required: true,
    minLength: 3,
    maxLength: 12,
    pattern: /^[a-zA-Z0-9\s\-]+$/,
    patternMessage: 'Postal / Zip code must contain only letters, numbers, hyphens, and spaces.',
    requiredMessage: 'Zip / Postal Code is mandatory. Please enter a valid code.',
    label: 'Zip / Postal Code',
  });
  if (!zipRes.isValid && zipRes.error) errors.zipcode = zipRes.error;

  // City: MANDATORY (2-80 chars)
  const rawCity = (data.city || '').trim();
  const cityRes = validateString(rawCity, {
    required: true,
    minLength: 2,
    maxLength: 80,
    requiredMessage: 'City is mandatory. Please enter the city name.',
    label: 'City',
  });
  if (!cityRes.isValid && cityRes.error) errors.city = cityRes.error;

  // Province / District: MANDATORY (2-80 chars)
  const rawProvince = (data.province || '').trim();
  const provRes = validateString(rawProvince, {
    required: true,
    minLength: 2,
    maxLength: 80,
    requiredMessage: 'Province / District is mandatory. Please enter province or district.',
    label: 'Province / District',
  });
  if (!provRes.isValid && provRes.error) errors.province = provRes.error;

  // State / Region: MANDATORY (2-80 chars)
  const rawState = (data.state || '').trim();
  const stateRes = validateString(rawState, {
    required: true,
    minLength: 2,
    maxLength: 80,
    requiredMessage: 'State / Region is mandatory. Please enter state or region.',
    label: 'State / Region',
  });
  if (!stateRes.isValid && stateRes.error) errors.state = stateRes.error;

  // Country: MANDATORY
  const rawCountry = (data.country || '').trim();
  const countryRes = validateString(rawCountry, {
    required: true,
    minLength: 2,
    maxLength: 80,
    requiredMessage: 'Country is mandatory. Please select or enter a country.',
    label: 'Country',
  });
  if (!countryRes.isValid && countryRes.error) errors.country = countryRes.error;

  // Notes (if provided, max 500 chars)
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes cannot exceed 500 characters.';
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 2. PRODUCT FORM VALIDATOR (Single, Variable, Combo)
 */
export function validateProductData(data: {
  name: string;
  sku?: string;
  type?: 'single' | 'variable' | 'combo';
  unit?: string;
  costPrice?: number | string;
  sellingPrice?: number | string;
  alertQuantity?: number | string;
  taxRate?: number | string;
  category?: string;
  brand?: string;
  variations?: Array<{
    name: string;
    sku: string;
    purchasePrice?: number | string;
    sellingPrice?: number | string;
  }>;
}): ValidationResult {
  const errors: Record<string, string> = {};

  // Product Name
  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 150,
    label: 'Product Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  // SKU
  if (data.sku) {
    const skuRes = validateSkuField(data.sku, {
      required: true,
      label: 'SKU / Barcode',
    });
    if (!skuRes.isValid && skuRes.error) errors.sku = skuRes.error;
  }

  // Unit
  const unitRes = validateString(data.unit, {
    required: true,
    minLength: 1,
    maxLength: 40,
    label: 'Unit of Measure',
  });
  if (!unitRes.isValid && unitRes.error) errors.unit = unitRes.error;

  // Cost Price (Single Product)
  if (data.type !== 'variable') {
    const costRes = validateNumber(data.costPrice, {
      required: true,
      min: 0,
      allowNegative: false,
      precision: 4,
      label: 'Purchase / Cost Price',
    });
    if (!costRes.isValid && costRes.error) errors.costPrice = costRes.error;

    // Selling Price
    const sellRes = validateNumber(data.sellingPrice, {
      required: true,
      min: 0,
      allowNegative: false,
      precision: 4,
      label: 'Selling Price',
    });
    if (!sellRes.isValid && sellRes.error) errors.sellingPrice = sellRes.error;
  }

  // Alert Quantity
  if (data.alertQuantity !== undefined && data.alertQuantity !== '') {
    const alertRes = validateNumber(data.alertQuantity, {
      min: 0,
      allowNegative: false,
      label: 'Alert Quantity',
    });
    if (!alertRes.isValid && alertRes.error) errors.alertQuantity = alertRes.error;
  }

  // Tax Rate
  if (data.taxRate !== undefined && data.taxRate !== '') {
    const taxRes = validateNumber(data.taxRate, {
      min: 0,
      max: 100,
      allowNegative: false,
      label: 'Applicable Tax Rate',
    });
    if (!taxRes.isValid && taxRes.error) errors.taxRate = taxRes.error;
  }

  // Variations validation
  if (data.type === 'variable') {
    if (!data.variations || data.variations.length === 0) {
      errors.variations = 'At least one variation must be defined for a variable product.';
    } else {
      data.variations.forEach((v, idx) => {
        if (!v.name || v.name.trim() === '') {
          errors[`variation_${idx}_name`] = `Variation #${idx + 1} requires a valid value/name.`;
        }
        if (!v.sku || v.sku.trim() === '') {
          errors[`variation_${idx}_sku`] = `Variation #${idx + 1} requires a unique SKU.`;
        }
        const vSell = Number(v.sellingPrice ?? 0);
        if (isNaN(vSell) || vSell < 0) {
          errors[`variation_${idx}_sellingPrice`] = `Variation #${idx + 1} selling price must be >= 0.`;
        }
      });
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 3. SALE & POS CHECKOUT VALIDATOR
 */
export function validateSaleData(data: {
  customerId?: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  discountAmount?: number;
  discountType?: 'fixed' | 'percentage';
  paymentAmount?: number;
  subtotal?: number;
  paymentMethod?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.customerId || data.customerId.trim() === '') {
    errors.customerId = 'A customer must be selected for this sale.';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'Cart is empty. Add at least one product item.';
  } else {
    data.items.forEach((item, idx) => {
      if (!item.productId) {
        errors[`item_${idx}_product`] = `Item #${idx + 1} is missing product reference.`;
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        errors[`item_${idx}_quantity`] = `Item #${idx + 1} quantity must be greater than 0.`;
      }
      if (typeof item.unitPrice !== 'number' || isNaN(item.unitPrice) || item.unitPrice < 0) {
        errors[`item_${idx}_unitPrice`] = `Item #${idx + 1} unit price cannot be negative.`;
      }
    });
  }

  // Discount validation
  if (data.discountAmount !== undefined && data.discountAmount > 0) {
    if (data.discountType === 'percentage' && data.discountAmount > 100) {
      errors.discountAmount = 'Percentage discount cannot exceed 100%.';
    }
    if (data.discountType === 'fixed' && data.subtotal && data.discountAmount > data.subtotal) {
      errors.discountAmount = 'Fixed discount cannot exceed the sale subtotal.';
    }
  }

  // Payment amount
  if (data.paymentAmount !== undefined) {
    const payRes = validateNumber(data.paymentAmount, {
      min: 0,
      allowNegative: false,
      label: 'Payment Amount',
    });
    if (!payRes.isValid && payRes.error) errors.paymentAmount = payRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 4. PURCHASE ORDER / INWARD STOCK VALIDATOR
 */
export function validatePurchaseData(data: {
  supplierId: string;
  purchaseDate?: string;
  items: Array<{ productId: string; quantity: number; unitCost: number }>;
  paymentAmount?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.supplierId || data.supplierId.trim() === '') {
    errors.supplierId = 'A supplier must be selected.';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'Add at least one item to this purchase order.';
  } else {
    data.items.forEach((item, idx) => {
      if (!item.productId) {
        errors[`item_${idx}_product`] = `Purchase item #${idx + 1} has no product selected.`;
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        errors[`item_${idx}_quantity`] = `Item #${idx + 1} quantity must be greater than 0.`;
      }
      if (typeof item.unitCost !== 'number' || isNaN(item.unitCost) || item.unitCost < 0) {
        errors[`item_${idx}_unitCost`] = `Item #${idx + 1} purchase cost cannot be negative.`;
      }
    });
  }

  if (data.purchaseDate) {
    const dRes = validateDateField(data.purchaseDate, { label: 'Purchase Date' });
    if (!dRes.isValid && dRes.error) errors.purchaseDate = dRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 5. EXPENSE RECORD VALIDATOR
 */
export function validateExpenseData(data: {
  categoryId?: string;
  amount: number | string;
  expenseDate?: string;
  title?: string;
  refNo?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.categoryId || data.categoryId.trim() === '') {
    errors.categoryId = 'Please select an expense category.';
  }

  const amtRes = validateNumber(data.amount, {
    required: true,
    min: 0.01,
    allowZero: false,
    allowNegative: false,
    label: 'Expense Amount',
  });
  if (!amtRes.isValid && amtRes.error) errors.amount = amtRes.error;

  if (data.title && data.title.length > 150) {
    errors.title = 'Expense title/note cannot exceed 150 characters.';
  }

  if (data.expenseDate) {
    const dRes = validateDateField(data.expenseDate, { label: 'Expense Date' });
    if (!dRes.isValid && dRes.error) errors.expenseDate = dRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 6. FULL NAME & USER ACCOUNT VALIDATORS
 */
export function validateFullName(name: string): { isValid: boolean; error?: string } {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Full Name is required.' };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Full Name must contain only alphabetic letters (A-Z, a-z) and spaces. Numbers, symbols, and special characters are not allowed.',
    };
  }
  if (trimmed.length < 4) {
    return {
      isValid: false,
      error: 'Full Name must be at least 4 alphabetic characters long.',
    };
  }
  return { isValid: true };
}

export function validateUserData(data: {
  username: string;
  email: string;
  fullName?: string;
  password?: string;
  role: string;
  pin?: string;
  isNewUser?: boolean;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.fullName !== undefined) {
    const fnRes = validateFullName(data.fullName);
    if (!fnRes.isValid && fnRes.error) {
      errors.fullName = fnRes.error;
    }
  }

  // Username: Minimum 8 chars, alphanumeric + special characters
  const trimmedUser = (data.username || '').trim();
  if (!trimmedUser) {
    errors.username = 'Username is required.';
  } else if (trimmedUser.length < 8) {
    errors.username = 'Username must be at least 8 characters long (contains alphanumeric & special characters).';
  } else if (!/^[A-Za-z0-9@_#\.\-\$!]+$/.test(trimmedUser)) {
    errors.username = 'Username can only contain alphanumeric characters and allowed special symbols (@, _, ., -, #, !, $).';
  }

  // Email
  const emailRes = validateEmailField(data.email, {
    required: true,
    label: 'Email',
  });
  if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;

  // Password (if new user or being updated)
  if (data.isNewUser || (data.password && data.password.length > 0)) {
    if (!data.password || data.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    } else if (data.password.length > 64) {
      errors.password = 'Password cannot exceed 64 characters.';
    }
  }

  // Role
  const roleRes = validateString(data.role, {
    required: true,
    minLength: 2,
    maxLength: 40,
    label: 'User Role',
  });
  if (!roleRes.isValid && roleRes.error) errors.role = roleRes.error;

  // PIN
  if (data.pin) {
    const pinStr = String(data.pin).trim();
    if (!/^\d{4,8}$/.test(pinStr)) {
      errors.pin = 'Security PIN must be 4 to 8 digits.';
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 7. SIMPLE MASTER ENTITY VALIDATOR (Category, Brand, Unit, Rack, Warranty)
 */
export function validateMasterEntityData(data: {
  name: string;
  shortName?: string;
  code?: string;
  entityLabel?: string;
}): ValidationResult {
  const label = data.entityLabel || 'Name';
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 1,
    maxLength: 80,
    label,
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  if (data.shortName && data.shortName.length > 30) {
    errors.shortName = 'Short code cannot exceed 30 characters.';
  }

  if (data.code && data.code.length > 30) {
    errors.code = 'Code cannot exceed 30 characters.';
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 8. STOCK TRANSFER VALIDATOR
 */
export function validateStockTransferData(data: {
  fromLocationId: string;
  toLocationId: string;
  transferDate?: string;
  items: Array<{ productId: string; quantity: number }>;
  status?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fromLocationId || data.fromLocationId.trim() === '') {
    errors.fromLocationId = 'Source (Dispatch) location is required.';
  }

  if (!data.toLocationId || data.toLocationId.trim() === '') {
    errors.toLocationId = 'Destination (Receiving) location is required.';
  }

  if (data.fromLocationId && data.toLocationId && data.fromLocationId === data.toLocationId) {
    errors.toLocationId = 'Source and destination locations cannot be the same.';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'Please add at least one product item to transfer.';
  } else {
    data.items.forEach((item, idx) => {
      if (!item.productId) {
        errors[`item_${idx}_product`] = `Item #${idx + 1} has no product selected.`;
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        errors[`item_${idx}_quantity`] = `Item #${idx + 1} transfer quantity must be greater than 0.`;
      }
    });
  }

  if (data.transferDate) {
    const dRes = validateDateField(data.transferDate, { label: 'Transfer Date' });
    if (!dRes.isValid && dRes.error) errors.transferDate = dRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 9. STOCK ADJUSTMENT VALIDATOR
 */
export function validateStockAdjustmentData(data: {
  locationId: string;
  adjustmentDate?: string;
  adjustmentType?: 'increase' | 'decrease' | 'normal' | 'abnormal';
  reason?: string;
  items: Array<{ productId: string; quantity: number; unitCost?: number }>;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.locationId || data.locationId.trim() === '') {
    errors.locationId = 'Location must be selected.';
  }

  if (!data.reason || data.reason.trim() === '') {
    errors.reason = 'Reason for adjustment is mandatory.';
  } else if (data.reason.length > 200) {
    errors.reason = 'Reason cannot exceed 200 characters.';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'Please select at least one product to adjust.';
  } else {
    data.items.forEach((item, idx) => {
      if (!item.productId) {
        errors[`item_${idx}_product`] = `Item #${idx + 1} has no product selected.`;
      }
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        errors[`item_${idx}_quantity`] = `Item #${idx + 1} adjustment quantity must be greater than 0.`;
      }
    });
  }

  if (data.adjustmentDate) {
    const dRes = validateDateField(data.adjustmentDate, { label: 'Adjustment Date' });
    if (!dRes.isValid && dRes.error) errors.adjustmentDate = dRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 10. UNIT OF MEASUREMENT VALIDATOR
 */
export function validateUnitData(data: {
  name: string;
  shortName: string;
  allowDecimal?: boolean;
  baseUnitMultiplier?: number | string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 1,
    maxLength: 50,
    label: 'Unit Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  const shortRes = validateString(data.shortName, {
    required: true,
    minLength: 1,
    maxLength: 15,
    label: 'Short Code / Symbol',
  });
  if (!shortRes.isValid && shortRes.error) errors.shortName = shortRes.error;

  if (data.baseUnitMultiplier !== undefined && data.baseUnitMultiplier !== '') {
    const multRes = validateNumber(data.baseUnitMultiplier, {
      min: 0.0001,
      allowZero: false,
      allowNegative: false,
      label: 'Base Multiplier',
    });
    if (!multRes.isValid && multRes.error) errors.baseUnitMultiplier = multRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 11. WARRANTY SPECIFICATION VALIDATOR
 */
export function validateWarrantyData(data: {
  name: string;
  duration: number | string;
  durationType?: 'days' | 'months' | 'years';
  description?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 80,
    label: 'Warranty Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  const durRes = validateNumber(data.duration, {
    required: true,
    min: 1,
    integerOnly: true,
    label: 'Warranty Period / Duration',
  });
  if (!durRes.isValid && durRes.error) errors.duration = durRes.error;

  if (data.description && data.description.length > 300) {
    errors.description = 'Description cannot exceed 300 characters.';
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 12. BUSINESS PROFILE & SETTINGS VALIDATOR
 */
export function validateBusinessProfileData(data: {
  businessName: string;
  currency?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const trimmedName = data.businessName ? data.businessName.trim() : '';
  if (trimmedName.length < 8 || !/^[A-Za-z\s]+$/.test(trimmedName)) {
    errors.businessName = 'Business name must contain only alphabets and spaces (minimum 8 characters).';
  }

  if (data.email && data.email.trim() !== '') {
    const emailRes = validateEmailField(data.email, { label: 'Business Email' });
    if (!emailRes.isValid && emailRes.error) errors.email = emailRes.error;
  }

  if (data.phone && data.phone.trim() !== '') {
    if (!/^\+?[\d\s\-()]{7,20}$/.test(data.phone.trim())) {
      errors.phone = 'Please enter a valid business phone number.';
    }
  }

  if (data.taxNumber && data.taxNumber.length > 40) {
    errors.taxNumber = 'Tax / GST Number cannot exceed 40 characters.';
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 13. TAX RULE VALIDATOR
 */
export function validateTaxRuleData(data: {
  name: string;
  rate: number | string;
  taxType?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 60,
    label: 'Tax Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  const rateRes = validateNumber(data.rate, {
    required: true,
    min: 0,
    max: 100,
    label: 'Tax Rate (%)',
  });
  if (!rateRes.isValid && rateRes.error) errors.rate = rateRes.error;

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 14. PRINTER CONFIGURATION VALIDATOR
 */
export function validatePrinterData(data: {
  name: string;
  connectionType: 'network' | 'usb' | 'windows' | 'browser';
  ipAddress?: string;
  port?: number | string;
  path?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 50,
    label: 'Printer Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  if (data.connectionType === 'network') {
    if (!data.ipAddress || !/^(\d{1,3}\.){3}\d{1,3}$/.test(data.ipAddress.trim())) {
      errors.ipAddress = 'Please enter a valid IP address for network printer.';
    }
    if (data.port !== undefined && data.port !== '') {
      const portNum = Number(data.port);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        errors.port = 'Port must be between 1 and 65535.';
      }
    }
  } else if (data.connectionType === 'usb' || data.connectionType === 'windows') {
    if (!data.path || data.path.trim() === '') {
      errors.path = 'Printer path / device name is required.';
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 15. PAYMENT ACCOUNT VALIDATOR
 */
export function validatePaymentAccountData(data: {
  name: string;
  accountNumber?: string;
  bankName?: string;
  openingBalance?: number | string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  const nameRes = validateString(data.name, {
    required: true,
    minLength: 2,
    maxLength: 80,
    label: 'Account Name',
  });
  if (!nameRes.isValid && nameRes.error) errors.name = nameRes.error;

  if (data.accountNumber && data.accountNumber.length > 40) {
    errors.accountNumber = 'Account number cannot exceed 40 characters.';
  }

  if (data.bankName && data.bankName.length > 60) {
    errors.bankName = 'Bank name cannot exceed 60 characters.';
  }

  if (data.openingBalance !== undefined && data.openingBalance !== '') {
    const balRes = validateNumber(data.openingBalance, {
      allowNegative: true,
      label: 'Opening Balance',
    });
    if (!balRes.isValid && balRes.error) errors.openingBalance = balRes.error;
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}

/**
 * 16. INSTALLATION WIZARD VALIDATOR
 */
export function validateInstallWizardData(data: {
  step: number;
  businessName?: string;
  currency?: string;
  adminUsername?: string;
  adminEmail?: string;
  adminPassword?: string;
  locationName?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.step === 1 || data.businessName !== undefined) {
    const trimmedBiz = (data.businessName || '').trim();
    if (trimmedBiz.length < 8 || !/^[A-Za-z\s]+$/.test(trimmedBiz)) {
      errors.businessName = 'Business name must contain only alphabets and spaces (minimum 8 characters).';
    }
  }

  if (data.step === 2 || data.adminUsername !== undefined) {
    if (!data.adminUsername || data.adminUsername.trim().length < 3) {
      errors.adminUsername = 'Admin username must be at least 3 characters.';
    }
    if (!data.adminEmail || !validateEmailField(data.adminEmail).isValid) {
      errors.adminEmail = 'A valid admin email is required.';
    }
    if (!data.adminPassword || data.adminPassword.length < 6) {
      errors.adminPassword = 'Admin password must be at least 6 characters.';
    }
  }

  if (data.step === 3 || data.locationName !== undefined) {
    if (!data.locationName || data.locationName.trim().length < 2) {
      errors.locationName = 'Default store location name is required.';
    }
  }

  const errorKeys = Object.keys(errors);
  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : undefined,
    firstErrorField: errorKeys.length > 0 ? errorKeys[0] : undefined,
  };
}



import { AmountRoundingMethod, BusinessSettings } from '../types/erp';

/**
 * Amount Rounding Helper
 * Applies rounding based on setting (nearest integer, 0.05, 0.10, 0.50, or none)
 */
export const applyAmountRounding = (
  amount: number | string | undefined | null,
  method?: AmountRoundingMethod
): number => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  if (isNaN(num)) return 0;
  if (!method || method === 'none') {
    return Math.round(num * 100) / 100;
  }
  switch (method) {
    case 'round_to_nearest_integer':
      return Math.round(num);
    case 'round_0_05':
      return Math.round(num * 20) / 20;
    case 'round_0_10':
      return Math.round(num * 10) / 10;
    case 'round_0_50':
      return Math.round(num * 2) / 2;
    default:
      return Math.round(num * 100) / 100;
  }
};

export const getCategoryName = (cat: any): string => {
  if (!cat) return 'General';
  if (typeof cat === 'object') {
    return cat.name || cat.title || cat.code || 'General';
  }
  return String(cat);
};

export const getBrandName = (brand: any): string => {
  if (!brand) return 'Standard';
  if (typeof brand === 'object') {
    return brand.name || brand.title || brand.code || 'Standard';
  }
  return String(brand);
};

/**
 * 1. Default Profit Margin Helper
 * Auto-calculates selling price based on cost price and margin percentage.
 */
export const calculateSellingPriceFromCost = (
  costPrice: number,
  marginPercent: number = 25
): number => {
  const cost = isNaN(costPrice) ? 0 : Math.max(0, costPrice);
  const margin = isNaN(marginPercent) ? 0 : Math.max(0, marginPercent);
  const selling = cost * (1 + margin / 100);
  return parseFloat(selling.toFixed(2));
};

/**
 * 2. Currency Formatting Helper
 * Strictly respects Currency Symbol Placement ('prefix' e.g. $100 vs 'suffix' e.g. 100 $)
 */
export const formatCurrency = (
  amount: number | string | undefined | null,
  settings?: Partial<BusinessSettings>
): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  const validNum = isNaN(num) ? 0 : num;
  
  const symbol = settings?.currencySymbol || '₹';
  const placement = settings?.currencyPlacement || 'prefix';
  const decimals = settings?.currencyDecimalPlaces !== undefined ? settings.currencyDecimalPlaces : 2;

  const formattedNum = validNum.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (placement === 'suffix') {
    return `${formattedNum} ${symbol}`.trim();
  }
  return `${symbol}${formattedNum}`;
};

/**
 * Date Normalizer Helper
 * Converts any date format (DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD, ISO, or timestamp)
 * into a standardized canonical 'YYYY-MM-DD' string for reliable chronological comparison and filtering.
 */
export const normalizeDateToYMD = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(dateInput).trim();
  if (!str) return '';

  const datePart = str.split(/[ T]/)[0].trim();

  // 1. DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const ddmmyyyy = datePart.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 2. YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const yyyymmdd = datePart.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 3. Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return datePart;
};

/**
 * 3. Timezone & 7. Date Format Helper
 * Formats any date input according to settings.dateFormat and settings.timezone
 */
export const formatDate = (
  dateInput?: string | Date | number | null,
  dateFormat?: string,
  timezone?: string
): string => {
  if (!dateInput) return '-';

  let dateObj: Date;
  if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else if (typeof dateInput === 'number') {
    dateObj = new Date(dateInput);
  } else {
    const str = String(dateInput).trim();
    // Parse DD-MM-YYYY or DD/MM/YYYY into native Date
    const ddmmyyyy = str.split(/[ T]/)[0].match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      dateObj = new Date(str);
    }
  }

  if (isNaN(dateObj.getTime())) return String(dateInput);

  const tz = timezone || 'America/Chicago';
  const fmt = dateFormat || 'DD-MM-YYYY';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(dateObj);
    let day = '01';
    let month = '01';
    let year = '2026';
    parts.forEach((p) => {
      if (p.type === 'day') day = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = p.value;
    });

    if (fmt === 'DD-MM-YYYY') return `${day}-${month}-${year}`;
    if (fmt === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
    if (fmt === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    if (fmt === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (fmt === 'DD MMM YYYY') {
      const monthShort = dateObj.toLocaleString('en-US', { month: 'short', timeZone: tz });
      return `${day} ${monthShort} ${year}`;
    }
    if (fmt === 'MMM DD, YYYY') {
      const monthShort = dateObj.toLocaleString('en-US', { month: 'short', timeZone: tz });
      return `${monthShort} ${day}, ${year}`;
    }
    return `${day}-${month}-${year}`;
  } catch (err) {
    // Fallback if invalid timezone or formatting error
    return dateObj.toISOString().split('T')[0];
  }
};

/**
 * 3. Timezone Helper (Time)
 */
export const formatTime = (
  dateInput?: string | Date | number | null,
  timeFormat?: '12' | '24',
  timezone?: string
): string => {
  if (!dateInput) return '';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj.getTime())) return '';

  const tz = timezone || 'America/Chicago';
  const is12 = timeFormat !== '24';
  try {
    return dateObj.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: is12,
    });
  } catch (err) {
    return dateObj.toLocaleTimeString();
  }
};

/**
 * 3. Timezone & Date/Time combined helper
 */
export const formatDateTime = (
  dateInput?: string | Date | number | null,
  dateFormat?: string,
  timeFormat?: '12' | '24',
  timezone?: string
): string => {
  if (!dateInput) return '-';
  const dStr = formatDate(dateInput, dateFormat, timezone);
  const tStr = formatTime(dateInput, timeFormat, timezone);
  return tStr ? `${dStr} ${tStr}` : dStr;
};

/**
 * 4. Financial Year Start Month Helper
 * Calculates Financial Year start date and end date based on financialYearStartMonth (1 = Jan, 4 = April, etc.)
 */
export const getFinancialYearRange = (
  startMonth: number = 4,
  isPreviousFY: boolean = false,
  refDate: Date = new Date()
): { startDate: string; endDate: string; label: string } => {
  const validStartMonth = Math.max(1, Math.min(12, startMonth || 4));
  const startMonthIdx = validStartMonth - 1; // 0-indexed month (0 = Jan, 3 = April, etc.)
  const currentYear = refDate.getFullYear();
  const currentMonthIdx = refDate.getMonth(); // 0-indexed

  let fyStartYear = currentYear;
  if (currentMonthIdx < startMonthIdx) {
    fyStartYear = currentYear - 1;
  }
  if (isPreviousFY) {
    fyStartYear = fyStartYear - 1;
  }

  // Financial Year Start: 1st of startMonth in fyStartYear
  const startObj = new Date(fyStartYear, startMonthIdx, 1);
  // Financial Year End: Last day of month before startMonth in fyStartYear + 1
  const endObj = new Date(fyStartYear + 1, startMonthIdx, 0);

  const formatIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const startStr = formatIso(startObj);
  const endStr = formatIso(endObj);
  const label = `FY ${fyStartYear}-${fyStartYear + 1}`;

  return { startDate: startStr, endDate: endStr, label };
};

/**
 * 6. Transaction Edit Days Limit Helper
 * Checks if a transaction created at createdAt can still be edited/deleted given transactionEditDays
 */
export const isTransactionEditable = (
  createdAt?: string | Date | number | null,
  transactionEditDays?: number | null
): { canEdit: boolean; daysElapsed: number; maxDays: number; reason?: string } => {
  const maxDays = transactionEditDays !== undefined && transactionEditDays !== null ? Number(transactionEditDays) : 0;
  
  if (!maxDays || maxDays <= 0) {
    // 0 or null means unlimited edit window
    return { canEdit: true, daysElapsed: 0, maxDays: 0 };
  }

  if (!createdAt) {
    return { canEdit: true, daysElapsed: 0, maxDays };
  }

  const parseDate = (dStr: string) => {
    let d = new Date(dStr);
    if (!isNaN(d.getTime())) return d;
    
    // Try DD-MM-YYYY or DD/MM/YYYY
    const parts = dStr.split(/[-/]/);
    if (parts.length === 3) {
      const [d1, m, y] = parts;
      // Assume DD-MM-YYYY
      if (d1.length === 2 && y.length === 4) return new Date(`${y}-${m}-${d1}`);
      // Assume YYYY-MM-DD
      if (d1.length === 4) return new Date(`${d1}-${m}-${parts[2]}`);
    }
    return new Date(dStr);
  };

  const createdTime = parseDate(createdAt as string).getTime();
  console.log('isTransactionEditable debug:', { createdAt, maxDays, createdTime, now: Date.now() });
  if (isNaN(createdTime)) {
    return { canEdit: true, daysElapsed: 0, maxDays };
  }

  const now = Date.now();
  const diffMs = now - createdTime;
  const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (daysElapsed > maxDays) {
    return {
      canEdit: false,
      daysElapsed,
      maxDays,
      reason: `Transaction was created ${daysElapsed} days ago, exceeding the ${maxDays}-day transaction edit limit set in HQ Details.`,
    };
  }

  return { canEdit: true, daysElapsed, maxDays };
};

/**
 * Robust email format validation helper.
 * Requires proper format with domain suffix of at least 2 letters (e.g., name@domain.com, not name@domain).
 */
export const validateEmail = (email: string | undefined | null): boolean => {
  const trimmed = (email || '').trim();
  if (!trimmed) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
};

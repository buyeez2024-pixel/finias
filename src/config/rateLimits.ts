/**
 * Enterprise Tiered Rate Limiting & Exponential Backoff Architecture
 * 
 * Provides defense-in-depth against:
 * 1. Brute-force credential stuffing attacks
 * 2. DoS and automated spam on public endpoints
 * 3. High-volume resource exhaustion on background/sync routes
 * 
 * Designed for POS & Retail stores sharing a single store router/IP (NAT),
 * combining per-IP and per-account limits with progressive delays.
 */

export interface RateLimitConfig {
  // Tier 1: Authentication routes (Login, Signup, Password Reset)
  authMaxRequests: number;           // Max requests per window (e.g., 10)
  authWindowSec: number;             // Window size in seconds (e.g., 300s = 5m)
  authDelayThreshold: number;        // Failed attempts before exponential delay kicks in (e.g., 3)
  authBaseDelayMs: number;           // Base delay in milliseconds (e.g., 1000ms)
  authMaxDelayMs: number;            // Cap on delay (e.g., 30000ms = 30s)

  // Tier 2: Public routes (System status, catalog lookups, health)
  publicMaxRequests: number;         // Requests per window (e.g., 60)
  publicWindowSec: number;           // Window in seconds (e.g., 60s)

  // Tier 3: Authenticated POS & Cashier transactions (Fast barcode scanning)
  authenticatedMaxRequests: number;  // Requests per window (e.g., 600)
  authenticatedWindowSec: number;    // Window in seconds (e.g., 60s)

  // Enable/Disable master switch
  enableRateLimiting: boolean;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  authMaxRequests: 10,
  authWindowSec: 300,              // 5 minutes
  authDelayThreshold: 3,           // Delay starts after 3 failed attempts
  authBaseDelayMs: 1500,           // 1.5s -> 3s -> 6s exponential
  authMaxDelayMs: 30000,           // Max 30 seconds delay
  publicMaxRequests: 60,           // 60 req / minute
  publicWindowSec: 60,
  authenticatedMaxRequests: 600,   // 600 req / minute (10 scans/sec)
  authenticatedWindowSec: 60,
  enableRateLimiting: true,
};

interface AttemptRecord {
  count: number;
  failures: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

// In-memory sliding window cache with TTL cleanup
const attemptStore = new Map<string, AttemptRecord>();

// Clean up expired keys every 5 minutes to keep memory footprint under 2MB
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attemptStore.entries()) {
      if (now - record.lastAttemptAt > 3600 * 1000) {
        attemptStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Normalizes identifier and IP for composite dual-key tracking
 * This ensures that when 5 cashiers share a single store Wi-Fi (same IP),
 * a mistake by Cashier A does not lock out Cashier B.
 */
export function buildCompositeKey(identifier: string, ip?: string, prefix: string = 'auth'): string {
  const cleanId = (identifier || 'anonymous').toLowerCase().trim();
  const cleanIp = (ip || 'store_client').trim();
  return `${prefix}:${cleanId}:${cleanIp}`;
}

/**
 * Calculates exponential backoff delay based on failed attempts
 */
export function calculateExponentialDelay(
  failures: number,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): number {
  if (failures < config.authDelayThreshold) {
    return 0;
  }
  const excess = failures - config.authDelayThreshold + 1;
  // exponential growth: base * (2 ^ (excess - 1))
  const rawDelay = config.authBaseDelayMs * Math.pow(2, excess - 1);
  return Math.min(rawDelay, config.authMaxDelayMs);
}

export interface AuthRateLimitResult {
  allowed: boolean;
  delayMs: number;
  delayRemainingSec: number;
  remainingAttempts: number;
  failedCount: number;
  reason?: string;
}

/**
 * Checks if an authentication attempt is permitted or throttled
 */
export function checkAuthRateLimit(
  identifier: string,
  ip?: string,
  customConfig?: Partial<RateLimitConfig>
): AuthRateLimitResult {
  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...(customConfig || {}) };

  if (!config.enableRateLimiting) {
    return {
      allowed: true,
      delayMs: 0,
      delayRemainingSec: 0,
      remainingAttempts: config.authMaxRequests,
      failedCount: 0,
    };
  }

  const key = buildCompositeKey(identifier, ip, 'auth');
  const now = Date.now();
  const record = attemptStore.get(key);

  if (!record) {
    return {
      allowed: true,
      delayMs: 0,
      delayRemainingSec: 0,
      remainingAttempts: config.authMaxRequests,
      failedCount: 0,
    };
  }

  // Check if active delay/cool-off is still running
  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingMs = record.blockedUntil - now;
    const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
    return {
      allowed: false,
      delayMs: remainingMs,
      delayRemainingSec: remainingSec,
      remainingAttempts: Math.max(0, config.authMaxRequests - record.count),
      failedCount: record.failures,
      reason: `Rate Shield Active: Please wait ${remainingSec}s before trying again (exponential backoff).`,
    };
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > config.authWindowSec * 1000) {
    attemptStore.delete(key);
    return {
      allowed: true,
      delayMs: 0,
      delayRemainingSec: 0,
      remainingAttempts: config.authMaxRequests,
      failedCount: 0,
    };
  }

  // Check window request threshold
  if (record.count >= config.authMaxRequests) {
    const resetInMs = config.authWindowSec * 1000 - (now - record.firstAttemptAt);
    const resetInSec = Math.max(1, Math.ceil(resetInMs / 1000));
    return {
      allowed: false,
      delayMs: resetInMs,
      delayRemainingSec: resetInSec,
      remainingAttempts: 0,
      failedCount: record.failures,
      reason: `Too many login attempts. Rate limit reached. Try again in ${resetInSec}s.`,
    };
  }

  return {
    allowed: true,
    delayMs: 0,
    delayRemainingSec: 0,
    remainingAttempts: Math.max(0, config.authMaxRequests - record.count),
    failedCount: record.failures,
  };
}

/**
 * Records a failed authentication attempt and calculates next exponential delay
 */
export function recordAuthFailure(
  identifier: string,
  ip?: string,
  customConfig?: Partial<RateLimitConfig>
): { delayMs: number; delaySec: number; failures: number } {
  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...(customConfig || {}) };
  const key = buildCompositeKey(identifier, ip, 'auth');
  const now = Date.now();
  let record = attemptStore.get(key);

  if (!record || now - record.firstAttemptAt > config.authWindowSec * 1000) {
    record = {
      count: 1,
      failures: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
  } else {
    record.count += 1;
    record.failures += 1;
    record.lastAttemptAt = now;
  }

  // Calculate exponential delay
  const delayMs = calculateExponentialDelay(record.failures, config);
  if (delayMs > 0) {
    record.blockedUntil = now + delayMs;
  }

  attemptStore.set(key, record);

  return {
    delayMs,
    delaySec: Math.ceil(delayMs / 1000),
    failures: record.failures,
  };
}

/**
 * Resets authentication failures after successful login
 */
export function resetAuthFailures(identifier: string, ip?: string): void {
  const key = buildCompositeKey(identifier, ip, 'auth');
  attemptStore.delete(key);
}

/**
 * Generic sliding window rate limiter for public or authenticated routes
 */
export function checkGenericRateLimit(
  key: string,
  tier: 'public' | 'authenticated',
  customConfig?: Partial<RateLimitConfig>
): { allowed: boolean; remaining: number; resetSec: number } {
  const config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...(customConfig || {}) };

  if (!config.enableRateLimiting) {
    return { allowed: true, remaining: 999, resetSec: 0 };
  }

  const maxRequests = tier === 'authenticated' ? config.authenticatedMaxRequests : config.publicMaxRequests;
  const windowSec = tier === 'authenticated' ? config.authenticatedWindowSec : config.publicWindowSec;
  const fullKey = `tier_${tier}:${key}`;
  const now = Date.now();
  let record = attemptStore.get(fullKey);

  if (!record || now - record.firstAttemptAt > windowSec * 1000) {
    attemptStore.set(fullKey, {
      count: 1,
      failures: 0,
      firstAttemptAt: now,
      lastAttemptAt: now,
    });
    return { allowed: true, remaining: maxRequests - 1, resetSec: windowSec };
  }

  record.count += 1;
  record.lastAttemptAt = now;
  attemptStore.set(fullKey, record);

  const resetSec = Math.max(1, Math.ceil((windowSec * 1000 - (now - record.firstAttemptAt)) / 1000));

  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetSec };
  }

  return { allowed: true, remaining: Math.max(0, maxRequests - record.count), resetSec };
}

/**
 * Fixed-window, in-memory IP rate limiter shared by telemetry ingest routes.
 *
 * Lives outside the route module on purpose: Next.js only permits HTTP methods
 * and a handful of config fields to be exported from a `route.ts`.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const globalForErrors = global as unknown as {
  errorsRateLimitMap?: Map<string, RateLimitRecord>;
};

const rateLimitMap =
  globalForErrors.errorsRateLimitMap || new Map<string, RateLimitRecord>();

if (process.env.NODE_ENV !== 'production') {
  globalForErrors.errorsRateLimitMap = rateLimitMap;
}

/** Clears rate limit store (useful for test isolation). */
export function clearRateLimits() {
  rateLimitMap.clear();
}

/**
 * Checks and updates rate limit for a given IP.
 * Returns true if allowed, false if rate limit exceeded.
 */
export function checkRateLimit(
  ip: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { timestamps: [] };

  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= max) {
    const oldest = record.timestamps[0];
    const resetMs = oldest + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(resetMs / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  record.timestamps.push(now);
  rateLimitMap.set(ip, record);
  return { allowed: true, retryAfterSeconds: 0 };
}

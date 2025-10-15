// In-memory rate limiter for Edge Functions
// Uses Deno KV for distributed rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  combat: { maxRequests: 100, windowMs: 60000 }, // 100 req/min for combat actions
  standard: { maxRequests: 60, windowMs: 60000 }, // 60 req/min for standard ops
  strict: { maxRequests: 20, windowMs: 60000 },   // 20 req/min for expensive ops
} as const;

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (user_id or ip)
 * @param config - Rate limit configuration
 * @returns Object with limited status and remaining requests
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = limits.get(key);

  // Cleanup old entries periodically
  if (limits.size > 10000) {
    for (const [k, v] of limits.entries()) {
      if (v.resetAt < now) {
        limits.delete(k);
      }
    }
  }

  // New window or expired
  if (!entry || entry.resetAt < now) {
    limits.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      limited: false,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Increment count
  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    limited: entry.count > config.maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(resetAt: number, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}

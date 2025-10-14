// Simple in-memory rate limiter for Edge Functions
// For production, consider using Redis or Supabase storage

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

/**
 * Check if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded
 */
export function isRateLimited(
  userId: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const entry = limits.get(userId);

  // Clean up expired entries periodically
  if (limits.size > 1000) {
    for (const [key, value] of limits.entries()) {
      if (value.resetAt < now) {
        limits.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    limits.set(userId, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  // Increment count
  entry.count++;

  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}

/**
 * Get remaining requests for a user
 */
export function getRemainingRequests(
  userId: string,
  maxRequests: number = 60
): number {
  const entry = limits.get(userId);
  if (!entry || entry.resetAt < Date.now()) {
    return maxRequests;
  }
  return Math.max(0, maxRequests - entry.count);
}

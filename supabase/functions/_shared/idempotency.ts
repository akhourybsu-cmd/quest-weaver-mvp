// Idempotency key management for combat actions
// Prevents duplicate action execution

interface IdempotencyEntry {
  response: any;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if this request has already been processed
 * @param key - Idempotency key from request header
 * @returns Cached response if found, null otherwise
 */
export function checkIdempotency(key: string | null): any | null {
  if (!key) return null;

  const entry = idempotencyStore.get(key);
  if (!entry) return null;

  // Check if entry is still valid
  if (Date.now() - entry.timestamp > IDEMPOTENCY_TTL) {
    idempotencyStore.delete(key);
    return null;
  }

  return entry.response;
}

/**
 * Store response for idempotency
 * @param key - Idempotency key
 * @param response - Response to cache
 */
export function storeIdempotent(key: string | null, response: any): void {
  if (!key) return;

  idempotencyStore.set(key, {
    response,
    timestamp: Date.now(),
  });

  // Cleanup old entries periodically
  if (idempotencyStore.size > 10000) {
    const now = Date.now();
    for (const [k, v] of idempotencyStore.entries()) {
      if (now - v.timestamp > IDEMPOTENCY_TTL) {
        idempotencyStore.delete(k);
      }
    }
  }
}

/**
 * Generate idempotency key for combat action
 * @param userId - User ID
 * @param encounterId - Encounter ID
 * @param action - Action type
 * @param targetId - Target character ID
 * @param timestamp - Action timestamp
 */
export function generateIdempotencyKey(
  userId: string,
  encounterId: string,
  action: string,
  targetId: string,
  timestamp: number
): string {
  return `${userId}:${encounterId}:${action}:${targetId}:${Math.floor(timestamp / 1000)}`;
}

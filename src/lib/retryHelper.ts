/**
 * Retry helper with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error: any) => {
    // Retry on network errors, timeout, or 5xx server errors
    if (error?.message?.includes('fetch')) return true;
    if (error?.status >= 500 && error?.status < 600) return true;
    if (error?.message?.includes('timeout')) return true;
    return false;
  },
  onRetry: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or if we shouldn't retry this error
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        opts.baseDelay * Math.pow(2, attempt),
        opts.maxDelay
      );
      const jitter = Math.random() * 0.3 * exponentialDelay; // Add up to 30% jitter
      const delay = exponentialDelay + jitter;

      opts.onRetry(attempt + 1, error);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Debounce function that delays execution until after wait milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function that limits execution to once per wait milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
    return lastResult;
  };
}

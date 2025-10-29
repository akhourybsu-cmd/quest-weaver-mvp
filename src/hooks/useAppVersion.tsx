import { useEffect, useRef } from 'react';

const BUILD_TIME = new Date().getTime();
const CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Hook that checks if a new version of the app is available
 * by fetching index.html and comparing its content hash
 */
export function useAppVersion() {
  const initialHashRef = useRef<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/index.html', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) return;
        
        const html = await response.text();
        const currentHash = hashCode(html);

        if (initialHashRef.current === null) {
          // First check - store the initial hash
          initialHashRef.current = currentHash;
        } else if (initialHashRef.current !== currentHash) {
          // Hash changed - new version detected
          console.log('[useAppVersion] New version detected, refreshing...');
          window.location.reload();
        }
      } catch (error) {
        console.error('[useAppVersion] Error checking version:', error);
      }
    };

    // Initial check after a delay
    const initialTimeout = setTimeout(checkVersion, 10000);

    // Then check periodically
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
}

// Simple hash function for string comparison
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

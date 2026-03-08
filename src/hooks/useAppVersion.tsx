import { useEffect, useRef } from 'react';

const CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Hook that checks if a new version of the app is available
 * by using a HEAD request and comparing ETag/Last-Modified headers
 */
export function useAppVersion() {
  const initialETagRef = useRef<string | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const response = await fetch('/index.html', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        
        if (!response.ok) return;
        
        const etag = response.headers.get('etag') || response.headers.get('last-modified') || '';
        
        if (!etag) return; // Server doesn't support ETag/Last-Modified

        if (initialETagRef.current === null) {
          initialETagRef.current = etag;
        } else if (initialETagRef.current !== etag) {
          if (import.meta.env.DEV) {
            console.log('[useAppVersion] New version detected, refreshing...');
          }
          window.location.reload();
        }
      } catch {
        // Silently ignore version check errors
      }
    };

    const initialTimeout = setTimeout(checkVersion, 10000);
    const interval = setInterval(checkVersion, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);
}

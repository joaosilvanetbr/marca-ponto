import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para App Badge API — mostra um badge no ícone do app
 * indicando registros pendentes de sincronização.
 */
export function useAppBadge() {
  const supported = useRef(false);

  useEffect(() => {
    supported.current = 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
  }, []);

  const setBadge = useCallback((count: number) => {
    if (!supported.current) return;
    try {
      if (count > 0) {
        (navigator as Navigator & { setAppBadge?: (count: number) => Promise<void> }).setAppBadge?.(count);
      } else {
        (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
      }
    } catch {
      // Silenciosamente ignora
    }
  }, []);

  const clearBadge = useCallback(() => {
    if (!supported.current) return;
    try {
      (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
    } catch {
      // Silenciosamente ignora
    }
  }, []);

  return { setBadge, clearBadge, supported: supported.current };
}

import { useCallback } from 'react';

function isBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Hook para App Badge API — mostra um badge no ícone do app
 * indicando registros pendentes de sincronização.
 */
export function useAppBadge() {
  const setBadge = useCallback((count: number) => {
    if (!isBadgeSupported()) return;
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
    if (!isBadgeSupported()) return;
    try {
      (navigator as Navigator & { clearAppBadge?: () => Promise<void> }).clearAppBadge?.();
    } catch {
      // Silenciosamente ignora
    }
  }, []);

  return { setBadge, clearBadge, supported: isBadgeSupported() };
}

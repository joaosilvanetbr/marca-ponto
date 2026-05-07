import { useEffect, useRef } from 'react';
import { useAppBadge } from './useAppBadge';
import { useThemeColor } from './useThemeColor';

interface AppInitializationProps {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  handleSync: () => Promise<void>;
  darkMode: boolean;
}

export function useAppInitialization({
  isOnline,
  pendingCount,
  syncing,
  handleSync,
  darkMode,
}: AppInitializationProps) {
  const { setBadge, clearBadge } = useAppBadge();

  // Theme color dinâmico
  useThemeColor(darkMode);

  // Atualiza badge quando mudam os pendentes
  useEffect(() => {
    if (pendingCount > 0) {
      setBadge(pendingCount);
    } else {
      clearBadge();
    }
  }, [pendingCount, setBadge, clearBadge]);

  // Auto-sync quando volta online
  const handleSyncRef = useRef(handleSync);
  useEffect(() => {
    handleSyncRef.current = handleSync;
  }, [handleSync]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      handleSyncRef.current();
    }
  }, [isOnline, pendingCount, syncing]);
}

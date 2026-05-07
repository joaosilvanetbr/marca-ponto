import { useApp } from './useApp';

export function useOfflineSyncStatus() {
  const { isOnline, pendingCount, syncing } = useApp();
  return {
    isOnline,
    pendingCount,
    syncing,
    hasPending: pendingCount > 0,
  };
}

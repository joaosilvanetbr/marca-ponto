import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { ReactNode } from 'react';

/**
 * Usaremos LocalStorage para persistência simples e síncrona, 
 * que é o padrão esperado pelo createSyncStoragePersister.
 * Para volumes pequenos de dados como registros de ponto, é suficiente.
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'PONTOGO_OFFLINE_CACHE',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hora
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 semana
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}



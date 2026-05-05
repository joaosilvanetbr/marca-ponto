import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppMutations } from './useAppMutations';

const mocks = vi.hoisted(() => ({
  updateRegistro: vi.fn(),
  upsertRegistro: vi.fn(),
  deleteRegistro: vi.fn(),
  upsertCalendario: vi.fn(),
  deleteCalendario: vi.fn(),
  addToQueue: vi.fn(),
  syncQueue: vi.fn(async () => ({ success: 0, failed: 0 })),
  appState: {
    isOnline: true,
    setSyncing: vi.fn(),
    setLancamentoAberto: vi.fn(),
  },
}));

vi.mock('@/lib/supabase', () => ({
  updateRegistro: mocks.updateRegistro,
  upsertRegistro: mocks.upsertRegistro,
  deleteRegistro: mocks.deleteRegistro,
  upsertCalendario: mocks.upsertCalendario,
  deleteCalendario: mocks.deleteCalendario,
}));

vi.mock('@/lib/offline-queue', () => ({
  addToQueue: mocks.addToQueue,
  syncQueue: mocks.syncQueue,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: 'user-1' }),
}));

vi.mock('@/hooks/useApp', () => ({
  useApp: () => mocks.appState,
}));

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAppMutations.handleUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.appState.isOnline = true;
  });

  it('updates by id when online', async () => {
    const client = new QueryClient();
    const { result } = renderHook(() => useAppMutations(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.handleUpdate('42', { observacao: 'ajuste' });
    });

    expect(mocks.updateRegistro).toHaveBeenCalledWith('user-1', '42', { observacao: 'ajuste' });
    expect(mocks.addToQueue).not.toHaveBeenCalled();
  });

  it('queues update when offline', async () => {
    mocks.appState.isOnline = false;
    const client = new QueryClient();
    const { result } = renderHook(() => useAppMutations(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      await result.current.handleUpdate('7', { observacao: 'offline' });
    });

    expect(mocks.updateRegistro).not.toHaveBeenCalled();
    expect(mocks.addToQueue).toHaveBeenCalledWith(
      'update',
      { id: '7', observacao: 'offline' },
      'registros',
      'user-1'
    );
  });
});

import { createContext } from 'react';
import type { Tab, Registro } from '@/types';

export interface AppState {
  activeTab: Tab;
  tabDirection: 'left' | 'right';
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  editando: Registro | null;
  lancamentoAberto: boolean;
  setEditando: (r: Registro | null) => void;
  setLancamentoAberto: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  handleTabChange: (tab: Tab) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export const AppContext = createContext<AppState | null>(null);

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Tab } from '@/types';
import { getPendingCount } from '@/lib/offline-queue';
import { useAuth } from '@/hooks/useAuth';
import { AppContext } from './AppContext';

const TAB_ORDER: Tab[] = ['ponto', 'historico', 'calendario', 'config'];

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('ponto');
  const [prevTab, setPrevTab] = useState<Tab>('ponto');
  const [tabDirection, setTabDirection] = useState<'left' | 'right'>('right');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [editando, setEditando] = useState<import('@/types').Registro | null>(null);
  const [lancamentoAberto, setLancamentoAberto] = useState(false);

  const handleTabChange = useCallback((tab: Tab) => {
    const currentIdx = TAB_ORDER.indexOf(prevTab);
    const newIdx = TAB_ORDER.indexOf(tab);
    setTabDirection(newIdx > currentIdx ? 'right' : 'left');
    setPrevTab(tab);
    setActiveTab(tab);
  }, [prevTab]);

  // Swipe entre abas
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    if (Math.abs(diffX) < 80 || Math.abs(diffY) > Math.abs(diffX)) return;

    const currentIdx = TAB_ORDER.indexOf(activeTab);

    if (diffX < 0 && currentIdx < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[currentIdx + 1]);
    } else if (diffX > 0 && currentIdx > 0) {
      handleTabChange(TAB_ORDER[currentIdx - 1]);
    }
  }, [touchStartX, touchStartY, activeTab, handleTabChange]);

  // Monitora online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Atualiza contagem de pendentes periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        setPendingCount(getPendingCount(user));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        tabDirection,
        isOnline,
        pendingCount,
        syncing,
        editando,
        lancamentoAberto,
        setEditando,
        setLancamentoAberto,
        setSyncing,
        handleTabChange,
        onTouchStart,
        onTouchEnd,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

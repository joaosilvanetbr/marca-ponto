import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CloudSync, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react';
import { useOfflineSyncStatus } from '@/hooks/useOfflineSyncStatus';

export function OfflineStatusBadge() {
  const { isOnline, pendingCount, syncing } = useOfflineSyncStatus();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const prevSyncing = useRef(syncing);
  const prevPending = useRef(pendingCount);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    // Se acabamos de sincronizar
    if (prevSyncing.current && !syncing) {
      if (pendingCount === 0 && prevPending.current > 0) {
        // Sincronização terminou e não há mais pendências
        showTimer = setTimeout(() => setShowSuccess(true), 0);
        hideTimer = setTimeout(() => setShowSuccess(false), 3000);
      } else if (pendingCount > 0 && isOnline) {
        // Sincronização terminou, mas ainda há pendências (provável erro na rede/servidor)
        showTimer = setTimeout(() => setShowError(true), 0);
        hideTimer = setTimeout(() => setShowError(false), 4000);
      }
    }
    
    // Limpar estados temporários se ficarmos offline ou iniciarmos sincronização
    if (!isOnline || syncing) {
      showTimer = setTimeout(() => {
        setShowSuccess(false);
        setShowError(false);
      }, 0);
    }
    
    prevSyncing.current = syncing;
    prevPending.current = pendingCount;

    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [syncing, pendingCount, isOnline]);

  if (isOnline && pendingCount === 0 && !syncing && !showSuccess && !showError) return null;

  return (
    <AnimatePresence mode="wait">
      {!isOnline ? (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-200/50 dark:border-amber-900/50 shadow-sm"
        >
          <WifiOff className="w-3 h-3" />
          <span>Modo Offline {pendingCount > 0 && `• ${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`}</span>
        </motion.div>
      ) : showSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/50 dark:border-emerald-900/50 shadow-sm"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Sincronizado</span>
        </motion.div>
      ) : showError ? (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider border border-rose-200/50 dark:border-rose-900/50 shadow-sm"
        >
          <CloudOff className="w-3 h-3" />
          <span>Sincronização adiada</span>
        </motion.div>
      ) : syncing ? (
        <motion.div
          key="syncing"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-200/50 dark:border-cyan-900/50 shadow-sm"
        >
          <CloudSync className="w-3 h-3 animate-pulse" />
          <span>Sincronizando...</span>
        </motion.div>
      ) : pendingCount > 0 ? (
        <motion.div
          key="pending"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-200/50 dark:border-indigo-900/50 shadow-sm"
        >
          <AlertCircle className="w-3 h-3" />
          <span>{pendingCount} registro{pendingCount > 1 ? 's' : ''} aguardando</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { useState, useMemo, useCallback } from 'react';
import type { Registro, Profile } from '@/types';
import { mesAtual } from '@/lib/time-utils';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

// Hooks
import { useHistoryData } from '@/hooks/useHistoryData';
import { useHistoryExport } from '@/hooks/useHistoryExport';

// Subcomponentes
import { HistorySummary } from './history/HistorySummary';
import { HistoryMonthSelector } from './history/HistoryMonthSelector';
import { HistoryFilters, type Filtro } from './history/HistoryFilters';
import { HistoryList } from './history/HistoryList';

interface BankHistoryProps {
  registros: Registro[];
  profile: Profile | null;
  userId: string | null;
  onEdit: (registro: Registro) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function BankHistory({ registros, profile, userId, onEdit, onDelete }: BankHistoryProps) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [deletando, setDeletando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('com_registro');

  const { items, totalTrabalhado, saldoMes, diasComRegistro, diasSemRegistro } = useHistoryData(
    userId,
    mesSelecionado,
    registros,
    profile
  );

  const itemsFiltrados = useMemo(() => {
    if (filtro === 'com_registro') return items.filter(i => i.reg !== null);
    if (filtro === 'sem_registro') return items.filter(i => i.status === 'faltante');
    return items;
  }, [items, filtro]);

  const exportarCSV = useHistoryExport(
    items,
    totalTrabalhado,
    saldoMes,
    diasComRegistro,
    diasSemRegistro,
    mesSelecionado
  );

  const mudarMes = useCallback((delta: number) => {
    setMesSelecionado(prev => {
      const [y, m] = prev.split('-').map(Number);
      const novo = new Date(y, m - 1 + delta, 1);
      return `${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Excluir este registro? Esta ação não pode ser desfeita.')) return;
    setDeletando(id);
    try {
      await onDelete(id);
    } finally {
      setDeletando(null);
    }
  }, [onDelete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      
      <HistoryMonthSelector 
        mesSelecionado={mesSelecionado} 
        onMudarMes={mudarMes} 
      />

      <HistorySummary 
        userId={userId}
        totalTrabalhado={totalTrabalhado}
        saldoMes={saldoMes}
        diasComRegistro={diasComRegistro}
      />

      <HistoryFilters 
        filtro={filtro} 
        onSetFiltro={setFiltro} 
        onExport={exportarCSV} 
      />

      <div className="ios-card rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Registros do mês
        </h3>
        <HistoryList
          items={itemsFiltrados}
          onEdit={onEdit}
          onDelete={handleDelete}
          deletando={deletando}
        />
      </div>

    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { formatarMesAno } from '@/lib/time-utils';

interface HistoryMonthSelectorProps {
  mesSelecionado: string;
  onMudarMes: (delta: number) => void;
}

export function HistoryMonthSelector({ mesSelecionado, onMudarMes }: HistoryMonthSelectorProps) {
  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }} className="ios-card rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onMudarMes(-1)} className="p-3 -ml-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </motion.button>
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
          <CalendarDays className="w-5 h-5 text-cyan-500" />
          {formatarMesAno(mesSelecionado + '-01')}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onMudarMes(1)} className="p-3 -mr-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </motion.button>
      </div>
    </motion.div>
  );
}

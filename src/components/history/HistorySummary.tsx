import { motion } from 'framer-motion';
import { Clock, Scale, TrendingUp } from 'lucide-react';
import { paraHora } from '@/lib/time-utils';
import { useSaldoGeral } from '@/hooks/useSaldoGeral';

interface HistorySummaryProps {
  userId: string | null;
  totalTrabalhado: number;
  saldoMes: number;
  diasComRegistro: number;
}

export function HistorySummary({ userId, totalTrabalhado, saldoMes, diasComRegistro }: HistorySummaryProps) {
  const { data: saldoGeral = 0 } = useSaldoGeral(userId);

  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }} className="ios-card rounded-2xl p-5 shadow-xl">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 flex flex-col items-center justify-center text-center">
          <Clock className="w-4 h-4 text-cyan-500 mb-1" />
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Trabalhado</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 tabular-nums">{paraHora(totalTrabalhado)}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <Scale className="w-4 h-4 text-emerald-500 mb-1 relative z-10" />
          <div className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold relative z-10">Saldo do mês</div>
          <div className={`text-xl font-bold mt-0.5 tabular-nums relative z-10 ${saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {saldoMes >= 0 ? '+' : ''}{paraHora(saldoMes)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 p-3 flex flex-col items-center justify-center text-center">
          <Scale className="w-4 h-4 text-cyan-500 mb-1" />
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-semibold">Saldo Geral</div>
          <div className={`text-xl font-bold mt-0.5 tabular-nums ${saldoGeral >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {saldoGeral >= 0 ? '+' : ''}{paraHora(saldoGeral)}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-4 h-4 text-amber-500 mb-1" />
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Média / dia</div>
          <div className="text-xl font-bold text-slate-800 dark:text-white mt-0.5 tabular-nums">
            {diasComRegistro > 0 ? paraHora(Math.round(totalTrabalhado / diasComRegistro)) : '—'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

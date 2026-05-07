import { motion } from 'framer-motion';
import { paraHora } from '@/lib/time-utils';

interface WorkdayProgressProps {
  minutosTrabalhados: number;
  saldo: number;
  jornadaStr: string;
}

export function WorkdayProgress({ minutosTrabalhados, saldo, jornadaStr }: WorkdayProgressProps) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          transition={{ type: 'spring', stiffness: 300, damping: 20 }} 
          className="rounded-2xl bg-secondary/50 dark:bg-secondary/20 p-4 text-center border border-border/50"
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Trabalhado</div>
          <motion.div 
            key={minutosTrabalhados} 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', stiffness: 200, damping: 15 }} 
            className="text-xl font-bold text-foreground mt-1 tabular-nums tracking-tight"
          >
            {paraHora(minutosTrabalhados)}
          </motion.div>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.03 }} 
          transition={{ type: 'spring', stiffness: 300, damping: 20 }} 
          className="rounded-2xl bg-secondary/50 dark:bg-secondary/20 p-4 text-center border border-border/50"
        >
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Saldo</div>
          <motion.div 
            key={saldo} 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: 'spring', stiffness: 200, damping: 15 }} 
            className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {saldo >= 0 ? '+' : ''}{paraHora(saldo)}
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-3 text-center">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Meta Diária: {jornadaStr}</span>
      </div>
    </div>
  );
}

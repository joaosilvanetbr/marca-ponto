import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Coffee, Play, LogOut, Loader2, Minus, Plus } from 'lucide-react';
import type { Registro } from '@/types';

interface PunchActionsProps {
  proximo: 'entrada' | 'intervalo' | 'retorno' | 'saida' | null;
  carregando: string | null;
  ajustando: boolean;
  registro: Registro | null;
  onRegistrar: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onEditar: (id: string, updates: Partial<Registro>) => Promise<void>;
}

export function PunchActions({ proximo, carregando, ajustando, registro, onRegistrar, onEditar }: PunchActionsProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {proximo ? (
          <motion.button
            key="registrar"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onRegistrar(proximo)}
            disabled={!!carregando}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary-start to-primary-end text-white font-bold text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {carregando === proximo ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {proximo === 'entrada' && <LogIn className="w-6 h-6" />}
                {proximo === 'intervalo' && <Coffee className="w-6 h-6" />}
                {proximo === 'retorno' && <Play className="w-6 h-6" />}
                {proximo === 'saida' && <LogOut className="w-6 h-6" />}
                Registrar {proximo.charAt(0).toUpperCase() + proximo.slice(1)}
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="completo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3"
          >
            <motion.svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }} strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
            Jornada completa!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ajuste fino do último ponto */}
      {registro && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Ajustar último:</span>
          {([-5, -1, 1, 5] as const).map((min) => (
            <motion.button
              key={min}
              whileTap={{ scale: 0.9 }}
              aria-label={`${min < 0 ? 'Remover' : 'Adicionar'} ${Math.abs(min)} minutos ao último ponto`}
              onClick={async () => {
                const ultimoTipo = ['saida', 'retorno', 'intervalo', 'entrada'].find((t) => registro[t as keyof Registro]) as 'entrada' | 'intervalo' | 'retorno' | 'saida' | undefined;
                if (!ultimoTipo || !registro[ultimoTipo]) return;
                const [h, m] = registro[ultimoTipo]!.split(':').map(Number);
                const novoMin = h * 60 + m + min;
                const novoHora = `${String(Math.floor(novoMin / 60)).padStart(2, '0')}:${String(Math.max(0, novoMin % 60)).padStart(2, '0')}`;
                await onEditar(registro.id!, { [ultimoTipo]: novoHora });
              }}
              disabled={ajustando}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 flex items-center gap-0.5"
            >
              {min < 0 ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {Math.abs(min)}min
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

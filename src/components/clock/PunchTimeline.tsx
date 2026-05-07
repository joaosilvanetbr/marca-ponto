import { motion } from 'framer-motion';
import { LogIn, Coffee, Play, LogOut, Loader2, Save, X, Pencil, Trash2 } from 'lucide-react';
import { fmtHora } from '@/lib/time-utils';
import type { Registro } from '@/types';

interface PunchTimelineProps {
  registro: Registro | null;
  editando: 'entrada' | 'intervalo' | 'retorno' | 'saida' | null;
  horaEditada: string;
  salvandoEdicao: boolean;
  removendo: string | null;
  onHaptic?: () => void;
  onIniciarEdicao: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida', hora: string) => void;
  onCancelarEdicao: () => void;
  onSalvarEdicao: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onRemoverPonto: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  setHoraEditada: (h: string) => void;
}

export function PunchTimeline({
  registro,
  editando,
  horaEditada,
  salvandoEdicao,
  removendo,
  onHaptic,
  onIniciarEdicao,
  onCancelarEdicao,
  onSalvarEdicao,
  onRemoverPonto,
  setHoraEditada
}: PunchTimelineProps) {
  const timeline = [
    { key: 'entrada' as const, label: 'Entrada', icon: LogIn, time: registro?.entrada, color: 'from-emerald-400 to-emerald-500' },
    { key: 'intervalo' as const, label: 'Intervalo', icon: Coffee, time: registro?.intervalo, color: 'from-amber-400 to-amber-500' },
    { key: 'retorno' as const, label: 'Retorno', icon: Play, time: registro?.retorno, color: 'from-blue-400 to-blue-500' },
    { key: 'saida' as const, label: 'Saída', icon: LogOut, time: registro?.saida, color: 'from-rose-400 to-rose-500' },
  ];

  return (
    <div className="ios-card rounded-2xl p-6 shadow-xl relative">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6 relative z-10">Timeline da Jornada</h3>
      <div className="space-y-6 relative z-10">
        <div className="absolute top-4 bottom-8 left-[1.15rem] w-0.5 bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700 -z-10" />

        {timeline.map((item, i) => {
          const Icon = item.icon;
          const isDone = !!item.time;
          const isNext = !isDone && timeline.slice(0, i).every(t => !!t.time);
          const isEditing = editando === item.key;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isDone || isNext ? 1 : 0.5, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${isDone ? 'bg-slate-50 dark:bg-slate-800' : isNext ? 'bg-cyan-50 dark:bg-cyan-950 border border-cyan-200/50 dark:border-cyan-800/50' : 'opacity-50'}`}
            >
              <motion.div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md ${isDone ? '' : 'grayscale'}`} initial={isDone ? { scale: 0 } : {}} animate={isDone ? { scale: 1 } : {}} transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }}>
                <Icon className="w-5 h-5 text-white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</div>
                {isEditing && isDone ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="time" value={horaEditada} onChange={(e) => setHoraEditada(e.target.value)} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-cyan-300 dark:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-800 dark:text-white" />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onSalvarEdicao(item.key)} disabled={salvandoEdicao} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                      {salvandoEdicao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={onCancelarEdicao} className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                ) : (
                  <button onClick={() => isDone && onIniciarEdicao(item.key, item.time!)} className={`text-xs flex items-center gap-1 mt-0.5 ${isDone ? 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer' : 'text-slate-400 dark:text-slate-500 cursor-default'}`} disabled={!isDone}>
                    {item.time ? <>{fmtHora(item.time)}</> : isNext ? 'Aguardando...' : '—'}
                  </button>
                )}
              </div>

              {isDone && !isEditing && (
                <div className="flex items-center gap-1">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onHaptic?.(); onIniciarEdicao(item.key, item.time!); }} aria-label={`Editar ${item.label}`} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onHaptic?.(); onRemoverPonto(item.key); }} disabled={removendo === item.key} aria-label={`Excluir ${item.label}`} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50">
                    {removendo === item.key ? <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  </motion.button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

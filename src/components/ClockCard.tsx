import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Registro, Profile } from '@/types';
import { fmtHora, mensagemPrevisao } from '@/lib/time-utils';
import { Clock } from 'lucide-react';

// Hooks
import { useWorkDay } from '@/hooks/useWorkDay';
import { useWorkSchedule } from '@/hooks/useWorkSchedule';

// Subcomponentes
import { DigitalClock } from './clock/DigitalClock';
import { WorkdayProgress } from './clock/WorkdayProgress';
import { PunchActions } from './clock/PunchActions';
import { PunchTimeline } from './clock/PunchTimeline';
import { OfflineStatusBadge } from './clock/OfflineStatusBadge';

interface ClockCardProps {
  registro: Registro | null;
  profile: Profile | null;
  onRegistrar: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onEditar: (id: string, updates: Partial<Registro>) => Promise<void>;
  onRemoverPonto: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onSync: () => Promise<void>;
  pendingCount: number;
  isOnline: boolean;
  onHaptic?: () => void;
}

export default function ClockCard({ registro, profile, onRegistrar, onEditar, onRemoverPonto, onSync, pendingCount, isOnline, onHaptic }: ClockCardProps) {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [editando, setEditando] = useState<'entrada' | 'intervalo' | 'retorno' | 'saida' | null>(null);
  const [horaEditada, setHoraEditada] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);

  const { workedMinutes, balance } = useWorkDay(registro, profile);
  const { jornadaStr } = useWorkSchedule(profile);

  function proximoTipo(): 'entrada' | 'intervalo' | 'retorno' | 'saida' | null {
    if (!registro || !registro.entrada) return 'entrada';
    if (!registro.intervalo) return 'intervalo';
    if (!registro.retorno) return 'retorno';
    if (!registro.saida) return 'saida';
    return null;
  }

  async function handleRegistrar(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    setCarregando(tipo);
    try {
      await onRegistrar(tipo);
    } finally {
      setCarregando(null);
    }
  }

  async function handleSalvarEdicao(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    if (!registro?.id || !horaEditada) return;
    setSalvandoEdicao(true);
    try {
      await onEditar(registro.id, { [tipo]: horaEditada });
      setEditando(null);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleRemoverPontoLocal(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    setRemovendo(tipo);
    try {
      await onRemoverPonto(tipo);
    } finally {
      setRemovendo(null);
    }
  }

  async function handleAjusteFino(id: string, updates: Partial<Registro>) {
    setAjustando(true);
    try {
      await onEditar(id, updates);
    } finally {
      setAjustando(false);
    }
  }

  function iniciarEdicao(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida', hora: string) {
    setHoraEditada(fmtHora(hora));
    setEditando(tipo);
  }

  function cancelarEdicao() {
    setEditando(null);
    setHoraEditada('');
  }

  const proximo = proximoTipo();

  return (
    <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-4 pb-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[300px] bg-gradient-to-b from-primary-start/20 via-primary-end/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="ios-card rounded-2xl p-6 text-center shadow-xl">
          <motion.div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 mb-2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </motion.div>
          
          <div className="flex flex-col items-center gap-2 mb-4">
            <DigitalClock />
            <OfflineStatusBadge />
          </div>

          <AnimatePresence mode="wait">
            {(function () {
              const msg = mensagemPrevisao(registro?.entrada || null, registro?.saida || null, registro?.intervalo || null, registro?.retorno || null, profile?.jornada || '08:00');
              const cores = { 
                info: 'bg-info/10 text-info border border-info/20', 
                warning: 'bg-warning/10 text-warning border border-warning/20', 
                success: 'bg-success/10 text-success border border-success/20', 
                neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent' 
              };
              return (
                <motion.div key={msg.texto} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className={`mt-4 text-sm font-medium rounded-xl px-4 py-3 ${cores[msg.tipo]}`}>
                  {msg.texto}
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="ios-card rounded-2xl p-6 shadow-xl">
          <PunchActions 
            proximo={proximo}
            carregando={carregando}
            ajustando={ajustando}
            registro={registro}
            onRegistrar={handleRegistrar}
            onEditar={handleAjusteFino}
          />

          <WorkdayProgress 
            minutosTrabalhados={workedMinutes}
            saldo={balance}
            jornadaStr={jornadaStr}
          />
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <PunchTimeline 
          registro={registro}
          editando={editando}
          horaEditada={horaEditada}
          salvandoEdicao={salvandoEdicao}
          removendo={removendo}
          onHaptic={onHaptic}
          onIniciarEdicao={iniciarEdicao}
          onCancelarEdicao={cancelarEdicao}
          onSalvarEdicao={handleSalvarEdicao}
          onRemoverPonto={handleRemoverPontoLocal}
          setHoraEditada={setHoraEditada}
        />
      </motion.div>

      {!isOnline && pendingCount > 0 && (
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onSync} className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all">
            Sincronizar {pendingCount} registro{pendingCount !== 1 ? 's' : ''}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}

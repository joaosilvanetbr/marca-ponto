import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Registro, Profile } from '@/types';
import { agora, paraHora, fmtHora, calcularMinutosTrabalhados, calcularSaldoDia, paraMinutos, mensagemPrevisao, hoje } from '@/lib/time-utils';
import { isFeriadoNacional } from '@/lib/feriados';
import { Clock, LogIn, Coffee, Play, LogOut, Loader2, WifiOff, Save, X, Pencil, Trash2, PartyPopper, Minus, Plus } from 'lucide-react';

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

function DigitalClock() {
  const [horaAtual, setHoraAtual] = useState(agora());

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(agora()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="text-6xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums" 
      key={horaAtual} 
      initial={{ scale: 0.98, opacity: 0.8 }} 
      animate={{ scale: 1, opacity: 1 }} 
      transition={{ duration: 0.2 }}
    >
      {horaAtual}
    </motion.div>
  );
}

export default function ClockCard({ registro, profile, onRegistrar, onEditar, onRemoverPonto, onSync, pendingCount, isOnline, onHaptic }: ClockCardProps) {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [editando, setEditando] = useState<'entrada' | 'intervalo' | 'retorno' | 'saida' | null>(null);
  const [horaEditada, setHoraEditada] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [ajustando, setAjustando] = useState(false);

  const minutosTrabalhados = calcularMinutosTrabalhados(
    registro?.entrada || null,
    registro?.intervalo || null,
    registro?.retorno || null,
    registro?.saida || null
  );

  const saldo = profile ? calcularSaldoDia(minutosTrabalhados, paraMinutos(profile.jornada)) : 0;
  const jornadaStr = profile?.jornada || '08:00';

  const feriadoHoje = isFeriadoNacional(hoje());
  const isHojeFeriado = !!feriadoHoje;

  const timeline = [
    { key: 'entrada' as const, label: 'Entrada', icon: LogIn, time: registro?.entrada, color: 'from-emerald-400 to-emerald-500' },
    { key: 'intervalo' as const, label: 'Intervalo', icon: Coffee, time: registro?.intervalo, color: 'from-amber-400 to-amber-500' },
    { key: 'retorno' as const, label: 'Retorno', icon: Play, time: registro?.retorno, color: 'from-blue-400 to-blue-500' },
    { key: 'saida' as const, label: 'Saída', icon: LogOut, time: registro?.saida, color: 'from-rose-400 to-rose-500' },
  ];

  function proximoTipo(): 'entrada' | 'intervalo' | 'retorno' | 'saida' | null {
    if (!registro || !registro.entrada) return 'entrada';
    if (!registro.intervalo) return 'intervalo';
    if (!registro.retorno) return 'retorno';
    if (!registro.saida) return 'saida';
    return null;
  }

  async function handleClick(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    setCarregando(tipo);
    try {
      await onRegistrar(tipo);
    } finally {
      setCarregando(null);
    }
  }

  async function salvarEdicao(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    if (!registro?.id || !horaEditada) return;
    setSalvandoEdicao(true);
    try {
      await onEditar(registro.id, { [tipo]: horaEditada });
      setEditando(null);
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleRemover(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    setRemovendo(tipo);
    try {
      await onRemoverPonto(tipo);
    } finally {
      setRemovendo(null);
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
      {/* Aura de Fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[300px] bg-gradient-to-b from-primary-start/20 via-primary-end/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      
      {/* Relógio + Previsão */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="ios-card rounded-2xl p-6 text-center shadow-xl">
          <motion.div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 mb-2" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}>
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </motion.div>
          
          <DigitalClock />

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

          {!isOnline && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 flex items-center justify-center gap-1.5 text-warning text-sm font-medium">
              <WifiOff className="w-4 h-4" />
              <span>Modo offline — {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
            </motion.div>
          )}

          {isHojeFeriado && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center justify-center gap-1.5 text-destructive text-sm font-medium">
              <PartyPopper className="w-4 h-4" />
              <span>Hoje é feriado nacional — {feriadoHoje!.nome}</span>
            </motion.div>
          )}

        </div>
      </motion.div>

      {/* Botão principal / Jornada completa */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="ios-card rounded-2xl p-6 shadow-xl">
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
                onClick={() => handleClick(proximo)}
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
                  onClick={async () => {
                    const ultimoTipo = ['saida', 'retorno', 'intervalo', 'entrada'].find((t) => registro[t as keyof Registro]) as 'entrada' | 'intervalo' | 'retorno' | 'saida' | undefined;
                    if (!ultimoTipo || !registro[ultimoTipo]) return;
                    setAjustando(true);
                    const [h, m] = registro[ultimoTipo]!.split(':').map(Number);
                    const novoMin = h * 60 + m + min;
                    const novoHora = `${String(Math.floor(novoMin / 60)).padStart(2, '0')}:${String(Math.max(0, novoMin % 60)).padStart(2, '0')}`;
                    try {
                      await onEditar(registro.id!, { [ultimoTipo]: novoHora });
                    } finally {
                      setAjustando(false);
                    }
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

          {/* Resumo */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-2xl bg-secondary/50 dark:bg-secondary/20 p-4 text-center border border-border/50">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Trabalhado</div>
              <motion.div key={minutosTrabalhados} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="text-xl font-bold text-foreground mt-1 tabular-nums tracking-tight">
                {paraHora(minutosTrabalhados)}
              </motion.div>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="rounded-2xl bg-secondary/50 dark:bg-secondary/20 p-4 text-center border border-border/50">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Saldo</div>
              <motion.div key={saldo} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className={`text-xl font-bold mt-1 tabular-nums tracking-tight ${saldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                {saldo >= 0 ? '+' : ''}{paraHora(saldo)}
              </motion.div>
            </motion.div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Meta Diária: {jornadaStr}</span>
          </div>


        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}>
        <div className="ios-card rounded-2xl p-6 shadow-xl relative">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6 relative z-10">Timeline da Jornada</h3>
          <div className="space-y-6 relative z-10">
            {/* Conector Vertical da Timeline */}
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
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => salvarEdicao(item.key)} disabled={salvandoEdicao} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                          {salvandoEdicao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={cancelarEdicao} className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    ) : (
                      <button onClick={() => isDone && iniciarEdicao(item.key, item.time!)} className={`text-xs flex items-center gap-1 mt-0.5 ${isDone ? 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer' : 'text-slate-400 dark:text-slate-500 cursor-default'}`} disabled={!isDone}>
                        {item.time ? <>{fmtHora(item.time)}</> : isNext ? 'Aguardando...' : '—'}
                      </button>
                    )}
                  </div>

                  {isDone && !isEditing && (
                    <div className="flex items-center gap-1">
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onHaptic?.(); iniciarEdicao(item.key, item.time!); }} aria-label={`Editar ${item.label}`} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <Pencil className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => { onHaptic?.(); handleRemover(item.key); }} disabled={removendo === item.key} aria-label={`Excluir ${item.label}`} className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50">
                        {removendo === item.key ? <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Sync */}
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

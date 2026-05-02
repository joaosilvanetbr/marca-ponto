import { useState, useEffect } from 'react';
import type { Registro, Profile } from '@/types';
import { agora, paraHora, calcularMinutosTrabalhados, calcularSaldoDia, jornadaParaMinutos } from '@/lib/time-utils';
import { Clock, LogIn, Coffee, Play, LogOut, CheckCircle2, Loader2, WifiOff, Save, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface ClockCardProps {
  registro: Registro | null;
  profile: Profile | null;
  onRegistrar: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onEditar: (id: number, updates: Partial<Registro>) => Promise<void>;
  onRemoverPonto: (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => Promise<void>;
  onLimparDia: () => Promise<void>;
  onSync: () => Promise<void>;
  pendingCount: number;
  isOnline: boolean;
}

export default function ClockCard({ registro, profile, onRegistrar, onEditar, onRemoverPonto, onLimparDia, onSync, pendingCount, isOnline }: ClockCardProps) {
  const [horaAtual, setHoraAtual] = useState(agora());
  const [carregando, setCarregando] = useState<string | null>(null);
  const [editando, setEditando] = useState<'entrada' | 'intervalo' | 'retorno' | 'saida' | null>(null);
  const [horaEditada, setHoraEditada] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  const [limpando, setLimpando] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(agora()), 1000);
    return () => clearInterval(timer);
  }, []);

  const minutosTrabalhados = calcularMinutosTrabalhados(
    registro?.entrada || null,
    registro?.intervalo || null,
    registro?.retorno || null,
    registro?.saida || null
  );

  const saldo = profile
    ? calcularSaldoDia(minutosTrabalhados, jornadaParaMinutos(profile.jornada), profile.tolerancia)
    : 0;

  const jornadaStr = profile?.jornada || '08:00';

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

  function iniciarEdicao(tipo: typeof editando, horaAtual: string) {
    setEditando(tipo);
    setHoraEditada(horaAtual);
  }

  function cancelarEdicao() {
    setEditando(null);
    setHoraEditada('');
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

  async function handleLimparDia() {
    if (!confirmarLimpar) {
      setConfirmarLimpar(true);
      return;
    }
    setLimpando(true);
    try {
      await onLimparDia();
      setConfirmarLimpar(false);
    } finally {
      setLimpando(false);
    }
  }

  const proximo = proximoTipo();

  return (
    <div className="space-y-4 pb-24">
      {/* Relógio */}
      <div className="glass rounded-3xl p-6 text-center shadow-xl">
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <div className="text-6xl font-bold text-slate-800 dark:text-white tracking-tight tabular-nums">
          {horaAtual}
        </div>
        {!isOnline && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-amber-500 text-sm">
            <WifiOff className="w-4 h-4" />
            <span>Modo offline — {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Botão principal */}
      <div className="glass rounded-3xl p-6 shadow-xl">
        {proximo ? (
          <button
            onClick={() => handleClick(proximo)}
            disabled={!!carregando}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
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
          </button>
        ) : (
          <div className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            Jornada completa!
          </div>
        )}

        {/* Resumo do dia */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Trabalhado</div>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">{paraHora(minutosTrabalhados)}</div>
          </div>
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Saldo</div>
            <div className={`text-xl font-bold mt-1 tabular-nums ${saldo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {saldo >= 0 ? '+' : ''}{paraHora(saldo)}
            </div>
          </div>
        </div>
        <div className="mt-3 text-center flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">Jornada: {jornadaStr} | Tolerância: {profile?.tolerancia || 10}min</span>
        </div>
        {/* Limpar dia */}
        {registro && (registro.entrada || registro.intervalo || registro.retorno || registro.saida) && (
          <div className="mt-4">
            {confirmarLimpar ? (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Tem certeza? Isso apaga todos os pontos do dia.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleLimparDia}
                    disabled={limpando}
                    className="flex-1 py-2 rounded-lg bg-rose-500 text-white text-sm font-semibold shadow-md hover:bg-rose-600 transition-colors disabled:opacity-60"
                  >
                    {limpando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sim, apagar tudo'}
                  </button>
                  <button
                    onClick={() => setConfirmarLimpar(false)}
                    disabled={limpando}
                    className="flex-1 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLimparDia}
                className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-800/50 text-rose-500 dark:text-rose-400 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Limpar registro do dia
              </button>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="glass rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Timeline do dia</h3>
        <div className="space-y-3">
          {timeline.map((item, i) => {
            const Icon = item.icon;
            const isDone = !!item.time;
            const isNext = !isDone && timeline.slice(0, i).every(t => !!t.time);
            const isEditing = editando === item.key;

            return (
              <div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isDone ? 'bg-white/60 dark:bg-slate-800/60' : isNext ? 'bg-cyan-50/50 dark:bg-cyan-900/20 border border-cyan-200/50 dark:border-cyan-800/50' : 'opacity-50'}`}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md ${isDone ? '' : 'grayscale'}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</div>
                  {isEditing && isDone ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="time"
                        value={horaEditada}
                        onChange={(e) => setHoraEditada(e.target.value)}
                        className="px-2 py-1 rounded-lg bg-white/80 dark:bg-slate-700/80 border border-cyan-300 dark:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm text-slate-800 dark:text-white"
                        step="1"
                      />
                      <button
                        onClick={() => salvarEdicao(item.key)}
                        disabled={salvandoEdicao}
                        className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        {salvandoEdicao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={cancelarEdicao}
                        className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => isDone && iniciarEdicao(item.key, item.time!)}
                      className={`text-xs flex items-center gap-1 mt-0.5 ${isDone ? 'text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 cursor-pointer' : 'text-slate-400 dark:text-slate-500 cursor-default'}`}
                      disabled={!isDone}
                    >
                      {item.time ? (
                        <>
                          {item.time}
                          <Pencil className="w-3 h-3 opacity-60" />
                        </>
                      ) : (
                        isNext ? 'Aguardando...' : '—'
                      )}
                    </button>
                  )}
                </div>

                {isDone && !isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => iniciarEdicao(item.key, item.time!)}
                      className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleRemover(item.key)}
                      disabled={removendo === item.key}
                      className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                      title="Excluir ponto"
                    >
                      {removendo === item.key ? <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync button if offline */}
      {!isOnline && pendingCount > 0 && (
        <button
          onClick={onSync}
          className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 active:scale-[0.98] transition-all"
        >
          Sincronizar {pendingCount} registro{pendingCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}

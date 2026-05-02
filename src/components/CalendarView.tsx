import { useState, useMemo } from 'react';
import type { DiaCalendario } from '@/types';
import { mesAtual, diasDoMes, nomeDiaSemana, formatarMesAno } from '@/lib/time-utils';
import { ChevronLeft, ChevronRight, CalendarDays, Trash2, Loader2, PartyPopper, Umbrella, HeartPulse, Briefcase } from 'lucide-react';

interface CalendarViewProps {
  calendario: DiaCalendario[];
  onMarcar: (data: string, tipo: DiaCalendario['tipo'], descricao: string | null) => Promise<void>;
  onRemover: (data: string) => Promise<void>;
}

const tiposConfig: { tipo: DiaCalendario['tipo']; label: string; icon: typeof PartyPopper; cor: string; bg: string; darkBg: string }[] = [
  { tipo: 'feriado', label: 'Feriado', icon: PartyPopper, cor: 'text-rose-600', bg: 'bg-rose-100', darkBg: 'dark:bg-rose-900/40' },
  { tipo: 'folga', label: 'Folga', icon: Umbrella, cor: 'text-emerald-600', bg: 'bg-emerald-100', darkBg: 'dark:bg-emerald-900/40' },
  { tipo: 'licenca', label: 'Licença', icon: Briefcase, cor: 'text-amber-600', bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/40' },
  { tipo: 'atestado', label: 'Atestado', icon: HeartPulse, cor: 'text-blue-600', bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/40' },
];

export default function CalendarView({ calendario, onMarcar, onRemover }: CalendarViewProps) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<DiaCalendario['tipo']>('feriado');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);

  const calendarioMap = useMemo(() => {
    const map = new Map<string, DiaCalendario>();
    for (const c of calendario) {
      map.set(c.data, c);
    }
    return map;
  }, [calendario]);

  const dias = useMemo(() => diasDoMes(mesSelecionado), [mesSelecionado]);

  function mudarMes(delta: number) {
    const [y, m] = mesSelecionado.split('-').map(Number);
    const novo = new Date(y, m - 1 + delta, 1);
    const novoMes = `${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}`;
    setMesSelecionado(novoMes);
    setDiaSelecionado(null);
  }

  function getDiaConfig(data: string) {
    const item = calendarioMap.get(data);
    if (!item) return null;
    return tiposConfig.find((t) => t.tipo === item.tipo) || null;
  }

  async function handleSalvar() {
    if (!diaSelecionado) return;
    setSalvando(true);
    try {
      await onMarcar(diaSelecionado, tipoSelecionado, descricao.trim() || null);
      setDiaSelecionado(null);
      setDescricao('');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(data: string) {
    setDeletando(data);
    try {
      await onRemover(data);
      if (diaSelecionado === data) setDiaSelecionado(null);
    } finally {
      setDeletando(null);
    }
  }

  const [ano, mesNum] = mesSelecionado.split('-').map(Number);
  const primeiroDiaSemana = new Date(ano, mesNum - 1, 1).getDay();

  return (
    <div className="space-y-4 pb-24">
      {/* Header do mês */}
      <div className="glass rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <button onClick={() => mudarMes(-1)} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
            <CalendarDays className="w-5 h-5 text-cyan-500" />
            {formatarMesAno(mesSelecionado + '-01')}
          </div>
          <button onClick={() => mudarMes(1)} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="glass rounded-2xl p-3 shadow-xl">
        <div className="flex flex-wrap gap-2 justify-center">
          {tiposConfig.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.tipo} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${t.bg} ${t.darkBg}`}>
                <Icon className={`w-3.5 h-3.5 ${t.cor}`} />
                <span className={`text-xs font-medium ${t.cor}`}>{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid do calendário */}
      <div className="glass rounded-3xl p-4 shadow-xl">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {dias.map((dia) => {
            const config = getDiaConfig(dia);
            const isHoje = dia === new Date().toISOString().split('T')[0];
            const isSelecionado = diaSelecionado === dia;
            const Icon = config?.icon;

            return (
              <button
                key={dia}
                onClick={() => {
                  setDiaSelecionado(isSelecionado ? null : dia);
                  if (calendarioMap.get(dia)) {
                    setTipoSelecionado(calendarioMap.get(dia)!.tipo);
                    setDescricao(calendarioMap.get(dia)!.descricao || '');
                  }
                }}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                  isSelecionado
                    ? 'ring-2 ring-cyan-400 bg-cyan-50 dark:bg-cyan-900/30'
                    : config
                      ? `${config.bg} ${config.darkBg}`
                      : 'hover:bg-white/40 dark:hover:bg-slate-800/40'
                } ${isHoje && !config ? 'bg-slate-100 dark:bg-slate-800/50 font-bold' : ''}`}
              >
                <span className={`text-sm ${config ? config.cor : 'text-slate-700 dark:text-slate-200'}`}>
                  {dia.split('-')[2]}
                </span>
                {Icon && <Icon className={`w-3.5 h-3.5 mt-0.5 ${config?.cor}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel de edição do dia selecionado */}
      {diaSelecionado && (
        <div className="glass rounded-3xl p-5 shadow-xl space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {nomeDiaSemana(diaSelecionado)}, {diaSelecionado.split('-')[2]}/{diaSelecionado.split('-')[1]}
            </h3>
            {calendarioMap.get(diaSelecionado) && (
              <button
                onClick={() => handleRemover(diaSelecionado)}
                disabled={deletando === diaSelecionado}
                className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
              >
                {deletando === diaSelecionado ? <Loader2 className="w-4 h-4 text-rose-500 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
              </button>
            )}
          </div>

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {tiposConfig.map((t) => {
              const Icon = t.icon;
              const ativo = tipoSelecionado === t.tipo;
              return (
                <button
                  key={t.tipo}
                  onClick={() => setTipoSelecionado(t.tipo)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    ativo
                      ? `${t.bg} ${t.darkBg} ${t.cor} ring-1 ring-current`
                      : 'bg-white/40 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Feriado nacional, Consulta médica..."
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CalendarDays className="w-5 h-5" /> Salvar no Calendário</>}
          </button>
        </div>
      )}

      {/* Lista de dias marcados no mês */}
      <div className="glass rounded-3xl p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Dias marcados neste mês
        </h3>
        <div className="space-y-2 max-h-[30vh] overflow-y-auto">
          {calendario.filter((c) => c.data.startsWith(mesSelecionado)).length === 0 ? (
            <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">Nenhum dia marcado</div>
          ) : (
            calendario
              .filter((c) => c.data.startsWith(mesSelecionado))
              .map((item) => {
                const config = tiposConfig.find((t) => t.tipo === item.tipo);
                const Icon = config?.icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/30 dark:bg-slate-800/30">
                    <div className={`w-9 h-9 rounded-lg ${config?.bg} ${config?.darkBg} flex items-center justify-center`}>
                      {Icon && <Icon className={`w-4 h-4 ${config?.cor}`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.data.split('-')[2]}/{item.data.split('-')[1]} — {config?.label}
                      </div>
                      {item.descricao && <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.descricao}</div>}
                    </div>
                    <button
                      onClick={() => handleRemover(item.data)}
                      disabled={deletando === item.data}
                      className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                    >
                      {deletando === item.data ? <Loader2 className="w-4 h-4 text-rose-500 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
                    </button>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

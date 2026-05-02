import { useState, useMemo } from 'react';
import type { Registro, Profile, DiaCalendario } from '@/types';
import { mesAtual, diasDoMes, nomeDiaSemana, calcularMinutosTrabalhados, calcularSaldoDia, jornadaParaMinutos, paraHora, formatarMesAno } from '@/lib/time-utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, Clock, CalendarDays, PartyPopper, Umbrella, HeartPulse, Briefcase } from 'lucide-react';

interface BankHistoryProps {
  registros: Registro[];
  calendario: DiaCalendario[];
  profile: Profile | null;
  onEdit: (registro: Registro) => void;
  onDelete: (id: number) => Promise<void>;
}

const iconMap = {
  feriado: PartyPopper,
  folga: Umbrella,
  licenca: Briefcase,
  atestado: HeartPulse,
};

const corMap = {
  feriado: 'text-rose-500',
  folga: 'text-emerald-500',
  licenca: 'text-amber-500',
  atestado: 'text-blue-500',
};

export default function BankHistory({ registros, calendario, profile, onEdit, onDelete }: BankHistoryProps) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [deletando, setDeletando] = useState<number | null>(null);

  const jornadaMin = profile ? jornadaParaMinutos(profile.jornada) : 480;
  const tolerancia = profile?.tolerancia || 10;

  const registrosMap = useMemo(() => {
    const map = new Map<string, Registro>();
    for (const r of registros) {
      map.set(r.data, r);
    }
    return map;
  }, [registros]);

  const calendarioMap = useMemo(() => {
    const map = new Map<string, DiaCalendario>();
    for (const c of calendario) {
      map.set(c.data, c);
    }
    return map;
  }, [calendario]);

  const dias = useMemo(() => diasDoMes(mesSelecionado), [mesSelecionado]);

  const dados = useMemo(() => {
    let totalTrabalhado = 0;
    let saldoMes = 0;
    const items = [];

    for (const dia of dias) {
      const reg = registrosMap.get(dia);
      const cal = calendarioMap.get(dia);

      if (reg) {
        const trab = calcularMinutosTrabalhados(reg.entrada, reg.intervalo, reg.retorno, reg.saida);
        const saldo = calcularSaldoDia(trab, jornadaMin, tolerancia);
        totalTrabalhado += trab;
        saldoMes += saldo;
        items.push({ data: dia, reg, cal, trab, saldo });
      } else if (cal) {
        // Dia marcado no calendário (feriado/folga) - não conta como falta
        items.push({ data: dia, reg: null, cal, trab: 0, saldo: 0 });
      } else {
        const hojeStr = new Date().toISOString().split('T')[0];
        if (dia <= hojeStr) {
          const semana = new Date(dia + 'T12:00:00').getDay();
          if (semana !== 0 && semana !== 6) {
            saldoMes -= jornadaMin;
            items.push({ data: dia, reg: null, cal: null, trab: 0, saldo: -jornadaMin });
          }
        }
      }
    }

    return { items, totalTrabalhado, saldoMes };
  }, [dias, registrosMap, calendarioMap, jornadaMin, tolerancia]);

  function mudarMes(delta: number) {
    const [y, m] = mesSelecionado.split('-').map(Number);
    const novo = new Date(y, m - 1 + delta, 1);
    const novoMes = `${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}`;
    setMesSelecionado(novoMes);
  }

  async function handleDelete(id: number) {
    setDeletando(id);
    try {
      await onDelete(id);
    } finally {
      setDeletando(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      {/* Header do mês */}
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="glass rounded-3xl p-4 shadow-xl">
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
      </motion.div>

      {/* Resumo do mês */}
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="glass rounded-3xl p-5 shadow-xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total Trabalhado</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">{paraHora(dados.totalTrabalhado)}</div>
          </div>
          <div className="rounded-2xl bg-white/40 dark:bg-slate-800/40 p-4 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Saldo do Mês</div>
            <div className={`text-2xl font-bold mt-1 tabular-nums ${dados.saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {dados.saldoMes >= 0 ? '+' : ''}{paraHora(dados.saldoMes)}
            </div>
          </div>
        </div>
        {profile && (
          <div className="mt-3 text-center">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Saldo inicial: {paraHora(profile.saldo_inicial)} | Acumulado: {dados.saldoMes >= 0 ? '+' : ''}{paraHora(dados.saldoMes + profile.saldo_inicial)}
            </span>
          </div>
        )}
      </motion.div>

      {/* Lista de dias */}
      <div className="glass rounded-3xl p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Registros do mês
        </h3>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {dados.items.map((item) => {
            const isHoje = item.data === new Date().toISOString().split('T')[0];
            const temRegistro = !!item.reg;
            const temCalendario = !!item.cal;
            const CalIcon = temCalendario ? iconMap[item.cal!.tipo] : null;

            return (
              <motion.div
                key={item.data}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  isHoje ? 'bg-cyan-50/50 dark:bg-cyan-900/20 border border-cyan-200/50 dark:border-cyan-800/50' : 'bg-white/30 dark:bg-slate-800/30'
                }`}
              >
                <div className="text-center min-w-[3rem]">
                  <div className="text-xs text-slate-400 dark:text-slate-500">{nomeDiaSemana(item.data)}</div>
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-200">{item.data.split('-')[2]}</div>
                </div>

                <div className="flex-1 min-w-0">
                  {temRegistro ? (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {item.reg!.entrada && <span className="text-slate-600 dark:text-slate-300">E: {item.reg!.entrada}</span>}
                      {item.reg!.intervalo && <span className="text-slate-600 dark:text-slate-300">I: {item.reg!.intervalo}</span>}
                      {item.reg!.retorno && <span className="text-slate-600 dark:text-slate-300">R: {item.reg!.retorno}</span>}
                      {item.reg!.saida && <span className="text-slate-600 dark:text-slate-300">S: {item.reg!.saida}</span>}
                    </div>
                  ) : temCalendario ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      {CalIcon && <CalIcon className={`w-4 h-4 ${corMap[item.cal!.tipo]}`} />}
                      <span className={`font-medium ${corMap[item.cal!.tipo]}`}>
                        {item.cal!.tipo === 'feriado' && 'Feriado'}
                        {item.cal!.tipo === 'folga' && 'Folga'}
                        {item.cal!.tipo === 'licenca' && 'Licença'}
                        {item.cal!.tipo === 'atestado' && 'Atestado'}
                      </span>
                      {item.cal!.descricao && <span className="text-slate-400 dark:text-slate-500 text-xs truncate">— {item.cal!.descricao}</span>}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">Sem registro</span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">{paraHora(item.trab)}</span>
                    {!temCalendario && (
                      <span className={`text-xs font-semibold tabular-nums ${item.saldo >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.saldo >= 0 ? '+' : ''}{paraHora(item.saldo)}
                      </span>
                    )}
                  </div>
                </div>

                {temRegistro && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item.reg!)}
                      className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.reg!.id!)}
                      disabled={deletando === item.reg!.id}
                      className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                    >
                      {deletando === item.reg!.id ? (
                        <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}

          {dados.items.length === 0 && (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              Nenhum registro neste mês
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

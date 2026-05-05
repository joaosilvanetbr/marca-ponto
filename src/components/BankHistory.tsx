import { useState, useMemo, useRef } from 'react';
import type { Registro, Profile, DiaCalendario } from '@/types';
import { mesAtual, diasDoMes, nomeDiaSemana, fmtHora, calcularMinutosTrabalhados, calcularSaldoDia, jornadaParaMinutos, paraHora, formatarMesAno } from '@/lib/time-utils';
import { getFeriadosNacionais, type FeriadoInfo } from '@/lib/feriados';
import { useCalendario } from '@/hooks/useCalendario';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, Clock, CalendarDays, Download, Filter, PartyPopper, Umbrella, HeartPulse, Briefcase } from 'lucide-react';

type Filtro = 'todos' | 'com_registro' | 'sem_registro';

interface BankHistoryProps {
  registros: Registro[];
  profile: Profile | null;
  userId: string | null;
  onEdit: (registro: Registro) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function BankHistory({ registros, profile, userId, onEdit, onDelete }: BankHistoryProps) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [deletando, setDeletando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const jornadaMin = profile ? jornadaParaMinutos(profile.jornada) : 480;
  const tolerancia = profile?.tolerancia || 10;

  const registrosMap = useMemo(() => {
    const map = new Map<string, Registro>();
    for (const r of registros) map.set(r.data, r);
    return map;
  }, [registros]);

  const { data: calendario = [] } = useCalendario(userId, mesSelecionado);

  const calendarioMap = useMemo(() => {
    const map = new Map<string, DiaCalendario>();
    for (const c of calendario) map.set(c.data, c);
    return map;
  }, [calendario]);

  const feriadosMap = useMemo(() => {
    const ano = parseInt(mesSelecionado.split('-')[0], 10);
    return getFeriadosNacionais(ano);
  }, [mesSelecionado]);

  const dias = useMemo(() => diasDoMes(mesSelecionado), [mesSelecionado]);

  const dados = useMemo(() => {
    let totalTrabalhado = 0;
    let saldoMes = 0;
    let diasComRegistro = 0;
    let diasSemRegistro = 0;
    const items = [];

    for (const dia of dias) {
      const reg = registrosMap.get(dia);
      const cal = calendarioMap.get(dia);
      const feriado = feriadosMap.get(dia);
      const isHoje = dia === new Date().toISOString().split('T')[0];
      const diaSemana = new Date(dia + 'T12:00:00').getDay();
      const isFuturo = dia > new Date().toISOString().split('T')[0];
      const isFimDeSemana = diaSemana === 0 || diaSemana === 6;

      if (reg) {
        const trab = calcularMinutosTrabalhados(reg.entrada, reg.intervalo, reg.retorno, reg.saida);
        const saldo = calcularSaldoDia(trab, jornadaMin, tolerancia);
        totalTrabalhado += trab;
        saldoMes += saldo;
        diasComRegistro++;
        items.push({ data: dia, reg, cal: cal ?? null, feriado: feriado ?? null, trab, saldo, isHoje, isFuturo, isFimDeSemana, status: 'completo' as const });
      } else if (cal && !isFuturo) {
        // Dia especial manual (folga, licenca, atestado, feriado customizado) — sem desconto de jornada
        items.push({ data: dia, reg: null, cal, feriado: feriado ?? null, trab: 0, saldo: 0, isHoje, isFuturo, isFimDeSemana, status: 'especial' as const });
      } else if (feriado && !isFuturo) {
        // Feriado nacional automático — sem desconto de jornada
        items.push({ data: dia, reg: null, cal: null, feriado, trab: 0, saldo: 0, isHoje, isFuturo, isFimDeSemana, status: 'especial' as const });
      } else if (!isFuturo && !isFimDeSemana) {
        saldoMes -= jornadaMin;
        diasSemRegistro++;
        items.push({ data: dia, reg: null, cal: null, feriado: null, trab: 0, saldo: -jornadaMin, isHoje, isFuturo, isFimDeSemana, status: 'faltante' as const });
      }
    }

    const saldoAcumulado = (profile?.saldo_inicial || 0) + saldoMes;
    return { items, totalTrabalhado, saldoMes, saldoAcumulado, diasComRegistro, diasSemRegistro };
  }, [dias, registrosMap, calendarioMap, feriadosMap, jornadaMin, tolerancia, profile?.saldo_inicial]);

  const itemsFiltrados = useMemo(() => {
    if (filtro === 'com_registro') return dados.items.filter(i => i.reg !== null);
    if (filtro === 'sem_registro') return dados.items.filter(i => i.status === 'faltante');
    return dados.items;
  }, [dados.items, filtro]);

  function mudarMes(delta: number) {
    const [y, m] = mesSelecionado.split('-').map(Number);
    const novo = new Date(y, m - 1 + delta, 1);
    setMesSelecionado(`${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}`);
  }

  async function handleDelete(id: string) {
    setDeletando(id);
    try { await onDelete(id); } finally { setDeletando(null); }
  }

  function exportarCSV() {
    const linhas = ['Data,Dia,Entrada,Intervalo,Retorno,Saida,Horas,Saldo,Observacao'];
    for (const item of dados.items) {
      const dia = item.data;
      const reg = item.reg;
      const entrada = reg?.entrada ? fmtHora(reg.entrada) : '';
      const intervalo = reg?.intervalo ? fmtHora(reg.intervalo) : '';
      const retorno = reg?.retorno ? fmtHora(reg.retorno) : '';
      const saida = reg?.saida ? fmtHora(reg.saida) : '';
      const horas = paraHora(item.trab);
      const saldo = paraHora(item.saldo);
      const observacao = reg?.observacao ? `"${reg.observacao.replace(/"/g, '""')}"` : '';
      linhas.push(`${dia},${nomeDiaSemana(dia)},${entrada},${intervalo},${retorno},${saida},${horas},${saldo},${observacao}`);
    }
    linhas.push('');
    linhas.push('RESUMO,,,,,,,');
    linhas.push(`Horas Trabalhadas,,,,,,,${paraHora(dados.totalTrabalhado)}`);
    linhas.push(`Saldo do mês,,,,,,,${dados.saldoMes >= 0 ? '+' : ''}${paraHora(dados.saldoMes)}`);
    if (profile && profile.saldo_inicial !== 0) {
      linhas.push(`Saldo inicial,,,,,,,${profile.saldo_inicial >= 0 ? '+' : ''}${paraHora(profile.saldo_inicial)}`);
      linhas.push(`Saldo acumulado,,,,,,,${dados.saldoAcumulado >= 0 ? '+' : ''}${paraHora(dados.saldoAcumulado)}`);
    }
    linhas.push(`Dias trabalhados,,,,,,,${dados.diasComRegistro}`);
    linhas.push(`Dias sem registro,,,,,,,${dados.diasSemRegistro}`);
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ponto-${mesSelecionado}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      {/* Header do mês */}
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }} className="ios-card rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => mudarMes(-1)} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </motion.button>
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
            <CalendarDays className="w-5 h-5 text-cyan-500" />
            {formatarMesAno(mesSelecionado + '-01')}
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => mudarMes(1)} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </motion.button>
        </div>
      </motion.div>

      {/* Resumo do mês */}
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }} className="ios-card rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Horas Trabalhadas</div>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">{paraHora(dados.totalTrabalhado)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Saldo do mês</div>
            <div className={`text-xl font-bold mt-1 tabular-nums ${dados.saldoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {dados.saldoMes >= 0 ? '+' : ''}{paraHora(dados.saldoMes)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Dias Trabalhados</div>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-1">{dados.diasComRegistro}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 p-3 text-center">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Média / dia</div>
            <div className="text-xl font-bold text-slate-800 dark:text-white mt-1 tabular-nums">
              {dados.diasComRegistro > 0 ? paraHora(Math.round(dados.totalTrabalhado / dados.diasComRegistro)) : '—'}
            </div>
          </div>
        </div>

        {/* Saldo acumulado */}
        {profile && profile.saldo_inicial !== 0 && (
          <div className="mt-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-3 text-center">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">Saldo acumulado</div>
            <div className={`text-xl font-bold mt-1 tabular-nums ${dados.saldoAcumulado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {dados.saldoAcumulado >= 0 ? '+' : ''}{paraHora(dados.saldoAcumulado)}
            </div>
            <div className="text-[10px] text-emerald-500/70 dark:text-emerald-500/50 mt-0.5">
              Inicial: {profile.saldo_inicial >= 0 ? '+' : ''}{paraHora(profile.saldo_inicial)} + Mês: {dados.saldoMes >= 0 ? '+' : ''}{paraHora(dados.saldoMes)}
            </div>
          </div>
        )}
      </motion.div>

      {/* Filtro + Export */}
      <div className="ios-card rounded-2xl p-3 shadow-xl flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
        <div className="flex gap-1 flex-1">
          {([
            { key: 'todos' as Filtro, label: 'Todos' },
            { key: 'com_registro' as Filtro, label: 'Com registro' },
            { key: 'sem_registro' as Filtro, label: 'Faltantes' },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f.key
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={exportarCSV}
          className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Exportar CSV"
        >
          <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </motion.button>
      </div>

      {/* Lista de dias — Virtual Scroll */}
      <div className="ios-card rounded-2xl p-4 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Registros do mês
        </h3>
        <VirtualDiaList
          items={itemsFiltrados}
          onEdit={onEdit}
          onDelete={handleDelete}
          deletando={deletando}
        />
      </div>
    </motion.div>
  );
}

/* ============================================
   VirtualDiaList — Lista virtualizada
   ============================================ */

interface DiaItem {
  data: string;
  reg: Registro | null;
  cal: DiaCalendario | null;
  feriado: FeriadoInfo | null;
  trab: number;
  saldo: number;
  isHoje: boolean;
  isFuturo: boolean;
  isFimDeSemana: boolean;
  status: 'completo' | 'faltante' | 'especial';
}

interface VirtualDiaListProps {
  items: DiaItem[];
  onEdit: (registro: Registro) => void;
  onDelete: (id: string) => Promise<void>;
  deletando: string | null;
}

const ITEM_HEIGHT = 88; // altura fixa estimada de cada linha

function VirtualDiaList({ items, onEdit, onDelete, deletando }: VirtualDiaListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual exposes imperative helpers; this usage stays local to the list.
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum registro encontrado</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tente alterar os filtros acima.</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[50vh] overflow-y-auto pr-1"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const temRegistro = !!item.reg;
          const isHoje = item.isHoje;

          return (
            <div
              key={item.data}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '8px',
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all h-full ${
                  isHoje ? 'bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800' :
                  temRegistro ? 'bg-slate-50 dark:bg-slate-800' :
                  item.status === 'especial' ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900' :
                  'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900'
                }`}
              >
                <div className="text-center min-w-[3rem]">
                  <div className={`text-xs ${
                    temRegistro ? 'text-slate-400 dark:text-slate-500' :
                    item.status === 'especial' ? 'text-violet-500 dark:text-violet-400' :
                    'text-amber-500 dark:text-amber-600'
                  }`}>{nomeDiaSemana(item.data)}</div>
                  <div className={`text-lg font-bold ${
                    temRegistro ? 'text-slate-700 dark:text-slate-200' :
                    item.status === 'especial' ? 'text-violet-700 dark:text-violet-400' :
                    'text-amber-700 dark:text-amber-400'
                  }`}>{item.data.split('-')[2]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  {temRegistro ? (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {item.reg!.entrada && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">E</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">{fmtHora(item.reg!.entrada)}</span>
                          </div>
                        )}
                        {item.reg!.intervalo && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">I</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">{fmtHora(item.reg!.intervalo)}</span>
                          </div>
                        )}
                        {item.reg!.retorno && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">R</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">{fmtHora(item.reg!.retorno)}</span>
                          </div>
                        )}
                        {item.reg!.saida && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">S</span>
                            </div>
                            <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">{fmtHora(item.reg!.saida)}</span>
                          </div>
                        )}
                      </div>
                      {item.reg?.observacao && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate italic">
                          “{item.reg.observacao}”
                        </div>
                      )}
                    </div>
                  ) : item.status === 'especial' ? (
                    <div className="flex items-center gap-1.5">
                      {item.cal?.tipo === 'feriado' && <PartyPopper className="w-4 h-4 text-rose-500" />}
                      {item.cal?.tipo === 'folga' && <Umbrella className="w-4 h-4 text-emerald-500" />}
                      {item.cal?.tipo === 'licenca' && <Briefcase className="w-4 h-4 text-amber-500" />}
                      {item.cal?.tipo === 'atestado' && <HeartPulse className="w-4 h-4 text-blue-500" />}
                      {item.feriado && <PartyPopper className="w-4 h-4 text-rose-500" />}
                      <span className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                        {item.cal
                          ? item.cal.tipo === 'feriado' ? 'Feriado' : item.cal.tipo === 'folga' ? 'Folga' : item.cal.tipo === 'licenca' ? 'Licença' : 'Atestado'
                          : item.feriado
                          ? `Feriado — ${item.feriado.nome}`
                          : 'Dia especial'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Dia sem registro</span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">{paraHora(item.trab)}</span>
                    <span className={`text-[10px] font-semibold tabular-nums ${item.saldo >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {item.saldo >= 0 ? '+' : ''}{paraHora(item.saldo)}
                    </span>
                  </div>
                </div>
                {temRegistro && (
                  <div className="flex items-center gap-1">
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => onEdit(item.reg!)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDelete(item.reg!.id!)} disabled={deletando === item.reg!.id} className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50">
                      {deletando === item.reg!.id ? <Loader2 className="w-4 h-4 text-rose-500 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

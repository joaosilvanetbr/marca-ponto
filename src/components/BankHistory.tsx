import { useState, useMemo, useRef } from 'react';
import type { Registro, Profile } from '@/types';
import { mesAtual, diasDoMes, nomeDiaSemana, fmtHora, calcularMinutosTrabalhados, calcularSaldoDia, jornadaParaMinutos, paraHora, formatarMesAno } from '@/lib/time-utils';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, Clock, CalendarDays, Download, Filter } from 'lucide-react';

type Filtro = 'todos' | 'com_registro' | 'sem_registro';

interface BankHistoryProps {
  registros: Registro[];
  profile: Profile | null;
  onEdit: (registro: Registro) => void;
  onDelete: (id: number) => Promise<void>;
}

export default function BankHistory({ registros, profile, onEdit, onDelete }: BankHistoryProps) {
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());
  const [deletando, setDeletando] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const jornadaMin = profile ? jornadaParaMinutos(profile.jornada) : 480;
  const tolerancia = profile?.tolerancia || 10;

  const registrosMap = useMemo(() => {
    const map = new Map<string, Registro>();
    for (const r of registros) map.set(r.data, r);
    return map;
  }, [registros]);

  const dias = useMemo(() => diasDoMes(mesSelecionado), [mesSelecionado]);

  const dados = useMemo(() => {
    let totalTrabalhado = 0;
    let saldoMes = 0;
    let diasComRegistro = 0;
    let diasSemRegistro = 0;
    const items = [];

    for (const dia of dias) {
      const reg = registrosMap.get(dia);
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
        items.push({ data: dia, reg, trab, saldo, isHoje, isFuturo, isFimDeSemana, status: 'completo' as const });
      } else if (!isFuturo && !isFimDeSemana) {
        saldoMes -= jornadaMin;
        diasSemRegistro++;
        items.push({ data: dia, reg: null, trab: 0, saldo: -jornadaMin, isHoje, isFuturo, isFimDeSemana, status: 'faltante' as const });
      }
    }

    return { items, totalTrabalhado, saldoMes, diasComRegistro, diasSemRegistro };
  }, [dias, registrosMap, jornadaMin, tolerancia]);

  const itemsFiltrados = useMemo(() => {
    if (filtro === 'com_registro') return dados.items.filter(i => i.reg !== null);
    if (filtro === 'sem_registro') return dados.items.filter(i => i.reg === null);
    return dados.items;
  }, [dados.items, filtro]);

  function mudarMes(delta: number) {
    const [y, m] = mesSelecionado.split('-').map(Number);
    const novo = new Date(y, m - 1 + delta, 1);
    setMesSelecionado(`${novo.getFullYear()}-${String(novo.getMonth() + 1).padStart(2, '0')}`);
  }

  async function handleDelete(id: number) {
    setDeletando(id);
    try { await onDelete(id); } finally { setDeletando(null); }
  }

  function exportarCSV() {
    const linhas = ['Data,Dia,Entrada,Intervalo,Retorno,Saida,Horas,Saldo'];
    for (const item of dados.items) {
      const dia = item.data;
      const reg = item.reg;
      const entrada = reg?.entrada ? fmtHora(reg.entrada) : '';
      const intervalo = reg?.intervalo ? fmtHora(reg.intervalo) : '';
      const retorno = reg?.retorno ? fmtHora(reg.retorno) : '';
      const saida = reg?.saida ? fmtHora(reg.saida) : '';
      const horas = paraHora(item.trab);
      const saldo = paraHora(item.saldo);
      linhas.push(`${dia},${nomeDiaSemana(dia)},${entrada},${intervalo},${retorno},${saida},${horas},${saldo}`);
    }
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
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Saldo</div>
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
  trab: number;
  saldo: number;
  isHoje: boolean;
  isFuturo: boolean;
  isFimDeSemana: boolean;
  status: 'completo' | 'faltante';
}

interface VirtualDiaListProps {
  items: DiaItem[];
  onEdit: (registro: Registro) => void;
  onDelete: (id: number) => Promise<void>;
  deletando: number | null;
}

const ITEM_HEIGHT = 88; // altura fixa estimada de cada linha

function VirtualDiaList({ items, onEdit, onDelete, deletando }: VirtualDiaListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        Nenhum registro encontrado com este filtro
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
                  'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900'
                }`}
              >
                <div className="text-center min-w-[3rem]">
                  <div className={`text-xs ${temRegistro ? 'text-slate-400 dark:text-slate-500' : 'text-amber-500 dark:text-amber-600'}`}>{nomeDiaSemana(item.data)}</div>
                  <div className={`text-lg font-bold ${temRegistro ? 'text-slate-700 dark:text-slate-200' : 'text-amber-700 dark:text-amber-400'}`}>{item.data.split('-')[2]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  {temRegistro ? (
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

import { motion } from 'framer-motion';
import { CalendarDays, Pencil, Trash2, Loader2, PartyPopper, Umbrella, Briefcase, HeartPulse } from 'lucide-react';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import { nomeDiaSemana, fmtHora, paraHora } from '@/lib/time-utils';
import type { Registro } from '@/types';
import type { HistoryItemData } from '@/hooks/useHistoryData';

interface HistoryListProps {
  items: HistoryItemData[];
  onEdit: (registro: Registro) => void;
  onDelete: (id: string) => Promise<void>;
  deletando: string | null;
}

const ITEM_HEIGHT = 88;

export function HistoryList({ items, onEdit, onDelete, deletando }: HistoryListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
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
    <div ref={parentRef} className="max-h-[50vh] overflow-y-auto pr-1">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <HistoryItem
            key={items[virtualItem.index].data}
            item={items[virtualItem.index]}
            virtualItem={virtualItem}
            onEdit={onEdit}
            onDelete={onDelete}
            deletando={deletando}
          />
        ))}
      </div>
    </div>
  );
}

interface HistoryItemProps {
  item: HistoryItemData;
  virtualItem: VirtualItem;
  onEdit: (registro: Registro) => void;
  onDelete: (id: string) => Promise<void>;
  deletando: string | null;
}

function HistoryItem({ item, virtualItem, onEdit, onDelete, deletando }: HistoryItemProps) {
  const temRegistro = !!item.reg;
  const isHoje = item.isHoje;

  return (
    <div
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
        className={`flex items-center gap-3 p-3 rounded-2xl transition-all h-full hover:shadow-md ${
          isHoje ? 'bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 hover:border-cyan-300 dark:hover:border-cyan-700' :
          temRegistro ? 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700' :
          item.status === 'especial' ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 hover:border-violet-200 dark:hover:border-violet-800' :
          'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 hover:border-amber-200 dark:hover:border-amber-800'
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
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate italic mt-1">
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
                  : 'Folga (Fim de escala)'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Dia sem registro</span>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-0.5 shrink-0 pl-3 border-l border-slate-200 dark:border-slate-700/50">
          {temRegistro ? (
            <>
              <span className={`text-xs font-bold tabular-nums ${item.saldo >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {item.saldo >= 0 ? '+' : ''}{paraHora(item.saldo)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums font-medium">{paraHora(item.trab)}</span>
            </>
          ) : item.status === 'faltante' ? (
            <span className="text-xs font-bold text-rose-500 dark:text-rose-400 tabular-nums">{paraHora(item.saldo)}</span>
          ) : null}
        </div>
        {temRegistro && (
          <div className="flex items-center gap-1">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => onEdit(item.reg!)} aria-label="Editar registro" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Pencil className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => onDelete(item.reg!.id!)} disabled={deletando === item.reg!.id} aria-label="Excluir registro" className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50">
              {deletando === item.reg!.id ? <Loader2 className="w-4 h-4 text-rose-500 animate-spin" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

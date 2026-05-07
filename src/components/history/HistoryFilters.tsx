import { motion } from 'framer-motion';
import { Filter, Download } from 'lucide-react';

export type Filtro = 'todos' | 'com_registro' | 'sem_registro';

interface HistoryFiltersProps {
  filtro: Filtro;
  onSetFiltro: (f: Filtro) => void;
  onExport: () => void;
}

export function HistoryFilters({ filtro, onSetFiltro, onExport }: HistoryFiltersProps) {
  const opcoesFiltro: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'com_registro', label: 'Com registro' },
    { key: 'sem_registro', label: 'Faltantes' },
  ];

  return (
    <div className="ios-card rounded-2xl p-3 shadow-xl flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-2" />
      <div className="flex gap-1 flex-1">
        {opcoesFiltro.map((f) => (
          <button
            key={f.key}
            onClick={() => onSetFiltro(f.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filtro === f.key
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onExport}
        className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
        title="Exportar CSV"
      >
        <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </motion.button>
    </div>
  );
}

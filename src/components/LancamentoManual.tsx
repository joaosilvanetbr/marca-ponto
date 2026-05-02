import { useState } from 'react';
import type { Registro } from '@/types';
import { X, Loader2, CalendarDays } from 'lucide-react';

interface LancamentoManualProps {
  userId: string;
  onSalvar: (registro: Registro) => Promise<void>;
  onClose: () => void;
}

export default function LancamentoManual({ userId, onSalvar, onClose }: LancamentoManualProps) {
  const [data, setData] = useState(() => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    return ontem.toISOString().split('T')[0];
  });
  const [entrada, setEntrada] = useState('08:00');
  const [intervalo, setIntervalo] = useState('12:00');
  const [retorno, setRetorno] = useState('13:00');
  const [saida, setSaida] = useState('17:00');
  const [carregando, setCarregando] = useState(false);

  async function handleSalvar() {
    setCarregando(true);
    try {
      await onSalvar({
        user_id: userId,
        data,
        entrada,
        intervalo: intervalo || null,
        retorno: retorno || null,
        saida: saida || null,
      });
      onClose();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm glass rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-none max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lançar ponto manual</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Data</label>
            <input
              type="date"
              value={data}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Entrada</label>
            <input
              type="time"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Intervalo (opcional)</label>
            <input
              type="time"
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Retorno (opcional)</label>
            <input
              type="time"
              value={retorno}
              onChange={(e) => setRetorno(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Saída (opcional)</label>
            <input
              type="time"
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSalvar}
          disabled={carregando}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CalendarDays className="w-5 h-5" /> Salvar lançamento</>}
        </button>
      </div>
    </div>
  );
}

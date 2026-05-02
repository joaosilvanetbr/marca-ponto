import { useState } from 'react';
import type { Registro } from '@/types';
import { X, Save, Loader2 } from 'lucide-react';

interface EditModalProps {
  registro: Registro;
  onSave: (id: number, updates: Partial<Registro>) => Promise<void>;
  onClose: () => void;
}

export default function EditModal({ registro, onSave, onClose }: EditModalProps) {
  const [entrada, setEntrada] = useState(registro.entrada || '');
  const [intervalo, setIntervalo] = useState(registro.intervalo || '');
  const [retorno, setRetorno] = useState(registro.retorno || '');
  const [saida, setSaida] = useState(registro.saida || '');
  const [carregando, setCarregando] = useState(false);

  async function handleSave() {
    setCarregando(true);
    try {
      await onSave(registro.id!, {
        entrada: entrada || null,
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
      <div className="relative w-full max-w-sm glass rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Editar Registro</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Entrada</label>
            <input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Intervalo</label>
            <input type="time" value={intervalo} onChange={(e) => setIntervalo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Retorno</label>
            <input type="time" value={retorno} onChange={(e) => setRetorno(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Saída</label>
            <input type="time" value={saida} onChange={(e) => setSaida(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white" />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={carregando}
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar</>}
        </button>
      </div>
    </div>
  );
}

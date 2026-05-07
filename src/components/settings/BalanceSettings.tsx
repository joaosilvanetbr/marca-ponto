import { Scale } from 'lucide-react';

interface BalanceSettingsProps {
  saldoInicial: string;
  onSaldoInicialChange: (v: string) => void;
}

export function BalanceSettings({
  saldoInicial,
  onSaldoInicialChange
}: BalanceSettingsProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Saldo inicial</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Saldo acumulado anterior (HH:MM)</div>
        </div>
      </div>
      <input
        type="text"
        value={saldoInicial}
        onChange={(e) => onSaldoInicialChange(e.target.value)}
        placeholder="00:00 ou -00:00"
        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 dark:text-white font-mono"
      />
    </div>
  );
}

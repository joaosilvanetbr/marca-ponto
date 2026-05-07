import { Sun, Moon } from 'lucide-react';

interface ThemeSettingsProps {
  darkMode: boolean;
  status: string | null;
  onToggleTema: () => Promise<void>;
}

export function ThemeSettings({
  darkMode,
  status,
  onToggleTema
}: ThemeSettingsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800">
          {darkMode ? <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <Sun className="w-5 h-5 text-amber-600" />}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">Tema escuro</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Auto-save</div>
        </div>
      </div>
      <button
        onClick={onToggleTema}
        disabled={status === 'saving'}
        className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-secondary dark:bg-slate-700'} border border-border disabled:opacity-50`}
      >
        <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

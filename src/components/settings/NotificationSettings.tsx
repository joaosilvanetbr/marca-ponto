import { Bell, BellOff, Loader2, LogIn, Coffee, Play, LogOut as IconSaida } from 'lucide-react';
import type { LembreteConfig } from '@/types';

interface NotificationSettingsProps {
  isSubscribed: boolean;
  loadingPush: boolean;
  lembreteConfig: LembreteConfig;
  onSubscribe: () => Promise<void>;
  onUnsubscribe: () => Promise<void>;
  onSaveLembrete: (updates: Partial<LembreteConfig>) => Promise<void>;
}

export function NotificationSettings({
  isSubscribed,
  loadingPush,
  lembreteConfig,
  onSubscribe,
  onUnsubscribe,
  onSaveLembrete
}: NotificationSettingsProps) {
  const lembretesList = [
    { key: 'entrada' as const, label: 'Entrada', icon: LogIn },
    { key: 'intervalo' as const, label: 'Intervalo', icon: Coffee },
    { key: 'retorno' as const, label: 'Retorno', icon: Play },
    { key: 'saida' as const, label: 'Saída', icon: IconSaida },
  ];

  return (
    <div className="space-y-5">
      {/* Notificações Push */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSubscribed ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {isSubscribed ? <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <BellOff className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
          </div>
          <div>
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificações Push</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Alertas reais no dispositivo</div>
          </div>
        </div>
        <button
          onClick={isSubscribed ? onUnsubscribe : onSubscribe}
          disabled={loadingPush}
          className={`relative w-12 h-7 rounded-full transition-colors ${isSubscribed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'} border border-border disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${isSubscribed ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
            {loadingPush && <Loader2 className="w-3 h-3 text-emerald-500 animate-spin" />}
          </div>
        </button>
      </div>

      {/* Lembretes Switchers */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" /> Lembretes
        </h3>
        {lembretesList.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lembreteConfig[key] ? 'bg-cyan-100 dark:bg-cyan-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className={`w-4 h-4 ${lembreteConfig[key] ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
            </div>
            <button
              onClick={() => onSaveLembrete({ [key]: !lembreteConfig[key] })}
              className={`relative w-10 h-6 rounded-full transition-colors ${lembreteConfig[key] ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${lembreteConfig[key] ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

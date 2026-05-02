import type { Tab } from '@/types';
import { Clock, History, CalendarDays, Settings } from 'lucide-react';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Clock }[] = [
  { id: 'ponto', label: 'Ponto', icon: Clock },
  { id: 'historico', label: 'Histórico', icon: History },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'config', label: 'Config', icon: Settings },
];

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto px-4 pb-4 pt-2">
        <div className="glass rounded-2xl flex items-center justify-around p-2 shadow-2xl">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

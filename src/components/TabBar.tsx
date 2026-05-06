import type { Tab } from '@/types';
import { motion } from 'framer-motion';
import { Clock, History, Settings, CalendarDays } from 'lucide-react';

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
      <div className="max-w-md mx-auto px-6 pb-6 pt-2">
        <div className="ios-card rounded-3xl flex items-center justify-around p-2.5">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onChange(tab.id)}
                className={`relative flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-primary-start to-primary-end rounded-2xl shadow-lg shadow-primary/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest relative z-10 ${isActive ? 'text-white' : ''}`}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

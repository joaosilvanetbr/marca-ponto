import { LogOut } from 'lucide-react';

interface AccountActionsProps {
  onLogout: () => Promise<void>;
}

export function AccountActions({ onLogout }: AccountActionsProps) {
  return (
    <button
      onClick={onLogout}
      className="w-full py-3.5 rounded-xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
    >
      <LogOut className="w-5 h-5" /> Sair da conta
    </button>
  );
}

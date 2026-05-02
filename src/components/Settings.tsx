import { useState, useEffect, useCallback, useRef } from 'react';
import type { Profile } from '@/types';
import { updateProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Sun, Moon, Loader2, LogOut, Briefcase, Timer, Wallet, Bell, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  profile: Profile | null;
  userEmail: string;
  onProfileUpdate: () => Promise<void>;
}

export default function Settings({ profile, userEmail, onProfileUpdate }: SettingsProps) {
  const [jornada, setJornada] = useState(profile?.jornada || '08:00');
  const [tolerancia, setTolerancia] = useState(profile?.tolerancia || 10);
  const [saldoInicial, setSaldoInicial] = useState(profile?.saldo_inicial || 0);
  const [darkMode, setDarkMode] = useState(profile?.dark_mode || false);

  // Status feedback: null | 'saving' | 'saved' | 'error'
  const [status, setStatus] = useState<string | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza estados locais quando o profile muda
  useEffect(() => {
    if (profile) {
      setJornada(profile.jornada);
      setTolerancia(profile.tolerancia);
      setSaldoInicial(profile.saldo_inicial);
      setDarkMode(profile.dark_mode);
    }
  }, [profile?.id]);

  function showStatus(value: string, duration = 3000) {
    setStatus(value);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), duration);
  }

  async function autoSave(updates: Partial<Profile>) {
    if (!profile) return;
    setStatus('saving');
    try {
      await updateProfile(profile.id, updates);
      await onProfileUpdate();
      showStatus('saved', 2000);
    } catch (err: unknown) {
      console.error('[Settings] Erro ao salvar:', err);
      showStatus('error', 4000);
    }
  }

  // Debounced auto-save para jornada, tolerancia e saldoInicial
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(field: keyof Profile, value: unknown) {
    if (!profile) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      autoSave({ [field]: value });
    }, 800);
  }

  function handleJornadaChange(value: string) {
    setJornada(value);
    scheduleSave('jornada', value);
  }

  function handleToleranciaChange(value: number) {
    setTolerancia(value);
    scheduleSave('tolerancia', value);
  }

  function handleSaldoChange(value: number) {
    setSaldoInicial(value);
    scheduleSave('saldo_inicial', value);
  }

  // Auto-salva o tema imediatamente
  const toggleTema = useCallback(async () => {
    const novo = !darkMode;
    setDarkMode(novo);
    if (novo) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    await autoSave({ dark_mode: novo });
  }, [darkMode, profile, onProfileUpdate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const saldoHoras = Math.floor(Math.abs(saldoInicial) / 60);
  const saldoMin = Math.abs(saldoInicial) % 60;
  const saldoSinal = saldoInicial < 0 ? '-' : '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      {/* Perfil */}
      <div className="glass rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">{userEmail.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-white">{userEmail}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {profile ? 'Perfil carregado' : 'Carregando perfil...'}
            </div>
          </div>
        </div>
      </div>

      {/* Configurações */}
      <div className="glass rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" /> Configurações
        </h3>

        {/* Tema - auto-salva */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              {darkMode ? <Moon className="w-5 h-5 text-amber-600 dark:text-amber-400" /> : <Sun className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tema escuro</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Salva automaticamente</div>
            </div>
          </div>
          <button
            onClick={toggleTema}
            disabled={status === 'saving'}
            className={`relative w-12 h-7 rounded-full transition-colors ${darkMode ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'} disabled:opacity-50`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Jornada */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Jornada diária</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Horas esperadas por dia</div>
            </div>
          </div>
          <input
            type="time"
            value={jornada}
            onChange={(e) => handleJornadaChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
          />
        </div>

        {/* Tolerância */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tolerância (min)</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Margem antes de contar saldo</div>
            </div>
          </div>
          <input
            type="number"
            min={0}
            max={60}
            value={tolerancia}
            onChange={(e) => handleToleranciaChange(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
          />
        </div>

        {/* Saldo inicial */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Saldo inicial (min)</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Banco de horas prévio</div>
            </div>
          </div>
          <input
            type="number"
            value={saldoInicial}
            onChange={(e) => handleSaldoChange(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
          />
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Atual: {saldoSinal}{saldoHoras}h {saldoMin}min
          </div>
        </div>

        {/* Status feedback */}
        {status === 'saving' && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
          </div>
        )}
        {status === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-out">
            <CheckCircle2 className="w-4 h-4" /> Salvo no banco!
          </div>
        )}
        {status === 'error' && (
          <div className="text-sm text-amber-700 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg p-2">
            Erro ao salvar. Tente novamente.
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Sair da conta
      </button>
    </motion.div>
  );
}

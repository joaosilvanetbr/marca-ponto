import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@/types';
import { updateProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Sun, Moon, Save, Loader2, LogOut, Briefcase, Timer, Wallet, Bell, CheckCircle2 } from 'lucide-react';

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
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [temaSalvando, setTemaSalvando] = useState(false);

  // Sincroniza estados locais quando o profile muda (carregamento do Supabase)
  useEffect(() => {
    if (profile) {
      setJornada(profile.jornada);
      setTolerancia(profile.tolerancia);
      setSaldoInicial(profile.saldo_inicial);
      setDarkMode(profile.dark_mode);
      console.log('[Settings] Profile carregado:', profile);
    }
  }, [profile?.id]); // Só reage ao ID mudar, não a cada render

  async function handleSave() {
    if (!profile) {
      setMensagem('Aguarde o carregamento do perfil...');
      setTimeout(() => setMensagem(''), 3000);
      return;
    }

    setCarregando(true);
    setMensagem('');

    const payload = {
      jornada,
      tolerancia: Number(tolerancia),
      saldo_inicial: Number(saldoInicial),
      dark_mode: darkMode,
    };

    console.log('[Settings] Salvando configurações:', payload);

    try {
      await updateProfile(profile.id, payload);
      console.log('[Settings] Configurações salvas com sucesso');

      await onProfileUpdate();
      setMensagem('Configurações salvas no banco!');
      setTimeout(() => setMensagem(''), 3000);
    } catch (err: unknown) {
      console.error('[Settings] Erro ao salvar:', err);
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setMensagem(`Erro: ${msg}`);
      setTimeout(() => setMensagem(''), 5000);
    } finally {
      setCarregando(false);
    }
  }

  // Auto-salva o tema quando o toggle é clicado
  const toggleTema = useCallback(async () => {
    const novo = !darkMode;
    setDarkMode(novo);

    // Aplica imediatamente no DOM
    if (novo) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auto-salva no banco se o profile estiver disponível
    if (profile) {
      setTemaSalvando(true);
      try {
        await updateProfile(profile.id, { dark_mode: novo });
        console.log('[Settings] Tema auto-salvo:', novo);
        await onProfileUpdate();
      } catch (err: unknown) {
        console.error('[Settings] Erro ao auto-salvar tema:', err);
        setMensagem('Tema alterado localmente, mas falhou ao salvar no banco');
        setTimeout(() => setMensagem(''), 4000);
      } finally {
        setTemaSalvando(false);
      }
    }
  }, [darkMode, profile, onProfileUpdate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  // Converte saldo_inicial (minutos) para formato legível
  const saldoHoras = Math.floor(Math.abs(saldoInicial) / 60);
  const saldoMin = Math.abs(saldoInicial) % 60;
  const saldoSinal = saldoInicial < 0 ? '-' : '';

  return (
    <div className="space-y-4 pb-24">
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
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {temaSalvando ? 'Salvando...' : 'Altera e salva automaticamente'}
              </div>
            </div>
          </div>
          <button
            onClick={toggleTema}
            disabled={temaSalvando}
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
            onChange={(e) => setJornada(e.target.value)}
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
            onChange={(e) => setTolerancia(Number(e.target.value))}
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
            onChange={(e) => setSaldoInicial(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
          />
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Atual: {saldoSinal}{saldoHoras}h {saldoMin}min
          </div>
        </div>

        {mensagem && (
          <div className={`text-sm rounded-lg p-3 flex items-center gap-2 ${mensagem.includes('Erro') || mensagem.includes('Falhou') || mensagem.includes('Aguarde') ? 'text-amber-700 bg-amber-100/50 dark:bg-amber-900/20' : 'text-emerald-700 bg-emerald-100/50 dark:bg-emerald-900/20'}`}>
            {mensagem.includes('salvas') ? <CheckCircle2 className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {mensagem}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={carregando || !profile}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Configurações</>}
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-xl bg-rose-500 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" /> Sair da conta
      </button>
    </div>
  );
}

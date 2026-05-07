import { useState, useEffect, useRef, useCallback } from 'react';
import type { Profile, LembreteConfig } from '@/types';
import { updateProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/error-utils';
import { validatePasswordStrength } from '@/lib/auth-utils';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

import { useAppTheme } from '@/hooks/useAppTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { paraHora, paraMinutos } from '@/lib/time-utils';

// Subcomponentes
import { AccountSettings } from './settings/AccountSettings';
import { WorkScheduleSettings } from './settings/WorkScheduleSettings';
import { BalanceSettings } from './settings/BalanceSettings';
import { NotificationSettings } from './settings/NotificationSettings';
import { ThemeSettings } from './settings/ThemeSettings';
import { AccountActions } from './settings/AccountActions';

interface SettingsProps {
  profile: Profile | null;
  userEmail: string;
  onProfileUpdate: () => Promise<void>;
}

export default function Settings({ profile, userEmail, onProfileUpdate }: SettingsProps) {
  const { isSubscribed, subscribe, unsubscribe, loading: loadingPush } = usePushNotifications();
  const [jornada, setJornada] = useState(profile?.jornada || '08:00');
  const [diasTrabalho, setDiasTrabalho] = useState<number[]>(profile?.dias_trabalho || [1, 2, 3, 4, 5]);
  const [saldoInicial, setSaldoInicial] = useState(paraHora(profile?.saldo_inicial || 0));
  const [darkMode, setDarkMode] = useState(profile?.dark_mode || false);
  const [lembreteConfig, setLembreteConfig] = useState<LembreteConfig>(profile?.lembrete_config || {
    entrada: true, intervalo: true, retorno: true, saida: true
  });

  useAppTheme();

  // Conta
  const [nome, setNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [secaoConta, setSecaoConta] = useState<'perfil' | 'email' | 'senha' | null>(null);

  // Status feedback: null | 'saving' | 'saved' | 'error'
  const [status, setStatus] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const profileId = profile?.id;
  const profileJornada = profile?.jornada;
  const profileDarkMode = profile?.dark_mode;
  const profileLembretes = profile?.lembrete_config;

  // Busca nome do user_metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const fullName = data.user?.user_metadata?.full_name || '';
      setNome(fullName);
      setNovoEmail(data.user?.email || userEmail);
    });
  }, [userEmail]);

  // Sincroniza estados locais quando o profile muda
  useEffect(() => {
    if (profileId) {
      if (profileJornada) setJornada(profileJornada);
      if (profileDarkMode !== undefined) setDarkMode(profileDarkMode);
      if (profile?.dias_trabalho) setDiasTrabalho(profile.dias_trabalho);
      if (profileLembretes) setLembreteConfig(profileLembretes);
      if (profile?.saldo_inicial !== undefined) setSaldoInicial(paraHora(profile.saldo_inicial));
    }
  }, [profileId, profileJornada, profileDarkMode, profile?.dias_trabalho, profileLembretes, profile?.saldo_inicial]);

  function showStatus(value: string, msg: string, duration = 3000) {
    setStatus(value);
    setStatusMsg(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), duration);
  }

  const autoSave = useCallback(async (updates: Partial<Profile>) => {
    if (!profileId) return;
    setStatus('saving');
    try {
      await updateProfile(profileId, updates);
      await onProfileUpdate();
      showStatus('saved', 'Salvo!', 2000);
    } catch (err: unknown) {
      logError('Settings.autoSave', err);
      showStatus('error', 'Erro ao salvar', 4000);
    }
  }, [profileId, onProfileUpdate]);

  const saveLembrete = useCallback(async (updates: Partial<LembreteConfig>) => {
    const next = { ...lembreteConfig, ...updates };
    setLembreteConfig(next);
    localStorage.setItem('pontogo-lembretes', JSON.stringify(next));
    await autoSave({ lembrete_config: next });
  }, [lembreteConfig, autoSave]);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(field: keyof Profile, value: unknown) {
    if (!profileId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      autoSave({ [field]: value });
    }, 800);
  }

  function handleJornadaChange(value: string) {
    setJornada(value);
    scheduleSave('jornada', value);
  }

  function toggleDiaTrabalho(dia: number) {
    let novosDias = [...diasTrabalho];
    if (novosDias.includes(dia)) {
      novosDias = novosDias.filter(d => d !== dia);
    } else {
      novosDias.push(dia);
    }
    setDiasTrabalho(novosDias);
    scheduleSave('dias_trabalho', novosDias);
  }

  function handleSaldoInicialChange(value: string) {
    setSaldoInicial(value);
    const matches = value.match(/^-?\d{2}:\d{2}$/);
    if (matches) {
      const isNegative = value.startsWith('-');
      const pureValue = isNegative ? value.substring(1) : value;
      let mins = paraMinutos(pureValue);
      if (isNegative) mins = -mins;
      scheduleSave('saldo_inicial', mins);
    }
  }

  async function toggleTema() {
    const novo = !darkMode;
    setDarkMode(novo);
    if (novo) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    await autoSave({ dark_mode: novo });
  }

  async function handleSalvarNome() {
    setStatus('saving');
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nome },
      });
      if (error) throw error;
      showStatus('saved', 'Nome atualizado!', 2000);
      setSecaoConta(null);
    } catch (err: unknown) {
      showStatus('error', err instanceof Error ? err.message : 'Erro', 4000);
    }
  }

  async function handleSalvarEmail() {
    if (!novoEmail || novoEmail === userEmail) {
      showStatus('error', 'Digite um email diferente do atual', 3000);
      return;
    }
    setStatus('saving');
    try {
      const { error } = await supabase.auth.updateUser({ email: novoEmail });
      if (error) throw error;
      showStatus('saved', 'Verifique o novo email para confirmar a mudanca!', 5000);
      setSecaoConta(null);
    } catch (err: unknown) {
      showStatus('error', err instanceof Error ? err.message : 'Erro', 4000);
    }
  }

  async function handleSalvarSenha() {
    const pwdError = validatePasswordStrength(novaSenha);
    if (pwdError) {
      showStatus('error', pwdError, 4000);
      return;
    }
    if (novaSenha !== confirmarSenha) {
      showStatus('error', 'As senhas nao coincidem', 3000);
      return;
    }
    setStatus('saving');
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      showStatus('saved', 'Senha atualizada!', 2000);
      setNovaSenha('');
      setConfirmarSenha('');
      setSecaoConta(null);
    } catch (err: unknown) {
      showStatus('error', err instanceof Error ? err.message : 'Erro', 4000);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      
      <AccountSettings 
        nome={nome}
        userEmail={userEmail}
        novoEmail={novoEmail}
        novaSenha={novaSenha}
        confirmarSenha={confirmarSenha}
        secaoConta={secaoConta}
        status={status}
        setNome={setNome}
        setNovoEmail={setNovoEmail}
        setNovaSenha={setNovaSenha}
        setConfirmarSenha={setConfirmarSenha}
        setSecaoConta={setSecaoConta}
        onSalvarNome={handleSalvarNome}
        onSalvarEmail={handleSalvarEmail}
        onSalvarSenha={handleSalvarSenha}
      />

      <div className="ios-card rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
           Configuracoes
        </h3>

        <ThemeSettings 
          darkMode={darkMode}
          status={status}
          onToggleTema={toggleTema}
        />

        <BalanceSettings 
          saldoInicial={saldoInicial}
          onSaldoInicialChange={handleSaldoInicialChange}
        />

        <NotificationSettings 
          isSubscribed={isSubscribed}
          loadingPush={loadingPush}
          lembreteConfig={lembreteConfig}
          onSubscribe={subscribe}
          onUnsubscribe={unsubscribe}
          onSaveLembrete={saveLembrete}
        />

        <WorkScheduleSettings 
          jornada={jornada}
          diasTrabalho={diasTrabalho}
          onJornadaChange={handleJornadaChange}
          onToggleDiaTrabalho={toggleDiaTrabalho}
        />

        {status === 'saved' && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 animate-fade-out">
            <CheckCircle2 className="w-4 h-4" /> {statusMsg}
          </div>
        )}
        {status === 'error' && (
          <div className="text-sm text-amber-700 bg-amber-100 dark:bg-amber-950 rounded-lg p-2">
            {statusMsg}
          </div>
        )}
      </div>

      <AccountActions onLogout={handleLogout} />

    </motion.div>
  );
}

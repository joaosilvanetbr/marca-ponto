import { useState, useEffect, useRef } from 'react';
import type { Profile } from '@/types';
import { updateProfile } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/error-utils';
import { validatePasswordStrength } from '@/lib/auth-utils';
import { motion } from 'framer-motion';
import { Sun, Moon, Loader2, LogOut, Briefcase, Bell, BellOff, CheckCircle2, User, Mail, Lock, ArrowLeft, LogIn, Coffee, Play, LogOut as IconSaida, CalendarDays } from 'lucide-react';
import { useLembreteConfig } from '@/hooks/useLembreteConfig';

interface SettingsProps {
  profile: Profile | null;
  userEmail: string;
  onProfileUpdate: () => Promise<void>;
  notificacaoAtivada?: boolean;
  onToggleNotificacao?: () => void;
}

export default function Settings({ profile, userEmail, onProfileUpdate, notificacaoAtivada = false, onToggleNotificacao }: SettingsProps) {
  const { config: lembreteConfig, save: saveLembrete } = useLembreteConfig();
  const [jornada, setJornada] = useState(profile?.jornada || '08:00');
  const [diasTrabalho, setDiasTrabalho] = useState<number[]>(profile?.dias_trabalho || [1, 2, 3, 4, 5]);
  const [darkMode, setDarkMode] = useState(profile?.dark_mode || false);

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
    if (profileId && profileJornada && profileDarkMode !== undefined) {
      setJornada(profileJornada);
      setDarkMode(profileDarkMode);
      if (profile?.dias_trabalho) setDiasTrabalho(profile.dias_trabalho);
    }
  }, [profileId, profileJornada, profileDarkMode, profile?.dias_trabalho]);

  function showStatus(value: string, msg: string, duration = 3000) {
    setStatus(value);
    setStatusMsg(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), duration);
  }

  async function autoSave(updates: Partial<Profile>) {
    if (!profile) return;
    setStatus('saving');
    try {
      await updateProfile(profile.id, updates);
      await onProfileUpdate();
      showStatus('saved', 'Salvo!', 2000);
    } catch (err: unknown) {
      logError('Settings.autoSave', err);
      showStatus('error', 'Erro ao salvar', 4000);
    }
  }

  // Debounced auto-save para jornada
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



  // Auto-salva o tema imediatamente
  async function toggleTema() {
    const novo = !darkMode;
    setDarkMode(novo);
    if (novo) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    await autoSave({ dark_mode: novo });
  }

  // Atualizar nome
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

  // Atualizar email
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

  // Atualizar senha
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
    // onAuthStateChange em AuthProvider limpa o estado automaticamente
  }

  const nomeExibido = nome || userEmail.split('@')[0];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 pb-24">
      {/* Perfil */}
      <div className="ios-card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">{nomeExibido.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-white">{nomeExibido}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Minha Conta */}
      <div className="ios-card rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" /> Minha Conta
        </h3>

        {secaoConta === null && (
          <div className="space-y-2">
            <button onClick={() => setSecaoConta('perfil')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Nome</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{nome || 'Adicionar nome'}</div>
              </div>
            </button>

            <button onClick={() => setSecaoConta('email')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">{userEmail}</div>
              </div>
            </button>

            <button onClick={() => setSecaoConta('senha')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                <Lock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Senha</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">••••••••</div>
              </div>
            </button>
          </div>
        )}

        {secaoConta === 'perfil' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nome exibido</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSalvarNome} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nome'}
            </motion.button>
          </div>
        )}

        {secaoConta === 'email' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Novo email</label>
              <input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="novo@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Um email de confirmacao sera enviado para o novo endereco.</div>
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSalvarEmail} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar email'}
            </motion.button>
          </div>
        )}

        {secaoConta === 'senha' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Minimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Confirmar senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSalvarSenha} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar senha'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Configurações */}
      <div className="ios-card rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-4 h-4" /> Configuracoes
        </h3>

        {/* Tema - auto-salva */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
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

        {/* Notificações */}
        {onToggleNotificacao && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notificacaoAtivada ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {notificacaoAtivada ? <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <BellOff className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Notificações</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">Lembretes de ponto</div>
              </div>
            </div>
            <button
              onClick={onToggleNotificacao}
              className={`relative w-12 h-7 rounded-full transition-colors ${notificacaoAtivada ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${notificacaoAtivada ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}

        {/* Jornada */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Jornada diaria</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Horas esperadas por dia</div>
            </div>
          </div>
          <input
            type="time"
            value={jornada}
            onChange={(e) => handleJornadaChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white"
          />
        </div>

        {/* Dias de Trabalho */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Dias de trabalho</div>
              <div className="text-xs text-slate-400 dark:text-slate-500">Selecione os dias da sua escala</div>
            </div>
          </div>
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 mt-3">
            {[{ n: 0, l: 'D' }, { n: 1, l: 'S' }, { n: 2, l: 'T' }, { n: 3, l: 'Q' }, { n: 4, l: 'Q' }, { n: 5, l: 'S' }, { n: 6, l: 'S' }].map((dia) => {
              const ativo = diasTrabalho.includes(dia.n);
              return (
                <button
                  key={dia.n}
                  onClick={() => toggleDiaTrabalho(dia.n)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${ativo ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  {dia.l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lembretes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" /> Lembretes
          </h3>
          {([
            { key: 'entrada' as const, label: 'Entrada', icon: LogIn },
            { key: 'intervalo' as const, label: 'Intervalo', icon: Coffee },
            { key: 'retorno' as const, label: 'Retorno', icon: Play },
            { key: 'saida' as const, label: 'Saída', icon: IconSaida },
          ]).map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lembreteConfig[key] ? 'bg-cyan-100 dark:bg-cyan-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <Icon className={`w-4 h-4 ${lembreteConfig[key] ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
              </div>
              <button
                onClick={() => saveLembrete({ [key]: !lembreteConfig[key] })}
                className={`relative w-10 h-6 rounded-full transition-colors ${lembreteConfig[key] ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${lembreteConfig[key] ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Status feedback */}
        {status === 'saving' && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
          </div>
        )}
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

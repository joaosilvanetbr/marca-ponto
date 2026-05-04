import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'sonner';
import type { Registro, Profile, Tab } from '@/types';
import { supabase, getRegistroDoDia, getRegistros, upsertRegistro, deleteRegistro, getProfile } from '@/lib/supabase';
import { addToQueue, syncQueue, getPendingCount } from '@/lib/offline-queue';
import { hoje, mesAtual, agora } from '@/lib/time-utils';
import { logError } from '@/lib/error-utils';
import { useLembretes } from '@/hooks/useLembretes';
import { useNotifications } from '@/hooks/useNotifications';
import { useHaptic } from '@/hooks/useHaptic';
import { useAppBadge } from '@/hooks/useAppBadge';
import { useThemeColor } from '@/hooks/useThemeColor';
import LoginForm from '@/components/LoginForm';
import ResetPassword from '@/components/ResetPassword';
import ClockCard from '@/components/ClockCard';
import BankHistory from '@/components/BankHistory';
import Settings from '@/components/Settings';
import EditModal from '@/components/EditModal';
import LancamentoManual from '@/components/LancamentoManual';
import SkeletonScreen from '@/components/SkeletonScreen';
import TabBar from '@/components/TabBar';
import { TabSlide } from '@/components/animations';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('ponto');
  const [registroHoje, setRegistroHoje] = useState<Registro | null>(null);
  const [registrosMes, setRegistrosMes] = useState<Registro[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lancamentoAberto, setLancamentoAberto] = useState(false);
  const [tabDirection, setTabDirection] = useState<'left' | 'right'>('right');
  const [prevTab, setPrevTab] = useState<Tab>('ponto');

  // Detecta se o usuário chegou via link de recuperação de senha
  const [isRecovery, setIsRecovery] = useState(() => {
    const hash = window.location.hash;
    return hash && (hash.includes('type=recovery') || hash.includes('access_token'));
  });

  const tabOrder: Tab[] = ['ponto', 'historico', 'config'];

  const handleTabChange = useCallback((tab: Tab) => {
    const currentIdx = tabOrder.indexOf(prevTab);
    const newIdx = tabOrder.indexOf(tab);
    setTabDirection(newIdx > currentIdx ? 'right' : 'left');
    setPrevTab(tab);
    setActiveTab(tab);
  }, [prevTab]);

  // Swipe entre abas
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX;
    const diffY = touch.clientY - touchStartY;

    // Só processa se for movimento horizontal significativo
    if (Math.abs(diffX) < 80 || Math.abs(diffY) > Math.abs(diffX)) return;

    const currentIdx = tabOrder.indexOf(activeTab);

    if (diffX < 0 && currentIdx < tabOrder.length - 1) {
      // Swipe para esquerda → próxima aba
      handleTabChange(tabOrder[currentIdx + 1]);
    } else if (diffX > 0 && currentIdx > 0) {
      // Swipe para direita → aba anterior
      handleTabChange(tabOrder[currentIdx - 1]);
    }
  }, [touchStartX, touchStartY, activeTab, handleTabChange]);

  // Notificações do sistema
  const { ativado: notifAtivado, toggle: toggleNotif, notificar } = useNotifications();

  // Feedback tátil (vibração) ao bater ponto
  const haptic = useHaptic();

  // App Badge — mostra badge no ícone quando tem sync pendente
  const { setBadge, clearBadge } = useAppBadge();

  // Atualiza badge quando mudam os pendentes
  useEffect(() => {
    if (pendingCount > 0) {
      setBadge(pendingCount);
    } else {
      clearBadge();
    }
  }, [pendingCount, setBadge, clearBadge]);

  // Theme color dinâmico (status bar do navegador)
  useThemeColor(profile?.dark_mode || false);

  // Lembretes/notificações — integra com notificações do sistema
  useLembretes(
    registroHoje?.entrada || null,
    registroHoje?.intervalo || null,
    registroHoje?.retorno || null,
    registroHoje?.saida || null,
    profile?.jornada || '08:00',
    notifAtivado ? notificar : undefined
  );

  // Monitora online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Atualiza contagem de pendentes periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        setPendingCount(getPendingCount(user));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Checa auth inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user.id);
        setUserEmail(data.session.user.email || '');
      }
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user.id);
        setUserEmail(session.user.email || '');
      } else {
        setUser(null);
        setUserEmail('');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Carrega dados quando usuário loga
  const carregarDados = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    try {
      const [regDia, regsMes, prof] = await Promise.all([
        getRegistroDoDia(user, hoje()),
        getRegistros(user, mesAtual()),
        getProfile(user),
      ]);
      setRegistroHoje(regDia);
      setRegistrosMes(regsMes);
      setProfile(prof);

      if (prof?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      logError('App.carregarDados', err);
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Auto-sync quando volta online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      handleSync();
    }
  }, [isOnline]);

  async function handleRegistrar(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    if (!user) return;

    // Feedback tátil ao bater ponto
    haptic.medium();

    const hora = agora();
    const base: Registro = registroHoje || {
      user_id: user,
      data: hoje(),
      entrada: null,
      intervalo: null,
      retorno: null,
      saida: null,
    };

    const novo = { ...base, [tipo]: hora };

    if (isOnline) {
      try {
        await upsertRegistro(user, novo);
      } catch {
        addToQueue('upsert', novo, 'registros', user);
      }
    } else {
      addToQueue('upsert', novo, 'registros', user);
    }

    setRegistroHoje(novo);
    setRegistrosMes((prev) => {
      const idx = prev.findIndex((r) => r.data === novo.data);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = novo;
        return updated;
      }
      return [...prev, novo];
    });
  }

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await syncQueue(user);
      if (result.success > 0) {
        await carregarDados();
      }
    } catch (err) {
      logError('App.handleSync', err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!isOnline) {
      addToQueue('delete', id, 'registros', user);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== id));
      if (registroHoje?.id === id) {
        setRegistroHoje(null);
      }
      return;
    }
    try {
      await deleteRegistro(user, id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== id));
      if (registroHoje?.id === id) {
        setRegistroHoje(null);
      }
    } catch {
      addToQueue('delete', id, 'registros', user);
    }
  }

  async function handleUpdate(id: number, updates: Partial<Registro>) {
    if (!isOnline) {
      addToQueue('update', { id, ...updates }, 'registros', user);
      const updated = { ...registroHoje, ...updates, id } as Registro;
      setRegistroHoje(updated);
      setRegistrosMes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      return;
    }
    try {
      await upsertRegistro(user, { ...registroHoje, ...updates, id } as Registro);
      await carregarDados();
    } catch {
      addToQueue('update', { id, ...updates }, 'registros', user);
    }
  }

  async function handleRemoverPonto(tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') {
    if (!registroHoje?.id) return;
    const updates = { [tipo]: null } as Partial<Registro>;
    await handleUpdate(registroHoje.id, updates);
  }

  async function handleLimparDia() {
    if (!registroHoje?.id) return;
    if (!isOnline) {
      addToQueue('delete', registroHoje.id, 'registros', user);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== registroHoje!.id));
      setRegistroHoje(null);
      return;
    }
    try {
      await deleteRegistro(user, registroHoje.id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== registroHoje!.id));
      setRegistroHoje(null);
    } catch {
      addToQueue('delete', registroHoje.id, 'registros', user);
    }
  }
  async function handleLancamentoManual(registro: Registro) {
    if (!user) return;
    const fullRegistro = { ...registro, user_id: user };
    try {
      if (isOnline) {
        await upsertRegistro(user, fullRegistro);
        await carregarDados();
      } else {
        addToQueue('upsert', fullRegistro, 'registros', user);
        setRegistrosMes((prev) => {
          const idx = prev.findIndex((r) => r.data === fullRegistro.data);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = fullRegistro;
            return updated;
          }
          return [...prev, fullRegistro];
        });
      }
      setLancamentoAberto(false);
    } catch (err) {
      logError('App.handleLancamentoManual', err);
    }
  }

  // Recuperacao de senha: tem prioridade sobre tudo — mostra a tela de reset
  if (isRecovery) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <ResetPassword onVoltar={() => { setIsRecovery(false); window.location.hash = ''; }} />
      </div>
    );
  }

  // Tela de loading aprimorada com skeleton
  if (carregando && !user) {
    return <SkeletonScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <LoginForm onLogin={() => {}} />
      </div>
    );
  }

  // Skeleton enquanto carrega dados do usuário logado
  if (carregando && user) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <SkeletonScreen />
        <TabBar active={activeTab} onChange={handleTabChange} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F2F2F7] dark:bg-black text-slate-900 dark:text-white transition-colors touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="max-w-md mx-auto px-4 py-6">
        <TabSlide activeTab={activeTab} direction={tabDirection}>
          {activeTab === 'ponto' && (
            <ClockCard
              registro={registroHoje}
              profile={profile}
              onRegistrar={handleRegistrar}
              onEditar={handleUpdate}
              onRemoverPonto={handleRemoverPonto}
              onLimparDia={handleLimparDia}
              onSync={handleSync}
              onAbrirLancamentoManual={() => setLancamentoAberto(true)}
              pendingCount={pendingCount}
              isOnline={isOnline}
              onHaptic={haptic.light}
            />
          )}

          {activeTab === 'historico' && (
            <BankHistory
              registros={registrosMes}
              profile={profile}
              onEdit={setEditando}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'config' && (
            <Settings
              profile={profile}
              userEmail={userEmail}
              onProfileUpdate={carregarDados}
              notificacaoAtivada={notifAtivado}
              onToggleNotificacao={toggleNotif}
            />
          )}
        </TabSlide>
      </div>

      <TabBar active={activeTab} onChange={handleTabChange} />

      <Toaster position="top-center" richColors />

      {lancamentoAberto && (
        <LancamentoManual
          userId={user}
          onSalvar={handleLancamentoManual}
          onClose={() => setLancamentoAberto(false)}
        />
      )}

      {editando && (
        <EditModal
          registro={editando}
          onSave={handleUpdate}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}
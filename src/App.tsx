import { useState, useEffect, useCallback } from 'react';
import type { Registro, Profile, Tab, DiaCalendario } from '@/types';
import { supabase, getRegistroDoDia, getRegistros, upsertRegistro, deleteRegistro, getProfile, getCalendario, upsertCalendario, deleteCalendario } from '@/lib/supabase';
import { addToQueue, syncQueue } from '@/lib/offline-queue';
import { hoje, mesAtual, agora } from '@/lib/time-utils';
import LoginForm from '@/components/LoginForm';
import ClockCard from '@/components/ClockCard';
import BankHistory from '@/components/BankHistory';
import CalendarView from '@/components/CalendarView';
import Settings from '@/components/Settings';
import EditModal from '@/components/EditModal';
import TabBar from '@/components/TabBar';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('ponto');
  const [registroHoje, setRegistroHoje] = useState<Registro | null>(null);
  const [registrosMes, setRegistrosMes] = useState<Registro[]>([]);
  const [calendario, setCalendario] = useState<DiaCalendario[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [editando, setEditando] = useState<Registro | null>(null);
  const [syncing, setSyncing] = useState(false);

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
      const queue = JSON.parse(localStorage.getItem('meu-ponto-queue') || '[]');
      setPendingCount(queue.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      const [regDia, regsMes, calMes, prof] = await Promise.all([
        getRegistroDoDia(user, hoje()),
        getRegistros(user, mesAtual()),
        getCalendario(user, mesAtual()),
        getProfile(user),
      ]);
      setRegistroHoje(regDia);
      setRegistrosMes(regsMes);
      setCalendario(calMes);
      setProfile(prof);

      if (prof?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Erro carregando dados:', err);
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
        await upsertRegistro(novo);
      } catch {
        addToQueue('upsert', novo);
      }
    } else {
      addToQueue('upsert', novo);
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
      const result = await syncQueue();
      if (result.success > 0) {
        await carregarDados();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!isOnline) {
      addToQueue('delete', id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== id));
      if (registroHoje?.id === id) {
        setRegistroHoje(null);
      }
      return;
    }
    try {
      await deleteRegistro(id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== id));
      if (registroHoje?.id === id) {
        setRegistroHoje(null);
      }
    } catch {
      addToQueue('delete', id);
    }
  }

  async function handleUpdate(id: number, updates: Partial<Registro>) {
    if (!isOnline) {
      addToQueue('update', { id, ...updates });
      const updated = { ...registroHoje, ...updates, id } as Registro;
      setRegistroHoje(updated);
      setRegistrosMes((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      return;
    }
    try {
      await upsertRegistro({ ...registroHoje, ...updates, id } as Registro);
      await carregarDados();
    } catch {
      addToQueue('update', { id, ...updates });
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
      addToQueue('delete', registroHoje.id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== registroHoje!.id));
      setRegistroHoje(null);
      return;
    }
    try {
      await deleteRegistro(registroHoje.id);
      setRegistrosMes((prev) => prev.filter((r) => r.id !== registroHoje!.id));
      setRegistroHoje(null);
    } catch {
      addToQueue('delete', registroHoje.id);
    }
  }
  async function handleMarcarCalendario(data: string, tipo: DiaCalendario['tipo'], descricao: string | null) {
    if (!user) return;
    if (!isOnline) {
      alert('Você está offline. Conecte-se à internet para marcar dias no calendário.');
      return;
    }
    const item: DiaCalendario = { user_id: user, data, tipo, descricao };
    try {
      await upsertCalendario(item);
      setCalendario((prev) => {
        const idx = prev.findIndex((c) => c.data === data);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...item, id: prev[idx].id };
          return updated;
        }
        return [...prev, item];
      });
    } catch (err) {
      console.error('Erro ao marcar calendário:', err);
      alert('Erro ao salvar no calendário. Tente novamente.');
    }
  }

  async function handleRemoverCalendario(data: string) {
    if (!user) return;
    if (!isOnline) {
      alert('Você está offline. Conecte-se à internet para remover dias do calendário.');
      return;
    }
    try {
      await deleteCalendario(user, data);
      setCalendario((prev) => prev.filter((c) => c.data !== data));
    } catch (err) {
      console.error('Erro ao remover calendário:', err);
      alert('Erro ao remover do calendário. Tente novamente.');
    }
  }

  if (carregando && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <LoginForm onLogin={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors">
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'ponto' && (
          <ClockCard
            registro={registroHoje}
            profile={profile}
            onRegistrar={handleRegistrar}
            onEditar={handleUpdate}
            onRemoverPonto={handleRemoverPonto}
            onLimparDia={handleLimparDia}
            onSync={handleSync}
            pendingCount={pendingCount}
            isOnline={isOnline}
          />
        )}

        {activeTab === 'historico' && (
          <BankHistory
            registros={registrosMes}
            calendario={calendario}
            profile={profile}
            onEdit={setEditando}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'calendario' && (
          <CalendarView
            calendario={calendario}
            onMarcar={handleMarcarCalendario}
            onRemover={handleRemoverCalendario}
          />
        )}

        {activeTab === 'config' && (
          <Settings
            profile={profile}
            userEmail={userEmail}
            onProfileUpdate={carregarDados}
          />
        )}
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

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

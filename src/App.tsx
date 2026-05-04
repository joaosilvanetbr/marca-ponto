import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppProvider } from '@/contexts/AppProvider';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { useRegistroDoDia } from '@/hooks/useRegistroDoDia';
import { useRegistrosMes } from '@/hooks/useRegistrosMes';
import { useProfile } from '@/hooks/useProfile';
import { useAppMutations } from '@/hooks/useAppMutations';
import { useNotifications } from '@/hooks/useNotifications';
import { useHaptic } from '@/hooks/useHaptic';
import { useAppBadge } from '@/hooks/useAppBadge';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLembretes } from '@/hooks/useLembretes';
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

function AppContent() {
  const { user, userEmail, carregando: authLoading } = useAuth();
  const {
    activeTab, tabDirection, isOnline, pendingCount, syncing,
    editando, lancamentoAberto, setEditando, setLancamentoAberto,
    handleTabChange, onTouchStart, onTouchEnd,
  } = useApp();

  const { data: registroHoje, isLoading: loadingRegistro } = useRegistroDoDia(user);
  const { data: registrosMes = [], isLoading: loadingRegistros } = useRegistrosMes(user);
  const { data: profile, isLoading: loadingProfile } = useProfile(user);

  const {
    handleRegistrar, handleSync, handleDelete, handleUpdate,
    handleRemoverPonto, handleLancamentoManual,
  } = useAppMutations();

  // Notificações do sistema
  const { ativado: notifAtivado, toggle: toggleNotif, notificar } = useNotifications();

  // Feedback tátil
  const haptic = useHaptic();

  // App Badge
  const { setBadge, clearBadge } = useAppBadge();

  // Theme color dinâmico
  useThemeColor(profile?.dark_mode || false);

  // Lembretes/notificações
  useLembretes(
    registroHoje?.entrada || null,
    registroHoje?.intervalo || null,
    registroHoje?.retorno || null,
    registroHoje?.saida || null,
    profile?.jornada || '08:00',
    notifAtivado ? notificar : undefined
  );

  // Atualiza badge quando mudam os pendentes
  useEffect(() => {
    if (pendingCount > 0) {
      setBadge(pendingCount);
    } else {
      clearBadge();
    }
  }, [pendingCount, setBadge, clearBadge]);

  // Auto-sync quando volta online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncing) {
      handleSync();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const dadosCarregando = authLoading || loadingRegistro || loadingRegistros || loadingProfile;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <LoginForm onLogin={() => {}} />
      </div>
    );
  }

  if (dadosCarregando) {
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
              registro={registroHoje || null}
              profile={profile || null}
              onRegistrar={handleRegistrar}
              onEditar={handleUpdate}
              onRemoverPonto={handleRemoverPonto}
              onSync={handleSync}
              pendingCount={pendingCount}
              isOnline={isOnline}
              onHaptic={haptic.light}
            />
          )}

          {activeTab === 'historico' && (
            <BankHistory
              registros={registrosMes}
              profile={profile || null}
              onEdit={setEditando}
              onDelete={handleDelete}
            />
          )}

          {activeTab === 'config' && (
            <Settings
              profile={profile || null}
              userEmail={userEmail}
              onProfileUpdate={async () => {}}
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

export default function App() {
  const { isRecovery, setIsRecovery, carregando: authLoading } = useAuth();

  if (isRecovery) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
        <ResetPassword onVoltar={() => setIsRecovery(false)} />
      </div>
    );
  }

  if (authLoading) {
    return <SkeletonScreen />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

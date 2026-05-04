import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppProvider } from '@/contexts/AppProvider';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { useRegistroDoDia } from '@/hooks/useRegistroDoDia';
import { useRegistrosMes } from '@/hooks/useRegistrosMes';
import { useProfile } from '@/hooks/useProfile';
import { useCalendario } from '@/hooks/useCalendario';
import { useAppMutations } from '@/hooks/useAppMutations';
import { useNotifications } from '@/hooks/useNotifications';
import { useHaptic } from '@/hooks/useHaptic';
import { useAppBadge } from '@/hooks/useAppBadge';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLembretes } from '@/hooks/useLembretes';
import { useLembreteConfig } from '@/hooks/useLembreteConfig';
import { mesAtual } from '@/lib/time-utils';
import LoginForm from '@/components/LoginForm';
import ResetPassword from '@/components/ResetPassword';
import ClockCard from '@/components/ClockCard';
import EditModal from '@/components/EditModal';
import LancamentoManual from '@/components/LancamentoManual';
import SkeletonScreen from '@/components/SkeletonScreen';
import TabBar from '@/components/TabBar';
import { TabSlide } from '@/components/animations';

const BankHistory = lazy(() => import('@/components/BankHistory'));
const CalendarView = lazy(() => import('@/components/CalendarView'));
const ChartEvolucao = lazy(() => import('@/components/ChartEvolucao'));
const Settings = lazy(() => import('@/components/Settings'));

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
  const { data: calendarioMes = [], isLoading: loadingCalendario } = useCalendario(user, mesAtual());

  const {
    handleRegistrar, handleSync, handleDelete, handleUpdate,
    handleRemoverPonto, handleLancamentoManual,
    handleMarcarCalendario, handleRemoverCalendario,
  } = useAppMutations();

  // Notificações do sistema
  const { ativado: notifAtivado, toggle: toggleNotif, notificar } = useNotifications();

  // Feedback tátil
  const haptic = useHaptic();

  // App Badge
  const { setBadge, clearBadge } = useAppBadge();

  // Theme color dinâmico
  useThemeColor(profile?.dark_mode || false);

  const { config: lembreteConfig } = useLembreteConfig();

  // Lembretes/notificações
  useLembretes(
    registroHoje?.entrada || null,
    registroHoje?.intervalo || null,
    registroHoje?.retorno || null,
    registroHoje?.saida || null,
    profile?.jornada || '08:00',
    lembreteConfig,
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

  const dadosCarregando = authLoading || loadingRegistro || loadingProfile;

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
            loadingRegistros ? (
              <div className="ios-card rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Carregando historico...
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="ios-card rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Carregando historico...
                  </div>
                }
              >
                <div className="space-y-4">
                  <ChartEvolucao
                    userId={user}
                    jornada={profile?.jornada || '08:00'}
                    tolerancia={profile?.tolerancia || 10}
                    saldoInicial={profile?.saldo_inicial || 0}
                  />
                  <BankHistory
                    registros={registrosMes}
                    profile={profile || null}
                    userId={user}
                    onEdit={setEditando}
                    onDelete={handleDelete}
                  />
                </div>
              </Suspense>
            )
          )}

          {activeTab === 'calendario' && (
            loadingCalendario ? (
              <div className="ios-card rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Carregando calendario...
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="ios-card rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Carregando calendario...
                  </div>
                }
              >
                <CalendarView
                  calendario={calendarioMes}
                  onMarcar={handleMarcarCalendario}
                  onRemover={handleRemoverCalendario}
                />
              </Suspense>
            )
          )}

          {activeTab === 'config' && (
            <Suspense
              fallback={
                <div className="ios-card rounded-2xl p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Carregando configuracoes...
                </div>
              }
            >
              <Settings
                profile={profile || null}
                userEmail={userEmail}
                onProfileUpdate={async () => {}}
                notificacaoAtivada={notifAtivado}
                onToggleNotificacao={toggleNotif}
              />
            </Suspense>
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

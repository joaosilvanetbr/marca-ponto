import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Registro, DiaCalendario } from '@/types';
import { upsertRegistro, updateRegistro, deleteRegistro, upsertCalendario, deleteCalendario } from '@/lib/supabase';
import { addToQueue, syncQueue } from '@/lib/offline-queue';
import { logError } from '@/lib/error-utils';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/hooks/useApp';
import { agora, hoje } from '@/lib/time-utils';

export function useAppMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, setSyncing, setLancamentoAberto } = useApp();

  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['registro-do-dia'] });
    queryClient.invalidateQueries({ queryKey: ['registros-mes'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['calendario'] });
  }, [queryClient]);

  const handleRegistrar = useCallback(async (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => {
    const currentUser = user;
    if (!currentUser) return;

    const hora = agora();
    const queryKeyDia = ['registro-do-dia', currentUser];
    const previousRegistro = queryClient.getQueryData<Registro | null>(queryKeyDia);
    
    const base: Registro = previousRegistro || {
      user_id: currentUser,
      data: hoje(),
      entrada: null,
      intervalo: null,
      retorno: null,
      saida: null,
    };
    
    const novo = { ...base, [tipo]: hora };

    // Atualização Otimista (Instantânea)
    queryClient.setQueryData(queryKeyDia, novo);
    // Também atualiza o cache do mês para manter consistência
    queryClient.setQueryData(['registros-mes', currentUser], (old: Registro[] | undefined) => {
      if (!old) return [novo];
      const index = old.findIndex(r => r.data === novo.data);
      if (index === -1) return [novo, ...old];
      const copy = [...old];
      copy[index] = novo;
      return copy;
    });

    if (isOnline) {
      try {
        await upsertRegistro(currentUser, novo);
        toast.success(`Registro de ${tipo} realizado!`);
      } catch {
        // Fallback para fila offline se o servidor falhar
        addToQueue('upsert', novo, 'registros', currentUser);
        toast.warning('Falha na sincronização. Registro salvo localmente.', { duration: 4000 });
      }
    } else {
      addToQueue('upsert', novo, 'registros', currentUser);
      toast.warning('Modo offline — registro salvo e será sincronizado ao reconectar.', { duration: 4000 });
    }

    // Não invalidamos imediatamente para não causar "flicker" de loading se o otimismo já resolveu
    // mas agendamos uma sincronização de fundo
    setTimeout(() => invalidateData(), 1000);
  }, [user, isOnline, queryClient, invalidateData]);

  const handleSync = useCallback(async () => {
    const currentUser = user;
    if (!currentUser) return;
    setSyncing(true);
    try {
      const result = await syncQueue(currentUser);
      if (result.success > 0) {
        invalidateData();
      }
    } catch (err) {
      logError('App.handleSync', err);
    } finally {
      setSyncing(false);
    }
  }, [user, setSyncing, invalidateData]);

  const handleDelete = useCallback(async (id: string) => {
    const currentUser = user;
    if (!currentUser) return;
    if (!isOnline) {
      addToQueue('delete', id, 'registros', currentUser);
      toast.warning('Offline — exclusão salva e será aplicada ao reconectar.', { duration: 4000 });
      invalidateData();
      return;
    }
    try {
      await deleteRegistro(currentUser, id);
      invalidateData();
    } catch {
      addToQueue('delete', id, 'registros', currentUser);
      toast.warning('Falha ao excluir. Operação salva localmente.', { duration: 4000 });
    }
  }, [user, isOnline, invalidateData]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Registro>) => {
    const currentUser = user;
    if (!currentUser) return;
    if (!isOnline) {
      addToQueue('update', { id, ...updates }, 'registros', currentUser);
      toast.warning('Offline — alteração salva e será aplicada ao reconectar.', { duration: 4000 });
      invalidateData();
      return;
    }
    try {
      await updateRegistro(currentUser, id, updates);
      invalidateData();
    } catch {
      addToQueue('update', { id, ...updates }, 'registros', currentUser);
      toast.warning('Falha ao atualizar. Operação salva localmente.', { duration: 4000 });
    }
  }, [user, isOnline, invalidateData]);

  const handleRemoverPonto = useCallback(async (tipo: 'entrada' | 'intervalo' | 'retorno' | 'saida') => {
    const currentUser = user;
    if (!currentUser) return;
    const existing = queryClient.getQueryData<Registro | null>(['registro-do-dia', currentUser]);
    if (!existing?.id) return;
    const updates = { [tipo]: null } as Partial<Registro>;
    await handleUpdate(existing.id, updates);
  }, [user, queryClient, handleUpdate]);

  const handleLancamentoManual = useCallback(async (registro: Registro) => {
    const currentUser = user;
    if (!currentUser) return;
    const fullRegistro = { ...registro, user_id: currentUser };
    try {
      if (isOnline) {
        await upsertRegistro(currentUser, fullRegistro);
        invalidateData();
      } else {
        addToQueue('upsert', fullRegistro, 'registros', currentUser);
        invalidateData();
      }
      setLancamentoAberto(false);
    } catch (err) {
      logError('App.handleLancamentoManual', err);
    }
  }, [user, isOnline, setLancamentoAberto, invalidateData]);

  const handleMarcarCalendario = useCallback(async (data: string, tipo: DiaCalendario['tipo'], descricao: string | null) => {
    const currentUser = user;
    if (!currentUser) return;
    const item: DiaCalendario = { user_id: currentUser, data, tipo, descricao };
    try {
      if (isOnline) {
        await upsertCalendario(item);
      } else {
        addToQueue('upsert', item, 'calendario', currentUser);
      }
      invalidateData();
    } catch (err) {
      logError('App.handleMarcarCalendario', err);
    }
  }, [user, isOnline, invalidateData]);

  const handleRemoverCalendario = useCallback(async (data: string) => {
    const currentUser = user;
    if (!currentUser) return;
    try {
      if (isOnline) {
        await deleteCalendario(currentUser, data);
      } else {
        addToQueue('delete', { userId: currentUser, data }, 'calendario', currentUser);
      }
      invalidateData();
    } catch (err) {
      logError('App.handleRemoverCalendario', err);
    }
  }, [user, isOnline, invalidateData]);

  return {
    handleRegistrar,
    handleSync,
    handleDelete,
    handleUpdate,
    handleRemoverPonto,
    handleLancamentoManual,
    handleMarcarCalendario,
    handleRemoverCalendario,
  };
}

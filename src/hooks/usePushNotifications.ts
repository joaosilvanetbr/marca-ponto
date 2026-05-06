import { useState, useEffect, useCallback } from 'react';
import { supabase, upsertPushSubscription } from '@/lib/supabase';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verifica se o usuário já está inscrito no carregamento
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Notificações Push não são suportadas neste navegador.');
      return;
    }

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        toast.error('Permissão de notificação negada.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Inscreve o usuário
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Salva no Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertPushSubscription(user.id, subscription);
        setIsSubscribed(true);
        toast.success('Notificações push ativadas com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao inscrever para push:', err);
      toast.error('Falha ao ativar notificações push.');
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove do Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint)
            .eq('user_id', user.id);
        }
        
        setIsSubscribed(false);
        toast.info('Notificações push desativadas.');
      }
    } catch (err) {
      console.error('Erro ao cancelar inscrição push:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    loading
  };
}

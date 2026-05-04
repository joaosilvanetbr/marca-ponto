import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'meu-ponto-notifications';

export function useNotifications() {
  const [permissao, setPermissao] = useState<NotificationPermission>('default');
  const [ativado, setAtivado] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const jaNotificados = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      setPermissao(Notification.permission);
    }
  }, []);

  const solicitarPermissao = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermissao(result);
      if (result === 'granted') {
        setAtivado(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        toast.success('Notificações ativadas!');
        return true;
      } else {
        toast.error('Permissão de notificação negada');
        return false;
      }
    } catch {
      return false;
    }
  }, []);

  const toggle = useCallback(async () => {
    if (ativado) {
      setAtivado(false);
      localStorage.removeItem(STORAGE_KEY);
      jaNotificados.current.clear();
      toast.info('Notificações desativadas');
      return;
    }

    if (permissao === 'granted') {
      setAtivado(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      toast.success('Notificações ativadas!');
    } else {
      await solicitarPermissao();
    }
  }, [ativado, permissao, solicitarPermissao]);

  const notificar = useCallback((titulo: string, options?: NotificationOptions) => {
    if (!ativado) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Evita notificar a mesma coisa repetidamente
    const chave = `${titulo}-${options?.body || ''}`;
    if (jaNotificados.current.has(chave)) return;
    jaNotificados.current.add(chave);

    try {
      new Notification(titulo, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: chave,
        requireInteraction: false,
        ...options,
      });
    } catch {
      // Fallback silencioso
    }
  }, [ativado]);

  // Limpa notificações do dia anterior quando o dia muda
  useEffect(() => {
    const interval = setInterval(() => {
      jaNotificados.current.clear();
    }, 24 * 60 * 60 * 1000); // a cada 24h
    return () => clearInterval(interval);
  }, []);

  return {
    ativado,
    permissao,
    toggle,
    solicitarPermissao,
    notificar,
  };
}

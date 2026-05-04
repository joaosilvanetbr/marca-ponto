import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { verificarLembretes } from '@/lib/time-utils';

export function useLembretes(
  entrada: string | null,
  intervalo: string | null,
  retorno: string | null,
  saida: string | null,
  jornada: string,
  notificar?: (titulo: string, options?: NotificationOptions) => void
) {
  const jaMostrados = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const lembrete = verificarLembretes(entrada, intervalo, retorno, saida, jornada);
      if (lembrete && !jaMostrados.current.has(lembrete)) {
        // Toast in-app
        toast.info(lembrete, {
          duration: 8000,
          position: 'top-center',
          dismissible: true,
        });

        // Notificação do sistema (se ativada)
        if (notificar) {
          notificar('PontoGO — Lembrete', {
            body: lembrete,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
          });
        }

        jaMostrados.current.add(lembrete);
      }
    }, 60_000); // verifica a cada minuto

    return () => clearInterval(interval);
  }, [entrada, intervalo, retorno, saida, jornada, notificar]);

  // Reseta lembretes quando o dia muda
  useEffect(() => {
    jaMostrados.current.clear();
  }, [entrada]);
}

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { verificarLembretes } from '@/lib/time-utils';
import type { LembreteConfig } from './useLembreteConfig';

export function useLembretes(
  entrada: string | null,
  intervalo: string | null,
  retorno: string | null,
  saida: string | null,
  jornada: string,
  config: LembreteConfig,
  notificar?: (titulo: string, options?: NotificationOptions) => void
) {
  const jaMostrados = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const lembrete = verificarLembretes(entrada, intervalo, retorno, saida, jornada);
      if (!lembrete) return;

      // Filtra por configuração
      const isEntrada = lembrete.includes('entrada');
      const isIntervalo = lembrete.includes('intervalo');
      const isRetorno = lembrete.includes('voltar');
      const isSaida = lembrete.includes('sair') || lembrete.includes('saída');

      if (isEntrada && !config.entrada) return;
      if (isIntervalo && !config.intervalo) return;
      if (isRetorno && !config.retorno) return;
      if (isSaida && !config.saida) return;

      if (!jaMostrados.current.has(lembrete)) {
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
  }, [entrada, intervalo, retorno, saida, jornada, notificar, config]);

  // Reseta lembretes quando o dia muda
  useEffect(() => {
    jaMostrados.current.clear();
  }, [entrada]);
}

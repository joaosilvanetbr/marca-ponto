import { useCallback } from 'react';

/**
 * Hook para feedback tátil (vibração) ao interagir com a UI.
 * Funciona em dispositivos móveis com suporte a Vibration API.
 */
export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[] = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silenciosamente ignora se não suportar
      }
    }
  }, []);

  // Vibração curta para toques em botões
  const light = useCallback(() => vibrate(10), [vibrate]);

  // Vibração média para ações importantes (ex: bater ponto)
  const medium = useCallback(() => vibrate(20), [vibrate]);

  // Vibração longa para sucesso
  const success = useCallback(() => vibrate([15, 50, 15]), [vibrate]);

  // Vibração de erro
  const error = useCallback(() => vibrate([30, 40, 30]), [vibrate]);

  return { vibrate, light, medium, success, error };
}

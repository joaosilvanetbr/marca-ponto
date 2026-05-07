import { useQuery } from '@tanstack/react-query';
import { getSaldoGeral } from '@/lib/supabase';

export function useSaldoGeral(userId: string | null) {
  return useQuery({
    queryKey: ['saldo-geral', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return getSaldoGeral(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

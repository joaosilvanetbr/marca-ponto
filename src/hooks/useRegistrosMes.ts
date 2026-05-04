import { useQuery } from '@tanstack/react-query';
import { getRegistros } from '@/lib/supabase';
import { mesAtual } from '@/lib/time-utils';

export function useRegistrosMes(userId: string | null) {
  return useQuery({
    queryKey: ['registros-mes', userId, mesAtual()],
    queryFn: async () => {
      if (!userId) return [];
      return getRegistros(userId, mesAtual());
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

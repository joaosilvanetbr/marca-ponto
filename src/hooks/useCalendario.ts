import { useQuery } from '@tanstack/react-query';
import { getCalendario } from '@/lib/supabase';

export function useCalendario(userId: string | null, mes: string) {
  return useQuery({
    queryKey: ['calendario', userId, mes],
    queryFn: async () => {
      if (!userId) return [];
      return getCalendario(userId, mes);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

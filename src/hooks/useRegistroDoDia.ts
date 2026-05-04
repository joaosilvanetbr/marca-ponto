import { useQuery } from '@tanstack/react-query';
import { getRegistroDoDia } from '@/lib/supabase';
import { hoje } from '@/lib/time-utils';

export function useRegistroDoDia(userId: string | null) {
  return useQuery({
    queryKey: ['registro-do-dia', userId],
    queryFn: async () => {
      if (!userId) return null;
      return getRegistroDoDia(userId, hoje());
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

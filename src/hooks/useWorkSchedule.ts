import { useMemo } from 'react';
import type { Profile } from '@/types';
import { paraMinutos } from '@/lib/time-utils';

const DEFAULT_DIAS_TRABALHO = [1, 2, 3, 4, 5];

export function useWorkSchedule(profile: Profile | null) {
  const jornadaMin = useMemo(() => (profile ? paraMinutos(profile.jornada) : 480), [profile]);
  const diasTrabalho = useMemo(() => (profile?.dias_trabalho || DEFAULT_DIAS_TRABALHO), [profile]);
  const jornadaStr = profile?.jornada || '08:00';

  return {
    jornadaMin,
    diasTrabalho,
    jornadaStr,
  };
}

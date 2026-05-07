import { useMemo } from 'react';
import type { Registro, Profile } from '@/types';
import { useHistoryData } from './useHistoryData';
import { useWorkSchedule } from './useWorkSchedule';

export function useMonthlyBalance(userId: string | null, mesSelecionado: string, registros: Registro[], profile: Profile | null) {
  const { totalTrabalhado, saldoMes, diasComRegistro, diasSemRegistro } = useHistoryData(
    userId,
    mesSelecionado,
    registros,
    profile
  );

  const { jornadaMin } = useWorkSchedule(profile);

  const averagePerDay = useMemo(() => {
    return diasComRegistro > 0 ? Math.round(totalTrabalhado / diasComRegistro) : 0;
  }, [totalTrabalhado, diasComRegistro]);

  return {
    totalTrabalhado,
    saldoMes,
    diasComRegistro,
    diasSemRegistro,
    averagePerDay,
    jornadaMin,
  };
}

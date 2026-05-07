import { useMemo } from 'react';
import type { Registro, Profile } from '@/types';
import { calcularMinutosTrabalhados, calcularSaldoDia, paraMinutos } from '@/lib/time-utils';

export function useWorkDay(registro: Registro | null, profile: Profile | null) {
  const workedMinutes = useMemo(() => {
    return calcularMinutosTrabalhados(
      registro?.entrada || null,
      registro?.intervalo || null,
      registro?.retorno || null,
      registro?.saida || null
    );
  }, [registro?.entrada, registro?.intervalo, registro?.retorno, registro?.saida]);

  const balance = useMemo(() => {
    const jornadaMin = profile ? paraMinutos(profile.jornada) : 480;
    return calcularSaldoDia(workedMinutes, jornadaMin);
  }, [workedMinutes, profile]);

  return {
    workedMinutes,
    balance,
  };
}

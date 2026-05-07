import { useMemo } from 'react';
import type { Registro, Profile, DiaCalendario } from '@/types';
import { diasDoMes, calcularMinutosTrabalhados, calcularSaldoDia } from '@/lib/time-utils';
import { getFeriadosNacionais, type FeriadoInfo } from '@/lib/feriados';
import { useCalendario } from '@/hooks/useCalendario';
import { useWorkSchedule } from '@/hooks/useWorkSchedule';

export interface HistoryItemData {
  data: string;
  reg: Registro | null;
  cal: DiaCalendario | null;
  feriado: FeriadoInfo | null;
  trab: number;
  saldo: number;
  isHoje: boolean;
  isFuturo: boolean;
  isFimDeSemana: boolean;
  status: 'completo' | 'faltante' | 'especial';
}

export function useHistoryData(userId: string | null, mesSelecionado: string, registros: Registro[], profile: Profile | null) {
  const { jornadaMin, diasTrabalho } = useWorkSchedule(profile);

  const registrosMap = useMemo(() => {
    const map = new Map<string, Registro>();
    for (const r of registros) map.set(r.data, r);
    return map;
  }, [registros]);

  const { data: calendario = [] } = useCalendario(userId, mesSelecionado);

  const calendarioMap = useMemo(() => {
    const map = new Map<string, DiaCalendario>();
    for (const c of calendario) map.set(c.data, c);
    return map;
  }, [calendario]);

  const feriadosMap = useMemo(() => {
    const ano = parseInt(mesSelecionado.split('-')[0], 10);
    return getFeriadosNacionais(ano);
  }, [mesSelecionado]);

  const dias = useMemo(() => diasDoMes(mesSelecionado), [mesSelecionado]);

  return useMemo(() => {
    let totalTrabalhado = 0;
    let saldoMes = 0;
    let diasComRegistro = 0;
    let diasSemRegistro = 0;
    const items: HistoryItemData[] = [];

    const hojeStr = new Date().toISOString().split('T')[0];

    for (const dia of dias) {
      const reg = registrosMap.get(dia);
      const cal = calendarioMap.get(dia);
      const feriado = feriadosMap.get(dia);
      const isHoje = dia === hojeStr;
      const diaSemana = new Date(dia + 'T12:00:00').getDay();
      const isFuturo = dia > hojeStr;
      const isDiaDeTrabalho = diasTrabalho.includes(diaSemana);

      if (reg) {
        const trab = calcularMinutosTrabalhados(reg.entrada, reg.intervalo, reg.retorno, reg.saida);
        const saldo = calcularSaldoDia(trab, jornadaMin);
        totalTrabalhado += trab;
        saldoMes += saldo;
        diasComRegistro++;
        items.push({ data: dia, reg, cal: cal ?? null, feriado: feriado ?? null, trab, saldo, isHoje, isFuturo, isFimDeSemana: !isDiaDeTrabalho, status: 'completo' });
      } else if (cal && !isFuturo) {
        items.push({ data: dia, reg: null, cal, feriado: feriado ?? null, trab: 0, saldo: 0, isHoje, isFuturo, isFimDeSemana: !isDiaDeTrabalho, status: 'especial' });
      } else if (!isFuturo && isDiaDeTrabalho) {
        saldoMes -= jornadaMin;
        diasSemRegistro++;
        items.push({ data: dia, reg: null, cal: null, feriado: feriado ?? null, trab: 0, saldo: -jornadaMin, isHoje, isFuturo, isFimDeSemana: false, status: 'faltante' });
      } else if (!isDiaDeTrabalho) {
        items.push({ data: dia, reg: null, cal: null, feriado: feriado ?? null, trab: 0, saldo: 0, isHoje, isFuturo, isFimDeSemana: true, status: 'especial' });
      }
    }

    return { items, totalTrabalhado, saldoMes, diasComRegistro, diasSemRegistro };
  }, [dias, registrosMap, calendarioMap, feriadosMap, jornadaMin, diasTrabalho]);
}

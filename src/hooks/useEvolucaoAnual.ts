import { useQuery } from '@tanstack/react-query';
import { getRegistrosAno } from '@/lib/supabase';
import { getFeriadosNacionais } from '@/lib/feriados';
import { calcularMinutosTrabalhados, calcularSaldoDia, jornadaParaMinutos } from '@/lib/time-utils';

export interface EvolucaoMes {
  mes: string;
  label: string;
  saldo: number;
  acumulado: number;
  trabalhado: number;
}

export function useEvolucaoAnual(userId: string | null, ano: number, jornada: string, tolerancia: number, saldoInicial: number) {
  return useQuery({
    queryKey: ['evolucao-anual', userId, ano, jornada, tolerancia, saldoInicial],
    queryFn: async () => {
      if (!userId) return [];
      const registros = await getRegistrosAno(userId, ano);
      const registrosMap = new Map(registros.map((r) => [r.data, r]));
      const feriados = getFeriadosNacionais(ano);
      const jornadaMin = jornadaParaMinutos(jornada);

      const meses: EvolucaoMes[] = [];
      let acumulado = saldoInicial;

      for (let m = 1; m <= 12; m++) {
        const mesStr = `${ano}-${String(m).padStart(2, '0')}`;
        const diasNoMes = new Date(ano, m, 0).getDate();
        let saldoMes = 0;
        let trabalhadoMes = 0;

        for (let d = 1; d <= diasNoMes; d++) {
          const dataStr = `${mesStr}-${String(d).padStart(2, '0')}`;
          const reg = registrosMap.get(dataStr);
          const diaSemana = new Date(dataStr + 'T12:00:00').getDay();
          const isFimDeSemana = diaSemana === 0 || diaSemana === 6;
          const isFeriado = feriados.has(dataStr);

          if (reg) {
            const trab = calcularMinutosTrabalhados(reg.entrada, reg.intervalo, reg.retorno, reg.saida);
            const saldo = calcularSaldoDia(trab, jornadaMin, tolerancia);
            saldoMes += saldo;
            trabalhadoMes += trab;
          } else if (!isFimDeSemana && !isFeriado) {
            saldoMes -= jornadaMin;
          }
        }

        acumulado += saldoMes;
        meses.push({
          mes: mesStr,
          label: new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }),
          saldo: saldoMes,
          acumulado,
          trabalhado: trabalhadoMes,
        });
      }

      return meses;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

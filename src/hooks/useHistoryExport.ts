import { useCallback } from 'react';
import { fmtHora, paraHora, nomeDiaSemana } from '@/lib/time-utils';
import type { HistoryItemData } from './useHistoryData';

export function useHistoryExport(items: HistoryItemData[], totalTrabalhado: number, saldoMes: number, diasComRegistro: number, diasSemRegistro: number, mesSelecionado: string) {
  return useCallback(() => {
    const linhas = ['Data,Dia,Entrada,Intervalo,Retorno,Saida,Horas,Saldo,Observacao'];
    for (const item of items) {
      const dia = item.data;
      const reg = item.reg;
      const entrada = reg?.entrada ? fmtHora(reg.entrada) : '';
      const intervalo = reg?.intervalo ? fmtHora(reg.intervalo) : '';
      const retorno = reg?.retorno ? fmtHora(reg.retorno) : '';
      const saida = reg?.saida ? fmtHora(reg.saida) : '';
      const horas = paraHora(item.trab);
      const saldo = paraHora(item.saldo);
      const observacao = reg?.observacao ? `"${reg.observacao.replace(/"/g, '""')}"` : '';
      linhas.push(`${dia},${nomeDiaSemana(dia)},${entrada},${intervalo},${retorno},${saida},${horas},${saldo},${observacao}`);
    }
    linhas.push('');
    linhas.push('RESUMO,,,,,,,');
    linhas.push(`Horas Trabalhadas,,,,,,,${paraHora(totalTrabalhado)}`);
    linhas.push(`Saldo do mês,,,,,,,${saldoMes >= 0 ? '+' : ''}${paraHora(saldoMes)}`);

    linhas.push(`Dias trabalhados,,,,,,,${diasComRegistro}`);
    linhas.push(`Dias sem registro,,,,,,,${diasSemRegistro}`);
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ponto-${mesSelecionado}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, totalTrabalhado, saldoMes, diasComRegistro, diasSemRegistro, mesSelecionado]);
}

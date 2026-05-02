/**
 * Converte "HH:MM" para minutos desde meia-noite
 */
export function paraMinutos(hora: string | null | undefined): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte minutos para "HH:MM"
 */
export function paraHora(minutos: number): string {
  const h = Math.floor(Math.abs(minutos) / 60);
  const m = Math.abs(minutos) % 60;
  const sinal = minutos < 0 ? '-' : '';
  return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converte minutos para "HH:MM" com sinal e formato legível
 */
export function formatarSaldo(minutos: number): string {
  const sinal = minutos >= 0 ? '+' : '-';
  const abs = Math.abs(minutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Data atual em formato ISO "YYYY-MM-DD"
 */
export function hoje(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Hora atual em formato "HH:MM"
 */
export function agora(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Formata data "YYYY-MM-DD" para "DD/MM/YYYY"
 */
export function formatarData(data: string): string {
  const [y, m, d] = data.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formata data "YYYY-MM-DD" para nome do mês + ano
 */
export function formatarMesAno(data: string): string {
  const [y, m] = data.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

/**
 * Retorna o mês e ano atual no formato "YYYY-MM"
 */
export function mesAtual(): string {
  return hoje().slice(0, 7);
}

/**
 * Calcula minutos trabalhados no dia considerando intervalo
 */
export function calcularMinutosTrabalhados(
  entrada: string | null,
  intervalo: string | null,
  retorno: string | null,
  saida: string | null
): number {
  if (!entrada) return 0;

  let total = 0;

  if (saida) {
    total = paraMinutos(saida) - paraMinutos(entrada);
  } else if (retorno) {
    total = paraMinutos(retorno) - paraMinutos(entrada);
  } else if (intervalo) {
    total = paraMinutos(intervalo) - paraMinutos(entrada);
  }

  // Desconta o intervalo se houver retorno
  if (intervalo && retorno) {
    total -= paraMinutos(retorno) - paraMinutos(intervalo);
  }

  return Math.max(0, total);
}

/**
 * Calcula o saldo do dia em minutos
 */
export function calcularSaldoDia(
  minutosTrabalhados: number,
  jornadaMinutos: number,
  toleranciaMinutos: number
): number {
  const diferenca = minutosTrabalhados - jornadaMinutos;
  if (Math.abs(diferenca) <= toleranciaMinutos) return 0;
  return diferenca;
}

/**
 * Converte string "HH:MM" para minutos (útil para jornada)
 */
export function jornadaParaMinutos(jornada: string): number {
  return paraMinutos(jornada);
}

/**
 * Gera uma lista de dias do mês
 */
export function diasDoMes(anoMes: string): string[] {
  const [ano, mes] = anoMes.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias: string[] = [];
  for (let d = 1; d <= ultimoDia; d++) {
    dias.push(`${anoMes}-${String(d).padStart(2, '0')}`);
  }
  return dias;
}

/**
 * Calcula a previsão de saída baseado na entrada e jornada
 * Retorna null se ainda não houver entrada
 */
export function calcularPrevisaoSaida(
  entrada: string | null,
  intervalo: string | null,
  retorno: string | null,
  jornada: string
): string | null {
  if (!entrada) return null;

  const entradaMin = paraMinutos(entrada);
  const jornadaMin = paraMinutos(jornada);
  let intervaloMin = 0;

  if (intervalo && retorno) {
    intervaloMin = paraMinutos(retorno) - paraMinutos(intervalo);
  }

  const saidaMin = entradaMin + jornadaMin + intervaloMin;
  const h = Math.floor(saidaMin / 60);
  const m = saidaMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Retorna mensagem de status sobre previsão de saída
 */
export function mensagemPrevisao(
  entrada: string | null,
  saida: string | null,
  intervalo: string | null,
  retorno: string | null,
  jornada: string
): { texto: string; tipo: 'info' | 'warning' | 'success' | 'neutral' } {
  if (!entrada) {
    return { texto: 'Bata o ponto de entrada para ver a previsão de saída', tipo: 'neutral' };
  }

  if (saida) {
    const minTrab = calcularMinutosTrabalhados(entrada, intervalo, retorno, saida);
    const jornadaMin = paraMinutos(jornada);
    const diff = minTrab - jornadaMin;

    if (Math.abs(diff) <= 10) {
      return { texto: 'Jornada completa! Você bateu exatamente o horário.', tipo: 'success' };
    }
    if (diff > 0) {
      return { texto: `Saiu ${paraHora(diff)} a mais (horas extras)`, tipo: 'success' };
    }
    return { texto: `Saiu ${paraHora(Math.abs(diff))} a menos`, tipo: 'warning' };
  }

  const previsao = calcularPrevisaoSaida(entrada, intervalo, retorno, jornada);
  if (!previsao) {
    return { texto: 'Bata o ponto de entrada para ver a previsão de saída', tipo: 'neutral' };
  }

  const agoraMin = paraMinutos(agora());
  const saidaMin = paraMinutos(previsao);

  if (agoraMin > saidaMin) {
    const atraso = agoraMin - saidaMin;
    return { texto: `Você deveria ter saído às ${previsao} (${paraHora(atraso)} atrasado)`, tipo: 'warning' };
  }

  const falta = saidaMin - agoraMin;
  if (falta <= 30) {
    return { texto: `Você pode sair às ${previsao} (faltam ${paraHora(falta)})`, tipo: 'success' };
  }

  return { texto: `Você pode sair às ${previsao}`, tipo: 'info' };
}

/**
 * Verifica lembretes de ponto baseado no estado atual do dia
 */
export function verificarLembretes(
  entrada: string | null,
  intervalo: string | null,
  retorno: string | null,
  saida: string | null,
  jornada: string
): string | null {
  const hora = agora();
  const h = paraMinutos(hora);

  // Não bateu entrada e já passou de 9h
  if (!entrada && h >= 540 && h <= 570) {
    return 'Bom dia! Não esqueça de bater o ponto de entrada.';
  }

  // Bateu entrada mas não intervalo e já passou 4h
  if (entrada && !intervalo && !retorno && !saida) {
    const trabalhando = h - paraMinutos(entrada);
    if (trabalhando >= 240 && trabalhando <= 270) {
      return 'Já trabalhou 4 horas. Hora do intervalo?';
    }
  }

  // Bateu intervalo mas não retorno e já passou 1h
  if (entrada && intervalo && !retorno && !saida) {
    const descanso = h - paraMinutos(intervalo);
    if (descanso >= 60 && descanso <= 90) {
      return 'Intervalo terminando. Hora de voltar ao trabalho?';
    }
  }

  // Previsão de saída próxima
  if (entrada && !saida) {
    const previsao = calcularPrevisaoSaida(entrada, intervalo, retorno, jornada);
    if (previsao) {
      const saidaMin = paraMinutos(previsao);
      if (h >= saidaMin - 15 && h <= saidaMin) {
        return `Você pode sair às ${previsao} — não esqueça de bater o ponto de saída!`;
      }
    }
  }

  return null;
}
/**
 * Nome do dia da semana abreviado
 */
export function nomeDiaSemana(data: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [y, m, d] = data.split('-').map(Number);
  return dias[new Date(y, m - 1, d).getDay()];
}

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
 * Nome do dia da semana abreviado
 */
export function nomeDiaSemana(data: string): string {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const [y, m, d] = data.split('-').map(Number);
  return dias[new Date(y, m - 1, d).getDay()];
}

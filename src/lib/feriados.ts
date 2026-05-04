/**
 * Algoritmo de Gauss para calcular a data da Páscoa
 */
export function calcularPascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function formatarDataISO(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function adicionarDias(data: Date, dias: number): Date {
  const result = new Date(data);
  result.setDate(result.getDate() + dias);
  return result;
}

export interface FeriadoInfo {
  nome: string;
  tipo: 'feriado';
}

/**
 * Retorna um Map com todos os feriados nacionais brasileiros do ano.
 * Chave: "YYYY-MM-DD", Valor: { nome, tipo }
 */
export function getFeriadosNacionais(ano: number): Map<string, FeriadoInfo> {
  const map = new Map<string, FeriadoInfo>();

  // Feriados fixos
  const fixos: [number, number, string][] = [
    [1, 1, 'Confraternização Universal'],
    [4, 21, 'Tiradentes'],
    [5, 1, 'Dia do Trabalho'],
    [9, 7, 'Independência do Brasil'],
    [10, 12, 'Nossa Senhora Aparecida'],
    [11, 2, 'Finados'],
    [11, 15, 'Proclamação da República'],
    [12, 25, 'Natal'],
  ];

  for (const [mes, dia, nome] of fixos) {
    map.set(formatarDataISO(ano, mes, dia), { nome, tipo: 'feriado' });
  }

  // Feriados móveis (baseados na Páscoa)
  const pascoa = calcularPascoa(ano);

  const carnaval = adicionarDias(pascoa, -47);
  map.set(formatarDataISO(carnaval.getFullYear(), carnaval.getMonth() + 1, carnaval.getDate()), { nome: 'Carnaval', tipo: 'feriado' });

  const sextaFeiraSanta = adicionarDias(pascoa, -2);
  map.set(formatarDataISO(sextaFeiraSanta.getFullYear(), sextaFeiraSanta.getMonth() + 1, sextaFeiraSanta.getDate()), { nome: 'Sexta-feira Santa', tipo: 'feriado' });

  // A Páscoa em si não é feriado nacional oficial no Brasil (apenas Domingo de Páscoa),
  // mas muitos estados/municípios consideram. Vamos incluir como domingo já não conta.
  // Não adicionamos Páscoa explicitamente pois é sempre domingo.

  const corpusChristi = adicionarDias(pascoa, 60);
  map.set(formatarDataISO(corpusChristi.getFullYear(), corpusChristi.getMonth() + 1, corpusChristi.getDate()), { nome: 'Corpus Christi', tipo: 'feriado' });

  return map;
}

/**
 * Verifica se uma data ("YYYY-MM-DD") é feriado nacional.
 * Retorna null se não for feriado.
 */
export function isFeriadoNacional(data: string): FeriadoInfo | null {
  const ano = parseInt(data.slice(0, 4), 10);
  const feriados = getFeriadosNacionais(ano);
  return feriados.get(data) || null;
}

export interface Registro {
  id?: number;
  user_id: string;
  data: string;
  entrada: string | null;
  intervalo: string | null;
  retorno: string | null;
  saida: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  jornada: string;
  tolerancia: number;
  saldo_inicial: number;
  dark_mode: boolean;
  updated_at?: string;
}

export interface DiaCalendario {
  id?: number;
  user_id: string;
  data: string;
  tipo: 'feriado' | 'folga' | 'licenca' | 'atestado';
  descricao: string | null;
  created_at?: string;
}

export type TipoRegistro = 'entrada' | 'intervalo' | 'retorno' | 'saida';

export interface RegistroDia {
  data: string;
  entrada?: string;
  intervalo?: string;
  retorno?: string;
  saida?: string;
  minutosTrabalhados: number;
  saldoMinutos: number;
}

export type Tab = 'ponto' | 'historico' | 'config';

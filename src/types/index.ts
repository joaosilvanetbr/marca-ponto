export interface Registro {
  id?: string;
  user_id: string;
  data: string;
  entrada: string | null;
  intervalo: string | null;
  retorno: string | null;
  saida: string | null;
  observacao?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LembreteConfig {
  entrada: boolean;
  intervalo: boolean;
  retorno: boolean;
  saida: boolean;
}

export interface Profile {
  id: string;
  jornada: string;
  dias_trabalho?: number[];
  saldo_inicial?: number;
  dark_mode: boolean;
  lembrete_config?: LembreteConfig;
  updated_at?: string;
}

export interface DiaCalendario {
  id?: string;
  user_id: string;
  data: string;
  tipo: 'feriado' | 'folga' | 'licenca' | 'atestado';
  descricao: string | null;
  created_at?: string;
}

export type TipoRegistro = 'entrada' | 'intervalo' | 'retorno' | 'saida';

export type Tab = 'ponto' | 'historico' | 'calendario' | 'config';

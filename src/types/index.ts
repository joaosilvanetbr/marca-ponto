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

export interface Profile {
  id: string;
  jornada: string;
  dias_trabalho?: number[];
  dark_mode: boolean;
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

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Agent Skill
 * Ferramentas para agentes de IA manipularem dados do PontoGO via API REST
 * Usa a anon key já configurada — não precisa da senha do Postgres
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const client = createClient(url, key);

/**
 * Busca o registro de ponto de uma data específica
 */
export async function buscarRegistro(userId: string, data: string) {
  const { data: reg, error } = await client
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();
  if (error) throw error;
  return reg;
}

/**
 * Lista todos os registros de um mês
 */
export async function listarRegistros(userId: string, mes: string) {
  const { data, error } = await client
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .gte('data', `${mes}-01`)
    .lte('data', `${mes}-31`)
    .order('data', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Obtém configurações do usuário
 */
export async function buscarConfiguracoes(userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Calcula estatísticas do mês
 */
export async function estatisticasMes(userId: string, mes: string) {
  const registros = await listarRegistros(userId, mes);
  const profile = await buscarConfiguracoes(userId);
  
  let minutosTrabalhados = 0;
  let saldoAcumulado = 0;
  const jornadaMin = parseInt(profile?.jornada?.split(':')[0] || '8') * 60 + parseInt(profile?.jornada?.split(':')[1] || '0');
  const tolerancia = profile?.tolerancia || 10;

  for (const r of registros) {
    if (r.entrada && r.saida) {
      const [eh, em] = r.entrada.split(':').map(Number);
      const [sh, sm] = r.saida.split(':').map(Number);
      let minutos = (sh * 60 + sm) - (eh * 60 + em);
      if (r.intervalo && r.retorno) {
        const [ih, im] = r.intervalo.split(':').map(Number);
        const [rh, rm] = r.retorno.split(':').map(Number);
        minutos -= (rh * 60 + rm) - (ih * 60 + im);
      }
      minutosTrabalhados += Math.max(0, minutos);
      const diferenca = minutos - jornadaMin;
      if (Math.abs(diferenca) > tolerancia) saldoAcumulado += diferenca;
    }
  }

  return {
    mes,
    totalRegistros: registros.length,
    minutosTrabalhados,
    horasTrabalhadas: `${Math.floor(minutosTrabalhados / 60)}h ${minutosTrabalhados % 60}m`,
    saldoMinutos: saldoAcumulado,
    saldoFormatado: `${saldoAcumulado >= 0 ? '+' : ''}${Math.floor(Math.abs(saldoAcumulado) / 60)}h ${Math.abs(saldoAcumulado) % 60}m`,
    jornada: profile?.jornada || '08:00',
    tolerancia,
  };
}

/**
 * Exporta todos os dados para backup JSON
 */
export async function exportarDados(userId: string) {
  const { data: registros } = await client.from('registros').select('*').eq('user_id', userId).order('data');
  const { data: profile } = await client.from('profiles').select('*').eq('id', userId).single();
  
  return {
    exportado_em: new Date().toISOString(),
    perfil: profile,
    registros: registros || [],
  };
}

/**
 * Resumo diário: compara entrada/saída com jornada esperada
 */
export async function resumoDia(userId: string, data: string) {
  const reg = await buscarRegistro(userId, data);
  const config = await buscarConfiguracoes(userId);
  
  if (!reg || !reg.entrada) {
    return { status: 'sem_registro', mensagem: 'Nenhum registro encontrado para esta data' };
  }
  
  const jornadaMin = parseInt(config?.jornada?.split(':')[0] || '8') * 60 + parseInt(config?.jornada?.split(':')[1] || '0');
  
  if (!reg.saida) {
    const [eh, em] = reg.entrada.split(':').map(Number);
    const saidaPrevista = eh * 60 + em + jornadaMin;
    const h = Math.floor(saidaPrevista / 60);
    const m = saidaPrevista % 60;
    return {
      status: 'em_andamento',
      entrada: reg.entrada,
      previsaoSaida: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      mensagem: `Entrada: ${reg.entrada}. Previsão de saída: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    };
  }
  
  const [eh, em] = reg.entrada.split(':').map(Number);
  const [sh, sm] = reg.saida.split(':').map(Number);
  let minutos = (sh * 60 + sm) - (eh * 60 + em);
  if (reg.intervalo && reg.retorno) {
    const [ih, im] = reg.intervalo.split(':').map(Number);
    const [rh, rm] = reg.retorno.split(':').map(Number);
    minutos -= (rh * 60 + rm) - (ih * 60 + im);
  }
  
  const diferenca = minutos - jornadaMin;
  
  return {
    status: 'completo',
    entrada: reg.entrada,
    saida: reg.saida,
    minutosTrabalhados: minutos,
    horasTrabalhadas: `${Math.floor(minutos / 60)}h ${minutos % 60}m`,
    saldoMinutos: diferenca,
    saldoFormatado: `${diferenca >= 0 ? '+' : ''}${Math.floor(Math.abs(diferenca) / 60)}h ${Math.abs(diferenca) % 60}m`,
    mensagem: `Jornada completa. ${diferenca >= 0 ? 'Horas extras:' : 'Faltam:'} ${Math.floor(Math.abs(diferenca) / 60)}h ${Math.abs(diferenca) % 60}m`
  };
}

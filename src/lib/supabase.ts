import { createClient } from '@supabase/supabase-js';
import type { Registro, Profile, DiaCalendario } from '@/types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error(
    '[PontoGO] Variáveis de ambiente faltando:\n' +
    '  VITE_SUPABASE_URL=' + (url || 'undefined') + '\n' +
    '  VITE_SUPABASE_PUBLISHABLE_KEY=' + (key ? '***definida***' : 'undefined') + '\n\n' +
    'Configure essas variáveis no painel do Cloudflare Pages (Settings > Environment variables) ou crie um arquivo .env na raiz do projeto.'
  );
}

export const supabase = createClient(url || '', key || '');

export function getMonthDateRange(mes: string): { start: string; end: string } {
  const [yearStr, monthStr] = mes.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Mes invalido: ${mes}. Formato esperado: YYYY-MM`);
  }

  const normalizedMonth = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${yearStr}-${normalizedMonth}-01`,
    end: `${yearStr}-${normalizedMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

export async function getRegistros(userId: string, mes: string): Promise<Registro[]> {
  const { start, end } = getMonthDateRange(mes);
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRegistroDoDia(userId: string, data: string): Promise<Registro | null> {
  const { data: reg, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (error) throw error;
  return reg;
}

export async function upsertRegistro(userId: string, registro: Registro): Promise<void> {
  const safeRegistro = { ...registro, user_id: userId };
  const { error } = await supabase
    .from('registros')
    .upsert(safeRegistro, { onConflict: 'user_id,data' });

  if (error) throw error;
}

export async function updateRegistro(userId: string, id: string, updates: Partial<Registro>): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function deleteRegistro(userId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
}

export async function getRegistrosAno(userId: string, ano: number): Promise<Registro[]> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .gte('data', `${ano}-01-01`)
    .lte('data', `${ano}-12-31`)
    .order('data', { ascending: true });

  if (error) throw error;
  return data || [];
}

// --- Calendário (feriados, folgas, etc) ---

export async function getCalendario(userId: string, mes: string): Promise<DiaCalendario[]> {
  const { start, end } = getMonthDateRange(mes);
  const { data, error } = await supabase
    .from('calendario')
    .select('*')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertCalendario(item: DiaCalendario): Promise<void> {
  const { error } = await supabase
    .from('calendario')
    .upsert(item, { onConflict: 'user_id,data' });

  if (error) throw error;
}

export async function deleteCalendario(userId: string, data: string): Promise<void> {
  const { error } = await supabase
    .from('calendario')
    .delete()
    .eq('user_id', userId)
    .eq('data', data);

  if (error) throw error;
}

// --- Push Notifications ---

export async function upsertPushSubscription(userId: string, subscription: any): Promise<void> {
  const { endpoint, keys } = subscription.toJSON();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    }, { onConflict: 'endpoint' });

  if (error) throw error;
}

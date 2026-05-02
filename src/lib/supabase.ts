import { createClient } from '@supabase/supabase-js';
import type { Registro, Profile, DiaCalendario } from '@/types';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(url, key);

export async function getRegistros(userId: string, mes: string): Promise<Registro[]> {
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .eq('user_id', userId)
    .gte('data', `${mes}-01`)
    .lte('data', `${mes}-31`)
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

export async function upsertRegistro(registro: Registro): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .upsert(registro, { onConflict: 'user_id,data' });

  if (error) throw error;
}

export async function updateRegistro(id: number, updates: Partial<Registro>): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteRegistro(id: number): Promise<void> {
  const { error } = await supabase
    .from('registros')
    .delete()
    .eq('id', id);

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

// --- Calendário (feriados, folgas, etc) ---

export async function getCalendario(userId: string, mes: string): Promise<DiaCalendario[]> {
  const { data, error } = await supabase
    .from('calendario')
    .select('*')
    .eq('user_id', userId)
    .gte('data', `${mes}-01`)
    .lte('data', `${mes}-31`)
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

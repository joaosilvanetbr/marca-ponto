import type { Registro, DiaCalendario } from '@/types';
import { upsertRegistro, updateRegistro, deleteRegistro, upsertCalendario, deleteCalendario } from './supabase';

interface QueueItem {
  id: string;
  type: 'upsert' | 'update' | 'delete';
  table: 'registros' | 'calendario';
  payload: unknown;
  timestamp: number;
  retries: number;
  userId: string;
}

const QUEUE_KEY = 'meu-ponto-queue';
const MAX_RETRIES = 3;

/**
 * Criptografia simples para offline queue usando XOR com chave derivada do userId.
 * Nao e criptografia forte, mas impede leitura casual no localStorage.
 */
function deriveKey(userId: string): number[] {
  const key: number[] = [];
  for (let i = 0; i < userId.length; i++) {
    key.push(userId.charCodeAt(i) % 256);
  }
  // Se userId for vazio, usa uma chave padrao nao-nula
  if (key.length === 0) key.push(42);
  return key;
}

function xorEncryptDecrypt(input: string, userId: string): string {
  const key = deriveKey(userId);
  let output = '';
  for (let i = 0; i < input.length; i++) {
    output += String.fromCharCode(input.charCodeAt(i) ^ key[i % key.length]);
  }
  return output;
}

function encryptQueue(queue: QueueItem[], userId: string): string {
  const json = JSON.stringify(queue);
  const scrambled = xorEncryptDecrypt(json, userId);
  return btoa(scrambled);
}

function decryptQueue(encrypted: string, userId: string): QueueItem[] {
  try {
    const scrambled = atob(encrypted);
    const json = xorEncryptDecrypt(scrambled, userId);
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function getQueue(userId: string): QueueItem[] {
  try {
    const encrypted = localStorage.getItem(QUEUE_KEY);
    if (!encrypted) return [];
    return decryptQueue(encrypted, userId);
  } catch {
    return [];
  }
}

function setQueue(queue: QueueItem[], userId: string): void {
  try {
    const encrypted = encryptQueue(queue, userId);
    localStorage.setItem(QUEUE_KEY, encrypted);
  } catch {
    // Fallback: nao salva se criptografia falhar
  }
}

export function addToQueue(type: QueueItem['type'], payload: unknown, table: QueueItem['table'] = 'registros', userId: string = ''): void {
  const queue = getQueue(userId);
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    table,
    payload,
    timestamp: Date.now(),
    retries: 0,
    userId,
  });
  setQueue(queue, userId);
}

export function getPendingCount(userId: string = ''): number {
  if (!userId) {
    // Fallback: tenta ler sem descriptografar (backwards compat)
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (!raw) return 0;
      // Se parece JSON puro (backwards compat), conta length
      if (raw.trim().startsWith('[')) {
        return JSON.parse(raw).length;
      }
      return getQueue(userId).length;
    } catch {
      return 0;
    }
  }
  return getQueue(userId).length;
}

export async function syncQueue(userId: string): Promise<{ success: number; failed: number }> {
  const queue = getQueue(userId);
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueueItem[] = [];

  for (const item of queue) {
    // Seguranca: descarta itens de outros usuarios (ex: localStorage manipulado)
    if (item.userId && item.userId !== userId) {
      failed++;
      continue;
    }
    try {
      if (item.table === 'calendario') {
        if (item.type === 'upsert') {
          await upsertCalendario(item.payload as DiaCalendario);
        } else if (item.type === 'delete') {
          await deleteCalendario(
            (item.payload as { userId: string; data: string }).userId,
            (item.payload as { userId: string; data: string }).data
          );
        }
      } else {
        if (item.type === 'upsert') {
          await upsertRegistro(userId, item.payload as Registro);
        } else if (item.type === 'update') {
          const { id, ...updates } = item.payload as { id: number } & Partial<Registro>;
          await updateRegistro(userId, id, updates);
        } else if (item.type === 'delete') {
          await deleteRegistro(userId, item.payload as number);
        }
      }
      success++;
    } catch {
      item.retries++;
      if (item.retries < MAX_RETRIES) {
        remaining.push(item);
      } else {
        failed++;
      }
    }
  }

  setQueue(remaining, userId);
  return { success, failed };
}

export function clearQueue(_userId?: string): void {
  localStorage.removeItem(QUEUE_KEY);
}

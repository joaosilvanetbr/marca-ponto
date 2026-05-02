import type { Registro, DiaCalendario } from '@/types';
import { upsertRegistro, updateRegistro, deleteRegistro, upsertCalendario, deleteCalendario } from './supabase';

interface QueueItem {
  id: string;
  type: 'upsert' | 'update' | 'delete';
  table: 'registros' | 'calendario';
  payload: unknown;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'meu-ponto-queue';
const MAX_RETRIES = 3;

function getQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(queue: QueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToQueue(type: QueueItem['type'], payload: unknown, table: QueueItem['table'] = 'registros'): void {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    table,
    payload,
    timestamp: Date.now(),
    retries: 0,
  });
  setQueue(queue);
}

export function getPendingCount(): number {
  return getQueue().length;
}

export async function syncQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueueItem[] = [];

  for (const item of queue) {
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
          await upsertRegistro(item.payload as Registro);
        } else if (item.type === 'update') {
          const { id, ...updates } = item.payload as { id: number } & Partial<Registro>;
          await updateRegistro(id, updates);
        } else if (item.type === 'delete') {
          await deleteRegistro(item.payload as number);
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

  setQueue(remaining);
  return { success, failed };
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

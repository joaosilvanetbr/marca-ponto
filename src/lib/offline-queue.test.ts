import { describe, it, expect, beforeEach, vi } from 'vitest'
import { addToQueue, getPendingCount, syncQueue, clearQueue } from './offline-queue'
import * as supabaseModule from './supabase'

vi.mock('./supabase', () => ({
  upsertRegistro: vi.fn(),
  updateRegistro: vi.fn(),
  deleteRegistro: vi.fn(),
  upsertCalendario: vi.fn(),
  deleteCalendario: vi.fn(),
}))

describe('offline-queue', () => {
  const USER_ID = 'user-123'

  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('adds items to queue and counts them', () => {
    expect(getPendingCount(USER_ID)).toBe(0)
    addToQueue('upsert', { id: '1' }, 'registros', USER_ID)
    expect(getPendingCount(USER_ID)).toBe(1)
    addToQueue('delete', '1', 'registros', USER_ID)
    expect(getPendingCount(USER_ID)).toBe(2)
  })

  it('syncs queue successfully', async () => {
    vi.mocked(supabaseModule.upsertRegistro).mockResolvedValue(undefined)
    addToQueue('upsert', { id: '1', user_id: USER_ID }, 'registros', USER_ID)
    const result = await syncQueue(USER_ID)
    expect(result.success).toBe(1)
    expect(result.failed).toBe(0)
    expect(getPendingCount(USER_ID)).toBe(0)
  })

  it('isolates queue per user via encryption', () => {
    addToQueue('upsert', { id: '1' }, 'registros', 'other-user')
    expect(getPendingCount(USER_ID)).toBe(0)
    expect(getPendingCount('other-user')).toBe(1)
  })

  it('distinguishes between temporary network error and permanent auth error', async () => {
    clearQueue()
    
    // 1. Erro temporário
    // 2. Erro permanente
    vi.mocked(supabaseModule.upsertRegistro)
      .mockRejectedValueOnce(new Error('Network error')) // Call 1 (temp)
      .mockRejectedValueOnce(new Error('PostgrestError: new row violates row-level security policy')) // Call 2 (perm)
      .mockResolvedValueOnce(undefined) // Call 3 (temp retry)
    
    addToQueue('upsert', { id: 'temp' }, 'registros', USER_ID)
    addToQueue('upsert', { id: 'perm' }, 'registros', USER_ID)
    
    expect(getPendingCount(USER_ID)).toBe(2)
    
    // Primeira tentativa de sync
    await syncQueue(USER_ID)
    
    // 'perm' deve ser descartado (erro permanente), 'temp' deve sobrar para re-tentar
    expect(getPendingCount(USER_ID)).toBe(1)
    
    // Segunda tentativa de sync (agora 'temp' deve ter sucesso)
    await syncQueue(USER_ID)
    expect(getPendingCount(USER_ID)).toBe(0)
  })

  it('handles UUID IDs correctly in queue', async () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    vi.mocked(supabaseModule.upsertRegistro).mockResolvedValue(undefined)
    
    addToQueue('upsert', { id: uuid }, 'registros', USER_ID)
    expect(getPendingCount(USER_ID)).toBe(1)
    
    await syncQueue(USER_ID)
    expect(supabaseModule.upsertRegistro).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ id: uuid }))
    expect(getPendingCount(USER_ID)).toBe(0)
  })

  it('clears queue', () => {
    addToQueue('upsert', { id: '1' }, 'registros', USER_ID)
    clearQueue()
    expect(getPendingCount(USER_ID)).toBe(0)
  })
})

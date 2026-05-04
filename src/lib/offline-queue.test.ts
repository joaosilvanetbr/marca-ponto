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
    addToQueue('upsert', { id: 1 }, 'registros', USER_ID)
    expect(getPendingCount(USER_ID)).toBe(1)
    addToQueue('delete', 1, 'registros', USER_ID)
    expect(getPendingCount(USER_ID)).toBe(2)
  })

  it('syncs queue successfully', async () => {
    vi.mocked(supabaseModule.upsertRegistro).mockResolvedValue(undefined)
    addToQueue('upsert', { id: 1, user_id: USER_ID }, 'registros', USER_ID)
    const result = await syncQueue(USER_ID)
    expect(result.success).toBe(1)
    expect(result.failed).toBe(0)
    expect(getPendingCount(USER_ID)).toBe(0)
  })

  it('isolates queue per user via encryption', () => {
    addToQueue('upsert', { id: 1 }, 'registros', 'other-user')
    expect(getPendingCount(USER_ID)).toBe(0)
    expect(getPendingCount('other-user')).toBe(1)
  })

  it('retries on failure up to MAX_RETRIES then drops', async () => {
    vi.mocked(supabaseModule.upsertRegistro).mockRejectedValue(new Error('fail'))

    addToQueue('upsert', { id: 1 }, 'registros', USER_ID)
    await syncQueue(USER_ID) // retries=1
    expect(getPendingCount(USER_ID)).toBe(1)
    await syncQueue(USER_ID) // retries=2
    expect(getPendingCount(USER_ID)).toBe(1)
    await syncQueue(USER_ID) // retries=3, dropped
    expect(getPendingCount(USER_ID)).toBe(0)
  })

  it('clears queue', () => {
    addToQueue('upsert', { id: 1 }, 'registros', USER_ID)
    clearQueue()
    expect(getPendingCount(USER_ID)).toBe(0)
  })
})

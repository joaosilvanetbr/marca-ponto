import { describe, it, expect, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}));

import { getMonthDateRange } from './supabase';

describe('getMonthDateRange', () => {
  it('returns correct range for February in non-leap year', () => {
    expect(getMonthDateRange('2025-02')).toEqual({
      start: '2025-02-01',
      end: '2025-02-28',
    });
  });

  it('returns correct range for February in leap year', () => {
    expect(getMonthDateRange('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
  });

  it('returns correct range for months with 30 and 31 days', () => {
    expect(getMonthDateRange('2026-04')).toEqual({
      start: '2026-04-01',
      end: '2026-04-30',
    });
    expect(getMonthDateRange('2026-05')).toEqual({
      start: '2026-05-01',
      end: '2026-05-31',
    });
  });

  it('throws for invalid month format', () => {
    expect(() => getMonthDateRange('2026-13')).toThrow('Mes invalido');
    expect(() => getMonthDateRange('invalid')).toThrow('Mes invalido');
  });
});

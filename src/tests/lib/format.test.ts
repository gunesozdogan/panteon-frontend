import { describe, expect, it } from 'vitest';
import {
  formatCompact,
  formatCountdown,
  formatMoney,
  formatScore,
  initialsFor,
  isoWeekStart,
  prizeSplit,
  weekResetDate,
} from '../../lib/format';

describe('formatScore', () => {
  it('groups thousands and truncates fractions', () => {
    expect(formatScore(4999000)).toBe('4,999,000');
    expect(formatScore(999)).toBe('999');
    expect(formatScore(1234.9)).toBe('1,234');
  });
});

describe('formatMoney', () => {
  it('renders integer minor units as major units with 2 decimals', () => {
    expect(formatMoney(123456)).toBe('1,234.56');
    expect(formatMoney(4000000)).toBe('40,000.00');
    expect(formatMoney(0)).toBe('0.00');
  });

  it('applies a symbol prefix and custom fraction digits', () => {
    expect(formatMoney(4000000, { symbol: '🪙 ' })).toBe('🪙 40,000.00');
    expect(formatMoney(123400, { fractionDigits: 0 })).toBe('1,234');
  });
});

describe('formatCompact', () => {
  it('compacts large numbers', () => {
    expect(formatCompact(4000000)).toBe('4M');
    expect(formatCompact(12500)).toBe('12.5K');
  });
});

describe('initialsFor', () => {
  it('takes one initial from each of the first two parts', () => {
    expect(initialsFor('Player_2500')).toBe('P2');
    expect(initialsFor('Ada Lovelace')).toBe('AL');
  });

  it('falls back to the first two chars for a single token', () => {
    expect(initialsFor('neo')).toBe('NE');
  });

  it('handles empty / whitespace input', () => {
    expect(initialsFor('   ')).toBe('?');
    expect(initialsFor('')).toBe('?');
  });
});

describe('formatCountdown', () => {
  it('collapses non-positive durations to 0s', () => {
    expect(formatCountdown(0)).toBe('0s');
    expect(formatCountdown(-1000)).toBe('0s');
  });

  it('picks the two coarsest non-zero units', () => {
    expect(formatCountdown((3 * 86400 + 4 * 3600 + 30 * 60) * 1000)).toBe('3d 4h');
    expect(formatCountdown((4 * 3600 + 12 * 60 + 9) * 1000)).toBe('4h 12m');
    expect(formatCountdown((12 * 60 + 30) * 1000)).toBe('12m 30s');
    expect(formatCountdown(45 * 1000)).toBe('45s');
  });
});

describe('isoWeekStart / weekResetDate', () => {
  it('returns a Monday at 00:00:00.000 UTC', () => {
    const start = isoWeekStart('2026-W31');
    expect(start.getUTCDay()).toBe(1); // Monday
    expect(start.getUTCHours()).toBe(0);
    expect(start.getUTCMinutes()).toBe(0);
    expect(start.getUTCSeconds()).toBe(0);
    expect(start.getUTCMilliseconds()).toBe(0);
  });

  it('week 1 is the week containing Jan 4 (ISO 8601)', () => {
    const start = isoWeekStart('2026-W01').getTime();
    const jan4 = Date.UTC(2026, 0, 4);
    expect(start).toBeLessThanOrEqual(jan4);
    expect(jan4).toBeLessThan(start + 7 * 86400_000);
  });

  it('consecutive weeks are exactly 7 days apart', () => {
    const w1 = isoWeekStart('2026-W01').getTime();
    const w2 = isoWeekStart('2026-W02').getTime();
    expect(w2 - w1).toBe(7 * 86400_000);
  });

  it('reset is the following Monday (start + 7 days)', () => {
    const start = isoWeekStart('2026-W31').getTime();
    expect(weekResetDate('2026-W31').getTime()).toBe(start + 7 * 86400_000);
  });

  it('rejects a malformed weekId', () => {
    expect(() => isoWeekStart('2026-31')).toThrow();
    expect(() => isoWeekStart('nope')).toThrow();
  });
});

describe('prizeSplit', () => {
  it('splits 20/15/10 with integer floors and a remainder tail', () => {
    expect(prizeSplit(1000)).toEqual({ rank1: 200, rank2: 150, rank3: 100, tail: 550 });
  });

  it('keeps everything integer and conserves the pool', () => {
    const pool = 1001;
    const s = prizeSplit(pool);
    for (const v of Object.values(s)) expect(Number.isInteger(v)).toBe(true);
    expect(s.rank1 + s.rank2 + s.rank3 + s.tail).toBe(pool);
  });
});

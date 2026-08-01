import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGetHistory, mockGetLeaderboard } from '../../api/sampleData';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function settle<T>(promise: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promise;
}

describe('mockGetLeaderboard', () => {
  it('returns a full, well-formed top 100', async () => {
    const res = await settle(mockGetLeaderboard('p0'));

    expect(res.weekId).toBe('2026-W31');
    expect(res.top).toHaveLength(100);
    expect(res.top.map((e) => e.rank)).toEqual(
      Array.from({ length: 100 }, (_, i) => i + 1),
    );

    for (let i = 1; i < res.top.length; i += 1) {
      expect(res.top[i]!.score).toBeLessThan(res.top[i - 1]!.score);
    }
  });

  it('omits `me` for a caller already inside the top 100', async () => {
    const res = await settle(mockGetLeaderboard('p0'));
    expect(res.top[0]!.playerId).toBe('p0');
    expect(res.me).toBeUndefined();
  });

  it('attaches a 6-row self window for a caller outside the top 100', async () => {
    const res = await settle(mockGetLeaderboard('p2500'));

    expect(res.me).toBeDefined();
    const me = res.me!;
    expect(me.entry.rank).toBe(2501);
    expect(me.entry.playerId).toBe('p2500');
    expect(me.window).toHaveLength(6);
    expect(me.window.map((e) => e.rank)).toEqual([2498, 2499, 2500, 2501, 2502, 2503]);
    expect(me.window[3]!.playerId).toBe('p2500');
  });
});

describe('mockGetHistory', () => {
  it('returns 100 standings with the documented top-3 prize split', async () => {
    const doc = await settle(mockGetHistory('2026-W30'));

    expect(doc.weekId).toBe('2026-W30');
    expect(doc.standings).toHaveLength(100);
    expect(doc.standings[0]!.prize).toBe(800_000);
    expect(doc.standings[1]!.prize).toBe(600_000);
    expect(doc.standings[2]!.prize).toBe(400_000);
    expect(doc.standings.every((s) => typeof s.prize === 'number')).toBe(true);
  });
});

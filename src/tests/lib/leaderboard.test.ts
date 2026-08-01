import { describe, expect, it } from 'vitest';
import { findSelfIndex } from '../../lib/leaderboard';
import type { LeaderboardEntry } from '../../types/domain';

function entry(playerId: string, rank: number): LeaderboardEntry {
  return { rank, playerId, username: playerId, score: 1000 - rank };
}

const entries: LeaderboardEntry[] = [
  entry('p1', 1),
  entry('p2', 2),
  entry('p3', 3),
];

describe('findSelfIndex', () => {
  it('returns the index of the matching player', () => {
    expect(findSelfIndex(entries, 'p2')).toBe(1);
  });

  it('returns -1 when the player is not in the list', () => {
    expect(findSelfIndex(entries, 'p999')).toBe(-1);
  });

  it('returns -1 when no playerId is supplied', () => {
    expect(findSelfIndex(entries, undefined)).toBe(-1);
    expect(findSelfIndex(entries, '')).toBe(-1);
  });

  it('returns -1 for an empty list', () => {
    expect(findSelfIndex([], 'p1')).toBe(-1);
  });
});

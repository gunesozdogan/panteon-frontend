import type { LeaderboardEntry } from '../types/domain';

/**
 * Index of the viewing player's own row within a list of entries, or `-1` if
 * absent. Pure so the "jump to my rank" affordance and the in-place highlight
 * share one, tested definition of "which row is me" (the screen's core promise:
 * the player can always find themselves).
 */
export function findSelfIndex(
  entries: readonly LeaderboardEntry[],
  playerId: string | undefined,
): number {
  if (!playerId) return -1;
  return entries.findIndex((entry) => entry.playerId === playerId);
}

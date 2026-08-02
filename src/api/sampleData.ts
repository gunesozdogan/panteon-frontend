/**
 * In-memory sample data mirroring the backend contract — deterministic fixtures
 * for unit tests and stories, imported directly where needed. NOT wired into the
 * runtime client: the app always talks to the real backend (a cold start is
 * handled by retry + a loading state, not by swapping in fakes).
 *
 * Shapes are deliberately faithful to the real API:
 *  - `top` is 100 rows, ranks 1..100, scores strictly descending.
 *  - `me` is present only when a `playerId` is given AND that player is outside
 *    the top 100 (matching the backend, which flags in-top players inside `top`
 *    and omits `me`).
 *  - the self window is 3 above + self + 2 below, clipped at the board edges.
 */
import { SAMPLE_PLAYER_ID } from '../config';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  SelfView,
  WeeklyStanding,
  WeeklyStandingsDoc,
  WeekId,
} from '../types/domain';

const MOCK_WEEK_ID: WeekId = '2026-W31';
const TOP_SIZE = 100;
/** Sample prize pool (integer minor units) for mock responses. */
const MOCK_POOL = 4_000_000;
/** Simulated network latency so loading states are exercised in mock mode. */
const MOCK_LATENCY_MS = 180;

function usernameFor(playerId: string): string {
  const suffix = playerId.replace(/^p/, '');
  return `Player_${suffix}`;
}

/** Deterministic 1-indexed rank for a `p<n>` id (p0 -> 1). Falls back to 2501. */
function rankFor(playerId: string): number {
  const n = Number(playerId.replace(/^p/, ''));
  return Number.isInteger(n) && n >= 0 ? n + 1 : 2501;
}

/** Monotonically decreasing score so higher ranks always outscore lower ones. */
function scoreFor(rank: number): number {
  return Math.max(1_000, 5_000_000 - rank * 1_234 - (rank % 9) * 137);
}

function entryFor(rank: number, playerId = `p${rank - 1}`): LeaderboardEntry {
  return {
    rank,
    playerId,
    username: usernameFor(playerId),
    score: scoreFor(rank),
  };
}

function buildTop(): LeaderboardEntry[] {
  return Array.from({ length: TOP_SIZE }, (_, i) => entryFor(i + 1));
}

function buildSelfView(playerId: string): SelfView {
  const rank = rankFor(playerId);
  const self = entryFor(rank, playerId);
  const window: LeaderboardEntry[] = [];
  for (let r = rank - 3; r <= rank + 2; r += 1) {
    if (r < 1) continue;
    window.push(r === rank ? self : entryFor(r));
  }
  return { entry: self, window };
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export function mockGetLeaderboard(playerId?: string): Promise<LeaderboardResponse> {
  const top = buildTop();
  const response: LeaderboardResponse = {
    weekId: MOCK_WEEK_ID,
    top,
    pool: MOCK_POOL,
    totalPlayers: 4321,
  };

  const id = playerId ?? SAMPLE_PLAYER_ID;
  const inTop = top.some((e) => e.playerId === id);
  if (!inTop) response.me = buildSelfView(id);

  return delay(response);
}

/** Rough top-3 / 55%-tail split so mocked history rows carry believable prizes. */
function prizeFor(rank: number, pool: number): number {
  if (rank === 1) return Math.floor(pool * 0.2);
  if (rank === 2) return Math.floor(pool * 0.15);
  if (rank === 3) return Math.floor(pool * 0.1);
  if (rank > TOP_SIZE) return 0;
  const weight = 101 - rank;
  const totalWeight = ((101 - 4) + (101 - TOP_SIZE)) * (TOP_SIZE - 3) / 2;
  return Math.floor((pool * 0.55 * weight) / totalWeight);
}

export function mockGetHistory(weekId: WeekId): Promise<WeeklyStandingsDoc> {
  const pool = MOCK_POOL;
  const standings: WeeklyStanding[] = Array.from({ length: TOP_SIZE }, (_, i) => {
    const rank = i + 1;
    const base = entryFor(rank);
    return {
      rank,
      playerId: base.playerId,
      username: base.username,
      score: base.score,
      prize: prizeFor(rank, pool),
    };
  });

  return delay({
    weekId,
    closedAt: '2026-08-03T00:00:00.000Z',
    standings,
  });
}

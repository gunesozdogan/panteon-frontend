/**
 * Typed leaderboard API client. The single place the frontend talks to the
 * backend contract (`src/types/domain.ts`). Every request is a retrying,
 * cancellable GET (see `http.ts`) — the retry/backoff is what carries the UI
 * through a backend cold start.
 */
import type {
  LeaderboardResponse,
  PlayerSampleResponse,
  WeeklyStandingsDoc,
  WeekId,
} from '../types/domain';
import { apiGet, type ApiRequestOptions } from './http';

/** `GET /leaderboard?playerId=…` — top 100 plus the caller's own view when outside it. */
export function getLeaderboard(
  playerId?: string,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse> {
  const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : '';
  return apiGet<LeaderboardResponse>(`/leaderboard${query}`, options);
}

/** `GET /leaderboard/history/:weekId` — a closed week's archived standings. */
export function getHistory(
  weekId: WeekId,
  options: ApiRequestOptions = {},
): Promise<WeeklyStandingsDoc> {
  return apiGet<WeeklyStandingsDoc>(
    `/leaderboard/history/${encodeURIComponent(weekId)}`,
    options,
  );
}

/**
 * `GET /players/sample?n=…` — a fresh random set of players (with rank + a
 * `inTop100` label, at least one in the top 100) for the demo user picker.
 */
export function getPlayerSample(
  n?: number,
  options: ApiRequestOptions = {},
): Promise<PlayerSampleResponse> {
  const query = n ? `?n=${encodeURIComponent(String(n))}` : '';
  return apiGet<PlayerSampleResponse>(`/players/sample${query}`, options);
}

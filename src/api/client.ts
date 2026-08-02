/**
 * Typed leaderboard API client. The single place the frontend talks to the
 * backend contract (`src/types/domain.ts`). Every request is a retrying,
 * cancellable GET (see `http.ts`) — the retry/backoff is what carries the UI
 * through a backend cold start.
 */
import type {
  CloseWeekResult,
  HistoryListResponse,
  LeaderboardResponse,
  PlayerSampleResponse,
  PlayerWalletResponse,
  WeeklyStandingsDoc,
  WeekId,
} from '../types/domain';
import { apiGet, apiPost, type ApiRequestOptions } from './http';

/** Result of one `POST /admin/simulate` batch (the demo live-traffic tick). */
export interface SimulateResult {
  weekId: WeekId;
  boardSize: number;
  playersHit: number;
  totalEarned: number;
}

/** `GET /leaderboard?playerId=…` — top 100 plus the caller's own view when outside it. */
export function getLeaderboard(
  playerId?: string,
  options: ApiRequestOptions = {},
): Promise<LeaderboardResponse> {
  const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : '';
  return apiGet<LeaderboardResponse>(`/leaderboard${query}`, options);
}

export function getHistoryList(
  options: ApiRequestOptions = {},
): Promise<HistoryListResponse> {
  return apiGet<HistoryListResponse>('/leaderboard/history', options);
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

/**
 * `GET /players/ranks?ids=…` — current rank/label for a SPECIFIC set of players
 * (the picker's in-place refresh: same faces, fresh ranks). Ids no longer on the
 * board are omitted from the response.
 */
export function getPlayerRanks(
  ids: readonly string[],
  options: ApiRequestOptions = {},
): Promise<PlayerSampleResponse> {
  const query = `?ids=${encodeURIComponent(ids.join(','))}`;
  return apiGet<PlayerSampleResponse>(`/players/ranks${query}`, options);
}

/**
 * `GET /players/:playerId/wallet` — a player's durable money view (total winnings
 * + per-close payout history) from Postgres. This is what surfaces the wallet
 * credits that close-week writes; the live competition score stays on the
 * leaderboard endpoint. Retrying GET (carries through a cold start).
 */
export function getPlayerWallet(
  playerId: string,
  options: ApiRequestOptions = {},
): Promise<PlayerWalletResponse> {
  return apiGet<PlayerWalletResponse>(
    `/players/${encodeURIComponent(playerId)}/wallet`,
    options,
  );
}

/**
 * `POST /admin/simulate` — apply one batch of random earns so the board keeps
 * moving (demo live traffic). Fired on the poll tick when the "Live demo" toggle
 * is on. Backend caps `count`; omit it to use the server default.
 */
export function simulateActivity(
  count?: number,
  options: ApiRequestOptions = {},
): Promise<SimulateResult> {
  return apiPost<SimulateResult>('/admin/simulate', count ? { count } : {}, options);
}

/**
 * `POST /admin/close-week` with `{ early: true }` — a DEMO SNAPSHOT of the
 * current live week: distributes + archives the current standings under a
 * server-minted `-early` id and credits wallets, WITHOUT resetting the board
 * (the week keeps running). Lets a reviewer trigger the end-of-week payout by
 * hand instead of waiting for the Monday cron. Single attempt, no retry (it's a
 * side-effecting POST); the backend mints a fresh archive id per call.
 */
export function closeWeekEarly(
  options: ApiRequestOptions = {},
): Promise<CloseWeekResult> {
  return apiPost<CloseWeekResult>('/admin/close-week', { early: true }, options);
}

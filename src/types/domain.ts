/**
 * Shared domain types — the leaderboard API contract.
 *
 * ⚠️ SOURCE OF TRUTH IS THE BACKEND: `backend-leaderboard/src/types/domain.ts`.
 * Client and server are separate repos (see CLAUDE.md), so these types are COPIED
 * here rather than imported from a workspace package. If the backend contract
 * changes, re-copy this file. Keep only the types the frontend actually consumes.
 */

/** A `weekId` in deterministic ISO-week form, e.g. `2026-W31`. */
export type WeekId = string;

export interface Player {
  id: string;
  username: string;
}

export interface LeaderboardEntry {
  /** 1-indexed display rank. */
  rank: number;
  playerId: string;
  username: string;
  /** Weekly earnings, integer minor units. */
  score: number;
  /** Prize won, integer minor units. Only present on archived/closed weeks. */
  prize?: number;
}

/** The requesting player's own position when they are OUTSIDE the top 100. */
export interface SelfView {
  entry: LeaderboardEntry;
  /** 3 above + self + 2 below (up to 6 rows), honoring board boundaries. */
  window: LeaderboardEntry[];
}

export interface LeaderboardResponse {
  weekId: WeekId;
  top: LeaderboardEntry[];
  /**
   * Live prize pool for the week: 2% of total earnings so far, in integer minor
   * units (`floor(earn_total * 2 / 100)`). Computed per-request so it tracks live
   * earnings between reads.
   */
  pool: number;
  /**
   * Total players on the board this week (everyone who has earned at least once,
   * `ZCARD lb:{weekId}`). `top` is capped at 100, so this is the true competitor
   * count; tracks new joiners live.
   */
  totalPlayers: number;
  /**
   * The caller's own view. Omitted when the caller is already in `top`
   * (they're flagged inside `top` instead) or when no playerId was supplied.
   */
  me?: SelfView;
}

/** Body of `POST /events/earn`. */
export interface EarnEvent {
  playerId: string;
  /** Amount earned this event, integer minor units (> 0). */
  amount: number;
}

/**
 * One row of a closed week's final standings. Unlike the live `LeaderboardEntry`,
 * `prize` is always present here (the week has been distributed).
 */
export interface WeeklyStanding {
  /** 1-indexed final rank. */
  rank: number;
  playerId: string;
  username: string;
  /** Final weekly earnings, integer minor units. */
  score: number;
  /** Prize won, integer minor units (0 for ranks outside the paid board). */
  prize: number;
}

/**
 * A closed week, archived as a single MongoDB document (one doc per week). The
 * flexible document shape fits variable-length standings naturally — this is why
 * the historical archive lives in Mongo, not Redis/Postgres (see CLAUDE.md).
 */
export interface WeeklyStandingsDoc {
  weekId: WeekId;
  /** ISO-8601 timestamp of when the week was closed. */
  closedAt: string;
  standings: WeeklyStanding[];
}

/**
 * Lean summary of one archived week, from `GET /leaderboard/history` (the list
 * endpoint). Populates the "past weeks" picker without pulling full standings.
 */
export interface WeeklyStandingsSummary {
  weekId: WeekId;
  /** ISO-8601 timestamp of when the week was closed. */
  closedAt: string;
  /** How many players were in the archived standings. */
  playerCount: number;
}

/** Response of `GET /leaderboard/history` — the archived-week list. */
export interface HistoryListResponse {
  weeks: WeeklyStandingsSummary[];
}

/**
 * One row of the demo player picker's random sample (`GET /players/sample`).
 * Auth is scoped out, so a reviewer switches "who am I" by picking a playerId;
 * this feeds that picker with real, freshly-sampled players + their labels.
 */
export interface PlayerSample {
  playerId: string;
  username: string;
  /** 1-indexed current rank. */
  rank: number;
  /** True when rank <= 100 — labels the picker ("Top 100" vs "Outside"). */
  inTop100: boolean;
}

export interface PlayerSampleResponse {
  weekId: WeekId;
  /** Random players, sorted by rank; at least one is in the top 100. */
  players: PlayerSample[];
}

/** One prize a player won in a past close (a row of the backend `payouts` table). */
export interface PlayerPayout {
  weekId: WeekId;
  /** Final rank in that close. */
  rank: number;
  /** Prize won, integer minor units. */
  prize: number;
  /** ISO-8601 timestamp the prize was distributed. */
  distributedAt: string;
}

/**
 * A player's durable money view (`GET /players/:playerId/wallet`) — sourced from
 * Postgres (the money source of truth), NOT Redis. `balance` is the cumulative
 * winnings credited across all closes; `payouts` is the per-close breakdown.
 * All money fields are integer minor units.
 */
export interface PlayerWalletResponse {
  playerId: string;
  username: string;
  /** Total winnings credited to the wallet, integer minor units. */
  balance: number;
  /** Prizes won per close, newest first. */
  payouts: PlayerPayout[];
}

/**
 * Summary returned by `POST /admin/close-week`. For the `{ early: true }` demo
 * close, `weekId` is the server-minted `-early` archive id (the live week is
 * distributed + archived AND reset — scores/pool back to 0). All money fields are
 * integer minor units.
 */
export interface CloseWeekResult {
  weekId: WeekId;
  /** ISO-8601 timestamp of when the week was closed/snapshotted. */
  closedAt: string;
  /** Raw total earned this week (`earn_total:{weekId}`). */
  earnTotal: number;
  /** Distributable pool = floor(earnTotal * 2 / 100). */
  pool: number;
  /** Players who received a payout this run (0 on an idempotent re-run). */
  playersPaid: number;
  /** Σ of prizes actually credited to wallets this run. */
  totalDistributed: number;
  /** True when there was nothing to close — the routine was a safe no-op. */
  alreadyClosed: boolean;
}
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
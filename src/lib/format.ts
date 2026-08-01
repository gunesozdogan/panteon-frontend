const GROUPED = new Intl.NumberFormat('en-US');

/** How many minor units make one major unit (e.g. 100 cents = 1 coin). */
export const MINOR_PER_MAJOR = 100;

/** A raw score (integer points) with thousands separators: 4999000 -> "4,999,000". */
export function formatScore(score: number): string {
  return GROUPED.format(Math.trunc(score));
}

export interface MoneyOptions {
  /** Prefix symbol, e.g. "🪙 " or "$". Default: none. */
  symbol?: string;
  /** Decimal places to show. Default: 2. */
  fractionDigits?: number;
}

export function formatMoney(minorUnits: number, opts: MoneyOptions = {}): string {
  const fractionDigits = opts.fractionDigits ?? 2;
  const major = minorUnits / MINOR_PER_MAJOR;
  const body = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(major);
  return opts.symbol ? `${opts.symbol}${body}` : body;
}

/** Compact large numbers for tight spaces: 4000000 -> "4M", 12500 -> "12.5K". */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/** Up to two initials from a username for avatar fallbacks: "Player_2500" -> "P2". */
export function initialsFor(username: string): string {
  const cleaned = username.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

/**
 * A positive duration in ms as a coarse "Xd Yh" / "Yh Zm" / "Zm Ws" / "Ws" label.
 * Non-positive durations collapse to "0s" (the week has already reset).
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * UTC `Date` for the Monday 00:00 that STARTS the given ISO week ("2026-W31").
 * Mirrors the backend's Monday-00:00-UTC week boundary
 */
export function isoWeekStart(weekId: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId);
  if (!match) throw new Error(`invalid weekId: ${weekId}`);
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1) + (week - 1) * 7);
  return monday;
}

/** When the given week closes & the board resets: the following Monday 00:00 UTC. */
export function weekResetDate(weekId: string): Date {
  const start = isoWeekStart(weekId);
  const reset = new Date(start);
  reset.setUTCDate(start.getUTCDate() + 7);
  return reset;
}

export interface PrizeSplit {
  rank1: number;
  rank2: number;
  rank3: number;
  /** Ranks 4–100 share this remainder (integer minor units). */
  tail: number;
}

/**
 * Top-3 prize amounts from a pool (integer minor units): 20% / 15% / 10%, floored
 * with integer math to match the backend distribution. The remaining 55% (plus any
 * floor dust) is `tail`, shared by ranks 4–100.
 */
export function prizeSplit(pool: number): PrizeSplit {
  const rank1 = Math.floor((pool * 20) / 100);
  const rank2 = Math.floor((pool * 15) / 100);
  const rank3 = Math.floor((pool * 10) / 100);
  return { rank1, rank2, rank3, tail: pool - rank1 - rank2 - rank3 };
}

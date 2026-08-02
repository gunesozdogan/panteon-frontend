import type { PlayerWalletResponse } from '../types/domain';
import { formatMoney, formatScore } from '../lib/format';
import { cx } from '../lib/cx';
import { Avatar } from './Avatar';
import { RankBadge } from './RankBadge';

export interface EarningsPanelProps {
  /** Fetch state of the wallet (`usePlayerWallet().status`). */
  status: 'idle' | 'loading' | 'success' | 'error';
  /** The selected player's durable money view. `undefined` = unknown/no wallet. */
  wallet?: PlayerWalletResponse | undefined;
  /** Fallback display name while the wallet loads (from the picker/leaderboard). */
  username?: string | undefined;
  /** The player's CURRENT standing (live week or selected archive), if known. */
  current?: { rank: number; score: number; prize?: number } | undefined;
  /** Label for the current standing, e.g. "This week" or a weekId. */
  currentLabel?: string;
  className?: string;
}

/**
 * The selected player's earnings: total winnings (wallet balance, from Postgres —
 * the money source of truth) plus a per-close payout history, and their current
 * standing. This is where the wallet credits written by close-week become
 * visible. Presentational + prop-driven; the fetch lives in `usePlayerWallet`.
 */
export function EarningsPanel({
  status,
  wallet,
  username,
  current,
  currentLabel = 'This week',
  className,
}: EarningsPanelProps) {
  const name = wallet?.username ?? username ?? 'Player';
  const payouts = wallet?.payouts ?? [];

  return (
    <section
      aria-label="Your earnings"
      className={cx(
        'flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-zinc-900',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <Avatar username={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
            {name}
          </div>
          {current && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentLabel}: <span className="font-medium">#{current.rank}</span>
              {current.prize != null
                ? current.prize > 0
                  ? ` · 🪙 ${formatMoney(current.prize)}`
                  : ' · no prize'
                : ` · ${formatScore(current.score)} pts`}
            </div>
          )}
        </div>
      </header>

      <div className="rounded-lg bg-brand/5 p-3 dark:bg-brand/10">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Total winnings
        </div>
        {status === 'loading' ? (
          <div className="mt-1 h-7 w-28 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        ) : status === 'error' ? (
          <div className="mt-1 text-sm text-red-600 dark:text-red-400">
            Couldn't load earnings.
          </div>
        ) : (
          <div className="mt-0.5 text-2xl font-extrabold tabular-nums text-brand dark:text-brand-soft">
            🪙 {formatMoney(wallet?.balance ?? 0)}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          Prize history
        </div>
        {status === 'loading' ? (
          <ul className="flex flex-col gap-1.5" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="h-8 animate-pulse rounded-md bg-black/5 dark:bg-white/5"
              />
            ))}
          </ul>
        ) : payouts.length === 0 ? (
          <p className="rounded-md border border-dashed border-black/10 px-3 py-4 text-center text-xs text-zinc-500 dark:border-white/10">
            No prizes yet — finish a week in the top 100 to win a share of the pool.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {payouts.map((p) => (
              <li
                key={p.weekId}
                className="flex items-center gap-2 rounded-md border border-black/5 px-2.5 py-1.5 text-sm dark:border-white/5"
              >
                <RankBadge rank={p.rank} size="sm" />
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">
                  {p.weekId}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-brand dark:text-brand-soft">
                  🪙 {formatMoney(p.prize)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

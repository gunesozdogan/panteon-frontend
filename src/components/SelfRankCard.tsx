import type { LeaderboardEntry } from '../types/domain';
import { formatMoney, formatScore } from '../lib/format';
import { cx } from '../lib/cx';
import { Avatar } from './Avatar';
import { CoinIcon, TrophyIcon } from './icons';

export interface SelfRankCardProps {
  /** The viewing player's own entry. */
  entry: LeaderboardEntry;
  /** Total ranked players, for "of N" context. Optional. */
  totalPlayers?: number;
  /** Show the prize won instead of the live score (closed-week / history view). */
  showPrize?: boolean;
  className?: string;
}

export function SelfRankCard({
  entry,
  totalPlayers,
  showPrize = false,
  className,
}: SelfRankCardProps) {
  const inTop100 = entry.rank <= 100;
  const hasPrize = showPrize && entry.prize != null;
  return (
    <div
      aria-label="Your rank"
      className={cx(
        'flex items-center gap-3 rounded-xl border border-me/30 bg-me/10 p-3 sm:p-4',
        'shadow-sm backdrop-blur',
        className,
      )}
    >
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-me">You</span>
        <span className="text-2xl font-extrabold leading-none tabular-nums text-me sm:text-3xl">
          #{entry.rank}
        </span>
        {totalPlayers != null && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            of {formatScore(totalPlayers)}
          </span>
        )}
      </div>

      <Avatar username={entry.username} size="lg" className="hidden sm:inline-flex" />

      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
          {entry.username}
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hasPrize ? (
            entry.prize! > 0 ? (
              'You won a prize'
            ) : (
              'No prize this week'
            )
          ) : inTop100 ? (
            <>
              <TrophyIcon className="h-3.5 w-3.5 text-gold" />
              In the top 100
            </>
          ) : (
            'Outside the top 100'
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {hasPrize ? (
          <>
            <div className="flex items-center justify-end gap-1 font-bold tabular-nums text-brand dark:text-brand-soft">
              <CoinIcon />
              {formatMoney(entry.prize!)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">Prize</div>
          </>
        ) : (
          <>
            <div className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatScore(entry.score)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">Score</div>
          </>
        )}
      </div>
    </div>
  );
}

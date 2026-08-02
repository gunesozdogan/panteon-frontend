import type { CSSProperties } from 'react';
import type { LeaderboardEntry } from '../types/domain';
import { formatMoney, formatScore } from '../lib/format';
import { cx } from '../lib/cx';
import { Avatar } from './Avatar';
import { RankBadge } from './RankBadge';
import { CoinIcon } from './icons';

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  /** Highlight + tag this row as the viewing player's own. */
  isMe?: boolean;
  /** Show the prize column (history / closed-week views). */
  showPrize?: boolean;
  style?: CSSProperties;
  className?: string;
}

export function LeaderboardRow({
  entry,
  isMe = false,
  showPrize = false,
  style,
  className,
}: LeaderboardRowProps) {
  const hasPrize = showPrize && entry.prize != null;
  return (
    <div
      style={style}
      aria-current={isMe ? 'true' : undefined}
      className={cx(
        'flex min-h-[3.25rem] items-center gap-2 px-2 sm:gap-3 sm:px-4',
        'border-b border-black/5 dark:border-white/5',
        isMe
          ? 'bg-me/10 ring-1 ring-inset ring-me/40'
          : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
        className,
      )}
    >
      <RankBadge rank={entry.rank} size="sm" className="sm:h-9 sm:min-w-9" />
      <Avatar username={entry.username} size="sm" className="sm:h-9 sm:w-9 sm:text-xs" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
            {entry.username}
          </span>
          {isMe && (
            <span className="shrink-0 rounded-full bg-me px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              You
            </span>
          )}
        </div>
        {hasPrize && (
          <div className="truncate text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            {formatScore(entry.score)} pts
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        {hasPrize ? (
          <>
            <div className="flex items-center justify-end gap-1 font-semibold tabular-nums text-brand dark:text-brand-soft">
              <CoinIcon />
              {formatMoney(entry.prize!)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">Prize</div>
          </>
        ) : (
          <>
            <div className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatScore(entry.score)}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-zinc-400">Score</div>
          </>
        )}
      </div>
    </div>
  );
}

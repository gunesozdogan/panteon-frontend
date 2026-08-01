import { cx } from '../lib/cx';
import { LEADERBOARD_ROW_HEIGHT } from './VirtualizedLeaderboard';

export interface LeaderboardSkeletonProps {
  /** How many placeholder rows to render. */
  rows?: number;
  className?: string;
}

/**
 * Loading placeholder that mirrors the leaderboard row layout (rank / avatar /
 * name / score) so the switch to real data doesn't shift the layout. Purely
 * presentational; `aria-hidden` since it carries no information.
 */
export function LeaderboardSkeleton({ rows = 8, className }: LeaderboardSkeletonProps) {
  return (
    <div
      aria-hidden
      data-testid="leaderboard-skeleton"
      className={cx(
        'overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900',
        className,
      )}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{ height: LEADERBOARD_ROW_HEIGHT }}
          className="flex items-center gap-2 border-b border-black/5 px-2 sm:gap-3 sm:px-4 dark:border-white/5"
        >
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-md bg-black/10 sm:h-9 sm:w-9 dark:bg-white/10" />
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-black/10 sm:h-9 sm:w-9 dark:bg-white/10" />
          <div className="h-3.5 flex-1 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3.5 w-12 shrink-0 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

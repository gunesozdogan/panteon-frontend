import { formatCountdown, weekResetDate } from '../lib/format';
import { cx } from '../lib/cx';

export interface WeeklyStatusProps {
  weekId: string;
  /**
   * When the week resets. If omitted, it's derived from `weekId` (the following
   * Monday 00:00 UTC). Accepts a `Date` or ISO string.
   */
  resetsAt?: Date | string;
  /** Injectable clock for deterministic rendering/tests. Default: now. */
  now?: Date;
  className?: string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function WeeklyStatus({ weekId, resetsAt, now = new Date(), className }: WeeklyStatusProps) {
  const reset = resetsAt != null ? toDate(resetsAt) : weekResetDate(weekId);
  const remainingMs = reset.getTime() - now.getTime();
  const resetting = remainingMs <= 0;

  return (
    <div
      className={cx(
        'flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2',
        'bg-white/60 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-me" aria-hidden />
        <span className="whitespace-nowrap text-xs font-semibold text-zinc-800 sm:text-sm dark:text-zinc-100">
          {weekId}
        </span>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {resetting ? 'Status' : 'Resets in'}
        </div>
        <div className="whitespace-nowrap text-xs font-semibold tabular-nums text-zinc-800 sm:text-sm dark:text-zinc-100">
          {resetting ? 'Resetting…' : formatCountdown(remainingMs)}
        </div>
      </div>
    </div>
  );
}

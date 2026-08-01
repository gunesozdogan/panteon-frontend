import type { WeekId, WeeklyStandingsSummary } from '../types/domain';
import { cx } from '../lib/cx';

export interface WeekSelectorProps {
  /** Archived (closed) weeks, newest first. */
  weeks: readonly WeeklyStandingsSummary[];
  /** Currently selected past week, or `undefined` for the live week. */
  value: WeekId | undefined;
  /** Called with a `weekId` for a past week, or `undefined` for "This week (live)". */
  onChange: (weekId: WeekId | undefined) => void;
  /** Disable while the list is still loading. */
  loading?: boolean;
  className?: string;
}

/** Sentinel <option> value for the live week (native selects only carry strings). */
const LIVE = '';

/**
 * A native <select> for switching between the live week and any archived week.
 * Native (not a custom dropdown) on purpose: it's the most accessible and the
 * best mobile experience out of the box. Presentational + prop-driven — the
 * week list and selection are owned by the screen.
 */
export function WeekSelector({
  weeks,
  value,
  onChange,
  loading = false,
  className,
}: WeekSelectorProps) {
  return (
    <label className={cx('flex items-center gap-2', className)}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Week
      </span>
      <select
        value={value ?? LIVE}
        disabled={loading}
        onChange={(e) => onChange(e.target.value === LIVE ? undefined : e.target.value)}
        aria-label="Select which week to view"
        className={cx(
          'min-w-0 cursor-pointer rounded-md border border-black/10 bg-white px-2 py-1.5 text-sm',
          'text-zinc-900 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100',
        )}
      >
        <option value={LIVE}>🟢 This week (live)</option>
        {weeks.map((w) => (
          <option key={w.weekId} value={w.weekId}>
            {w.weekId} · {w.playerCount} players
          </option>
        ))}
      </select>
    </label>
  );
}

import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

export interface StatCardProps {
  /** Short uppercase label, e.g. "Players". */
  label: string;
  /** The headline value (pre-formatted). */
  value: ReactNode;
  /** Optional leading glyph/emoji. */
  icon?: ReactNode;
  /** Optional secondary line under the value. */
  hint?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, hint, className }: StatCardProps) {
  return (
    <div
      className={cx(
        'flex min-w-0 flex-col rounded-lg border border-black/10 bg-white/60 px-3 py-2',
        'dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="flex items-baseline gap-1 truncate text-base font-bold tabular-nums text-zinc-900 sm:text-lg dark:text-zinc-100">
        {icon != null && <span aria-hidden>{icon}</span>}
        {value}
      </span>
      {hint != null && (
        <span className="truncate text-[11px] text-zinc-400">{hint}</span>
      )}
    </div>
  );
}

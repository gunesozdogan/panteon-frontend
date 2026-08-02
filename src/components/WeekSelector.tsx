import { useEffect, useRef, useState } from 'react';
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

/** Sentinel value for the live week. */
const LIVE = '';

interface WeekOption {
  /** `LIVE` for the live week, else the `weekId`. */
  id: string;
  label: string;
  /** Player count shown as muted trailing text (archived weeks only). */
  count?: number;
  live?: boolean;
}

/** A custom (non-native) dropdown for switching between the live week and any archived week. */
export function WeekSelector({
  weeks,
  value,
  onChange,
  loading = false,
  className,
}: WeekSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sortedWeeks = [...weeks].sort((a, b) => {
    const byClosedAt = b.closedAt.localeCompare(a.closedAt);
    return byClosedAt !== 0 ? byClosedAt : b.weekId.localeCompare(a.weekId);
  });

  const options: WeekOption[] = [
    { id: LIVE, label: 'This week (live)', live: true },
    ...sortedWeeks.map((w) => ({ id: w.weekId, label: w.weekId, count: w.playerCount })),
  ];
  const selectedId = value ?? LIVE;
  const selected = options.find((o) => o.id === selectedId) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = (id: string) => {
    onChange(id === LIVE ? undefined : id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cx('relative', className)}>
      <span className="mb-1 block px-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:hidden dark:text-zinc-400">
        Week
      </span>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select which week to view"
        className={cx(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left',
          'text-base font-medium sm:py-1.5 sm:text-sm',
          'border-black/10 bg-white text-zinc-900 shadow-sm transition hover:bg-black/[0.02]',
          'dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/[0.03]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open && 'ring-2 ring-brand/40',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.live ? (
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          )}
          <span className="truncate">{selected?.label}</span>
          {selected?.count != null && (
            <span className="shrink-0 text-zinc-400">· {selected.count} players</span>
          )}
        </span>
        <Chevron className={cx('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Weeks"
          className={cx(
            'absolute inset-x-0 z-30 mt-1.5 max-h-72 w-full overflow-y-auto',
            'rounded-xl border border-black/10 bg-white p-1 shadow-xl',
            'dark:border-white/10 dark:bg-zinc-900',
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.id === selectedId;
            return (
              <li
                key={opt.id || 'live'}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => select(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(opt.id);
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const next = e.currentTarget[
                      e.key === 'ArrowDown' ? 'nextElementSibling' : 'previousElementSibling'
                    ] as HTMLElement | null;
                    next?.focus();
                  }
                }}
                className={cx(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm',
                  'outline-none focus:bg-black/[0.04] hover:bg-black/[0.04]',
                  'dark:focus:bg-white/[0.05] dark:hover:bg-white/[0.05]',
                  isSelected && 'bg-brand/10 dark:bg-brand/15',
                )}
              >
                <span className="flex w-4 shrink-0 justify-center">
                  {isSelected && <Check className="text-brand" />}
                </span>
                {opt.live ? (
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                )}
                <span
                  className={cx(
                    'min-w-0 flex-1 truncate',
                    isSelected ? 'font-semibold text-brand' : 'text-zinc-800 dark:text-zinc-100',
                  )}
                >
                  {opt.label}
                </span>
                {opt.count != null && (
                  <span className="shrink-0 text-xs text-zinc-400">{opt.count} players</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cx('h-4 w-4 text-zinc-400', className)}
    >
      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={cx('h-4 w-4', className)}>
      <path d="M5 10.5l3.5 3.5L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

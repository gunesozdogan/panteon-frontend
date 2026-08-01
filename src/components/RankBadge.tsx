import { cx } from '../lib/cx';

export interface RankBadgeProps {
  /** 1-indexed display rank. */
  rank: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Colour ring for the podium; plain neutral for everyone else. */
const MEDAL: Record<number, string> = {
  1: 'bg-gold/15 text-gold ring-gold/40',
  2: 'bg-silver/15 text-silver ring-silver/40',
  3: 'bg-bronze/15 text-bronze ring-bronze/40',
};

const SIZE: Record<NonNullable<RankBadgeProps['size']>, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

export function RankBadge({ rank, size = 'md', className }: RankBadgeProps) {
  const medal = MEDAL[rank] ?? 'bg-black/5 text-zinc-600 ring-black/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10';
  return (
    <span
      aria-label={`Rank ${rank}`}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums ring-1 ring-inset',
        SIZE[size],
        medal,
        className,
      )}
    >
      {rank}
    </span>
  );
}

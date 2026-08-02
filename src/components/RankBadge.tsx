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

/**
 * Height + a matching MIN width per size. Width is a floor, not a fixed value, so
 * the badge stays a circle for 1–3 digit ranks but grows into a pill for 4+ digit
 * ranks (e.g. #1234) instead of overflowing its circle.
 */
const SIZE: Record<NonNullable<RankBadgeProps['size']>, string> = {
  sm: 'h-7 min-w-7',
  md: 'h-9 min-w-9',
  lg: 'h-11 min-w-11',
};

/** Font size steps down as the rank gets longer so it always fits the badge. */
function textSizeFor(size: NonNullable<RankBadgeProps['size']>, digits: number): string {
  if (size === 'sm') return digits >= 4 ? 'text-[0.6rem]' : digits === 3 ? 'text-[0.7rem]' : 'text-xs';
  if (size === 'md') return digits >= 4 ? 'text-xs' : 'text-sm';
  return digits >= 4 ? 'text-sm' : 'text-base';
}

export function RankBadge({ rank, size = 'md', className }: RankBadgeProps) {
  const medal = MEDAL[rank] ?? 'bg-black/5 text-zinc-600 ring-black/10 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10';
  const digits = String(rank).length;
  return (
    <span
      aria-label={`Rank ${rank}`}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full px-1.5 font-bold leading-none tabular-nums ring-1 ring-inset',
        SIZE[size],
        textSizeFor(size, digits),
        medal,
        className,
      )}
    >
      {rank}
    </span>
  );
}

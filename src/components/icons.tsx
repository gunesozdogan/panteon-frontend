import { cx } from '../lib/cx';

/**
 * Small, dependency-free inline SVG icons.
 *
 * We use these instead of emoji (🪙, 🏆, 🎲, …) because emoji glyphs render
 * inconsistently across platforms/fonts — on some devices the coin/medal glyphs
 * fell back to tofu boxes or the wrong picture. SVGs draw identically everywhere,
 * inherit the surrounding text color via `currentColor`, and scale with it.
 */
export interface IconProps {
  className?: string;
}

/**
 * A coin. Sized in `em` so it scales with the surrounding font-size and lines up
 * next to money amounts; colored via `currentColor` so it matches its text.
 */
export function CoinIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-[1em] w-[1em] shrink-0', className)}
    >
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M12 8.4v7.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M7 5H4.5v1.5A2.5 2.5 0 0 0 7 9M17 5h2.5v1.5A2.5 2.5 0 0 1 17 9M12 13v3M9 19.5h6M10 19.5c0-1.5.7-2.5 2-2.5s2 1 2 2.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6a3 3 0 0 1 0 6M17.5 19c0-2.2-.9-3.9-2.3-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 19.5c0-3.6 3-6 7-6s7 2.4 7 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DiceIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <rect x="4" y="4" width="16" height="16" rx="3.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" />
      <circle cx="15" cy="9" r="1.25" fill="currentColor" />
      <circle cx="9" cy="15" r="1.25" fill="currentColor" />
      <circle cx="15" cy="15" r="1.25" fill="currentColor" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <path
        d="M12 5v14M6 13l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cx('inline-block h-4 w-4 shrink-0', className)}
    >
      <path
        d="M6 21V4M6 5h10l-1.5 3L16 11H6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

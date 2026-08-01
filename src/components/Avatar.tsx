import { initialsFor } from '../lib/format';
import { cx } from '../lib/cx';

export interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

export function Avatar({ username, size = 'md', className }: AvatarProps) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        SIZE[size],
        className,
      )}
      style={{ backgroundColor: `hsl(${hue} 55% 45%)` }}
    >
      {initialsFor(username)}
    </span>
  );
}

import { formatMoney, prizeSplit } from '../lib/format';
import { cx } from '../lib/cx';

export interface PrizePoolBannerProps {
  /** Current weekly prize pool, integer minor units (2% of total earnings). */
  pool: number;
  /** Prefix for money amounts. Default: coin emoji. */
  symbol?: string;
  className?: string;
}

interface PodiumProps {
  place: 1 | 2 | 3;
  amount: number;
  symbol: string;
}

const MEDAL_EMOJI: Record<PodiumProps['place'], string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_COLOR: Record<PodiumProps['place'], string> = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
};

function Podium({ place, amount, symbol }: PodiumProps) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-1.5 text-center">
      <span className={cx('text-sm font-bold', MEDAL_COLOR[place])}>
        {MEDAL_EMOJI[place]} #{place}
      </span>
      <span className="mt-0.5 text-xs font-semibold tabular-nums text-white sm:text-sm">
        {formatMoney(amount, { symbol })}
      </span>
    </div>
  );
}

export function PrizePoolBanner({ pool, symbol = '🪙 ', className }: PrizePoolBannerProps) {
  const split = prizeSplit(pool);
  return (
    <div
      className={cx(
        'rounded-xl bg-linear-to-br from-brand to-brand-soft p-4 text-white shadow-md',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
          Weekly prize pool
        </div>
        <div className="text-2xl font-extrabold tabular-nums sm:text-3xl">
          {formatMoney(pool, { symbol })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Podium place={1} amount={split.rank1} symbol={symbol} />
        <Podium place={2} amount={split.rank2} symbol={symbol} />
        <Podium place={3} amount={split.rank3} symbol={symbol} />
      </div>
    </div>
  );
}

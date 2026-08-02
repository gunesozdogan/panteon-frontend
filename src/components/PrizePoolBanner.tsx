import { formatMoney, prizeSplit } from '../lib/format';
import { cx } from '../lib/cx';
import { CoinIcon } from './icons';

export interface PrizePoolBannerProps {
  /** Current weekly prize pool, integer minor units (2% of total earnings). */
  pool: number;
  className?: string;
}

interface PodiumProps {
  place: 1 | 2 | 3;
  amount: number;
}

const MEDAL_COLOR: Record<PodiumProps['place'], string> = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
};

function Podium({ place, amount }: PodiumProps) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-white/10 px-2 py-1.5 text-center">
      <span className={cx('text-sm font-bold', MEDAL_COLOR[place])}>#{place}</span>
      <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold tabular-nums text-white sm:text-sm">
        <CoinIcon />
        {formatMoney(amount)}
      </span>
    </div>
  );
}

export function PrizePoolBanner({ pool, className }: PrizePoolBannerProps) {
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
        <div className="flex items-center gap-2 text-2xl font-extrabold tabular-nums sm:text-3xl">
          <CoinIcon />
          {formatMoney(pool)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Podium place={1} amount={split.rank1} />
        <Podium place={2} amount={split.rank2} />
        <Podium place={3} amount={split.rank3} />
      </div>
    </div>
  );
}

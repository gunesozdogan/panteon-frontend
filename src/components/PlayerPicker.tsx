import type { PlayerSample } from '../types/domain';
import { cx } from '../lib/cx';

export interface PlayerPickerProps {
  /** Freshly-sampled candidate players (rank-labelled, ≥1 in the top 100). */
  players: readonly PlayerSample[];
  /** Whether the sample is currently (re)loading. */
  loading?: boolean;
  /** The currently active demo player id (highlighted); `undefined` = none picked. */
  selectedId?: string | undefined;
  /** Pick a player to "view as". */
  onSelect: (playerId: string) => void;
  /** Re-roll a fresh random sample. */
  onReroll: () => void;
  className?: string;
}

/**
 * The demo user picker (stands in for auth, which is scoped out): a re-roll
 * button plus a set of freshly-sampled players to "view as". Presentational and
 * prop-driven — data fetching lives in `usePlayerSuggestions`, not here.
 */
export function PlayerPicker({
  players,
  loading = false,
  selectedId,
  onSelect,
  onReroll,
  className,
}: PlayerPickerProps) {
  return (
    <fieldset
      className={cx(
        'rounded-lg border border-black/10 p-3 dark:border-white/10',
        className,
      )}
    >
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Viewing as (random sample)
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReroll}
          className="rounded-md bg-brand px-2.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          🎲 re-roll
        </button>
        {loading && <span className="text-sm text-zinc-500">loading…</span>}
        {players.map((p) => (
          <button
            key={p.playerId}
            type="button"
            onClick={() => onSelect(p.playerId)}
            className={cx(
              'rounded-md border px-2.5 py-1.5 text-sm',
              p.playerId === selectedId
                ? 'border-brand bg-brand/10 font-semibold text-brand'
                : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5',
            )}
          >
            {p.username} / #{p.rank}
            {p.inTop100 ? ' 🏆' : ''}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

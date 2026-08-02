import type { CSSProperties } from 'react';
import { List, type RowComponentProps, useListRef } from 'react-window';
import type { LeaderboardEntry } from '../types/domain';
import { findSelfIndex } from '../lib/leaderboard';
import { cx } from '../lib/cx';
import { LeaderboardRow } from './LeaderboardRow';
import { ArrowDownIcon } from './icons';

/**
 * Fixed row height (px). Must match `LeaderboardRow`'s `min-h-[3.25rem]` (52px);
 * with `box-border` the 1px bottom border is included, so 100 rows don't drift.
 * A predetermined height is what lets react-window window the list in O(visible)
 * instead of measuring every row — the fix for the "freezes when I scroll" bug.
 */
export const LEADERBOARD_ROW_HEIGHT = 52;

interface RowData {
  entries: readonly LeaderboardEntry[];
  selfPlayerId: string | undefined;
  showPrize: boolean;
}

/**
 * Row renderer for react-window. Defined at module scope (stable identity) and
 * fed data through `rowProps` — recreating it per render would defeat windowing.
 */
function LeaderboardVirtualRow({
  index,
  style,
  entries,
  selfPlayerId,
  showPrize,
}: RowComponentProps<RowData>) {
  const entry = entries[index];
  if (!entry) return null;
  return (
    <LeaderboardRow
      entry={entry}
      isMe={entry.playerId === selfPlayerId}
      showPrize={showPrize}
      style={style}
    />
  );
}

export interface VirtualizedLeaderboardProps {
  entries: readonly LeaderboardEntry[];
  /** Highlights (and enables "jump to") the viewing player's own row. */
  selfPlayerId?: string | undefined;
  /** Show the prize column on each row (closed-week / history views). */
  showPrize?: boolean;
  /** Height of the scroll viewport; react-window fills it. Default `70vh`. */
  height?: number | string;
  className?: string;
  /** Header title (e.g. "Top 100"). When set, the component renders its own */
  title?: string;
  /** Right-aligned summary text in the header (e.g. "100 of 12,345 shown"). */
  countLabel?: string;
  /** aria-label for the wrapping <section> (defaults to `title`). */
  ariaLabel?: string;
}

export function VirtualizedLeaderboard({
  entries,
  selfPlayerId,
  showPrize = false,
  height = '70vh',
  className,
  title,
  countLabel,
  ariaLabel,
}: VirtualizedLeaderboardProps) {
  const listRef = useListRef(null);
  const selfIndex = findSelfIndex(entries, selfPlayerId);

  const jumpToSelf = () => {
    if (selfIndex < 0) return;
    listRef.current?.scrollToRow({ index: selfIndex, align: 'center', behavior: 'smooth' });
  };

  const listStyle: CSSProperties = { height };

  const jumpButton =
    selfIndex >= 0 ? (
      <button
        type="button"
        onClick={jumpToSelf}
        className="inline-flex items-center gap-1 rounded-full bg-me px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-90"
      >
        <ArrowDownIcon className="h-3.5 w-3.5" />
        Jump to my rank (#{entries[selfIndex]?.rank})
      </button>
    ) : null;

  const list = (
    <List
      listRef={listRef}
      style={listStyle}
      className="overflow-y-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
      rowComponent={LeaderboardVirtualRow}
      rowCount={entries.length}
      rowHeight={LEADERBOARD_ROW_HEIGHT}
      rowProps={{ entries, selfPlayerId, showPrize }}
      overscanCount={8}
    />
  );

  if (title) {
    return (
      <section aria-label={ariaLabel ?? title} className={cx('flex flex-col gap-2', className)}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-semibold text-zinc-500">{title}</h2>
            {jumpButton}
          </div>
          {countLabel && <span className="text-xs text-zinc-400">{countLabel}</span>}
        </div>
        {list}
      </section>
    );
  }

  return (
    <div className={cx('relative', className)}>
      {list}
      {jumpButton && <div className="absolute bottom-3 right-3">{jumpButton}</div>}
    </div>
  );
}

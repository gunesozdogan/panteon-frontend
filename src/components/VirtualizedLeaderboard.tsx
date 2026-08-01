import type { CSSProperties } from 'react';
import { List, type RowComponentProps, useListRef } from 'react-window';
import type { LeaderboardEntry } from '../types/domain';
import { findSelfIndex } from '../lib/leaderboard';
import { cx } from '../lib/cx';
import { LeaderboardRow } from './LeaderboardRow';

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
}: RowComponentProps<RowData>) {
  const entry = entries[index];
  if (!entry) return null;
  return (
    <LeaderboardRow
      entry={entry}
      isMe={entry.playerId === selfPlayerId}
      style={style}
    />
  );
}

export interface VirtualizedLeaderboardProps {
  entries: readonly LeaderboardEntry[];
  /** Highlights (and enables "jump to") the viewing player's own row. */
  selfPlayerId?: string | undefined;
  /** Height of the scroll viewport; react-window fills it. Default `70vh`. */
  height?: number | string;
  className?: string;
}

export function VirtualizedLeaderboard({
  entries,
  selfPlayerId,
  height = '70vh',
  className,
}: VirtualizedLeaderboardProps) {
  const listRef = useListRef(null);
  const selfIndex = findSelfIndex(entries, selfPlayerId);

  const jumpToSelf = () => {
    if (selfIndex < 0) return;
    listRef.current?.scrollToRow({ index: selfIndex, align: 'center', behavior: 'smooth' });
  };

  const listStyle: CSSProperties = { height };

  return (
    <div className={cx('relative', className)}>
      <List
        listRef={listRef}
        style={listStyle}
        className="overflow-y-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900"
        rowComponent={LeaderboardVirtualRow}
        rowCount={entries.length}
        rowHeight={LEADERBOARD_ROW_HEIGHT}
        rowProps={{ entries, selfPlayerId }}
        overscanCount={8}
      />

      {selfIndex >= 0 && (
        <button
          type="button"
          onClick={jumpToSelf}
          className="absolute bottom-3 right-3 rounded-full bg-me px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:opacity-90"
        >
          ↧ Jump to my rank (#{entries[selfIndex]?.rank})
        </button>
      )}
    </div>
  );
}

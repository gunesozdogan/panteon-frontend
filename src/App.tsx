import {
  EarningsPanel,
  LeaderboardRow,
  LeaderboardSkeleton,
  PlayerPicker,
  PrizePoolBanner,
  SelfRankCard,
  StatCard,
  VirtualizedLeaderboard,
  WeeklyStatus,
  WeekSelector,
} from './components';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { closeWeekEarly } from './api/client';
import { useDemoUser } from './hooks/useDemoUser';
import { useHistory } from './hooks/useHistory';
import { useHistoryWeeks } from './hooks/useHistoryWeeks';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useLiveSimulation } from './hooks/useLiveSimulation';
import { usePlayerSuggestions } from './hooks/usePlayerSuggestions';
import { usePlayerWallet } from './hooks/usePlayerWallet';
import { cx } from './lib/cx';
import { formatCompact } from './lib/format';
import { CoinIcon, FlagIcon, TrophyIcon, UserIcon, UsersIcon } from './components/icons';
import type { LeaderboardEntry, WeekId } from './types/domain';

/** Which panel the mobile (single-column) layout is showing. */
type MobileTab = 'board' | 'profile';

function App() {
  const { playerId, setPlayerId } = useDemoUser();
  const [selectedWeek, setSelectedWeek] = useState<WeekId | undefined>(undefined);
  const isHistory = selectedWeek != null;

  const [live, setLive] = useState(true);

  const { status, data, isSlow, refetch } = useLeaderboard(playerId);
  const historyWeeks = useHistoryWeeks();
  const history = useHistory(selectedWeek);
  const suggestions = usePlayerSuggestions(5, live && !isHistory);
  const wallet = usePlayerWallet(playerId);
  useLiveSimulation(live && !isHistory);

  const [tab, setTab] = useState<MobileTab>('board');

  const [closing, setClosing] = useState(false);
  const [closeMsg, setCloseMsg] = useState<string | null>(null);
  const refetchHistoryWeeks = historyWeeks.refetch;
  const refetchWallet = wallet.refetch;
  const handleCloseEarly = useCallback(async () => {
    if (closing) return;
    setClosing(true);
    setCloseMsg(null);
    try {
      const result = await closeWeekEarly();
      setCloseMsg(
        result.alreadyClosed
          ? 'Nothing to distribute yet — the board is empty.'
          : `Distributed ${formatCompact(result.totalDistributed / 100)} coins to ${result.playersPaid} players · archived as ${result.weekId}. The board has been reset.`,
      );
      refetch();
      refetchHistoryWeeks();
      refetchWallet();
    } catch {
      setCloseMsg('Could not close the week. Please try again.');
    } finally {
      setClosing(false);
    }
  }, [closing, refetch, refetchHistoryWeeks, refetchWallet]);

  // The selected player's current standing (live week or the selected archive),
  // feeding the earnings panel's "this week / that week" context line.
  const currentEntry = useMemo<LeaderboardEntry | undefined>(() => {
    if (isHistory) {
      return history.data?.standings.find((e) => e.playerId === playerId);
    }
    return data?.me?.entry ?? data?.top.find((e) => e.playerId === playerId);
  }, [isHistory, history.data, data, playerId]);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col bg-zinc-50 px-3 py-4 text-zinc-900 sm:px-4 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Panteon logo"
              className="h-8 w-8 shrink-0 sm:h-9 sm:w-9"
            />
            <h1 className="text-lg font-bold sm:text-xl">Weekly Leaderboard</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isHistory && (
              <button
                type="button"
                onClick={() => setLive((on) => !on)}
                aria-pressed={live}
                title={live ? 'Pause live demo traffic' : 'Resume live demo traffic'}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                  live
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-black/10 text-zinc-500 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5',
                )}
              >
                <span
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    live ? 'animate-pulse bg-emerald-500' : 'bg-zinc-400',
                  )}
                />
                {live ? 'Live' : 'Paused'}
              </button>
            )}
            {!isHistory && (
              <button
                type="button"
                onClick={handleCloseEarly}
                disabled={closing}
                title="Distribute the prize pool now, archive the standings, and reset the board (demo)"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
              >
                <FlagIcon className="h-3.5 w-3.5" />
                {closing ? 'Closing…' : 'Close week'}
              </button>
            )}
          </div>
          <WeekSelector
            weeks={historyWeeks.weeks}
            value={selectedWeek}
            onChange={setSelectedWeek}
            loading={historyWeeks.status === 'loading'}
            className="basis-full"
          />
        </div>

        {!isHistory && closeMsg && (
          <p
            role="status"
            className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
          >
            {closeMsg}
          </p>
        )}

        {isHistory ? (
          <HistoryHeader
            weekId={selectedWeek}
            standings={history.data?.standings}
            closedAt={history.data?.closedAt}
          />
        ) : (
          data && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="Players competing"
                  value={formatCompact(data.totalPlayers)}
                  icon={<UsersIcon />}
                  hint={`${data.totalPlayers.toLocaleString()} total`}
                />
                <WeeklyStatus weekId={data.weekId} />
              </div>
              <PrizePoolBanner pool={data.pool} />
            </>
          )
        )}
      </header>

      <div
        role="tablist"
        aria-label="Sections"
        className="mb-3 grid grid-cols-2 gap-1 rounded-lg border border-black/10 p-1 lg:hidden dark:border-white/10"
      >
        <TabButton active={tab === 'board'} onClick={() => setTab('board')}>
          <TrophyIcon className="h-4 w-4" />
          Leaderboard
        </TabButton>
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
          <UserIcon className="h-4 w-4" />
          Profile
        </TabButton>
      </div>

      <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start">
        <aside
          className={cx(
            tab === 'profile' ? 'flex' : 'hidden',
            'flex-col gap-3 lg:flex lg:w-80 lg:shrink-0',
          )}
        >
          {!isHistory && (
            <PlayerPicker
              players={suggestions.players}
              loading={suggestions.status === 'loading'}
              selectedId={playerId}
              onSelect={setPlayerId}
              onReroll={suggestions.refetch}
            />
          )}
          <EarningsPanel
            status={wallet.status}
            wallet={wallet.data}
            username={currentEntry?.username}
            current={
              currentEntry
                ? {
                    rank: currentEntry.rank,
                    score: currentEntry.score,
                    ...(currentEntry.prize != null ? { prize: currentEntry.prize } : {}),
                  }
                : undefined
            }
            currentLabel={isHistory ? (selectedWeek ?? 'Archived') : 'This week'}
          />
        </aside>

        <main
          className={cx(
            tab === 'board' ? 'flex' : 'hidden',
            'min-w-0 flex-1 flex-col gap-3 lg:flex',
          )}
        >
          {isHistory ? (
            <HistoryBoard
              status={history.status}
              standings={history.data?.standings}
              playerId={playerId}
            />
          ) : (
            <LiveBoard
              status={status}
              data={data}
              isSlow={isSlow}
              refetch={refetch}
              playerId={playerId}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/** One button in the mobile tab switcher. */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand text-white'
          : 'text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

/** Header block for a closed/archived week: closed date + total distributed. */
function HistoryHeader({
  weekId,
  standings,
  closedAt,
}: {
  weekId: string;
  standings: readonly LeaderboardEntry[] | undefined;
  closedAt: string | undefined;
}) {
  const distributed = useMemo(
    () => (standings ?? []).reduce((sum, s) => sum + (s.prize ?? 0), 0),
    [standings],
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        label="Players competed"
        value={standings ? formatCompact(standings.length) : '—'}
        icon={<UsersIcon />}
        hint={standings ? `${standings.length.toLocaleString()} total` : undefined}
      />
      <StatCard
        label={`${weekId} · closed`}
        value={
          standings ? (
            <span className="flex items-center gap-1">
              <CoinIcon />
              {formatCompact(distributed / 100)}
            </span>
          ) : (
            '—'
          )
        }
        hint={
          closedAt
            ? `Distributed ${new Date(closedAt).toLocaleDateString()}`
            : 'Loading…'
        }
      />
    </div>
  );
}

/** The live-week board: loading / error / empty / success (top-100 + self view). */
function LiveBoard({
  status,
  data,
  isSlow,
  refetch,
  playerId,
}: {
  status: ReturnType<typeof useLeaderboard>['status'];
  data: ReturnType<typeof useLeaderboard>['data'];
  isSlow: boolean;
  refetch: () => void;
  playerId: string | undefined;
}) {
  if (status === 'loading') {
    return (
      <>
        <p className="text-sm text-zinc-500" role="status">
          {isSlow ? 'Server is waking up, just a few seconds…' : 'Loading the board…'}
        </p>
        <LeaderboardSkeleton rows={10} />
      </>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
        <p className="mb-3 font-medium">
          Couldn't load the leaderboard. Please check your connection and try again.
        </p>
        <button
          type="button"
          onClick={refetch}
          className="rounded-md bg-red-600 px-3 py-1.5 font-semibold text-white hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === 'success' && data) {
    const selfInTop = data.top.some((e) => e.playerId === playerId);
    const notCompeting = !!playerId && !data.me && !selfInTop;

    return (
      <>
        {notCompeting && (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/60 px-4 py-3 text-sm text-zinc-600 dark:border-white/15 dark:bg-zinc-900/60 dark:text-zinc-300">
            <span className="font-medium text-zinc-800 dark:text-zinc-100">
              You haven't joined this week yet.
            </span>{' '}
            Earn something to appear on the board — your rank shows up as soon as you score.
          </div>
        )}

        {data.me && (
          <section aria-label="Your position" className="flex flex-col gap-2">
            <div className="sticky top-2 z-10">
              <SelfRankCard entry={data.me.entry} totalPlayers={data.totalPlayers} />
            </div>
            {data.me.window.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Around you
                </div>
                {data.me.window.map((entry) => (
                  <LeaderboardRow
                    key={entry.playerId}
                    entry={entry}
                    isMe={entry.playerId === playerId}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {!playerId && data.top.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 bg-white/60 px-3 py-2.5 text-center text-xs text-zinc-500 dark:border-white/15 dark:bg-zinc-900/60">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span>
              Pick a player from the{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Profile</span>{' '}
              panel to see their own rank and prize.
            </span>
          </div>
        )}

        {data.top.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900">
            No one has scored yet this week. Be the first to climb the board!
          </div>
        ) : (
          <VirtualizedLeaderboard
            entries={data.top}
            selfPlayerId={playerId}
            title="Top 100"
            countLabel={`${data.top.length} of ${data.totalPlayers.toLocaleString()} shown`}
            className="flex-1"
          />
        )}
      </>
    );
  }

  return null;
}

/** The archived-week board: full final standings with prizes, self highlighted. */
function HistoryBoard({
  status,
  standings,
  playerId,
}: {
  status: ReturnType<typeof useHistory>['status'];
  standings: readonly LeaderboardEntry[] | undefined;
  playerId: string | undefined;
}) {
  const selfEntry = useMemo(
    () => standings?.find((s) => s.playerId === playerId),
    [standings, playerId],
  );

  if (status === 'loading') {
    return <LeaderboardSkeleton rows={10} />;
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
        No archived standings found for this week yet.
      </div>
    );
  }

  if (status === 'success' && standings) {
    return (
      <>
        {selfEntry && (
          <div className="sticky top-2 z-10">
            <SelfRankCard entry={selfEntry} showPrize />
          </div>
        )}
        <VirtualizedLeaderboard
          entries={standings}
          selfPlayerId={playerId}
          showPrize
          title="Final standings"
          countLabel={`${standings.length} players`}
          className="flex-1"
        />
      </>
    );
  }

  return null;
}

export default App;

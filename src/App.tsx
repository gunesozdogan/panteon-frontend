import {
  LeaderboardRow,
  LeaderboardSkeleton,
  PrizePoolBanner,
  SelfRankCard,
  VirtualizedLeaderboard,
  WeeklyStatus,
} from './components';
import { useState } from 'react';
import { useDemoUser } from './hooks/useDemoUser';
import { useLeaderboard } from './hooks/useLeaderboard';
import { useLiveSimulation } from './hooks/useLiveSimulation';
import { usePlayerSuggestions } from './hooks/usePlayerSuggestions';

const DEMO_POOL = 4_000_000; // integer minor units; real value arrives via API later.

function App() {
  const { playerId, setPlayerId } = useDemoUser();
  const { status, data, isSlow, refetch } = useLeaderboard(playerId);
  const suggestions = usePlayerSuggestions(5);

  const [live, setLive] = useState(true);
  useLiveSimulation(live);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col bg-zinc-50 px-3 py-4 text-zinc-900 sm:px-4 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold sm:text-xl">Weekly Leaderboard</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLive((on) => !on)}
              aria-pressed={live}
              title={live ? 'Pause live demo traffic' : 'Resume live demo traffic'}
              className={
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ' +
                (live
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-black/10 text-zinc-500 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5')
              }
            >
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (live ? 'animate-pulse bg-emerald-500' : 'bg-zinc-400')
                }
              />
              {live ? 'Live' : 'Paused'}
            </button>
            {data && <WeeklyStatus weekId={data.weekId} className="max-w-[40%]" />}
          </div>
        </div>
        <PrizePoolBanner pool={DEMO_POOL} />
      </header>

      <fieldset className="mb-4 rounded-lg border border-black/10 p-3 dark:border-white/10">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Viewing as (random sample)
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={suggestions.refetch}
            className="rounded-md bg-brand px-2.5 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            🎲 re-roll
          </button>
          {suggestions.status === 'loading' && (
            <span className="text-sm text-zinc-500">loading…</span>
          )}
          {suggestions.players.map((p) => (
            <button
              key={p.playerId}
              type="button"
              onClick={() => setPlayerId(p.playerId)}
              className={
                'rounded-md border px-2.5 py-1.5 text-sm ' +
                (p.playerId === playerId
                  ? 'border-brand bg-brand/10 font-semibold text-brand'
                  : 'border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5')
              }
            >
              {p.username} / #{p.rank} / {p.inTop100 ? '🏆' : 'Outside'}
            </button>
          ))}
        </div>
      </fieldset>

      <main className="flex flex-1 flex-col gap-3">
        {status === 'loading' && (
          <>
            <p className="text-sm text-zinc-500" role="status">
              {isSlow ? 'Server is waking up, just a few seconds…' : 'Loading the board…'}
            </p>
            <LeaderboardSkeleton rows={10} />
          </>
        )}

        {status === 'error' && (
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
        )}

        {status === 'success' && data && (
          <>
            {data.me && (
              <section aria-label="Your position" className="flex flex-col gap-2">
                <div className="sticky top-2 z-10">
                  <SelfRankCard entry={data.me.entry} />
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

            {data.top.length === 0 ? (
              <div className="rounded-xl border border-black/10 bg-white p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900">
                No one has scored yet this week. Be the first to climb the board!
              </div>
            ) : (
              <section aria-label="Top 100" className="flex flex-1 flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold text-zinc-500">Top 100</h2>
                  <span className="text-xs text-zinc-400">{data.top.length} players</span>
                </div>
                <VirtualizedLeaderboard
                  entries={data.top}
                  selfPlayerId={playerId}
                  className="flex-1"
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

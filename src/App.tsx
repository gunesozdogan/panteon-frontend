import {
  LeaderboardRow,
  PrizePoolBanner,
  SelfRankCard,
  WeeklyStatus,
} from './components';
import { useDemoUser } from './hooks/useDemoUser';
import { useLeaderboard } from './hooks/useLeaderboard';
import { usePlayerSuggestions } from './hooks/usePlayerSuggestions';

const DEMO_POOL = 4_000_000; // integer minor units; real value arrives via API later.

function App() {
  const { playerId, setPlayerId } = useDemoUser();
  const { status, data, isSlow } = useLeaderboard(playerId);
  const suggestions = usePlayerSuggestions(5);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-zinc-50 px-3 py-4 text-zinc-900 sm:px-4 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold sm:text-xl">Weekly Leaderboard</h1>
          {data && <WeeklyStatus weekId={data.weekId} className="max-w-[52%]" />}
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

      {status === 'loading' && (
        <p className="text-zinc-500">
          {isSlow ? 'Server is waking up, just a few seconds…' : 'Loading…'}
        </p>
      )}

      {status === 'error' && (
        <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-600">
          Couldn't load the leaderboard. Please check your connection and try
          again.
        </p>
      )}

      {status === 'success' && data && (
        <>
          {data.me && (
            <div className="sticky top-2 z-10 mb-3">
              <SelfRankCard entry={data.me.entry} />
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900">
            {data.top.map((entry) => (
              <LeaderboardRow
                key={entry.playerId}
                entry={entry}
                isMe={entry.playerId === playerId}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;

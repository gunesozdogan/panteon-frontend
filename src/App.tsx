import './App.css';
import { API_BASE_URL } from './config';
import { useDemoUser } from './hooks/useDemoUser';
import { useLeaderboard } from './hooks/useLeaderboard';
import { usePlayerSuggestions } from './hooks/usePlayerSuggestions';

/**
 * TEMPORARY smoke screen — proves the Phase 1 data layer end-to-end (config →
 * useDemoUser / usePlayerSuggestions → useLeaderboard → API_BASE_URL). Replaced
 * by the real leaderboard UI in Phase 3; not a component to keep.
 */
function App() {
  const { playerId, setPlayerId } = useDemoUser();
  const { status, data, error, isSlow } = useLeaderboard(playerId);
  const suggestions = usePlayerSuggestions(5);

  return (
    <div className="app" style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Leaderboard — data-layer smoke test</h1>
      <p>
        API_BASE_URL: <code>{API_BASE_URL}</code>
        <br />
        playerId: <code>{playerId}</code> · status: <code>{status}</code>
      </p>

      <fieldset style={{ margin: '12px 0', padding: 12 }}>
        <legend>Viewing as (random sample) </legend>
        <button type="button" onClick={suggestions.refetch}>
          🎲 re-roll
        </button>
        {suggestions.status === 'loading' && <span> yükleniyor…</span>}
        {suggestions.status === 'error' && <span> hata: {suggestions.error?.message}</span>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {suggestions.players.map((p) => (
            <button
              key={p.playerId}
              type="button"
              onClick={() => setPlayerId(p.playerId)}
              style={{ fontWeight: p.playerId === playerId ? 700 : 400 }}
            >
              {p.username} · #{p.rank} · {p.inTop100 ? '🏆 Top 100' : 'Outside'}
            </button>
          ))}
        </div>
      </fieldset>

      {status === 'loading' && (
        <p>{isSlow ? 'Sunucu uyanıyor, birkaç saniye…' : 'Yükleniyor…'}</p>
      )}

      {status === 'error' && (
        <p style={{ color: 'crimson' }}>
          Hata: {error?.message ?? 'bilinmeyen'} — backend çalışıyor mu?
          (<code>{API_BASE_URL}</code>)
        </p>
      )}

      {status === 'success' && data && (
        <>
          <p>
            weekId: <code>{data.weekId}</code> · top: {data.top.length} satır
            {data.me ? ` · me rank: ${data.me.entry.rank}` : ' · (top-100 içindesin)'}
          </p>
          <ol>
            {data.top.slice(0, 10).map((e) => (
              <li key={e.playerId}>
                {e.username} — {e.score}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export default App;

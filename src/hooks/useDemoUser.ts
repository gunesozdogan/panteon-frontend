/**
 * Persistence is written ONLY on an explicit `setPlayerId` (an actual pick) —
 * never for the auto-resolved initial id. Persisting it would pin it into
 * localStorage + the URL on first load, so later changing it would appear to
 * have no effect (the stored value keeps winning). In production this value
 * would come from a verified JWT, not the client.
 *
 * The initial id may be `undefined`: with no `?playerId=`, no stored pick, and
 * no `VITE_DEFAULT_PLAYER_ID`, the app starts with NO player selected (the
 * SelfRankCard stays hidden until the user picks one). See `INITIAL_PLAYER_ID`.
 */
import { useCallback, useState } from 'react';
import { INITIAL_PLAYER_ID } from '../config';

const STORAGE_KEY = 'leaderboard.demoPlayerId';
const URL_PARAM = 'playerId';

function readUrlPlayerId(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(URL_PARAM);
  return value && value.trim() ? value.trim() : null;
}

function readStoredPlayerId(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Pure resolution used for the hook's initial state (URL → storage → optional
 * env default). Returns `undefined` when none supplies an id — i.e. start with
 * no player selected.
 */
export function resolveInitialPlayerId(): string | undefined {
  return readUrlPlayerId() ?? readStoredPlayerId() ?? INITIAL_PLAYER_ID;
}

export interface UseDemoUserResult {
  playerId: string | undefined;
  setPlayerId: (id: string) => void;
}

export function useDemoUser(): UseDemoUserResult {
  const [playerId, setPlayerIdState] = useState<string | undefined>(
    resolveInitialPlayerId,
  );

  const setPlayerId = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    setPlayerIdState(trimmed);

    try {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      /* storage unavailable (private mode / SSR) — non-fatal */
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, trimmed);
      window.history.replaceState(null, '', url);
    }
  }, []);

  return { playerId, setPlayerId };
}

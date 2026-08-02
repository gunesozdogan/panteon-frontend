import { useCallback, useEffect, useRef, useState } from 'react';
import { getPlayerRanks, getPlayerSample } from '../api/client';
import type { PlayerSample } from '../types/domain';

export type SuggestionsStatus = 'loading' | 'success' | 'error';

/**
 * Auto-refresh cadence for the sample — the picker's rank labels track the live
 * board on this tick, WITHOUT changing who's shown (see below).
 */
const SUGGESTIONS_POLL_INTERVAL_MS = 2500;

export interface UsePlayerSuggestionsResult {
  status: SuggestionsStatus;
  players: PlayerSample[];
  error: Error | undefined;
  /** Re-roll the random sample (each call is a fresh set from the backend). */
  refetch: () => void;
}

interface InternalState {
  status: SuggestionsStatus;
  players: PlayerSample[];
  error: Error | undefined;
}

const LOADING: InternalState = {
  status: 'loading',
  players: [],
  error: undefined,
};

/**
 * Fetches a random player sample for the demo picker (`GET /players/sample`) — a
 * new set on mount and on every `refetch` (the re-roll button).
 *
 * When `autoRefresh` is on it keeps the sample fresh **without churning who's
 * shown**: on each poll tick it re-fetches only the *ranks* of the current sample
 * (`GET /players/ranks`) and updates them in place, so the same faces stay put and
 * only their `#rank` / `🏆` labels move. It re-rolls (picks new people) ONLY when
 * the sample is no longer valid — empty, or every member has dropped off the board
 * (i.e. a close-week reset)
 */
export function usePlayerSuggestions(
  n = 5,
  autoRefresh = false,
): UsePlayerSuggestionsResult {
  const [state, setState] = useState<InternalState>(LOADING);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState(LOADING);

    getPlayerSample(n, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', players: data.players, error: undefined });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setState({ status: 'error', players: [], error });
      });

    return () => controller.abort();
  }, [n, reloadToken]);

  const playersRef = useRef<PlayerSample[]>(state.players);
  playersRef.current = state.players;

  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!autoRefresh) return;

    const reroll = (signal: AbortSignal) =>
      getPlayerSample(n, { signal, retries: 0 }).then((data) => {
        if (signal.aborted) return;
        setState({ status: 'success', players: data.players, error: undefined });
      });

    const tick = () => {
      if (document.hidden) return;
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      const signal = controller.signal;

      const current = playersRef.current;
      if (current.length === 0) {
        void reroll(signal).catch(() => {});
        return;
      }

      void getPlayerRanks(
        current.map((p) => p.playerId),
        { signal, retries: 0 },
      )
        .then((data) => {
          if (signal.aborted) return;
          if (data.players.length === 0) return reroll(signal);
          const byId = new Map(data.players.map((p) => [p.playerId, p]));
          const updated = current
            .map((p) => byId.get(p.playerId) ?? p)
            .sort((a, b) => a.rank - b.rank);
          setState({ status: 'success', players: updated, error: undefined });
          return undefined;
        })
        .catch(() => {
          /* a dropped refresh is harmless — the next tick covers it */
        });
    };

    const id = window.setInterval(tick, SUGGESTIONS_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, [n, autoRefresh]);

  return { ...state, refetch };
}

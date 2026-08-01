import { useCallback, useEffect, useState } from 'react';
import { getPlayerSample } from '../api/client';
import type { PlayerSample } from '../types/domain';

export type SuggestionsStatus = 'loading' | 'success' | 'error';

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
 * Fetches a fresh random player sample for the demo picker (`GET /players/sample`)
 * — a new set on mount and on every `refetch`. Cancels the in-flight request on
 * unmount/re-roll so a stale sample can't overwrite a newer one.
 */
export function usePlayerSuggestions(n = 5): UsePlayerSuggestionsResult {
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

  return { ...state, refetch };
}

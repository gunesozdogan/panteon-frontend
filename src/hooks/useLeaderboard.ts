import { useCallback, useEffect, useState } from 'react';
import { getLeaderboard } from '../api/client';
import type { LeaderboardResponse } from '../types/domain';

export type LeaderboardStatus = 'loading' | 'success' | 'error';

/**
 * How long a load may run before we flag it "slow". A warm backend answers in
 * well under this; crossing it almost always means a cold start (the host is
 * waking the instance), so the UI can reassure the user instead of just spinning.
 */
const SLOW_AFTER_MS = 4000;

export interface UseLeaderboardResult {
  status: LeaderboardStatus;
  data: LeaderboardResponse | undefined;
  error: Error | undefined;
  /** Still loading past `SLOW_AFTER_MS` — surface a "server waking up" message. */
  isSlow: boolean;
  /** Re-run the request (e.g. a "Retry" button, or after switching demo user). */
  refetch: () => void;
}

interface InternalState {
  status: LeaderboardStatus;
  data: LeaderboardResponse | undefined;
  error: Error | undefined;
}

const LOADING: InternalState = {
  status: 'loading',
  data: undefined,
  error: undefined,
};

/**
 * Fetches the leaderboard for `playerId`, exposing explicit loading / success /
 * error states plus an `isSlow` flag for cold starts. Re-fetches when `playerId`
 * changes; cancels the in-flight request on unmount or change so a stale
 * response can't overwrite a newer one.
 */
export function useLeaderboard(playerId: string | undefined): UseLeaderboardResult {
  const [state, setState] = useState<InternalState>(LOADING);
  const [isSlow, setIsSlow] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState(LOADING);
    setIsSlow(false);
    const slowTimer = setTimeout(() => setIsSlow(true), SLOW_AFTER_MS);

    getLeaderboard(playerId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', data, error: undefined });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setState({ status: 'error', data: undefined, error });
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      controller.abort();
      clearTimeout(slowTimer);
    };
  }, [playerId, reloadToken]);

  return { ...state, isSlow, refetch };
}

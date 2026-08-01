import { useCallback, useEffect, useRef, useState } from 'react';
import { getLeaderboard } from '../api/client';
import type { LeaderboardResponse } from '../types/domain';

export type LeaderboardStatus = 'loading' | 'success' | 'error';

/**
 * How long a load may run before we flag it "slow". A warm backend answers in
 * well under this; crossing it almost always means a cold start (the host is
 * waking the instance), so the UI can reassure the user instead of just spinning.
 */
const SLOW_AFTER_MS = 4000;

/**
 * Background refresh cadence. Kept in the same ballpark as the backend's
 * top-100 read-cache TTL (~1–5s) so most polls are cheap cache hits — the whole
 * point of that cache at 2M DAU. The player's own rank/window isn't cached, so
 * it still tracks their live position between ticks.
 */
const POLL_INTERVAL_MS = 2500;

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
 * error states plus an `isSlow` flag for cold starts.
 *
 * Two fetch paths:
 *  - The **foreground** load runs on mount and whenever `playerId` changes (or
 *    `refetch()` is called): it shows the loading state and can surface an error.
 *  - A **background poll** every `POLL_INTERVAL_MS` keeps the board live once
 *    it's up, updating data in place *without* flipping back to loading. It's
 *    paused while the tab is hidden (no point polling an unseen board), and a
 *    transient poll failure is swallowed so a blip never blanks a good board.
 *
 * The in-flight foreground request is cancelled on unmount / `playerId` change
 * so a stale response can't overwrite a newer one.
 */
export function useLeaderboard(playerId: string | undefined): UseLeaderboardResult {
  const [state, setState] = useState<InternalState>(LOADING);
  const [isSlow, setIsSlow] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  // Foreground load: shows loading / error, cancels on change.
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

  // Background poll: silent, visibility-gated, error-swallowing.
  const inFlight = useRef<AbortController | null>(null);
  useEffect(() => {
    const tick = () => {
      if (document.hidden) return;
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      // No retry: a missed poll is caught by the next tick, and retrying would
      // just pile up requests on a slow backend.
      getLeaderboard(playerId, { signal: controller.signal, retries: 0 })
        .then((data) => {
          if (controller.signal.aborted) return;
          setState({ status: 'success', data, error: undefined });
        })
        .catch(() => {
        });
    };

    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      inFlight.current?.abort();
      inFlight.current = null;
    };
  }, [playerId]);

  return { ...state, isSlow, refetch };
}

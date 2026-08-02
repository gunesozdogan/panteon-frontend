import { useCallback, useEffect, useState } from 'react';
import { getHistoryList } from '../api/client';
import type { WeeklyStandingsSummary } from '../types/domain';

export type HistoryWeeksStatus = 'loading' | 'success' | 'error';

export interface UseHistoryWeeksResult {
  status: HistoryWeeksStatus;
  weeks: WeeklyStandingsSummary[];
  error: Error | undefined;
  /** Re-fetch the archived-week list (e.g. after a week closes). */
  refetch: () => void;
}

interface InternalState {
  status: HistoryWeeksStatus;
  weeks: WeeklyStandingsSummary[];
  error: Error | undefined;
}

const LOADING: InternalState = {
  status: 'loading',
  weeks: [],
  error: undefined,
};

/**
 * Fetches the list of archived (closed) weeks for the "past weeks" picker
 * (`GET /leaderboard/history`). Lightweight summaries only — the full standings
 * are pulled lazily by `useHistory` when a week is actually selected. Cancels
 * the in-flight request on unmount/refetch so a stale list can't win a race.
 */
export function useHistoryWeeks(): UseHistoryWeeksResult {
  const [state, setState] = useState<InternalState>(LOADING);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState(LOADING);

    getHistoryList({ signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', weeks: data.weeks, error: undefined });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setState({ status: 'error', weeks: [], error });
      });

    return () => controller.abort();
  }, [reloadToken]);

  return { ...state, refetch };
}

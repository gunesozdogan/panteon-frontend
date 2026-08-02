import { useEffect, useState } from 'react';
import { getHistory } from '../api/client';
import type { WeekId, WeeklyStandingsDoc } from '../types/domain';

export type HistoryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseHistoryResult {
  status: HistoryStatus;
  data: WeeklyStandingsDoc | undefined;
  error: Error | undefined;
}

interface InternalState {
  status: HistoryStatus;
  data: WeeklyStandingsDoc | undefined;
  error: Error | undefined;
}

const IDLE: InternalState = { status: 'idle', data: undefined, error: undefined };

/**
 * Fetches a single archived week's full standings (`GET /leaderboard/history/:weekId`)
 * when `weekId` is set. Passing `undefined` (i.e. viewing the live week) leaves
 * the hook idle and fetches nothing. Unlike `useLeaderboard`, history is static —
 * a closed week never changes — so there's no polling here. The in-flight request
 * is cancelled on unmount / week change so a stale week can't overwrite a newer.
 */
export function useHistory(weekId: WeekId | undefined): UseHistoryResult {
  const [state, setState] = useState<InternalState>(IDLE);

  useEffect(() => {
    if (!weekId) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', data: undefined, error: undefined });

    getHistory(weekId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', data, error: undefined });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setState({ status: 'error', data: undefined, error });
      });

    return () => controller.abort();
  }, [weekId]);

  return state;
}

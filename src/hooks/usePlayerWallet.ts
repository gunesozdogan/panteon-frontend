import { useCallback, useEffect, useState } from 'react';
import { getPlayerWallet } from '../api/client';
import { ApiError } from '../api/errors';
import type { PlayerWalletResponse } from '../types/domain';

export type WalletStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UsePlayerWalletResult {
  status: WalletStatus;
  data: PlayerWalletResponse | undefined;
  error: Error | undefined;
  /** Re-fetch (e.g. after a close credits wallets). */
  refetch: () => void;
}

interface InternalState {
  status: WalletStatus;
  data: PlayerWalletResponse | undefined;
  error: Error | undefined;
}

const IDLE: InternalState = { status: 'idle', data: undefined, error: undefined };

/**
 * Fetches a player's durable money view (`GET /players/:playerId/wallet`) — total
 * winnings + per-close payout history from Postgres. Static between closes, so no
 * polling (unlike `useLeaderboard`); call `refetch` after an early close to pick
 * up the fresh wallet credit. A 404 (unknown player) is surfaced as `success`
 * with `undefined` data rather than an error — the panel just shows the empty
 * state. The in-flight request is cancelled on unmount / player change.
 */
export function usePlayerWallet(
  playerId: string | undefined,
): UsePlayerWalletResult {
  const [state, setState] = useState<InternalState>(IDLE);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    if (!playerId) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading', data: undefined, error: undefined });

    getPlayerWallet(playerId, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ status: 'success', data, error: undefined });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 404) {
          setState({ status: 'success', data: undefined, error: undefined });
          return;
        }
        const error = cause instanceof Error ? cause : new Error(String(cause));
        setState({ status: 'error', data: undefined, error });
      });

    return () => controller.abort();
  }, [playerId, reloadToken]);

  return { ...state, refetch };
}

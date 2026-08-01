import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard } from '../api/client';
import type { LeaderboardResponse } from '../types/domain';
import { useLeaderboard } from './useLeaderboard';

vi.mock('../api/client', () => ({ getLeaderboard: vi.fn() }));
const mockGet = vi.mocked(getLeaderboard);

afterEach(() => vi.useRealTimers());

/** A promise we resolve/reject by hand, to control fetch timing precisely. */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function response(weekId: string): LeaderboardResponse {
  return { weekId, top: [] };
}

describe('useLeaderboard', () => {
  it('starts in the loading state', () => {
    mockGet.mockReturnValue(deferred<LeaderboardResponse>().promise);
    const { result } = renderHook(() => useLeaderboard('p1'));
    expect(result.current.status).toBe('loading');
    expect(result.current.data).toBeUndefined();
  });

  it('transitions to success with the fetched data', async () => {
    const data = response('2026-W31');
    mockGet.mockResolvedValue(data);

    const { result } = renderHook(() => useLeaderboard('p1'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBe(data);
    expect(result.current.error).toBeUndefined();
  });

  it('transitions to error when the request fails', async () => {
    mockGet.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useLeaderboard('p1'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.data).toBeUndefined();
  });

  it('flags isSlow once the load runs past the slow threshold', async () => {
    vi.useFakeTimers();
    mockGet.mockReturnValue(deferred<LeaderboardResponse>().promise);

    const { result } = renderHook(() => useLeaderboard('p1'));
    expect(result.current.isSlow).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(result.current.isSlow).toBe(true);
  });

  it('ignores a stale response when playerId changes mid-flight', async () => {
    const first = deferred<LeaderboardResponse>();
    const second = deferred<LeaderboardResponse>();
    mockGet.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result, rerender } = renderHook(({ id }) => useLeaderboard(id), {
      initialProps: { id: 'p1' },
    });

    rerender({ id: 'p2' });

    const dataTwo = response('week-2');
    await act(async () => {
      second.resolve(dataTwo);
    });
    expect(result.current.data).toBe(dataTwo);

    await act(async () => {
      first.resolve(response('week-1'));
    });
    expect(result.current.data).toBe(dataTwo);
    expect(result.current.status).toBe('success');
  });

  it('refetch re-invokes the request', async () => {
    mockGet.mockResolvedValue(response('2026-W31'));
    const { result } = renderHook(() => useLeaderboard('p1'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(mockGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });
});

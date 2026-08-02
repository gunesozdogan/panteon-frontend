import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getHistory } from '../../api/client';
import type { WeeklyStandingsDoc } from '../../types/domain';
import { useHistory } from '../../hooks/useHistory';

vi.mock('../../api/client', () => ({ getHistory: vi.fn() }));
const mockHistory = vi.mocked(getHistory);

const doc = (weekId: string): WeeklyStandingsDoc => ({
  weekId,
  closedAt: '2026-07-27T00:00:00.000Z',
  standings: [{ rank: 1, playerId: 'p1', username: 'Player_1', score: 999, prize: 200 }],
});

describe('useHistory', () => {
  it('stays idle and fetches nothing when weekId is undefined', () => {
    const { result } = renderHook(() => useHistory(undefined));
    expect(result.current.status).toBe('idle');
    expect(mockHistory).not.toHaveBeenCalled();
  });

  it('loads then succeeds with the archived week when a weekId is given', async () => {
    mockHistory.mockResolvedValue(doc('2026-W30'));
    const { result } = renderHook(() => useHistory('2026-W30'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data?.weekId).toBe('2026-W30');
    expect(mockHistory).toHaveBeenCalledWith('2026-W30', expect.anything());
  });

  it('surfaces an error when the week fetch fails (e.g. 404)', async () => {
    mockHistory.mockRejectedValue(new Error('not_found'));
    const { result } = renderHook(() => useHistory('2099-W01'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeUndefined();
  });

  it('returns to idle when the weekId is cleared', async () => {
    mockHistory.mockResolvedValue(doc('2026-W30'));
    const { result, rerender } = renderHook(({ w }) => useHistory(w), {
      initialProps: { w: '2026-W30' as string | undefined },
    });

    await waitFor(() => expect(result.current.status).toBe('success'));

    rerender({ w: undefined });
    expect(result.current.status).toBe('idle');
  });
});

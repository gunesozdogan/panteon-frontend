import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getHistoryList } from '../../api/client';
import type { HistoryListResponse } from '../../types/domain';
import { useHistoryWeeks } from '../../hooks/useHistoryWeeks';

vi.mock('../../api/client', () => ({ getHistoryList: vi.fn() }));
const mockList = vi.mocked(getHistoryList);

const response = (): HistoryListResponse => ({
  weeks: [
    { weekId: '2026-W30', closedAt: '2026-07-27T00:00:00.000Z', playerCount: 120 },
    { weekId: '2026-W29', closedAt: '2026-07-20T00:00:00.000Z', playerCount: 90 },
  ],
});

describe('useHistoryWeeks', () => {
  it('starts loading with an empty list', () => {
    mockList.mockReturnValue(new Promise<HistoryListResponse>(() => {}));
    const { result } = renderHook(() => useHistoryWeeks());
    expect(result.current.status).toBe('loading');
    expect(result.current.weeks).toEqual([]);
  });

  it('exposes the archived weeks on success', async () => {
    mockList.mockResolvedValue(response());
    const { result } = renderHook(() => useHistoryWeeks());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.weeks.map((w) => w.weekId)).toEqual(['2026-W30', '2026-W29']);
  });

  it('surfaces an error when the list request fails', async () => {
    mockList.mockRejectedValue(new Error('no history'));
    const { result } = renderHook(() => useHistoryWeeks());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('no history');
    expect(result.current.weeks).toEqual([]);
  });
});

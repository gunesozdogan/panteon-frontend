import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getPlayerRanks, getPlayerSample } from '../../api/client';
import type { PlayerSample, PlayerSampleResponse } from '../../types/domain';
import { usePlayerSuggestions } from '../../hooks/usePlayerSuggestions';

vi.mock('../../api/client', () => ({
  getPlayerSample: vi.fn(),
  getPlayerRanks: vi.fn(),
}));
const mockSample = vi.mocked(getPlayerSample);
const mockRanks = vi.mocked(getPlayerRanks);

function sample(playerId: string, rank: number): PlayerSample {
  return { playerId, username: `Player_${playerId}`, rank, inTop100: rank <= 100 };
}

function response(players: PlayerSample[]): PlayerSampleResponse {
  return { weekId: '2026-W31', players };
}

describe('usePlayerSuggestions', () => {
  it('starts loading with an empty list', () => {
    mockSample.mockReturnValue(new Promise<PlayerSampleResponse>(() => {}));
    const { result } = renderHook(() => usePlayerSuggestions(5));
    expect(result.current.status).toBe('loading');
    expect(result.current.players).toEqual([]);
  });

  it('exposes the fetched players on success', async () => {
    const players = [sample('p3', 3), sample('p200', 200)];
    mockSample.mockResolvedValue(response(players));

    const { result } = renderHook(() => usePlayerSuggestions(5));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.players).toBe(players);
    expect(mockSample).toHaveBeenCalledWith(5, expect.anything());
  });

  it('surfaces an error when the sample request fails', async () => {
    mockSample.mockRejectedValue(new Error('no sample'));
    const { result } = renderHook(() => usePlayerSuggestions());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error?.message).toBe('no sample');
    expect(result.current.players).toEqual([]);
  });

  it('refetch rolls a fresh sample', async () => {
    mockSample.mockResolvedValue(response([sample('p1', 1)]));
    const { result } = renderHook(() => usePlayerSuggestions());

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(mockSample).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(mockSample).toHaveBeenCalledTimes(2));
  });

  it('does NOT auto-refresh when autoRefresh is off', async () => {
    vi.useFakeTimers();
    try {
      mockSample.mockResolvedValue(response([sample('p1', 1)]));
      renderHook(() => usePlayerSuggestions(5, false));

      await vi.advanceTimersByTimeAsync(8000);
      expect(mockSample).toHaveBeenCalledTimes(1); // mount only, no polling
      expect(mockRanks).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('polls RANKS for the current ids (not a re-roll) when the sample is valid', async () => {
    vi.useFakeTimers();
    try {
      mockSample.mockResolvedValue(response([sample('p1', 1), sample('p2', 2)]));
      mockRanks.mockResolvedValue(response([sample('p1', 5), sample('p2', 3)]));

      renderHook(() => usePlayerSuggestions(5, true));
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersByTimeAsync(2600);
      expect(mockRanks).toHaveBeenCalledWith(['p1', 'p2'], expect.anything());
      expect(mockSample).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-rolls when the whole sample has dropped off the board (a reset)', async () => {
    vi.useFakeTimers();
    try {
      mockSample.mockResolvedValue(response([sample('p1', 1)]));
      mockRanks.mockResolvedValue(response([]));

      renderHook(() => usePlayerSuggestions(5, true));
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersByTimeAsync(2600);
      expect(mockRanks).toHaveBeenCalled();
      expect(mockSample).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-rolls (not ranks) while the sample is empty', async () => {
    vi.useFakeTimers();
    try {
      mockSample.mockResolvedValue(response([]));
      renderHook(() => usePlayerSuggestions(5, true));
      await vi.advanceTimersByTimeAsync(0);

      await vi.advanceTimersByTimeAsync(2600);
      expect(mockRanks).not.toHaveBeenCalled();
      expect(mockSample.mock.calls.length).toBeGreaterThanOrEqual(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

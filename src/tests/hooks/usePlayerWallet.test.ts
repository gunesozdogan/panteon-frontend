import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getPlayerWallet } from '../../api/client';
import { ApiError } from '../../api/errors';
import type { PlayerWalletResponse } from '../../types/domain';
import { usePlayerWallet } from '../../hooks/usePlayerWallet';

vi.mock('../../api/client', () => ({ getPlayerWallet: vi.fn() }));
const mockWallet = vi.mocked(getPlayerWallet);

const wallet = (playerId: string): PlayerWalletResponse => ({
  playerId,
  username: `Player_${playerId}`,
  balance: 12480,
  payouts: [
    { weekId: '2026-W30', rank: 4, prize: 400, distributedAt: '2026-07-27T00:00:00.000Z' },
  ],
});

describe('usePlayerWallet', () => {
  it('stays idle and fetches nothing when playerId is undefined', () => {
    const { result } = renderHook(() => usePlayerWallet(undefined));
    expect(result.current.status).toBe('idle');
    expect(mockWallet).not.toHaveBeenCalled();
  });

  it('loads then succeeds with the wallet for a player', async () => {
    mockWallet.mockResolvedValue(wallet('p1'));
    const { result } = renderHook(() => usePlayerWallet('p1'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data?.balance).toBe(12480);
    expect(result.current.data?.payouts).toHaveLength(1);
    expect(mockWallet).toHaveBeenCalledWith('p1', expect.anything());
  });

  it('treats a 404 (unknown player) as an empty success, not an error', async () => {
    mockWallet.mockRejectedValue(new ApiError(404, 'player_not_found', 'nope'));
    const { result } = renderHook(() => usePlayerWallet('ghost'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces a non-404 failure as an error', async () => {
    mockWallet.mockRejectedValue(new ApiError(500, 'internal_error', 'boom'));
    const { result } = renderHook(() => usePlayerWallet('p1'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.data).toBeUndefined();
  });

  it('refetches when the player changes', async () => {
    mockWallet.mockResolvedValue(wallet('p1'));
    const { result, rerender } = renderHook(({ id }) => usePlayerWallet(id), {
      initialProps: { id: 'p1' as string | undefined },
    });
    await waitFor(() => expect(result.current.status).toBe('success'));

    mockWallet.mockResolvedValue(wallet('p2'));
    rerender({ id: 'p2' });
    await waitFor(() => expect(result.current.data?.playerId).toBe('p2'));
    expect(mockWallet).toHaveBeenCalledWith('p2', expect.anything());
  });
});

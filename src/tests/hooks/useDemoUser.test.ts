import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { INITIAL_PLAYER_ID } from '../../config';
import { resolveInitialPlayerId, useDemoUser } from '../../hooks/useDemoUser';

const STORAGE_KEY = 'leaderboard.demoPlayerId';

/** Reset the two inputs the resolver reads (URL + localStorage) between specs. */
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('resolveInitialPlayerId', () => {
  it('prefers the ?playerId= URL param above everything', () => {
    window.history.replaceState(null, '', '/?playerId=pUrl');
    window.localStorage.setItem(STORAGE_KEY, 'pStored');
    expect(resolveInitialPlayerId()).toBe('pUrl');
  });

  it('falls back to localStorage when the URL has no param', () => {
    window.localStorage.setItem(STORAGE_KEY, 'pStored');
    expect(resolveInitialPlayerId()).toBe('pStored');
  });

  it('falls back to the configured initial id (undefined when none set)', () => {
    expect(resolveInitialPlayerId()).toBe(INITIAL_PLAYER_ID);
  });

  it('ignores a blank/whitespace URL param', () => {
    window.history.replaceState(null, '', '/?playerId=%20%20');
    expect(resolveInitialPlayerId()).toBe(INITIAL_PLAYER_ID);
  });
});

describe('useDemoUser', () => {
  it('starts from the resolved initial id', () => {
    window.history.replaceState(null, '', '/?playerId=pInit');
    const { result } = renderHook(() => useDemoUser());
    expect(result.current.playerId).toBe('pInit');
  });

  it('setPlayerId updates state and persists to localStorage + the URL', () => {
    const { result } = renderHook(() => useDemoUser());

    act(() => result.current.setPlayerId('p42'));

    expect(result.current.playerId).toBe('p42');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('p42');
    expect(new URLSearchParams(window.location.search).get('playerId')).toBe('p42');
  });

  it('trims the incoming id before storing it', () => {
    const { result } = renderHook(() => useDemoUser());
    act(() => result.current.setPlayerId('  p7  '));
    expect(result.current.playerId).toBe('p7');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('p7');
  });

  it('ignores an empty id (no state change, nothing persisted)', () => {
    const { result } = renderHook(() => useDemoUser());
    const before = result.current.playerId;

    act(() => result.current.setPlayerId('   '));

    expect(result.current.playerId).toBe(before);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

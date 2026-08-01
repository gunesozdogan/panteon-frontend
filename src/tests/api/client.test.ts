import { describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../../config';
import { getHistory, getLeaderboard, getPlayerSample } from '../../api/client';

/** Stubs `fetch` and returns the mock so specs can assert the URL it was given. */
function stubFetch(body: unknown = {}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return fetchMock.mock.calls[0]![0] as string;
}

describe('getLeaderboard', () => {
  it('builds the query with an encoded playerId', async () => {
    const fetchMock = stubFetch();
    await getLeaderboard('p 1');
    expect(calledUrl(fetchMock)).toBe(`${API_BASE_URL}/leaderboard?playerId=p%201`);
  });

  it('omits the query entirely when no playerId is given', async () => {
    const fetchMock = stubFetch();
    await getLeaderboard();
    expect(calledUrl(fetchMock)).toBe(`${API_BASE_URL}/leaderboard`);
  });
});

describe('getHistory', () => {
  it('encodes the weekId into the path', async () => {
    const fetchMock = stubFetch();
    await getHistory('2026-W31');
    expect(calledUrl(fetchMock)).toBe(`${API_BASE_URL}/leaderboard/history/2026-W31`);
  });
});

describe('getPlayerSample', () => {
  it('adds the ?n= query when a size is given', async () => {
    const fetchMock = stubFetch();
    await getPlayerSample(5);
    expect(calledUrl(fetchMock)).toBe(`${API_BASE_URL}/players/sample?n=5`);
  });

  it('omits the query when no size is given', async () => {
    const fetchMock = stubFetch();
    await getPlayerSample();
    expect(calledUrl(fetchMock)).toBe(`${API_BASE_URL}/players/sample`);
  });
});

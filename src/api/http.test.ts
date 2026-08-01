import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '../config';
import { ApiError } from './errors';
import { apiGet } from './http';

/** Minimal `Response` stand-in — apiGet only touches `ok`, `status`, `json()`. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function mockFetch(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.useRealTimers());

describe('apiGet', () => {
  it('resolves the parsed body on 2xx and hits the right URL', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse(200, { hello: 'world' }));

    await expect(apiGet('/leaderboard?playerId=p1')).resolves.toEqual({
      hello: 'world',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/leaderboard?playerId=p1`,
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws a typed ApiError on a 4xx and does NOT retry', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse(400, { error: 'invalid_query' }));

    const err = await apiGet('/leaderboard', { retries: 3 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).code).toBe('invalid_query');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient 503 and then resolves', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503, { error: 'waking' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const promise = apiGet('/leaderboard', { retries: 3 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up with an ApiError once retries are exhausted', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse(503, { error: 'down' }));

    const promise = apiGet('/leaderboard', { retries: 2 }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    const err = await promise;
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(503);
    // initial attempt + 2 retries
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('maps a network failure to ApiError(status 0, network_error)', async () => {
    const fetchMock = mockFetch();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await apiGet('/leaderboard', { retries: 0 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(0);
    expect((err as ApiError).code).toBe('network_error');
  });

  it('re-throws an AbortError as-is instead of wrapping or retrying it', async () => {
    const fetchMock = mockFetch();
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    const err = await apiGet('/leaderboard', { retries: 3 }).catch((e: unknown) => e);
    expect(err).toBe(abort);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('aborts mid-backoff without firing another attempt', async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetch();
    fetchMock.mockResolvedValue(jsonResponse(503, { error: 'waking' }));

    const controller = new AbortController();
    const promise = apiGet('/leaderboard', {
      retries: 5,
      signal: controller.signal,
    }).catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await vi.runAllTimersAsync();

    const err = await promise;
    expect((err as Error).name).toBe('AbortError');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

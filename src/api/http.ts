import { API_BASE_URL } from '../config';
import { ApiError, type ApiErrorBody } from './errors';

export interface ApiRequestOptions {
  /** Lets the caller cancel in-flight requests (used by `useLeaderboard`). */
  signal?: AbortSignal;
  /** Extra attempts on transient failures (network drop / 502–504). Default 3. */
  retries?: number;
}

/** Gateway/proxy statuses a sleeping backend emits while waking (cold start). */
const RETRYABLE_STATUS = new Set([502, 503, 504]);
const DEFAULT_RETRIES = 3;
const BASE_BACKOFF_MS = 600;

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { error?: unknown }).error === 'string'
  );
}

/** Transient = worth retrying: no response at all, or a gateway wake-up status. */
function isRetryable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 0 || RETRYABLE_STATUS.has(error.status))
  );
}

/** Abort-aware delay: rejects immediately if the caller cancels mid-backoff. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

async function requestOnce<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'network_error', `Network request to ${path} failed`);
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const errorBody = isApiErrorBody(body) ? body : undefined;
    const code = errorBody?.error ?? `http_${response.status}`;
    throw new ApiError(
      response.status,
      code,
      `Request to ${path} failed (${response.status})`,
      errorBody,
    );
  }

  return body as T;
}

/**
 * JSON GET with bounded retry + exponential backoff on transient failures.
 * Resolves the parsed body on 2xx; throws `ApiError` once retries are exhausted
 * or on a non-retryable status (4xx). Abort is re-thrown as-is so callers can
 * tell an intentional cancel from a real error. GETs are safe to retry (no side
 * effects); the retry is what lets a Render/Railway cold start recover without a
 * hard error in the UI.
 */
export async function apiGet<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestOnce<T>(path, options.signal);
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) throw error;
      await sleep(BASE_BACKOFF_MS * 2 ** attempt, options.signal);
    }
  }
}

/**
 * JSON POST — a single attempt, no retry. POSTs have side effects, so replaying
 * a request whose response we simply didn't see could double-apply it. The only
 * caller is the demo simulator (`/admin/simulate`), where a dropped tick is
 * harmless — the next tick covers it — so failing fast beats retrying.
 */
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(0, 'network_error', `Network request to ${path} failed`);
  }

  const responseBody: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const errorBody = isApiErrorBody(responseBody) ? responseBody : undefined;
    const code = errorBody?.error ?? `http_${response.status}`;
    throw new ApiError(
      response.status,
      code,
      `Request to ${path} failed (${response.status})`,
      errorBody,
    );
  }
  return responseBody as T;
}

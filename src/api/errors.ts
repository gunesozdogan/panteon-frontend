/** The `{ error, ... }` shape the backend returns on 4xx/5xx (see routes). */
export interface ApiErrorBody {
  error: string;
  [key: string]: unknown;
}

/**
 * A failed API call — either a non-2xx response or a network/transport failure.
 * `status === 0` marks a request that never reached the server. `code` mirrors
 * the backend's `error` field (e.g. `invalid_query`, `not_found`) or a synthetic
 * `http_<status>` / `network_error` when no body was parseable.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: ApiErrorBody | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }

  /** True for 404s — e.g. a history week that hasn't been archived. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

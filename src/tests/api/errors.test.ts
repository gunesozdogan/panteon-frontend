import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/errors';

describe('ApiError', () => {
  it('carries status, code, message and body', () => {
    const body = { error: 'invalid_query', field: 'playerId' };
    const err = new ApiError(400, 'invalid_query', 'bad request', body);

    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(400);
    expect(err.code).toBe('invalid_query');
    expect(err.message).toBe('bad request');
    expect(err.body).toEqual(body);
  });

  it('leaves body undefined when none is supplied', () => {
    const err = new ApiError(0, 'network_error', 'network down');
    expect(err.body).toBeUndefined();
  });

  it('flags isNotFound only for a 404', () => {
    expect(new ApiError(404, 'not_found', 'gone').isNotFound).toBe(true);
    expect(new ApiError(500, 'server_error', 'boom').isNotFound).toBe(false);
    expect(new ApiError(0, 'network_error', 'x').isNotFound).toBe(false);
  });
});

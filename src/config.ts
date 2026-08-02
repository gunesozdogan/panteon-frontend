const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** Backend API origin, trailing slashes trimmed (see `.env.example`). */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

/**
 * Optional explicit initial player, from `VITE_DEFAULT_PLAYER_ID`. When unset the
 * app starts with NO player selected — the `SelfRankCard` stays hidden until the
 * user picks one.
 */
export const INITIAL_PLAYER_ID: string | undefined =
  import.meta.env.VITE_DEFAULT_PLAYER_ID?.trim() || undefined;

/**
 * Subject id for the offline sample/story fixtures (`sampleData.ts`). Kept
 * concrete and independent of the runtime initial-player logic — the fixtures
 * must always resolve to a real subject regardless of env.
 */
export const SAMPLE_PLAYER_ID = 'p2500';
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** Backend API origin, trailing slashes trimmed (see `.env.example`). */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

/**
 * Default demo player when neither the `?playerId=` URL param nor localStorage
 * supplies one. Chosen OUTSIDE the top 100 so the `SelfRankCard` is visible out
 * of the box
 */
export const DEFAULT_DEMO_PLAYER_ID =
  import.meta.env.VITE_DEFAULT_PLAYER_ID ?? 'p2500';

// The demo picker's candidate ids are no longer a static list — they come fresh
// each load from `GET /players/sample` (real players, rank-labelled, ≥1 top-100).
// See `usePlayerSuggestions`.
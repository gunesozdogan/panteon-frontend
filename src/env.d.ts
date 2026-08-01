/** Typed Vite env vars — see `src/config.ts`. */
interface ImportMetaEnv {
  /** Backend API origin, e.g. `http://localhost:3000`. Optional; falls back to localhost. */
  readonly VITE_API_BASE_URL?: string;
  /** Overrides the default demo player id (must be outside the top 100 to show the SelfRankCard). */
  readonly VITE_DEFAULT_PLAYER_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
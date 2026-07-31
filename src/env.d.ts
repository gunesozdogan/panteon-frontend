/** Typed Vite env vars — see `src/config.ts`. */
interface ImportMetaEnv {
  /** Backend API origin, e.g. `http://localhost:3000`. Optional; falls back to localhost. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
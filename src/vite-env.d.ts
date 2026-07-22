/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** FitSense API base URL (see `backend/`). Empty = same-origin dev proxy. */
  readonly VITE_API_BASE_URL?: string;
  /** Dev: X-Debug-Uid when backend SKIP_AUTH=true. */
  readonly VITE_API_DEBUG_UID?: string;
  /** Enables simulated scan fallback. Defaults to true only in Vite dev. */
  readonly VITE_ENABLE_DEMO_SCAN?: string;
  readonly VITE_PRIVACY_CONTROLLER_NAME?: string;
  readonly VITE_PRIVACY_CONTACT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

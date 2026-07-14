/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  /** FitSense API base URL (see `backend/`). Empty = same-origin dev proxy. */
  readonly VITE_API_BASE_URL?: string;
  /** Dev: X-Debug-Uid when backend SKIP_AUTH=true. */
  readonly VITE_API_DEBUG_UID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

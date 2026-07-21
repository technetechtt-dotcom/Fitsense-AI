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
  /** Enables simulated scan fallback. Defaults to true only in Vite dev. */
  readonly VITE_ENABLE_DEMO_SCAN?: string;
  readonly VITE_PRIVACY_CONTROLLER_NAME?: string;
  readonly VITE_PRIVACY_CONTACT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

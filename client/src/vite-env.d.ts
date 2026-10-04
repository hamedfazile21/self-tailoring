/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL every API call is prefixed with, e.g. `https://api.example.com/v1`. */
  readonly VITE_API_BASE_URL?: string
  /** Request timeout in milliseconds. Falls back to 30s when unset. */
  readonly VITE_API_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

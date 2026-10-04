/**
 * Single place to tune the HTTP layer. Everything here is read once at module
 * load, so changing a value means changing the env file and restarting Vite.
 */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',

  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30_000),

  /** Send cookies with cross-site requests (needed for cookie-based sessions). */
  withCredentials: false,

  /**
   * Set to `true` when the backend wraps every payload as `{ data, message }`
   * and you want `api.get<User>()` to resolve with the `User` instead of the
   * envelope. Can be overridden per request with the `unwrap` option.
   */
  unwrapEnvelope: false,

  /**
   * Log every request/response to the console in dev. Useful because the
   * DevTools Network panel only records while it is open, so a call fired on
   * mount leaves no trace if you opened DevTools afterwards.
   */
  logRequests: true,

  /** Relative path used by the 401 handler to mint a new access token. */
  refreshEndpoint: '/auth/refresh',

  /** Where the user lands once the session can no longer be recovered. */
  loginPath: '/login',

  storageKeys: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
} as const

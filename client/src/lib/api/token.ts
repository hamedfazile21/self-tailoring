import { API_CONFIG } from './config'

const { accessToken: ACCESS_KEY, refreshToken: REFRESH_KEY } =
  API_CONFIG.storageKeys

/**
 * `localStorage` throws in private browsing and when storage is disabled, so
 * every access is guarded — a missing token is a normal state, a crash is not.
 */
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Nothing we can do; the session simply won't survive a reload.
  }
}

export const tokenStore = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),

  setTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
    write(ACCESS_KEY, tokens.accessToken)
    if (tokens.refreshToken !== undefined) {
      write(REFRESH_KEY, tokens.refreshToken)
    }
  },

  clear() {
    write(ACCESS_KEY, null)
    write(REFRESH_KEY, null)
  },
}

type SessionExpiredHandler = () => void

/** Default: wipe the session and bounce to the login screen. */
let onSessionExpired: SessionExpiredHandler = () => {
  tokenStore.clear()
  if (window.location.pathname !== API_CONFIG.loginPath) {
    window.location.assign(API_CONFIG.loginPath)
  }
}

/**
 * Replace the default redirect — useful once you want the router to handle it
 * (e.g. `router.navigate({ to: '/login', search: { redirect } })`).
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler) {
  onSessionExpired = handler
}

export function handleSessionExpired() {
  onSessionExpired()
}

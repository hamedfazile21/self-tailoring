import { api, tokenStore } from '#/lib/api'

/**
 * Whether a session exists on this device. Presence of an access token is
 * enough: the response interceptor refreshes an expired one, and gives up via
 * `handleSessionExpired` when it cannot, so a stale token never lingers.
 */
export function isSignedIn(): boolean {
  return tokenStore.getAccessToken() !== null
}

/** Where the signed-in user's profile is cached. */
const USER_KEY = 'user'

export interface SessionUser {
  id: number
  name: string
  last_name: string
  email: string
  created_at: string
  updated_at: string
}

interface LoginResponse {
  status: number
  data: { token: string; user: SessionUser }
}

export interface Credentials {
  email: string
  password: string
}

/**
 * Exchanges credentials for a session and persists it. The only place that
 * writes session state, so `clearSession` always knows what to undo.
 */
export async function signIn(
  credentials: Credentials,
  options?: { silent?: boolean },
): Promise<SessionUser> {
  const result = await api.post<LoginResponse, Credentials>(
    '/auth/login',
    credentials,
    options,
  )

  tokenStore.setTokens({ accessToken: result.data.token })
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(result.data.user))
  } catch {
    // Storage unavailable — the token still carries the session.
  }

  return result.data.user
}

/**
 * The profile cached at sign-in, for rendering a name or avatar without a
 * round trip. It is a snapshot, not a source of truth — anything that must be
 * current (a profile screen) should fetch the user instead.
 *
 * Returns null when nobody is signed in, and also when the entry is unusable:
 * it lives in `localStorage`, so it can be hand-edited or left behind by an
 * older version of the app, and a crash on parse would take the whole shell
 * down at startup.
 */
export function getSessionUser(): SessionUser | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SessionUser
    return typeof parsed?.email === 'string' ? parsed : null
  } catch {
    return null
  }
}

/** First + last name, falling back to the email when the name is blank. */
export function getSessionUserName(user = getSessionUser()): string {
  if (!user) return ''
  const full = [user.name, user.last_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')
    .trim()
  return full || user.email
}

/**
 * Wipes every trace of the session from this device. Tokens *and* the cached
 * user go together: dropping only the profile leaves `isSignedIn` true, so the
 * layout guard would keep letting the visitor in after a reload.
 */
export function clearSession() {
  tokenStore.clear()
  try {
    localStorage.removeItem(USER_KEY)
  } catch {
    // Storage unavailable — nothing was persisted in the first place.
  }
}

/**
 * Ends the session. Telling the server is best effort: the JWT is stateless,
 * so a failed (or 401'd) call must not trap the user in a signed-in shell —
 * the local session is cleared either way.
 */
export async function signOut(): Promise<void> {
  try {
    await api.post('/auth/logout', {}, { silent: true })
  } catch {
    // Already handled by clearing below.
  } finally {
    clearSession()
  }
}

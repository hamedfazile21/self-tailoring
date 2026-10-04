import { tokenStore } from '#/lib/api'

/**
 * Whether a session exists on this device. Presence of an access token is
 * enough: the response interceptor refreshes an expired one, and gives up via
 * `handleSessionExpired` when it cannot, so a stale token never lingers.
 */
export function isSignedIn(): boolean {
  return tokenStore.getAccessToken() !== null
}

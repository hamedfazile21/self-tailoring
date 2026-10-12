import { store } from '#/app/store'
import { fetchSettings } from '#/features/settings/slice/settings-action'
import { API_CONFIG, setSessionExpiredHandler, tokenStore } from '#/lib/api'
import { isSignedIn } from '#/lib/auth'
import {
  initializeSystemDir,
  initializeSystemLanguage,
  initializeTheme,
  initializeThemePrimaryColor,
} from '@/features/theme/theme'
import { getRouter } from '#/router'

/**
 * Replaces the hard `window.location.assign` fallback in the api layer, so an
 * expired session becomes a client-side navigation instead of a page reload.
 */
function initializeSessionExpiryHandling() {
  setSessionExpiredHandler(() => {
    tokenStore.clear()

    const router = getRouter()
    const { href } = router.state.location

    router.navigate({
      to: API_CONFIG.loginPath,
      search: {
        // Nothing to come back to when we are already on the login screen.
        redirect: href.startsWith(API_CONFIG.loginPath) ? undefined : href,
      },
    })
  })
}

/**
 * On a reload the token is already on the device, so the settings can be in
 * the store before the first paint.
 *
 * Signed out there is nothing to ask with: `/settings` sits behind the JWT
 * guard, and a 401 from here would trip the session-expired handler while the
 * visitor is on the login screen. That case is covered by the authenticated
 * layout's loader, which runs once the sign-in lands.
 */
async function loadSettings() {
  if (!isSignedIn()) return

  // The thunk resolves through `rejectWithValue`, so a dead endpoint puts a
  // message in the slice rather than throwing the splash screen into limbo.
  await store.dispatch(fetchSettings())
}

export async function startup() {
  initializeTheme()

  initializeThemePrimaryColor()

  initializeSystemDir()

  initializeSystemLanguage()

  initializeSessionExpiryHandling()

  await loadSettings()

  // Future initialization
  // await restoreSession();
  // await initializeAnalytics();
}

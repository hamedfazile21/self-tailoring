import { API_CONFIG, setSessionExpiredHandler, tokenStore } from '#/lib/api'
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

export async function startup() {
  initializeTheme()

  initializeThemePrimaryColor()

  initializeSystemDir()

  initializeSystemLanguage()

  initializeSessionExpiryHandling()

  // Future initialization
  // await restoreSession();
  // await fetchSettings();
  // await initializeAnalytics();
}

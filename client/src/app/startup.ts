import {
  initializeSystemDir,
  initializeSystemLanguage,
  initializeTheme,
  initializeThemePrimaryColor,
  userIdentification,
} from '@/features/theme/theme'

export async function startup() {
  initializeTheme()

  initializeThemePrimaryColor()

  initializeSystemDir()

  initializeSystemLanguage()

  userIdentification()

  // Future initialization
  // await restoreSession();
  // await fetchSettings();
  // await initializeAnalytics();
}

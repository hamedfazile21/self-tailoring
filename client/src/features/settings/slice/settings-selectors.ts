import type { RootState } from '#/app/store'

export const selectSettingsPanel = (state: RootState) => state.settings

export const selectSettings = (state: RootState) => state.settings.data

/** `{ key: value }`, stable between fetches — safe to destructure in a render. */
export const selectSettingsMap = (state: RootState) => state.settings.values

/** One setting by key, or `null` when it has never been set. */
export const selectSetting = (key: string) => (state: RootState) =>
  state.settings.values[key] ?? null

export const selectSettingsStatus = (state: RootState) => state.settings.status

export const selectSettingsLoading = (state: RootState) =>
  state.settings.status === 'loading'

export const selectSettingsError = (state: RootState) => state.settings.error

/** The settings have been fetched at least once this session. */
export const selectSettingsLoaded = (state: RootState) =>
  state.settings.status === 'succeeded'

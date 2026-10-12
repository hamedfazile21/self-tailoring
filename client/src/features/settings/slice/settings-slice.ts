import { createSlice } from '@reduxjs/toolkit'
import { fetchSettings, saveSetting } from './settings-action'
import type { RequestStatus, Setting, SettingsMap } from './settings-types'

interface SettingsState {
  /** The rows as the server sent them, for a screen that lists or edits them. */
  data: Array<Setting>
  /**
   * The same rows as `{ key: value }`. Derived once here rather than in a
   * selector so every reader shares one object identity and nothing
   * re-renders on a `useSelector` that rebuilds the map each time.
   */
  values: SettingsMap
  status: RequestStatus
  error: string | null
}

const initialState: SettingsState = {
  data: [],
  values: {},
  status: 'idle',
  error: null,
}

/** Later rows win, which is the same thing a unique `key` would guarantee. */
const toMap = (rows: Array<Setting>): SettingsMap =>
  rows.reduce<SettingsMap>((map, row) => {
    map[row.key] = row.value
    return map
  }, {})

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /** Call on sign-out, so the next session does not start on these. */
    resetSettings() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
        state.values = toMap(action.payload)
      })
      /**
       * Folded in rather than refetched: the response is the saved row, so the
       * store can be brought up to date without a second round trip.
       *
       * Nothing is written on `pending` or `rejected` on purpose — the screen
       * that made the change is already showing it, and a failed save should
       * leave the store holding what the server actually has.
       */
      .addCase(saveSetting.fulfilled, (state, action) => {
        const saved = action.payload
        const index = state.data.findIndex((row) => row.key === saved.key)

        if (index === -1) state.data.push(saved)
        else state.data[index] = saved

        state.values[saved.key] = saved.value
      })

      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed'
        // The rows already in hand are left alone: a failed refresh is no
        // reason to blank out configuration the app is running on.
        state.error = action.payload ?? 'Could not load the settings.'
      })
  },
})

export const { resetSettings } = settingsSlice.actions

export default settingsSlice.reducer

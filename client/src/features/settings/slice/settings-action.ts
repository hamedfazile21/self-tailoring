/**
 * `rejectWithValue` carries the message the API layer already extracted, so
 * reducers never have to narrow `unknown`. The read is `silent` because
 * nothing on screen is waiting on it — a failure lands in the slice's `error`
 * rather than as a toast over whatever the person is doing.
 */

import { api, normalizeError } from '#/lib/api'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '#/app/store'
import type { SettingKey } from './settings-keys'
import type { Setting } from './settings-types'

export const fetchSettings = createAsyncThunk<
  Array<Setting>,
  { force?: boolean } | undefined,
  { state: RootState; rejectValue: string }
>(
  'settings/fetchAll',
  async (_args, { rejectWithValue }) => {
    try {
      // `unwrap: true` resolves with the envelope's `data`, not the envelope.
      return await api.get<Array<Setting>>('/settings', {
        unwrap: true,
        silent: true,
      })
    } catch (error) {
      return rejectWithValue(normalizeError(error).message)
    }
  },
  {
    condition: (args, { getState }) => {
      if (args?.force) return true

      const { status } = getState().settings
      // Two places ask for these: `startup` on a reload, and the authenticated
      // layout's loader after a sign-in. Whichever runs second should not
      // repeat the request, so pass `{ force: true }` to actually refresh.
      return status !== 'loading' && status !== 'succeeded'
    },
  },
)

/**
 * Create-or-edit one setting. `PUT /settings/upsert/:key` exists so a caller
 * saving a preference never has to know whether it has been saved before.
 *
 * `silent` again: a preference that failed to persist should not interrupt
 * what the person was doing. The UI it came from already shows their choice,
 * and the worst case is that the choice does not survive a reload.
 */
export const saveSetting = createAsyncThunk<
  Setting,
  { key: SettingKey; value: string },
  { rejectValue: string }
>('settings/save', async ({ key, value }, { rejectWithValue }) => {
  try {
    return await api.put<Setting, { value: string }>(
      `/settings/upsert/${key}`,
      { value },
      { unwrap: true, silent: true },
    )
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

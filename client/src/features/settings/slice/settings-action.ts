/**
 * `rejectWithValue` carries the message the API layer already extracted, so
 * reducers never have to narrow `unknown`. The read is `silent` because
 * nothing on screen is waiting on it — a failure lands in the slice's `error`
 * rather than as a toast over whatever the person is doing.
 */

import { api, normalizeError } from '#/lib/api'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '#/app/store'
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

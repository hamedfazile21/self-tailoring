/**
 * Shapes handled by the Nest `settings` controller
 * (`server/src/settings/settings.controller.ts`).
 *
 * | Thunk           | Request                           |
 * | --------------- | --------------------------------- |
 * | `fetchSettings` | `GET /settings`                   |
 *
 * Settings are one flat key/value table with no owner column, so they are
 * application configuration rather than anything per-user.
 */

export interface Setting {
  id: number
  key: string
  value: string
  created_at: string
  updated_at: string
}

/** The rows collapsed to `{ key: value }`, which is how screens read them. */
export type SettingsMap = Record<string, string>

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

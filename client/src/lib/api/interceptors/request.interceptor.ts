import i18n from '#/app/i18n'
import { tokenStore } from '../token'
import { normalizeError } from '../error'
import { logRequest } from '../dev-logger'
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * Runs before every request leaves the browser: authenticates it, tells the
 * backend which language to answer in, and strips empty query params so URLs
 * stay clean (and cache keys stable).
 */
export function onRequest(config: InternalAxiosRequestConfig) {
  if (!config.skipAuth) {
    const token = tokenStore.getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
  }

  if (i18n.language) config.headers.set('Accept-Language', i18n.language)

  // Let the browser set the multipart boundary itself.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  if (config.params && typeof config.params === 'object') {
    config.params = Object.fromEntries(
      Object.entries(config.params as Record<string, unknown>).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    )
  }

  logRequest(config)

  return config
}

/** Fires when the request could not even be built — rare, but must not leak. */
export function onRequestError(error: unknown) {
  return Promise.reject(normalizeError(error))
}

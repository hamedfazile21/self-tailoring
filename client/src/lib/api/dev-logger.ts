import { API_CONFIG } from './config'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from './error'

/**
 * A console trail of every call, so you can confirm a request actually fired
 * even when the Network panel was closed at the time (DevTools only records
 * while it is open). Dev only — stripped from production builds.
 */
const enabled = import.meta.env.DEV && API_CONFIG.logRequests

function label(method: string | undefined, url: string | undefined) {
  return `${method?.toUpperCase() ?? 'REQUEST'} ${url ?? ''}`
}

export function logRequest(config: InternalAxiosRequestConfig) {
  if (!enabled) return
  config._startedAt = performance.now()
  console.debug(`%c→ ${label(config.method, config.url)}`, 'color:#64748b', {
    baseURL: config.baseURL,
    params: config.params,
    body: config.data,
  })
}

export function logResponse(response: AxiosResponse) {
  if (!enabled) return
  const { config, status } = response
  const ms = config._startedAt
    ? Math.round(performance.now() - config._startedAt)
    : undefined

  console.debug(
    `%c← ${status} ${label(config.method, config.url)}${ms ? ` (${ms}ms)` : ''}`,
    'color:#16a34a',
    response.data,
  )
}

export function logError(error: ApiError) {
  if (!enabled) return
  console.error(
    `%c✕ ${error.status ?? error.kind} ${label(error.method, error.url)}`,
    'color:#dc2626',
    error.message,
    error,
  )
}

import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { API_CONFIG } from '../config'
import { normalizeError } from '../error'
import { handleSessionExpired, tokenStore } from '../token'
import { logError, logResponse } from '../dev-logger'
import type { ApiError } from '../error'
import type { AxiosInstance, AxiosResponse } from 'axios'

/** Successful responses pass straight through; unwrapping happens in `request`. */
export function onResponse(response: AxiosResponse) {
  logResponse(response)
  return response
}

/**
 * Shared across every 401 that lands while a refresh is already in flight, so
 * ten parallel requests trigger one refresh call instead of ten.
 */
let refreshPromise: Promise<string> | null = null

/** Plain axios on purpose: the refresh call must not re-enter these interceptors. */
async function requestNewAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token available')

  const { data } = await axios.post(
    API_CONFIG.refreshEndpoint,
    { refreshToken },
    {
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
    },
  )

  // Accept both camelCase and snake_case, with or without an envelope.
  const payload = data?.data ?? data
  const accessToken: string | undefined =
    payload?.accessToken ?? payload?.access_token

  if (!accessToken) throw new Error('Refresh response contained no token')

  tokenStore.setTokens({
    accessToken,
    refreshToken: payload?.refreshToken ?? payload?.refresh_token ?? undefined,
  })

  return accessToken
}

/**
 * One toast per failure kind at a time — a burst of failing requests should
 * not stack a dozen identical toasts.
 */
function notify(error: ApiError) {
  toast.error(error.message, { id: `api-error-${error.kind}` })
}

function shouldNotify(error: ApiError): boolean {
  if (error.kind === 'canceled') return false
  // Forms render these next to the inputs; a toast would just be noise.
  if (error.kind === 'validation' && error.fieldErrors) return false
  return true
}

/**
 * The error half of the response interceptor. Takes the client so it can
 * replay a request after refreshing the token without importing it (which
 * would be a cycle).
 */
export function createResponseErrorHandler(client: AxiosInstance) {
  return async (error: unknown): Promise<never | AxiosResponse> => {
    const apiError = normalizeError(error)
    const config = error instanceof AxiosError ? error.config : undefined

    if (apiError.kind === 'canceled') throw apiError

    const canRefresh =
      config !== undefined &&
      apiError.status === 401 &&
      !config._retried &&
      !config.skipAuth &&
      !config.skipRefresh &&
      tokenStore.getRefreshToken() !== null

    if (config && canRefresh) {
      config._retried = true
      try {
        refreshPromise ??= requestNewAccessToken().finally(() => {
          refreshPromise = null
        })
        const accessToken = await refreshPromise
        config.headers.set('Authorization', `Bearer ${accessToken}`)
        return await client.request(config)
      } catch {
        handleSessionExpired()
        if (shouldNotify(apiError) && !config.silent) notify(apiError)
        throw apiError
      }
    }

    // 401 we cannot recover from: the session is genuinely over.
    if (apiError.kind === 'unauthorized') handleSessionExpired()

    logError(apiError)

    if (shouldNotify(apiError) && !config?.silent) notify(apiError)

    throw apiError
  }
}

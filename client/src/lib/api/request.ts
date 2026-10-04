import { apiClient } from './client'
import { API_CONFIG } from './config'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiEnvelope, RequestOptions } from './types'

function looksLikeEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return typeof body === 'object' && body !== null && 'data' in body
}

/**
 * Low-level escape hatch: same behavior as the verbs below, but resolves with
 * the full `AxiosResponse` so you can read status and headers (pagination
 * totals, `Location`, …).
 */
export function requestRaw<TResponse>(
  config: AxiosRequestConfig,
): Promise<AxiosResponse<TResponse>> {
  return apiClient.request<TResponse>(config)
}

/**
 * Sends a request and resolves with the typed response body. Rejects with an
 * `ApiError` — never a bare `AxiosError` — so `catch` blocks have one shape to
 * deal with.
 */
export async function request<TResponse>(
  config: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.request<unknown>(config)
  const unwrap = config.unwrap ?? API_CONFIG.unwrapEnvelope

  // `TResponse` describes what the caller expects *after* unwrapping, so the
  // envelope's `data` is the value they asked for.
  if (unwrap && looksLikeEnvelope(response.data)) {
    return (response.data as ApiEnvelope<TResponse>).data
  }

  return response.data as TResponse
}

/**
 * Typed HTTP verbs.
 *
 * `TResponse` is what you get back, `TBody` is what you send. Both are
 * inferred from the call site, so `api.post<User, CreateUserDto>(...)` type
 * checks the payload too.
 */
export const api = {
  get: <TResponse>(url: string, options?: RequestOptions) =>
    request<TResponse>({ ...options, url, method: 'GET' }),

  post: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ) => request<TResponse>({ ...options, url, method: 'POST', data: body }),

  put: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ) => request<TResponse>({ ...options, url, method: 'PUT', data: body }),

  patch: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ) => request<TResponse>({ ...options, url, method: 'PATCH', data: body }),

  /** `body` is optional — some APIs want a payload on DELETE (bulk removal). */
  delete: <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    options?: RequestOptions,
  ) => request<TResponse>({ ...options, url, method: 'DELETE', data: body }),

  /**
   * Multipart upload. The `Content-Type` header is intentionally left to the
   * browser so it can add the multipart boundary.
   */
  upload: <TResponse>(
    url: string,
    formData: FormData,
    options?: RequestOptions & { onProgress?: (percent: number) => void },
  ) => {
    const { onProgress, ...rest } = options ?? {}

    return request<TResponse>({
      ...rest,
      url,
      method: 'POST',
      data: formData,
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return
        onProgress(Math.round((event.loaded * 100) / event.total))
      },
    })
  },

  /** Fetches a file (export, invoice PDF, …) as a `Blob`. */
  download: (url: string, options?: RequestOptions) =>
    request<Blob>({ ...options, url, method: 'GET', responseType: 'blob' }),
}

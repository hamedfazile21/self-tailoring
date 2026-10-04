import axios, { AxiosError } from 'axios'
import type { ApiErrorBody } from './types'

/**
 * A coarse bucket for the failure. UI code should branch on this rather than
 * on raw status codes — it stays readable and covers the transport failures
 * (network down, timeout, aborted) that have no status at all.
 */
export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'canceled'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rate_limit'
  | 'server'
  | 'unknown'

const KIND_BY_STATUS: Partial<Record<number, ApiErrorKind>> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  408: 'timeout',
  409: 'conflict',
  422: 'validation',
  429: 'rate_limit',
}

/** Shown when the server sends no usable message of its own. */
const FALLBACK_MESSAGE: Record<ApiErrorKind, string> = {
  network: 'Cannot reach the server. Check your internet connection.',
  timeout: 'The request took too long. Please try again.',
  canceled: 'Request canceled.',
  bad_request: 'The request was invalid.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'We could not find what you were looking for.',
  conflict: 'That action conflicts with the current state.',
  validation: 'Please check the highlighted fields and try again.',
  rate_limit: 'Too many requests. Please slow down and retry shortly.',
  server: 'Something went wrong on our side. Please try again later.',
  unknown: 'Something unexpected happened.',
}

function kindFromStatus(status: number): ApiErrorKind {
  const mapped = KIND_BY_STATUS[status]
  if (mapped) return mapped
  if (status >= 500) return 'server'
  if (status >= 400) return 'bad_request'
  return 'unknown'
}

interface ApiErrorInit {
  kind: ApiErrorKind
  message: string
  status?: number
  code?: string | number
  fieldErrors?: Record<string, Array<string>>
  data?: unknown
  url?: string
  method?: string
  cause?: unknown
}

/**
 * The only error type that escapes this layer. Every rejected request —
 * whether it failed in the browser, in flight, or on the server — arrives as
 * one of these, so callers never have to narrow `unknown`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly code?: string | number
  /** Validation errors keyed by field name, ready to feed into a form. */
  readonly fieldErrors?: Record<string, Array<string>>
  /** Raw response body, for the rare case a screen needs something specific. */
  readonly data?: unknown
  readonly url?: string
  readonly method?: string

  constructor(init: ApiErrorInit) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors
    this.data = init.data
    this.url = init.url
    this.method = init.method
  }

  /** Worth offering the user a "retry" button for. */
  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server' ||
      this.kind === 'rate_limit'
    )
  }

  /** The user is not (or no longer) allowed through. */
  get isAuthError(): boolean {
    return this.kind === 'unauthorized' || this.kind === 'forbidden'
  }
}

/** Pull `{ errors: { field: 'msg' | ['msg'] } }` into a uniform shape. */
function readFieldErrors(
  body: ApiErrorBody | undefined,
): Record<string, Array<string>> | undefined {
  if (!body?.errors || typeof body.errors !== 'object') return undefined

  const result: Record<string, Array<string>> = {}
  for (const [field, value] of Object.entries(body.errors)) {
    result[field] = Array.isArray(value) ? value : [value]
  }
  return Object.keys(result).length > 0 ? result : undefined
}

/** Best message the server gave us, across the common body conventions. */
function readMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim()) return body
  if (!body || typeof body !== 'object') return undefined

  const { message, error, detail } = body as ApiErrorBody
  if (Array.isArray(message)) return message[0]
  return message || error || detail || undefined
}

/**
 * Turns anything thrown during a request into an `ApiError`. Safe to call on
 * values that are already normalized.
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError({
      kind: 'canceled',
      message: FALLBACK_MESSAGE.canceled,
      cause: error,
    })
  }

  if (error instanceof AxiosError) {
    const { response, config, code } = error
    const url = config?.url
    const method = config?.method?.toUpperCase()

    // No response at all: DNS failure, CORS, offline, or we gave up waiting.
    if (!response) {
      const kind: ApiErrorKind =
        code === 'ECONNABORTED' || code === 'ETIMEDOUT' ? 'timeout' : 'network'

      return new ApiError({
        kind,
        message: FALLBACK_MESSAGE[kind],
        code,
        url,
        method,
        cause: error,
      })
    }

    const kind = kindFromStatus(response.status)
    const body = response.data as ApiErrorBody | undefined
    const fieldErrors = readFieldErrors(body)

    // A 422 with no top-level message still has something useful to say.
    const message =
      readMessage(response.data) ??
      (fieldErrors ? Object.values(fieldErrors)[0][0] : undefined) ??
      FALLBACK_MESSAGE[kind]

    return new ApiError({
      kind,
      message,
      status: response.status,
      code: body?.code ?? code,
      fieldErrors,
      data: response.data,
      url,
      method,
      cause: error,
    })
  }

  if (error instanceof Error) {
    return new ApiError({
      kind: 'unknown',
      message: error.message || FALLBACK_MESSAGE.unknown,
      cause: error,
    })
  }

  return new ApiError({ kind: 'unknown', message: FALLBACK_MESSAGE.unknown })
}

/** Narrowing helper for `catch` blocks and TanStack Query callbacks. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

import type { AxiosRequestConfig } from 'axios'

/**
 * Per-request switches we attach to the axios config. Declaring them on
 * `AxiosRequestConfig` keeps them visible inside interceptors, where axios
 * hands us back the original config object.
 */
declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Suppress the automatic error toast for this call. */
    silent?: boolean
    /** Do not attach the `Authorization` header. */
    skipAuth?: boolean
    /** Do not attempt a token refresh when this call returns 401. */
    skipRefresh?: boolean
    /** Resolve with `body.data` instead of the whole body. */
    unwrap?: boolean
    /** Internal: marks a request that was already replayed after a refresh. */
    _retried?: boolean
    /** Internal: `performance.now()` at send time, for the dev logger. */
    _startedAt?: number
  }
}

/**
 * What the Nest `TransformInterceptor` wraps every successful payload in:
 * `{ status, data }`, plus `pagination` when the handler returned a page.
 */
export interface ApiEnvelope<T> {
  status: number
  data: T
  pagination?: PageMeta
  message?: string
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** A paginated collection response, envelope included. */
export interface Paginated<T> extends ApiEnvelope<Array<T>> {
  pagination: PageMeta
}

/** The error bodies we know how to read a message out of. */
export interface ApiErrorBody {
  message?: string | Array<string>
  error?: string
  detail?: string
  code?: string | number
  /** Field-level validation errors: `{ email: ['is taken'] }`. */
  errors?: Record<string, string | Array<string>>
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | Array<string | number>
>

/**
 * Options accepted by every verb helper. `url`, `method` and `data` are owned
 * by the helpers themselves, so they are not configurable here.
 */
export type RequestOptions = Omit<
  AxiosRequestConfig,
  'url' | 'method' | 'data' | 'params'
> & {
  params?: QueryParams
}

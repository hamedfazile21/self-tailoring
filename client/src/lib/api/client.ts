import axios from 'axios'
import { API_CONFIG } from './config'
import { onRequest, onRequestError } from './interceptors/request.interceptor'
import {
  createResponseErrorHandler,
  onResponse,
} from './interceptors/response.interceptor'

/**
 * The one axios instance the app talks to. Import `api` from `./request`
 * instead of using this directly — reach for the client only when you need
 * something axios-specific (progress events, a custom `responseType`).
 */
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(onRequest, onRequestError)
apiClient.interceptors.response.use(
  onResponse,
  createResponseErrorHandler(apiClient),
)

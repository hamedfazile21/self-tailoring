# HTTP layer

```
src/lib/api/
├── client.ts        axios instance + interceptor wiring
├── config.ts        base URL, timeout, storage keys  (edit this first)
├── error.ts         ApiError class, status → kind mapping, normalizeError
├── index.ts         public barrel — import from '#/lib/api'
├── request.ts       typed get / post / put / patch / delete / upload / download
├── token.ts         access & refresh token storage, session-expired hook
└── interceptors/
    ├── request.interceptor.ts   auth header, Accept-Language, param cleanup
    └── response.interceptor.ts  error normalization, 401 refresh, toasts
```

## Setup

```bash
# .env.local
VITE_API_BASE_URL=https://api.example.com/v1
VITE_API_TIMEOUT=30000
```

If your backend wraps payloads as `{ data, message }`, flip
`unwrapEnvelope: true` in `config.ts` and `api.get<User>()` resolves with the
`User` directly.

## Calling the API

```ts
import { api } from '#/lib/api'

const users = await api.get<Array<User>>('/users', { params: { page: 1 } })
const user = await api.post<User, CreateUserDto>('/users', dto)
await api.patch<User, Partial<User>>(`/users/${id}`, { name })
await api.delete<void>(`/users/${id}`)
await api.delete<void>('/users', { ids }) // DELETE with a body
```

`TResponse` is what comes back, `TBody` is what goes out — both are checked.

## Handling errors

Every rejection is an `ApiError`, so there is one shape to branch on:

```ts
import { api, isApiError } from '#/lib/api'

try {
  await api.post<User, CreateUserDto>('/users', dto)
} catch (error) {
  if (!isApiError(error)) throw error

  if (error.kind === 'validation') form.setErrors(error.fieldErrors ?? {})
  else if (error.isRetryable) showRetryButton()
}
```

`kind` is one of `network`, `timeout`, `canceled`, `bad_request`,
`unauthorized`, `forbidden`, `not_found`, `conflict`, `validation`,
`rate_limit`, `server`, `unknown`. Also available: `status`, `code`,
`fieldErrors`, `data`, plus the `isRetryable` / `isAuthError` getters.

## What the interceptors do for you

- **Auth** — attaches `Bearer <access token>` unless you pass `skipAuth: true`.
- **401** — refreshes once via `POST /auth/refresh`, replays the original
  request, and coalesces parallel 401s into a single refresh. If the refresh
  fails, the session is cleared and the user is sent to `/login`.
- **500 / 502 / 503** — mapped to `kind: 'server'` with a retryable,
  user-readable message instead of the raw stack.
- **No response** — offline, CORS, or DNS becomes `network`; a blown timeout
  becomes `timeout`.
- **Toasts** — one sonner toast per failure kind (deduped by id). Validation
  errors that carry `fieldErrors` are _not_ toasted, since the form shows them.

## Per-request options

| Option               | Effect                                  |
| -------------------- | --------------------------------------- |
| `silent: true`       | no error toast for this call            |
| `skipAuth: true`     | send without the `Authorization` header |
| `skipRefresh: true`  | do not attempt a token refresh on 401   |
| `unwrap: true/false` | override the global envelope setting    |
| `signal`             | standard `AbortController` support      |

## Auth plumbing

```ts
import { tokenStore, setSessionExpiredHandler } from '#/lib/api'

tokenStore.setTokens({ accessToken, refreshToken })
tokenStore.clear()

// Let the router handle the redirect instead of window.location:
setSessionExpiredHandler(() => {
  tokenStore.clear()
  router.navigate({ to: '/login' })
})
```

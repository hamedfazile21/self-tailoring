import LoginBasic from '#/features/login/login-basic'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/login/')({
  /** `redirect` carries where the visitor was headed before the guard stepped in. */
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginBasic,
})

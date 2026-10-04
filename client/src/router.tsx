import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function createRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })
}

let router: ReturnType<typeof createRouter> | null = null

/**
 * One router for the whole app. It is a singleton because `startup()` has to
 * navigate with the same instance React renders — and because building a new
 * one on every render would reset the navigation state.
 */
export function getRouter() {
  router ??= createRouter()
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

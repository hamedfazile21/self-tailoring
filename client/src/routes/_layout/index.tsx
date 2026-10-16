import Dashboard from '#/features/dashboard/dashboard'
import { store } from '#/app/store'
import {
  fetchDashboardTotals,
  fetchMonthlyOrders,
  fetchPendingOrders,
  fetchTopCustomers,
} from '#/features/dashboard/slice/dashboard-slice'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/')({
  /**
   * Fires all four dashboard requests in parallel before the screen mounts, so
   * the cards and charts render filled in rather than flashing empty. The data
   * itself lives in Redux — the loader only kicks the thunks off and waits.
   *
   * The thunks use `rejectWithValue`, so they never reject: a dead endpoint
   * lands in that panel's `error` instead of blocking the navigation.
   */
  loader: () =>
    Promise.all([
      store.dispatch(fetchDashboardTotals()),
      store.dispatch(fetchMonthlyOrders()),
      store.dispatch(fetchPendingOrders()),
      store.dispatch(fetchTopCustomers()),
    ]),
  /**
   * No `staleTime`, so it defaults to 0 and every arrival reloads. The totals
   * and the pending list go out of date the moment an order or a customer is
   * saved, and this is the screen people come back to in order to see that.
   *
   * Preloading is off for the same reason rather than in spite of it: the
   * router picks `staleTime` for a real navigation and `preloadStaleTime`
   * only for the preload itself, so with a stale time of 0 the click refetches
   * whatever the hover fetched — and these are four requests, not one.
   */
  preload: false,
  component: Dashboard,
})

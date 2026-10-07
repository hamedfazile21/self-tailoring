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
  // The router preloads on intent with a stale time of 0, which would refetch
  // on the click right after the hover. This keeps it to one round trip.
  staleTime: 30_000,
  component: Dashboard,
})

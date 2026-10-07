import type { RootState } from '#/app/store'

export const selectDashboardTotals = (state: RootState) =>
  state.dashboard.totals

export const selectMonthlyOrders = (state: RootState) =>
  state.dashboard.monthlyOrders

/** Ready to hand straight to a Recharts `<BarChart data={...}>`. */
export const selectMonthlyOrdersChartData = (state: RootState) =>
  state.dashboard.monthlyOrders.data?.months ?? []

export const selectPendingOrders = (state: RootState) =>
  state.dashboard.pendingOrders

export const selectTopCustomers = (state: RootState) =>
  state.dashboard.topCustomers

export const selectDashboardYear = (state: RootState) => state.dashboard.year

/** True while any panel is still in flight. */
export const selectDashboardLoading = (state: RootState) =>
  state.dashboard.totals.status === 'loading' ||
  state.dashboard.monthlyOrders.status === 'loading' ||
  state.dashboard.pendingOrders.status === 'loading' ||
  state.dashboard.topCustomers.status === 'loading'

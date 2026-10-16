import type { RootState } from '#/app/store'

export const selectOrdersList = (state: RootState) => state.orders.list

export const selectOrders = (state: RootState) => state.orders.list.data

export const selectOrdersPagination = (state: RootState) =>
  state.orders.list.pagination

export const selectOrdersFilters = (state: RootState) => state.orders.filters

export const selectOrdersSearch = (state: RootState) =>
  state.orders.filters.search

/** Drives the "clear filters" affordance in the toolbar. */
export const selectOrdersFiltered = (state: RootState) =>
  state.orders.filters.search.length > 0

export const selectCurrentOrder = (state: RootState) => state.orders.current

export const selectOrderById = (id: number) => (state: RootState) =>
  state.orders.list.data.find((order) => order.id === id) ?? null

export const selectSelectedOrderIds = (state: RootState) =>
  state.orders.selectedIds

export const selectSelectedCount = (state: RootState) =>
  state.orders.selectedIds.length

/** Header checkbox state: every row on the page is selected. */
export const selectAllOnPageSelected = (state: RootState) =>
  state.orders.list.data.length > 0 &&
  state.orders.selectedIds.length === state.orders.list.data.length

export const selectOrdersMutation = (state: RootState) => state.orders.mutation

/** True while a create / update / done / delete is in flight. */
export const selectOrdersMutating = (state: RootState) =>
  state.orders.mutation.status === 'loading'

export const selectOrdersLoading = (state: RootState) =>
  state.orders.list.status === 'loading'

/** The table has loaded and the query matched nothing — show the empty state. */
export const selectOrdersEmpty = (state: RootState) =>
  state.orders.list.status === 'succeeded' &&
  state.orders.list.data.length === 0

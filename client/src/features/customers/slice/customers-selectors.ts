import type { RootState } from '#/app/store'

export const selectCustomersList = (state: RootState) => state.customers.list

export const selectCustomers = (state: RootState) => state.customers.list.data

export const selectCustomersPagination = (state: RootState) =>
  state.customers.list.pagination

export const selectCustomersFilters = (state: RootState) =>
  state.customers.filters

export const selectCustomersSearch = (state: RootState) =>
  state.customers.filters.search

export const selectCurrentCustomer = (state: RootState) =>
  state.customers.current

export const selectCustomerById = (id: number) => (state: RootState) =>
  state.customers.list.data.find((customer) => customer.id === id) ?? null

export const selectSelectedCustomerIds = (state: RootState) =>
  state.customers.selectedIds

export const selectSelectedCount = (state: RootState) =>
  state.customers.selectedIds.length

/** Header checkbox state: every row on the page is selected. */
export const selectAllOnPageSelected = (state: RootState) =>
  state.customers.list.data.length > 0 &&
  state.customers.selectedIds.length === state.customers.list.data.length

export const selectCustomersMutation = (state: RootState) =>
  state.customers.mutation

/** True while a create / update / delete is in flight — disables the submit. */
export const selectCustomersMutating = (state: RootState) =>
  state.customers.mutation.status === 'loading'

export const selectCustomersLoading = (state: RootState) =>
  state.customers.list.status === 'loading'

/** The table has loaded and the query matched nothing — show the empty state. */
export const selectCustomersEmpty = (state: RootState) =>
  state.customers.list.status === 'succeeded' &&
  state.customers.list.data.length === 0

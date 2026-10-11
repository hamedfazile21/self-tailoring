import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { PageMeta } from '#/lib/api'
import type {
  Customer,
  CustomerStatus,
  CustomersQuery,
  Panel,
  RequestStatus,
} from './customers-types'
import {
  createCustomer,
  deleteCustomers,
  fetchCustomer,
  fetchCustomers,
  updateCustomer,
} from './customers-action'

interface CustomersState {
  /** The table: one page of rows plus the meta the pager needs. */
  list: Panel<Array<Customer>> & {
    pagination: PageMeta
    /**
     * The newest `fetchCustomers` dispatch. Debounced typing can leave two
     * requests in flight, and they are not guaranteed to come back in order —
     * anything but the latest is dropped on arrival.
     */
    requestId: string | null
  }
  /** The row being viewed or edited, loaded on its own by id. */
  current: Panel<Customer | null>
  /** Query the next `fetchCustomers` uses unless the call overrides it. */
  filters: CustomersQuery
  /** Shared by create / update / delete — only one runs at a time in the UI. */
  mutation: { status: RequestStatus; error: string | null }
  /** Checkbox selection, fed straight to the bulk-delete endpoint. */
  selectedIds: Array<number>
}

/** Rows per page. The server defaults to the same number and caps `limit` at 100. */
export const CUSTOMERS_PAGE_SIZE = 10

const initialPagination: PageMeta = {
  page: 1,
  limit: CUSTOMERS_PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const initialState: CustomersState = {
  list: {
    data: [],
    status: 'idle',
    error: null,
    pagination: initialPagination,
    requestId: null,
  },
  current: { data: null, status: 'idle', error: null },
  filters: { page: 1, limit: CUSTOMERS_PAGE_SIZE, search: '', status: [] },
  mutation: { status: 'idle', error: null },
  selectedIds: [],
}

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    /** Debounce in the component — every keystroke here would be a request. */
    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload
      state.filters.page = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload
    },
    /**
     * Replaces the status filter; an empty array means every status. Back to
     * page 1, because page 4 of the old result set rarely exists in the new one.
     */
    setStatus(state, action: PayloadAction<Array<CustomerStatus>>) {
      state.filters.status = action.payload
      state.filters.page = 1
    },
    setLimit(state, action: PayloadAction<number>) {
      state.filters.limit = action.payload
      state.filters.page = 1
    },
    toggleSelected(state, action: PayloadAction<number>) {
      const id = action.payload
      state.selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter((selected) => selected !== id)
        : [...state.selectedIds, id]
    },
    /** Header checkbox: selects every row on the current page, or none. */
    selectAllOnPage(state, action: PayloadAction<boolean>) {
      state.selectedIds = action.payload
        ? state.list.data.map((customer) => customer.id)
        : []
    },
    clearSelection(state) {
      state.selectedIds = []
    },
    /** Call when a form closes, so a stale error does not greet the next open. */
    clearCurrent(state) {
      state.current = initialState.current
    },
    resetMutation(state) {
      state.mutation = initialState.mutation
    },
    resetCustomers() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state, action) => {
        state.list.status = 'loading'
        state.list.error = null
        state.list.requestId = action.meta.requestId
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        // A superseded response: a newer search or page is already on its way,
        // so these rows would contradict the filters the toolbar is showing.
        if (action.meta.requestId !== state.list.requestId) return

        state.list.status = 'succeeded'
        state.list.data = action.payload.data
        state.list.pagination = action.payload.pagination
        // Keep `filters` in step with what the server actually served, so the
        // pager and a `fetchCustomers({ page })` call cannot drift apart.
        state.filters.page = action.payload.pagination.page
        state.filters.limit = action.payload.pagination.limit
        // Rows that just left the page can no longer be acted on.
        const visible = new Set(action.payload.data.map(({ id }) => id))
        state.selectedIds = state.selectedIds.filter((id) => visible.has(id))
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        if (action.meta.requestId !== state.list.requestId) return

        state.list.status = 'failed'
        state.list.error = action.payload ?? 'Could not load the customers.'
      })

      .addCase(fetchCustomer.pending, (state) => {
        state.current.status = 'loading'
        state.current.error = null
      })
      .addCase(fetchCustomer.fulfilled, (state, action) => {
        state.current.status = 'succeeded'
        state.current.data = action.payload
      })
      .addCase(fetchCustomer.rejected, (state, action) => {
        state.current.status = 'failed'
        state.current.data = null
        state.current.error = action.payload ?? 'Could not load the customer.'
      })

      .addCase(createCustomer.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        state.current.data = action.payload
        state.current.status = 'succeeded'
        // The list is ordered by `id DESC`, so a new customer belongs on top of
        // page one. Refetch instead of splicing when you are on another page.
        if (state.filters.page === 1) {
          state.list.data = [action.payload, ...state.list.data].slice(
            0,
            state.list.pagination.limit,
          )
        }
        state.list.pagination.total += 1
        state.list.pagination.totalPages = Math.ceil(
          state.list.pagination.total / state.list.pagination.limit,
        )
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error =
          action.payload ?? 'Could not create the customer.'
      })

      .addCase(updateCustomer.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        const updated = action.payload
        const index = state.list.data.findIndex(({ id }) => id === updated.id)
        if (index !== -1) {
          // `update` returns the saved entity; merge so a response that left
          // `measurements` off does not wipe the row's relation.
          state.list.data[index] = { ...state.list.data[index], ...updated }
        }
        if (state.current.data?.id === updated.id) {
          state.current.data = { ...state.current.data, ...updated }
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error =
          action.payload ?? 'Could not update the customer.'
      })

      .addCase(deleteCustomers.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(deleteCustomers.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        const removed = new Set(action.payload.ids)
        state.list.data = state.list.data.filter(({ id }) => !removed.has(id))
        state.selectedIds = state.selectedIds.filter((id) => !removed.has(id))
        if (state.current.data && removed.has(state.current.data.id)) {
          state.current = initialState.current
        }
        // `affected` is what the database actually deleted, which can be fewer
        // than the ids sent if another session got there first.
        const { affected } = action.payload.result
        const { limit } = state.list.pagination
        state.list.pagination.total = Math.max(
          state.list.pagination.total - affected,
          0,
        )
        state.list.pagination.totalPages = Math.ceil(
          state.list.pagination.total / limit,
        )
        // Emptying the last page would otherwise leave the table blank; the
        // component refetches after this lands.
        if (
          state.filters.page > state.list.pagination.totalPages &&
          state.list.pagination.totalPages > 0
        ) {
          state.filters.page = state.list.pagination.totalPages
        }
      })
      .addCase(deleteCustomers.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error =
          action.payload ?? 'Could not delete the customers.'
      })
  },
})

export const {
  setSearch,
  setPage,
  setStatus,
  setLimit,
  toggleSelected,
  selectAllOnPage,
  clearSelection,
  clearCurrent,
  resetMutation,
  resetCustomers,
} = customersSlice.actions

export default customersSlice.reducer

import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { PageMeta } from '#/lib/api'
import type {
  Order,
  OrderCustomerOption,
  OrdersQuery,
  Panel,
  RequestStatus,
} from './orders-types'
import {
  createOrder,
  deleteOrders,
  fetchOrder,
  fetchOrderCustomerOptions,
  fetchOrders,
  markOrderDone,
  updateOrder,
} from './orders-action'

interface OrdersState {
  /** The table: one page of rows plus the meta the pager needs. */
  list: Panel<Array<Order>> & {
    pagination: PageMeta
    /**
     * The newest `fetchOrders` dispatch. Debounced typing can leave two
     * requests in flight, and they are not guaranteed to come back in order —
     * anything but the latest is dropped on arrival.
     */
    requestId: string | null
  }
  /** The row being viewed or edited, loaded on its own by id. */
  current: Panel<Order | null>
  /** Query the next `fetchOrders` uses unless the call overrides it. */
  filters: OrdersQuery
  /** Customers and their measurements, for the order form's two pickers. */
  customerOptions: Panel<Array<OrderCustomerOption>>
  /** Shared by create / update / done / delete — one runs at a time in the UI. */
  mutation: { status: RequestStatus; error: string | null }
  /** Checkbox selection, fed straight to the bulk-delete endpoint. */
  selectedIds: Array<number>
}

/** Rows per page. The server defaults to the same number and caps `limit` at 100. */
export const ORDERS_PAGE_SIZE = 10

const initialPagination: PageMeta = {
  page: 1,
  limit: ORDERS_PAGE_SIZE,
  total: 0,
  totalPages: 0,
}

const initialState: OrdersState = {
  list: {
    data: [],
    status: 'idle',
    error: null,
    pagination: initialPagination,
    requestId: null,
  },
  current: { data: null, status: 'idle', error: null },
  filters: { page: 1, limit: ORDERS_PAGE_SIZE, search: '' },
  customerOptions: { data: [], status: 'idle', error: null },
  mutation: { status: 'idle', error: null },
  selectedIds: [],
}

const ordersSlice = createSlice({
  name: 'orders',
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
        ? state.list.data.map((order) => order.id)
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
    resetOrders() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state, action) => {
        state.list.status = 'loading'
        state.list.error = null
        state.list.requestId = action.meta.requestId
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        // A superseded response: a newer search or page is already on its way,
        // so these rows would contradict the filters the toolbar is showing.
        if (action.meta.requestId !== state.list.requestId) return

        state.list.status = 'succeeded'
        state.list.data = action.payload.data
        state.list.pagination = action.payload.pagination
        // Keep `filters` in step with what the server actually served, so the
        // pager and a `fetchOrders({ page })` call cannot drift apart.
        state.filters.page = action.payload.pagination.page
        state.filters.limit = action.payload.pagination.limit
        // Rows that just left the page can no longer be acted on.
        const visible = new Set(action.payload.data.map(({ id }) => id))
        state.selectedIds = state.selectedIds.filter((id) => visible.has(id))
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        if (action.meta.requestId !== state.list.requestId) return

        state.list.status = 'failed'
        state.list.error = action.payload ?? 'Could not load the orders.'
      })

      .addCase(fetchOrder.pending, (state) => {
        state.current.status = 'loading'
        state.current.error = null
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.current.status = 'succeeded'
        state.current.data = action.payload
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.current.status = 'failed'
        state.current.data = null
        state.current.error = action.payload ?? 'Could not load the order.'
      })

      .addCase(fetchOrderCustomerOptions.pending, (state) => {
        state.customerOptions.status = 'loading'
        state.customerOptions.error = null
      })
      .addCase(fetchOrderCustomerOptions.fulfilled, (state, action) => {
        state.customerOptions.status = 'succeeded'
        state.customerOptions.data = action.payload
      })
      .addCase(fetchOrderCustomerOptions.rejected, (state, action) => {
        state.customerOptions.status = 'failed'
        state.customerOptions.error =
          action.payload ?? 'Could not load the customers.'
      })

      .addCase(createOrder.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        state.current.data = action.payload
        state.current.status = 'succeeded'
        // The list is ordered by `id DESC`, so a new order belongs on top of
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
      .addCase(createOrder.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error = action.payload ?? 'Could not create the order.'
      })

      .addCase(updateOrder.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        replaceOrder(state, action.payload)
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error = action.payload ?? 'Could not update the order.'
      })

      .addCase(markOrderDone.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(markOrderDone.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded'
        // Same shape as an update — the endpoint answers with the whole order.
        replaceOrder(state, action.payload)
      })
      .addCase(markOrderDone.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error =
          action.payload ?? 'Could not mark the order as done.'
      })

      .addCase(deleteOrders.pending, (state) => {
        state.mutation.status = 'loading'
        state.mutation.error = null
      })
      .addCase(deleteOrders.fulfilled, (state, action) => {
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
      .addCase(deleteOrders.rejected, (state, action) => {
        state.mutation.status = 'failed'
        state.mutation.error = action.payload ?? 'Could not delete the orders.'
      })
  },
})

/**
 * `update` and `done` both answer with the saved order, so both land the same
 * way: merge over the row in the list, and over `current` when it is the one
 * on screen.
 */
function replaceOrder(state: OrdersState, saved: Order) {
  const index = state.list.data.findIndex(({ id }) => id === saved.id)
  if (index !== -1) {
    state.list.data[index] = { ...state.list.data[index], ...saved }
  }
  if (state.current.data?.id === saved.id) {
    state.current.data = { ...state.current.data, ...saved }
  }
}

export const {
  setSearch,
  setPage,
  setLimit,
  toggleSelected,
  selectAllOnPage,
  clearSelection,
  clearCurrent,
  resetMutation,
  resetOrders,
} = ordersSlice.actions

export default ordersSlice.reducer

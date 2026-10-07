import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, normalizeError } from '#/lib/api'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { PageMeta, Paginated } from '#/lib/api'
import type {
  DashboardTotals,
  MonthlyOrders,
  Panel,
  PendingOrder,
  TopCustomer,
} from './dashboard-types'

interface DashboardState {
  totals: Panel<DashboardTotals | null>
  monthlyOrders: Panel<MonthlyOrders | null>
  pendingOrders: Panel<Array<PendingOrder>> & {
    /** Drives the pager. `total` counts every pending order, not just `data`. */
    pagination: PageMeta
  }
  topCustomers: Panel<Array<TopCustomer>>
  /** Year the chart is showing; `null` means "whatever the server defaults to". */
  year: number | null
}

/**
 * Rows per page for the pending-orders card. The server defaults to the same
 * number, but the client sends it explicitly so changing it here is enough.
 */
export const PENDING_ORDERS_LIMIT = 4

/** How many customers the leaderboard ranks. */
export const TOP_CUSTOMERS_LIMIT = 5

const initialState: DashboardState = {
  totals: { data: null, status: 'idle', error: null },
  monthlyOrders: { data: null, status: 'idle', error: null },
  pendingOrders: {
    data: [],
    status: 'idle',
    error: null,
    pagination: {
      page: 1,
      limit: PENDING_ORDERS_LIMIT,
      total: 0,
      totalPages: 0,
    },
  },
  topCustomers: { data: [], status: 'idle', error: null },
  year: null,
}

/**
 * The three dashboard endpoints are independent, so each gets its own thunk
 * and its own slot in the state. `rejectWithValue` carries the message the
 * API layer already extracted, so reducers never touch `unknown`.
 */

export const fetchDashboardTotals = createAsyncThunk<
  DashboardTotals,
  void,
  { rejectValue: string }
>('dashboard/fetchTotals', async (_arg, { rejectWithValue }) => {
  try {
    // `unwrap: true` resolves with the envelope's `data`, not the envelope.
    return await api.get<DashboardTotals>('/dashboard/totals', {
      unwrap: true,
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const fetchMonthlyOrders = createAsyncThunk<
  MonthlyOrders,
  number | undefined,
  { rejectValue: string }
>('dashboard/fetchMonthlyOrders', async (year, { rejectWithValue }) => {
  try {
    return await api.get<MonthlyOrders>('/dashboard/monthly-orders', {
      params: year ? { year } : undefined,
      unwrap: true,
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export interface PendingOrdersArgs {
  page?: number
  limit?: number
}

export const fetchPendingOrders = createAsyncThunk<
  Paginated<PendingOrder>,
  PendingOrdersArgs | undefined,
  { rejectValue: string }
>('dashboard/fetchPendingOrders', async (args, { rejectWithValue }) => {
  try {
    // Left wrapped on purpose: `pagination` is a sibling of `data` on the
    // envelope, and the pager needs `page`/`totalPages` out of it.
    return await api.get<Paginated<PendingOrder>>('/dashboard/pending-orders', {
      params: {
        page: args?.page ?? 1,
        limit: args?.limit ?? PENDING_ORDERS_LIMIT,
      },
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const fetchTopCustomers = createAsyncThunk<
  Array<TopCustomer>,
  number | undefined,
  { rejectValue: string }
>('dashboard/fetchTopCustomers', async (limit, { rejectWithValue }) => {
  try {
    return await api.get<Array<TopCustomer>>('/dashboard/top-customers', {
      params: { limit: limit ?? TOP_CUSTOMERS_LIMIT },
      unwrap: true,
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setYear(state, action: PayloadAction<number | null>) {
      state.year = action.payload
    },
    resetDashboard() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardTotals.pending, (state) => {
        state.totals.status = 'loading'
        state.totals.error = null
      })
      .addCase(fetchDashboardTotals.fulfilled, (state, action) => {
        state.totals.status = 'succeeded'
        state.totals.data = action.payload
      })
      .addCase(fetchDashboardTotals.rejected, (state, action) => {
        state.totals.status = 'failed'
        state.totals.error = action.payload ?? 'Could not load the totals.'
      })

      .addCase(fetchMonthlyOrders.pending, (state) => {
        state.monthlyOrders.status = 'loading'
        state.monthlyOrders.error = null
      })
      .addCase(fetchMonthlyOrders.fulfilled, (state, action) => {
        state.monthlyOrders.status = 'succeeded'
        state.monthlyOrders.data = action.payload
        state.year = action.payload.year
      })
      .addCase(fetchMonthlyOrders.rejected, (state, action) => {
        state.monthlyOrders.status = 'failed'
        state.monthlyOrders.error =
          action.payload ?? 'Could not load the monthly chart.'
      })

      .addCase(fetchPendingOrders.pending, (state) => {
        state.pendingOrders.status = 'loading'
        state.pendingOrders.error = null
      })
      .addCase(fetchPendingOrders.fulfilled, (state, action) => {
        state.pendingOrders.status = 'succeeded'
        state.pendingOrders.data = action.payload.data
        state.pendingOrders.pagination = action.payload.pagination
      })
      .addCase(fetchPendingOrders.rejected, (state, action) => {
        state.pendingOrders.status = 'failed'
        state.pendingOrders.error =
          action.payload ?? 'Could not load the pending orders.'
      })

      .addCase(fetchTopCustomers.pending, (state) => {
        state.topCustomers.status = 'loading'
        state.topCustomers.error = null
      })
      .addCase(fetchTopCustomers.fulfilled, (state, action) => {
        state.topCustomers.status = 'succeeded'
        state.topCustomers.data = action.payload
      })
      .addCase(fetchTopCustomers.rejected, (state, action) => {
        state.topCustomers.status = 'failed'
        state.topCustomers.error =
          action.payload ?? 'Could not load the top customers.'
      })
  },
})

export const { setYear, resetDashboard } = dashboardSlice.actions

export default dashboardSlice.reducer

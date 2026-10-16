/**
 * `rejectWithValue` carries the message the API layer already extracted, so
 * reducers never have to narrow `unknown`. Reads pass `silent: true` because
 * the panel renders its own error; mutations stay loud so the interceptor
 * toasts a failed save.
 */

import { api, normalizeError } from '#/lib/api'
import type { Paginated } from '#/lib/api'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type {
  CreateOrderPayload,
  DeleteOrdersResult,
  Order,
  OrdersQuery,
  UpdateOrderArgs,
} from './orders-types'
import type { RootState } from '#/app/store'

export const fetchOrders = createAsyncThunk<
  Paginated<Order>,
  Partial<OrdersQuery> | undefined,
  { state: RootState; rejectValue: string }
>('orders/fetchAll', async (args, { getState, rejectWithValue }) => {
  const { page, limit, search } = {
    ...getState().orders.filters,
    ...args,
  }

  try {
    // Left wrapped on purpose: `pagination` is a sibling of `data` on the
    // envelope, and the pager needs `total`/`totalPages` out of it.
    return await api.get<Paginated<Order>>('/orders', {
      params: {
        page,
        limit,
        search: search || undefined,
      },
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const fetchOrder = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('orders/fetchOne', async (id, { rejectWithValue }) => {
  try {
    // `unwrap: true` resolves with the envelope's `data`, not the envelope.
    return await api.get<Order>(`/orders/show/${id}`, {
      unwrap: true,
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  { rejectValue: string }
>('orders/create', async (payload, { rejectWithValue }) => {
  try {
    return await api.post<Order, CreateOrderPayload>(
      '/orders/create',
      payload,
      { unwrap: true },
    )
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const updateOrder = createAsyncThunk<
  Order,
  UpdateOrderArgs,
  { rejectValue: string }
>('orders/update', async ({ id, changes }, { rejectWithValue }) => {
  try {
    return await api.patch<Order, UpdateOrderArgs['changes']>(
      `/orders/update/${id}`,
      changes,
      { unwrap: true },
    )
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

/**
 * The one-step "it is finished" action. A `PATCH` with `status: 'done'` would
 * reach the same place, but this endpoint exists and says what it means.
 */
export const markOrderDone = createAsyncThunk<
  Order,
  number,
  { rejectValue: string }
>('orders/done', async (id, { rejectWithValue }) => {
  try {
    return await api.post<Order, undefined>(`/orders/done/${id}`, undefined, {
      unwrap: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

/**
 * Bulk delete: the endpoint always takes an array, so removing a single row
 * means sending `[id]`.
 */
export const deleteOrders = createAsyncThunk<
  { ids: Array<number>; result: DeleteOrdersResult },
  Array<number>,
  { rejectValue: string }
>('orders/delete', async (ids, { rejectWithValue }) => {
  try {
    const result = await api.delete<DeleteOrdersResult, { ids: Array<number> }>(
      '/orders/delete',
      { ids },
      { unwrap: true },
    )

    return { ids, result }
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

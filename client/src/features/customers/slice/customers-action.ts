/**
 * `rejectWithValue` carries the message the API layer already extracted, so
 * reducers never have to narrow `unknown`. Reads pass `silent: true` because
 * the panel renders its own error; mutations stay loud so the interceptor
 * toasts a failed save.
 */

import { api, normalizeError, type Paginated } from '#/lib/api'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type {
  CreateCustomerPayload,
  Customer,
  CustomersQuery,
  DeleteCustomersResult,
  UpdateCustomerArgs,
} from './customers-types'
import type { RootState } from '#/app/store'

export const fetchCustomers = createAsyncThunk<
  Paginated<Customer>,
  Partial<CustomersQuery> | undefined,
  { state: RootState; rejectValue: string }
>('customers/fetchAll', async (args, { getState, rejectWithValue }) => {
  const { page, limit, search } = {
    ...getState().customers.filters,
    ...args,
  }

  try {
    // Left wrapped on purpose: `pagination` is a sibling of `data` on the
    // envelope, and the pager needs `total`/`totalPages` out of it.
    return await api.get<Paginated<Customer>>('/customers', {
      params: { page, limit, search: search || undefined },
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const fetchCustomer = createAsyncThunk<
  Customer,
  number,
  { rejectValue: string }
>('customers/fetchOne', async (id, { rejectWithValue }) => {
  try {
    // `unwrap: true` resolves with the envelope's `data`, not the envelope.
    return await api.get<Customer>(`/customers/show/${id}`, {
      unwrap: true,
      silent: true,
    })
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const createCustomer = createAsyncThunk<
  Customer,
  CreateCustomerPayload,
  { rejectValue: string }
>('customers/create', async (payload, { rejectWithValue }) => {
  try {
    return await api.post<Customer, CreateCustomerPayload>(
      '/customers/create',
      payload,
      { unwrap: true },
    )
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

export const updateCustomer = createAsyncThunk<
  Customer,
  UpdateCustomerArgs,
  { rejectValue: string }
>('customers/update', async ({ id, changes }, { rejectWithValue }) => {
  try {
    return await api.patch<Customer, UpdateCustomerArgs['changes']>(
      `/customers/update/${id}`,
      changes,
      { unwrap: true },
    )
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

/**
 * Bulk delete: the endpoint always takes an array, so removing a single row
 * means sending `[id]`. Rejects with 404 when none of the ids existed.
 */
export const deleteCustomers = createAsyncThunk<
  { ids: Array<number>; result: DeleteCustomersResult },
  Array<number>,
  { rejectValue: string }
>('customers/delete', async (ids, { rejectWithValue }) => {
  try {
    const result = await api.delete<
      DeleteCustomersResult,
      { ids: Array<number> }
    >('/customers/delete', { ids }, { unwrap: true })

    return { ids, result }
  } catch (error) {
    return rejectWithValue(normalizeError(error).message)
  }
})

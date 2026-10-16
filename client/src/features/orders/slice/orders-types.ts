/**
 * Shapes handled by the Nest `orders` controller
 * (`server/src/orders/orders.controller.ts`).
 *
 * | Request                                 |
 * | --------------------------------------- |
 * | `GET /orders?page&limit&search`         |
 * | `GET /orders/show/:id`                  |
 * | `POST /orders/create`                   |
 * | `PATCH /orders/update/:id`              |
 * | `DELETE /orders/delete` with `{ ids }`  |
 * | `POST /orders/done/:id`                 |
 */

export type OrderStatus = 'pending' | 'done'

/**
 * The customer every order read eager-loads. Narrower than the customers
 * feature's own `Customer`: the service loads `relations: { customer: true }`,
 * which does not reach that customer's `measurements`.
 */
export interface OrderCustomer {
  id: number
  name: string
  last_name?: string | null
  phone: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

/** The measurement the order was cut from, eager-loaded with every read. */
export interface OrderMeasurement {
  id: number
  name?: string | null
  length: number
  shoulder: number
  sleeve_length: number
  /** Nullable columns — never measured reads back as `null`, not `0`. */
  collar: number | null
  chest: number
  hem: number | null
  cuff: number
  pants_length: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  customer: OrderCustomer
  measurement: OrderMeasurement
  /** `date` columns, so a plain `YYYY-MM-DD` with no time or zone. */
  start_date: string
  end_date: string
  collar_type: string
  pants_type: string
  sleeve_type: string
  chest_pocket: boolean
  quantity: number
  /** MySQL hands back `decimal` as a string. */
  price: string
  status: OrderStatus
}

/**
 * Body of `POST /orders/create`.
 *
 * The two relations go out as ids. The service checks that the measurement
 * belongs to the customer and 400s when it does not, so a form must not let
 * the two be picked independently.
 */
export interface CreateOrderPayload {
  customer_id: number
  measurement_id: number
  /** `@IsDateString()` — `YYYY-MM-DD` is what the column stores. */
  start_date: string
  end_date: string
  collar_type: string
  pants_type: string
  sleeve_type: string
  chest_pocket: boolean
  quantity: number
  /** Sent as a number, and read back as a string: the column is a `decimal`. */
  price: number
  /** Defaults to `pending` on the server when left out. */
  status?: OrderStatus
}

/** Body of `PATCH /orders/update/:id` — `PartialType` of the create DTO. */
export type UpdateOrderPayload = Partial<CreateOrderPayload>

export interface UpdateOrderArgs {
  id: number
  changes: UpdateOrderPayload
}

/** `DELETE /orders/delete` reports how many rows it actually removed. */
export interface DeleteOrdersResult {
  message: string
  affected: number
}

/**
 * Query string of the list endpoint, mirrored in the slice as `filters`.
 *
 * There is no status filter: unlike `/customers`, the orders endpoint takes
 * only these three, so filtering by `pending`/`done` would need the server.
 */
export interface OrdersQuery {
  page: number
  limit: number
  /** Matched with `LIKE %…%` against the customer name and phone, and both dates. */
  search: string
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** Each request tracks its own status, so one failure cannot blank the rest. */
export interface Panel<T> {
  data: T
  status: RequestStatus
  error: string | null
}

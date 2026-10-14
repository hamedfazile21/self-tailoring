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

/**
 * Shapes handled by the Nest `customers` controller
 * (`server/src/customers/customers.controller.ts`).
 *
 * | Thunk              | Request                                      |
 * | ------------------ | -------------------------------------------- |
 * | `fetchCustomers`   | `GET /customers?page&limit&search`           |
 * | `fetchCustomer`    | `GET /customers/show/:id`                    |
 * | `createCustomer`   | `POST /customers/create`                     |
 * | `updateCustomer`   | `PATCH /customers/update/:id`                |
 * | `deleteCustomers`  | `DELETE /customers/delete` with `{ ids }`    |
 */

export type CustomerStatus = 'active' | 'inactive'

/** A row of the `measurements` relation every customer read eager-loads. */
export interface CustomerMeasurement {
  id: number
  name?: string | null
  length: number
  shoulder: number
  sleeve_length: number
  /** `nullable: true` on the column — never measured reads back as `null`. */
  collar: number | null
  chest: number
  /** Nullable too, same as `collar`. */
  hem: number | null
  cuff: number
  pants_length: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  last_name?: string | null
  phone: string
  status: CustomerStatus
  /**
   * Every read loads the relation, and `create`/`update` answer by re-reading,
   * so this arrives on all of them — newest first. The app treats
   * `measurements[0]` as the customer's current measurement.
   */
  measurements: Array<CustomerMeasurement> | null
  created_at: string
  updated_at: string
}

/**
 * The measurement that can ride along with a new customer. `customer_id` is
 * omitted — the server fills it in from the customer it just saved.
 */
export interface NewCustomerMeasurement {
  name?: string
  length: number
  shoulder: number
  sleeve_length: number
  /** Nullable on the entity, but the DTO still wants a number when sent. */
  collar?: number
  chest: number
  hem?: number
  cuff: number
  pants_length: number
}

/** Body of `POST /customers/create`. */
export interface CreateCustomerPayload {
  name: string
  last_name?: string
  phone: string
  /**
   * Optional in the DTO's type but validated with `@IsNotEmpty`, so the server
   * rejects a create that leaves it out.
   */
  status: CustomerStatus
  measurement?: NewCustomerMeasurement
}

/** Body of `PATCH /customers/update/:id` — `PartialType` of the create DTO. */
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>

export interface UpdateCustomerArgs {
  id: number
  changes: UpdateCustomerPayload
}

/** `DELETE /customers/delete` reports how many rows it actually removed. */
export interface DeleteCustomersResult {
  message: string
  affected: number
}

/** Query string of the list endpoint, mirrored in the slice as `filters`. */
export interface CustomersQuery {
  page: number
  limit: number
  /** Matched against `name` and `phone` with a `LIKE %…%`. */
  search: string
  /**
   * Statuses to keep. Empty means every status — the server reads them
   * comma-separated and 400s on a value outside the enum.
   */
  status: Array<CustomerStatus>
}

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

/** Each request tracks its own status, so one failure cannot blank the rest. */
export interface Panel<T> {
  data: T
  status: RequestStatus
  error: string | null
}

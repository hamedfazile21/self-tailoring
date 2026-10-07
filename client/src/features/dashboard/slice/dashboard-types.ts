/**
 * Shapes returned by the Nest `dashboard` controller
 * (`server/src/dashboard/dashboard.controller.ts`).
 */

/** `GET /dashboard/totals` */
export interface DashboardTotals {
  customers: number
  measurements: number
  orders: number
}

/** One bar/point of the monthly chart. Every month is present, zero-filled. */
export interface MonthlyOrdersPoint {
  month: number
  label: string
  orders: number
  total: number
}

/** `GET /dashboard/monthly-orders` */
export interface MonthlyOrders {
  year: number
  months: Array<MonthlyOrdersPoint>
  /** Order count across the whole year. */
  orders: number
  /** Summed price across the whole year. */
  total: number
}

export interface OrderCustomer {
  id: number
  name: string
  last_name?: string | null
  phone: string
  status: 'active' | 'inactive'
}

export interface OrderMeasurement {
  id: number
  name?: string | null
}

/** A row of `GET /dashboard/pending-orders`. */
export interface PendingOrder {
  id: number
  customer: OrderCustomer
  measurement: OrderMeasurement
  start_date: string
  end_date: string
  collar_type: string
  pants_type: string
  sleeve_type: string
  chest_pocket: boolean
  quantity: number
  /** MySQL hands back `decimal` as a string. */
  price: string
  status: 'pending' | 'done'
}

/** A row of `GET /dashboard/top-customers`. */
export interface TopCustomer {
  id: number
  name: string
  last_name?: string | null
  phone: string
  /** How many orders are behind `total`. */
  orders: number
  /** Summed order price. Already a number — the server casts it. */
  total: number
}

/** Each panel tracks its own request, so one failure cannot blank the others. */
export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

export interface Panel<T> {
  data: T
  status: RequestStatus
  error: string | null
}

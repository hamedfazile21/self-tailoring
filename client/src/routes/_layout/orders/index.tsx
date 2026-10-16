import { store } from '#/app/store'
import Orders from '#/features/orders'
import { OrderProvider } from '#/features/orders/components/order-provider'
import { fetchOrders } from '#/features/orders/slice/orders-action'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/orders/')({
  loader: () => store.dispatch(fetchOrders({ limit: 10, page: 1 })),
  component: () => (
    <OrderProvider>
      <Orders />
    </OrderProvider>
  ),
})

import { store } from '#/app/store'
import Customer from '#/features/customers'
import { CustomerProvider } from '#/features/customers/components/customers-provider'
import { fetchCustomers } from '#/features/customers/slice/customers-action'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/customers/')({
  loader: () =>
    Promise.all([store.dispatch(fetchCustomers({ limit: 10, page: 1 }))]),
  component: () => (
    <CustomerProvider>
      <Customer />
    </CustomerProvider>
  ),
})

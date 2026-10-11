import Customer from '#/features/customers'
import { CustomerProvider } from '#/features/customers/components/customer-provider'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/customers/')({
  component: () => (
    <CustomerProvider>
      <Customer />
    </CustomerProvider>
  ),
})

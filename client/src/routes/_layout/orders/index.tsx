import Orders from '#/features/orders'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/orders/')({
  component: Orders,
})

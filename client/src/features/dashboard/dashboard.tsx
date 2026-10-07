import { Ellipsis } from 'lucide-react'

import OrdersChart from './components/orders-chart'
import PendingOrders from './components/pending-order'
import TopCustomers from './components/top-customers'
import CardInfo from './components/card-info'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '#/hooks/redux'

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-black/8 bg-surface/90 px-3 py-2 text-xs shadow-lg shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-surface/90">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-x-1.5 text-muted">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: item.color || item.fill }}
          />
          {item.name}:{' '}
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

interface userData {
  id: number
  name: string
  email: string
  password: string
  created_at: string
  updated_at: string
}

interface responseType {
  status: number
  data: userData[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const Dashboard = () => {
  const { t } = useTranslation()

  const {
    pendingOrders: {
      pagination: { total },
    },
  } = useAppSelector((state) => state.dashboard)

  return (
    <div className="flex flex-col gap-y-5">
      {/* Stat cards */}
      <CardInfo />

      <div className="flex flex-col items-stretch gap-5 lg:flex-row">
        <OrdersChart />

        <div className="card w-full p-0 lg:w-1/3">
          <div className="flex w-full items-center gap-x-1 border-b border-borderColor pb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('Pending Orders')}{' '}
            </h3>
            <span className="text-xs rounded-full bg-primary w-5 h-5 flex items-center justify-center text-primary-foreground">
              {total > 100 ? '99+' : total}
            </span>
          </div>

          <PendingOrders />
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-5 lg:flex-row">
        <div className="card w-full p-0 lg:w-full">
          <div className="flex w-full items-center justify-between border-b border-borderColor pb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t('Top Customers')}
            </h3>
          </div>
          <TopCustomers />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

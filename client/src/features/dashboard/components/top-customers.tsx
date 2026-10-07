import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAppSelector } from '#/hooks/redux'
import { TOP_CUSTOMERS_LIMIT } from '../slice/dashboard-slice'
import { ChartTooltip } from '../dashboard'

/** Keeps the value axis readable once totals reach four figures. */
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const TopCustomers = () => {
  const { t } = useTranslation()
  const { data, status, error } = useAppSelector(
    (state) => state.dashboard.topCustomers,
  )

  if ((status === 'loading' || status === 'idle') && data.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col justify-center gap-y-3 p-4">
        {Array.from({ length: TOP_CUSTOMERS_LIMIT }, (_, index) => (
          <div
            key={index}
            className="h-6 animate-pulse rounded-md bg-surface-hover"
            // Staggered widths read as a ranked bar chart rather than a block.
            style={{ width: `${100 - index * 15}%` }}
          />
        ))}
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex h-72 w-full items-center justify-center p-4 text-center text-sm text-muted">
        {error ?? t('Could not load the top customers.')}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center p-4 text-center text-sm text-muted">
        {t('No orders yet.')}
      </div>
    )
  }

  // The server already sorts by total descending. Recharts draws a vertical
  // chart's first row at the bottom, so the list is reversed to put the top
  // customer on top.
  const rows = data
    .map((customer) => ({
      name: [customer.name, customer.last_name].filter(Boolean).join(' '),
      total: customer.total,
    }))
    .reverse()

  return (
    <div className="h-72 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => compact.format(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--foreground)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--surface-hover)' }}
          />
          <Bar
            dataKey="total"
            name={t('Total')}
            fill="var(--color-primary)"
            radius={[0, 6, 6, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TopCustomers

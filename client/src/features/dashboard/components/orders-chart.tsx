import { useTranslation } from 'react-i18next'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAppSelector } from '#/hooks/redux'
import { ChartTooltip } from '../dashboard'

/** Keeps the Y axis readable once monthly totals reach four figures. */
const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const OrdersChart = () => {
  const { t } = useTranslation()
  const { data, status, error } = useAppSelector(
    (state) => state.dashboard.monthlyOrders,
  )

  const months = data?.months ?? []
  const isEmpty = status === 'succeeded' && (data?.orders ?? 0) === 0

  return (
    <div className="card w-full p-0 lg:w-2/3">
      <div className="flex w-full items-center justify-between border-b border-borderColor pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('Orders')}
          </h3>
        </div>
        <div>
          <p className="mt-0.5 text-xs text-muted">
            {data
              ? t('Monthly total for {{year}}', { year: data.year })
              : t('Monthly total')}
          </p>
        </div>
      </div>

      <div className="h-72 w-full pt-2 px-0!">
        {(status === 'loading' || status === 'idle') && !data ? (
          <div className="size-full animate-pulse rounded-lg bg-surface-hover" />
        ) : status === 'failed' ? (
          <div className="flex size-full items-center justify-center px-4 text-center text-sm text-muted">
            {error ?? t('Could not load the chart.')}
          </div>
        ) : (
          <div className="relative size-full">
            {isEmpty && (
              <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-muted">
                {t('No orders in {{year}}', { year: data?.year })}
              </p>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={months}
                margin={{ top: 10, right: 0, left:0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--muted-foreground)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--muted-foreground)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                {/* Money and order counts live on different scales, so they get
                    an axis each — one shared axis would flatten the count to
                    nothing. */}
                <YAxis
                  yAxisId="total"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(value: number) => compact.format(value)}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name={t('Orders')}
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  fill="url(#expensesFill)"
                />
                <Area
                  yAxisId="total"
                  type="monotone"
                  dataKey="total"
                  name={t('Total')}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersChart

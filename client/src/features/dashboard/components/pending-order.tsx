import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import Pagination from '#/components/pagination'
import {
  PENDING_ORDERS_LIMIT,
  fetchPendingOrders,
} from '../slice/dashboard-slice'
import type { PendingOrder } from '../slice/dashboard-types'
import { Link } from '@tanstack/react-router'

const money = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * `end_date` arrives as a MySQL date (`2026-10-15`). `new Date(string)` would
 * read that as UTC midnight and slip a day west of Greenwich, so the parts are
 * fed to the constructor instead, giving a local date.
 */
function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const startOfToday = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Whole days until the due date — negative once it has passed. */
function daysUntil(endDate: string) {
  const diff = parseDate(endDate).getTime() - startOfToday().getTime()
  return Math.round(diff / 86_400_000)
}

function customerName(order: PendingOrder) {
  return [order.customer.name, order.customer.last_name]
    .filter(Boolean)
    .join(' ')
}

function customerPhone(order: PendingOrder) {
  return [order.customer.phone].filter(Boolean).join(' ')
}

const PendingOrders = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data, status, error, pagination } = useAppSelector(
    (state) => state.dashboard.pendingOrders,
  )

  const goToPage = (page: number) => {
    void dispatch(fetchPendingOrders({ page, limit: pagination.limit }))
  }

  if ((status === 'loading' || status === 'idle') && data.length === 0) {
    return (
      <div className="flex h-72 w-full flex-col gap-y-2 p-4">
        {Array.from({ length: PENDING_ORDERS_LIMIT }, (_, index) => (
          <div
            key={index}
            className="h-11 w-full animate-pulse rounded-lg bg-surface-hover"
          />
        ))}
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="flex h-72 w-full items-center justify-center p-4 text-center text-sm text-muted">
        {error ?? t('Could not load the pending orders.')}
      </div>
    )
  }

  if (data.length === 0) {
    // A page past the first can empty out while you are on it — an order gets
    // marked done and `total` shrinks. The pager is gone by then, so offer the
    // way back rather than stranding the card on an empty message.
    const strandedOnLaterPage = pagination.page > 1 && pagination.total > 0

    return (
      <div className="flex h-72 w-full flex-col items-center justify-center gap-y-3 p-4 text-center text-sm text-muted">
        {strandedOnLaterPage ? (
          <>
            {t('Nothing left on this page.')}
            <button
              type="button"
              onClick={() => goToPage(1)}
              className="btn btn-secondary-outline btn-sm"
            >
              {t('Back to first page')}
            </button>
          </>
        ) : (
          t('Nothing pending right now.')
        )}
      </div>
    )
  }

  return (
    <div className="flex h-72 w-full flex-col pt-1.5">
      {/* Paging keeps the previous rows mounted (the skeleton only covers the
          first load), so they dim while the next page is in flight. */}
      <ul
        aria-busy={status === 'loading'}
        className={`flex-1 divide-y divide-borderColor overflow-y-auto transition-opacity ${
          status === 'loading' ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {data.map((order) => {
          const days = daysUntil(order.end_date)
          const isOverdue = days < 0

          return (
            <li
              key={order.id}
              className="flex items-center justify-between gap-x-3 py-2.5 first:pt-0"
            >
              <div className="min-w-0">
                <Link
                  to={"/orders"}
                  className="truncate text-sm font-medium text-foreground hover:underline hover:text-info hover:cursor-pointer"
                >
                  {customerName(order)}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {customerPhone(order)} - {order.quantity} ×{' '}
                  {order.collar_type}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-foreground">
                  {money.format(Number(order.price))}
                </p>
                <p
                  className={`mt-0.5 text-xs ${
                    isOverdue
                      ? 'text-danger'
                      : days <= 3
                        ? 'text-warning'
                        : 'text-muted'
                  }`}
                >
                  {isOverdue
                    ? t('{{count}}d overdue', { count: Math.abs(days) })
                    : days === 0
                      ? t('Due today')
                      : t('{{count}}d left', { count: days })}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      {pagination.totalPages > 1 && (
        <div className="w-full shrink-0 border-t border-borderColor pt-3">
          {/* The card is only a third of the row wide, so the pager runs in its
              most compact form: no sibling pages, buttons joined into a strip. */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={goToPage}
            siblingCount={0}
            variant="outline"
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

export default PendingOrders

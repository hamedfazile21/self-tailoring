import { createColumnHelper } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import ActionColumn from './action-column'
import type { Order, OrderStatus } from '../slice/orders-types'
import TableSortPopover from '#/components/table-sort-popover'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

const columnHelper = createColumnHelper<Order>()

/** How an order is referred to outside the database: `ORD-12`. */
export const orderCode = (id: number) => `ORD-${id}`

/** `pending` is amber rather than red — it is work in hand, not a failure. */
const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  done: 'bg-success/10 text-success',
}

/**
 * Headers are their own component so the translation hook runs inside a
 * render, not inside the column's `header` callback.
 */
const HeaderLabel = ({ label }: { label: string }) => {
  const { t } = useTranslation()
  return <span>{t(label)}</span>
}

/** Stands in for a column the order has no value for. */
const Blank = () => <span className="text-muted">—</span>

export const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {t(status === 'done' ? 'Done' : 'Pending')}
    </span>
  )
}

/**
 * `YYYY-MM-DD` read as a local date. `new Date('2026-10-14')` is parsed as UTC
 * midnight, which formats as the day before anywhere west of Greenwich — and
 * these are `date` columns with no time or zone to begin with.
 */
const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

const DateCell = ({ value }: { value: string }) => {
  const { i18n } = useTranslation()
  const date = parseDateOnly(value)

  if (!date) return <Blank />

  return (
    <span className="text-system text-foreground">
      {new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
        date,
      )}
    </span>
  )
}

const PriceCell = ({ value }: { value: string }) => {
  const { i18n } = useTranslation()
  // The column is a `decimal`, so this arrives as a string.
  const amount = Number(value)

  return (
    <span className="text-system tabular-nums text-foreground" dir="ltr">
      {Number.isFinite(amount)
        ? new Intl.NumberFormat(i18n.language).format(amount)
        : value}
    </span>
  )
}

/** The sortable header the customer and date columns share. */
const SortableHeader = ({
  label,
  sorted,
  onSort,
}: {
  label: string
  sorted: false | 'asc' | 'desc'
  onSort: (sortBy: 'asc' | 'desc' | 'hidden') => void
}) => {
  const { t } = useTranslation()

  return (
    <TableSortPopover
      setSortBy={onSort}
      children={
        <div className="hover:bg-surface-hover flex w-fit cursor-pointer items-center gap-x-1 rounded-lg px-2 py-1.5">
          <span>{t(label)}</span>
          <span>
            {sorted === 'desc' && <ArrowUp className="text-muted" size={16} />}
            {sorted === 'asc' && <ArrowDown className="text-muted" size={16} />}
            {sorted === false && (
              <ChevronsUpDown className="text-muted" size={16} />
            )}
          </span>
        </div>
      }
    />
  )
}

export const columns = [
  columnHelper.accessor('id', {
    enableHiding: false,
    header: () => <HeaderLabel label="Order" />,
    cell: (info) => (
      // Latin either way, so it keeps its direction under an RTL layout.
      <span className="text-system font-medium text-muted" dir="ltr">
        {orderCode(info.getValue())}
      </span>
    ),
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor((row) => row.customer.name, {
    id: 'Customer',
    header: ({ column }) => (
      <SortableHeader
        label="Customer"
        sorted={column.getIsSorted()}
        onSort={(value) => {
          if (value === 'hidden') {
            if (column.getIsVisible()) column.toggleVisibility(false)
            return
          }
          column.toggleSorting(value === 'asc')
        }}
      />
    ),
    cell: (info) => (
      <div className="flex flex-col">
        <span className="text-system font-medium text-foreground">
          {info.getValue()}
        </span>
        <span className="text-xs text-muted" dir="ltr">
          {info.row.original.customer.phone}
        </span>
      </div>
    ),
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('start_date', {
    id: 'Start',
    header: ({ column }) => (
      <SortableHeader
        label="Start"
        sorted={column.getIsSorted()}
        onSort={(value) => {
          if (value === 'hidden') {
            if (column.getIsVisible()) column.toggleVisibility(false)
            return
          }
          column.toggleSorting(value === 'asc')
        }}
      />
    ),
    cell: (info) => <DateCell value={info.getValue()} />,
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('end_date', {
    id: 'Due',
    header: ({ column }) => (
      <SortableHeader
        label="Due"
        sorted={column.getIsSorted()}
        onSort={(value) => {
          if (value === 'hidden') {
            if (column.getIsVisible()) column.toggleVisibility(false)
            return
          }
          column.toggleSorting(value === 'asc')
        }}
      />
    ),
    cell: (info) => <DateCell value={info.getValue()} />,
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('quantity', {
    id: 'Qty',
    header: () => <HeaderLabel label="Qty" />,
    cell: (info) => (
      <span className="text-system tabular-nums text-foreground">
        {info.getValue()}
      </span>
    ),
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('price', {
    id: 'Price',
    header: () => <HeaderLabel label="Price" />,
    cell: (info) => <PriceCell value={info.getValue()} />,
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('status', {
    id: 'Status',
    header: () => <HeaderLabel label="Status" />,
    cell: (info) => <StatusBadge status={info.getValue()} />,
    footer: (info) => info.column.id,
  }),
]

export const actionsColumn = columnHelper.display({
  enableHiding: false,
  id: 'actions',
  size: 48,
  minSize: 48,
  maxSize: 48,
  header: () => <span className="sr-only">Actions</span>,
  cell: ({ row }) => <ActionColumn row={row} />,
})

/** Hand straight to `useReactTable({ columns: ordersColumns })`. */
export const ordersColumns = [...columns, actionsColumn]

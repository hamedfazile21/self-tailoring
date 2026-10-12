import { createColumnHelper } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import ActionColumn from './action-column'
import type { Customer, CustomerStatus } from '../slice/customers-types'
import TaskSortPopover from './table-sort-popover'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

const columnHelper = createColumnHelper<Customer>()

/** How a customer is referred to outside the database: `CUS-12`. */
export const customerCode = (id: number) => `CUS-${id}`

/** `inactive` stays grey on purpose — it is a state, not a failure. */
const statusStyles: Record<CustomerStatus, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-danger/10 text-danger',
}

/**
 * Headers are their own component so the translation hook runs inside a
 * render, not inside the column's `header` callback.
 */
const HeaderLabel = ({ label }: { label: string }) => {
  const { t } = useTranslation()
  return <span>{t(label)}</span>
}

/** Stands in for a column the customer has no value for. */
const Blank = () => <span className="text-muted">—</span>

export const StatusBadge = ({ status }: { status: CustomerStatus }) => {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {t(status === 'active' ? 'Active' : 'Inactive')}
    </span>
  )
}

export const columns = [
  columnHelper.accessor('id', {
    enableHiding: false,
    header: () => <HeaderLabel label="Customer" />,
    cell: (info) => (
      // Latin either way, so it keeps its direction under an RTL layout.
      <span className="text-system font-medium text-muted" dir="ltr">
        {customerCode(info.getValue())}
      </span>
    ),
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('name', {
    id: 'Name',
    header: ({ column }) => {
      const { t } = useTranslation()
      return (
        <div className="">
          <TaskSortPopover
            children={
              <div className="hover:bg-surface-hover cursor-pointer py-1.5 px-2 rounded-lg flex items-center gap-x-1 w-fit ">
                <span className="">{t('Name')}</span>
                <span>
                  {column.getIsSorted() === 'desc' && (
                    <ArrowUp className="text-muted" size={16} />
                  )}
                  {column.getIsSorted() === 'asc' && (
                    <ArrowDown className="text-muted" size={16} />
                  )}
                  {column.getIsSorted() === false && (
                    <ChevronsUpDown className="text-muted" size={16} />
                  )}
                </span>
              </div>
            }
            sortBy={column.getIsSorted() ?? 'hidden'}
            setSortBy={(value) => {
              if (value === 'hidden') {
                column.getIsVisible() && column.toggleVisibility(false)
              }

              column.toggleSorting(value === 'asc')
            }}
          />
        </div>
      )
    },
    cell: (info) => (
      <span className="text-system font-medium text-foreground">
        {info.getValue()}
      </span>
    ),
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('last_name', {
    id: 'Last Name',
    header: ({ column }) => {
      const { t } = useTranslation()
      return (
        <div className="">
          <TaskSortPopover
            children={
              <div className="hover:bg-surface-hover cursor-pointer py-1.5 px-2 rounded-lg flex items-center gap-x-1 w-fit ">
                <span className="">{t('Last Name')}</span>
                <span>
                  {column.getIsSorted() === 'desc' && (
                    <ArrowUp className="text-muted" size={16} />
                  )}
                  {column.getIsSorted() === 'asc' && (
                    <ArrowDown className="text-muted" size={16} />
                  )}
                  {column.getIsSorted() === false && (
                    <ChevronsUpDown className="text-muted" size={16} />
                  )}
                </span>
              </div>
            }
            sortBy={column.getIsSorted() ?? 'hidden'}
            setSortBy={(value) => {
              if (value === 'hidden') {
                column.getIsVisible() && column.toggleVisibility(false)
              }

              column.toggleSorting(value === 'asc')
            }}
          />
        </div>
      )
    },
    cell: (info) => {
      // Nullable on the server, so an empty string counts as "not given" too.
      const lastName = info.getValue()
      if (!lastName) return <Blank />

      return (
        <span className="text-system font-medium text-foreground">
          {lastName}
        </span>
      )
    },
    footer: (info) => info.column.id,
  }),

  columnHelper.accessor('phone', {
    id: 'Phone',
    header: () => <HeaderLabel label="Phone" />,
    cell: (info) => (
      <span className="text-system text-foreground" dir="ltr">
        {info.getValue()}
      </span>
    ),
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

/** Hand straight to `useReactTable({ columns: customersColumns })`. */
export const customersColumns = [...columns, actionsColumn]

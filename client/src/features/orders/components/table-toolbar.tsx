import Input from '#/components/input'
import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Order } from '../slice/orders-types'
import { SlidersHorizontal } from 'lucide-react'
import Popover from '#/components/popover'
import CheckBox from '#/components/checkbox'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { setSearch } from '../slice/orders-slice'
import { fetchOrders } from '../slice/orders-action'
import { selectOrdersSearch } from '../slice/orders-selectors'

interface props {
  table: Table<Order>
}

/** How long typing has to stop before the search is sent. */
const SEARCH_DEBOUNCE_MS = 400

/**
 * There is no status filter here on purpose: `GET /orders` takes only page,
 * limit and search, and filtering `pending`/`done` on the client would only
 * narrow the one page already loaded.
 */
const TableToolbar: FC<props> = ({ table }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  /**
   * The input is local state so it stays responsive; the store only hears
   * about it once typing pauses. Seeded from the store so a remount shows the
   * term that is in effect.
   */
  const appliedSearch = useAppSelector(selectOrdersSearch)
  const [term, setTerm] = useState(appliedSearch)

  useEffect(() => {
    // Already the term in effect: the mount, or the echo of our own dispatch.
    if (term === appliedSearch) return

    const timer = setTimeout(() => {
      dispatch(setSearch(term))
      // `setSearch` resets the page — searching from page 4 would otherwise ask
      // for a page the new, smaller result set may not have.
      void dispatch(fetchOrders())
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [term, appliedSearch, dispatch])

  return (
    <div className="flex items-center justify-between border-b border-borderColor p-4">
      <div className="flex items-center gap-x-5">
        <Input
          className="py-1.5!"
          placeholder={t('Search by customer or date')}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-label={t('Search orders')}
        />
      </div>

      <div>
        <Popover
          className="w-38 p-1!"
          trigger={
            <button className="btn btn-secondary border-dashed py-1.5!">
              <span>
                <SlidersHorizontal size={17} className="text-muted" />
              </span>
              <span className="font-medium">{t('View')}</span>
            </button>
          }
          placement="bottom-start"
          closeOn="outside"
        >
          <div className="flex flex-col gap-y-1">
            <div className="border-b border-borderColor px-3 py-2">
              <span className="text-system text-foreground">
                {t('Toggle columns')}
              </span>
            </div>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <button
                  key={column.id}
                  type="button"
                  onClick={() => column.toggleVisibility()}
                  className="text-system flex w-full items-center justify-between gap-x-2 rounded-md px-3 py-1.5 text-start text-foreground transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-x-1.5">
                    <CheckBox
                      size="sm"
                      checked={column.getIsVisible()}
                      onChange={() => column.toggleVisibility()}
                    />
                    {/* The column ids are already the labels. */}
                    <span>{t(column.id)}</span>
                  </div>
                </button>
              ))}
          </div>
        </Popover>
      </div>
    </div>
  )
}

export default TableToolbar

import Input from '#/components/input'
import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer, CustomerStatus } from '../slice/customers-types'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import Popover from '#/components/popover'
import CheckBox from '#/components/checkbox'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { setSearch, setStatus } from '../slice/customers-slice'
import { fetchCustomers } from '../slice/customers-action'
import {
  selectCustomersSearch,
  selectCustomersStatusFilter,
} from '../slice/customers-selectors'

interface props {
  table: Table<Customer>
}

/** `value` goes to the API, `label` is the translation key shown in the menu. */
const statusOptions: Array<{ value: CustomerStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const labelOf = (status: CustomerStatus) =>
  statusOptions.find((option) => option.value === status)?.label ?? status

/** How long typing has to stop before the search is sent. */
const SEARCH_DEBOUNCE_MS = 400

const TableToolbar: FC<props> = ({ table }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  // The filter lives in the store, not in the table: the server decides which
  // rows come back, so a TanStack column filter would only ever narrow the one
  // page already loaded.
  const selectedStatuses = useAppSelector(selectCustomersStatusFilter)

  const applyStatuses = (next: Array<CustomerStatus>) => {
    dispatch(setStatus(next))
    // `setStatus` has already reset the page, so the thunk picks up page 1.
    void dispatch(fetchCustomers())
  }

  /**
   * The input is local state so it stays responsive; the store only hears
   * about it once typing pauses. Seeded from the store so a remount — or a
   * `search` restored from the URL later — shows the term that is in effect.
   */
  const appliedSearch = useAppSelector(selectCustomersSearch)
  const [term, setTerm] = useState(appliedSearch)

  useEffect(() => {
    // Already the term in effect: the mount, or the echo of our own dispatch.
    if (term === appliedSearch) return

    const timer = setTimeout(() => {
      dispatch(setSearch(term))
      // `setSearch` resets the page — searching from page 4 would otherwise ask
      // for a page the new, smaller result set may not have.
      void dispatch(fetchCustomers())
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [term, appliedSearch, dispatch])

  return (
    <div className="flex items-center justify-between border-b border-borderColor p-4">
      <div className="flex items-center gap-x-5">
        <Input
          className="py-1.5!"
          placeholder={t('Search')}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-label={t('Search customers')}
        />

        <Popover
          className="w-48 p-1!"
          trigger={
            <button className="btn btn-secondary py-1.5! border-dashed">
              <span>
                <Sparkles size={17} className="text-muted" />
              </span>
              <span className="font-medium">{t('Status')}</span>
              {selectedStatuses.length > 0 && (
                <div className="border-l border-borderColor h-5" />
              )}
              {selectedStatuses.length >= 3 ? (
                <span className="text-xs bg-muted/20 rounded-lg px-2 py-0.5 w-20">
                  {selectedStatuses.length} {t('Selected')}
                </span>
              ) : (
                selectedStatuses.map((status) => {
                  return (
                    <span
                      key={status}
                      className="text-xs bg-muted/20 rounded-lg px-2 py-0.5 w-fit"
                    >
                      {t(labelOf(status))}
                    </span>
                  )
                })
              )}
            </button>
          }

          placement="bottom-start"
          closeOn="outside"
        >
          <div className="flex flex-col gap-y-1 ">
            {statusOptions.length > 0 ? (
              <>
                {statusOptions.map(({ value, label }) => {
                  const isSelected = selectedStatuses.includes(value)

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        applyStatuses(
                          isSelected
                            ? selectedStatuses.filter(
                                (status) => status !== value,
                              )
                            : [...selectedStatuses, value],
                        )
                      }
                      className="flex items-center gap-x-1.5 text-foreground hover:bg-surface-hover px-3 py-1.5 rounded-md w-full text-start text-system"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-x-1.5">
                          <CheckBox
                            size="sm"
                            checked={isSelected}
                            onChange={() => undefined}
                          />
                          <span>{t(label)}</span>
                        </div>
                        {/* No count here on purpose: the client only holds the
                            current page, so it cannot say how many customers
                            carry a status. That needs a facet from the API. */}
                      </div>
                    </button>
                  )
                })}
                {selectedStatuses.length > 0 && (
                  <div className="border-t border-borderColor p-1">
                    <button
                      type="button"
                      onClick={() => applyStatuses([])}
                      className="flex items-center gap-x-1.5 text-foreground hover:bg-surface-hover px-3 py-1.5 rounded-md w-full text-system"
                    >
                      {t('Clear Filters')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="p-2 text-system w-full text-center text-foreground">
                {t('No results found.')}
              </p>
            )}
          </div>
        </Popover>
      </div>

      <div>
        <Popover
          className="w-38 p-1!"
          trigger={
            <button className="btn btn-secondary py-1.5! border-dashed">
              <span>
                <SlidersHorizontal size={17} className="text-muted" />
              </span>
              <span className="font-medium">{t('View')}</span>
            </button>
          }

          placement="bottom-start"
          closeOn="outside"
        >
          <div className="flex flex-col gap-y-1 ">
            <div className="px-3 py-2 border-b border-borderColor">
              <span className="text-system text-foreground">
                {t('Toggle columns')}
              </span>
            </div>
            {table
              .getAllLeafColumns()
              .filter((column) => column.id !== 'select')
              .map((column) => {
                const headerLabels: Record<string, string> = {
                  id: t('Task'),
                  title: t('Title'),
                  priority: t('Priority'),
                  status: t('Status'),
                }

                if (!column.getCanHide()) return

                return (
                  <button
                    key={column.id}
                    type="button"
                    disabled={!column.getCanHide()}
                    onClick={() => column.toggleVisibility()}
                    className="flex items-center justify-between gap-x-2 text-foreground hover:bg-surface-hover px-3 py-1.5 rounded-md w-full text-start text-system disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <div className="flex items-center gap-x-1.5">
                      <CheckBox
                        size="sm"
                        checked={column.getIsVisible()}
                        onChange={() => column.toggleVisibility()}
                      />

                      <span>{headerLabels[column.id] ?? column.id}</span>
                    </div>
                  </button>
                )
              })}
          </div>
        </Popover>
      </div>
    </div>
  )
}

export default TableToolbar

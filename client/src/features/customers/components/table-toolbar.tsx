import Input from '#/components/input'
import type { Table } from '@tanstack/react-table'
import React, { type FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '../slice/customers-types'
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import Popover from '#/components/popover'
import CheckBox from '#/components/checkbox'

interface props {
  table: Table<Customer>
}

const statusOptions = ['Active', 'In Active'] as const

const TableToolbar: FC<props> = ({ table }) => {
  const { t } = useTranslation('')

  const selectedStatuses =
    (table.getColumn('status')?.getFilterValue() as string[] | undefined) ?? []

  const statusCounts = table
    .getPreFilteredRowModel()
    .rows.reduce<Record<string, number>>((counts, row) => {
      const status = String(row.getValue('status'))
      counts[status] = (counts[status] ?? 0) + 1
      return counts
    }, {})

  return (
    <div className="flex items-center justify-between border-b border-borderColor p-4">
      <div className='flex items-center gap-x-5'>
        <Input className="py-1.5!" placeholder={t('Search')} />

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
                selectedStatuses.map((item, index) => {
                  return (
                    <span
                      key={index}
                      className={`text-xs bg-muted/20 rounded-lg px-2 py-0.5 ${item === 'In Progress' ? 'w-24' : 'w-fit'}`}
                    >
                      {item}
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
                {statusOptions.map((status) => {
                  const isSelected = selectedStatuses.includes(status)

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        const nextStatuses = isSelected
                          ? selectedStatuses.filter((value) => value !== status)
                          : [...selectedStatuses, status]

                        table.getColumn('status')?.setFilterValue(nextStatuses)
                      }}
                      className="flex items-center gap-x-1.5 text-foreground hover:bg-surface-hover px-3 py-1.5 rounded-md w-full text-start text-system"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-x-1.5">
                          <CheckBox
                            size="sm"
                            checked={isSelected}
                            onChange={() => undefined}
                          />
                          {/* <span className="text-muted">
                            {statusIcon[status]}
                          </span> */}
                          <span>{status}</span>
                        </div>
                        <div>
                          <p className="text-xs">{statusCounts[status] ?? 0}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
                {selectedStatuses.length > 0 && (
                  <div className="border-t border-borderColor p-1">
                    <button
                      type="button"
                      onClick={() =>
                        table.getColumn('status')?.setFilterValue([])
                      }
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

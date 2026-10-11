import Input from '#/components/input'
import type { Table } from '@tanstack/react-table'
import React, { type FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '../slice/customers-types'
import { SlidersHorizontal } from 'lucide-react'
import Popover from '#/components/popover'
import CheckBox from '#/components/checkbox'

interface props {
  table: Table<Customer>
}

const TableToolbar: FC<props> = ({ table }) => {
  const { t } = useTranslation('')
  return (
    <div className="flex items-center justify-between border-b border-borderColor p-4">
      <div>
        <Input className="py-1!" placeholder={t('Search')} />
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

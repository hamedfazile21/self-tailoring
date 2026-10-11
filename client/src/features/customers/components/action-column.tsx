import Popover from '#/components/popover'
import { Ellipsis, SquarePen, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCustomer } from './customers-provider'
import type { FC } from 'react'
import type { Row } from '@tanstack/react-table'
import type { Customer } from '../slice/customers-types'

interface props {
  row: Row<Customer>
}

/**
 * The three-dots menu at the end of every row. It only opens a dialog and
 * parks the row on the provider — the dialog itself owns the request.
 */
const ActionColumn: FC<props> = ({ row }) => {
  const { t } = useTranslation()
  const { setOpen } = useCustomer()

  return (
    <div className="flex justify-end!">
      <Popover
        placement="bottom-end"
        closeOn="both"
        trigger={
          <button
            type="button"
            aria-label={`Actions for ${row.original.name}`}
            className="flex p-0.5 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Ellipsis size={18} />
          </button>
        }
      >
        <div className="flex min-w-36 flex-col gap-y-1">
          <button
            type="button"
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
            onClick={() => {
              //   setCurrentRow(row.original)
              //   setOpen('edit-customer')
            }}
          >
            <SquarePen size={15} />
            {t('Edit')}
          </button>
          <button
            type="button"
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
            onClick={() => {
              //   setCurrentRow(row.original)
              //   setOpen('delete-confirmation')
            }}
          >
            <Trash2 size={15} />
            {t('Delete')}
          </button>
        </div>
      </Popover>
    </div>
  )
}

export default ActionColumn

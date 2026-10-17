import Popover from '#/components/popover'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import {
  CheckCircle2,
  Download,
  Ellipsis,
  Eye,
  Printer,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useOrder } from './order-provider'
import { useOrderInvoice } from '../invoice/use-order-invoice'
import { markOrderDone } from '../slice/orders-action'
import { selectOrdersMutating } from '../slice/orders-selectors'
import type { FC } from 'react'
import type { Row } from '@tanstack/react-table'
import type { Order } from '../slice/orders-types'

interface props {
  row: Row<Order>
}

/**
 * The three-dots menu at the end of every row. It only opens a dialog and
 * parks the row on the provider — the dialog itself owns the request.
 *
 * "Mark as done" is the exception: `POST /orders/done/:id` is a single step
 * with nothing to fill in, so a confirmation would only be in the way.
 */
const ActionColumn: FC<props> = ({ row }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { setOpen, setCurrentRow } = useOrder()

  const isMutating = useAppSelector(selectOrdersMutating)
  const invoice = useOrderInvoice()
  const order = row.original

  const onMarkDone = async () => {
    const result = await dispatch(markOrderDone(order.id))
    // The API layer already toasted the failure.
    if (markOrderDone.rejected.match(result)) return

    toast.success(t('Order marked as done'))
  }

  return (
    <div className="flex justify-end!">
      <Popover
        placement="bottom-end"
        closeOn="both"
        trigger={
          <button
            type="button"
            aria-label={`Actions for order ${order.id}`}
            className="flex items-center justify-center rounded p-0.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Ellipsis size={18} />
          </button>
        }
      >
        <div className="flex min-w-40 flex-col gap-y-1">
          <button
            type="button"
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
            onClick={() => {
              setCurrentRow(order)
              setOpen('details-order')
            }}
          >
            <Eye size={16} />
            {t('View')}
          </button>

          <button
            type="button"
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover"
            onClick={() => {
              setCurrentRow(order)
              setOpen('edit-order')
            }}
          >
            <SquarePen size={16} />
            {t('Edit')}
          </button>

          {/* The list rows carry the customer and measurement too, so the
              invoice needs no extra request. */}
          <button
            type="button"
            disabled={invoice.pending !== null}
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void invoice.print(order)}
          >
            <Printer size={16} />
            {t('Print invoice')}
          </button>

          <button
            type="button"
            disabled={invoice.pending !== null}
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void invoice.download(order)}
          >
            <Download size={16} />
            {t('Download invoice')}
          </button>

          {/* An order that is already done has nowhere to go from here. */}
          {order.status === 'pending' && (
            <button
              type="button"
              disabled={isMutating}
              className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-success transition-colors hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void onMarkDone()}
            >
              <CheckCircle2 size={16} />
              {t('Mark as done')}
            </button>
          )}

          <button
            type="button"
            className="flex items-center gap-x-2 rounded-md px-2.5 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
            onClick={() => {
              setCurrentRow(order)
              setOpen('delete-order')
            }}
          >
            <Trash2 size={16} />
            {t('Delete')}
          </button>
        </div>
      </Popover>
    </div>
  )
}

export default ActionColumn

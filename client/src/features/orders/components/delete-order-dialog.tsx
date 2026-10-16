import Dialog from '#/components/dialog'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { AlertTriangle } from 'lucide-react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { deleteOrders, fetchOrders } from '../slice/orders-action'
import { selectOrdersMutating } from '../slice/orders-selectors'
import { resetMutation } from '../slice/orders-slice'
import type { Order } from '../slice/orders-types'
import { StatusBadge, orderCode } from './orders-column'
import type { OrderDialogType } from './order-provider'

interface props {
  open: boolean
  setOpen: (str: OrderDialogType | null) => void
  currentRow?: Order | null
}

const DeleteOrderDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t, i18n } = useTranslation('')
  const dispatch = useAppDispatch()

  // Shared by create / update / done / delete — one runs at a time.
  const isDeleting = useAppSelector(selectOrdersMutating)

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen('delete-order')
    dispatch(resetMutation())
  }

  // No row parked on the provider means nothing to confirm; the dialog would
  // be open over an empty question.
  if (!currentRow) return null

  /** `YYYY-MM-DD` read as a local date — see the note in `orders-column`. */
  const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return '—'

    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
    }).format(new Date(year, month - 1, day))
  }

  const onDelete = async () => {
    if (isDeleting) return

    // The endpoint is a bulk one, so a single row goes out as `[id]`.
    const result = await dispatch(deleteOrders([currentRow.id]))
    // The API layer already toasted the failure; staying open lets them retry.
    if (deleteOrders.rejected.match(result)) return

    toast.success(t('Order deleted'))
    onCloseDialog()

    // The reducer can only drop the row it knows about. Refetching is what
    // pulls the next order up from the following page, and what lands on a
    // real page when the last row of the last one just went.
    void dispatch(fetchOrders())
  }

  return (
    <Dialog
      open={open}
      // Escape still reaches this, so it is also the guard against walking out
      // on a request that is already in flight.
      onClose={() => {
        if (!isDeleting) onCloseDialog()
      }}
      position="center"
      size="lg"
      // Nothing here should close by accident, and least of all mid-request.
      closeOnOutsideClick={false}
      showCloseButton={false}
      footer={
        <div className="flex items-center gap-x-2 px-5">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCloseDialog}
            disabled={isDeleting}
          >
            {t('Cancel')}
          </button>
          <button
            type="submit"
            form="delete-order-form"
            className="btn btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? t('Deleting...') : t('Delete order')}
          </button>
        </div>
      }
    >
      <form
        id="delete-order-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void onDelete()
        }}
        className="flex flex-col gap-y-5 p-5"
      >
        <div className="flex items-start gap-x-3.5">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger"
          >
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t('Delete this order?')}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t('This cannot be undone.')}
            </p>
          </div>
        </div>

        {/*
          No cascade warning here, unlike deleting a customer: nothing
          references an order, so this takes the one row and no more. The
          customer and their measurement are left untouched.
        */}
        <div className="rounded-lg border border-danger/25 bg-danger/5 p-3.5">
          <div className="flex items-start justify-between gap-x-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {currentRow.customer.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted" dir="ltr">
                {currentRow.customer.phone}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-x-2">
              <StatusBadge status={currentRow.status} />
              {/* Latin either way, so it keeps its direction under RTL. */}
              <span className="text-xs font-medium text-muted" dir="ltr">
                {orderCode(currentRow.id)}
              </span>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1 border-t border-danger/20 pt-3">
            <div>
              <dt className="text-xs text-muted">{t('Start')}</dt>
              <dd className="text-xs text-foreground">
                {formatDate(currentRow.start_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('Due')}</dt>
              <dd className="text-xs text-foreground">
                {formatDate(currentRow.end_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t('Price')}</dt>
              <dd className="text-xs tabular-nums text-foreground" dir="ltr">
                {currentRow.price}
              </dd>
            </div>
          </dl>
        </div>
      </form>
    </Dialog>
  )
}

export default DeleteOrderDialog

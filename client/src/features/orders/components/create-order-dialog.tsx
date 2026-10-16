import Dialog from '#/components/dialog'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { resetMutation } from '../slice/orders-slice'
import { selectOrdersMutating } from '../slice/orders-selectors'
import type { Order } from '../slice/orders-types'
import OrderForm from './order-form'
import type { OrderDialogType } from './order-provider'

interface props {
  open: boolean
  setOpen: (str: OrderDialogType | null) => void
  currentRow?: Order | null
}

const CreateOrderDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  const order = currentRow ?? null
  const isEditMode = order !== null

  /** Both dialogs are mounted at once, so the ids have to stay distinct. */
  const formId = isEditMode ? 'edit-order-form' : 'create-order-form'

  // Shared by create / update / done / delete — one runs at a time.
  const isSaving = useAppSelector(selectOrdersMutating)

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen(isEditMode ? 'edit-order' : 'create-order')
    // Otherwise a failed save's error would still be in the store the next
    // time the dialog opens.
    dispatch(resetMutation())
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      title={isEditMode ? t('Update Order') : t('New Order')}
      description={
        isEditMode
          ? t('Change the details of this order.')
          : t('Pick a customer, one of their measurements, and the specs.')
      }
      position="top"
      size="3xl"
      closeOnOutsideClick={!isSaving}
      footer={
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCloseDialog}
            disabled={isSaving}
          >
            {t('Cancel')}
          </button>
          {/* Outside the <form>, so it submits by id. */}
          <button
            type="submit"
            form={formId}
            className="btn btn-primary"
            disabled={isSaving}
          >
            {isSaving
              ? t('Saving...')
              : isEditMode
                ? t('Save changes')
                : t('Create order')}
          </button>
        </div>
      }
    >
      {/*
        The dialog unmounts its panel when closed, so the form is seeded from
        `currentRow` on every open. The key covers the one case that leaves it
        mounted: picking a different row while the dialog is already open.
      */}
      <OrderForm
        key={order?.id ?? 'create'}
        order={order}
        formId={formId}
        onDone={onCloseDialog}
      />
    </Dialog>
  )
}

export default CreateOrderDialog

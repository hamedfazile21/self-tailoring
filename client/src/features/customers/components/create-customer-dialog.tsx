import Dialog from '#/components/dialog'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { resetMutation } from '../slice/customers-slice'
import { selectCustomersMutating } from '../slice/customers-selectors'
import type { Customer } from '../slice/customers-types'
import CustomerForm from './customer-form'
import type { CustomerDialogType } from './customers-provider'

interface props {
  open: boolean
  setOpen: (str: CustomerDialogType | null) => void
  currentRow?: Customer | null
}

const CreateCustomerDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  const customer = currentRow ?? null
  const isEditMode = customer !== null

  /** Both dialogs are mounted at once, so the ids have to stay distinct. */
  const formId = isEditMode ? 'edit-customer-form' : 'create-customer-form'

  // Shared by create / update / delete — only one of them runs at a time.
  const isSaving = useAppSelector(selectCustomersMutating)

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen(isEditMode ? 'edit-customer' : 'create-customer')
    // Otherwise a failed save's error would still be in the store the next
    // time the dialog opens.
    dispatch(resetMutation())
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      title={isEditMode ? t('Update Customer') : t('New Customer')}
      description={
        isEditMode
          ? t('Change the details of this customer.')
          : t('Add a customer, and their measurements if you have it.')
      }
      position="top"
      size="5xl"
      closeOnOutsideClick={!isSaving}
      footer={
        <>
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
                : t('Create customer')}
          </button>
        </>
      }
    >
      {/*
        The dialog unmounts its panel when closed, so the form is seeded from
        `currentRow` on every open. The key covers the one case that leaves it
        mounted: picking a different row while the dialog is already open.
      */}
      <CustomerForm
        key={customer?.id ?? 'create'}
        customer={customer}
        formId={formId}
        onDone={onCloseDialog}
      />
    </Dialog>
  )
}

export default CreateCustomerDialog

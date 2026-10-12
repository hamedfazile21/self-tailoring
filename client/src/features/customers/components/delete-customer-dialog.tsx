import Dialog from '#/components/dialog'
import Input from '#/components/input'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { AlertTriangle, Ruler, Receipt } from 'lucide-react'
import { useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { deleteCustomers, fetchCustomers } from '../slice/customers-action'
import { selectCustomersMutating } from '../slice/customers-selectors'
import { resetMutation } from '../slice/customers-slice'
import type { Customer } from '../slice/customers-types'
import { customerCode } from './customers-column'
import type { CustomerDialogType } from './customers-provider'

interface props {
  open: boolean
  setOpen: (str: CustomerDialogType | null) => void
  currentRow?: Customer | null
}

/** `JD` for Jane Doe, `J` when there is only the one name. */
const initialsOf = (customer: Customer) =>
  [customer.name, customer.last_name]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase()

const DeleteCustomerDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  // Shared by create / update / delete — only one runs at a time in the UI.
  const isDeleting = useAppSelector(selectCustomersMutating)

  /**
   * Typing the name is the brake. Everything below the fold of this dialog is
   * irreversible and reaches further than the row the person clicked, so the
   * delete button stays inert until they have read far enough to retype it.
   */
  const [confirmation, setConfirmation] = useState('')

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen('delete-customer')
    dispatch(resetMutation())
  }

  // No row parked on the provider means nothing to confirm; the dialog would
  // be open over an empty question.
  if (!currentRow) return null

  const measurementCount = currentRow.measurements?.length ?? 0
  const fullName = [currentRow.name, currentRow.last_name]
    .filter(Boolean)
    .join(' ')

  const matches =
    confirmation.trim().toLocaleLowerCase() ===
    currentRow.name.trim().toLocaleLowerCase()

  const onDelete = async () => {
    if (!matches || isDeleting) return

    // The endpoint is a bulk one, so a single row goes out as `[id]`.
    const result = await dispatch(deleteCustomers([currentRow.id]))
    // The API layer already toasted the failure; staying open lets them retry.
    if (deleteCustomers.rejected.match(result)) return

    toast.success(t('Customer deleted'))
    onCloseDialog()

    // The reducer can only drop the row it knows about. Refetching is what
    // pulls the next customer up from the following page, and what lands on a
    // real page when the last row of the last one just went.
    void dispatch(fetchCustomers())
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      position="center"
      size="md"
      // Nothing here should close by accident, and least of all mid-request.
      closeOnOutsideClick={false}
      showCloseButton={false}
      footer={
        <>
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
            form="delete-customer-form"
            className="btn btn-danger"
            disabled={!matches || isDeleting}
          >
            {isDeleting ? t('Deleting...') : t('Delete customer')}
          </button>
        </>
      }
    >
      <form
        id="delete-customer-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void onDelete()
        }}
        className="flex flex-col gap-y-5"
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
              {t('Delete this customer?')}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t('This cannot be undone.')}
            </p>
          </div>
        </div>

        {/* Who, exactly — a confirm that does not name the record is a confirm
            people learn to click through. */}
        <div className="glass-solid flex items-center gap-x-3 rounded-lg p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-semibold text-muted">
            {initialsOf(currentRow)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {fullName}
            </p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {currentRow.phone}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-muted" dir="ltr">
            {customerCode(currentRow.id)}
          </span>
        </div>

        {/* The part people do not expect: both relations cascade in the
            database, so this is not only the customer's own row. */}
        <div className="rounded-lg border border-danger/25 bg-danger/5 p-3.5">
          <p className="text-xs font-medium text-foreground">
            {t('Deleting them also removes')}
          </p>
          <ul className="mt-2.5 flex flex-col gap-y-2">
            <li className="flex items-center gap-x-2 text-xs text-muted">
              <Ruler size={14} className="shrink-0 text-danger/70" />
              <span>
                {measurementCount === 1
                  ? t('their 1 saved measurement')
                  : `${measurementCount} ${t('saved measurements')}`}
              </span>
            </li>
            <li className="flex items-center gap-x-2 text-xs text-muted">
              <Receipt size={14} className="shrink-0 text-danger/70" />
              <span>{t('every order placed for them')}</span>
            </li>
          </ul>
        </div>

        <Input
          label={t(`Type "${currentRow.name}" to confirm`)}
          placeholder={'Hamed'}
          id="delete-customer-confirmation"
          value={confirmation}
          autoComplete="off"
          disabled={isDeleting}
          onChange={(event) => setConfirmation(event.target.value)}
        />
      </form>
    </Dialog>
  )
}

export default DeleteCustomerDialog

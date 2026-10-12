import Dialog from '#/components/dialog'
import Input from '#/components/input'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { AlertTriangle } from 'lucide-react'
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

const DeleteCustomerDialog: FC<props> = ({ open, setOpen, currentRow }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  // Shared by create / update / delete — only one runs at a time in the UI.
  const isDeleting = useAppSelector(selectCustomersMutating)

  /**
   * Typing the name is the brake. This reaches further than the row that was
   * clicked, so the delete button stays inert until they have read far enough
   * to retype it.
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
    setConfirmation('')
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
        <div className="flex items-center gap-x-2">
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
        </div>
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

        {/*
          Who, and what goes with them, in one box rather than two: a confirm
          that does not name the record is a confirm people learn to click
          through, and the cascade is the part they do not expect.
        */}
        <div className="overflow-hidden rounded-lg border border-danger/25 bg-danger/5">
          <div className="flex items-start justify-between gap-x-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {fullName}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted" dir="ltr">
                {currentRow.phone}
              </p>
            </div>
            {/* Latin either way, so it keeps its direction under RTL. */}
            <span className="shrink-0 text-xs font-medium text-muted" dir="ltr">
              {customerCode(currentRow.id)}
            </span>
          </div>

          <div className="border-t border-danger/20 p-3.5">
            <p className="text-xs font-medium text-foreground">
              {t('Deleting them also removes')}
            </p>
            <ul className="mt-1.5 list-disc space-y-1 text-xs text-muted ltr:pl-4 rtl:pr-4">
              {/* Both relations cascade in the database. A count of zero is
                  not worth saying, so that line only appears when it is real. */}
              {measurementCount > 0 && (
                <li>
                  {measurementCount === 1
                    ? t('1 saved measurement')
                    : t('{{count}} saved measurements', {
                        count: measurementCount,
                      })}
                </li>
              )}
              <li>{t('Every order placed for them')}</li>
            </ul>
          </div>
        </div>

        <Input
          // Interpolated through i18next, not into the key: a key carrying the
          // customer's name could never match a locale entry.
          label={t('Type {{name}} to confirm', { name: currentRow.name })}
          placeholder={currentRow.name}
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

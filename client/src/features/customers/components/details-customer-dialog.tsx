import Dialog from '#/components/dialog'
import Tabs from '#/components/tab/tabs'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { Phone } from 'lucide-react'
import { useEffect } from 'react'
import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchCustomer } from '../slice/customers-action'
import { selectCurrentCustomer } from '../slice/customers-selectors'
import { clearCurrent } from '../slice/customers-slice'
import type { CustomerMeasurement } from '../slice/customers-types'
import { StatusBadge, customerCode } from './customers-column'
import type { CustomerDialogType } from './customers-provider'

interface props {
  open: boolean
  setOpen: (str: CustomerDialogType | null) => void
  /** Only the id: the panel reads the customer from `GET /customers/show/:id`. */
  currentRow?: number | null
}

type MeasurementKey = keyof Omit<
  CustomerMeasurement,
  'id' | 'name' | 'created_at' | 'updated_at'
>

/**
 * The numeric columns, in table order. `Label` and `Taken` lead the table but
 * are not measurements, so they are written out in the markup instead.
 */
const measurementColumns: Array<{ key: MeasurementKey; label: string }> = [
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'chest', label: 'Chest' },
  { key: 'collar', label: 'Collar' },
  { key: 'sleeve_length', label: 'Sleeve' },
  { key: 'cuff', label: 'Cuff' },
  { key: 'length', label: 'Length' },
  { key: 'pants_length', label: 'Pants' },
  { key: 'hem', label: 'Hem' },
]

/** `JD` for Jane Doe, `J` when there is only the one name. */
const initialsOf = (name: string, lastName?: string | null) =>
  [name, lastName]
    .map((part) => part?.trim().charAt(0) ?? '')
    .join('')
    .toUpperCase()

/** One label / one value, the shape every row on the overview repeats. */
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-x-4 py-3">
    <dt className="shrink-0 text-sm text-muted">{label}</dt>
    <dd className="min-w-0 text-end text-sm font-medium text-foreground">
      {children}
    </dd>
  </div>
)

const DetailsCustomerDialog: FC<props> = ({ currentRow, open, setOpen }) => {
  const { t, i18n } = useTranslation('')
  const dispatch = useAppDispatch()

  const customerId = currentRow ?? null
  const { data, status, error } = useAppSelector(selectCurrentCustomer)

  useEffect(() => {
    if (!open || customerId === null) return
    void dispatch(fetchCustomer(customerId))
  }, [open, customerId, dispatch])

  /**
   * `current` is a single slot shared by whoever asked last, so the previous
   * customer can still be sitting in it. Anything but the id being shown is
   * treated as nothing, which is what keeps one customer's measurements from
   * appearing under another's name.
   */
  const customer = data?.id === customerId ? data : null

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen('details-customer')
    // So a stale error does not greet the next open.
    dispatch(clearCurrent())
  }

  const onEdit = () => {
    // The row is still parked on the provider, and `setOpen` swaps straight
    // over when the value differs — so edit opens on this same customer.
    dispatch(clearCurrent())
    setOpen('edit-customer')
  }

  const formatDate = (value: string, withTime = false) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' } : {}),
    }).format(date)
  }

  /** Newest first from the server, so column one is the current measurement. */
  const measurements = customer?.measurements ?? []
  const measurementCount = measurements.length

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      title={t('Customer details')}
      position="center"
      size="xl"
      footer={
        // The panel's own padding: the shared footer only sets `py-4`.
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCloseDialog}
          >
            {t('Close')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEdit}
            disabled={customer === null}
          >
            {t('Edit')}
          </button>
        </div>
      }
    >
      <div className="pt-3 pb-2">
        {customer === null ? (
          status === 'failed' ? (
            <div className="flex flex-col items-center justify-center gap-y-3 py-12 text-center">
              <p className="text-sm text-muted">
                {error ?? t('Could not load the customer.')}
              </p>
              <button
                type="button"
                className="btn btn-secondary-outline btn-sm"
                onClick={() =>
                  customerId !== null &&
                  void dispatch(fetchCustomer(customerId))
                }
              >
                {t('Try again')}
              </button>
            </div>
          ) : (
            // Skeletons in the shape of the real panel, so it fills in rather
            // than jumping about once the request lands.
            <div className="flex flex-col gap-y-5" aria-busy="true">
              <div className="flex items-center gap-x-3">
                <div className="size-12 shrink-0 animate-pulse rounded-full bg-surface-hover" />
                <div className="flex flex-col gap-y-2">
                  <div className="h-4 w-36 animate-pulse rounded bg-surface-hover" />
                  <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
                </div>
              </div>
              <div className="h-8 w-56 animate-pulse rounded bg-surface-hover" />
              <div className="flex flex-col gap-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-4 w-full animate-pulse rounded bg-surface-hover"
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          // A refetch over a panel that already has content: dim it rather
          // than dropping back to skeletons.
          <div
            className={`transition-opacity ${
              status === 'loading' ? 'opacity-50' : 'opacity-100'
            }`}
          >
            <div className="flex items-center gap-x-3">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              >
                {initialsOf(customer.name, customer.last_name)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {[customer.name, customer.last_name]
                    .filter(Boolean)
                    .join(' ')}
                </h3>
                <div className="mt-1 flex items-center gap-x-2">
                  {/* Latin either way, so it keeps its direction under RTL. */}
                  <span className="text-xs font-medium text-muted" dir="ltr">
                    {customerCode(customer.id)}
                  </span>
                  <StatusBadge status={customer.status} />
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" variant="underline" className="mt-5">
              <Tabs.List>
                <Tabs.Trigger value="overview">{t('Overview')}</Tabs.Trigger>
                <Tabs.Trigger value="measurement">
                  <span className="flex items-center gap-x-1.5">
                    {t('Measurement')}
                    {measurementCount > 0 && (
                      <span className="rounded-full bg-surface-hover px-1.5 text-[11px] font-medium text-muted tabular-nums">
                        {measurementCount}
                      </span>
                    )}
                  </span>
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview">
                <dl className="divide-y divide-borderColor">
                  <Row label={t('Phone')}>
                    <a
                      href={`tel:${customer.phone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-x-1.5 text-primary hover:underline"
                    >
                      <Phone size={14} />
                      {customer.phone}
                    </a>
                  </Row>
                  <Row label={t('Measurements on file')}>
                    <span className="tabular-nums">{measurementCount}</span>
                  </Row>
                  <Row label={t('Added')}>
                    {formatDate(customer.created_at, true)}
                  </Row>
                  <Row label={t('Last updated')}>
                    {formatDate(customer.updated_at, true)}
                  </Row>
                </dl>
              </Tabs.Content>

              <Tabs.Content value="measurement">
                {measurements.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-borderColor px-4 py-10 text-center">
                    <p className="text-sm text-foreground">
                      {t('No measurement yet')}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t('Add one from the edit form.')}
                    </p>
                  </div>
                ) : (
                  // Ten columns do not fit a dialog, so the wrapper scrolls.
                  <div className="table-wrapper scrollbar-thin rounded-lg border border-borderColor">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-header-row">
                          <th scope="col" className="table-header-cell">
                            {t('Label')}
                          </th>
                          <th scope="col" className="table-header-cell">
                            {t('Taken')}
                          </th>
                          {measurementColumns.map(({ key, label }) => (
                            <th
                              key={key}
                              scope="col"
                              className="table-header-cell"
                            >
                              {t(label)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((row, index) => (
                          <tr key={row.id} className="table-body-row">
                            <td className="table-body-cell whitespace-nowrap">
                              <span className="flex items-center gap-x-1.5">
                                <span>{row.name || '—'}</span>
                                {/* Newest first from the server, and the row
                                    the edit form overwrites. */}
                                {index === 0 && (
                                  <span className="shrink-0 rounded-full bg-primary/15 px-1.5 text-[11px] font-medium text-primary">
                                    {t('Current')}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="table-body-cell whitespace-nowrap text-muted">
                              {formatDate(row.created_at)}
                            </td>
                            {measurementColumns.map(({ key }) => (
                              <td
                                key={key}
                                className="table-body-cell tabular-nums"
                              >
                                {/* `collar` and `hem` are nullable columns —
                                    never measured is a dash. */}
                                {row[key] ?? (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tabs.Content>
            </Tabs>
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default DetailsCustomerDialog

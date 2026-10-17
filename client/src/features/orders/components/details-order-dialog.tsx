import Dialog from '#/components/dialog'
import Tabs from '#/components/tab/tabs'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { Download, Phone, Printer } from 'lucide-react'
import { useEffect } from 'react'
import type { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchOrder } from '../slice/orders-action'
import { selectCurrentOrder } from '../slice/orders-selectors'
import { clearCurrent } from '../slice/orders-slice'
import type { OrderMeasurement } from '../slice/orders-types'
import { StatusBadge, orderCode } from './orders-column'
import type { OrderDialogType } from './order-provider'
import { useOrderInvoice } from '../invoice/use-order-invoice'

interface props {
  open: boolean
  setOpen: (str: OrderDialogType | null) => void
  /** Only the id: the panel reads the order from `GET /orders/show/:id`. */
  currentRow?: number | null
}

type MeasurementKey = keyof Omit<
  OrderMeasurement,
  'id' | 'name' | 'created_at' | 'updated_at'
>

/** The measurement table's numeric columns, left to right. */
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

/** One label / one value, the shape every row on the overview repeats. */
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center justify-between gap-x-4 py-3">
    <dt className="shrink-0 text-sm text-muted">{label}</dt>
    <dd className="min-w-0 text-end text-sm font-medium text-foreground">
      {children}
    </dd>
  </div>
)

const DetailsOrderDialog: FC<props> = ({ currentRow, open, setOpen }) => {
  const { t, i18n } = useTranslation('')
  const dispatch = useAppDispatch()

  const orderId = currentRow ?? null
  const { data, status, error } = useAppSelector(selectCurrentOrder)
  const invoice = useOrderInvoice()

  useEffect(() => {
    if (!open || orderId === null) return
    void dispatch(fetchOrder(orderId))
  }, [open, orderId, dispatch])

  /**
   * `current` is a single slot shared by whoever asked last, so the previous
   * order can still be sitting in it. Anything but the id being shown is
   * treated as nothing, which is what keeps one order's details from
   * appearing under another's number.
   */
  const order = data?.id === orderId ? data : null

  const onCloseDialog = () => {
    // `useDialogState`'s setter toggles, so passing this dialog's own type is
    // what closes it.
    setOpen('details-order')
    // So a stale error does not greet the next open.
    dispatch(clearCurrent())
  }

  const onEdit = () => {
    // The row is still parked on the provider, and `setOpen` swaps straight
    // over when the value differs — so edit opens on this same order.
    dispatch(clearCurrent())
    setOpen('edit-order')
  }

  /** `YYYY-MM-DD` read as a local date — see the note in `orders-column`. */
  const formatDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return '—'

    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
    }).format(new Date(year, month - 1, day))
  }

  const formatPrice = (value: string) => {
    const amount = Number(value)
    return Number.isFinite(amount)
      ? new Intl.NumberFormat(i18n.language).format(amount)
      : value
  }

  return (
    <Dialog
      open={open}
      onClose={onCloseDialog}
      title={t('Order details')}
      position="top"
      size="3xl"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary-outline"
            onClick={() => order && void invoice.print(order)}
            disabled={order === null || invoice.pending !== null}
          >
            <Printer size={16} />
            {t('Print')}
          </button>
          <button
            type="button"
            className="btn btn-secondary-outline"
            onClick={() => order && void invoice.download(order)}
            disabled={order === null || invoice.pending !== null}
          >
            <Download size={16} />
            {invoice.pending === 'download' ? t('Preparing…') : t('Download')}
          </button>
          <button
            type="button"
            className="btn btn-secondary ms-auto"
            onClick={onCloseDialog}
          >
            {t('Close')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onEdit}
            disabled={order === null}
          >
            {t('Edit')}
          </button>
        </div>
      }
    >
      <div className="pt-3 pb-2">
        {order === null ? (
          status === 'failed' ? (
            <div className="flex flex-col items-center justify-center gap-y-3 py-12 text-center">
              <p className="text-sm text-muted">
                {error ?? t('Could not load the order.')}
              </p>
              <button
                type="button"
                className="btn btn-secondary-outline btn-sm"
                onClick={() =>
                  orderId !== null && void dispatch(fetchOrder(orderId))
                }
              >
                {t('Try again')}
              </button>
            </div>
          ) : (
            // Skeletons in the shape of the real panel, so it fills in rather
            // than jumping about once the request lands.
            <div className="flex flex-col gap-y-5" aria-busy="true">
              <div className="flex flex-col gap-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-surface-hover" />
                <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
              </div>
              <div className="h-8 w-56 animate-pulse rounded bg-surface-hover" />
              <div className="flex flex-col gap-y-3">
                {Array.from({ length: 5 }, (_row, index) => (
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
            <div className="flex items-start justify-between gap-x-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {[order.customer.name, order.customer.last_name]
                    .filter(Boolean)
                    .join(' ')}
                </h3>
                {/* Latin either way, so it keeps its direction under RTL. */}
                <span className="text-xs font-medium text-muted" dir="ltr">
                  {orderCode(order.id)}
                </span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <Tabs defaultValue="overview" variant="underline" className="mt-5">
              <Tabs.List>
                <Tabs.Trigger value="overview">{t('Overview')}</Tabs.Trigger>
                <Tabs.Trigger value="measurement">
                  {t('Measurement')}
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview">
                <dl className="divide-y divide-borderColor">
                  <Row label={t('Phone')}>
                    <a
                      href={`tel:${order.customer.phone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-x-1.5 text-primary hover:underline"
                    >
                      <Phone size={14} />
                      {order.customer.phone}
                    </a>
                  </Row>
                  <Row label={t('Start')}>{formatDate(order.start_date)}</Row>
                  <Row label={t('Due')}>{formatDate(order.end_date)}</Row>
                  <Row label={t('Collar type')}>{order.collar_type}</Row>
                  <Row label={t('Pants type')}>{order.pants_type}</Row>
                  <Row label={t('Sleeve type')}>{order.sleeve_type}</Row>
                  <Row label={t('Chest pocket')}>
                    {order.chest_pocket ? t('Yes') : t('No')}
                  </Row>
                  <Row label={t('Quantity')}>
                    <span className="tabular-nums">{order.quantity}</span>
                  </Row>
                  <Row label={t('Price')}>
                    <span className="tabular-nums" dir="ltr">
                      {formatPrice(order.price)}
                    </span>
                  </Row>
                  <Row label={t('Total Price')}>
                    <span className="tabular-nums" dir="ltr">
                      {order.quantity * Number(order.price)}
                    </span>
                  </Row>
                </dl>
              </Tabs.Content>

              <Tabs.Content value="measurement">
                <p className="mb-2 text-sm font-medium text-foreground">
                  {order.measurement.name ?? `#${order.measurement.id}`}
                </p>
                {/* Eight columns do not fit a dialog, so the wrapper scrolls. */}
                <div className="table-wrapper scrollbar-thin rounded-lg border border-borderColor">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="table-header-row">
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
                      <tr className="table-body-row">
                        {measurementColumns.map(({ key }) => (
                          <td
                            key={key}
                            className="table-body-cell tabular-nums"
                          >
                            {/* `collar` and `hem` are nullable columns —
                                never measured is a dash. */}
                            {order.measurement[key] ?? (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {t('The measurement this order was cut from.')}
                </p>
              </Tabs.Content>
            </Tabs>
          </div>
        )}
      </div>
    </Dialog>
  )
}

export default DetailsOrderDialog

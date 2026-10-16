import CheckBox from '#/components/checkbox'
import DatePicker from '#/components/date-picker'
import Input from '#/components/input'
import InputSelect from '#/components/input-select'
import type { SelectOption } from '#/components/input-select'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  createOrder,
  fetchOrderCustomerOptions,
  fetchOrders,
  updateOrder,
} from '../slice/orders-action'
import {
  selectOrderCustomerOptions,
  selectOrderCustomerOptionsLoading,
  selectOrdersFilters,
} from '../slice/orders-selectors'
import type {
  CreateOrderPayload,
  Order,
  OrderCustomerOption,
  OrderStatus,
  UpdateOrderPayload,
} from '../slice/orders-types'

/**
 * Numbers and ids are held as strings: an empty number input reads back as
 * `''`, and `Number('')` is 0 — a real zero price is not the same as a blank
 * one. They are parsed once, on submit.
 */
interface OrderFormValues {
  customer_id: string
  measurement_id: string
  start_date: string
  end_date: string
  collar_type: string
  pants_type: string
  sleeve_type: string
  chest_pocket: boolean
  quantity: string
  price: string
  status: OrderStatus
}

const statusOptions: Array<SelectOption> = [
  { value: 'pending', label: 'Pending' },
  { value: 'done', label: 'Done' },
]

const validateRequired = (value: string, message: string) =>
  value.trim() ? undefined : message

/**
 * `YYYY-MM-DD` to a local `Date`, for the picker.
 *
 * Not `new Date(value)`: that reads the string as UTC midnight, which is the
 * day before anywhere west of Greenwich — and these are plain `date` columns
 * carrying no time or zone to begin with.
 */
const toDate = (value: string): Date | undefined => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Back again, for `@IsDateString()`.
 *
 * Built from the local parts rather than `toISOString()`, which converts to
 * UTC first: a local midnight in Kabul (UTC+4:30) would come back as the
 * previous day's date.
 */
const toDateString = (date: Date | undefined): string => {
  if (!date) return ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * The picker cannot offer a due date before the start, but it can be left
 * behind by a start date moved afterwards — so the pair is checked here too.
 *
 * Compared as strings on purpose: `YYYY-MM-DD` sorts chronologically.
 */
const validateEndDate = ({
  value,
  fieldApi,
}: {
  value: string
  fieldApi: { form: { getFieldValue: (field: 'start_date') => string } }
}) => {
  const trimmed = value.trim()
  if (!trimmed) return 'Due date is required'

  const start = fieldApi.form.getFieldValue('start_date')
  if (start && trimmed < start) return 'Cannot be before the start date'
  return undefined
}

const validateQuantity = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 'Quantity is required'

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed)) return 'Enter a whole number'
  if (parsed < 1) return 'Must be at least 1'
  return undefined
}

const validatePrice = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 'Price is required'

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return 'Enter a number'
  if (parsed < 0) return 'Cannot be negative'
  // `@IsNumber({ maxDecimalPlaces: 2 })` — the server rejects anything finer.
  if (Math.round(parsed * 100) !== parsed * 100) return 'At most 2 decimals'
  return undefined
}

/** The form's strings, in the shape the create endpoint wants. */
const buildPayload = (values: OrderFormValues): CreateOrderPayload => ({
  customer_id: Number(values.customer_id),
  measurement_id: Number(values.measurement_id),
  start_date: values.start_date,
  end_date: values.end_date,
  collar_type: values.collar_type.trim(),
  pants_type: values.pants_type.trim(),
  sleeve_type: values.sleeve_type.trim(),
  chest_pocket: values.chest_pocket,
  quantity: Number(values.quantity),
  price: Number(values.price),
  status: values.status,
})

/**
 * Only what actually moved. `PATCH /orders/update/:id` takes a partial, and
 * echoing back untouched fields would overwrite whatever another session
 * wrote to them in the meantime.
 */
const buildChanges = (
  values: OrderFormValues,
  order: Order,
): UpdateOrderPayload => {
  const next = buildPayload(values)
  const changes: UpdateOrderPayload = {}

  if (next.customer_id !== order.customer.id) {
    changes.customer_id = next.customer_id
  }
  if (next.measurement_id !== order.measurement.id) {
    changes.measurement_id = next.measurement_id
  }
  if (next.start_date !== order.start_date) changes.start_date = next.start_date
  if (next.end_date !== order.end_date) changes.end_date = next.end_date
  if (next.collar_type !== order.collar_type) {
    changes.collar_type = next.collar_type
  }
  if (next.pants_type !== order.pants_type) changes.pants_type = next.pants_type
  if (next.sleeve_type !== order.sleeve_type) {
    changes.sleeve_type = next.sleeve_type
  }
  if (next.chest_pocket !== order.chest_pocket) {
    changes.chest_pocket = next.chest_pocket
  }
  if (next.quantity !== order.quantity) changes.quantity = next.quantity
  // `price` comes back from a `decimal` column as a string, so the comparison
  // has to be numeric — "1200.00" and 1200 are the same price.
  if (next.price !== Number(order.price)) changes.price = next.price
  if (next.status !== order.status) changes.status = next.status

  return changes
}

const customerLabel = (customer: OrderCustomerOption) =>
  `${[customer.name, customer.last_name].filter(Boolean).join(' ')} · ${customer.phone}`

interface props {
  /** `null` is the create form; a row puts the same form in edit mode. */
  order: Order | null
  /** Lets the dialog's footer button submit a form it does not contain. */
  formId: string
  /** Called once the save landed, or when there was nothing to save. */
  onDone: () => void
}

const OrderForm: FC<props> = ({ order, formId, onDone }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()

  // The reducer only splices a new order onto page one; from any other page
  // the row would be saved but invisible, so that case refetches instead.
  const { page } = useAppSelector(selectOrdersFilters)
  const customers = useAppSelector(selectOrderCustomerOptions)
  const customersLoading = useAppSelector(selectOrderCustomerOptionsLoading)

  useEffect(() => {
    // Cheap to repeat and the list is small, but it has to be current: a
    // customer added a minute ago should be pickable without a reload.
    void dispatch(fetchOrderCustomerOptions())
  }, [dispatch])

  const defaultValues: OrderFormValues = {
    customer_id: order ? String(order.customer.id) : '',
    measurement_id: order ? String(order.measurement.id) : '',
    start_date: order?.start_date ?? '',
    end_date: order?.end_date ?? '',
    collar_type: order?.collar_type ?? '',
    pants_type: order?.pants_type ?? '',
    sleeve_type: order?.sleeve_type ?? '',
    chest_pocket: order?.chest_pocket ?? false,
    quantity: order ? String(order.quantity) : '1',
    price: order ? String(Number(order.price)) : '',
    status: order?.status ?? 'pending',
  }

  const { Field, Subscribe, handleSubmit, setFieldValue } = useForm({
    defaultValues,

    onSubmit: async ({ value }) => {
      if (order) {
        const changes = buildChanges(value, order)

        // Nothing moved: a PATCH here would only bump the row.
        if (Object.keys(changes).length === 0) {
          onDone()
          return
        }

        const result = await dispatch(updateOrder({ id: order.id, changes }))
        // The API layer already toasted the failure; the dialog stays open so
        // the typed-in values are not lost.
        if (updateOrder.rejected.match(result)) return

        toast.success(t('Order updated'))
        onDone()
        return
      }

      const result = await dispatch(createOrder(buildPayload(value)))
      if (createOrder.rejected.match(result)) return

      toast.success(t('Order created'))
      if (page !== 1) void dispatch(fetchOrders({ page: 1 }))
      onDone()
    },
  })

  const customerSelectOptions: Array<SelectOption> = customers.map(
    (customer) => ({
      value: String(customer.id),
      label: customerLabel(customer),
    }),
  )

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        handleSubmit()
      }}
      className="flex flex-col gap-y-5 pt-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          name="customer_id"
          validators={{
            onSubmit: ({ value }) => validateRequired(value, 'Pick a customer'),
          }}
          children={(field) => (
            <InputSelect
              id={field.name}
              label={t('Customer')}
              required
              isLoading={customersLoading}
              placeholder={t('Search a customer')}
              options={customerSelectOptions}
              value={
                customerSelectOptions.find(
                  (option) => option.value === field.state.value,
                ) ?? null
              }
              onBlur={field.handleBlur}
              onChange={(option) => {
                field.handleChange((option as SelectOption | null)?.value ?? '')
                // The server rejects a measurement belonging to anyone else,
                // so the old pick cannot survive a change of customer.
                setFieldValue('measurement_id', '')
              }}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        {/* Driven by the customer above: its options are that customer's own
            measurements, which is the only pairing the server accepts. */}
        <Subscribe
          selector={(state) => state.values.customer_id}
          children={(customerId) => {
            const measurements =
              customers.find((customer) => String(customer.id) === customerId)
                ?.measurements ?? []

            const measurementOptions: Array<SelectOption> = measurements.map(
              (measurement) => ({
                value: String(measurement.id),
                label: measurement.name ?? `#${measurement.id}`,
              }),
            )

            return (
              <Field
                name="measurement_id"
                validators={{
                  onSubmit: ({ value }) =>
                    validateRequired(value, 'Pick a measurement'),
                }}
                children={(field) => (
                  <InputSelect
                    id={field.name}
                    label={t('Measurement')}
                    required
                    isDisabled={!customerId}
                    placeholder={
                      !customerId
                        ? t('Pick a customer first')
                        : measurementOptions.length === 0
                          ? t('This customer has no measurements')
                          : t('Select')
                    }
                    options={measurementOptions}
                    value={
                      measurementOptions.find(
                        (option) => option.value === field.state.value,
                      ) ?? null
                    }
                    onBlur={field.handleBlur}
                    onChange={(option) =>
                      field.handleChange(
                        (option as SelectOption | null)?.value ?? '',
                      )
                    }
                    error={
                      field.state.meta.isTouched
                        ? field.state.meta.errors.join(', ')
                        : undefined
                    }
                  />
                )}
              />
            )
          }}
        />

        <Field
          name="start_date"
          validators={{
            onSubmit: ({ value }) =>
              validateRequired(value, 'Start date is required'),
          }}
          children={(field) => (
            <DatePicker
              label={t('Start date')}
              required
              placeholder={t('Select date')}
              id={field.name}
              value={toDate(field.state.value)}
              onChange={(date) => field.handleChange(toDateString(date))}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        {/* `fromDate` keeps the calendar from offering a due date that falls
            before the start — the server does not check the pair. */}
        <Subscribe
          selector={(state) => state.values.start_date}
          children={(startDate) => (
            <Field
              name="end_date"
              validators={{ onSubmit: validateEndDate }}
              children={(field) => (
                <DatePicker
                  label={t('Due date')}
                  required
                  placeholder={t('Select date')}
                  id={field.name}
                  value={toDate(field.state.value)}
                  fromDate={toDate(startDate)}
                  onChange={(date) => field.handleChange(toDateString(date))}
                  error={
                    field.state.meta.isTouched
                      ? field.state.meta.errors.join(', ')
                      : undefined
                  }
                />
              )}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          name="collar_type"
          validators={{
            onSubmit: ({ value }) =>
              validateRequired(value, 'Collar type is required'),
          }}
          children={(field) => (
            <Input
              label={t('Collar type')}
              required
              placeholder={t('e.g. classic')}
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        <Field
          name="pants_type"
          validators={{
            onSubmit: ({ value }) =>
              validateRequired(value, 'Pants type is required'),
          }}
          children={(field) => (
            <Input
              label={t('Pants type')}
              required
              placeholder={t('e.g. straight')}
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        <Field
          name="sleeve_type"
          validators={{
            onSubmit: ({ value }) =>
              validateRequired(value, 'Sleeve type is required'),
          }}
          children={(field) => (
            <Input
              label={t('Sleeve type')}
              required
              placeholder={t('e.g. long')}
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          name="quantity"
          validators={{ onSubmit: ({ value }) => validateQuantity(value) }}
          children={(field) => (
            <Input
              label={t('Quantity')}
              required
              type="number"
              inputMode="numeric"
              min={1}
              step="1"
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        <Field
          name="price"
          validators={{ onSubmit: ({ value }) => validatePrice(value) }}
          children={(field) => (
            <Input
              label={t('Price')}
              required
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              error={
                field.state.meta.isTouched
                  ? field.state.meta.errors.join(', ')
                  : undefined
              }
            />
          )}
        />

        <Field
          name="status"
          children={(field) => (
            <InputSelect
              id={field.name}
              label={t('Status')}
              required
              isSearchable={false}
              options={statusOptions.map(({ value, label }) => ({
                value,
                label: t(label),
              }))}
              value={
                statusOptions
                  .map(({ value, label }) => ({ value, label: t(label) }))
                  .find((option) => option.value === field.state.value) ?? null
              }
              onBlur={field.handleBlur}
              onChange={(option) =>
                field.handleChange(
                  ((option as SelectOption | null)?.value ??
                    'pending') as OrderStatus,
                )
              }
            />
          )}
        />
      </div>

      <Field
        name="chest_pocket"
        children={(field) => (
          <label className="flex w-fit cursor-pointer items-center gap-x-2">
            <CheckBox
              size="sm"
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.target.checked)}
            />
            <span className="text-sm font-medium text-foreground">
              {t('Chest pocket')}
            </span>
          </label>
        )}
      />
    </form>
  )
}

export default OrderForm

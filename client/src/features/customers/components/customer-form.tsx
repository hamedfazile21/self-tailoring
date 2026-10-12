import CheckBox from '#/components/checkbox'
import Input from '#/components/input'
import InputSelect from '#/components/input-select'
import type { SelectOption } from '#/components/input-select'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { useForm } from '@tanstack/react-form'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  createCustomer,
  fetchCustomers,
  updateCustomer,
} from '../slice/customers-action'
import { selectCustomersFilters } from '../slice/customers-selectors'
import type {
  Customer,
  CustomerMeasurement,
  CustomerStatus,
  NewCustomerMeasurement,
  UpdateCustomerPayload,
} from '../slice/customers-types'

/**
 * Measurements are held as strings, not numbers: an empty number input reads
 * back as `''`, and `Number('')` is 0 — which would store a real zero in a
 * column that means "never measured". They are parsed once, on submit.
 */
interface MeasurementFormValues {
  name: string
  length: string
  shoulder: string
  sleeve_length: string
  collar: string
  chest: string
  hem: string
  cuff: string
  pants_length: string
}

interface CustomerFormValues {
  name: string
  last_name: string
  phone: string
  status: CustomerStatus
  /**
   * Whether a measurement goes out with the save at all. Forced on when the
   * customer already has one — there is no "remove the measurement" on either
   * endpoint, so unchecking it could only mislead.
   */
  withMeasurement: boolean
  measurement: MeasurementFormValues
}

type MeasurementKey = Exclude<keyof MeasurementFormValues, 'name'>

/** `required` mirrors `@IsNotEmpty()` on `CreateMeasurementDto`. */
const measurementFields: Array<{
  key: MeasurementKey
  label: string
  required: boolean
}> = [
  { key: 'length', label: 'Length', required: true },
  { key: 'shoulder', label: 'Shoulder', required: true },
  { key: 'sleeve_length', label: 'Sleeve length', required: true },
  { key: 'chest', label: 'Chest', required: true },
  { key: 'cuff', label: 'Cuff', required: true },
  { key: 'pants_length', label: 'Pants length', required: true },
  { key: 'collar', label: 'Collar', required: false },
  { key: 'hem', label: 'Hem', required: false },
]

const statusOptions: Array<SelectOption> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const emptyMeasurement: MeasurementFormValues = {
  name: '',
  length: '',
  shoulder: '',
  sleeve_length: '',
  collar: '',
  chest: '',
  hem: '',
  cuff: '',
  pants_length: '',
}

const measurementKeys = Object.keys(emptyMeasurement) as Array<
  keyof MeasurementFormValues
>

/** A saved measurement, back in the shape the inputs hold. */
const measurementToForm = (
  measurement: CustomerMeasurement | null,
): MeasurementFormValues =>
  measurement === null
    ? emptyMeasurement
    : {
        name: measurement.name ?? '',
        length: String(measurement.length),
        shoulder: String(measurement.shoulder),
        sleeve_length: String(measurement.sleeve_length),
        // `collar` and `hem` are nullable columns; a null is an empty input,
        // not a zero.
        collar: measurement.collar === null ? '' : String(measurement.collar),
        chest: String(measurement.chest),
        hem: measurement.hem === null ? '' : String(measurement.hem),
        cuff: String(measurement.cuff),
        pants_length: String(measurement.pants_length),
      }

/** Compared as typed, so `12` and ` 12 ` are not a change. */
const sameMeasurement = (a: MeasurementFormValues, b: MeasurementFormValues) =>
  measurementKeys.every((key) => a[key].trim() === b[key].trim())

/** Column lengths from `CreateCustomerDto` — the server 400s past them. */
const NAME_MAX = 255
const PHONE_MAX = 15

const validateName = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 'Name is required'
  if (trimmed.length > NAME_MAX)
    return `Keep the name under ${NAME_MAX} characters`
  return undefined
}

const validateLastName = (value: string) =>
  value.trim().length > NAME_MAX
    ? `Keep the last name under ${NAME_MAX} characters`
    : undefined

const validatePhone = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return 'Phone is required'
  if (trimmed.length > PHONE_MAX)
    return `A phone number is at most ${PHONE_MAX} characters`
  if (!/^[\d+][\d\s()-]*$/.test(trimmed)) return 'Enter a valid phone number'
  return undefined
}

/**
 * Blank is only an error for the fields the DTO marks `@IsNotEmpty()`, and
 * nothing is an error at all while the measurement section is switched off —
 * those fields stay registered on the form after they unmount.
 */
const validateMeasurement =
  (required: boolean) =>
  ({
    value,
    fieldApi,
  }: {
    value: string
    fieldApi: { form: { getFieldValue: (field: 'withMeasurement') => boolean } }
  }) => {
    if (!fieldApi.form.getFieldValue('withMeasurement')) return undefined

    const trimmed = value.trim()
    if (!trimmed) return required ? 'Required' : undefined

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) return 'Enter a number'
    if (parsed <= 0) return 'Must be greater than 0'
    return undefined
  }

/** Optional keys are left out entirely rather than sent as 0 or `''`. */
const buildMeasurement = (
  values: CustomerFormValues,
): NewCustomerMeasurement | undefined => {
  if (!values.withMeasurement) return undefined

  const { measurement } = values
  const name = measurement.name.trim()

  return {
    ...(name ? { name } : {}),
    length: Number(measurement.length),
    shoulder: Number(measurement.shoulder),
    sleeve_length: Number(measurement.sleeve_length),
    chest: Number(measurement.chest),
    cuff: Number(measurement.cuff),
    pants_length: Number(measurement.pants_length),
    ...(measurement.collar.trim()
      ? { collar: Number(measurement.collar) }
      : {}),
    ...(measurement.hem.trim() ? { hem: Number(measurement.hem) } : {}),
  }
}

/**
 * Only what actually moved. `PATCH /customers/update/:id` takes a partial, and
 * echoing back untouched fields would overwrite whatever another session wrote
 * to them in the meantime — a measurement most of all, since sending one
 * overwrites the customer's current measurement wholesale.
 */
const buildChanges = (
  values: CustomerFormValues,
  customer: Customer,
  current: CustomerMeasurement | null,
): UpdateCustomerPayload => {
  const changes: UpdateCustomerPayload = {}

  const name = values.name.trim()
  if (name !== customer.name) changes.name = name

  // Clearing the field sends `''`, which the column accepts — that is how a
  // last name gets removed, so it is a change like any other.
  const lastName = values.last_name.trim()
  if (lastName !== (customer.last_name ?? '')) changes.last_name = lastName

  const phone = values.phone.trim()
  if (phone !== customer.phone) changes.phone = phone

  if (values.status !== customer.status) changes.status = values.status

  const measurement = buildMeasurement(values)
  if (
    measurement &&
    !sameMeasurement(values.measurement, measurementToForm(current))
  ) {
    changes.measurement = measurement
  }

  return changes
}

interface props {
  /** `null` is the create form; a row puts the same form in edit mode. */
  customer: Customer | null
  /** Lets the dialog's footer button submit a form it does not contain. */
  formId: string
  /** Called once the save landed, or when there was nothing to save. */
  onDone: () => void
}

const CustomerForm: FC<props> = ({ customer, formId, onDone }) => {
  const { t } = useTranslation('')
  const dispatch = useAppDispatch()
  const isEditMode = customer !== null

  // The reducer only splices a new customer onto page one; from any other page
  // the row would be saved but invisible, so that case refetches instead.
  const { page } = useAppSelector(selectCustomersFilters)

  /**
   * The relation comes back newest-first from the server, so this is the
   * customer's current measurement — the one `PATCH` writes to.
   */
  const current = customer?.measurements?.at(0) ?? null
  const hasMeasurement = current !== null

  /**
   * Read once, when the form mounts. The dialog remounts it on every open, so
   * these stay in step with the row that was picked.
   */
  const defaultValues: CustomerFormValues = {
    name: customer?.name ?? '',
    last_name: customer?.last_name ?? '',
    phone: customer?.phone ?? '',
    // `status` is `@IsNotEmpty()` on create, and the column defaults to
    // active, so a new customer starts there.
    status: customer?.status ?? 'active',
    withMeasurement: hasMeasurement,
    measurement: measurementToForm(current),
  }

  const { Field, Subscribe, handleSubmit } = useForm({
    defaultValues,

    onSubmit: async ({ value }) => {
      if (customer) {
        const changes = buildChanges(value, customer, current)

        // Nothing moved: a PATCH here would only bump `updated_at`.
        if (Object.keys(changes).length === 0) {
          onDone()
          return
        }

        const result = await dispatch(
          updateCustomer({ id: customer.id, changes }),
        )
        // The API layer already toasted the failure; the dialog stays open so
        // the typed-in values are not lost.
        if (updateCustomer.rejected.match(result)) return

        toast.success(
          changes.measurement && !hasMeasurement
            ? t('Customer updated, measurement added')
            : t('Customer updated'),
        )
        onDone()
        return
      }

      const lastName = value.last_name.trim()
      const measurement = buildMeasurement(value)

      const result = await dispatch(
        createCustomer({
          name: value.name.trim(),
          ...(lastName ? { last_name: lastName } : {}),
          phone: value.phone.trim(),
          status: value.status,
          ...(measurement ? { measurement } : {}),
        }),
      )
      if (createCustomer.rejected.match(result)) return

      toast.success(t('Customer created'))
      if (page !== 1) void dispatch(fetchCustomers({ page: 1 }))
      onDone()
    },
  })

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        handleSubmit()
      }}
      className="flex flex-col gap-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          name="name"
          validators={{ onSubmit: ({ value }) => validateName(value) }}
          children={(field) => (
            <Input
              label={t('Name')}
              required
              placeholder={t('Jane')}
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
          name="last_name"
          validators={{ onSubmit: ({ value }) => validateLastName(value) }}
          children={(field) => (
            <Input
              label={t('Last name')}
              placeholder={t('Doe')}
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
          name="phone"
          validators={{ onSubmit: ({ value }) => validatePhone(value) }}
          children={(field) => (
            <Input
              label={t('Phone')}
              required
              inputMode="tel"
              placeholder="09120000000"
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
                    'active') as CustomerStatus,
                )
              }
            />
          )}
        />
      </div>

      <section className="rounded-lg border border-borderColor p-4">
        {hasMeasurement ? (
          // Always on, so no checkbox: there is no endpoint that removes a
          // measurement, and `withMeasurement` is seeded true above.
          <h3 className="text-sm font-medium text-foreground">
            {t('Measurement')}
          </h3>
        ) : (
          <Field
            name="withMeasurement"
            children={(field) => (
              <label className="flex cursor-pointer items-center gap-x-2">
                <CheckBox
                  size="sm"
                  checked={field.state.value}
                  onChange={(event) => field.handleChange(event.target.checked)}
                />
                <span className="text-sm font-medium text-foreground">
                  {isEditMode
                    ? t('Add a measurement')
                    : t('Record a measurement now')}
                </span>
              </label>
            )}
          />
        )}

        <Subscribe
          selector={(state) => state.values.withMeasurement}
          children={(withMeasurement) =>
            withMeasurement ? (
              <div className="mt-4 flex flex-col gap-y-4">
                <Field
                  name="measurement.name"
                  children={(field) => (
                    <Input
                      label={t('Measurement label')}
                      placeholder={t('e.g. summer suit')}
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                    />
                  )}
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {measurementFields.map(({ key, label, required }) => (
                    <Field
                      key={key}
                      name={`measurement.${key}` as const}
                      validators={{ onSubmit: validateMeasurement(required) }}
                      children={(field) => (
                        <Input
                          label={t(label)}
                          required={required}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          error={
                            field.state.meta.isTouched
                              ? field.state.meta.errors.join(', ')
                              : undefined
                          }
                        />
                      )}
                    />
                  ))}
                </div>

                {hasMeasurement && (
                  <p className="text-xs text-muted">
                    {t(
                      'Saving replaces this measurement. Clearing an optional field leaves its last value in place.',
                    )}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted">
                {t('You can add one later, or now, from this form.')}
              </p>
            )
          }
        />
      </section>
    </form>
  )
}

export default CustomerForm

import Input from '#/components/input'
import InputSelect from '#/components/input-select'
import type { SelectOption } from '#/components/input-select'
import { useAppDispatch, useAppSelector } from '#/hooks/redux'
import { useForm } from '@tanstack/react-form'
import { Plus, Trash2 } from 'lucide-react'
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
  /**
   * The saved row's id, or `null` for a row added in this form. It is what
   * tells the update route an edit from an addition.
   */
  id: number | null
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
  /** One row per fitting. Empty is allowed — a customer need not be measured. */
  measurements: Array<MeasurementFormValues>
}

type MeasurementKey = Exclude<keyof MeasurementFormValues, 'id' | 'name'>

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

const emptyMeasurementRow: MeasurementFormValues = {
  id: null,
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

/** Everything but `id`, which is compared on its own. */
const comparedKeys: Array<Exclude<keyof MeasurementFormValues, 'id'>> = [
  'name',
  ...measurementFields.map(({ key }) => key),
]

/** A saved measurement, back in the shape the inputs hold. */
const measurementToForm = (
  measurement: CustomerMeasurement,
): MeasurementFormValues => ({
  id: measurement.id,
  name: measurement.name ?? '',
  length: String(measurement.length),
  shoulder: String(measurement.shoulder),
  sleeve_length: String(measurement.sleeve_length),
  // `collar` and `hem` are nullable columns; a null is an empty input, not a
  // zero.
  collar: measurement.collar === null ? '' : String(measurement.collar),
  chest: String(measurement.chest),
  hem: measurement.hem === null ? '' : String(measurement.hem),
  cuff: String(measurement.cuff),
  pants_length: String(measurement.pants_length),
})

/** Compared as typed, so `12` and ` 12 ` are not a change. */
const sameMeasurementRow = (
  a: MeasurementFormValues,
  b: MeasurementFormValues,
) =>
  a.id === b.id && comparedKeys.every((key) => a[key].trim() === b[key].trim())

/** Row count, row identity and every value — any of the three is a change. */
const sameMeasurements = (
  a: Array<MeasurementFormValues>,
  b: Array<MeasurementFormValues>,
) =>
  a.length === b.length &&
  a.every((row, index) => sameMeasurementRow(row, b[index]))

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
 * Blank is only an error for the fields the DTO marks `@IsNotEmpty()`. A row
 * that is not on the form is not validated at all, because removing it takes
 * its values with it.
 */
const validateMeasurementValue =
  (required: boolean) =>
  ({ value }: { value: string }) => {
    const trimmed = value.trim()
    if (!trimmed) return required ? 'Required' : undefined

    const parsed = Number(trimmed)
    // Terse on purpose: these render under a narrow grid cell.
    if (!Number.isFinite(parsed)) return 'Not a number'
    if (parsed <= 0) return 'Must be > 0'
    return undefined
  }

/** Optional keys are left out entirely rather than sent as 0 or `''`. */
const buildMeasurement = (
  row: MeasurementFormValues,
): NewCustomerMeasurement => {
  const name = row.name.trim()

  return {
    // A row added here has no id yet; the server reads that as an addition.
    ...(row.id === null ? {} : { id: row.id }),
    ...(name ? { name } : {}),
    length: Number(row.length),
    shoulder: Number(row.shoulder),
    sleeve_length: Number(row.sleeve_length),
    chest: Number(row.chest),
    cuff: Number(row.cuff),
    pants_length: Number(row.pants_length),
    ...(row.collar.trim() ? { collar: Number(row.collar) } : {}),
    ...(row.hem.trim() ? { hem: Number(row.hem) } : {}),
  }
}

/**
 * Only what actually moved. `PATCH /customers/update/:id` takes a partial, and
 * echoing back untouched fields would overwrite whatever another session wrote
 * to them in the meantime — the measurements most of all, since sending the
 * array makes it the customer's whole set.
 */
const buildChanges = (
  values: CustomerFormValues,
  customer: Customer,
  savedRows: Array<MeasurementFormValues>,
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

  if (!sameMeasurements(values.measurements, savedRows)) {
    changes.measurements = values.measurements.map(buildMeasurement)
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

  // The reducer only splices a new customer onto page one; from any other page
  // the row would be saved but invisible, so that case refetches instead.
  const { page } = useAppSelector(selectCustomersFilters)

  /** The saved set, in form shape — both the seed and the diff's baseline. */
  const savedRows = (customer?.measurements ?? []).map(measurementToForm)

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
    measurements: savedRows,
  }

  const { Field, handleSubmit } = useForm({
    defaultValues,

    onSubmit: async ({ value }) => {
      if (customer) {
        const changes = buildChanges(value, customer, savedRows)

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

        toast.success(t('Customer updated'))
        onDone()
        return
      }

      const lastName = value.last_name.trim()
      const measurements = value.measurements.map(buildMeasurement)

      const result = await dispatch(
        createCustomer({
          name: value.name.trim(),
          ...(lastName ? { last_name: lastName } : {}),
          phone: value.phone.trim(),
          status: value.status,
          ...(measurements.length > 0 ? { measurements } : {}),
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

      <Field
        name="measurements"
        mode="array"
        children={(rows) => (
          <section>
            <div className="mb-2">
              <h3 className="text-sm font-medium text-foreground">
                {t('Measurements')}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {t('One row per fitting. Add as many as you need.')}
              </p>
            </div>

            {/* Ten columns of inputs do not fit a dialog, so it scrolls. */}
            <div className="table-wrapper scrollbar-thin rounded-lg border border-borderColor">
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header-row">
                    <th scope="col" className="table-header-cell w-40">
                      {t('Measurement Label')}
                    </th>
                    {measurementFields.map(({ key, label, required }) => (
                      <th
                        key={key}
                        scope="col"
                        className="table-header-cell w-24"
                      >
                        {t(label)}
                        {/* The asterisk lives here, not on each input: the
                            column is the label in a grid like this. */}
                        {required && (
                          <span className="text-red-500 ltr:ml-0.5 rtl:mr-0.5">
                            *
                          </span>
                        )}
                      </th>
                    ))}
                    <th scope="col" className="table-header-cell w-10">
                      <span className="sr-only">{t('Remove')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.state.value.length === 0 ? (
                    <tr>
                      <td
                        colSpan={measurementFields.length + 2}
                        className="px-4 py-6 text-center text-xs text-muted"
                      >
                        {t('No measurements yet.')}
                      </td>
                    </tr>
                  ) : (
                    rows.state.value.map((_, index) => (
                      // Keyed by index on purpose: the field names below are
                      // index-based too, so a removal re-binds both together.
                      <tr key={index} className="table-body-row">
                        <td className="px-2 py-2 align-top">
                          <Field
                            name={`measurements[${index}].name`}
                            children={(field) => (
                              <Input
                                className="py-1.5!"
                                aria-label={`${t('Label')} ${index + 1}`}
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
                        </td>

                        {measurementFields.map(({ key, label, required }) => (
                          <td key={key} className="px-2 py-2 align-top">
                            <Field
                              name={`measurements[${index}].${key}`}
                              validators={{
                                onSubmit: validateMeasurementValue(required),
                              }}
                              children={(field) => (
                                <Input
                                  className="py-1.5! text-center tabular-nums"
                                  aria-label={`${t(label)} ${index + 1}`}
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
                          </td>
                        ))}

                        <td className="px-2 py-2 align-top">
                          <button
                            type="button"
                            aria-label={`${t('Remove row')} ${index + 1}`}
                            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            onClick={() => rows.removeValue(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-secondary-outline btn-sm mt-3"
              onClick={() => rows.pushValue(emptyMeasurementRow)}
            >
              <Plus size={15} />
              {t('Add row')}
            </button>
          </section>
        )}
      />
    </form>
  )
}

export default CustomerForm

import { useState } from 'react'
import CheckBox from '#/components/checkbox'
import Input from '#/components/input'
import { GlassBlob1, GlassBlob2 } from '../../../assets'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api, isApiError } from '#/lib/api'
import { signIn } from '#/lib/auth'

interface RegisterForm {
  fist_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
  agreement: boolean
}

/** What `POST /users/create` accepts — the DTO rejects anything else (400). */
interface CreateUserBody {
  name: string
  email: string
  password: string
  last_name: string
}

/**
 * `create` answers with the entity as it looked *before* the insert, so there
 * is no `id` or timestamp here — the ids come from the sign-in below.
 */
interface CreateUserResponse {
  status: number
  data: {
    name: string
    last_name: string
    email: string
  }
}

const RegisterBasic = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  /** Server-side complaints about the email (e.g. already taken). */
  const [emailTaken, setEmailTaken] = useState<string | null>(null)
  const { Field, Subscribe, handleSubmit } = useForm({
    defaultValues: {
      fist_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
      agreement: false,
    } as RegisterForm,
    onSubmit: async ({ value }) => {
      setEmailTaken(null)
      const email = value.email.trim()

      try {
        await api.post<CreateUserResponse, CreateUserBody>(
          '/users/create',
          {
            name: value.fist_name.trim(),
            last_name: value.last_name.trim(),
            email,
            password: value.password,
          },
          // Handled below: the server's duplicate-email code reads badly in a toast.
          { silent: true },
        )
      } catch (error) {
        if (!isApiError(error)) throw error

        // A taken email belongs next to the field, not in a toast.
        if (error.kind === 'conflict') {
          setEmailTaken(t('That email is already registered'))
        } else {
          toast.error(error.message)
        }
        return
      }

      // `create` hands back no token, so trade the same credentials for one
      // right away — the new account lands inside the app, not on /login.
      try {
        await signIn({ email, password: value.password }, { silent: true })
      } catch (error) {
        // The account exists; only the sign-in failed, so send them to /login
        // rather than leaving them staring at a form they already submitted.
        toast.error(
          isApiError(error)
            ? error.message
            : t('Account created, but signing in failed.'),
        )
        await navigate({ to: '/login', search: { redirect: undefined } })
        return
      }

      toast.success(t('Welcome! Your account is ready.'))
      await navigate({ to: '/' })
    },
  })
  return (
    <div className="flex items-center justify-center h-screen relative">
      <img
        src={GlassBlob1}
        className=" fixed top-14 right-0 left-0 rtl:lg:right-120 ltr:lg:left-120 -z-10 size-130"
      />

      <img
        src={GlassBlob2}
        className=" fixed bottom-10 right-0 left-0 rtl:lg:right-200 ltr:lg:left-200 -z-10 size-130"
      />
      <div className="card  p-10! w-132.5!  sm:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {t('Create your account')}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t('Start your free trial — no credit card required')}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit()
          }}
          className="flex flex-col gap-y-4"
        >
          <div className="flex gap-x-3">
            <Field
              name="fist_name"
              validators={{
                onSubmit: ({ value }) =>
                  !value.trim() ? 'First name is required' : undefined,
              }}
              children={(field) => (
                <Input
                  label={t('First name')}
                  placeholder="Hamed"
                  id={field.name}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                  type="text"
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
              validators={{
                onSubmit: ({ value }) =>
                  !value.trim() ? 'Last name is required' : undefined,
              }}
              children={(field) => (
                <Input
                  label={t('Last name')}
                  placeholder="Fazeli"
                  id={field.name}
                  onChange={(e) => field.handleChange(e.target.value)}
                  value={field.state.value}
                  type="text"
                  error={
                    field.state.meta.isTouched
                      ? field.state.meta.errors.join(', ')
                      : undefined
                  }
                />
              )}
            />
          </div>

          <Field
            name="email"
            validators={{
              onSubmit: ({ value }) =>
                !value
                  ? 'Email is required'
                  : !/^\S+@\S+\.\S+$/.test(value)
                    ? 'Enter a valid email'
                    : undefined,
            }}
            children={(field) => (
              <div className="flex flex-col gap-y-1.5">
                <Input
                  label={t('Email')}
                  placeholder="example@gmail.com"
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    setEmailTaken(null)
                    field.handleChange(e.target.value)
                  }}
                  error={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors.join(', ')
                      : (emailTaken ?? undefined)
                  }
                />
              </div>
            )}
          />

          <Field
            name="password"
            validators={{
              // Mirrors the DTO's `@MinLength(6)`, so a doomed request is
              // caught before it leaves the browser.
              onSubmit: ({ value }) =>
                !value
                  ? 'Password is required'
                  : value.length < 6
                    ? 'Password must be at least 6 characters'
                    : undefined,
            }}
            children={(field) => (
              <Input
                label={t('Password')}
                placeholder="••••••••"
                id={field.name}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                value={field.state.value}
                type="password"
                error={
                  field.state.meta.isTouched
                    ? field.state.meta.errors.join(', ')
                    : undefined
                }
              />
            )}
          />

          <Field
            name="confirm_password"
            validators={{
              onSubmit: ({ value, fieldApi }) =>
                !value
                  ? 'Password is required'
                  : value !== fieldApi.form.getFieldValue('password')
                    ? 'Passwords do not match'
                    : undefined,
            }}
            children={(field) => (
              <Input
                label={t('Confirm password')}
                placeholder="••••••••"
                id={field.name}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                value={field.state.value}
                type="password"
                error={
                  field.state.meta.isTouched
                    ? field.state.meta.errors.join(', ')
                    : undefined
                }
              />
            )}
          />

          <Subscribe
            selector={(state) => state.isSubmitting}
            children={(isSubmitting) => (
              <button
                type="submit"
                className="btn btn-primary mt-2 w-full!"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('Creating account...') : t('Create account')}
              </button>
            )}
          />
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t('Already have an account?')}{' '}
          <Link
            search={{ redirect: '' }}
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            {t('Sign in')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterBasic

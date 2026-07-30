import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Building2, Lock, Mail } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { cn } from '@/lib/utils'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './AuthContext'
import { passwordStrength, signupSchema, type SignupValues } from './schemas'

const STRENGTH_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-accent-500',
  'bg-accent-400',
] as const

function PasswordMeter({ value }: { value: string }) {
  const { score, label } = passwordStrength(value)
  if (!value) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((index) => (
            <motion.span
              key={index}
              initial={false}
              animate={{ opacity: index < score ? 1 : 0.18 }}
              transition={{ duration: 0.25 }}
              className={cn('h-1 flex-1 rounded-full', STRENGTH_COLORS[score] ?? 'bg-slate-500')}
            />
          ))}
        </div>
        <span className="w-20 text-right text-[0.6875rem] font-semibold text-fg-muted">{label}</span>
      </div>
    </motion.div>
  )
}

export function SignupPage() {
  const { isAuthenticated, signup } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false as unknown as true,
    },
  })

  const passwordValue = useWatch({ control, name: 'password' }) ?? ''

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (values: SignupValues) => {
    setFormError(null)
    try {
      await signup(values.name, values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create the account')
    }
  }

  return (
    <AuthLayout
      title="Create your merchant account"
      subtitle="Start accepting simulated payments in under a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          {...register('name')}
          label="Business name"
          autoComplete="organization"
          placeholder="Northwind Traders"
          leftIcon={<Building2 />}
          error={errors.name?.message}
        />

        <Input
          {...register('email')}
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          leftIcon={<Mail />}
          error={errors.email?.message}
        />

        <div>
          <Input
            {...register('password')}
            label="Password"
            password
            autoComplete="new-password"
            placeholder="At least 10 characters"
            leftIcon={<Lock />}
            error={errors.password?.message}
          />
          <PasswordMeter value={passwordValue} />
        </div>

        <Input
          {...register('confirmPassword')}
          label="Confirm password"
          password
          autoComplete="new-password"
          placeholder="Re-enter your password"
          leftIcon={<Lock />}
          error={errors.confirmPassword?.message}
        />

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-fg-muted">
          <input
            {...register('acceptedTerms')}
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-brand-500"
          />
          <span>
            I understand this is a sandbox product that does not process real payments, and I accept
            the terms of use.
          </span>
        </label>
        {errors.acceptedTerms?.message && (
          <p role="alert" className="-mt-2 text-xs font-medium text-rose-500">
            {errors.acceptedTerms.message}
          </p>
        )}

        <AnimatePresence>
          {formError && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-3 text-sm text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {formError}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          rightIcon={!isSubmitting && <ArrowRight className="h-4 w-4" />}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  )
}

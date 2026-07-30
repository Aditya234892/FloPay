import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './AuthContext'
import { loginSchema, type LoginValues } from './schemas'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in')
    }
  }

  return (
    <AuthLayout
      title="Sign in to FloPay"
      subtitle="Access your merchant dashboard, keys and settlements."
      footer={
        <>
          New to FloPay?{' '}
          <Link to="/signup" className="font-semibold text-brand-500 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          {...register('email')}
          label="Email"
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
            autoComplete="current-password"
            placeholder="••••••••••"
            leftIcon={<Lock />}
            error={errors.password?.message}
          />
          <div className="mt-2 text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-fg-subtle transition-colors hover:text-brand-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}

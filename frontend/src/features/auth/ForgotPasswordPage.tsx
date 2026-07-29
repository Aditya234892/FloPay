import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Mail } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas'

/**
 * Password recovery UI.
 *
 * The backend has no reset endpoint and no mail transport wired up yet, so this
 * intentionally does NOT show a "check your inbox" confirmation — claiming an
 * email was sent when none was would be a lie in the interface. The form is real
 * and validated; the notice states exactly where the flow stops.
 */
export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send a signed, single-use reset link once email delivery is connected."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-500 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(() => undefined)} noValidate className="space-y-4">
        <Input
          {...register('email')}
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@business.com"
          leftIcon={<Mail />}
          error={errors.email?.message}
        />

        <div className="flex items-start gap-2.5 rounded-xl bg-brand-500/8 px-3.5 py-3 text-xs text-fg-muted ring-1 ring-brand-500/20 ring-inset">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden />
          <span>
            <strong className="text-fg">Not yet available.</strong> Password reset needs a server
            endpoint and an email provider, neither of which is wired up. Nothing is sent when you
            submit this form. Create a new sandbox account instead.
          </span>
        </div>

        <Button type="submit" size="lg" fullWidth disabled>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  )
}

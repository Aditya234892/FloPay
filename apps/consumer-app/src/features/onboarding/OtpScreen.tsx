import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, FlaskConical } from 'lucide-react'
import { OtpInput } from '@/components/OtpInput'
import { useAuth } from '@/auth/AuthContext'

interface LocationState {
  phone: string
  sandboxOtp: string
}

export function OtpScreen() {
  const { verifyOtp, requestOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [otp, setOtp] = useState('')
  const [sandboxOtp, setSandboxOtp] = useState(state?.sandboxOtp ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)

  if (!state?.phone) {
    return <Navigate to="/" replace />
  }
  const phone = state.phone

  const handleComplete = async (code: string) => {
    setError(null)
    setBusy(true)
    try {
      const session = await verifyOtp(phone, code)
      navigate(session.profileComplete ? '/home' : '/choose-vpa', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setOtp('')
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError(null)
    try {
      const issued = await requestOtp(phone)
      setSandboxOtp(issued.sandboxOtp)
      setOtp('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="phone-shell px-6 pt-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6"
      >
        <h1 className="text-xl font-bold tracking-tight">Enter the code</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Sent to +91 {phone}</p>

        {sandboxOtp && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-4 py-3.5 ring-1 ring-amber-500/25 ring-inset">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="text-xs text-fg-muted">
              <p className="font-semibold text-fg">Sandbox mode — no SMS was sent</p>
              <p className="mt-0.5">
                Your code is{' '}
                <span className="font-mono text-sm font-bold tracking-widest text-fg">{sandboxOtp}</span>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <OtpInput value={otp} onChange={setOtp} onComplete={handleComplete} error={!!error} autoFocus />
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {busy && <p className="mt-4 text-sm text-fg-muted">Verifying…</p>}

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="tap-target mt-6 text-sm font-semibold text-brand-500 disabled:opacity-50"
        >
          {resending ? 'Sending a new code…' : 'Resend code'}
        </button>
      </motion.div>
    </div>
  )
}

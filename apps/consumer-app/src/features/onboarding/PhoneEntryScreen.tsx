import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertCircle, Fingerprint } from 'lucide-react'
import { Button } from '@/components/Button'
import { useAuth } from '@/auth/AuthContext'
import { FloMark } from '@/components/FloMark'
import { isPasskeySupported } from '@/lib/webauthn'

export function PhoneEntryScreen() {
  const { requestOtp, loginWithPasskey } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [passkeyBusy, setPasskeyBusy] = useState(false)

  const digitsOnly = phone.replace(/\D/g, '')
  const isValid = digitsOnly.length === 10

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    setError(null)
    setBusy(true)
    try {
      const issued = await requestOtp(digitsOnly)
      navigate('/otp', { state: { phone: digitsOnly, sandboxOtp: issued.sandboxOtp } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handlePasskeyLogin = async () => {
    if (!isValid) return
    setError(null)
    setPasskeyBusy(true)
    try {
      await loginWithPasskey(digitsOnly)
      navigate('/home', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPasskeyBusy(false)
    }
  }

  return (
    <div className="phone-shell justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <FloMark className="h-14 w-14" />
        <h1 className="mt-5 text-2xl font-bold tracking-tight">FloPay</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Send money. Pay by VPA. Check your balance.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="mt-10 w-full">
        <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold text-fg-muted">
          Mobile number
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15">
          <span className="text-base font-medium text-fg-muted">+91</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={10}
            className="h-14 flex-1 bg-transparent text-lg font-medium text-fg outline-none placeholder:text-fg-subtle"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <Button type="submit" className="mt-6" disabled={!isValid} loading={busy}>
          Continue
        </Button>

        {isPasskeySupported() && (
          <Button
            type="button"
            variant="ghost"
            className="mt-2"
            disabled={!isValid || busy}
            loading={passkeyBusy}
            onClick={() => void handlePasskeyLogin()}
          >
            {!passkeyBusy && <Fingerprint className="h-4 w-4" />}
            Log in with passkey instead
          </Button>
        )}

        <p className="mt-4 text-center text-xs text-fg-subtle">
          Sandbox app — no real SMS is sent, no real money moves.
        </p>
      </form>
    </div>
  )
}
